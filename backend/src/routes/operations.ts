/**
 * 🔧 RUTAS DEL MÓDULO DE OPERACIONES
 * Endpoints unificados para Eventos Críticos, Alertas y Mantenimiento
 */

import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

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

        // Construir filtros
        const where: any = {
            Session: {
                vehicle: {
                    organizationId
                }
            }
        };

        if (sessionId && typeof sessionId === 'string') {
            where.session_id = sessionId;
        }

        if (vehicleId && typeof vehicleId === 'string') {
            where.Session = {
                ...where.Session,
                vehicleId
            };
        }

        // Filtrar por severidad si se especifica
        if (severity && typeof severity === 'string' && severity !== 'ALL') {
            where.type = {
                contains: severity.toLowerCase()
            };
        }

        // Obtener eventos críticos con información de sesión y vehículo
        const events = await prisma.$queryRaw<any[]>`
            SELECT 
                se.id,
                se.session_id,
                se.timestamp,
                se.lat,
                se.lon,
                se.type,
                se.details,
                s."vehicleId",
                v.name as vehicle_name,
                v."dobackId" as vehicle_doback_id
            FROM stability_events se
            INNER JOIN "Session" s ON se.session_id = s.id
            INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
            WHERE v."organizationId" = ${organizationId}
            ${sessionId ? prisma.$queryRaw`AND se.session_id = ${sessionId}` : prisma.$queryRaw``}
            ${vehicleId ? prisma.$queryRaw`AND s."vehicleId" = ${vehicleId}` : prisma.$queryRaw``}
            ORDER BY se.timestamp DESC
            LIMIT ${parseInt(limit as string)}
            OFFSET ${parseInt(offset as string)}
        `;

        // Obtener conteo total
        const totalCount = await prisma.stability_events.count({ where });

        // Transformar eventos al formato esperado por el frontend
        const transformedEvents = events.map((event: any) => {
            const details = event.details || {};
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
                vehicle: {
                    id: event.vehicleId,
                    name: event.vehicle_name,
                    dobackId: event.vehicle_doback_id
                },
                vehicleId: event.vehicleId,
                vehicleName: event.vehicle_name,
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
                    vehicle: {
                        organizationId
                    }
                },
                timestamp: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 días
                }
            },
            include: {
                Session: {
                    include: {
                        vehicle: true
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
            const details = event.details as any;
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
                vehicleId: event.session.vehicleId,
                vehicleName: event.session.Vehicle.name,
                alertType,
                severity: alertSeverity,
                message: `${event.session.Vehicle.name} - ${level.toUpperCase()}: ${tipos.join(', ')}`,
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
        const where: any = {
            vehicle: {
                organizationId
            }
        };

        if (vehicleId && typeof vehicleId === 'string') {
            where.vehicleId = vehicleId;
        }

        if (type && typeof type === 'string' && type !== 'ALL') {
            where.type = type;
        }

        if (status && typeof status === 'string' && status !== 'ALL') {
            where.status = status;
        }

        // Obtener registros de mantenimiento
        const maintenanceRecords = await prisma.maintenanceRecord.findMany({
            where,
            include: {
                Vehicle: true
            },
            orderBy: {
                fecha: 'desc'
            },
            take: parseInt(limit as string),
            skip: parseInt(offset as string)
        });

        // Obtener conteo total
        const totalCount = await prisma.maintenanceRecord.count({ where });

        // Transformar al formato esperado por el frontend
        const transformedRecords = maintenanceRecords.map(record => ({
            id: record.id,
            vehicleId: record.vehicleId,
            vehicleName: record.Vehicle.name,
            type: record.tipo,
            title: record.descripcion,
            description: record.notas || record.descripcion,
            priority: 'medium' as const, // Podríamos inferir esto del tipo
            status: 'SCHEDULED', // El modelo actual no tiene status real, usar default
            scheduledDate: record.fecha.toISOString(),
            completedDate: record.completado ? record.fecha.toISOString() : undefined,
            assignedTo: 'Sin asignar', // MaintenanceRecord no tiene este campo
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
            scheduled: maintenanceRecords.filter(r => !r.completado).length,
            in_progress: 0, // No tenemos este dato
            completed: maintenanceRecords.filter(r => r.completado).length,
            cancelled: 0, // No tenemos este dato
            totalCost: maintenanceRecords.reduce((sum, r) => sum + (r.costo ? parseFloat(r.costo.toString()) : 0), 0)
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

        const [
            totalCriticalEvents,
            criticalEventsToday,
            totalAlerts,
            activeMaintenanceTasks,
            completedMaintenanceTasks
        ] = await Promise.all([
            prisma.$executeRaw`
                SELECT COUNT(*) FROM stability_events se
                INNER JOIN "Session" s ON se.session_id = s.id
                INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
                WHERE v."organizationId" = ${organizationId}
                AND se.timestamp >= ${thirtyDaysAgo}
            ` as Promise<number>,
            prisma.$executeRaw`
                SELECT COUNT(*) FROM stability_events se
                INNER JOIN "Session" s ON se.session_id = s.id
                INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
                WHERE v."organizationId" = ${organizationId}
                AND se.timestamp >= ${new Date(new Date().setHours(0, 0, 0, 0))}
            ` as Promise<number>,
            prisma.$executeRaw`
                SELECT COUNT(*) FROM stability_events se
                INNER JOIN "Session" s ON se.session_id = s.id
                INNER JOIN "Vehicle" v ON s."vehicleId" = v.id
                WHERE v."organizationId" = ${organizationId}
                AND se.timestamp >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
            ` as Promise<number>,
            prisma.maintenanceRecord.count({
                where: {
                    Vehicle: {
                        organizationId
                    },
                    completado: false
                }
            }),
            prisma.maintenanceRecord.count({
                where: {
                    Vehicle: {
                        organizationId
                    },
                    completado: true,
                    fecha: {
                        gte: thirtyDaysAgo
                    }
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

