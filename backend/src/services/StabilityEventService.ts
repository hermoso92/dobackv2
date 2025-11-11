
import haversine from 'haversine-distance';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';



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

export type StabilityLevel = 'critical' | 'danger' | 'moderate' | 'punto_interes' | 'GRAVE' | 'MODERADA' | 'LEVE';

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
        samples?: number;
        durationMs?: number;
    };
    can: {
        engineRPM: number;
        vehicleSpeed: number;
        rotativo: boolean;
    };
}

/**
 * ✅ CLASIFICACIÓN DE SEVERIDAD POR SI (REGLAS M3)
 * Regla absoluta: Un evento solo puede generarse si 0 ≤ SI < 0.50
 */
function clasificarSeveridadPorSI(si: number): 'GRAVE' | 'MODERADA' | 'LEVE' | null {
    // ✅ REGLA M3: Solo generar eventos si SI < 0.50
    if (si >= 0.50) return null;

    // ✅ CLASIFICACIÓN M3:
    if (si < 0.20) return 'GRAVE';      // 🔴 Riesgo extremo o vuelco inminente
    if (si < 0.35) return 'MODERADA';   // 🟠 Deslizamiento controlable
    return 'LEVE';                      // 🟡 Maniobra exigida pero estable
}

/**
 * @deprecated Usar clasificarSeveridadPorSI() según reglas M3
 */
function classifyRiskLevel(si: number): StabilityLevel | null {
    const severidad = clasificarSeveridadPorSI(si);
    if (!severidad) return null;

    // Mapear a tipos legacy
    switch (severidad) {
        case 'GRAVE': return 'critical';
        case 'MODERADA': return 'danger';
        case 'LEVE': return 'moderate';
        default: return null;
    }
}

/**
 * ✅ DETECTA TIPOS DE EVENTOS SEGÚN REGLAS M3
 */
function detectarTipoEventoM3(
    curr: StabilityDataPoint,
    prev?: StabilityDataPoint,
    vehicleSpeed: number = 0
): string {
    const si = curr.si;
    const roll = Math.abs(curr.roll || 0);
    const ay = Math.abs(curr.ay);
    const gx = Math.abs(curr.gz); // ✅ Usar gz (yaw rate) en lugar de gx
    const gz = Math.abs(curr.gz);

    // ✅ VUELCO_INMINENTE: si < 0.10 y (roll > 10° o gx > 30°/s)
    if (si < 0.10 && (roll > 10 || gx > 30)) {
        return 'VUELCO_INMINENTE';
    }

    // ✅ DERIVA_PELIGROSA: gx > 45°/s y si < 0.50
    if (gx > 45 && si < 0.50) {
        return 'DERIVA_PELIGROSA';
    }

    // ✅ MANIOBRA_BRUSCA: ay > 3 m/s²
    if (ay > 3) {
        return 'MANIOBRA_BRUSCA';
    }

    // ✅ DERIVA_LATERAL_SIGNIFICATIVA: yaw_rate - ay/v > 0.15 rad/s
    const yawRate = gz;
    const lateralDeriva = Math.abs(yawRate - (ay / Math.max(vehicleSpeed, 1)));
    if (lateralDeriva > 0.15) {
        return 'DERIVA_LATERAL_SIGNIFICATIVA';
    }

    // ✅ CAMBIO_CARGA: Δroll > 10% y Δsi > 10% y si < 0.50
    if (prev) {
        const deltaRoll = Math.abs(roll - Math.abs(prev.roll || 0));
        const deltaSi = Math.abs(si - prev.si);
        if (deltaRoll > 10 && deltaSi > 0.10 && si < 0.50) {
            return 'CAMBIO_CARGA';
        }
    }

    // ✅ RIESGO_VUELCO: si < 0.50 (caso general)
    if (si < 0.50) {
        return 'RIESGO_VUELCO';
    }

    return 'RIESGO_VUELCO'; // Por defecto
}

/**
 * @deprecated Usar detectarTipoEventoM3() según reglas M3
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
    const CLUSTER_TIME_WINDOW_MS = 120000; // 2 minutos de ventana temporal
    const CLUSTER_DISTANCE_METERS = 1000; // 1 km base para agrupar eventos
    const DISTANCE_TOLERANCE_MULTIPLIER = 3; // Tolerancia extra basada en velocidad estimada

    const severityPriority: Record<'GRAVE' | 'MODERADA' | 'LEVE', number> = {
        GRAVE: 3,
        MODERADA: 2,
        LEVE: 1
    };

    type EventSeverity = 'GRAVE' | 'MODERADA' | 'LEVE';

    type CandidatePoint = {
        timestamp: Date;
        severity: EventSeverity;
        tipo: string;
        si: number;
        roll: number | null;
        ay: number;
        yaw: number;
        lat: number;
        lon: number;
        can: {
            engineRPM: number;
            vehicleSpeed: number;
            rotativo: boolean;
        };
    };

    type EventCluster = {
        startTimestamp: number;
        lastTimestamp: number;
        startDate: Date;
        lastDate: Date;
        lastPoint: {
            lat: number;
            lon: number;
            speed: number;
        };
        representative: CandidatePoint;
        tipos: Set<string>;
        samples: number;
    };

    let currentCluster: EventCluster | null = null;
    let clustersCreated = 0;
    let mergedSamples = 0;

    const finalizeCluster = () => {
        if (!currentCluster) {
            return;
        }

        const cluster = currentCluster;
        const durationMs = Math.max(0, cluster.lastTimestamp - cluster.startTimestamp);
        const representative = cluster.representative;
        const tipos = Array.from(cluster.tipos);

        generated.push({
            id: `${sessionId}-${representative.timestamp.toISOString()}-${cluster.samples}`,
            sessionId,
            timestamp: representative.timestamp,
            lat: representative.lat,
            lon: representative.lon,
            level: representative.severity,
            perc: Math.round(representative.si * 100),
            tipos,
            valores: {
                si: representative.si,
                roll: representative.roll,
                ay: representative.ay,
                yaw: representative.yaw,
                samples: cluster.samples,
                durationMs
            },
            can: representative.can
        });

        mergedSamples += Math.max(0, cluster.samples - 1);
        clustersCreated += 1;
        currentCluster = null;
    };

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

    // ✅ FILTRAR SOLO PUNTOS CRÍTICOS (REGLAS M3: SI < 0.50)
    const criticalPoints = stabilityData.filter(point => {
        const si = point.si;
        return typeof si === 'number' && !isNaN(si) && si >= 0 && si <= 1 && si < 0.50;
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

        // ✅ CLASIFICAR SEVERIDAD SEGÚN REGLAS M3
        const severidad = clasificarSeveridadPorSI(si);
        if (!severidad) {
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
                const gpsPointConverted: GPSPoint = {
                    timestamp: gpsPoint.timestamp.toISOString(),
                    latitude: gpsPoint.latitude,
                    longitude: gpsPoint.longitude,
                    speed: gpsPoint.speed
                };
                if (gpsTime <= targetTime) prevGps = gpsPointConverted;
                if (gpsTime > targetTime) {
                    nextGps = gpsPointConverted;
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

        // ✅ DETECTAR TIPO DE EVENTO SEGÚN REGLAS M3
        const tipoEvento = detectarTipoEventoM3(stabilityPoint, prevPoint ? {
            timestamp: prevPoint.timestamp.toISOString(),
            si: prevPoint.si,
            roll: prevPoint.roll,
            pitch: prevPoint.pitch,
            ay: prevPoint.ay,
            gz: prevPoint.gz,
            accmag: prevPoint.accmag
        } : undefined, vehicleSpeed);

        // ✅ LOGGING SEGÚN REGLAS M3
        if (severidad === 'GRAVE' || idx % 100 === 0) {
            logger.debug('Evento detectado', {
                timestamp: point.timestamp,
                si: si, // ✅ SI en formato 0-1 (no multiplicar por 100)
                severidad,
                tipoEvento,
                vehicleSpeed,
                hasCanData: !!closestCan,
                interpolated: interpolated
            });
        }

        const candidate: CandidatePoint = {
            timestamp: new Date(point.timestamp),
            severity: severidad,
            tipo: tipoEvento,
            si: point.si,
            roll: point.roll,
            ay: point.ay,
            yaw: point.gz,
            lat: gps.latitude,
            lon: gps.longitude,
            can: {
                engineRPM: canInfo.engineRPM,
                vehicleSpeed: canInfo.vehicleSpeed,
                rotativo: canInfo.rotativo
            }
        };

        if (!currentCluster) {
            currentCluster = {
                startTimestamp: candidate.timestamp.getTime(),
                lastTimestamp: candidate.timestamp.getTime(),
                startDate: candidate.timestamp,
                lastDate: candidate.timestamp,
                lastPoint: {
                    lat: candidate.lat,
                    lon: candidate.lon,
                    speed: candidate.can.vehicleSpeed
                },
                representative: candidate,
                tipos: new Set([candidate.tipo]),
                samples: 1
            };
            continue;
        }

        const timeDiff = candidate.timestamp.getTime() - currentCluster.lastTimestamp;
        const distance = haversine(
            { lat: currentCluster.lastPoint.lat, lon: currentCluster.lastPoint.lon },
            { lat: candidate.lat, lon: candidate.lon }
        );

        const referenceSpeed = candidate.can.vehicleSpeed || currentCluster.representative.can.vehicleSpeed || 0;
        const expectedMeters = (referenceSpeed * (timeDiff / 3600000)) * 1000;
        const dynamicDistanceLimit = Math.max(CLUSTER_DISTANCE_METERS, expectedMeters * DISTANCE_TOLERANCE_MULTIPLIER);

        if (timeDiff <= CLUSTER_TIME_WINDOW_MS && distance <= dynamicDistanceLimit) {
            currentCluster.lastTimestamp = candidate.timestamp.getTime();
            currentCluster.lastDate = candidate.timestamp;
            currentCluster.lastPoint = {
                lat: candidate.lat,
                lon: candidate.lon,
                speed: candidate.can.vehicleSpeed
            };
            currentCluster.samples += 1;
            currentCluster.tipos.add(candidate.tipo);

            const currentPriority = severityPriority[currentCluster.representative.severity];
            const candidatePriority = severityPriority[candidate.severity];
            const isCandidateMoreSevere = candidatePriority > currentPriority;
            const isSameSeverityButWorse = candidatePriority === currentPriority && candidate.si < currentCluster.representative.si;

            if (isCandidateMoreSevere || isSameSeverityButWorse) {
                currentCluster.representative = candidate;
            }

            continue;
        }

        finalizeCluster();

        currentCluster = {
            startTimestamp: candidate.timestamp.getTime(),
            lastTimestamp: candidate.timestamp.getTime(),
            startDate: candidate.timestamp,
            lastDate: candidate.timestamp,
            lastPoint: {
                lat: candidate.lat,
                lon: candidate.lon,
                speed: candidate.can.vehicleSpeed
            },
            representative: candidate,
            tipos: new Set([candidate.tipo]),
            samples: 1
        };
    }

    finalizeCluster();

    logger.info('Eventos de estabilidad generados optimizados', {
        sessionId,
        total: generated.length,
        stabilityDataPoints: stabilityData.length,
        criticalPointsProcessed: criticalPoints.length,
        gpsPoints: gpsData.length,
        canPoints: canData.length,
        clustersCreated,
        mergedSamples,
        compressionRatio: clustersCreated > 0 ? Number((criticalPoints.length / clustersCreated).toFixed(2)) : null,
        eventsByLevel: {
            GRAVE: generated.filter(e => e.level === 'GRAVE').length,
            MODERADA: generated.filter(e => e.level === 'MODERADA').length,
            LEVE: generated.filter(e => e.level === 'LEVE').length
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
        await prisma.stability_events.createMany({
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

        const events = await prisma.stability_events.findMany({
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
