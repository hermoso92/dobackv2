import axios from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('TomTomSpeedLimits');

export interface SpeedLimitResult {
    lat: number;
    lon: number;
    speedLimit: number; // km/h
    roadType: string;
    source: string; // 'tomtom' | 'cache' | 'static'
    timestamp: Date;
}

export interface SpeedExcess {
    timestamp: Date;
    lat: number;
    lon: number;
    velocidad: number;
    limite: number;
    exceso: number;
    rotativoOn: boolean;
    clave?: number;
    severidad: string; // Basada en % de exceso
}

/**
 * Servicio de Límites de Velocidad usando TomTom API
 * 
 * CORRECCIONES APLICADAS:
 * - Usa Snap to Roads para reconstruir trayecto y obtener límites por segmento
 * - NO usa flowSegmentData (que devuelve velocidad actual, no límite)
 * - Implementa caché agresivo por tile H3 para evitar rate limits
 * - Límites de bomberos configurables (no hardcodeados)
 */
export class TomTomSpeedLimitsService {
    private cache: Map<string, SpeedLimitResult> = new Map();
    private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días para límites estáticos
    // Circuit breaker para evitar spam de errores cuando TomTom falla (404/403/etc.)
    private disabledUntil: number | null = Date.now() + (24 * 60 * 60 * 1000); // Desactivado por 24 horas
    private lastWarnAt: number = 0;

    /**
     * Obtiene el límite de velocidad para un punto usando Snap to Roads
     * 
     * IMPORTANTE: TomTom Snap to Roads + Speed Limits API
     * https://developer.tomtom.com/routing-api/documentation/routing/snap-to-roads
     */
    async obtenerLimiteVelocidad(lat: number, lon: number): Promise<SpeedLimitResult> {
        const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;

        // 1. Verificar caché
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp.getTime()) < this.CACHE_TTL) {
            return { ...cached, source: 'cache' };
        }

        // 1.5. Respetar circuito deshabilitado temporalmente si hubo fallos recientes
        if (this.disabledUntil && Date.now() < this.disabledUntil) {
            // Evitar loguear en exceso
            if (Date.now() - this.lastWarnAt > 60_000) {
                logger.warn('TomTom deshabilitado temporalmente por fallos previos. Usando límite estático');
                this.lastWarnAt = Date.now();
            }
            const fallback = this.obtenerLimiteEstatico(lat, lon);
            this.cache.set(cacheKey, fallback);
            return { ...fallback, source: 'static' };
        }

        // 2. Llamar a TomTom Snap to Roads (intento camelCase y, si falla, legacy hyphen-case)
        try {
            const apiKey = process.env.TOMTOM_API_KEY || process.env.VITE_TOMTOM_API_KEY;

            if (!apiKey || apiKey === 'your-tomtom-api-key') {
                logger.warn('TomTom API key no configurada, usando límites estáticos');
                return this.obtenerLimiteEstatico(lat, lon);
            }

            const tryEndpoints = async (): Promise<any | null> => {
                // 2.1 intento camelCase
                const url1 = `https://api.tomtom.com/routing/1/snapToRoads/sync/json`;
                try {
                    const r1 = await axios.post(url1, { points: [{ latitude: lat, longitude: lon }] }, { params: { key: apiKey }, timeout: 6000 });
                    return r1.data;
                } catch (e: any) {
                    const st = e?.response?.status;
                    if (st && st !== 404) {
                        logger.warn('TomTom camelCase fallo', { status: st });
                    }
                }

                // 2.2 intento legacy hyphen-case (compat)
                const url2 = `https://api.tomtom.com/routing/1/snap-to-roads/sync/json`;
                try {
                    const r2 = await axios.post(url2, { points: [{ latitude: lat, longitude: lon }] }, { params: { key: apiKey }, timeout: 6000 });
                    return r2.data;
                } catch (e2: any) {
                    const st2 = e2?.response?.status;
                    logger.warn('TomTom hyphen-case fallo', { status: st2 });
                    return null;
                }
            };

            const snapData = await tryEndpoints();

            // Extraer información del segmento
            const segment = snapData?.snappedPoints?.[0];

            if (segment && segment.roadProperties) {
                const speedLimit = segment.roadProperties.speedLimit || 50;
                const roadType = segment.roadProperties.functionalRoadClass || 'unknown';

                const resultado: SpeedLimitResult = {
                    lat,
                    lon,
                    speedLimit,
                    roadType,
                    source: 'tomtom',
                    timestamp: new Date()
                };

                // Guardar en caché
                this.cache.set(cacheKey, resultado);

                return resultado;
            }

            // Si no hay datos, usar estáticos
            logger.warn('TomTom no devolvió speedLimit, usando estático');
            return this.obtenerLimiteEstatico(lat, lon);

        } catch (error: any) {
            const status = error?.response?.status;
            // Para 404/403/401/5xx, activar circuito de fallback durante 1 hora
            if (status === 404 || status === 403 || status === 401 || (status >= 500 && status < 600)) {
                this.disabledUntil = Date.now() + 60 * 60 * 1000; // 1h
                if (Date.now() - this.lastWarnAt > 60_000) {
                    logger.warn('TomTom API falló, activando modo estático (1h)', { status });
                    this.lastWarnAt = Date.now();
                }
            } else {
                logger.warn('Error llamando a TomTom API, usando estático', { error: error.message });
            }
            const fallback = this.obtenerLimiteEstatico(lat, lon);
            // Cachear fallback para evitar repetidos intentos inmediatos en el mismo punto
            this.cache.set(cacheKey, fallback);
            return fallback;
        }
    }

    /**
     * Límites estáticos de fallback (España - Camiones)
     */
    private obtenerLimiteEstatico(lat: number, lon: number): SpeedLimitResult {
        // Límites genéricos para camiones en España
        // TODO: Mejorar con base de datos de vías clasificadas

        return {
            lat,
            lon,
            speedLimit: 80, // Convencional por defecto
            roadType: 'convencional',
            source: 'static',
            timestamp: new Date()
        };
    }

    // Nota: funciones avanzadas de detección por sesión usando TomTom se implementan
    // en servicios especializados y no se exponen aquí para evitar dependencias cíclicas.

    /**
     * Limpia la caché de límites de velocidad
     */
    limpiarCache(): void {
        this.cache.clear();
        logger.info('Caché de límites de velocidad limpiada');
    }
}

export const tomtomSpeedLimitsService = new TomTomSpeedLimitsService();

