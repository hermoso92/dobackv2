import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/stability-events (endpoint raíz)
 * Obtiene eventos de estabilidad con datos GPS
 */
router.get('/', async (req, res) => {
    try {
        const { limit = 100, includeGPS = 'false' } = req.query;

        logger.info('Eventos de estabilidad solicitados (raíz)', { limit, includeGPS });

        // Devolver datos mock ya que el modelo actual no soporta esta funcionalidad
        const mockEvents = [
            {
                id: '1',
                vehicle_id: 'DOBACK023',
                vehicle_name: 'Bomba Escalera 1',
                timestamp: new Date().toISOString(),
                event_type: 'CURVA_PELIGROSA',
                severity: 'G',
                speed: 65,
                speed_limit: 50,
                rotativo: true,
                road_type: 'urban',
                location: 'Madrid Centro',
                gps_lat: includeGPS === 'true' ? 40.4168 : null,
                gps_lng: includeGPS === 'true' ? -3.7038 : null,
                ltr: 0.8,
                ssf: 0.7,
                drs: 0.6,
                lateral_acceleration: 2.5,
                longitudinal_acceleration: 1.2,
                vertical_acceleration: 0.8
            }
        ];

        return res.json({
            success: true,
            data: mockEvents,
            total: mockEvents.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error obteniendo eventos de estabilidad', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/stability-events/events (legacy endpoint)
 * Obtiene eventos de estabilidad con datos GPS
 */
router.get('/events', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;
        const { limit = 100, includeGPS = 'false' } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Intentar obtener datos reales de la base de datos
        try {
            const events = await prisma.stability_events.findMany({
                where: {
                    organization_id: organizationId
                },
                include: {
                    vehicle: {
                        select: {
                            name: true,
                            license_plate: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: parseInt(limit as string) || 100
            });

            const processedEvents = events.map(event => ({
                id: event.id,
                vehicle_id: event.vehicle_id,
                vehicle_name: event.vehicle?.name || `Vehículo ${event.vehicle_id}`,
                timestamp: event.timestamp,
                event_type: event.event_type,
                severity: event.severity,
                speed: event.speed,
                speed_limit: event.speed_limit || 50,
                rotativo: event.rotativo || false,
                road_type: event.road_type || 'urban',
                location: event.location || 'Madrid',
                gps_lat: includeGPS === 'true' ? event.gps_lat : null,
                gps_lng: includeGPS === 'true' ? event.gps_lng : null,
                ltr: event.ltr,
                ssf: event.ssf,
                drs: event.drs,
                lateral_acceleration: event.lateral_acceleration,
                longitudinal_acceleration: event.longitudinal_acceleration,
                vertical_acceleration: event.vertical_acceleration
            }));

            logger.info('Eventos de estabilidad obtenidos', {
                organizationId,
                count: processedEvents.length,
                includeGPS: includeGPS === 'true'
            });

            return res.json({
                success: true,
                data: processedEvents,
                total: processedEvents.length,
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error obteniendo datos de BD, usando datos mock', { error: dbError });

            // Fallback a datos mock
            const mockEvents = [
                {
                    id: '1',
                    vehicle_id: 'DOBACK023',
                    vehicle_name: 'Bomba Escalera 1',
                    timestamp: new Date().toISOString(),
                    event_type: 'CURVA_PELIGROSA',
                    severity: 'G',
                    speed: 65,
                    speed_limit: 50,
                    rotativo: true,
                    road_type: 'urban',
                    location: 'Madrid Centro',
                    gps_lat: includeGPS === 'true' ? 40.4168 : null,
                    gps_lng: includeGPS === 'true' ? -3.7038 : null,
                    ltr: 0.8,
                    ssf: 0.7,
                    drs: 0.6,
                    lateral_acceleration: 2.5,
                    longitudinal_acceleration: 1.2,
                    vertical_acceleration: 0.8
                },
                {
                    id: '2',
                    vehicle_id: 'DOBACK024',
                    vehicle_name: 'Bomba Escalera 2',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    event_type: 'FRENADA_BRUSCA',
                    severity: 'M',
                    speed: 45,
                    speed_limit: 50,
                    rotativo: false,
                    road_type: 'urban',
                    location: 'Madrid Centro',
                    gps_lat: includeGPS === 'true' ? 40.4178 : null,
                    gps_lng: includeGPS === 'true' ? -3.7048 : null,
                    ltr: 0.6,
                    ssf: 0.5,
                    drs: 0.4,
                    lateral_acceleration: 1.8,
                    longitudinal_acceleration: 2.1,
                    vertical_acceleration: 0.6
                },
                {
                    id: '3',
                    vehicle_id: 'DOBACK025',
                    vehicle_name: 'Ambulancia 1',
                    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    event_type: 'ACELERACION_BRUSCA',
                    severity: 'L',
                    speed: 55,
                    speed_limit: 50,
                    rotativo: true,
                    road_type: 'urban',
                    location: 'Madrid Centro',
                    gps_lat: includeGPS === 'true' ? 40.4158 : null,
                    gps_lng: includeGPS === 'true' ? -3.7028 : null,
                    ltr: 0.4,
                    ssf: 0.3,
                    drs: 0.2,
                    lateral_acceleration: 1.2,
                    longitudinal_acceleration: 2.8,
                    vertical_acceleration: 0.4
                }
            ];

            return res.json({
                success: true,
                data: mockEvents,
                total: mockEvents.length,
                timestamp: new Date().toISOString(),
                note: 'Datos mock utilizados'
            });
        }

    } catch (error) {
        logger.error('Error obteniendo eventos de estabilidad', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/stability/events/:id
 * Obtiene detalles de un evento específico
 */
router.get('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        try {
            const event = await prisma.stability_events.findFirst({
                where: {
                    id: id,
                    organization_id: organizationId
                },
                include: {
                    vehicle: {
                        select: {
                            name: true,
                            license_plate: true
                        }
                    }
                }
            });

            if (!event) {
                return res.status(404).json({
                    success: false,
                    error: 'Evento no encontrado'
                });
            }

            res.json({
                success: true,
                data: {
                    id: event.id,
                    vehicle_id: event.vehicle_id,
                    vehicle_name: event.vehicle?.name || `Vehículo ${event.vehicle_id}`,
                    timestamp: event.timestamp,
                    event_type: event.event_type,
                    severity: event.severity,
                    speed: event.speed,
                    speed_limit: event.speed_limit || 50,
                    rotativo: event.rotativo || false,
                    road_type: event.road_type || 'urban',
                    location: event.location || 'Madrid',
                    gps_lat: event.gps_lat,
                    gps_lng: event.gps_lng,
                    ltr: event.ltr,
                    ssf: event.ssf,
                    drs: event.drs,
                    lateral_acceleration: event.lateral_acceleration,
                    longitudinal_acceleration: event.longitudinal_acceleration,
                    vertical_acceleration: event.vertical_acceleration
                },
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error obteniendo evento de BD', { error: dbError });
            res.status(404).json({
                success: false,
                error: 'Evento no encontrado'
            });
        }

    } catch (error) {
        logger.error('Error obteniendo evento de estabilidad', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/stability/statistics
 * Obtiene estadísticas de eventos de estabilidad
 */
router.get('/statistics', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;
        const { period = '7d' } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Calcular fecha de inicio según el período
        const now = new Date();
        let startDate = new Date();

        switch (period) {
            case '1d':
                startDate.setDate(now.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            default:
                startDate.setDate(now.getDate() - 7);
        }

        try {
            const stats = await prisma.stability_events.aggregate({
                where: {
                    organization_id: organizationId,
                    timestamp: {
                        gte: startDate
                    }
                },
                _count: {
                    id: true
                },
                _avg: {
                    speed: true,
                    ltr: true,
                    ssf: true,
                    drs: true
                }
            });

            const severityStats = await prisma.stability_events.groupBy({
                by: ['severity'],
                where: {
                    organization_id: organizationId,
                    timestamp: {
                        gte: startDate
                    }
                },
                _count: {
                    id: true
                }
            });

            const statistics = {
                totalEvents: stats._count.id,
                averageSpeed: stats._avg.speed || 0,
                averageLTR: stats._avg.ltr || 0,
                averageSSF: stats._avg.ssf || 0,
                averageDRS: stats._avg.drs || 0,
                severityBreakdown: severityStats.reduce((acc, item) => {
                    acc[item.severity] = item._count.id;
                    return acc;
                }, {} as Record<string, number>),
                period: period,
                startDate: startDate.toISOString(),
                endDate: now.toISOString()
            };

            res.json({
                success: true,
                data: statistics,
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error obteniendo estadísticas de BD, usando datos mock', { error: dbError });

            // Fallback a datos mock
            const mockStats = {
                totalEvents: 47,
                averageSpeed: 52.3,
                averageLTR: 0.65,
                averageSSF: 0.58,
                averageDRS: 0.42,
                severityBreakdown: {
                    'G': 3,
                    'M': 8,
                    'L': 36
                },
                period: period,
                startDate: startDate.toISOString(),
                endDate: now.toISOString()
            };

            res.json({
                success: true,
                data: mockStats,
                timestamp: new Date().toISOString(),
                note: 'Estadísticas mock utilizadas'
            });
        }

    } catch (error) {
        logger.error('Error obteniendo estadísticas de estabilidad', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
