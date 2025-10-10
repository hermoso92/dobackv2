import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Interface para punto crítico
interface CriticalPoint {
    id: string;
    lat: number;
    lng: number;
    location: string;
    severity: 'grave' | 'moderada' | 'leve';
    frequency: number;
    lastOccurrence: string;
    vehicleIds: string[];
}

// Interface para filtros de estabilidad
interface StabilityFilters {
    severity?: 'all' | 'grave' | 'moderada' | 'leve';
    minFrequency?: number;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
    parkId?: string;
}

/**
 * GET /api/stability/critical-points
 * Obtiene puntos críticos con filtros de gravedad y frecuencia
 */
router.get('/critical-points', async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId || 'default';
        const filters: StabilityFilters = {
            severity: req.query.severity as any || 'all',
            minFrequency: parseInt(req.query.minFrequency as string) || 1,
            vehicleIds: req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            parkId: req.query.parkId as string
        };

        logger.info('Obteniendo puntos críticos', { organizationId, filters });

        // Construir condiciones de filtro
        const whereConditions: any = {
            vehicle: {
                organizationId
            }
        };

        // Filtro por fechas
        if (filters.startDate && filters.endDate) {
            whereConditions.timestamp = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        // Filtro por vehículos
        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            whereConditions.vehicleId = {
                in: filters.vehicleIds
            };
        }

        // Filtro por parque
        if (filters.parkId) {
            whereConditions.park = filters.parkId;
        }

        // Obtener eventos de estabilidad
        const events = await prisma.stabilityEvent.findMany({
            where: whereConditions,
            select: {
                id: true,
                vehicleId: true,
                vehicle: {
                    select: {
                        name: true
                    }
                },
                timestamp: true,
                lat: true,
                lng: true,
                location: true,
                severity: true,
                stability: true,
                speed: true,
                rotativo: true
            },
            orderBy: { timestamp: 'desc' }
        });

        logger.info(`Encontrados ${events.length} eventos de estabilidad`);

        // Procesar eventos para obtener puntos críticos
        const pointsMap = new Map<string, CriticalPoint>();

        events.forEach((event) => {
            // Agrupar por ubicación (redondeado a 4 decimales)
            const key = `${event.lat.toFixed(4)},${event.lng.toFixed(4)}`;

            if (pointsMap.has(key)) {
                const point = pointsMap.get(key)!;
                point.frequency++;
                point.vehicleIds = [...new Set([...point.vehicleIds, event.vehicleId])];

                // Actualizar última ocurrencia si es más reciente
                if (new Date(event.timestamp) > new Date(point.lastOccurrence)) {
                    point.lastOccurrence = event.timestamp.toISOString();
                }

                // Mantener la severidad más alta
                const severityOrder = { grave: 3, moderada: 2, leve: 1 };
                const currentSeverityOrder = severityOrder[point.severity];
                const eventSeverityOrder = severityOrder[event.severity as keyof typeof severityOrder] || 0;

                if (eventSeverityOrder > currentSeverityOrder) {
                    point.severity = event.severity as 'grave' | 'moderada' | 'leve';
                }
            } else {
                // Solo crear punto si la severidad es válida
                const validSeverities: Array<'grave' | 'moderada' | 'leve'> = ['grave', 'moderada', 'leve'];
                const severity = validSeverities.includes(event.severity as any)
                    ? (event.severity as 'grave' | 'moderada' | 'leve')
                    : 'leve';

                pointsMap.set(key, {
                    id: key,
                    lat: event.lat,
                    lng: event.lng,
                    location: event.location,
                    severity,
                    frequency: 1,
                    lastOccurrence: event.timestamp.toISOString(),
                    vehicleIds: [event.vehicleId]
                });
            }
        });

        // Convertir a array y aplicar filtros
        let criticalPoints = Array.from(pointsMap.values());

        // Filtro de severidad
        if (filters.severity !== 'all') {
            criticalPoints = criticalPoints.filter(point => point.severity === filters.severity);
        }

        // Filtro de frecuencia mínima
        criticalPoints = criticalPoints.filter(point => point.frequency >= filters.minFrequency!);

        // Ordenar por frecuencia y severidad
        criticalPoints.sort((a, b) => {
            // Primero por frecuencia
            if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency;
            }
            // Luego por severidad
            const severityOrder = { grave: 3, moderada: 2, leve: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });

        logger.info(`Procesados ${criticalPoints.length} puntos críticos`);

        res.json({
            success: true,
            data: {
                criticalPoints,
                totalEvents: events.length,
                totalPoints: pointsMap.size,
                filteredPoints: criticalPoints.length,
                filters
            }
        });

    } catch (error) {
        logger.error('Error obteniendo puntos críticos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/stability/events
 * Obtiene eventos de estabilidad con filtros
 */
router.get('/events', async (req, res) => {
    try {
        const organizationId = (req as any).user?.organizationId || 'default';
        const filters: StabilityFilters = {
            severity: req.query.severity as any || 'all',
            vehicleIds: req.query.vehicleIds ? (req.query.vehicleIds as string).split(',') : undefined,
            startDate: req.query.startDate as string,
            endDate: req.query.endDate as string,
            parkId: req.query.parkId as string
        };

        logger.info('Obteniendo eventos de estabilidad', { organizationId, filters });

        // Construir condiciones de filtro
        const whereConditions: any = {
            vehicle: {
                organizationId
            }
        };

        // Filtro por fechas
        if (filters.startDate && filters.endDate) {
            whereConditions.timestamp = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate)
            };
        }

        // Filtro por vehículos
        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            whereConditions.vehicleId = {
                in: filters.vehicleIds
            };
        }

        // Filtro por parque
        if (filters.parkId) {
            whereConditions.park = filters.parkId;
        }

        // Filtro por severidad
        if (filters.severity && filters.severity !== 'all') {
            whereConditions.severity = filters.severity;
        }

        // Obtener eventos
        const events = await prisma.stabilityEvent.findMany({
            where: whereConditions,
            select: {
                id: true,
                vehicleId: true,
                vehicle: {
                    select: {
                        name: true
                    }
                },
                timestamp: true,
                lat: true,
                lng: true,
                location: true,
                severity: true,
                stability: true,
                speed: true,
                rotativo: true,
                acceleration: true,
                heading: true,
                description: true,
                sessionId: true
            },
            orderBy: { timestamp: 'desc' },
            take: 1000 // Limitar a 1000 eventos para rendimiento
        });

        logger.info(`Encontrados ${events.length} eventos de estabilidad`);

        res.json({
            success: true,
            data: {
                events: events.map(event => ({
                    id: event.id,
                    vehicleId: event.vehicleId,
                    vehicleName: event.vehicle.name,
                    timestamp: event.timestamp.toISOString(),
                    lat: event.lat,
                    lng: event.lng,
                    location: event.location,
                    severity: event.severity,
                    stability: event.stability,
                    speed: event.speed,
                    rotativo: event.rotativo,
                    acceleration: event.acceleration,
                    heading: event.heading,
                    description: event.description,
                    sessionId: event.sessionId
                })),
                total: events.length,
                filters
            }
        });

    } catch (error) {
        logger.error('Error obteniendo eventos de estabilidad:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: (error as Error).message
        });
    }
});

export default router;
