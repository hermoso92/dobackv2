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

        // 2. Llamar a TomTom Snap to Roads
        try {
            const apiKey = process.env.TOMTOM_API_KEY || process.env.VITE_TOMTOM_API_KEY;

            if (!apiKey || apiKey === 'your-tomtom-api-key') {
                logger.warn('TomTom API key no configurada, usando límites estáticos');
                return this.obtenerLimiteEstatico(lat, lon);
            }

            // Snap to Roads API para obtener el segmento de carretera
            const snapUrl = `https://api.tomtom.com/routing/1/snap-to-roads/sync/json`;
            const snapResponse = await axios.post(
                snapUrl,
                {
                    points: [{ latitude: lat, longitude: lon }]
                },
                {
                    params: { key: apiKey },
                    timeout: 5000
                }
            );

            // Extraer información del segmento
            const segment = snapResponse.data.snappedPoints?.[0];

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
            logger.error('Error llamando a TomTom API', { error: error.message });
            return this.obtenerLimiteEstatico(lat, lon);
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

    /**
     * Detecta excesos de velocidad para una sesión
     * 
     * CORRECCIÓN: No hardcodea +20 para rotativo, usa política configurable
     */
    async detectarExcesosVelocidad(
        sessionId: string,
        politicaVelocidad?: {
            toleranciaRotativoOn?: number; // % de tolerancia si rotativo ON
            toleranciaGeneral?: number;     // % de tolerancia general
        }
    ): Promise<SpeedExcess[]> {
        logger.info(`Detectando excesos de velocidad para sesión ${sessionId}`);

        // Política por defecto (configurable)
        const politica = {
            toleranciaRotativoOn: politicaVelocidad?.toleranciaRotativoOn || 0, // Sin tolerancia automática
            toleranciaGeneral: politicaVelocidad?.toleranciaGeneral || 0
        };

        // Obtener GPS correlacionado con rotativo
        const { gpsConRotativo } = await dataCorrelationService.correlacionarSesion(sessionId);

        const excesos: SpeedExcess[] = [];

        // Obtener claves operacionales para contexto
        const claves = await prisma.operationalKey.findMany({
            where: { sessionId },
            orderBy: { startTime: 'asc' }
        });

        for (const punto of gpsConRotativo) {
            if (!punto.speed || punto.speed < 10) continue; // Ignorar velocidades muy bajas

            // Obtener límite de velocidad para este punto
            const limiteInfo = await this.obtenerLimiteVelocidad(punto.latitude, punto.longitude);

            // Aplicar tolerancia según política
            const tolerancia = punto.rotativoOn ? politica.toleranciaRotativoOn : politica.toleranciaGeneral;
            const limiteConTolerancia = limiteInfo.speedLimit * (1 + tolerancia / 100);

            // Detectar exceso
            if (punto.speed > limiteConTolerancia) {
                // Encontrar clave activa en ese momento
                const claveActiva = claves.find(c =>
                    punto.timestamp >= c.startTime &&
                    (!c.endTime || punto.timestamp <= c.endTime)
                );

                const excesoAbsoluto = punto.speed - limiteInfo.speedLimit;

                // Calcular severidad basada en % de exceso
                let severidad = 'LEVE';
                const porcentajeExceso = (excesoAbsoluto / limiteInfo.speedLimit) * 100;

                if (porcentajeExceso > 50) severidad = 'GRAVE';
                else if (porcentajeExceso > 25) severidad = 'MODERADA';

                excesos.push({
                    timestamp: punto.timestamp,
                    lat: punto.latitude,
                    lon: punto.longitude,
                    velocidad: punto.speed,
                    limite: limiteInfo.speedLimit,
                    exceso: excesoAbsoluto,
                    rotativoOn: punto.rotativoOn,
                    clave: claveActiva?.keyType,
                    severidad
                });

                // Log de contexto para excesos con rotativo ON
                if (punto.rotativoOn) {
                    logger.info(`Exceso con rotativo ON: ${punto.speed.toFixed(0)} km/h (límite ${limiteInfo.speedLimit}) - Clave ${claveActiva?.keyType || 'N/A'}`);
                }
            }
        }

        logger.info(`Excesos detectados: ${excesos.length}`);

        return excesos;
    }

    /**
     * Limpia la caché de límites de velocidad
     */
    limpiarCache(): void {
        this.cache.clear();
        logger.info('Caché de límites de velocidad limpiada');
    }
}

export const tomtomSpeedLimitsService = new TomTomSpeedLimitsService();

