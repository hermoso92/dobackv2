import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
    getDailyProcessingServiceStatus,
    getRecentProcessingReports,
    runManualDailyProcessing
} from '../../scripts/init-daily-processing';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export class DailyProcessingController {
    /**
     * Obtiene el estado del servicio de procesamiento diario
     */
    async getServiceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const status = getDailyProcessingServiceStatus();

            res.status(200).json({
                success: true,
                data: {
                    isRunning: status.isRunning,
                    service: status.service ? {
                        schedule: status.service.getStatus().schedule,
                        enabled: status.service.getStatus().enabled
                    } : null
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estado del servicio:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Ejecuta procesamiento manual para una fecha específica
     */
    async runManualProcessing(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Solo administradores pueden ejecutar procesamiento manual
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({ error: 'Solo administradores pueden ejecutar procesamiento manual' });
                return;
            }

            const { targetDate } = req.body;

            if (targetDate && !this.isValidDate(targetDate)) {
                res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
                return;
            }

            logger.info(`🔄 Ejecutando procesamiento manual`, {
                targetDate: targetDate || 'fecha actual',
                userId: req.user.id,
                organizationId: req.user.organizationId
            });

            const results = await runManualDailyProcessing(targetDate);

            const summary = {
                totalVehicles: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            };

            logger.info('✅ Procesamiento manual completado', summary);

            res.status(200).json({
                success: true,
                message: 'Procesamiento manual completado',
                data: {
                    summary,
                    results: results.map(r => ({
                        vehicleId: r.vehicleId,
                        vehicleName: r.vehicleName,
                        success: r.success,
                        error: r.error,
                        dataPoints: r.report?.totalDataPoints || 0
                    })),
                    targetDate: targetDate || new Date().toISOString().split('T')[0]
                }
            });

        } catch (error) {
            logger.error('Error ejecutando procesamiento manual:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene los reportes de procesamiento recientes
     */
    async getRecentReports(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const { limit = 10 } = req.query;
            const limitNum = parseInt(limit as string, 10);

            if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
                res.status(400).json({ error: 'Límite debe ser un número entre 1 y 50' });
                return;
            }

            const reports = await getRecentProcessingReports(limitNum);

            res.status(200).json({
                success: true,
                data: {
                    reports: reports.map(report => ({
                        id: report.id,
                        processingDate: report.processingDate,
                        totalVehicles: report.totalVehicles,
                        successfulVehicles: report.successfulVehicles,
                        failedVehicles: report.failedVehicles,
                        totalDataPoints: report.totalDataPoints,
                        status: report.status,
                        createdAt: report.createdAt,
                        details: report.details
                    }))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo reportes recientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene estadísticas de procesamiento
     */
    async getProcessingStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Obtener estadísticas de los últimos 30 días
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { PrismaClient } = await import('@prisma/client');
            

            const stats = await prisma.$transaction([
                // Total de reportes de procesamiento
                prisma.dailyProcessingReport.count({
                    where: {
                        organizationId: req.user.organizationId,
                        processingDate: { gte: thirtyDaysAgo }
                    }
                }),
                // Promedio de vehículos procesados por día
                prisma.dailyProcessingReport.aggregate({
                    where: {
                        organizationId: req.user.organizationId,
                        processingDate: { gte: thirtyDaysAgo }
                    },
                    _avg: {
                        totalVehicles: true,
                        successfulVehicles: true,
                        totalDataPoints: true
                    }
                }),
                // Total de puntos de datos procesados
                prisma.dailyProcessingReport.aggregate({
                    where: {
                        organizationId: req.user.organizationId,
                        processingDate: { gte: thirtyDaysAgo }
                    },
                    _sum: {
                        totalDataPoints: true
                    }
                })
            ]);

            const [totalReports, averages, totalDataPoints] = stats;

            // Obtener reportes por estado
            const reportsByStatus = await prisma.dailyProcessingReport.groupBy({
                by: ['status'],
                where: {
                    organizationId: req.user.organizationId,
                    processingDate: { gte: thirtyDaysAgo }
                },
                _count: {
                    id: true
                }
            });

            res.status(200).json({
                success: true,
                data: {
                    period: 'Últimos 30 días',
                    summary: {
                        totalReports,
                        averageVehiclesPerDay: Math.round(averages._avg.totalVehicles || 0),
                        averageSuccessRate: averages._avg.totalVehicles
                            ? Math.round((averages._avg.successfulVehicles || 0) / averages._avg.totalVehicles * 100)
                            : 0,
                        totalDataPoints: totalDataPoints._sum.totalDataPoints || 0,
                        averageDataPointsPerDay: Math.round(averages._avg.totalDataPoints || 0)
                    },
                    statusBreakdown: reportsByStatus.reduce((acc, item) => {
                        acc[item.status.toLowerCase()] = item._count.id;
                        return acc;
                    }, {} as Record<string, number>)
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Valida si una fecha tiene el formato correcto
     */
    private isValidDate(dateString: string): boolean {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) {
            return false;
        }

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }
}
