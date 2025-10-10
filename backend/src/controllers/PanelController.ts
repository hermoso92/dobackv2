import { Request, Response } from 'express';
import {
    Alert,
    GeofenceStats,
    HeatmapData,
    KPIData,
    RealtimeEvent,
    SpeedStats,
    TimeStats,
    VehicleStats
} from '../../frontend/src/types/panel';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

export class PanelController {
    /**
     * Obtiene KPIs numéricas con filtros
     */
    getKPIs = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Construir filtros de fecha
            const dateFilter: any = {};
            if (from) dateFilter.gte = new Date(from as string);
            if (to) dateFilter.lte = new Date(to as string);

            // Construir filtros de vehículo
            const vehicleFilter: any = {};
            if (vehicleId) vehicleFilter.vehicleId = vehicleId as string;

            // Obtener vehículos activos
            const vehiclesActive = await prisma.vehicle.count({
                where: {
                    organizationId: orgId,
                    ...vehicleFilter
                }
            });

            // Obtener sesiones de telemetría
            const sessions = await prisma.telemetrySession.findMany({
                where: {
                    organizationId: orgId,
                    startedAt: dateFilter,
                    ...vehicleFilter
                },
                include: {
                    points: true,
                    events: true
                }
            });

            // Calcular métricas
            const totalKm = sessions.reduce((sum, session) => {
                return sum + (session.summary?.km || 0);
            }, 0);

            const totalPoints = sessions.reduce((sum, session) => {
                return sum + session.points.length;
            }, 0);

            // Calcular tiempo por ubicación (mock data por ahora)
            const timeInYard = Math.floor(Math.random() * 1000) + 500;
            const timeOutYard = Math.floor(Math.random() * 2000) + 1000;
            const timeInWorkshop = Math.floor(Math.random() * 200) + 100;

            // Obtener eventos de velocidad
            const speedEvents = await prisma.event.findMany({
                where: {
                    organizationId: orgId,
                    type: 'speed_exceeded',
                    timestamp: dateFilter,
                    ...vehicleFilter
                },
                include: {
                    vehicle: true
                }
            });

            // Top vehículos con excesos
            const vehicleSpeedCounts = speedEvents.reduce((acc, event) => {
                const vehicleId = event.vehicleId;
                if (!acc[vehicleId]) {
                    acc[vehicleId] = {
                        vehicleId,
                        vehicleName: event.vehicle?.name || `Vehículo ${vehicleId}`,
                        count: 0
                    };
                }
                acc[vehicleId].count++;
                return acc;
            }, {} as Record<string, any>);

            const topVehicles = Object.values(vehicleSpeedCounts)
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 5);

            // Eventos por severidad
            const incidentsBySeverity = await prisma.event.groupBy({
                by: ['severity'],
                where: {
                    organizationId: orgId,
                    timestamp: dateFilter,
                    ...vehicleFilter
                },
                _count: {
                    severity: true
                }
            });

            const severityCounts = {
                LOW: 0,
                MEDIUM: 0,
                HIGH: 0,
                CRITICAL: 0
            };

            incidentsBySeverity.forEach(item => {
                severityCounts[item.severity as keyof typeof severityCounts] = item._count.severity;
            });

            // Estadísticas de geocercas
            const geofenceEvents = await prisma.event.findMany({
                where: {
                    organizationId: orgId,
                    type: {
                        in: ['geofence_enter', 'geofence_exit', 'geofence_violation']
                    },
                    timestamp: dateFilter,
                    ...vehicleFilter
                }
            });

            const geofenceStats = {
                entries: geofenceEvents.filter(e => e.type === 'geofence_enter').length,
                exits: geofenceEvents.filter(e => e.type === 'geofence_exit').length,
                violations: geofenceEvents.filter(e => e.type === 'geofence_violation').length
            };

            const kpiData: KPIData = {
                vehiclesActive,
                km: totalKm,
                timeInYard,
                timeOutYard,
                timeInWorkshop,
                speeding: {
                    count: speedEvents.length,
                    topVehicles: topVehicles as any[]
                },
                incidentsBySeverity: severityCounts,
                geofence: geofenceStats
            };

            res.json({
                success: true,
                data: kpiData
            });

        } catch (error) {
            logger.error('Error obteniendo KPIs', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene datos de heatmap
     */
    getHeatmapData = async (req: Request, res: Response) => {
        try {
            const { type } = req.params;
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Construir filtros
            const dateFilter: any = {};
            if (from) dateFilter.gte = new Date(from as string);
            if (to) dateFilter.lte = new Date(to as string);

            const vehicleFilter: any = {};
            if (vehicleId) vehicleFilter.vehicleId = vehicleId as string;

            let events;
            let eventType;

            switch (type) {
                case 'speeding':
                    eventType = 'speed_exceeded';
                    break;
                case 'critical':
                    eventType = 'critical_event';
                    break;
                case 'violations':
                    eventType = 'geofence_violation';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Tipo de heatmap no válido'
                    });
            }

            events = await prisma.event.findMany({
                where: {
                    organizationId: orgId,
                    type: eventType,
                    timestamp: dateFilter,
                    ...vehicleFilter
                },
                include: {
                    vehicle: true
                }
            });

            // Convertir eventos a puntos de heatmap
            const points = events.map(event => ({
                lat: event.lat,
                lng: event.lng,
                intensity: Math.random(), // Mock intensity
                timestamp: event.timestamp.toISOString(),
                vehicleId: event.vehicleId,
                eventType: event.type
            }));

            const heatmapData: HeatmapData = {
                type: type as any,
                points
            };

            res.json({
                success: true,
                data: heatmapData
            });

        } catch (error) {
            logger.error('Error obteniendo datos de heatmap', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene alertas
     */
    getAlerts = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId, severity, eventType } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Construir filtros
            const where: any = {
                organizationId: orgId
            };

            if (from || to) {
                where.timestamp = {};
                if (from) where.timestamp.gte = new Date(from as string);
                if (to) where.timestamp.lte = new Date(to as string);
            }

            if (vehicleId) where.vehicleId = vehicleId as string;
            if (severity) where.severity = severity as string;
            if (eventType) where.type = eventType as string;

            const events = await prisma.event.findMany({
                where,
                include: {
                    vehicle: true
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: 100
            });

            // Convertir eventos a alertas
            const alerts: Alert[] = events.map(event => ({
                id: event.id,
                timestamp: event.timestamp.toISOString(),
                type: event.type,
                severity: event.severity as any,
                vehicleId: event.vehicleId,
                vehicleName: event.vehicle?.name || `Vehículo ${event.vehicleId}`,
                message: `Evento ${event.type} en vehículo ${event.vehicle?.name || event.vehicleId}`,
                location: {
                    lat: event.lat,
                    lng: event.lng
                },
                metadata: event.meta
            }));

            res.json({
                success: true,
                data: alerts
            });

        } catch (error) {
            logger.error('Error obteniendo alertas', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Marca una alerta como leída
     */
    markAlertAsRead = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Por ahora solo simulamos marcar como leída
            // En una implementación real, tendrías una tabla de alertas con estado
            logger.info('Alerta marcada como leída', { alertId: id, orgId });

            res.json({
                success: true,
                data: { id, read: true }
            });

        } catch (error) {
            logger.error('Error marcando alerta como leída', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene eventos en tiempo real
     */
    getRealtimeEvents = async (req: Request, res: Response) => {
        try {
            const { limit = 50 } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Obtener eventos recientes (últimas 24 horas)
            const events = await prisma.event.findMany({
                where: {
                    organizationId: orgId,
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    vehicle: true
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: parseInt(limit as string)
            });

            // Convertir eventos a eventos en tiempo real
            const realtimeEvents: RealtimeEvent[] = events.map(event => ({
                id: event.id,
                timestamp: event.timestamp.toISOString(),
                type: event.type,
                severity: event.severity as any,
                vehicleId: event.vehicleId,
                vehicleName: event.vehicle?.name || `Vehículo ${event.vehicleId}`,
                location: {
                    lat: event.lat,
                    lng: event.lng
                },
                data: {
                    message: `Evento ${event.type} en vehículo ${event.vehicle?.name || event.vehicleId}`,
                    metadata: event.meta
                }
            }));

            res.json({
                success: true,
                data: realtimeEvents
            });

        } catch (error) {
            logger.error('Error obteniendo eventos en tiempo real', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene estadísticas de vehículos
     */
    getVehicleStats = async (req: Request, res: Response) => {
        try {
            const { from, to } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Construir filtros de fecha
            const dateFilter: any = {};
            if (from) dateFilter.gte = new Date(from as string);
            if (to) dateFilter.lte = new Date(to as string);

            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: orgId
                },
                include: {
                    sessions: {
                        where: {
                            startedAt: dateFilter
                        },
                        include: {
                            points: true,
                            events: true
                        }
                    }
                }
            });

            const vehicleStats: VehicleStats[] = vehicles.map(vehicle => {
                const totalKm = vehicle.sessions.reduce((sum, session) => {
                    return sum + (session.summary?.km || 0);
                }, 0);

                const totalTime = vehicle.sessions.reduce((sum, session) => {
                    const start = new Date(session.startedAt);
                    const end = session.endedAt ? new Date(session.endedAt) : new Date();
                    return sum + (end.getTime() - start.getTime()) / 1000 / 60; // minutos
                }, 0);

                const totalPoints = vehicle.sessions.reduce((sum, session) => {
                    return sum + session.points.length;
                }, 0);

                const incidentsCount = vehicle.sessions.reduce((sum, session) => {
                    return sum + session.events.length;
                }, 0);

                const avgSpeed = totalPoints > 0 ?
                    vehicle.sessions.reduce((sum, session) => {
                        return sum + (session.summary?.avgSpeed || 0);
                    }, 0) / vehicle.sessions.length : 0;

                const maxSpeed = Math.max(...vehicle.sessions.map(session =>
                    session.summary?.maxSpeed || 0
                ));

                return {
                    vehicleId: vehicle.id,
                    vehicleName: vehicle.name,
                    totalKm,
                    totalTime,
                    avgSpeed,
                    maxSpeed,
                    incidentsCount,
                    lastUpdate: new Date().toISOString()
                };
            });

            res.json({
                success: true,
                data: vehicleStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de vehículos', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene estadísticas de tiempo
     */
    getTimeStats = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Mock data por ahora
            const timeStats: TimeStats = {
                inYard: Math.floor(Math.random() * 1000) + 500,
                outYard: Math.floor(Math.random() * 2000) + 1000,
                inWorkshop: Math.floor(Math.random() * 200) + 100,
                total: Math.floor(Math.random() * 3000) + 1500
            };

            res.json({
                success: true,
                data: timeStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de tiempo', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene estadísticas de velocidad
     */
    getSpeedStats = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Mock data por ahora
            const speedStats: SpeedStats = {
                totalViolations: Math.floor(Math.random() * 100) + 50,
                avgViolationSpeed: Math.floor(Math.random() * 20) + 80,
                maxViolationSpeed: Math.floor(Math.random() * 30) + 120,
                topViolationZones: [
                    {
                        lat: 40.4168 + (Math.random() - 0.5) * 0.1,
                        lng: -3.7038 + (Math.random() - 0.5) * 0.1,
                        count: Math.floor(Math.random() * 20) + 5,
                        avgSpeed: Math.floor(Math.random() * 20) + 80
                    }
                ]
            };

            res.json({
                success: true,
                data: speedStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de velocidad', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene estadísticas de geocercas
     */
    getGeofenceStats = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Mock data por ahora
            const geofenceStats: GeofenceStats = {
                totalEntries: Math.floor(Math.random() * 200) + 100,
                totalExits: Math.floor(Math.random() * 200) + 100,
                totalViolations: Math.floor(Math.random() * 50) + 20,
                mostActiveGeofences: [
                    {
                        geofenceId: '1',
                        geofenceName: 'Almacén Central',
                        entries: Math.floor(Math.random() * 50) + 20,
                        exits: Math.floor(Math.random() * 50) + 20,
                        violations: Math.floor(Math.random() * 10) + 5
                    }
                ]
            };

            res.json({
                success: true,
                data: geofenceStats
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de geocercas', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };

    /**
     * Obtiene resumen ejecutivo
     */
    getExecutiveSummary = async (req: Request, res: Response) => {
        try {
            const { from, to, vehicleId } = req.query;
            const orgId = req.orgId;

            if (!orgId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            // Mock data por ahora
            const summary = {
                summary: "Resumen ejecutivo de la flota para el período seleccionado. Se observa un incremento del 5.2% en vehículos activos y una reducción del 2.1% en kilómetros recorridos.",
                trends: [
                    {
                        metric: "Vehículos Activos",
                        change: 5.2,
                        direction: "up" as const,
                        period: "vs semana pasada"
                    },
                    {
                        metric: "Kilómetros Totales",
                        change: -2.1,
                        direction: "down" as const,
                        period: "vs semana pasada"
                    },
                    {
                        metric: "Incidentes",
                        change: 0.8,
                        direction: "stable" as const,
                        period: "vs semana pasada"
                    }
                ],
                recommendations: [
                    {
                        type: "warning" as const,
                        message: "Aumento del 12.3% en violaciones de geocercas. Revisar configuración de alertas.",
                        action: "Configurar alertas"
                    },
                    {
                        type: "info" as const,
                        message: "3 vehículos requieren mantenimiento programado.",
                        action: "Ver mantenimiento"
                    },
                    {
                        type: "success" as const,
                        message: "Reducción del 15% en excesos de velocidad. Buen trabajo del equipo.",
                        action: null
                    }
                ]
            };

            res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            logger.error('Error obteniendo resumen ejecutivo', { error, orgId: req.orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}
