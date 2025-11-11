/**
 * Rutas API para KPIs operativos.
 * Implementación TypeScript para backend Node.js/Express
 * ACTUALIZADO: Usa kpiCalculator con datos reales + Redis Caché
 * 06/Nov/2025: Añadida validación organizationId (ChatGPT P0 CRÍTICO)
 */
import { Prisma } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { prisma, withPrismaReconnect } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { validateOrganization } from '../middleware/validateOrganization';
import { kpiCacheService } from '../services/KPICacheService';
import { VehicleState, VehicleStateTracker } from '../services/VehicleStateTracker';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('KPIRoutes');

// Función auxiliar para formatear duración
function formatDuration(seconds: number): string {
    if (seconds < 0) seconds = 0;
    const totalMinutes = Math.floor(seconds / 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return `${days}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`;
}

const KPI_TIME_ZONE = 'Europe/Madrid';
const KPI_DEFAULT_KEY: OperationalKey = 1;
const KPI_CONTINUITY_TTL_DAYS = 14;
const KPI_CONTINUITY_TTL_SECONDS = KPI_CONTINUITY_TTL_DAYS * 24 * 3600;
const KPI_KEY_TTLS: Partial<Record<OperationalKey, number>> = {
    0: 24 * 3600,      // Clave 0 (taller) máximo 24h
    2: 6 * 3600,       // Clave 2 (emergencia) máximo 6h
    3: 6 * 3600,       // Clave 3 (siniestro) máximo 6h
    5: 3600            // Clave 5 (regreso) máximo 1h
};
const KPI_KEYS: ReadonlyArray<OperationalKey> = [0, 1, 2, 3, 5];
const KPI_STATE_NAMES: Record<OperationalKey, string> = {
    0: 'Taller',
    1: 'Operativo en Parque',
    2: 'Salida en Emergencia',
    3: 'En Siniestro',
    5: 'Regreso al Parque'
};

const kpiDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KPI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const kpiDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: KPI_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
});

interface DayBoundary {
    start: Date;
    end: Date;
    localLabel: string;
}

type OperationalKey = 0 | 1 | 2 | 3 | 5;

type DurationMap = Record<OperationalKey, number>;

interface RawSegmentRecord {
    vehicleId: string;
    sessionId: string;
    clave: number;
    startTime: Date;
    endTime: Date | null;
}

interface TimelineSegmentEntry {
    vehicleId: string;
    clave: OperationalKey;
    start: Date;
    end: Date;
    inferred: boolean;
}

function createEmptyDurationMap(): DurationMap {
    return { 0: 0, 1: 0, 2: 0, 3: 0, 5: 0 };
}

function clipDurationToRange(
    segmentStart: Date,
    segmentEnd: Date | null,
    rangeStart?: Date,
    rangeEndExclusive?: Date
): number {
    const safeEnd = segmentEnd ?? new Date();
    const startMs = segmentStart.getTime();
    const endMs = Math.max(safeEnd.getTime(), startMs);

    let clippedStart = startMs;
    let clippedEnd = endMs;

    if (rangeStart) {
        clippedStart = Math.max(clippedStart, rangeStart.getTime());
    }
    if (rangeEndExclusive) {
        clippedEnd = Math.min(clippedEnd, rangeEndExclusive.getTime());
    }

    const duration = clippedEnd - clippedStart;
    return duration > 0 ? duration / 1000 : 0;
}

// Normaliza SI almacenado como 0.009 → 0.9 y restringe a [0, 1]
function normalizeSi(raw: unknown): number | null {
    if (raw === null || raw === undefined) return null;
    const value = Number(raw);
    if (!Number.isFinite(value)) {
        return null;
    }

    if (value < 0) {
        return Math.max(value, 0);
    }

    // Valores muy pequeños (0.009 → 0.9) se escalan cuando el resultado permanece bajo 1.2
    if (value > 0 && value < 0.2) {
        const scaled = value * 100;
        if (scaled <= 1.2) {
            return Math.min(Math.max(scaled, 0), 1);
        }
    }

    // Valores almacenados como porcentajes (90 → 0.9)
    if (value > 1 && value <= 120) {
        return Math.min(Math.max(value / 100, 0), 1);
    }

    return Math.min(Math.max(value, 0), 1);
}

function makeFallbackKey(sessionId: string, timestamp: Date): string {
    return `${sessionId}|${timestamp.getTime()}`;
}

async function buildFallbackSiMap(
    events: Array<{ session_id: string; bucket: Date; raw_si: number | null }>
): Promise<Map<string, number>> {
    const fallbackMap = new Map<string, number>();

    const eventsNeedingFallback = events.filter(event => {
        const normalized = normalizeSi(event.raw_si);
        return normalized === null || normalized === 0;
    });

    if (eventsNeedingFallback.length === 0) {
        return fallbackMap;
    }

    const grouped = new Map<string, Date[]>();
    for (const event of eventsNeedingFallback) {
        if (!grouped.has(event.session_id)) {
            grouped.set(event.session_id, []);
        }
        grouped.get(event.session_id)!.push(event.bucket);
    }

    for (const [sessionId, buckets] of grouped.entries()) {
        if (buckets.length === 0) {
            continue;
        }

        const timestampsMs = buckets.map(bucket => bucket.getTime());
        const minWindow = Math.min(...timestampsMs) - 30_000;
        const maxWindow = Math.max(...timestampsMs) + 30_000;

        const measurements = await withPrismaReconnect(() => prisma.stabilityMeasurement.findMany({
            where: {
                sessionId,
                timestamp: {
                    gte: new Date(minWindow),
                    lte: new Date(maxWindow)
                }
            },
            select: {
                timestamp: true,
                si: true
            },
            orderBy: {
                timestamp: 'asc'
            }
        }));

        if (measurements.length === 0) {
            continue;
        }

        for (const bucket of buckets) {
            let closestSi: number | null = null;
            let closestDiff = Number.POSITIVE_INFINITY;

            for (const measurement of measurements) {
                const normalizedMeasurement = normalizeSi(measurement.si);
                if (normalizedMeasurement === null || normalizedMeasurement === 0) {
                    continue;
                }

                const diff = Math.abs(measurement.timestamp.getTime() - bucket.getTime());
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestSi = normalizedMeasurement;
                    if (diff === 0) {
                        break;
                    }
                }
            }

            if (closestSi !== null) {
                fallbackMap.set(makeFallbackKey(sessionId, bucket), closestSi);
            }
        }
    }

    return fallbackMap;
}

function mapSeverity(severity?: string | null): 'critical' | 'moderate' | 'light' {
    if (!severity) return 'light';
    const normalized = severity.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    if (normalized.includes('cri') || normalized.includes('grav')) return 'critical';
    if (normalized.includes('mod')) return 'moderate';
    return 'light';
}

function getReadableType(type?: string | null, typeMap?: Record<string, string>): string {
    if (!type) return 'SIN_TIPO';
    const normalized = typeMap?.[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return normalized;
}

// Función auxiliar para calcular distancia Haversine
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


interface KPIFilters {
    from?: string;
    to?: string;
    vehicleIds?: string[];
    organizationId: string;
}

/**
 * GET /api/v1/kpis/test
 * Endpoint de prueba simple
 */
router.get('/test', authenticate, async (req: Request, res: Response) => {
    try {
        logger.info('🧪 Endpoint de prueba ejecutándose');
        res.json({
            success: true,
            message: 'Endpoint de prueba funcionando',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        logger.error('Error en endpoint de prueba:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/summary
 * Retorna resumen completo con todos los KPIs
 */
// ✅ CHATGPT P0 CRÍTICO: Validar organizationId antes de procesar
router.get('/summary',
    authenticate,
    validateOrganization,
    cacheMiddleware({ ttl: 300, keyPrefix: 'kpis' }), // ✅ Caché de 5 minutos
    async (req: Request, res: Response) => {
        try {
            logger.info('🚀 Iniciando /api/kpis/summary');

            const organizationId = (req as any).user?.organizationId;

            if (!organizationId) {
                logger.error('❌ Organization ID not found');
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID not found'
                });
            }

            // Aceptar ambos formatos: from/to y startDate/endDate (compatibilidad frontend)
            const from = (req.query.from as string) || (req.query.startDate as string);
            const to = (req.query.to as string) || (req.query.endDate as string);
            const force = (req.query.force as string) === 'true';

            // MANDAMIENTO M8.1: Validar rango de fechas obligatorio
            logger.info('📅 Validando fechas', { from, to });
            if (!from || !to) {
                logger.error('❌ Fechas faltantes:', { from, to });
                return res.status(400).json({
                    success: false,
                    error: 'Rango de fechas obligatorio: from y to (YYYY-MM-DD)'
                });
            }

            // IMPORTANTE: Express puede parsear como vehicleIds[] O vehicleIds
            const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
            let vehicleIds: string[] | undefined;

            if (vehicleIdsRaw) {
                if (Array.isArray(vehicleIdsRaw)) {
                    vehicleIds = vehicleIdsRaw as string[];
                } else {
                    // Si es string, puede venir separado por comas
                    const vehicleIdsStr = vehicleIdsRaw as string;
                    vehicleIds = vehicleIdsStr.includes(',')
                        ? vehicleIdsStr.split(',').map(id => id.trim())
                        : [vehicleIdsStr];
                }
            }

            // DEBUG: Ver qué parámetros llegan
            logger.info('📊 Filtros recibidos en /api/kpis/summary', {
                from,
                to,
                vehicleIds,
                queryCompleta: req.query,
                vehicleIdsLength: vehicleIds?.length || 0
            });

            // Construir filtros de fecha (usar fin de día exclusivo para 'to')
            let dateFrom: Date | undefined;
            let dateToExclusive: Date | undefined;

            if (from && to) {
                dateFrom = new Date(from);
                const toDate = new Date(to);
                // Hacer 'to' inclusivo llevando el límite a < (to + 1 día)
                dateToExclusive = new Date(toDate.getTime());
                dateToExclusive.setDate(dateToExclusive.getDate() + 1);
            }

            // Si se solicita forzar, invalidar cache de KPIs para esta organización
            if (force) {
                try {
                    kpiCacheService.invalidate(organizationId);
                    logger.info('Cache de KPIs invalidado por force=true');
                } catch (e: any) {
                    logger.warn('No se pudo invalidar cache de KPIs', { error: e?.message });
                }
            }

            // Consultar sesiones básicas
            let sessions: Array<{ id: string; startTime: Date; endTime: Date | null; vehicleId: string }> = [];
            let sessionIds: string[] = [];

            try {
                logger.info('🔍 Consultando sesiones...');

                // Construir filtro de sesiones
                const sessionsWhere: any = { organizationId };

                if (vehicleIds && vehicleIds.length > 0) {
                    sessionsWhere.vehicleId = { in: vehicleIds };
                }

                if (dateFrom && dateToExclusive) {
                    sessionsWhere.startTime = {
                        gte: dateFrom,
                        lt: dateToExclusive
                    };
                }

                sessions = await withPrismaReconnect(() => prisma.session.findMany({
                    where: sessionsWhere,
                    select: { id: true, startTime: true, endTime: true, vehicleId: true }
                }));

                sessionIds = sessions.map(s => s.id);
                logger.info(`✅ Encontradas ${sessions.length} sesiones`);

            } catch (e: any) {
                logger.error('❌ Error consultando sesiones:', e);
                return res.status(500).json({
                    success: false,
                    error: 'Error consultando sesiones'
                });
            }

            // Calcular KPIs reales basados en las sesiones encontradas
            logger.info(`📊 Calculando KPIs para ${sessions.length} sesiones`);

            let summary: any = {
                states: {
                    states: [],
                    total_time_seconds: 0,
                    total_time_formatted: '00:00:00',
                    time_outside_station: 0,
                    time_outside_formatted: '00:00:00'
                },
                activity: {
                    km_total: 0,
                    driving_hours: 0,
                    driving_hours_formatted: '00:00:00',
                    rotativo_on_seconds: 0,
                    rotativo_on_percentage: 0,
                    rotativo_on_formatted: '00:00:00',
                    emergency_departures: 0,
                    average_speed: 0
                },
                stability: {
                    total_incidents: 0,
                    critical: 0,
                    moderate: 0,
                    light: 0
                },
                metadata: {
                    sesiones_analizadas: sessions.length,
                    fecha_calculo: new Date().toISOString()
                }
            };

            let timeOutside = 0;

            // Asegurar que el cálculo de estabilidad se ejecute siempre
            if (sessionIds.length > 0) {
                logger.info('🔍 Ejecutando cálculos con sesiones filtradas');
            } else {
                logger.warn('⚠️ No hay sessionIds, usando valores por defecto');
            }

            if (sessionIds.length > 0) {
                let totalTime = 0;
                let rotativoSeconds = 0;
                let emergencyDepartures = 0;

                try {
                    logger.info('🔑 Calculando estados operacionales agregados', { sessionIdsCount: sessionIds.length });

                    const rangeStart = dateFrom;
                    const rangeEndExclusive = dateToExclusive;

                    let dayBoundaries = buildDayBoundaries(rangeStart, rangeEndExclusive);
                    if (dayBoundaries.length === 0 && rangeStart && rangeEndExclusive) {
                        dayBoundaries = [{
                            start: rangeStart,
                            end: rangeEndExclusive,
                            localLabel: getLocalDateString(rangeStart)
                        }];
                    }

                    const rawSegments = await withPrismaReconnect(() => prisma.operational_state_segments.findMany({
                        where: {
                            sessionId: { in: sessionIds },
                            ...(rangeStart && rangeEndExclusive ? {
                                AND: [
                                    { startTime: { lt: rangeEndExclusive } },
                                    { endTime: { gt: rangeStart } }
                                ]
                            } : {})
                        },
                        select: {
                            sessionId: true,
                            clave: true,
                            startTime: true,
                            endTime: true,
                            Session: {
                                select: { vehicleId: true }
                            }
                        }
                    }));

                    const segmentsByVehicle = new Map<string, RawSegmentRecord[]>();
                    const vehiclesInRange = new Set<string>();

                    for (const session of sessions) {
                        if (session.vehicleId) {
                            vehiclesInRange.add(session.vehicleId);
                        }
                    }

                    for (const segment of rawSegments) {
                        const vehicleId = segment.Session?.vehicleId;
                        if (!vehicleId) {
                            continue;
                        }
                        vehiclesInRange.add(vehicleId);
                        if (!segmentsByVehicle.has(vehicleId)) {
                            segmentsByVehicle.set(vehicleId, []);
                        }
                        segmentsByVehicle.get(vehicleId)!.push({
                            vehicleId,
                            sessionId: segment.sessionId,
                            clave: segment.clave,
                            startTime: segment.startTime,
                            endTime: segment.endTime
                        });
                    }

                    const trackerStates = await loadVehicleStates(Array.from(vehiclesInRange));

                    const timelineAggregation = buildTimelineAggregation({
                        vehicles: Array.from(vehiclesInRange),
                        dayBoundaries,
                        segmentsByVehicle,
                        trackerStates,
                        ttlSeconds: KPI_CONTINUITY_TTL_SECONDS,
                        defaultKey: KPI_DEFAULT_KEY
                    });

                    timelineAggregation.perDayTotals.forEach(entry => {
                        const expectedSeconds = (entry.dayEnd.getTime() - entry.dayStart.getTime()) / 1000;
                        const delta = Math.abs(expectedSeconds - entry.totalSeconds);
                        const level = delta <= 60 ? 'debug' : 'warn';
                        logger[level === 'warn' ? 'warn' : 'debug']('🗓️ Validación diaria de timeline', {
                            vehicleId: entry.vehicleId,
                            day: entry.localLabel,
                            totalSeconds: entry.totalSeconds,
                            expectedSeconds,
                            deltaSeconds: Math.round(delta)
                        });
                    });

                    const durations = timelineAggregation.durations;
                    const counts = timelineAggregation.counts;

                    // Calcular totalTime como suma de todas las claves (no suma de vehículos)
                    const sumOfAllKeys = KPI_KEYS.reduce((sum, clave) => sum + durations[clave], 0);
                    totalTime = sumOfAllKeys;

                    // Validar que la suma de claves coincida con el total del timeline
                    const timelineTotal = timelineAggregation.totalSeconds;
                    const diff = Math.abs(sumOfAllKeys - timelineTotal);
                    if (diff > 1) { // Tolerancia de 1 segundo por errores de redondeo
                        logger.warn('⚠️ Inconsistencia en suma de claves vs timeline total', {
                            sumOfAllKeys,
                            timelineTotal,
                            diff
                        });
                        // Usar la suma de claves como fuente de verdad
                        totalTime = sumOfAllKeys;
                    }

                    timeOutside = durations[2] + durations[3] + durations[5];
                    rotativoSeconds = durations[2];
                    emergencyDepartures = counts[2];

                    const states = KPI_KEYS.map(clave => ({
                        key: clave,
                        name: KPI_STATE_NAMES[clave],
                        duration_seconds: durations[clave],
                        duration_formatted: formatDuration(durations[clave]),
                        count: counts[clave]
                    }));

                    summary.states = {
                        states,
                        total_time_seconds: totalTime,
                        total_time_formatted: formatDuration(totalTime),
                        time_outside_station: timeOutside,
                        time_outside_formatted: formatDuration(timeOutside)
                    };

                    logger.info(`✅ Estados agregados calculados`, {
                        totalTimeSeconds: totalTime,
                        timeOutsideSeconds: timeOutside
                    });

                    // -----------------------------------------------------------------
                    // Métricas de actividad
                    // -----------------------------------------------------------------
                    logger.info('📈 Calculando métricas de actividad');

                    const parseNumber = (value: any): number => {
                        if (value === null || value === undefined) return 0;
                        const asNumber = Number(value);
                        return Number.isFinite(asNumber) ? asNumber : 0;
                    };

                    let kmTotal = 0;
                    let drivingSeconds = durations[2] + durations[5];

                    const sessionAggregate = await withPrismaReconnect(() => prisma.session.aggregate({
                        where: {
                            id: { in: sessionIds }
                        },
                        _sum: {
                            matcheddistance: true,
                            matchedduration: true
                        }
                    }));

                    const matchedDistance = parseNumber(sessionAggregate._sum.matcheddistance ?? 0);
                    const matchedDuration = parseNumber(sessionAggregate._sum.matchedduration ?? 0);

                    if (matchedDistance > 0) {
                        kmTotal = matchedDistance / 1000;
                    }

                    if (matchedDuration > 0) {
                        drivingSeconds = matchedDuration;
                    }

                    if (kmTotal <= 0 || drivingSeconds <= 0) {
                        try {
                            const gpsWhere: any = {
                                sessionId: { in: sessionIds },
                                Session: { organizationId }
                            };

                            if (dateFrom && dateToExclusive) {
                                gpsWhere.timestamp = {
                                    gte: dateFrom,
                                    lt: dateToExclusive
                                };
                            }

                            const gpsPoints = await withPrismaReconnect(() => prisma.gpsMeasurement.findMany({
                                where: gpsWhere,
                                select: {
                                    sessionId: true,
                                    timestamp: true,
                                    latitude: true,
                                    longitude: true,
                                    speed: true,
                                    satellites: true
                                },
                                orderBy: [
                                    { sessionId: 'asc' },
                                    { timestamp: 'asc' }
                                ]
                            }));

                            const MAX_POINTS_ALLOWED = 200_000;
                            if (gpsPoints.length > MAX_POINTS_ALLOWED) {
                                logger.warn('Fallback GPS abortado: demasiados puntos a procesar', {
                                    puntos: gpsPoints.length,
                                    limite: MAX_POINTS_ALLOWED,
                                    rango: { from, to }
                                });
                            } else {

                                const toRad = (deg: number) => (deg * Math.PI) / 180;
                                const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                                    const R = 6371;
                                    const dLat = toRad(lat2 - lat1);
                                    const dLon = toRad(lon2 - lon1);
                                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                                    return R * c;
                                };

                                const MOVING_THRESHOLD_KMH = 2;
                                const MAX_REASONABLE_SPEED_KMH = 160;
                                const MAX_POINT_GAP_SECONDS = 90;

                                let fallbackKm = 0;
                                let fallbackDrivingSeconds = 0;

                                let previousPoint: typeof gpsPoints[number] | null = null;
                                for (const point of gpsPoints) {
                                    if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number') {
                                        continue;
                                    }
                                    const coordsValid = point.latitude > 35 && point.latitude < 45 && point.longitude > -10 && point.longitude < 5;
                                    const satellitesCount = typeof point.satellites === 'number' ? point.satellites : null;
                                    const satellitesValid = satellitesCount === null || satellitesCount >= 4;

                                    if (!coordsValid || !satellitesValid) {
                                        continue;
                                    }

                                    if (previousPoint && previousPoint.sessionId !== point.sessionId) {
                                        previousPoint = point;
                                        continue;
                                    }

                                    if (previousPoint) {
                                        const deltaSeconds = Math.min(
                                            MAX_POINT_GAP_SECONDS,
                                            Math.max(0, Math.floor((point.timestamp.getTime() - previousPoint.timestamp.getTime()) / 1000))
                                        );

                                        if (deltaSeconds > 0) {
                                            const segmentKm = haversineKm(previousPoint.latitude, previousPoint.longitude, point.latitude, point.longitude);
                                            const segmentSpeed = deltaSeconds > 0 ? (segmentKm / (deltaSeconds / 3600)) : 0;

                                            if (Number.isFinite(segmentSpeed) && segmentSpeed > 0) {
                                                const clampedSpeed = Math.min(MAX_REASONABLE_SPEED_KMH, Math.max(0, segmentSpeed));
                                                const sanitizedKm = clampedSpeed * (deltaSeconds / 3600);

                                                if (sanitizedKm > 0) {
                                                    fallbackKm += sanitizedKm;
                                                }

                                                if (clampedSpeed >= MOVING_THRESHOLD_KMH) {
                                                    fallbackDrivingSeconds += deltaSeconds;
                                                }
                                            }
                                        }
                                    }

                                    previousPoint = point;
                                }

                                if (kmTotal <= 0 && fallbackKm > 0) {
                                    kmTotal = fallbackKm;
                                }

                                if (drivingSeconds <= 0 && fallbackDrivingSeconds > 0) {
                                    drivingSeconds = fallbackDrivingSeconds;
                                }

                                if (fallbackKm > 0 || fallbackDrivingSeconds > 0) {
                                    logger.info('Actividad recalculada usando fallback de GPS', {
                                        kmTotalFallback: Math.round(fallbackKm * 10) / 10,
                                        drivingSecondsFallback: fallbackDrivingSeconds
                                    });
                                }
                            }
                        } catch (gpsError: any) {
                            logger.warn('No se pudo aplicar fallback de GPS para actividad', { error: gpsError?.message });
                        }
                    }

                    if (drivingSeconds <= 0) {
                        drivingSeconds = durations[2] + durations[5];
                    }
                    if (drivingSeconds <= 0) {
                        drivingSeconds = timeOutside;
                    }

                    const averageSpeed = drivingSeconds > 0 && kmTotal > 0
                        ? kmTotal / (drivingSeconds / 3600)
                        : 0;

                    const rotativoPercentage = totalTime > 0 ? (rotativoSeconds / totalTime) * 100 : 0;

                    summary.activity = {
                        km_total: Math.round(kmTotal * 10) / 10,
                        driving_hours: Math.round((drivingSeconds / 3600) * 10) / 10,
                        driving_hours_formatted: formatDuration(drivingSeconds),
                        rotativo_on_seconds: Math.round(rotativoSeconds),
                        rotativo_on_percentage: Math.round(rotativoPercentage * 10) / 10,
                        rotativo_on_formatted: formatDuration(rotativoSeconds),
                        emergency_departures: emergencyDepartures,
                        average_speed: Math.round(averageSpeed * 10) / 10
                    };

                    logger.info('✅ Actividad calculada', {
                        km_total: summary.activity.km_total,
                        driving_seconds: drivingSeconds,
                        rotativo_seconds: rotativoSeconds,
                        average_speed: summary.activity.average_speed,
                        emergency_departures: emergencyDepartures
                    });

                } catch (error) {
                    logger.error('❌ Error calculando estados u actividad:', error);
                }

                try {
                    // Calcular métricas de estabilidad
                    logger.info('⚖️ Calculando métricas de estabilidad');

                    // Obtener eventos con datos relacionados usando Prisma ORM
                    logger.info(`🔍 Obteniendo eventos para ${sessionIds.length} sesiones`);

                    const eventWhere: any = {
                        Session: {
                            organizationId
                        }
                    };

                    if (sessionIds.length > 0) {
                        eventWhere.session_id = { in: sessionIds };
                    }

                    if (dateFrom && dateToExclusive) {
                        eventWhere.timestamp = {
                            gte: dateFrom,
                            lt: dateToExclusive
                        };
                    }

                    if (vehicleIds && vehicleIds.length > 0) {
                        eventWhere.Session.vehicleId = { in: vehicleIds };
                    }

                    const typeMap: Record<string, string> = {
                        'dangerous_drift': 'Derrape Peligroso',
                        'rollover_risk': 'Riesgo de Vuelco',
                        'hard_braking': 'Frenada Brusca',
                        'sharp_turn': 'Giro Brusco',
                        'excessive_acceleration': 'Aceleración Excesiva',
                        'high_lateral_g': 'Fuerza Lateral Alta',
                        'stability_loss': 'Pérdida de Estabilidad'
                    };

                    const eventFilters: Prisma.Sql[] = [Prisma.sql`s."organizationId" = ${organizationId}`];
                    if (dateFrom && dateToExclusive) {
                        eventFilters.push(Prisma.sql`se."timestamp" >= ${dateFrom}`);
                        eventFilters.push(Prisma.sql`se."timestamp" < ${dateToExclusive}`);
                    }
                    if (vehicleIds && vehicleIds.length > 0) {
                        const vehicleList = Prisma.join(vehicleIds.map(id => Prisma.sql`${id}`), ', ');
                        eventFilters.push(Prisma.sql`s."vehicleId" = ANY(ARRAY[${vehicleList}]::text[])`);
                    }
                    if (sessionIds.length > 0) {
                        const sessionList = Prisma.join(sessionIds.map(id => Prisma.sql`${id}`), ', ');
                        eventFilters.push(Prisma.sql`se."session_id" = ANY(ARRAY[${sessionList}]::text[])`);
                    }
                    const whereClauseSql = eventFilters.length > 0
                        ? Prisma.join(eventFilters, ' AND ')
                        : Prisma.sql`TRUE`;

                    const dedupQuery = Prisma.sql`
                        WITH base AS (
                            SELECT
                                se."session_id",
                                se."timestamp",
                                se.type,
                                se.severity,
                                s."vehicleId",
                                s."startTime" AS session_start,
                                COALESCE(
                                    NULLIF(se.details->>'si', '')::numeric,
                                    NULLIF(se.details#>>'{valores,si}', '')::numeric
                                ) AS raw_si,
                                floor(EXTRACT(EPOCH FROM se."timestamp") / 10) AS bucket_key,
                                ROW_NUMBER() OVER (
                                    PARTITION BY se."session_id", se.type, floor(EXTRACT(EPOCH FROM se."timestamp") / 10)
                                    ORDER BY
                                        CASE
                                            WHEN se.severity ILIKE '%cri%' OR se.severity ILIKE '%grav%' THEN 1
                                            WHEN se.severity ILIKE '%mod%' THEN 2
                                            ELSE 3
                                        END,
                                        se."timestamp"
                                ) AS rn
                            FROM stability_events se
                            JOIN "Session" s ON se."session_id" = s.id
                            WHERE ${whereClauseSql}
                        )
                        SELECT
                            b."session_id",
                            to_timestamp(b.bucket_key * 10) AS bucket,
                            b.type,
                            b.severity,
                            b.raw_si,
                            v.identifier AS vehicle_identifier,
                            v.name AS vehicle_name,
                            b.session_start
                        FROM base b
                        JOIN "Vehicle" v ON v.id = b."vehicleId"
                        WHERE b.rn = 1
                        ORDER BY bucket DESC
                    `;

                    const dedupEvents = await prisma.$queryRaw<Array<{
                        session_id: string;
                        bucket: Date;
                        type: string | null;
                        severity: string | null;
                        raw_si: number | null;
                        vehicle_identifier: string | null;
                        vehicle_name: string | null;
                        session_start: Date | null;
                    }>>(dedupQuery);

                    const eventsByType: Record<string, number> = {};
                    const eventsBySeverity: Record<string, any[]> = {
                        critical: [],
                        moderate: [],
                        light: []
                    };
                    const severityCounters = {
                        critical: 0,
                        moderate: 0,
                        light: 0
                    };
                    const MAX_EVENTS_PER_SEVERITY = Number.MAX_SAFE_INTEGER;

                    const fallbackSiMap = await buildFallbackSiMap(dedupEvents);

                    let totalIncidents = 0;
                    let critical = 0;
                    let moderate = 0;
                    let light = 0;
                    let skippedForMissingSi = 0;

                    for (const event of dedupEvents) {
                        let normalizedSi = normalizeSi(event.raw_si);

                        if (normalizedSi === null || normalizedSi === 0) {
                            const fallbackValue = fallbackSiMap.get(makeFallbackKey(event.session_id, event.bucket));
                            if (fallbackValue !== undefined) {
                                normalizedSi = fallbackValue;
                            }
                        }

                        if (normalizedSi === null || normalizedSi === 0) {
                            logger.warn('⚠️ Evento sin SI válido, se omite en métricas', {
                                sessionId: event.session_id,
                                bucket: event.bucket.toISOString(),
                                rawSi: event.raw_si
                            });
                            skippedForMissingSi += 1;
                            continue;
                        }

                        if (normalizedSi >= 0.50) {
                            continue; // Fuera de rango: no debería contarse como incidencia
                        }

                        totalIncidents += 1;

                        const bucketKey = normalizedSi < 0.20 ? 'critical' : normalizedSi < 0.35 ? 'moderate' : 'light';

                        if (bucketKey === 'critical') critical += 1;
                        else if (bucketKey === 'moderate') moderate += 1;
                        else light += 1;

                        const typeReadable = getReadableType(event.type, typeMap);
                        eventsByType[typeReadable] = (eventsByType[typeReadable] || 0) + 1;

                        if (severityCounters[bucketKey] < MAX_EVENTS_PER_SEVERITY) {
                            eventsBySeverity[bucketKey].push({
                                session_id: event.session_id,
                                vehicle_identifier: event.vehicle_identifier || 'N/A',
                                vehicle_name: event.vehicle_name || '',
                                session_date: event.session_start,
                                tipo: typeReadable,
                                si: Number(normalizedSi.toFixed(3)),
                                timestamp: event.bucket
                            });
                            severityCounters[bucketKey] += 1;
                        }
                    }

                    const withoutSi = Math.max(skippedForMissingSi, 0);

                    summary.stability = {
                        total_incidents: totalIncidents,
                        critical,
                        moderate,
                        light,
                        por_tipo: eventsByType,
                        eventos_detallados: eventsBySeverity
                    };

                    logger.info('✅ Estabilidad calculada correctamente', {
                        totalIncidents,
                        critical,
                        moderate,
                        light,
                        eventosSinIndice: withoutSi
                    });

                } catch (e: any) {
                    logger.error('❌ Error calculando métricas de estabilidad:', e);
                    logger.error('❌ Stack trace:', e.stack);
                    // Asegurar que stability tenga valores por defecto
                    summary.stability = {
                        total_incidents: 0,
                        critical: 0,
                        moderate: 0,
                        light: 0
                    };
                }
            }

            // El cálculo de estabilidad ya se hizo arriba, no duplicar

            // Calcular quality metrics (índice de estabilidad)
            try {
                logger.info('📊 Calculando quality metrics');
                const siAggregate = await withPrismaReconnect(() => prisma.stabilityMeasurement.aggregate({
                    where: { sessionId: { in: sessionIds } },
                    _avg: { si: true },
                    _count: { si: true }
                }));

                const indicePromedio = normalizeSi(siAggregate._avg.si || 0) || 0;
                const totalMuestras = siAggregate._count.si || 0;

                let calificacion = 'DEFICIENTE';
                let estrellas = '⭐⭐';

                if (indicePromedio >= 0.90) {
                    calificacion = 'EXCELENTE';
                    estrellas = '⭐⭐⭐⭐⭐';
                } else if (indicePromedio >= 0.85) {
                    calificacion = 'BUENA';
                    estrellas = '⭐⭐⭐⭐';
                } else if (indicePromedio >= 0.75) {
                    calificacion = 'REGULAR';
                    estrellas = '⭐⭐⭐';
                }

                summary.quality = {
                    indice_promedio: indicePromedio,
                    calificacion,
                    estrellas,
                    total_muestras: totalMuestras
                };

                logger.info(`✅ Quality calculado: SI=${indicePromedio.toFixed(3)}, ${calificacion} ${estrellas}`);
            } catch (e: any) {
                logger.error('❌ Error calculando quality metrics:', e);
                summary.quality = {
                    indice_promedio: 0,
                    calificacion: 'N/A',
                    estrellas: '',
                    total_muestras: 0
                };
            }

            logger.info('✅ Enviando respuesta con KPIs calculados');
            return res.json({
                success: true,
                data: summary
            });

            /* CÓDIGO TEMPORALMENTE COMENTADO PARA DEBUGGING
            // IMPORTANTE: Express puede parsear como vehicleIds[] O vehicleIds
            const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
            const vehicleIds = vehicleIdsRaw
                ? (Array.isArray(vehicleIdsRaw)
                    ? vehicleIdsRaw
                    : [vehicleIdsRaw]) as string[]
                : undefined;
    
            // DEBUG: Ver qué parámetros llegan
            logger.info('📊 FILTROS RECIBIDOS EN /api/kpis/summary', {
                from,
                to,
                vehicleIds,
                queryCompleta: req.query,
                vehicleIdsLength: vehicleIds?.length || 0
            });
    
            // Construir filtros de fecha (usar fin de día exclusivo para 'to')
            let dateFrom: Date | undefined;
            let dateToExclusive: Date | undefined;
    
            if (from && to) {
                dateFrom = new Date(from);
                const toDate = new Date(to);
                // Hacer 'to' inclusivo llevando el límite a < (to + 1 día)
                dateToExclusive = new Date(toDate.getTime());
                dateToExclusive.setDate(dateToExclusive.getDate() + 1);
            }
    
            // Si se solicita forzar, invalidar cache de KPIs para esta organización
            if (force) {
                try {
                    kpiCacheService.invalidate(organizationId);
                    logger.info('Cache de KPIs invalidado por force=true');
                } catch (e: any) {
                    logger.warn('No se pudo invalidar cache de KPIs', { error: e?.message });
                }
            }
    
            // Importar prisma dinámicamente y calcular KPIs directamente
            logger.info('📦 Importando Prisma...');
            let prisma;
            try {
    
                prisma = prismaModule.prisma;
                logger.info('✅ Prisma importado exitosamente');
            } catch (e: any) {
                logger.error('❌ Error importando Prisma:', e);
                return res.status(500).json({
                    success: false,
                    error: 'Error de configuración de base de datos'
                });
            }
            
            // cambio aquí
            // Asegurar conexión estable antes de consultar
            try {
                logger.info('🔌 Conectando a Prisma...');
                await connectWithRetry(prisma, 4);
                logger.info('✅ Prisma conectado exitosamente');
            } catch (e: any) {
                logger.warn('⚠️ Prisma no conectado al iniciar resumen KPIs, reintentos agotados', { error: e?.message });
                return res.status(500).json({
                    success: false,
                    error: 'Error de conexión a base de datos'
                });
            }
    
            // cambio aquí
            // Selección por mediciones en rango si from/to están definidos; si no, fallback a startTime
            let sessions: Array<{ id: string; startTime: Date; endTime: Date | null; vehicleId: string }> = [];
            let sessionIds: string[] = [];
            let usedMeasurementRange = false;
    
            if (dateFrom && dateToExclusive) {
                usedMeasurementRange = true;
                // Buscar sesiones con mediciones en el rango (GPS y/o Rotativo)
                let gpsRows, rotRows;
                try {
                    logger.info('🔍 Buscando mediciones GPS...');
                    gpsRows = await prisma.gpsMeasurement.findMany({
                        where: {
                            timestamp: { gte: dateFrom, lt: dateToExclusive },
                            session: {
                                organizationId,
                                ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
                            }
                        },
                        select: { sessionId: true }
                    });
                    logger.info(`✅ Encontradas ${gpsRows.length} mediciones GPS`);
                    
                    logger.info('🔍 Buscando mediciones Rotativo...');
                    rotRows = await prisma.rotativoMeasurement.findMany({
                        where: {
                            timestamp: { gte: dateFrom, lt: dateToExclusive },
                            Session: {
                                organizationId,
                                ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
                            }
                        },
                        select: { sessionId: true }
                    });
                    logger.info(`✅ Encontradas ${rotRows.length} mediciones Rotativo`);
                } catch (e: any) {
                    logger.error('❌ Error consultando mediciones:', e);
                    return res.status(500).json({
                        success: false,
                        error: 'Error consultando datos de mediciones'
                    });
                }
                const idSet = new Set<string>();
                for (const r of gpsRows) idSet.add(r.sessionId);
                for (const r of rotRows) idSet.add(r.sessionId);
                sessionIds = Array.from(idSet);
                if (sessionIds.length > 0) {
                    sessions = await prisma.session.findMany({
                        where: { id: { in: sessionIds } },
                        select: { id: true, startTime: true, endTime: true, vehicleId: true }
                    });
                }
                logger.info(`📊 Sesiones por MEDICIONES en rango: ${sessionIds.length}`, {
                    organizationId,
                    from,
                    to,
                    gpsSessions: gpsRows.length,
                    rotativoSessions: rotRows.length
                });
            } else {
                const sessionFilter: any = { organizationId };
                if (vehicleIds && vehicleIds.length > 0) {
                    sessionFilter.vehicleId = { in: vehicleIds };
                }
                sessions = await prisma.session.findMany({
                    where: sessionFilter,
                    select: { id: true, startTime: true, endTime: true, vehicleId: true }
                });
                sessionIds = sessions.map(s => s.id);
                logger.info(`📊 Sesiones encontradas (sin rango explícito): ${sessionIds.length}`, { organizationId });
            }
    
            // Calcular KPIs básicos
            const totalSessions = sessions.length;
            const totalVehicles = new Set(sessions.map(s => s.vehicleId)).size;
    
            // Obtener eventos de estabilidad (filtrando por timestamp si aplica)
            const eventsWhere: any = { session_id: { in: sessionIds } };
            if (usedMeasurementRange && dateFrom && dateToExclusive) {
                eventsWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
            }
            const events = await prisma.stability_events.findMany({
                where: eventsWhere,
                select: { type: true, session_id: true }
            });
    
            const totalEvents = events.length;
            const eventsByType = events.reduce((acc, event) => {
                acc[event.type] = (acc[event.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
    
            // Calcular KPIs de actividad reales (distancia con Haversine y tiempo en movimiento)
            let kmTotal = 0;
            let drivingHours = 0;
            let rotativoOnSeconds = rotativoSeconds;
            let rotativoOnPercentage = totalTime > 0 ? (rotativoSeconds / totalTime) * 100 : 0;
            let gpsSamplesCount = 0;
            let gpsValidSamplesCount = 0;
            let rotativoSamplesCount = 0;
    
            if (sessionIds.length > 0) {
                // 1) Obtener GPS con coordenadas para Haversine (solo en rango si aplica)
                const gpsWhere: any = { sessionId: { in: sessionIds } };
                if (usedMeasurementRange && dateFrom && dateToExclusive) {
                    gpsWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
                }
                const gpsData = await prisma.gpsMeasurement.findMany({
                    where: gpsWhere,
                    select: { sessionId: true, timestamp: true, latitude: true, longitude: true, speed: true, fix: true, satellites: true },
                    orderBy: { timestamp: 'asc' }
                });
                gpsSamplesCount = gpsData.length;
    
                // 2) Aplicar filtro GPS corregido (mismo que en kpiCalculator.ts)
                const gpsValidos = gpsData.filter(g => {
                    // Verificar que tenga coordenadas válidas
                    const coordenadasValidas = g.latitude && g.longitude && 
                                              g.latitude !== 0 && g.longitude !== 0 &&
                                              g.latitude > 35 && g.latitude < 45 && 
                                              g.longitude > -5 && g.longitude < -1;
                    
                    // Verificar satélites (mínimo 4 para precisión)
                    const satelitesSuficientes = g.satellites >= 4;
                    
                    // Aceptar si tiene coordenadas válidas y satélites suficientes
                    return coordenadasValidas && satelitesSuficientes;
                });
                gpsValidSamplesCount = gpsValidos.length;
    
                // 3) Agrupar por sesión usando solo GPS válidos
                const gpsBySession = new Map<string, { timestamp: Date; lat: number; lon: number; speed: number }[]>();
                for (const g of gpsValidos) {
                    if (!gpsBySession.has(g.sessionId)) gpsBySession.set(g.sessionId, []);
                    gpsBySession.get(g.sessionId)!.push({
                        timestamp: g.timestamp,
                        lat: g.latitude,
                        lon: g.longitude,
                        speed: Number(g.speed) || 0
                    });
                }
    
                // 4) Haversine y tiempo en movimiento (con saneos y filtro GPS corregido)
                const toRad = (deg: number) => (deg * Math.PI) / 180;
                const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                    const R = 6371; // km
                    const dLat = toRad(lat2 - lat1);
                    const dLon = toRad(lon2 - lon1);
                    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                };
    
                let drivingSeconds = 0;
                // Umbrales de calidad de datos
                const MOVING_THRESHOLD_KMH = 1;     // >1 km/h se considera movimiento
                const MAX_REASONABLE_SPEED_KMH = 160; // límite superior razonable por tramo
                const MAX_POINT_GAP_SECONDS = 120;    // cap para huecos grandes
    
                for (const [sid, points] of gpsBySession.entries()) {
                    if (!points || points.length < 2) continue;
                    for (let i = 1; i < points.length; i++) {
                        const p1 = points[i - 1];
                        const p2 = points[i];
                        // Tiempo delta en segundos (cortar deltas anómalos)
                        const dt = Math.min(
                            MAX_POINT_GAP_SECONDS,
                            Math.max(0, Math.floor((p2.timestamp.getTime() - p1.timestamp.getTime()) / 1000))
                        );
                        if (dt <= 0) {
                            continue;
                        }
    
                        // Distancia entre puntos y velocidad inferida
                        const dKmRaw = haversineKm(p1.lat, p1.lon, p2.lat, p2.lon);
                        const speedKmh = isFinite(dKmRaw) && dKmRaw >= 0 ? (dKmRaw / (dt / 3600)) : 0;
    
                        // Saneo: ignorar saltos imposibles; clamp a velocidad máxima razonable
                        if (!isFinite(speedKmh) || speedKmh <= 0) {
                            continue;
                        }
    
                        const clampedSpeedKmh = Math.min(MAX_REASONABLE_SPEED_KMH, Math.max(0, speedKmh));
                        const dKmClamped = clampedSpeedKmh * (dt / 3600);
    
                        // Acumular distancia saneada
                        if (dKmClamped > 0) {
                            kmTotal += dKmClamped;
                        }
    
                        // Contabilizar tiempo de conducción solo cuando hay movimiento válido
                        if (clampedSpeedKmh >= MOVING_THRESHOLD_KMH && clampedSpeedKmh <= MAX_REASONABLE_SPEED_KMH) {
                            drivingSeconds += dt;
                        }
                    }
                }
    
                drivingHours = Math.round((drivingSeconds / 3600) * 10) / 10;
    
                // Calcular tiempo rotativo (solo en rango si aplica)
                const rotWhere: any = { sessionId: { in: sessionIds } };
                if (usedMeasurementRange && dateFrom && dateToExclusive) {
                    rotWhere.timestamp = { gte: dateFrom, lt: dateToExclusive };
                }
                const rotativoData = await prisma.rotativoMeasurement.findMany({
                    where: rotWhere,
                    select: { state: true, sessionId: true }
                });
                rotativoSamplesCount = rotativoData.length;
    
                if (rotativoData.length > 0) {
                const rotativoOn = rotativoData.filter(r => r.state === '1' || r.state === 'ON');
                rotativoOnSeconds = rotativoOn.length; // Aproximación: cada medición = 1 segundo
                    rotativoOnPercentage = (rotativoOn.length / rotativoData.length) * 100;
                }
            }
    
            // Construir respuesta de KPIs
            const driving_hours_formatted = formatDuration(Math.round((drivingHours || 0) * 3600));
            const rotativo_on_formatted = formatDuration(rotativoOnSeconds || 0);
            const rotativoPctClamped = Math.max(0, Math.min(100, Math.round((rotativoOnPercentage || 0) * 10) / 10));
            const summary = {
                availability: {
                    total_sessions: totalSessions,
                    total_vehicles: totalVehicles,
                    availability_percentage: totalSessions > 0 ? 100 : 0
                },
                states: {
                    states: KPI_KEYS.map(clave => ({
                        key: clave,
                        name: KPI_STATE_NAMES[clave],
                        duration_seconds: durations[clave],
                        duration_formatted: formatDuration(durations[clave]),
                        count: Math.floor((durations[clave] || 0) / 60) || 0
                    })),
                    total_time_seconds: totalTime,
                    total_time_formatted: formatDuration(totalTime),
                    time_outside_station: timeOutside,
                    time_outside_formatted: formatDuration(timeOutside)
                },
                activity: {
                    km_total: Math.round(kmTotal * 10) / 10,
                    driving_hours: drivingHours,
                    driving_hours_formatted,
                    rotativo_on_seconds: rotativoOnSeconds,
                    rotativo_on_percentage: rotativoPctClamped,
                    rotativo_on_formatted,
                    emergency_departures: emergencyDepartures
                },
                stability: {
                    total_incidents: totalEvents,
                    critical: eventsByType['CRITICO'] || 0,
                    moderate: eventsByType['MODERADO'] || 0,
                    light: eventsByType['LEVE'] || 0
                },
                activity_quality: {
                    gps_points_total: gpsSamplesCount,
                    gps_points_valid: gpsValidSamplesCount,
                    rotativo_samples: rotativoSamplesCount
                }
            };
    
            logger.info('KPIs calculados correctamente', {
                sesiones: summary.metadata?.sesiones_analizadas,
                km: summary.activity?.km_total,
                incidencias: summary.stability?.total_incidents
            });
    
            res.json({
                success: true,
                data: summary
            });
            */
        } catch (error: any) {
            logger.error('Error obteniendo resumen de KPIs:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

/**
 * GET /api/v1/kpis/ingestion-summary
 * Resumen de ingesta por sesión (solo lectura) con conteos de mediciones
 */
router.get('/ingestion-summary', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        const vehicleIds = vehicleIdsRaw
            ? (Array.isArray(vehicleIdsRaw) ? vehicleIdsRaw : [vehicleIdsRaw]) as string[]
            : undefined;

        const sessionsWhere: any = { organizationId };
        if (from && to) {
            sessionsWhere.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }
        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true, vehicleId: true, startTime: true, endTime: true }
        });

        // Calcular conteos por sesión (serie de consultas por sesión; si el dataset crece, optimizar con groupBy)
        const results = [] as Array<{
            sessionId: string;
            vehicleId: string;
            startTime: Date | null;
            endTime: Date | null;
            gpsCount: number;
            stabilityCount: number;
            rotativoCount: number;
        }>;

        for (const s of sessions) {
            const [gpsCount, stabilityCount, rotativoCount] = await Promise.all([
                prisma.gpsMeasurement.count({ where: { sessionId: s.id } }),
                prisma.stabilityMeasurement.count({ where: { sessionId: s.id } }),
                prisma.rotativoMeasurement.count({ where: { sessionId: s.id } })
            ]);

            results.push({
                sessionId: s.id,
                vehicleId: s.vehicleId,
                startTime: s.startTime,
                endTime: s.endTime,
                gpsCount,
                stabilityCount,
                rotativoCount
            });
        }

        const totals = results.reduce((acc, r) => {
            acc.sessions += 1;
            acc.gps += r.gpsCount;
            acc.stability += r.stabilityCount;
            acc.rotativo += r.rotativoCount;
            return acc;
        }, { sessions: 0, gps: 0, stability: 0, rotativo: 0 });

        logger.info('[IngestionSummary] Resumen generado', {
            organizationId,
            sessions: totals.sessions,
            gps: totals.gps,
            stability: totals.stability,
            rotativo: totals.rotativo
        });

        res.json({
            success: true,
            data: {
                totals,
                sessions: results
            }
        });
    } catch (error: any) {
        logger.error('Error obteniendo resumen de ingesta:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/states
 * Retorna resumen de estados (claves 0-5) con datos reales usando keyCalculator
 */
router.get('/states', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        // Extraer filtros de la query
        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIds = req.query['vehicleIds[]']
            ? (Array.isArray(req.query['vehicleIds[]'])
                ? req.query['vehicleIds[]']
                : [req.query['vehicleIds[]']]) as string[]
            : undefined;

        logger.info('Obteniendo estados con filtros', { from, to, vehicleIds });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (from && to) {
            sessionsWhere.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        // Obtener sesiones que coincidan con los filtros

        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true }
        });

        const sessionIds = sessions.map(s => s.id);

        logger.info(`Calculando timeline para ${sessionIds.length} sesiones en /states`);

        let dateFrom: Date | undefined;
        let dateToExclusive: Date | undefined;

        if (from && to) {
            dateFrom = new Date(from);
            const toDate = new Date(to);
            dateToExclusive = new Date(toDate.getTime());
            dateToExclusive.setDate(dateToExclusive.getDate() + 1);
        }

        const rawSegments = await prisma.operational_state_segments.findMany({
            where: {
                sessionId: { in: sessionIds }
            },
            select: {
                sessionId: true,
                clave: true,
                startTime: true,
                endTime: true,
                Session: {
                    select: { vehicleId: true, startTime: true, endTime: true }
                }
            }
        });

        if (!dateFrom || !dateToExclusive) {
            const sortedByStart = [...rawSegments]
                .filter(seg => seg.startTime)
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
            const sortedByEnd = [...rawSegments]
                .filter(seg => (seg.endTime ?? seg.startTime))
                .sort((a, b) => (a.endTime ?? a.startTime).getTime() - (b.endTime ?? b.startTime).getTime());

            if (!dateFrom && sortedByStart.length > 0) {
                dateFrom = sortedByStart[0].startTime;
            }

            if (!dateToExclusive && sortedByEnd.length > 0) {
                const lastEnd = sortedByEnd[sortedByEnd.length - 1].endTime ?? sortedByEnd[sortedByEnd.length - 1].startTime;
                dateToExclusive = new Date(lastEnd.getTime() + 1000);
            }
        }

        let dayBoundaries = buildDayBoundaries(dateFrom, dateToExclusive);
        if (dayBoundaries.length === 0 && dateFrom && dateToExclusive) {
            dayBoundaries = [{
                start: dateFrom,
                end: dateToExclusive,
                localLabel: getLocalDateString(dateFrom)
            }];
        }

        const segmentsByVehicle = new Map<string, RawSegmentRecord[]>();
        const vehiclesInRange = new Set<string>();

        for (const segment of rawSegments) {
            const vehicleId = segment.Session?.vehicleId;
            if (!vehicleId) {
                continue;
            }
            vehiclesInRange.add(vehicleId);
            if (!segmentsByVehicle.has(vehicleId)) {
                segmentsByVehicle.set(vehicleId, []);
            }
            segmentsByVehicle.get(vehicleId)!.push({
                vehicleId,
                sessionId: segment.sessionId,
                clave: segment.clave,
                startTime: segment.startTime,
                endTime: segment.endTime
            });
        }

        const trackerStates = await loadVehicleStates(Array.from(vehiclesInRange));

        const timelineAggregation = buildTimelineAggregation({
            vehicles: Array.from(vehiclesInRange),
            dayBoundaries,
            segmentsByVehicle,
            trackerStates,
            ttlSeconds: KPI_CONTINUITY_TTL_SECONDS,
            defaultKey: KPI_DEFAULT_KEY
        });

        const durations = timelineAggregation.durations;
        const counts = timelineAggregation.counts;

        // Calcular totalTime como suma de todas las claves (no suma de vehículos)
        const sumOfAllKeys = KPI_KEYS.reduce((sum, clave) => sum + durations[clave], 0);
        const timelineTotal = timelineAggregation.totalSeconds;
        const diff = Math.abs(sumOfAllKeys - timelineTotal);
        if (diff > 1) { // Tolerancia de 1 segundo por errores de redondeo
            logger.warn('⚠️ Inconsistencia en suma de claves vs timeline total', {
                sumOfAllKeys,
                timelineTotal,
                diff
            });
        }
        const totalTime = sumOfAllKeys; // Usar la suma de claves como fuente de verdad
        const timeOutside = durations[2] + durations[3] + durations[5];

        const states = {
            states: KPI_KEYS.map(clave => ({
                key: clave,
                name: KPI_STATE_NAMES[clave],
                duration_seconds: durations[clave],
                duration_formatted: formatDuration(durations[clave]),
                count: counts[clave]
            })),
            total_time_seconds: totalTime,
            total_time_formatted: formatDuration(totalTime),
            time_outside_station: timeOutside,
            time_outside_formatted: formatDuration(timeOutside)
        };

        logger.info('Estados calculados correctamente', {
            total_time: states.total_time_formatted,
            clave2: states.states[2].duration_formatted,
            clave5: states.states[4].duration_formatted
        });

        res.json({
            success: true,
            data: states
        });
    } catch (error: any) {
        logger.error('Error obteniendo estados:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Helper function para formatear segundos a HH:MM:SS
 */
function formatSeconds(seconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getLocalDateString(date: Date): string {
    return kpiDateFormatter.format(date);
}

function getUtcMidnightForLocalDate(localDate: string): Date {
    const [year, month, day] = localDate.split('-').map(Number);
    const approximateUtc = new Date(Date.UTC(year, month - 1, day));
    const offset = getTimezoneOffsetMilliseconds(approximateUtc);
    return new Date(approximateUtc.getTime() - offset);
}

function incrementLocalDate(localDate: string): string {
    const [year, month, day] = localDate.split('-').map(Number);
    const tentative = new Date(Date.UTC(year, month - 1, day, 12));
    tentative.setUTCDate(tentative.getUTCDate() + 1);
    return kpiDateFormatter.format(tentative);
}

function addLocalDays(utcDate: Date, days: number): Date {
    let local = getLocalDateString(utcDate);
    let result = utcDate;
    for (let i = 0; i < days; i++) {
        local = incrementLocalDate(local);
        result = getUtcMidnightForLocalDate(local);
    }
    return result;
}

function buildDayBoundaries(dateFrom?: Date, dateToExclusive?: Date): DayBoundary[] {
    if (!dateFrom || !dateToExclusive || dateFrom >= dateToExclusive) {
        return [];
    }

    const boundaries: DayBoundary[] = [];
    let cursor = getUtcMidnightForLocalDate(getLocalDateString(dateFrom));

    if (cursor < dateFrom) {
        cursor = dateFrom;
    }

    while (cursor < dateToExclusive) {
        const localLabel = getLocalDateString(cursor);
        let next = addLocalDays(cursor, 1);
        if (next <= cursor) {
            next = new Date(cursor.getTime() + 24 * 3600 * 1000);
        }
        const dayStart = cursor < dateFrom ? dateFrom : cursor;
        const dayEnd = next > dateToExclusive ? dateToExclusive : next;
        boundaries.push({ start: dayStart, end: dayEnd, localLabel });
        cursor = next;
    }

    return boundaries;
}

function getTimezoneOffsetMilliseconds(date: Date): number {
    const parts = kpiDateTimeFormatter.formatToParts(date);
    const map: Record<string, string> = {};
    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    }
    const year = Number(map.year);
    const month = Number(map.month);
    const day = Number(map.day);
    const hour = Number(map.hour);
    const minute = Number(map.minute);
    const second = Number(map.second);
    const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
    return asUtc - date.getTime();
}

function isSegmentOverlapping(segment: RawSegmentRecord, start: Date, end: Date): boolean {
    const segStart = segment.startTime;
    const segEnd = segment.endTime ?? segment.startTime;
    return segStart < end && segEnd > start;
}

function clipSegmentToBoundary(segment: RawSegmentRecord, start: Date, end: Date): { start: Date; end: Date } | null {
    const segStart = segment.startTime > start ? segment.startTime : start;
    const segEndRaw = segment.endTime ?? segment.startTime;
    const segEnd = segEndRaw < end ? segEndRaw : end;
    if (segEnd <= segStart) {
        return null;
    }
    return { start: segStart, end: segEnd };
}

function determineFillKey(
    currentKey: OperationalKey | null,
    lastObservedAt: Date | null,
    gapStart: Date,
    ttlSeconds: number,
    defaultKey: OperationalKey
): OperationalKey {
    if (currentKey === null) {
        return defaultKey;
    }

    if (!lastObservedAt) {
        return defaultKey;
    }

    if (lastObservedAt > gapStart) {
        return defaultKey;
    }

    const diffSeconds = (gapStart.getTime() - lastObservedAt.getTime()) / 1000;
    const keySpecificTtl = KPI_KEY_TTLS[currentKey] ?? ttlSeconds;
    const ttlForKey = Math.min(ttlSeconds, keySpecificTtl);

    if (diffSeconds <= ttlForKey) {
        return currentKey;
    }

    return defaultKey;
}

function buildDailyTimelineForVehicle(params: {
    vehicleId: string;
    dayStart: Date;
    dayEnd: Date;
    segments: RawSegmentRecord[];
    initialKey: OperationalKey;
    lastObservedAt: Date | null;
    ttlSeconds: number;
    defaultKey: OperationalKey;
}): { timeline: TimelineSegmentEntry[]; lastKey: OperationalKey; lastObservedAt: Date | null } {
    const { vehicleId, dayStart, dayEnd, segments, initialKey, lastObservedAt, ttlSeconds, defaultKey } = params;
    const relevantSegments = segments
        .filter(segment => isSegmentOverlapping(segment, dayStart, dayEnd))
        .map(segment => ({ segment, clipped: clipSegmentToBoundary(segment, dayStart, dayEnd) }))
        .filter(entry => entry.clipped !== null)
        .sort((a, b) => a.clipped!.start.getTime() - b.clipped!.start.getTime());

    const timeline: TimelineSegmentEntry[] = [];
    let cursor = dayStart;
    let currentKey: OperationalKey | null = initialKey;
    let observedAt: Date | null = lastObservedAt;

    for (const entry of relevantSegments) {
        const { segment, clipped } = entry;
        if (!clipped) continue;
        const { start, end } = clipped;

        if (start > cursor) {
            const fillKey = determineFillKey(currentKey, observedAt, cursor, ttlSeconds, defaultKey);
            timeline.push({
                vehicleId,
                clave: fillKey,
                start: cursor,
                end: start,
                inferred: true
            });
            currentKey = fillKey;
            cursor = start;
        }

        timeline.push({
            vehicleId,
            clave: (segment.clave === 4 ? 5 : segment.clave) as OperationalKey,
            start,
            end,
            inferred: false
        });
        cursor = end;
        currentKey = (segment.clave === 4 ? 5 : segment.clave) as OperationalKey;
        observedAt = end;
    }

    if (cursor < dayEnd) {
        const fillKey = determineFillKey(currentKey, observedAt, cursor, ttlSeconds, defaultKey);
        timeline.push({
            vehicleId,
            clave: fillKey,
            start: cursor,
            end: dayEnd,
            inferred: true
        });
        currentKey = fillKey;
    }

    return {
        timeline,
        lastKey: currentKey ?? defaultKey,
        lastObservedAt: observedAt
    };
}

function loadVehicleStates(vehicleIds: string[]): Promise<Map<string, VehicleState>> {
    return Promise.allSettled(vehicleIds.map(id => VehicleStateTracker.getState(id))).then(results => {
        const map = new Map<string, VehicleState>();
        results.forEach((result, index) => {
            const vehicleId = vehicleIds[index];
            if (result.status === 'fulfilled') {
                map.set(vehicleId, result.value);
            } else {
                logger.warn('⚠️ No se pudo cargar VehicleState', {
                    vehicleId,
                    error: result.reason?.message || result.reason
                });
            }
        });
        return map;
    });
}

function buildTimelineAggregation(params: {
    vehicles: string[];
    dayBoundaries: DayBoundary[];
    segmentsByVehicle: Map<string, RawSegmentRecord[]>;
    trackerStates: Map<string, VehicleState>;
    ttlSeconds: number;
    defaultKey: OperationalKey;
}): {
    durations: DurationMap;
    counts: DurationMap;
    totalSeconds: number;
    perDayTotals: Array<{ vehicleId: string; dayStart: Date; dayEnd: Date; localLabel: string; totalSeconds: number }>;
} {
    const { vehicles, dayBoundaries, segmentsByVehicle, trackerStates, ttlSeconds, defaultKey } = params;
    const durations = createEmptyDurationMap();
    const counts = createEmptyDurationMap();
    const perDayTotals: Array<{ vehicleId: string; dayStart: Date; dayEnd: Date; localLabel: string; totalSeconds: number }> = [];
    let totalSeconds = 0;

    for (const vehicleId of vehicles) {
        const vehicleSegments = (segmentsByVehicle.get(vehicleId) || []).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const trackerState = trackerStates.get(vehicleId);

        let currentKey: OperationalKey = defaultKey;
        let lastObservedAt: Date | null = null;

        const firstBoundary = dayBoundaries[0]?.start ?? null;

        if (trackerState?.lastState !== null && trackerState?.lastState !== undefined) {
            const normalizedState = trackerState.lastState === 4 ? 5 : trackerState.lastState;
            if (KPI_KEYS.includes(normalizedState as OperationalKey)) {
                currentKey = normalizedState as OperationalKey;
            }
        }

        if (!trackerState?.lastSeenAt || !firstBoundary) {
            currentKey = defaultKey;
            lastObservedAt = null;
        } else {
            const diffSeconds = (firstBoundary.getTime() - trackerState.lastSeenAt.getTime()) / 1000;
            const keySpecificTtl = KPI_KEY_TTLS[currentKey] ?? ttlSeconds;
            if (diffSeconds < 0 || diffSeconds > keySpecificTtl) {
                currentKey = defaultKey;
                lastObservedAt = null;
            } else {
                lastObservedAt = trackerState.lastSeenAt;
            }
        }

        if (vehicleSegments.length === 0) {
            let baselineKey = lastObservedAt ? currentKey : defaultKey;
            if (baselineKey === 0) {
                const lastSeen = trackerState?.lastSeenAt ?? null;
                const firstDayStart = dayBoundaries[0]?.start ?? null;
                if (!lastSeen || !firstDayStart || (firstDayStart.getTime() - lastSeen.getTime()) >= 24 * 3600 * 1000) {
                    baselineKey = 1;
                }
            }
            for (const day of dayBoundaries) {
                const duration = (day.end.getTime() - day.start.getTime()) / 1000;
                if (duration <= 0) continue;
                durations[baselineKey as OperationalKey] += duration;
                counts[baselineKey as OperationalKey] += 1;
                totalSeconds += duration;
                perDayTotals.push({
                    vehicleId,
                    dayStart: day.start,
                    dayEnd: day.end,
                    localLabel: day.localLabel,
                    totalSeconds: duration
                });
            }
            continue;
        }

        for (const day of dayBoundaries) {
            const { timeline, lastKey, lastObservedAt: updatedObserved } = buildDailyTimelineForVehicle({
                vehicleId,
                dayStart: day.start,
                dayEnd: day.end,
                segments: vehicleSegments,
                initialKey: currentKey,
                lastObservedAt,
                ttlSeconds,
                defaultKey
            });

            let dayTotal = 0;
            for (const segment of timeline) {
                const duration = (segment.end.getTime() - segment.start.getTime()) / 1000;
                if (duration <= 0) continue;
                durations[segment.clave] += duration;
                counts[segment.clave] += 1;
                totalSeconds += duration;
                dayTotal += duration;
            }

            perDayTotals.push({
                vehicleId,
                dayStart: day.start,
                dayEnd: day.end,
                localLabel: day.localLabel,
                totalSeconds: dayTotal
            });

            currentKey = lastKey;
            if (updatedObserved) {
                lastObservedAt = updatedObserved;
            }
        }
    }

    return {
        durations,
        counts,
        totalSeconds,
        perDayTotals
    };
}

/**
 * GET /api/v1/kpis/activity
 * Retorna métricas de actividad
 */
router.get('/activity', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const activity = {
            km_total: 0,
            driving_hours: 0,
            driving_hours_formatted: '00:00:00',
            rotativo_on_seconds: 0,
            rotativo_on_percentage: 0,
            rotativo_on_formatted: '00:00:00',
            emergency_departures: 0
        };

        res.json({
            success: true,
            data: activity
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de actividad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/stability
 * Retorna métricas de estabilidad
 */
router.get('/stability', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const stability = {
            total_incidents: 0,
            critical: 0,
            moderate: 0,
            light: 0
        };

        res.json({
            success: true,
            data: stability
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de estabilidad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


export default router;

