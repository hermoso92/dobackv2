import { PrismaClient } from '@prisma/client';
import haversine from 'haversine-distance';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface StabilityDataPoint {
    timestamp: string;
    si: number; // stability index (0-1)
    roll: number | null;
    pitch: number | null;
    ay: number; // lateral acceleration
    gz: number; // yaw rate
    accmag?: number;
}

export interface GPSPoint {
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
}

export interface CANPoint {
    timestamp: string;
    engineRPM: number;
    vehicleSpeed: number;
    rotativo: boolean;
}

export type StabilityLevel = 'critical' | 'danger' | 'moderate' | 'punto_interes';

export type RolloverCause =
    | 'pendiente_lateral'
    | 'curva_brusca'
    | 'maniobra_brusca'
    | 'terreno_irregular'
    | 'perdida_adherencia'
    | 'sin_causa_clara';

export interface StabilityEvent {
    id: string;
    sessionId: string;
    timestamp: Date;
    lat: number;
    lon: number;
    level: StabilityLevel;
    perc: number;
    tipos: string[];
    valores: {
        si: number;
        roll: number | null;
        ay: number;
        yaw: number;
    };
    can: {
        engineRPM: number;
        vehicleSpeed: number;
        rotativo: boolean;
    };
}

/**
 * Clasifica el nivel de riesgo según el Índice de Estabilidad (SI)
 */
function classifyRiskLevel(si: number): StabilityLevel | null {
    const siPercent = si * 100; // Convertir a porcentaje

    if (siPercent < 10) {
        return 'critical'; // 🔴 Riesgo Crítico: SI < 10%
    } else if (siPercent < 30) {
        return 'danger';   // 🟠 Riesgo Peligroso: 10% ≤ SI < 30%
    } else if (siPercent < 50) {
        return 'moderate'; // 🟡 Riesgo Moderado: 30% ≤ SI < 50%
    } else if (siPercent < 60) {
        return 'punto_interes'; // 🔵 Punto de Interés: 50% ≤ SI < 60%
    }

    return null; // No generar evento si SI ≥ 60%
}

/**
 * Detecta la causa confiable del riesgo de vuelco según las especificaciones
 */
function detectRolloverCause(
    curr: StabilityDataPoint,
    prev?: StabilityDataPoint,
    vehicleSpeed: number = 0
): RolloverCause {
    const roll = Math.abs(curr.roll || 0);
    const ay = Math.abs(curr.ay);
    const yawRate = Math.abs(curr.gz);

    // 1. Pendiente lateral: roll > 5° y ay < 0.5 m/s²
    if (roll > 5 && ay < 0.5) {
        return 'pendiente_lateral';
    }

    // 2. Curva brusca: ay > 1.5 m/s², yaw_rate > 0.1 rad/s, roll < 5°
    if (ay > 1.5 && yawRate > 0.1 && roll < 5) {
        return 'curva_brusca';
    }

    // 3. Maniobra brusca: roll > 3°, ay > 1.0 m/s², yaw_rate > 0.05 rad/s
    if (roll > 3 && ay > 1.0 && yawRate > 0.05) {
        return 'maniobra_brusca';
    }

    // 4. Terreno irregular: frecuencia alta en aceleración vertical
    if (prev) {
        const deltaAy = Math.abs(curr.ay - prev.ay);
        if (deltaAy > 2.0) {
            return 'terreno_irregular';
        }
    }

    // 5. Pérdida de adherencia: alto ay y yaw_rate con velocidad alta
    if (vehicleSpeed > 30 && ay > 2.0 && yawRate > 0.15) {
        return 'perdida_adherencia';
    }

    // 6. Sin causa clara identificable
    return 'sin_causa_clara';
}

/**
 * Mapea causas de vuelco a tipos de eventos
 */
function causeToEventTypes(cause: RolloverCause): string[] {
    const typeMap: Record<RolloverCause, string[]> = {
        pendiente_lateral: ['pendiente_lateral'],
        curva_brusca: ['curva_brusca'],
        maniobra_brusca: ['maniobra_brusca'],
        terreno_irregular: ['terreno_irregular'],
        perdida_adherencia: ['perdida_adherencia'],
        sin_causa_clara: ['sin_causa_clara']
    };

    return typeMap[cause] || ['sin_causa_clara'];
}

/**
 * Compara niveles de estabilidad para determinar prioridad
 */
function compareStabilityLevel(a: StabilityLevel, b: StabilityLevel): number {
    const levels = { critical: 4, danger: 3, moderate: 2, punto_interes: 1 };
    return levels[a] - levels[b];
}

/**
 * Genera eventos de estabilidad para una sesión específica
 */
export async function generateStabilityEvents(sessionId: string): Promise<{ events: StabilityEvent[], quality: { total, interpolated, exact, discarded } }> {
    logger.info('Iniciando generación de eventos de estabilidad', { sessionId });

    // Obtener datos de la sesión
    const [stabilityData, gpsData, canData] = await Promise.all([
        prisma.stabilityMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        }),
        prisma.gpsMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        }),
        prisma.canMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' }
        })
    ]);

    if (stabilityData.length === 0) {
        logger.info('No hay datos de estabilidad para procesar', { sessionId });
        return { events: [], quality: { total: 0, interpolated: 0, exact: 0, discarded: 0 } };
    }

    // Configuración del algoritmo
    const eventWindow = 30000; // 30 segundos para agrupar eventos
    const eventDistance = 50; // 50 metros para agrupar eventos espacialmente

    // Crear mapas para búsqueda eficiente
    const gpsMap = new Map<string, GPSPoint>();
    gpsData.forEach(gps => {
        gpsMap.set(gps.timestamp.toISOString(), {
            timestamp: gps.timestamp.toISOString(),
            latitude: gps.latitude,
            longitude: gps.longitude,
            speed: gps.speed
        });
    });

    const canMap = new Map<string, CANPoint>();
    canData.forEach(can => {
        canMap.set(can.timestamp.toISOString(), {
            timestamp: can.timestamp.toISOString(),
            engineRPM: can.engineRpm,
            vehicleSpeed: can.vehicleSpeed,
            rotativo: true // Por defecto asumimos rotativo activo
        });
    });

    const generated: StabilityEvent[] = [];

    let interpolatedCount = 0;
    let exactCount = 0;
    let discardedCount = 0;

    // Filtrar solo puntos críticos (SI < 60%) para optimización
    const criticalPoints = stabilityData.filter(point => {
        const si = point.si;
        return typeof si === 'number' && !isNaN(si) && si >= 0 && si <= 1 && si < 0.6;
    });

    logger.info('Iniciando generación de eventos de estabilidad optimizada', {
        sessionId,
        totalStabilityPoints: stabilityData.length,
        criticalPointsToProcess: criticalPoints.length,
        gpsPoints: gpsData.length,
        canPoints: canData.length,
        filteredOut: stabilityData.length - criticalPoints.length
    });

    if (criticalPoints.length === 0) {
        logger.info('No hay puntos críticos para procesar', { sessionId });
        return { events: [], quality: { total: 0, interpolated: 0, exact: 0, discarded: 0 } };
    }

    for (let idx = 0; idx < criticalPoints.length; idx++) {
        const point = criticalPoints[idx];
        const si = point.si;

        // Clasificar nivel de riesgo según SI
        const level = classifyRiskLevel(si);
        if (!level) {
            continue; // No debería pasar por el filtro anterior, pero por seguridad
        }

        const currentTime = new Date(point.timestamp).getTime();
        const prevPoint = idx > 0 ? criticalPoints[idx - 1] : undefined;

        // Buscar datos GPS más cercanos
        let gps = gpsMap.get(point.timestamp.toISOString());
        let interpolated = false;
        if (!gps) {
            const targetTime = new Date(point.timestamp).getTime();
            let prevGps: GPSPoint | null = null;
            let nextGps: GPSPoint | null = null;
            for (const gpsPoint of gpsData) {
                const gpsTime = new Date(gpsPoint.timestamp).getTime();
                if (gpsTime <= targetTime) prevGps = gpsPoint;
                if (gpsTime > targetTime) {
                    nextGps = gpsPoint;
                    break;
                }
            }
            if (prevGps && nextGps) {
                const { lat, lon } = interpolateGPS(targetTime, prevGps, nextGps);
                gps = { ...prevGps, latitude: lat, longitude: lon };
                interpolated = true;
            } else if (prevGps) {
                gps = prevGps;
                exactCount++;
            } else if (nextGps) {
                gps = nextGps;
                exactCount++;
            } else {
                gps = undefined;
                discardedCount++;
            }
        } else {
            exactCount++;
        }
        // Si no hay GPS, continuar (descartar evento)
        if (!gps) {
            logger.warn('Evento sin posición GPS, descartado', { timestamp: point.timestamp });
            discardedCount++;
            continue;
        }

        const vehicleSpeed = gps.speed || 0;

        // Buscar datos CAN más cercanos (opcional)
        let closestCan: CANPoint | undefined;
        let minCanDiff = Infinity;
        for (const [ts, canPoint] of canMap) {
            const diff = Math.abs(currentTime - new Date(ts).getTime());
            if (diff < minCanDiff && diff < 5000) {
                minCanDiff = diff;
                closestCan = canPoint;
            }
        }

        // Los eventos se generan según directrices independientemente del estado del motor/rotativo
        // Si no hay datos CAN, usamos valores por defecto
        const canInfo = closestCan || {
            timestamp: point.timestamp.toISOString(),
            engineRPM: 0,
            vehicleSpeed: vehicleSpeed,
            rotativo: false
        };

        // Convertir a StabilityDataPoint para detectRolloverCause
        const stabilityPoint: StabilityDataPoint = {
            timestamp: point.timestamp.toISOString(),
            si: point.si,
            roll: point.roll,
            pitch: point.pitch,
            ay: point.ay,
            gz: point.gz,
            accmag: point.accmag
        };

        // Detectar causa del riesgo de vuelco
        const cause = detectRolloverCause(stabilityPoint, prevPoint ? {
            timestamp: prevPoint.timestamp.toISOString(),
            si: prevPoint.si,
            roll: prevPoint.roll,
            pitch: prevPoint.pitch,
            ay: prevPoint.ay,
            gz: prevPoint.gz,
            accmag: prevPoint.accmag
        } : undefined, vehicleSpeed);

        const tipos = causeToEventTypes(cause);

        // Logging solo para eventos críticos o cada 100 eventos
        if (level === 'critical' || idx % 100 === 0) {
            logger.debug('Evento detectado', {
                timestamp: point.timestamp,
                si: si * 100,
                level,
                cause,
                tipos,
                vehicleSpeed,
                hasCanData: !!closestCan,
                interpolated: interpolated
            });
        }

        // Agrupación optimizada: buscar solo en los últimos 10 eventos
        let merged = false;
        const searchLimit = Math.min(generated.length, 10);
        for (let j = generated.length - 1; j >= generated.length - searchLimit && j >= 0; j--) {
            const prevEvent = generated[j];
            const prevTime = new Date(prevEvent.timestamp).getTime();
            const dist = haversine(
                { lat: prevEvent.lat, lon: prevEvent.lon },
                { lat: gps.latitude, lon: gps.longitude }
            );

            if (Math.abs(currentTime - prevTime) <= eventWindow && dist <= eventDistance) {
                // Agrupar tipos y actualizar nivel si es necesario
                prevEvent.tipos = Array.from(new Set([...prevEvent.tipos, ...tipos]));
                if (compareStabilityLevel(level, prevEvent.level) > 0) {
                    prevEvent.level = level;
                }
                merged = true;
                break;
            }

            // Si el evento anterior está fuera de la ventana temporal, no seguir buscando
            if (currentTime - prevTime > eventWindow) break;
        }

        if (merged) continue;

        // Crear nuevo evento
        generated.push({
            id: `${point.timestamp}-${gps.latitude}-${gps.longitude}-${level}`,
            sessionId,
            timestamp: new Date(point.timestamp),
            lat: gps.latitude,
            lon: gps.longitude,
            level,
            perc: Math.round(si * 100), // Convertir a porcentaje directo (0=crítico, 1=estable)
            tipos,
            valores: {
                si: point.si,
                roll: point.roll,
                ay: point.ay,
                yaw: point.gz
            },
            can: {
                engineRPM: canInfo.engineRPM,
                vehicleSpeed: canInfo.vehicleSpeed,
                rotativo: canInfo.rotativo
            }
        });
    }

    logger.info('Eventos de estabilidad generados optimizados', {
        sessionId,
        total: generated.length,
        stabilityDataPoints: stabilityData.length,
        criticalPointsProcessed: criticalPoints.length,
        gpsPoints: gpsData.length,
        canPoints: canData.length,
        eventsByLevel: {
            critical: generated.filter(e => e.level === 'critical').length,
            danger: generated.filter(e => e.level === 'danger').length,
            moderate: generated.filter(e => e.level === 'moderate').length,
            punto_interes: generated.filter(e => e.level === 'punto_interes').length
        },
        eventsByCause: generated.reduce((acc, event) => {
            const cause = event.tipos[0] || 'unknown';
            acc[cause] = (acc[cause] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
        eventsWithCanData: generated.filter(e => e.can.engineRPM > 0).length,
        eventsWithoutCanData: generated.filter(e => e.can.engineRPM === 0).length
    });

    logger.info('Resumen generación de eventos de estabilidad', {
        sessionId,
        totalEvents: generated.length,
        interpolated: interpolatedCount,
        exact: exactCount,
        discarded: discardedCount
    });

    return {
        events: generated,
        quality: {
            total: generated.length,
            interpolated: interpolatedCount,
            exact: exactCount,
            discarded: discardedCount
        }
    };
}

/**
 * Guarda eventos de estabilidad en la base de datos
 */
export async function saveStabilityEvents(events: StabilityEvent[]): Promise<void> {
    if (events.length === 0) {
        logger.info('No hay eventos para guardar');
        return;
    }

    try {
        // Usar createMany para inserción masiva optimizada
        await prisma.stabilityEvent.createMany({
            data: events.map(event => ({
                id: event.id,
                session_id: event.sessionId,
                timestamp: event.timestamp,
                lat: event.lat,
                lon: event.lon,
                type: `${event.level}:${event.tipos.join(',')}`,
                details: {
                    level: event.level,
                    perc: event.perc,
                    tipos: event.tipos,
                    valores: event.valores,
                    can: event.can
                }
            })),
            skipDuplicates: true
        });

        logger.info('Eventos de estabilidad guardados', {
            count: events.length,
            sessionId: events[0]?.sessionId
        });
    } catch (error) {
        logger.error('Error guardando eventos de estabilidad', { error });
        throw error;
    }
}

/**
 * Función de compatibilidad: procesa y guarda eventos de estabilidad
 * Esta función mantiene la compatibilidad con el código existente
 */
export async function processAndSaveStabilityEvents(
    sessionId: string,
    stabilityData?: StabilityDataPoint[],
    gpsData?: GPSPoint[],
    canData?: CANPoint[]
): Promise<void> {
    logger.info('Procesando eventos de estabilidad (función de compatibilidad)', {
        sessionId,
        stabilityPoints: stabilityData?.length || 0,
        gpsPoints: gpsData?.length || 0,
        canPoints: canData?.length || 0
    });

    // Usar la nueva función generateStabilityEvents que lee desde la base de datos
    const result = await generateStabilityEvents(sessionId);
    const events = result.events;
    const quality = result.quality;

    if (Array.isArray(events) && events.length > 0) {
        await saveStabilityEvents(events);
    }

    logger.info('Procesamiento completado (función de compatibilidad)', {
        sessionId,
        eventsGenerated: Array.isArray(events) ? events.length : 0,
        quality
    });
}

/**
 * Obtiene eventos de estabilidad para una sesión
 */
export async function getStabilityEvents(sessionId: string, filters?: any): Promise<any[]> {
    try {
        logger.info('Buscando eventos de estabilidad', { sessionId, filters });

        // Verificar que la sesión existe
        const session = await prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            logger.warn('Sesión no encontrada', { sessionId });
            return [];
        }

        const events = await prisma.stabilityEvent.findMany({
            where: { session_id: sessionId },
            orderBy: { timestamp: 'desc' }
        });

        logger.info('Eventos encontrados en BD', { sessionId, count: events.length });

        const formattedEvents = events.map(event => {
            let details: any = {};

            // Parse del JSON details
            if (event.details && typeof event.details === 'object') {
                details = event.details;
            } else if (typeof event.details === 'string') {
                try {
                    details = JSON.parse(event.details);
                } catch (e) {
                    logger.warn('Error parsing event details JSON', { eventId: event.id, error: e });
                    details = {};
                }
            }

            return {
                id: event.id,
                timestamp: event.timestamp,
                lat: event.lat,
                lon: event.lon,
                level: details.level || 'unknown',
                perc: details.perc || 0,
                tipos: details.tipos || [],
                valores: details.valores || { si: 0, roll: 0, ay: 0, yaw: 0 },
                can: details.can || { engineRPM: 0, vehicleSpeed: 0, rotativo: false }
            };
        });

        // Aplicar filtros si se proporcionan
        let filteredEvents = formattedEvents;

        if (filters) {
            filteredEvents = formattedEvents.filter(event => {
                // Filtro por velocidad
                if (filters.speedFilter && filters.speedFilter !== 'all') {
                    const eventSpeed = event.can?.vehicleSpeed || 0;
                    if (eventSpeed < Number(filters.speedFilter)) {
                        return false;
                    }
                }

                // Filtro por RPM
                if (filters.rpmFilter && filters.rpmFilter !== 'all') {
                    const eventRpm = event.can?.engineRPM || 0;
                    if (eventRpm < Number(filters.rpmFilter)) {
                        return false;
                    }
                }

                // Filtro por rotativo
                if (filters.rotativoOnly) {
                    const eventRpm = event.can?.engineRPM || 0;
                    if (eventRpm <= 800) { // ROTATIVO_THRESHOLD
                        return false;
                    }
                }

                // Filtro por tipos de evento
                if (filters.selectedTypes && filters.selectedTypes.length > 0) {
                    if (!filters.selectedTypes.some((type: string) => event.tipos?.includes(type))) {
                        return false;
                    }
                }

                return true;
            });
        }

        logger.info('Eventos de estabilidad obtenidos', {
            sessionId,
            totalEvents: events.length,
            filteredEvents: filteredEvents.length,
            filters
        });

        return filteredEvents;
    } catch (error) {
        logger.error('Error obteniendo eventos de estabilidad', { error, sessionId });
        throw error;
    }
}

// Añadir función de interpolación lineal entre dos puntos GPS
function interpolateGPS(eventTime: number, prev: GPSPoint, next: GPSPoint): { lat: number, lon: number } {
    const t0 = new Date(prev.timestamp).getTime();
    const t1 = new Date(next.timestamp).getTime();
    if (t1 === t0) return { lat: prev.latitude, lon: prev.longitude };
    const ratio = (eventTime - t0) / (t1 - t0);
    const lat = prev.latitude + (next.latitude - prev.latitude) * ratio;
    const lon = prev.longitude + (next.longitude - prev.longitude) * ratio;
    return { lat, lon };
}

export const StabilityEventService = {
    generateStabilityEvents,
    saveStabilityEvents,
    processAndSaveStabilityEvents,
    getStabilityEvents
}; 