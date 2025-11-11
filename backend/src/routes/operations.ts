/**
 * 🔧 RUTAS DEL MÓDULO DE OPERACIONES
 * Endpoints unificados para Eventos Críticos, Alertas y Mantenimiento
 */

import { MaintenanceStatus, MaintenanceType, Prisma } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/operations/critical-events
 * Obtiene eventos críticos reales de la tabla stability_events
 */
router.get('/critical-events', async (req: Request, res: Response) => {
    try {
        const { sessionId, severity, limit = '50', offset = '0', vehicleId } = req.query;
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID requerido'
            });
        }

        logger.info('[Operations] Obteniendo eventos críticos', {
            organizationId,
            sessionId,
            severity,
            limit,
            vehicleId
        });

        const limitNum = parseInt(limit as string, 10);
        const offsetNum = parseInt(offset as string, 10);

        const where: Prisma.stability_eventsWhereInput = {
            Session: {
                organizationId,
                ...(vehicleId && typeof vehicleId === 'string'
                    ? { vehicleId: vehicleId as string }
                    : {})
            }
        };

        if (sessionId && typeof sessionId === 'string') {
            where.session_id = sessionId as string;
        }

        if (severity && typeof severity === 'string' && severity !== 'ALL') {
            where.type = {
                contains: severity.toLowerCase()
            };
        }

        const [events, totalCount] = await Promise.all([
            prisma.stability_events.findMany({
                where,
                include: {
                    Session: {
                        include: {
                            Vehicle: {
                                select: {
                                    id: true,
                                    name: true,
                                    dobackId: true
                                }
                            }
                        }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: limitNum,
                skip: offsetNum
            }),
            prisma.stability_events.count({ where })
        ]);

        const transformedEvents = events.map(event => {
            const details = (event.details as any) || {};
            const vehicle = event.Session?.Vehicle;
            return {
                id: event.id,
                sessionId: event.session_id,
                timestamp: event.timestamp,
                lat: event.lat,
                lon: event.lon,
                type: event.type,
                level: details?.level || 'moderado',
                perc: details?.perc || 0,
                tipos: details?.tipos || [],
                valores: details?.valores || {},
                can: details?.can || {},
                vehicle: vehicle
                    ? {
                        id: vehicle.id,
                        name: vehicle.name,
                        dobackId: vehicle.dobackId
                    }
                    : null,
                vehicleId: vehicle?.id,
                vehicleName: vehicle?.name,
                location: {
                    lat: event.lat,
                    lng: event.lon
                },
                description: `Evento ${details?.level || 'moderado'}: ${(details?.tipos || []).join(', ')}`
            };
        });

        // Calcular estadísticas
        const stats = {
            total: totalCount,
            critical: transformedEvents.filter((e: any) => e.level === 'critico').length,
            high: transformedEvents.filter((e: any) => e.level === 'peligroso').length,
            medium: transformedEvents.filter((e: any) => e.level === 'moderado').length,
            low: transformedEvents.filter((e: any) => e.level === 'leve').length
        };

        logger.info('[Operations] Eventos críticos obtenidos', {
            count: events.length,
            total: totalCount,
            stats
        });

        res.json({
            success: true,
            data: {
                events: transformedEvents,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    hasMore: parseInt(offset as string) + events.length < totalCount
                },
                stats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Operations] Error obteniendo eventos críticos:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operations/alerts
 * Obtiene alertas basadas en eventos críticos y reglas configuradas
 */
router.get('/alerts', async (req: Request, res: Response) => {
    try {
        const { status, severity, limit = '50', offset = '0' } = req.query;
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID requerido'
            });
        }

        logger.info('[Operations] Obteniendo alertas', {
            organizationId,
            status,
            severity,
            limit
        });

        // Obtener eventos críticos recientes para generar alertas
        const recentEvents = await prisma.stability_events.findMany({
            where: {
                Session: {
                    organizationId
                },
                timestamp: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            },
            include: {
                Session: {
                    include: {
                        Vehicle: {
                            select: {
                                id: true,
                                name: true,
                                dobackId: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 100
        });

        // Transformar eventos en alertas
        let alerts = recentEvents.map(event => {
            const details = (event.details as any) || {};
            const level = details?.level || 'moderado';

            // Mapear nivel a severidad
            let alertSeverity: 'low' | 'medium' | 'high' | 'critical';
            switch (level) {
                case 'critico':
                    alertSeverity = 'critical';
                    break;
                case 'peligroso':
                    alertSeverity = 'high';
                    break;
                case 'moderado':
                    alertSeverity = 'medium';
                    break;
                default:
                    alertSeverity = 'low';
            }

            // Determinar tipo de alerta basado en los tipos de evento
            const tipos = details?.tipos || [];
            let alertType = 'stability';
            if (tipos.includes('VELOCIDAD_ALTA')) alertType = 'speed';
            if (tipos.includes('ACELERACION_LATERAL_ALTA')) alertType = 'stability';

            return {
                id: event.id,
                ruleId: 'auto-generated',
                ruleName: `Alerta de Estabilidad Automática`,
                vehicleId: event.Session?.vehicleId,
                vehicleName: event.Session?.Vehicle?.name,
                alertType,
                severity: alertSeverity,
                message: `${event.Session?.Vehicle?.name || 'Vehículo'} - ${level.toUpperCase()}: ${tipos.join(', ')}`,
                timestamp: event.timestamp.toISOString(),
                status: 'active' as const,
                data: {
                    level,
                    tipos,
                    valores: details?.valores || {},
                    location: {
                        lat: event.lat,
                        lon: event.lon
                    }
                }
            };
        });

        // Filtrar por severidad
        if (severity && typeof severity === 'string' && severity !== 'ALL') {
            alerts = alerts.filter(a => a.severity === severity);
        }

        // Filtrar por estado
        if (status && typeof status === 'string' && status !== 'ALL') {
            alerts = alerts.filter(a => a.status === status);
        }

        // Paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedAlerts = alerts.slice(offsetNum, offsetNum + limitNum);

        // Estadísticas
        const stats = {
            total: alerts.length,
            active: alerts.filter(a => a.status === 'active').length,
            critical: alerts.filter(a => a.severity === 'critical').length,
            high: alerts.filter(a => a.severity === 'high').length,
            medium: alerts.filter(a => a.severity === 'medium').length,
            low: alerts.filter(a => a.severity === 'low').length
        };

        logger.info('[Operations] Alertas obtenidas', {
            count: paginatedAlerts.length,
            total: alerts.length,
            stats
        });

        res.json({
            success: true,
            data: {
                alerts: paginatedAlerts,
                pagination: {
                    total: alerts.length,
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: offsetNum + paginatedAlerts.length < alerts.length
                },
                stats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Operations] Error obteniendo alertas:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operations/maintenance
 * Obtiene registros de mantenimiento reales de la base de datos
 */
router.get('/maintenance', async (req: Request, res: Response) => {
    try {
        const { vehicleId, type, status, limit = '50', offset = '0' } = req.query;
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID requerido'
            });
        }

        logger.info('[Operations] Obteniendo registros de mantenimiento', {
            organizationId,
            vehicleId,
            type,
            status
        });

        // Construir filtros
        const maintenanceWhere: Prisma.MaintenanceRecordWhereInput = {
            Vehicle: {
                organizationId
            }
        };

        if (vehicleId && typeof vehicleId === 'string') {
            maintenanceWhere.vehicleId = vehicleId as string;
        }

        if (type && typeof type === 'string' && type !== 'ALL' && Object.values(MaintenanceType).includes(type as MaintenanceType)) {
            maintenanceWhere.tipo = type as MaintenanceType;
        }

        if (status && typeof status === 'string' && status !== 'ALL' && Object.values(MaintenanceStatus).includes(status as MaintenanceStatus)) {
            maintenanceWhere.estado = status as MaintenanceStatus;
        }

        // Obtener registros de mantenimiento
        const maintenanceRecords = await prisma.maintenanceRecord.findMany({
            where: maintenanceWhere,
            include: {
                Vehicle: true,
                User: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                fecha: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        // Obtener conteo total
        const totalCount = await prisma.maintenanceRecord.count({ where: maintenanceWhere });

        // Transformar al formato esperado por el frontend
        const transformedRecords = maintenanceRecords.map(record => ({
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleName: record.Vehicle.name,
            type: record.tipo,
            title: record.descripcion,
            description: record.notas || record.descripcion,
            priority: record.prioridad,
            status: record.estado,
            scheduledDate: record.fecha.toISOString(),
            completedDate:
                record.estado === MaintenanceStatus.COMPLETED
                    ? record.updatedAt.toISOString()
                    : undefined,
            assignedTo: record.User?.name || 'Sin asignar',
            department: 'Mantenimiento',
            cost: record.costo ? parseFloat(record.costo.toString()) : undefined,
            parts: Array.isArray(record.partes) ? record.partes : [],
            notes: record.notas || '',
            createdAt: record.createdAt.toISOString(),
            updatedAt: record.updatedAt.toISOString()
        }));

        // Calcular estadísticas
        const stats = {
            total: totalCount,
            scheduled: maintenanceRecords.filter(r => r.estado === MaintenanceStatus.PENDING).length,
            in_progress: maintenanceRecords.filter(r => r.estado === MaintenanceStatus.IN_PROGRESS).length,
            completed: maintenanceRecords.filter(r => r.estado === MaintenanceStatus.COMPLETED).length,
            cancelled: maintenanceRecords.filter(r => r.estado === MaintenanceStatus.CANCELLED).length,
            totalCost: maintenanceRecords.reduce(
                (sum, r) => sum + (r.costo ? parseFloat(r.costo.toString()) : 0),
                0
            )
        };

        logger.info('[Operations] Registros de mantenimiento obtenidos', {
            count: maintenanceRecords.length,
            total: totalCount,
            stats
        });

        res.json({
            success: true,
            data: {
                records: transformedRecords,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    hasMore: parseInt(offset as string) + maintenanceRecords.length < totalCount
                },
                stats
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Operations] Error obteniendo mantenimiento:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/operations/stats
 * Obtiene estadísticas generales del módulo de operaciones
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID requerido'
            });
        }

        logger.info('[Operations] Obteniendo estadísticas generales', { organizationId });

        // Estadísticas de eventos críticos (últimos 30 días)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalCriticalEvents,
            criticalEventsToday,
            totalAlerts,
            activeMaintenanceTasks,
            completedMaintenanceTasks
        ] = await Promise.all([
            prisma.stability_events.count({
                where: {
                    timestamp: { gte: thirtyDaysAgo },
                    Session: { organizationId }
                }
            }),
            prisma.stability_events.count({
                where: {
                    timestamp: { gte: startOfToday },
                    Session: { organizationId }
                }
            }),
            prisma.stability_events.count({
                where: {
                    timestamp: { gte: sevenDaysAgo },
                    Session: { organizationId }
                }
            }),
            prisma.maintenanceRecord.count({
                where: {
                    Vehicle: { organizationId },
                    estado: MaintenanceStatus.IN_PROGRESS
                }
            }),
            prisma.maintenanceRecord.count({
                where: {
                    Vehicle: { organizationId },
                    estado: MaintenanceStatus.COMPLETED,
                    updatedAt: { gte: thirtyDaysAgo }
                }
            })
        ]);

        const stats = {
            events: {
                total: totalCriticalEvents,
                today: criticalEventsToday,
                last30Days: totalCriticalEvents
            },
            alerts: {
                total: totalAlerts,
                active: totalAlerts // En un sistema real, filtrarías por estado
            },
            maintenance: {
                active: activeMaintenanceTasks,
                completed: completedMaintenanceTasks,
                total: activeMaintenanceTasks + completedMaintenanceTasks
            }
        };

        logger.info('[Operations] Estadísticas obtenidas', stats);

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Operations] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

export default router;

