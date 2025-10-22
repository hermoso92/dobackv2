import { Router } from 'express';
import { speedAnalyzer } from '../services/speedAnalyzer';
import { tomtomSpeedLimitsService } from '../services/TomTomSpeedLimitsService';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = Router();

// Interface para violación de velocidad
interface SpeedViolation {
    id: string;
    vehicleId: string;
    vehicleName: string;
    timestamp: string;
    lat: number;
    lng: number;
    speed: number;
    speedLimit: number;
    violationType: 'grave' | 'moderada' | 'leve' | 'correcto';
    rotativoOn: boolean;
    inPark: boolean;
    roadType: 'urban' | 'interurban' | 'highway';
    excess: number;
}

// Interface para filtros de velocidad
interface SpeedFilters {
    rotativoFilter?: 'all' | 'on' | 'off';
    parkFilter?: 'all' | 'in' | 'out';
    violationFilter?: 'all' | 'grave' | 'moderada' | 'leve' | 'correcto';
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
    minSpeed?: number;
}

// Categorías DGT (simplificadas para el backend)
const DGT_CATEGORIES = {
    'vehiculo_emergencia': {
        urban: 50,
        interurban: 90,
        highway: 120,
        emergency_urban: 80,
        emergency_interurban: 120,
        emergency_highway: 140
    },
    'default': {
        urban: 50,
        interurban: 90,
        highway: 120,
        emergency_urban: 80,
        emergency_interurban: 120,
        emergency_highway: 140
    }
};

// Función para obtener límite de velocidad
function getSpeedLimit(vehicleId: string, roadType: 'urban' | 'interurban' | 'highway', rotativoOn: boolean, inPark: boolean): number {
    if (inPark) return 20; // km/h dentro del parque

    const category = DGT_CATEGORIES['vehiculo_emergencia']; // Todos los vehículos DobackSoft son de emergencia

    if (rotativoOn) {
        return category[`emergency_${roadType}` as keyof typeof category];
    }

    return category[roadType];
}

// Función para clasificar violación (MANDAMIENTO M6.2)
function classifySpeedViolation(
    speed: number,
    speedLimit: number
): 'correcto' | 'leve' | 'moderada' | 'grave' {
    const excess = speed - speedLimit;

    if (excess <= 0) return 'correcto';
    if (excess <= 10) return 'leve';      // 0-10 km/h
    if (excess <= 20) return 'moderada';  // 10-20 km/h ✅ OBLIGATORIO
    return 'grave';                       // >20 km/h
}

// Función para determinar tipo de vía
function getRoadType(speed: number, inPark: boolean): 'urban' | 'interurban' | 'highway' {
    if (inPark) return 'urban';
    if (speed > 100) return 'highway';
    if (speed > 70) return 'interurban';
    return 'urban';
}

// Función para determinar si está en parque
function isInPark(lat: number, lng: number): boolean {
    const parks = [
        { name: 'Alcobendas', lat: 40.5419, lng: -3.6319, radius: 0.01 },
        { name: 'Las Rozas', lat: 40.4919, lng: -3.8738, radius: 0.01 }
    ];

    return parks.some(park => {
        const distance = Math.sqrt(
            Math.pow(lat - park.lat, 2) + Math.pow(lng - park.lng, 2)
        );
        return distance < park.radius;
    });
}

/**
 * GET /api/speed/violations
 * Obtiene violaciones de velocidad con clasificación DGT
 * ACTUALIZADO: Usa speedAnalyzer con límites correctos para camiones
 */
router.get('/violations', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        // Aceptar ambos formatos: from/to y startDate/endDate
        const from = (req.query.from as string) || (req.query.startDate as string);
        const to = (req.query.to as string) || (req.query.endDate as string);
        // Hacer 'to' inclusivo convirtiéndolo a límite exclusivo (lt next day)
        const dateFrom = from ? new Date(from) : undefined;
        const dateToExclusive = to ? (() => { const d = new Date(to as string); d.setDate(d.getDate() + 1); return d; })() : undefined;
        const filters: SpeedFilters = {
            rotativoFilter: req.query.rotativoOn as any || 'all',
            parkFilter: req.query.inPark as any || 'all',
            violationFilter: req.query.violationType as any || 'all',
            vehicleIds: req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined,
            startDate: from,
            endDate: to,
            minSpeed: parseInt(req.query.minSpeed as string) || 0
        };

        logger.info('Obteniendo violaciones de velocidad con speedAnalyzer', { organizationId, from, to, filters });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: filters.vehicleIds };
        }

        // No filtrar por startTime de sesión; se filtrará por timestamp de medición (excesos) en rango

        // Obtener sesiones con puntos GPS en el rango para evitar analizar sesiones vacías

        const gpsSessionWhere: any = {
            timestamp: {},
            session: { organizationId }
        };
        if (dateFrom) (gpsSessionWhere.timestamp as any).gte = dateFrom;
        if (dateToExclusive) (gpsSessionWhere.timestamp as any).lt = dateToExclusive;
        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            (gpsSessionWhere.session as any).vehicleId = { in: filters.vehicleIds };
        }
        // MANDAMIENTO M6.5: Sin límites artificiales
        const gpsSessions = await prisma.gpsMeasurement.findMany({
            where: gpsSessionWhere,
            select: { sessionId: true },
            distinct: ['sessionId']
            // ✅ Sin take - procesar TODAS las sesiones
        });

        const sessionIds = gpsSessions.map(r => r.sessionId);

        logger.info(`📊 Analizando velocidades en ${sessionIds.length} sesiones (con GPS en rango)`);
        if (sessionIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    violations: [],
                    stats: { total: 0, graves: 0, moderadas: 0, leves: 0, correctos: 0, withRotativo: 0, withoutRotativo: 0, avgSpeedExcess: 0 },
                    filters,
                    summary: { velocidad_maxima: 0, velocidad_promedio: 0, excesos_totales: 0, excesos_graves: 0, excesos_justificados: 0 },
                    diagnostics: []
                }
            });
        }

        // MANDAMIENTO M6.5: Procesar TODAS las sesiones (sin límites)
        logger.info(`📦 Procesando ${sessionIds.length} sesiones completas`);

        const analisisVelocidad = await speedAnalyzer.analizarVelocidades(
            sessionIds, // ✅ TODAS las sesiones
            dateFrom,
            dateToExclusive ? new Date(dateToExclusive.getTime() - 1) : undefined
        );
        const dateToIncl = dateToExclusive ? new Date(dateToExclusive.getTime() - 1) : undefined;
        const excesosFiltrados = (analisisVelocidad.excesos || []).filter(ex => {
            if (!dateFrom || !dateToIncl) return true;
            const ts = ex.timestamp instanceof Date ? ex.timestamp : new Date(ex.timestamp);
            return ts >= dateFrom && ts < (dateToExclusive as Date);
        });

        // Obtener nombres de vehículos
        const vehiculos = await prisma.vehicle.findMany({
            where: { organizationId },
            select: { id: true, name: true, identifier: true }
        });
        const vehiculosMap = new Map(vehiculos.map(v => [v.id, v.name || v.identifier]));

        // Utilidades de saneo
        const isValidSpeed = (s: number) => Number.isFinite(s) && s >= 0 && s <= 160;
        const clampExcess = (speed: number, limit: number) => Math.max(0, speed - limit);

        // Convertir excesos a formato SpeedViolation
        const speedViolations: SpeedViolation[] = excesosFiltrados.map(exceso => {
            // Mapear tipo de vía a roadType
            const roadTypeMap: Record<string, 'urban' | 'interurban' | 'highway'> = {
                'AUTOPISTA_AUTOVIA': 'highway',
                'CARRETERA_ARCEN_PAVIMENTADO': 'interurban',
                'RESTO_VIAS_FUERA_POBLADO': 'interurban',
                'AUTOPISTA_URBANA': 'highway',
                'CONVENCIONAL_SEPARACION_FISICA': 'interurban',
                'CONVENCIONAL_SIN_SEPARACION': 'interurban',
                'VIA_SIN_PAVIMENTAR': 'urban'
            };

            const roadType = roadTypeMap[exceso.tipoVia] || 'urban';
            const inPark = isInPark(exceso.lat, exceso.lon);

            // Mapear severidad a violationType
            const violationType: 'grave' | 'moderada' | 'leve' | 'correcto' =
                exceso.severidad === 'GRAVE' ? 'grave' :
                    exceso.severidad === 'MODERADA' ? 'moderada' :
                        exceso.severidad === 'LEVE' ? 'leve' :
                            'correcto';

            const speed = isValidSpeed(exceso.velocidad) ? exceso.velocidad : 0;
            const speedLimit = isValidSpeed(exceso.limite) ? exceso.limite : 0;
            const excess = clampExcess(speed, speedLimit);

            return {
                id: `${exceso.sessionId}_${exceso.timestamp.getTime()}`,
                vehicleId: exceso.vehicleId,
                vehicleName: vehiculosMap.get(exceso.vehicleId) || exceso.vehicleId,
                timestamp: exceso.timestamp.toISOString(),
                lat: exceso.lat,
                lng: exceso.lon,
                speed,
                speedLimit,
                violationType,
                rotativoOn: exceso.rotativoOn,
                inPark,
                roadType,
                excess
            };
        });

        logger.info(`Excesos convertidos (filtrados por rango): ${speedViolations.length}`);

        // Aplicar filtros adicionales
        let filteredViolations = speedViolations;

        // Filtro de rotativo
        if (filters.rotativoFilter !== 'all') {
            if (filters.rotativoFilter === 'on') {
                filteredViolations = filteredViolations.filter(v => v.rotativoOn);
            } else if (filters.rotativoFilter === 'off') {
                filteredViolations = filteredViolations.filter(v => !v.rotativoOn);
            }
        }

        // Filtro de parque
        if (filters.parkFilter !== 'all') {
            filteredViolations = filteredViolations.filter(violation => {
                if (filters.parkFilter === 'in') return violation.inPark;
                if (filters.parkFilter === 'out') return !violation.inPark;
                return true;
            });
        }

        // Filtro de tipo de violación
        if (filters.violationFilter !== 'all') {
            filteredViolations = filteredViolations.filter(violation =>
                violation.violationType === filters.violationFilter
            );
        }

        // Filtro de velocidad mínima
        if (filters.minSpeed && filters.minSpeed > 0) {
            filteredViolations = filteredViolations.filter(v => v.speed >= (filters.minSpeed || 0));
        }

        // Calcular estadísticas (sin outliers)
        const stats = {
            total: filteredViolations.length,
            graves: filteredViolations.filter(v => v.violationType === 'grave').length,
            moderadas: filteredViolations.filter(v => v.violationType === 'moderada').length,
            leves: filteredViolations.filter(v => v.violationType === 'leve').length,
            correctos: filteredViolations.filter(v => v.violationType === 'correcto').length,
            withRotativo: filteredViolations.filter(v => v.rotativoOn).length,
            withoutRotativo: filteredViolations.filter(v => !v.rotativoOn).length,
            avgSpeedExcess: (() => {
                const valid = filteredViolations
                    .filter(v => v.violationType !== 'correcto')
                    .map(v => v.excess)
                    .filter(e => Number.isFinite(e) && e >= 0 && e <= 80);
                if (valid.length === 0) return 0;
                return Math.round((valid.reduce((s, e) => s + e, 0) / valid.length) * 10) / 10;
            })()
        };

        logger.info('Violaciones procesadas', {
            total: stats.total,
            graves: stats.graves,
            moderadas: stats.moderadas,
            leves: stats.leves,
            correctos: stats.correctos
        });

        // Diagnóstico: muestreo de puntos (speed vs. límite TomTom) cuando diag=true
        const diag = (req.query.diag as string) === 'true';
        let diagnostics: Array<{ ts: string; speed: number; limit: number; excess: number; lat: number; lon: number; source: string }> | undefined;
        if (diag) {
            const dateFrom = filters.startDate ? new Date(filters.startDate) : undefined;
            const dateToExclusive = filters.endDate ? (() => { const d = new Date(filters.endDate as string); d.setDate(d.getDate() + 1); return d; })() : undefined;
            try {
                const gpsDiag = await prisma.gpsMeasurement.findMany({
                    where: {
                        sessionId: { in: sessionIds },
                        speed: { gt: 0 },
                        ...(dateFrom && dateToExclusive ? { timestamp: { gte: dateFrom, lt: dateToExclusive } } : {})
                    },
                    select: { timestamp: true, latitude: true, longitude: true, speed: true },
                    orderBy: { timestamp: 'asc' },
                    take: 200
                });

                const step = Math.max(1, Math.ceil(gpsDiag.length / 50));
                const sample = gpsDiag.filter((_, idx) => idx % step === 0).slice(0, 50);
                diagnostics = [];

                for (const p of sample) {
                    try {
                        const lim = await tomtomSpeedLimitsService.obtenerLimiteVelocidad(p.latitude as number, p.longitude as number);
                        const limitVal = Number(lim.speedLimit) || 0;
                        const speedVal = Number(p.speed) || 0;
                        const excess = speedVal - limitVal;
                        logger.info('[DiagSpeed] Punto', {
                            ts: p.timestamp,
                            speed: speedVal,
                            limit: limitVal,
                            excess,
                            lat: p.latitude,
                            lon: p.longitude,
                            source: lim.source
                        });
                        diagnostics.push({ ts: p.timestamp.toISOString(), speed: speedVal, limit: limitVal, excess, lat: p.latitude as number, lon: p.longitude as number, source: lim.source });
                    } catch (e: any) {
                        logger.warn('[DiagSpeed] Error obteniendo límite', { error: e?.message });
                    }
                }
            } catch (e: any) {
                logger.warn('[DiagSpeed] Error muestreando puntos', { error: e?.message });
            }
        }

        res.json({
            success: true,
            data: {
                violations: filteredViolations,
                stats,
                filters,
                summary: {
                    velocidad_maxima: filteredViolations.length > 0 ? Math.max(...filteredViolations.map(v => v.speed)) : 0,
                    velocidad_promedio: filteredViolations.length > 0 ? Math.round((filteredViolations.reduce((s, v) => s + v.speed, 0) / filteredViolations.length) * 10) / 10 : 0,
                    excesos_totales: excesosFiltrados.length,
                    excesos_graves: excesosFiltrados.filter(e => e.severidad === 'GRAVE').length,
                    excesos_justificados: excesosFiltrados.filter(e => e.justificado).length
                },
                diagnostics
            }
        });

    } catch (error) {
        logger.error('Error obteniendo violaciones de velocidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/speed/statistics
 * Obtiene estadísticas de velocidad por vehículo
 */
router.get('/statistics', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        const vehicleId = req.query.vehicleId as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        logger.info('Obteniendo estadísticas de velocidad', { organizationId, vehicleId });

        // Construir condiciones
        const whereConditions: any = {
            Session: {
                organizationId
            },
            speed: { not: null }
        };

        if (vehicleId) {
            whereConditions.session.vehicleId = vehicleId;
        }

        if (startDate && endDate) {
            whereConditions.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Obtener eventos de estabilidad con velocidad

        const events = await prisma.stability_events.findMany({
            where: whereConditions,
            include: {
                Session: {
                    include: {
                        Vehicle: true
                    }
                }
            }
        });

        logger.info(`Procesando estadísticas de ${events.length} eventos`);

        // Agrupar eventos por vehículo y estado de rotativo
        const statsMap = new Map<string, {
            vehicleId: string;
            vehicleName: string;
            rotativoOn: boolean;
            speeds: number[];
        }>();

        events.forEach((event: any) => {
            const rotativoOn = event.rotativoState ? event.rotativoState > 0 : false;
            const key = `${event.Session.vehicleId}-${rotativoOn}`;

            if (!statsMap.has(key)) {
                statsMap.set(key, {
                    vehicleId: event.Session.vehicleId,
                    vehicleName: event.Session.Vehicle.name,
                    rotativoOn,
                    speeds: []
                });
            }

            const stat = statsMap.get(key)!;
            if (event.speed) {
                stat.speeds.push(event.speed);
            }
        });

        // Calcular estadísticas
        const result = Array.from(statsMap.values()).map(stat => ({
            vehicleId: stat.vehicleId,
            vehicleName: stat.vehicleName,
            rotativoOn: stat.rotativoOn,
            avgSpeed: stat.speeds.length > 0
                ? Math.round((stat.speeds.reduce((a, b) => a + b, 0) / stat.speeds.length) * 10) / 10
                : 0,
            maxSpeed: stat.speeds.length > 0
                ? Math.max(...stat.speeds)
                : 0,
            eventCount: stat.speeds.length
        }));

        // Obtener total de vehículos
        const vehicles = await prisma.vehicle.findMany({
            where: { organizationId },
            select: {
                id: true,
                name: true
            }
        });

        res.json({
            success: true,
            data: {
                statistics: result,
                totalVehicles: vehicles.length,
                filters: { vehicleId, startDate, endDate }
            }
        });

    } catch (error) {
        logger.error('Error obteniendo estadísticas de velocidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/speed/critical-zones
 * Obtiene ranking de tramos con más excesos de velocidad
 */
router.get('/critical-zones', async (req, res) => {
    try {
        const organizationId = req.query.organizationId as string || 'default-org';
        const limit = parseInt(req.query.limit as string) || 10;
        const rotativoFilter = req.query.rotativoOn as string || 'all';
        const violationFilter = req.query.violationType as string || 'all';
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        logger.info('Obteniendo zonas críticas de velocidad', { organizationId, limit });

        // Construir filtros para obtener datos GPS con velocidad
        const whereClause: any = {
            session: {
                organizationId
            }
        };

        // Filtro de vehículos
        if (vehicleIds && vehicleIds.length > 0) {
            whereClause.session.vehicleId = { in: vehicleIds };
        }

        // Filtro de fechas
        if (startDate || endDate) {
            whereClause.timestamp = {};
            if (startDate) whereClause.timestamp.gte = new Date(startDate);
            if (endDate) whereClause.timestamp.lte = new Date(endDate);
        }

        // Obtener datos GPS con velocidad

        const gpsDataRaw = await prisma.gpsMeasurement.findMany({
            where: whereClause,
            orderBy: { timestamp: 'asc' },
            take: 10000 // Limitar para rendimiento
        });

        logger.info(`GPS data recuperados: ${gpsDataRaw.length} puntos`);

        // Obtener información de sesiones y vehículos relacionados
        const uniqueSessionIds = new Set(gpsDataRaw.map(gps => gps.sessionId));
        const sessionIds = Array.from(uniqueSessionIds);
        const sessions = await prisma.session.findMany({
            where: { id: { in: sessionIds } },
            include: { vehicle: true }
        });

        const sessionMap = new Map(sessions.map(s => [s.id, s]));

        // Enriquecer datos GPS con información de sesión y vehículo
        const gpsData = gpsDataRaw.map((gps: any) => {
            const session = sessionMap.get(gps.sessionId);
            return {
                ...gps,
                Session: session ? {
                    vehicleId: session.vehicleId,
                    Vehicle: session.vehicle
                } : null
            };
        });

        // Filtrar por rotativo si se especifica
        let filteredGpsData = gpsData;
        if (rotativoFilter === 'on') {
            filteredGpsData = gpsData.filter((gps: any) => gps.rotativoState && gps.rotativoState > 0);
        } else if (rotativoFilter === 'off') {
            filteredGpsData = gpsData.filter((gps: any) => !gps.rotativoState || gps.rotativoState === 0);
        }

        // Utilidades de saneo
        const isValidSpeed = (s: number) => Number.isFinite(s) && s > 0 && s <= 160;
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

        // Convertir a eventos de velocidad con clasificación
        const speedEvents = filteredGpsData
            .filter((gps: any) => gps.latitude !== null && gps.longitude !== null)
            .map((gps: any, idx: number, arr: any[]) => {
                const inPark = isInPark(gps.latitude, gps.longitude);
                // calcular velocidad por Haversine si no viene o es inválida
                let speedVal: number = Number(gps.speed) || 0;
                if (!isValidSpeed(speedVal) && idx > 0 && arr[idx - 1].sessionId === gps.sessionId) {
                    const prev = arr[idx - 1];
                    const dtSec = Math.max(0, Math.floor((new Date(gps.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000));
                    if (dtSec > 0 && dtSec <= 120) {
                        const dKm = haversineKm(prev.latitude as number, prev.longitude as number, gps.latitude as number, gps.longitude as number);
                        const calcKmh = dKm * (3600 / dtSec);
                        if (Number.isFinite(calcKmh)) speedVal = calcKmh;
                    }
                }
                if (!isValidSpeed(speedVal)) speedVal = 0;
                const roadType = getRoadType(speedVal || 0, inPark);
                const speedLimit = getSpeedLimit(
                    gps.session?.vehicleId || '',
                    roadType,
                    gps.rotativoState ? gps.rotativoState > 0 : false,
                    inPark
                );
                const violationType = classifySpeedViolation(speedVal, speedLimit);
                const excess = Math.max(0, speedVal - speedLimit);

                return {
                    lat: gps.latitude,
                    lng: gps.longitude,
                    speed: speedVal,
                    speedLimit,
                    violationType,
                    excess,
                    rotativo: gps.rotativoState ? gps.rotativoState > 0 : false,
                    vehicleId: gps.session?.vehicleId || '',
                    vehicleName: gps.session?.Vehicle?.name || '',
                    timestamp: gps.timestamp,
                    inPark
                };
            });

        logger.info(`Eventos de velocidad procesados: ${speedEvents.length}`);

        // Agrupar eventos por proximidad (clustering)
        const clusterRadius = 0.01; // ~1km en grados
        const clusters: Array<{
            lat: number;
            lng: number;
            location: string;
            events: typeof speedEvents;
        }> = [];

        // Filtrar eventos con coordenadas válidas antes del clustering
        const validSpeedEvents = speedEvents.filter((event: any) =>
            event.lat !== undefined &&
            event.lat !== null &&
            event.lng !== undefined &&
            event.lng !== null &&
            !isNaN(event.lat) &&
            !isNaN(event.lng)
        );

        logger.info(`Eventos con coordenadas válidas: ${validSpeedEvents.length} de ${speedEvents.length}`);

        validSpeedEvents.forEach((event: any) => {
            let addedToCluster = false;

            for (const cluster of clusters) {
                const distance = Math.sqrt(
                    Math.pow(event.lat - cluster.lat, 2) +
                    Math.pow(event.lng - cluster.lng, 2)
                );

                if (distance < clusterRadius) {
                    cluster.events.push(event);
                    // Actualizar centro del cluster (promedio)
                    cluster.lat = cluster.events.reduce((sum: any, e: any) => sum + e.lat, 0) / cluster.events.length;
                    cluster.lng = cluster.events.reduce((sum: any, e: any) => sum + e.lng, 0) / cluster.events.length;
                    addedToCluster = true;
                    break;
                }
            }

            if (!addedToCluster) {
                clusters.push({
                    lat: event.lat,
                    lng: event.lng,
                    location: `${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}`,
                    events: [event]
                });
            }
        });

        logger.info(`Clusters creados: ${clusters.length}`);

        // Procesar clusters para obtener estadísticas
        const zonesWithStats = clusters.map(cluster => {
            const graveCount = cluster.events.filter((e: any) => e.violationType === 'grave').length;
            const leveCount = cluster.events.filter((e: any) => e.violationType === 'leve').length;
            const correctoCount = cluster.events.filter((e: any) => e.violationType === 'correcto').length;
            const totalViolations = graveCount + leveCount;

            const avgExcess = totalViolations > 0
                ? cluster.events
                    .filter((e: any) => e.violationType !== 'correcto')
                    .reduce((sum: any, e: any) => sum + e.excess, 0) / totalViolations
                : 0;

            return {
                lat: cluster.lat,
                lng: cluster.lng,
                location: cluster.location,
                totalViolations,
                grave: graveCount,
                leve: leveCount,
                correcto: correctoCount,
                avgExcess: Math.round(avgExcess * 10) / 10,
                totalEvents: cluster.events.length
            };
        });

        // Filtrar por tipo de violación si se especifica
        let filteredZones = zonesWithStats.filter(zone => zone.totalViolations > 0);

        if (violationFilter === 'grave') {
            filteredZones = filteredZones.filter(zone => zone.grave > 0);
        } else if (violationFilter === 'leve') {
            filteredZones = filteredZones.filter(zone => zone.leve > 0);
        } else if (violationFilter === 'correcto') {
            filteredZones = zonesWithStats.filter(zone => zone.correcto > 0);
        }

        // Ordenar por total de violaciones y asignar ranking
        filteredZones.sort((a, b) => b.totalViolations - a.totalViolations);

        const ranking = filteredZones.slice(0, limit).map((zone, index) => ({
            rank: index + 1,
            ...zone
        }));

        logger.info(`Zonas críticas procesadas: ${ranking.length} zonas`);

        res.json({
            success: true,
            data: {
                ranking,
                total: filteredZones.length,
                filters: {
                    rotativo: rotativoFilter,
                    violationType: violationFilter,
                    limit
                }
            }
        });

    } catch (error) {
        logger.error('Error obteniendo zonas críticas de velocidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

export default router;

// Diagnóstico de velocidad con TomTom: muestra puntos speed vs limit
router.get('/diagnostics', async (req, res) => {
    try {
        const organizationId = (req.query.organizationId as string) || 'default-org';
        const from = (req.query.from as string) || (req.query.startDate as string);
        const to = (req.query.to as string) || (req.query.endDate as string);
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const limit = Number.isFinite(parseInt(req.query.limit as string)) ? Math.max(1, parseInt(req.query.limit as string)) : 50;

        // Tomar puntos GPS directamente filtrando por organización (vía relación Session) y rango
        const whereGPS: any = {
            session: {
                organizationId,
                ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
            }
        };
        if (from && to) {
            const dFrom = new Date(from);
            const dToEx = new Date(to);
            dToEx.setDate(dToEx.getDate() + 1);
            whereGPS.timestamp = { gte: dFrom, lt: dToEx };
        }

        const gpsPoints = await prisma.gpsMeasurement.findMany({
            where: whereGPS,
            select: { timestamp: true, latitude: true, longitude: true, speed: true },
            orderBy: { timestamp: 'asc' },
            take: limit * 10
        });

        const step = Math.max(1, Math.ceil(gpsPoints.length / limit));
        const sample = gpsPoints.filter((_, idx) => idx % step === 0).slice(0, limit);

        const samples: Array<{ ts: string; lat: number; lon: number; speed: number; limit: number; excess: number; source: string }> = [];
        for (const p of sample) {
            let limitVal = 0;
            let source = 'tomtom';
            try {
                const lim = await tomtomSpeedLimitsService.obtenerLimiteVelocidad(p.latitude as number, p.longitude as number);
                limitVal = Number(lim.speedLimit) || 0;
                source = (lim as any).source || 'tomtom';
            } catch (e: any) {
                logger.warn('[Diagnostics] Error TomTom', { error: e?.message });
            }
            const speedVal = Number(p.speed) || 0;
            if (!limitVal || limitVal <= 0) {
                const inPark = isInPark(p.latitude as number, p.longitude as number);
                const rt = getRoadType(speedVal || 0, inPark);
                limitVal = getSpeedLimit('', rt, false, inPark);
                source = 'fallback';
            }
            samples.push({ ts: p.timestamp.toISOString(), lat: p.latitude as number, lon: p.longitude as number, speed: speedVal, limit: limitVal, excess: speedVal - limitVal, source });
        }

        logger.info('[Diagnostics] Muestreados', { totalPointsConsidered: gpsPoints.length, samples: samples.length });
        res.json({ success: true, data: { samples, totalPointsConsidered: gpsPoints.length } });
    } catch (error) {
        logger.error('Error en /api/speed/diagnostics', error);
        res.status(500).json({ success: false, error: 'Error interno en diagnóstico' });
    }
});

// Muestra rápida de puntos GPS con velocidad (Haversine) y límite fallback
router.get('/quick-sample', async (req, res) => {
    try {
        const organizationId = (req.query.organizationId as string) || 'default-org';
        const from = (req.query.from as string) || (req.query.startDate as string);
        const to = (req.query.to as string) || (req.query.endDate as string);
        const vehicleIds = req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined;
        const limit = Number.isFinite(parseInt(req.query.limit as string)) ? Math.max(1, parseInt(req.query.limit as string)) : 50;

        const whereGPS: any = {
            session: {
                organizationId,
                ...(vehicleIds && vehicleIds.length > 0 ? { vehicleId: { in: vehicleIds } } : {})
            }
        };
        if (from && to) {
            const dFrom = new Date(from);
            const dToEx = new Date(to);
            dToEx.setDate(dToEx.getDate() + 1);
            whereGPS.timestamp = { gte: dFrom, lt: dToEx };
        }

        const gpsPoints = await prisma.gpsMeasurement.findMany({
            where: whereGPS,
            select: { sessionId: true, timestamp: true, latitude: true, longitude: true, speed: true },
            orderBy: { timestamp: 'asc' },
            take: limit * 5
        });

        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const out: Array<{ ts: string; lat: number; lon: number; speed: number; limit: number; excess: number; source: string; sid: string }> = [];
        for (let i = 0; i < gpsPoints.length; i++) {
            const p = gpsPoints[i];
            const prev = i > 0 && gpsPoints[i - 1].sessionId === p.sessionId ? gpsPoints[i - 1] : null;
            let speedVal = Number(p.speed) || 0;
            if ((!Number.isFinite(speedVal) || speedVal <= 0 || speedVal > 160) && prev) {
                const dtSec = Math.max(0, Math.floor((new Date(p.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000));
                if (dtSec > 0 && dtSec <= 120) {
                    const dKm = haversineKm(prev.latitude as number, prev.longitude as number, p.latitude as number, p.longitude as number);
                    const calcKmh = dKm * (3600 / dtSec);
                    if (Number.isFinite(calcKmh)) speedVal = calcKmh;
                }
            }
            if (!Number.isFinite(speedVal) || speedVal < 0) speedVal = 0;
            let limitVal = 0;
            let source = 'tomtom';
            try {
                const lim = await tomtomSpeedLimitsService.obtenerLimiteVelocidad(p.latitude as number, p.longitude as number);
                limitVal = Number(lim.speedLimit) || 0;
                source = (lim as any).source || 'tomtom';
            } catch (e: any) {
                logger.warn('[QuickSample] Error TomTom', { error: e?.message });
            }
            if (!limitVal || limitVal <= 0) {
                const inPark = isInPark(p.latitude as number, p.longitude as number);
                const rt = getRoadType(speedVal || 0, inPark);
                limitVal = getSpeedLimit('', rt, false, inPark);
                source = 'fallback';
            }
            out.push({ ts: new Date(p.timestamp).toISOString(), lat: p.latitude as number, lon: p.longitude as number, speed: Math.round(speedVal * 10) / 10, limit: limitVal, excess: Math.round((speedVal - limitVal) * 10) / 10, source, sid: p.sessionId });
            if (out.length >= limit) break;
        }

        logger.info('[QuickSample] Respuesta', { totalPoints: gpsPoints.length, returned: out.length });
        res.json({ success: true, data: { sample: out, totalPoints: gpsPoints.length } });
    } catch (error) {
        logger.error('Error en /api/speed/quick-sample', error);
        res.status(500).json({ success: false, error: 'Error interno en quick-sample' });
    }
});

