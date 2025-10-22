/**
 * 🔑 SERVICIO DE CÁLCULO DE CLAVES OPERACIONALES
 * Calcula tiempos por clave según lógica de bomberos
 */

import { Prisma } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { radarIntegration } from './radarIntegration';

// Función haversineDistance movida aquí para evitar importación circular
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
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
    clave4_segundos: number;  // ✅ MANDAMIENTO M2: Retorno sin emergencia
    clave4_formateado: string;
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
    // Importar prisma dinámicamente

    // Cargar parques
    const parks = await prisma.park.findMany({
        where: { organizationId }
    });

    const parques: Geocerca[] = parks.map(p => {
        const geometry = typeof p.geometry === 'string' ? JSON.parse(p.geometry) : p.geometry;

        // ✅ Tipo Circle
        if (geometry.type === 'circle' || geometry.type === 'Circle') {
            const center = Array.isArray(geometry.center)
                ? { lat: geometry.center[0], lon: geometry.center[1] }
                : { lat: geometry.center.lat, lon: geometry.center.lng };

            return {
                lat: center.lat,
                lon: center.lon,
                radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
                nombre: p.name
            };
        }

        // ✅ Tipo Point (nuevo - para parques sin radio explícito)
        if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
            return {
                lat: geometry.coordinates[1], // [lon, lat] en GeoJSON
                lon: geometry.coordinates[0],
                radio: CONFIG.RADIO_GEOCERCA, // Radio por defecto (200m)
                nombre: p.name
            };
        }

        // ✅ Tipo Polygon - usar centro del primer segmento
        if (geometry.type === 'Polygon' && geometry.coordinates?.[0]?.length > 0) {
            const coords = geometry.coordinates[0][0]; // Primer punto [lon, lat]
            return {
                lat: Array.isArray(coords) ? coords[1] : 0,
                lon: Array.isArray(coords) ? coords[0] : 0,
                radio: CONFIG.RADIO_GEOCERCA, // Radio aproximado para polígonos
                nombre: p.name
            };
        }

        // Fallback
        return {
            lat: 0,
            lon: 0,
            radio: CONFIG.RADIO_GEOCERCA,
            nombre: p.name
        };
    });

    // Cargar talleres (zonas marcadas como taller)
    const { prisma: prisma2 } = await import('../config/prisma');
    const zones = await prisma2.zone.findMany({
        where: {
            organizationId,
            type: 'TALLER'
        }
    });

    const talleres: Geocerca[] = zones.map(z => {
        const geometry = typeof z.geometry === 'string' ? JSON.parse(z.geometry) : z.geometry;

        // ✅ CORRECCIÓN: Manejar diferentes formatos de geometría
        if (geometry.type === 'Circle' && geometry.center) {
            const center = Array.isArray(geometry.center)
                ? { lat: geometry.center[0], lon: geometry.center[1] }
                : { lat: geometry.center.lat, lon: geometry.center.lng };

            return {
                lat: center.lat,
                lon: center.lon,
                radio: geometry.radius || CONFIG.RADIO_GEOCERCA,
                nombre: z.name
            };
        }

        // Para polígonos, usar primer punto (lon, lat en GeoJSON)
        const coords = geometry.coordinates?.[0]?.[0];
        return {
            lat: Array.isArray(coords) ? coords[1] : 0,
            lon: Array.isArray(coords) ? coords[0] : 0,
            radio: CONFIG.RADIO_GEOCERCA,
            nombre: z.name
        };
    });

    return { parques, talleres };
}

// ============================================================================
// CÁLCULO DE TIEMPOS POR CLAVE
// ============================================================================

export async function calcularTiemposPorClave(
    sessionIds: string[],
    from?: Date | string,
    to?: Date | string
): Promise<TiemposPorClave> {
    try {
        const dateFrom = from ? new Date(from) : undefined;
        const dateTo = to ? new Date(to) : undefined;

        // Importar prisma dinámicamente

        // ✅ MANDAMIENTO M2: Usar segmentos persistidos en lugar de calcular en tiempo real
        const segmentosWhere: any = { sessionId: { in: sessionIds } };
        if (dateFrom && dateTo) {
            segmentosWhere.startTime = { gte: dateFrom, lte: dateTo };
        }

        const segmentos = await prisma.operational_state_segments.findMany({
            where: segmentosWhere,
            select: { clave: true, startTime: true, endTime: true }
        });

        if (segmentos.length === 0) {
            logger.warn('No hay segmentos operacionales persistidos, calculando en tiempo real...');
            return await calcularTiemposEnTiempoReal(sessionIds, from, to);
        }

        // Calcular tiempos desde segmentos persistidos
        const tiempos = {
            clave0: 0, clave1: 0, clave2: 0, clave3: 0, clave4: 0, clave5: 0
        };

        segmentos.forEach((segmento: any) => {
            const duracionSegundos = (segmento.endTime.getTime() - segmento.startTime.getTime()) / 1000;
            tiempos[`clave${segmento.clave}` as keyof typeof tiempos] += duracionSegundos;
        });

        const totalSegundos = tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave4 + tiempos.clave5;

        logger.info(`✅ Tiempos calculados desde segmentos: ${totalSegundos}s total`);

        return {
            clave0_segundos: tiempos.clave0,
            clave0_formateado: formatearTiempo(tiempos.clave0),
            clave1_segundos: tiempos.clave1,
            clave1_formateado: formatearTiempo(tiempos.clave1),
            clave2_segundos: tiempos.clave2,
            clave2_formateado: formatearTiempo(tiempos.clave2),
            clave3_segundos: tiempos.clave3,
            clave3_formateado: formatearTiempo(tiempos.clave3),
            clave4_segundos: tiempos.clave4,
            clave4_formateado: formatearTiempo(tiempos.clave4),
            clave5_segundos: tiempos.clave5,
            clave5_formateado: formatearTiempo(tiempos.clave5),
            total_segundos: totalSegundos,
            total_formateado: formatearTiempo(totalSegundos)
        };

    } catch (error) {
        logger.error('Error calculando tiempos por clave', error);
        return {
            clave0_segundos: 0,
            clave0_formateado: '00:00:00',
            clave1_segundos: 0,
            clave1_formateado: '00:00:00',
            clave2_segundos: 0,
            clave2_formateado: '00:00:00',
            clave3_segundos: 0,
            clave3_formateado: '00:00:00',
            clave4_segundos: 0,
            clave4_formateado: '00:00:00',
            clave5_segundos: 0,
            clave5_formateado: '00:00:00',
            total_segundos: 0,
            total_formateado: '00:00:00'
        };
    }
}

// Función auxiliar para cálculo en tiempo real (fallback)
async function calcularTiemposEnTiempoReal(
    sessionIds: string[],
    from?: Date | string,
    to?: Date | string
): Promise<TiemposPorClave> {
    const dateFrom = from ? new Date(from) : undefined;
    const dateTo = to ? new Date(to) : undefined;

    // Importar prisma dinámicamente

    // Obtener sesiones con GPS y rotativo
    const sessions = await prisma.session.findMany({
        where: { id: { in: sessionIds } },
        include: {
            // cambio aquí: usar TODOS los GPS válidos, sin filtrar por fix/satélites
            gpsMeasurements: {
                orderBy: { timestamp: 'asc' },
                ...(dateFrom && dateTo ? { where: { timestamp: { gte: dateFrom, lte: dateTo } } } : {})
            },
            rotativoMeasurements: {
                orderBy: { timestamp: 'asc' },
                ...(dateFrom && dateTo ? { where: { timestamp: { gte: dateFrom, lte: dateTo } } } : {})
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
        clave4: 0,  // ✅ MANDAMIENTO M2: Retorno sin emergencia
        clave5: 0
    };

    // Procesar cada sesión
    for (const session of sessions) {
        const gps = session.gpsMeasurements;
        const rotativo = session.rotativoMeasurements;

        if (gps.length === 0) continue;

        // cambio aquí: reiniciar estado interno por sesión para evitar fuga entre sesiones
        // @ts-ignore
        (calcularTiemposEnTiempoReal as any)._estado = null;
        // @ts-ignore
        (calcularTiemposEnTiempoReal as any)._paradoSeg = 0;
        // @ts-ignore
        (calcularTiemposEnTiempoReal as any)._distPrev = null;

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

                    // ✅ MANDAMIENTO M8: Logging de uso de Radar.com
                    // TODO: Implementar logging cuando se resuelva el problema de Prisma
                    // try {
                    //     const { prisma } = await import('../config/prisma');
                    //     await prisma.GeofenceUsageLog.create({
                    //         data: {
                    //             source: 'radar.com',
                    //             organizationId: session.organizationId,
                    //             operation: 'isInGeofence',
                    //             success: true,
                    //             apiCalls: 1
                    //         }
                    //     });
                    // } catch (logError: any) {
                    //     logger.warn('Error logging Radar.com usage:', logError.message);
                    // }

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

                    // ✅ MANDAMIENTO M8: Logging de fallback
                    // TODO: Implementar logging cuando se resuelva el problema de Prisma
                    // try {
                    //     const { prisma } = await import('../config/prisma');
                    //     await prisma.GeofenceUsageLog.create({
                    //         data: {
                    //             source: 'local_db',
                    //             organizationId: session.organizationId,
                    //             operation: 'isInGeofence',
                    //             success: false,
                    //             errorMessage: error.message,
                    //             apiCalls: 1
                    //         }
                    //     });
                    // } catch (logError: any) {
                    //     logger.warn('Error logging fallback usage:', logError.message);
                    // }

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

                // ✅ MANDAMIENTO M8: Logging de uso local (solo una vez por sesión)
                // Logging movido fuera del bucle para evitar spam
            }

            // Estado y transiciones por clave (1→2→3→5→1) con reglas
            // Variables auxiliares persistentes entre iteraciones
            // (definidas fuera del bucle principal del archivo)
            // Seguimos acumulando por ventana de muestreo fija

            // Inicializar contadores persistentes
            // Nota: Para evitar redefinir en cada iteración, usamos propiedades en el objeto function (trick seguro en TS/Node)
            // @ts-ignore
            if (typeof (calcularTiemposEnTiempoReal as any)._estado === 'undefined') {
                // @ts-ignore
                (calcularTiemposEnTiempoReal as any)._estado = null as null | 0 | 1 | 2 | 3 | 4 | 5;  // ✅ Incluir 4
                // @ts-ignore
                (calcularTiemposEnTiempoReal as any)._paradoSeg = 0 as number;
                // @ts-ignore
                (calcularTiemposEnTiempoReal as any)._distPrev = null as number | null;
            }
            // @ts-ignore
            let estadoActual = (calcularTiemposEnTiempoReal as any)._estado as null | 0 | 1 | 2 | 3 | 4 | 5;  // ✅ Incluir 4
            // @ts-ignore
            let paradoSeg = (calcularTiemposEnTiempoReal as any)._paradoSeg as number;
            // @ts-ignore
            let distPrev = (calcularTiemposEnTiempoReal as any)._distPrev as number | null;

            // Actualizar acumulador de parado
            if (!enParque && punto.speed <= CONFIG.VELOCIDAD_PARADO) {
                paradoSeg += CONFIG.GPS_SAMPLE_INTERVAL;
            } else {
                paradoSeg = 0;
            }

            // Calcular distancia al parque (si existe) para transiciones 5
            let distanciaActualParque: number | null = null;
            if (geocercas.parques.length > 0) {
                const p0 = geocercas.parques[0];
                distanciaActualParque = haversineDistance(
                    punto.latitude, punto.longitude,
                    p0.lat, p0.lon
                );
            }

            // Transiciones de estado priorizadas (MANDAMIENTO M2)
            if (enTaller) {
                estadoActual = 0;
                tiempos.clave0 += CONFIG.GPS_SAMPLE_INTERVAL;
            } else if (enParque && rotativoState === '0') {
                estadoActual = 1;
                tiempos.clave1 += CONFIG.GPS_SAMPLE_INTERVAL;
            } else if (!enParque && rotativoState === '1' && punto.speed > CONFIG.VELOCIDAD_PARADO) {
                // Salida en emergencia
                estadoActual = 2;
                tiempos.clave2 += CONFIG.GPS_SAMPLE_INTERVAL;
            } else if (!enParque && paradoSeg >= CONFIG.TIEMPO_MIN_PARADO) {
                // En siniestro (parado ≥ 5 min)
                estadoActual = 3;
                tiempos.clave3 += CONFIG.GPS_SAMPLE_INTERVAL;
            } else if (
                // ✅ CLAVE 4: Retorno sin emergencia (rotativo OFF + alejándose de incidente)
                !enParque && rotativoState === '0' && estadoActual === 3 && punto.speed > CONFIG.VELOCIDAD_PARADO
            ) {
                // Sale de Clave 3 (incidente) sin rotativo → Clave 4
                estadoActual = 4;
                tiempos.clave4 += CONFIG.GPS_SAMPLE_INTERVAL;
            } else if (
                !enParque && rotativoState === '0' && punto.speed > CONFIG.VELOCIDAD_PARADO &&
                distanciaActualParque !== null && distPrev !== null && distanciaActualParque < distPrev
            ) {
                // Regreso al parque si se acerca
                estadoActual = 5;
                tiempos.clave5 += CONFIG.GPS_SAMPLE_INTERVAL;
            }

            // Persistir auxiliares
            // @ts-ignore
            (calcularTiemposEnTiempoReal as any)._estado = estadoActual;
            // @ts-ignore
            (calcularTiemposEnTiempoReal as any)._paradoSeg = paradoSeg;
            // @ts-ignore
            (calcularTiemposEnTiempoReal as any)._distPrev = distanciaActualParque;
        }
    }

    const totalSegundos = tiempos.clave0 + tiempos.clave1 + tiempos.clave2 + tiempos.clave3 + tiempos.clave4 + tiempos.clave5;

    // ✅ MANDAMIENTO M8: Logging de uso local (una vez por sesión)
    // TODO: Implementar logging cuando se resuelva el problema de Prisma
    // if (!USE_RADAR && sessions.length > 0) {
    //     try {
    //         const { prisma } = await import('../config/prisma');
    //         await prisma.GeofenceUsageLog.create({
    //             data: {
    //                 source: 'local_db',
    //                 organizationId: sessions[0].organizationId,
    //                 operation: 'isInGeofence',
    //                 success: true,
    //                 apiCalls: 1,
    //                 errorMessage: 'RADAR_NOT_CONFIGURED'
    //             }
    //         });
    //     } catch (logError: any) {
    //         logger.warn('Error logging local usage:', logError.message);
    //     }
    // }

    return {
        clave0_segundos: tiempos.clave0,
        clave0_formateado: formatearTiempo(tiempos.clave0),
        clave1_segundos: tiempos.clave1,
        clave1_formateado: formatearTiempo(tiempos.clave1),
        clave2_segundos: tiempos.clave2,
        clave2_formateado: formatearTiempo(tiempos.clave2),
        clave3_segundos: tiempos.clave3,
        clave3_formateado: formatearTiempo(tiempos.clave3),
        clave4_segundos: tiempos.clave4,  // ✅ MANDAMIENTO M2
        clave4_formateado: formatearTiempo(tiempos.clave4),
        clave5_segundos: tiempos.clave5,
        clave5_formateado: formatearTiempo(tiempos.clave5),
        total_segundos: totalSegundos,
        total_formateado: formatearTiempo(totalSegundos)
    };
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
        clave4_segundos: 0,  // ✅ MANDAMIENTO M2
        clave4_formateado: '00:00:00',
        clave5_segundos: 0,
        clave5_formateado: '00:00:00',
        total_segundos: 0,
        total_formateado: '00:00:00'
    };
}

// ============================================================================
// CALCULAR Y GUARDAR SEGMENTOS (MANDAMIENTO M2.5)
// ============================================================================

/**
 * Calcula segmentos de claves operacionales y los persiste en BD
 * @param sessionId - ID de sesión a procesar
 * @returns Número de segmentos guardados
 */
export async function calcularYGuardarSegmentos(sessionId: string): Promise<number> {
    try {

        logger.info(`📦 Calculando segmentos para sesión ${sessionId}`);

        // 1. Obtener datos GPS y rotativo
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                gpsMeasurements: { orderBy: { timestamp: 'asc' } },
                rotativoMeasurements: { orderBy: { timestamp: 'asc' } }
            }
        });

        if (!session || session.gpsMeasurements.length === 0) {
            logger.warn(`⚠️ Sesión ${sessionId} sin datos GPS`);
            return 0;
        }

        // 2. Cargar geocercas
        const geocercas = await cargarGeocercas(session.organizationId);

        // 3. Detectar segmentos usando máquina de estados
        const segmentos: Array<{
            clave: number;
            inicio: Date;
            fin: Date;
            duracion: number;
            metadata: any;
        }> = [];

        let estadoActual: number | null = null;
        let inicioSegmento: Date | null = null;
        let rotativoOn = false;
        let enGeocerca: string | null = null;

        // Crear mapa de rotativo
        const rotativoMap = new Map<number, string>();
        session.rotativoMeasurements.forEach(r => {
            rotativoMap.set(r.timestamp.getTime(), r.state);
        });

        for (let i = 0; i < session.gpsMeasurements.length; i++) {
            const gps = session.gpsMeasurements[i];
            const rotativoState = rotativoMap.get(gps.timestamp.getTime()) || '0';
            rotativoOn = rotativoState === '1';

            // Detectar geocerca actual
            let enParque = false;
            let enTaller = false;
            let nombreGeocerca = null;

            for (const parque of geocercas.parques) {
                if (puntoEnGeocerca(gps.latitude, gps.longitude, parque)) {
                    enParque = true;
                    nombreGeocerca = parque.nombre;
                    break;
                }
            }

            if (!enParque) {
                for (const taller of geocercas.talleres) {
                    if (puntoEnGeocerca(gps.latitude, gps.longitude, taller)) {
                        enTaller = true;
                        nombreGeocerca = taller.nombre;
                        break;
                    }
                }
            }

            // Determinar clave actual (lógica simplificada)
            let claveActual: number;
            if (enTaller) {
                claveActual = 0;
            } else if (enParque && !rotativoOn) {
                claveActual = 1;
            } else if (!enParque && rotativoOn && gps.speed > CONFIG.VELOCIDAD_PARADO) {
                claveActual = 2;
            } else if (!enParque && gps.speed <= CONFIG.VELOCIDAD_PARADO) {
                claveActual = 3;
            } else if (!enParque && !rotativoOn && estadoActual === 3) {
                claveActual = 4; // ✅ Clave 4
            } else {
                claveActual = 5;
            }

            // Detectar transiciones
            if (estadoActual !== claveActual) {
                // Cerrar segmento anterior
                if (estadoActual !== null && inicioSegmento !== null) {
                    const duracion = Math.floor((gps.timestamp.getTime() - inicioSegmento.getTime()) / 1000);
                    if (duracion > 0) {
                        segmentos.push({
                            clave: estadoActual,
                            inicio: inicioSegmento,
                            fin: gps.timestamp,
                            duracion,
                            metadata: {
                                geocerca: enGeocerca,
                                rotativoOn: rotativoOn,
                                velocidadPromedio: gps.speed
                            }
                        });
                    }
                }

                // Iniciar nuevo segmento
                estadoActual = claveActual;
                inicioSegmento = gps.timestamp;
                enGeocerca = nombreGeocerca;
            }
        }

        // Cerrar último segmento
        if (estadoActual !== null && inicioSegmento !== null) {
            const ultimoGPS = session.gpsMeasurements[session.gpsMeasurements.length - 1];
            const duracion = Math.floor((ultimoGPS.timestamp.getTime() - inicioSegmento.getTime()) / 1000);
            if (duracion > 0) {
                segmentos.push({
                    clave: estadoActual,
                    inicio: inicioSegmento,
                    fin: ultimoGPS.timestamp,
                    duracion,
                    metadata: { geocerca: enGeocerca, rotativoOn }
                });
            }
        }

        // 4. Persistir segmentos en BD
        if (segmentos.length > 0) {
            await prisma.$executeRaw`
                INSERT INTO operational_state_segments ("sessionId", clave, "startTime", "endTime", "durationSeconds", metadata, "createdAt", "updatedAt")
                VALUES ${Prisma.join(
                segmentos.map(s =>
                    Prisma.sql`(${sessionId}, ${s.clave}, ${s.inicio}, ${s.fin}, ${s.duracion}, ${JSON.stringify(s.metadata || {})}::jsonb, NOW(), NOW())`
                )
            )}
            `;

            logger.info(`✅ Guardados ${segmentos.length} segmentos para sesión ${sessionId}`);
        }

        return segmentos.length;

    } catch (error: any) {
        logger.error(`Error calculando segmentos para sesión ${sessionId}:`, error);
        return 0;
    }
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const keyCalculator = {
    calcularTiemposPorClave,
    calcularYGuardarSegmentos,  // ✅ MANDAMIENTO M2.5
    cargarGeocercas
};

