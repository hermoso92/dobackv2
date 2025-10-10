import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { speedAnalyzer } from '../services/speedAnalyzer';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

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
    violationType: 'grave' | 'leve' | 'correcto';
    rotativoOn: boolean;
    inPark: boolean;
    roadType: 'urban' | 'interurban' | 'highway';
    excess: number;
}

// Interface para filtros de velocidad
interface SpeedFilters {
    rotativoFilter?: 'all' | 'on' | 'off';
    parkFilter?: 'all' | 'in' | 'out';
    violationFilter?: 'all' | 'grave' | 'leve' | 'correcto';
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

// Función para clasificar violación
function classifySpeedViolation(speed: number, speedLimit: number): 'correcto' | 'leve' | 'grave' {
    const excess = speed - speedLimit;

    if (excess <= 0) return 'correcto';
    if (excess <= 20) return 'leve';
    return 'grave';
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
        const filters: SpeedFilters = {
            rotativoFilter: req.query.rotativoOn as any || 'all',
            parkFilter: req.query.inPark as any || 'all',
            violationFilter: req.query.violationType as any || 'all',
            vehicleIds: req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            minSpeed: parseInt(req.query.minSpeed as string) || 0
        };

        logger.info('Obteniendo violaciones de velocidad con speedAnalyzer', { organizationId, filters });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: filters.vehicleIds };
        }

        if (filters.startDate || filters.endDate) {
            sessionsWhere.startTime = {};
            if (filters.startDate) sessionsWhere.startTime.gte = new Date(filters.startDate);
            if (filters.endDate) sessionsWhere.startTime.lte = new Date(filters.endDate);
        }

        // Obtener sesiones filtradas
        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true, vehicleId: true },
            take: 100 // Limitar para performance
        });

        const sessionIds = sessions.map(s => s.id);

        logger.info(`Analizando velocidades en ${sessionIds.length} sesiones`);

        // Usar speedAnalyzer para obtener excesos
        const analisisVelocidad = await speedAnalyzer.analizarVelocidades(sessionIds);

        // Obtener nombres de vehículos
        const vehiculos = await prisma.vehicle.findMany({
            where: { organizationId },
            select: { id: true, name: true, identifier: true }
        });
        const vehiculosMap = new Map(vehiculos.map(v => [v.id, v.name || v.identifier]));

        // Convertir excesos a formato SpeedViolation
        const speedViolations: SpeedViolation[] = analisisVelocidad.excesos.map(exceso => {
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
            const violationType: 'grave' | 'leve' | 'correcto' =
                exceso.severidad === 'GRAVE' ? 'grave' :
                    exceso.severidad === 'MODERADA' || exceso.severidad === 'LEVE' ? 'leve' :
                        'correcto';

            return {
                id: `${exceso.sessionId}_${exceso.timestamp.getTime()}`,
                vehicleId: exceso.vehicleId,
                vehicleName: vehiculosMap.get(exceso.vehicleId) || exceso.vehicleId,
                timestamp: exceso.timestamp.toISOString(),
                lat: exceso.lat,
                lng: exceso.lon,
                speed: exceso.velocidad,
                speedLimit: exceso.limite,
                violationType,
                rotativoOn: exceso.rotativoOn,
                inPark,
                roadType,
                excess: exceso.exceso
            };
        });

        logger.info(`Excesos convertidos: ${speedViolations.length}`);

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
            filteredViolations = filteredViolations.filter(v => v.speed >= filters.minSpeed);
        }

        // Calcular estadísticas
        const stats = {
            total: filteredViolations.length,
            graves: filteredViolations.filter(v => v.violationType === 'grave').length,
            leves: filteredViolations.filter(v => v.violationType === 'leve').length,
            correctos: filteredViolations.filter(v => v.violationType === 'correcto').length,
            withRotativo: filteredViolations.filter(v => v.rotativoOn).length,
            withoutRotativo: filteredViolations.filter(v => !v.rotativoOn).length,
            avgSpeedExcess: filteredViolations.length > 0 ?
                filteredViolations.reduce((sum, v) => sum + v.excess, 0) / filteredViolations.length :
                0
        };

        logger.info('Violaciones procesadas', {
            total: stats.total,
            graves: stats.graves,
            leves: stats.leves,
            correctos: stats.correctos
        });

        res.json({
            success: true,
            data: {
                violations: filteredViolations,
                stats,
                filters,
                summary: {
                    velocidad_maxima: analisisVelocidad.velocidad_maxima,
                    velocidad_promedio: analisisVelocidad.velocidad_promedio,
                    excesos_totales: analisisVelocidad.excesos_totales,
                    excesos_graves: analisisVelocidad.excesos_graves,
                    excesos_justificados: analisisVelocidad.excesos_justificados
                }
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
            whereConditions.Session.vehicleId = vehicleId;
        }

        if (startDate && endDate) {
            whereConditions.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        // Obtener eventos de estabilidad con velocidad
        const events = await prisma.stabilityEvent.findMany({
            where: whereConditions,
            include: {
                Session: {
                    include: {
                        vehicle: true
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
                    vehicleName: event.Session.vehicle.name,
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
            orderBy: { timestamp: 'desc' },
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

        // Convertir a eventos de velocidad con clasificación
        const speedEvents = filteredGpsData
            .filter((gps: any) => gps.speed !== null && gps.latitude !== null && gps.longitude !== null)
            .map((gps: any) => {
                const inPark = isInPark(gps.latitude, gps.longitude);
                const roadType = getRoadType(gps.speed || 0, inPark);
                const speedLimit = getSpeedLimit(
                    gps.Session?.vehicleId || '',
                    roadType,
                    gps.rotativoState ? gps.rotativoState > 0 : false,
                    inPark
                );
                const violationType = classifySpeedViolation(gps.speed || 0, speedLimit);
                const excess = (gps.speed || 0) - speedLimit;

                return {
                    lat: gps.latitude,
                    lng: gps.longitude,
                    speed: gps.speed || 0,
                    speedLimit,
                    violationType,
                    excess,
                    rotativo: gps.rotativoState ? gps.rotativoState > 0 : false,
                    vehicleId: gps.Session?.vehicleId || '',
                    vehicleName: gps.Session?.Vehicle?.name || '',
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

