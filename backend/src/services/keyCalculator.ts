/**
 * 🔑 SERVICIO DE CÁLCULO DE CLAVES OPERACIONALES
 * Calcula tiempos por clave según lógica de bomberos
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { haversineDistance } from './kpiCalculator';
import { radarIntegration } from './radarIntegration';

const prisma = new PrismaClient();
const logger = createLogger('KeyCalculator');

// Flag para usar Radar.com o fallback a BD local
const USE_RADAR = process.env.RADAR_SECRET_KEY && process.env.RADAR_SECRET_KEY !== 'your-radar-secret-key';

// ============================================================================
// CONSTANTES
// ============================================================================

const CONFIG = {
    VELOCIDAD_PARADO: 5, // km/h - por debajo se considera parado
    TIEMPO_MIN_PARADO: 5 * 60, // segundos - mínimo para Clave 3
    GPS_SAMPLE_INTERVAL: 5, // segundos
    RADIO_GEOCERCA: 100 // metros por defecto
};

// ============================================================================
// TIPOS
// ============================================================================

export interface TiemposPorClave {
    clave0_segundos: number;
    clave0_formateado: string;
    clave1_segundos: number;
    clave1_formateado: string;
    clave2_segundos: number;
    clave2_formateado: string;
    clave3_segundos: number;
    clave3_formateado: string;
    clave5_segundos: number;
    clave5_formateado: string;
    total_segundos: number;
    total_formateado: string;
}

interface Geocerca {
    lat: number;
    lon: number;
    radio: number;
    nombre: string;
}

// ============================================================================
// UTILIDADES
// ============================================================================

function puntoEnGeocerca(lat: number, lon: number, geocerca: Geocerca): boolean {
    const distancia = haversineDistance(lat, lon, geocerca.lat, geocerca.lon);
    return distancia <= geocerca.radio;
}

function formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

// ============================================================================
// CARGAR GEOCERCAS DE LA ORGANIZACIÓN
// ============================================================================

async function cargarGeocercas(organizationId: string): Promise<{
    parques: Geocerca[];
    talleres: Geocerca[];
}> {
    // Cargar parques
    const parks = await prisma.park.findMany({
        where: { organizationId }
    });

    const parques: Geocerca[] = parks.map(p => {
        const geometry = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;

        if (geometry.type === 'circle' || geometry.type === 'Circle') {
            return {
                lat: geometry.center.lat,
                lon: geometry.center.lng,
                radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
                nombre: p.name
            };
        }

        // Por defecto usar primer punto si es polígono
        return {
            lat: geometry.coordinates?.[0]?.[0] || 0,
            lon: geometry.coordinates?.[0]?.[1] || 0,
            radio: CONFIG.RADIO_GEOCERCA,
            nombre: p.name
        };
    });

    // Cargar talleres (zonas marcadas como taller)
    const zones = await prisma.zone.findMany({
        where: {
            organizationId,
            type: 'TALLER'
        }
    });

    const talleres: Geocerca[] = zones.map(z => {
        const geometry = typeof z.geometry === 'string' ? JSON.parse(z.geometry) : z.geometry;

        return {
            lat: geometry.center?.lat || geometry.coordinates?.[0]?.[0] || 0,
            lon: geometry.center?.lng || geometry.coordinates?.[0]?.[1] || 0,
            radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
            nombre: z.name
        };
    });

    return { parques, talleres };
}

// ============================================================================
// CÁLCULO DE TIEMPOS POR CLAVE
// ============================================================================

export async function calcularTiemposPorClave(
    sessionIds: string[]
): Promise<TiemposPorClave> {
    try {
        // Obtener sesiones con GPS y rotativo
        const sessions = await prisma.session.findMany({
            where: { id: { in: sessionIds } },
            include: {
                gpsMeasurements: {
                    where: { fix: '1', satellites: { gte: 4 } },
                    orderBy: { timestamp: 'asc' }
                },
                RotativoMeasurement: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (sessions.length === 0) {
            return crearTiemposVacios();
        }

        // Cargar geocercas
        const organizationId = sessions[0].organizationId;
        const geocercas = await cargarGeocercas(organizationId);

        let tiempos = {
            clave0: 0,
            clave1: 0,
            clave2: 0,
            clave3: 0,
            clave5: 0
        };

        // Procesar cada sesión
        for (const session of sessions) {
            const gps = session.gpsMeasurements;
            const rotativo = session.RotativoMeasurement;

            if (gps.length === 0) continue;

            // Crear mapa de estados de rotativo por timestamp
            const rotativoMap = new Map();
            rotativo.forEach(r => {
                rotativoMap.set(r.timestamp.getTime(), r.state);
            });

            for (let i = 0; i < gps.length; i++) {
                const punto = gps[i];

                // Buscar estado de rotativo más cercano en tiempo
                let rotativoState = '0';
                const timestampGPS = punto.timestamp.getTime();
                for (const [timestampRot, state] of Array.from(rotativoMap.entries())) {
                    if (Math.abs(timestampRot - timestampGPS) < 30000) { // 30 segundos tolerancia
                        rotativoState = state;
                        break;
                    }
                }

                let enParque = false;
                let enTaller = false;

                // Usar Radar.com si está configurado, sino fallback a BD local
                if (USE_RADAR) {
                    try {
                        const verificacionParque = await radarIntegration.verificarEnParque(
                            punto.latitude,
                            punto.longitude
                        );
                        enParque = verificacionParque.enParque;

                        const verificacionTaller = await radarIntegration.verificarEnTaller(
                            punto.latitude,
                            punto.longitude
                        );
                        enTaller = verificacionTaller.enTaller;

                        if (enParque || enTaller) {
                            logger.debug('Radar.com: Punto en geocerca', {
                                lat: punto.latitude,
                                lon: punto.longitude,
                                enParque,
                                enTaller
                            });
                        }
                    } catch (error: any) {
                        // Fallback a BD local si Radar falla
                        logger.warn('Radar.com falló, usando BD local', { error: error.message });
                        enParque = geocercas.parques.some(p =>
                            puntoEnGeocerca(punto.latitude, punto.longitude, p)
                        );
                        enTaller = geocercas.talleres.some(t =>
                            puntoEnGeocerca(punto.latitude, punto.longitude, t)
                        );
                    }
                } else {
                    // Usar BD local
                    enParque = geocercas.parques.some(p =>
                        puntoEnGeocerca(punto.latitude, punto.longitude, p)
                    );
                    enTaller = geocercas.talleres.some(t =>
                        puntoEnGeocerca(punto.latitude, punto.longitude, t)
                    );
                }

                // CLAVE 0: Taller
                if (enTaller) {
                    tiempos.clave0 += CONFIG.GPS_SAMPLE_INTERVAL;
                    continue;
                }

                // CLAVE 1: Operativo en parque (sin rotativo)
                if (enParque && rotativoState === '0') {
                    tiempos.clave1 += CONFIG.GPS_SAMPLE_INTERVAL;
                    continue;
                }

                // CLAVE 2: Salida en emergencia (rotativo ON, fuera parque)
                if (!enParque && rotativoState === '1') {
                    // Verificar si se está moviendo (no parado en emergencia)
                    if (punto.speed > CONFIG.VELOCIDAD_PARADO) {
                        tiempos.clave2 += CONFIG.GPS_SAMPLE_INTERVAL;
                        continue;
                    }
                }

                // CLAVE 3: En incendio/emergencia (parado >5 min fuera parque)
                if (!enParque && punto.speed <= CONFIG.VELOCIDAD_PARADO) {
                    // Contar tiempo parado consecutivo
                    let tiempoParadoConsecutivo = CONFIG.GPS_SAMPLE_INTERVAL;

                    for (let j = i + 1; j < gps.length && gps[j].speed <= CONFIG.VELOCIDAD_PARADO; j++) {
                        tiempoParadoConsecutivo += CONFIG.GPS_SAMPLE_INTERVAL;
                    }

                    // Solo contar como Clave 3 si >5 minutos
                    if (tiempoParadoConsecutivo >= CONFIG.TIEMPO_MIN_PARADO) {
                        tiempos.clave3 += CONFIG.GPS_SAMPLE_INTERVAL;
                        continue;
                    }
                }

                // CLAVE 5: Regreso al parque (rotativo OFF, acercándose al parque)
                if (!enParque && rotativoState === '0' && punto.speed > CONFIG.VELOCIDAD_PARADO) {
                    // Verificar si se acerca al parque
                    if (geocercas.parques.length > 0 && i > 0) {
                        const parqueMasCercano = geocercas.parques[0]; // Simplificado
                        const distanciaActual = haversineDistance(
                            punto.latitude, punto.longitude,
                            parqueMasCercano.lat, parqueMasCercano.lon
                        );
                        const distanciaAnterior = haversineDistance(
                            gps[i - 1].latitude, gps[i - 1].longitude,
                            parqueMasCercano.lat, parqueMasCercano.lon
                        );

                        // Si se acerca al parque (distancia disminuye)
                        if (distanciaActual < distanciaAnterior) {
                            tiempos.clave5 += CONFIG.GPS_SAMPLE_INTERVAL;
                        }
                    }
                }
            }
        }

        return {
            clave0_segundos: tiempos.clave0,
            clave0_formateado: formatearTiempo(tiempos.clave0),
            clave1_segundos: tiempos.clave1,
            clave1_formateado: formatearTiempo(tiempos.clave1),
            clave2_segundos: tiempos.clave2,
            clave2_formateado: formatearTiempo(tiempos.clave2),
            clave3_segundos: tiempos.clave3,
            clave3_formateado: formatearTiempo(tiempos.clave3),
            clave5_segundos: tiempos.clave5,
            clave5_formateado: formatearTiempo(tiempos.clave5),
            total_segundos: tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave5,
            total_formateado: formatearTiempo(tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave5)
        };

    } catch (error) {
        logger.error('Error calculando tiempos por clave', error);
        return crearTiemposVacios();
    }
}

function crearTiemposVacios(): TiemposPorClave {
    return {
        clave0_segundos: 0,
        clave0_formateado: '00:00:00',
        clave1_segundos: 0,
        clave1_formateado: '00:00:00',
        clave2_segundos: 0,
        clave2_formateado: '00:00:00',
        clave3_segundos: 0,
        clave3_formateado: '00:00:00',
        clave5_segundos: 0,
        clave5_formateado: '00:00:00',
        total_segundos: 0,
        total_formateado: '00:00:00'
    };
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const keyCalculator = {
    calcularTiemposPorClave,
    cargarGeocercas
};

