/**
 * 📊 API DE MÉTRICAS DE PROCESAMIENTO
 * 
 * Endpoints para monitorear el estado del procesamiento de sesiones
 * y obtener estadísticas de la tabla processing_logs.
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const logger = createLogger('ProcessingStats');

/**
 * GET /api/processing-stats/summary
 * Resumen general de procesamiento
 */
router.get('/summary', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId requerido'
            });
        }

        // Métricas generales
        const [
            totalLogs,
            successfulSessions,
            failedSessions,
            skippedSessions,
            avgDuration,
            totalEvents,
            parserVersions
        ] = await Promise.all([
            // Total de logs
            prisma.processingLog.count({
                where: {
                    Session: { organizationId }
                }
            }),

            // Sesiones exitosas
            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    status: 'success'
                }
            }),

            // Sesiones fallidas
            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    status: 'error'
                }
            }),

            // Sesiones omitidas
            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    status: 'skipped'
                }
            }),

            // Duración promedio
            prisma.processingLog.aggregate({
                where: {
                    Session: { organizationId },
                    status: 'success',
                    durationMs: { not: null }
                },
                _avg: {
                    durationMs: true
                }
            }),

            // Total de eventos generados
            prisma.processingLog.aggregate({
                where: {
                    Session: { organizationId }
                },
                _sum: {
                    eventsGenerated: true
                }
            }),

            // Distribución por parser version
            prisma.$queryRaw`
                SELECT 
                    pl."parserVersion",
                    COUNT(*)::int as count
                FROM processing_logs pl
                INNER JOIN "Session" s ON s.id::text = pl."sessionId"::text
                WHERE s."organizationId"::text = ${organizationId}::text
                GROUP BY pl."parserVersion"
                ORDER BY pl."parserVersion"
            `
        ]);

        res.json({
            success: true,
            data: {
                total: totalLogs,
                successful: successfulSessions,
                failed: failedSessions,
                skipped: skippedSessions,
                successRate: totalLogs > 0 ? ((successfulSessions / totalLogs) * 100).toFixed(2) : '0',
                avgDurationMs: avgDuration._avg.durationMs || 0,
                avgDurationSeconds: avgDuration._avg.durationMs
                    ? (avgDuration._avg.durationMs / 1000).toFixed(2)
                    : '0',
                totalEventsGenerated: totalEvents._sum.eventsGenerated || 0,
                parserVersions
            }
        });

    } catch (error: any) {
        logger.error('Error obteniendo resumen de procesamiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo métricas',
            message: error.message
        });
    }
});

/**
 * GET /api/processing-stats/recent
 * Logs recientes de procesamiento (últimos 50)
 */
router.get('/recent', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;
        const limit = parseInt(req.query.limit as string) || 50;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId requerido'
            });
        }

        const logs = await prisma.processingLog.findMany({
            where: {
                Session: { organizationId }
            },
            include: {
                Session: {
                    select: {
                        id: true,
                        startTime: true,
                        vehicleId: true,
                        Vehicle: {
                            select: {
                                name: true,
                                licensePlate: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        res.json({
            success: true,
            data: logs.map(log => ({
                id: log.id,
                sessionId: log.sessionId,
                vehicleName: log.Session.Vehicle?.name,
                licensePlate: log.Session.Vehicle?.licensePlate,
                parserVersion: log.parserVersion,
                status: log.status,
                startedAt: log.startedAt,
                finishedAt: log.finishedAt,
                durationMs: log.durationMs,
                measurementsProcessed: log.measurementsProcessed,
                eventsGenerated: log.eventsGenerated,
                physicsValidationPassed: log.physicsValidationPassed,
                errorMessage: log.errorMessage
            }))
        });

    } catch (error: any) {
        logger.error('Error obteniendo logs recientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo logs',
            message: error.message
        });
    }
});

/**
 * GET /api/processing-stats/health
 * Health check del sistema de procesamiento
 */
router.get('/health', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const organizationId = req.user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId requerido'
            });
        }

        // Métricas de las últimas 24 horas
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
            recentLogs,
            recentErrors,
            physicsValidationFailed
        ] = await Promise.all([
            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    createdAt: { gte: last24h }
                }
            }),

            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    createdAt: { gte: last24h },
                    status: 'error'
                }
            }),

            prisma.processingLog.count({
                where: {
                    Session: { organizationId },
                    createdAt: { gte: last24h },
                    physicsValidationPassed: false
                }
            })
        ]);

        const errorRate = recentLogs > 0 ? ((recentErrors / recentLogs) * 100).toFixed(2) : '0';
        const healthStatus = parseFloat(errorRate) < 5 ? 'healthy' : parseFloat(errorRate) < 20 ? 'warning' : 'critical';

        res.json({
            success: true,
            data: {
                status: healthStatus,
                last24h: {
                    totalProcessed: recentLogs,
                    errors: recentErrors,
                    errorRate: `${errorRate}%`,
                    physicsValidationFailed
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error: any) {
        logger.error('Error en health check:', error);
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: error.message
        });
    }
});

/**
 * GET /api/processing-stats/by-vehicle/:vehicleId
 * Estadísticas de procesamiento por vehículo
 */
router.get('/by-vehicle/:vehicleId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const organizationId = req.user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'organizationId requerido'
            });
        }

        const stats = await prisma.processingLog.groupBy({
            by: ['status'],
            where: {
                Session: {
                    vehicleId,
                    organizationId
                }
            },
            _count: true,
            _sum: {
                measurementsProcessed: true,
                eventsGenerated: true
            },
            _avg: {
                durationMs: true
            }
        });

        res.json({
            success: true,
            data: {
                vehicleId,
                statistics: stats.map(s => ({
                    status: s.status,
                    count: s._count,
                    totalMeasurements: s._sum.measurementsProcessed || 0,
                    totalEvents: s._sum.eventsGenerated || 0,
                    avgDurationMs: s._avg.durationMs || 0
                }))
            }
        });

    } catch (error: any) {
        logger.error('Error obteniendo stats por vehículo:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo stats',
            message: error.message
        });
    }
});

export default router;

