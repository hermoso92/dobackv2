/**
 * ⏱️ RUTAS DE TIEMPOS DE RESPUESTA - BOMBEROS MADRID
 * Endpoints para análisis y monitoreo de tiempos de respuesta
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { responseTimeService, ResponseTimeStats } from '../services/responseTimeService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/response-time/stats
 * Obtiene estadísticas de tiempos de respuesta
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const { period = 'month' } = req.query;

        const stats = await responseTimeService.generateStats(period as string);

        res.json({
            success: true,
            data: stats,
            period,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo estadísticas de tiempos de respuesta para período ${req.query.period}:`, error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/records
 * Obtiene registros de tiempos de respuesta
 */
router.get('/records', async (req: Request, res: Response) => {
    try {
        const {
            zone,
            vehicleId,
            incidentType,
            severity,
            limit = '50',
            offset = '0',
            startDate,
            endDate
        } = req.query;

        let records = responseTimeService.getAllRecords();

        // Filtrar por zona
        if (zone && typeof zone === 'string') {
            records = records.filter(record => record.zone === zone);
        }

        // Filtrar por vehículo
        if (vehicleId && typeof vehicleId === 'string') {
            records = records.filter(record => record.vehicleId === vehicleId.toUpperCase());
        }

        // Filtrar por tipo de incidente
        if (incidentType && typeof incidentType === 'string') {
            records = records.filter(record => record.metadata.incidentType === incidentType.toUpperCase());
        }

        // Filtrar por severidad
        if (severity && typeof severity === 'string') {
            records = records.filter(record => record.metadata.severity === severity.toUpperCase());
        }

        // Filtrar por rango de fechas
        if (startDate && typeof startDate === 'string') {
            const start = new Date(startDate);
            records = records.filter(record => record.timestamp >= start);
        }

        if (endDate && typeof endDate === 'string') {
            const end = new Date(endDate);
            records = records.filter(record => record.timestamp <= end);
        }

        // Ordenar por timestamp (más recientes primero)
        records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedRecords = records.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedRecords,
            pagination: {
                total: records.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < records.length
            },
            filters: {
                zone: zone || 'all',
                vehicleId: vehicleId || 'all',
                incidentType: incidentType || 'all',
                severity: severity || 'all',
                startDate: startDate || 'all',
                endDate: endDate || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo registros de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/records/:recordId
 * Obtiene un registro específico de tiempo de respuesta
 */
router.get('/records/:recordId', async (req: Request, res: Response) => {
    try {
        const { recordId } = req.params;
        const record = responseTimeService.getRecord(recordId);

        if (!record) {
            return res.status(404).json({
                success: false,
                error: 'Registro de tiempo de respuesta no encontrado'
            });
        }

        res.json({
            success: true,
            data: record,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo registro ${req.params.recordId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/alerts
 * Obtiene alertas de tiempos de respuesta
 */
router.get('/alerts', async (req: Request, res: Response) => {
    try {
        const { status = 'active', severity, type, limit = '50', offset = '0' } = req.query;

        let alerts = responseTimeService.getAllAlerts();

        // Filtrar por estado
        if (status === 'active') {
            alerts = alerts.filter(alert => !alert.acknowledged && !alert.resolved);
        } else if (status === 'acknowledged') {
            alerts = alerts.filter(alert => alert.acknowledged && !alert.resolved);
        } else if (status === 'resolved') {
            alerts = alerts.filter(alert => alert.resolved);
        }

        // Filtrar por severidad
        if (severity && typeof severity === 'string') {
            alerts = alerts.filter(alert => alert.severity === severity.toUpperCase());
        }

        // Filtrar por tipo
        if (type && typeof type === 'string') {
            alerts = alerts.filter(alert => alert.type === type.toUpperCase());
        }

        // Ordenar por timestamp (más recientes primero)
        alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedAlerts = alerts.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedAlerts,
            pagination: {
                total: alerts.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < alerts.length
            },
            filters: {
                status,
                severity: severity || 'all',
                type: type || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo alertas de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/response-time/alerts/:alertId/acknowledge
 * Reconoce una alerta
 */
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const user = (req as any).user;
        const acknowledgedBy = user.email || user.name || 'Usuario desconocido';

        const success = responseTimeService.acknowledgeAlert(alertId, acknowledgedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Alerta reconocida exitosamente',
                acknowledgedBy,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Alerta no encontrada o ya reconocida'
            });
        }
    } catch (error) {
        logger.error(`Error reconociendo alerta ${req.params.alertId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/response-time/alerts/:alertId/resolve
 * Resuelve una alerta
 */
router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const user = (req as any).user;
        const resolvedBy = user.email || user.name || 'Usuario desconocido';

        const success = responseTimeService.resolveAlert(alertId, resolvedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Alerta resuelta exitosamente',
                resolvedBy,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Alerta no encontrada o ya resuelta'
            });
        }
    } catch (error) {
        logger.error(`Error resolviendo alerta ${req.params.alertId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/benchmarks
 * Obtiene benchmarks de la industria
 */
router.get('/benchmarks', async (req: Request, res: Response) => {
    try {
        const benchmarks = {
            categories: [
                {
                    name: 'Incendios',
                    target: 6,
                    excellent: 4,
                    good: 5,
                    acceptable: 7,
                    poor: 9,
                    description: 'Tiempo objetivo para respuesta a incendios'
                },
                {
                    name: 'Rescates',
                    target: 8,
                    excellent: 6,
                    good: 7,
                    acceptable: 9,
                    poor: 12,
                    description: 'Tiempo objetivo para operaciones de rescate'
                },
                {
                    name: 'Materiales Peligrosos',
                    target: 12,
                    excellent: 9,
                    good: 11,
                    acceptable: 14,
                    poor: 18,
                    description: 'Tiempo objetivo para incidentes con materiales peligrosos'
                },
                {
                    name: 'Accidentes de Tráfico',
                    target: 10,
                    excellent: 7,
                    good: 9,
                    acceptable: 12,
                    poor: 15,
                    description: 'Tiempo objetivo para accidentes de tráfico'
                },
                {
                    name: 'Emergencias Médicas',
                    target: 6,
                    excellent: 4,
                    good: 5,
                    acceptable: 7,
                    poor: 9,
                    description: 'Tiempo objetivo para emergencias médicas'
                }
            ],
            industry: {
                average: 8.5,
                median: 7.8,
                target: 6.0,
                description: 'Benchmarks de la industria de bomberos'
            },
            regional: {
                average: 6.8,
                median: 6.2,
                target: 5.5,
                description: 'Benchmarks regionales (Madrid)'
            },
            national: {
                average: 7.2,
                median: 6.8,
                target: 6.0,
                description: 'Benchmarks nacionales (España)'
            }
        };

        res.json({
            success: true,
            data: benchmarks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo benchmarks de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/performance
 * Obtiene métricas de rendimiento
 */
router.get('/performance', async (req: Request, res: Response) => {
    try {
        const { period = 'month' } = req.query;

        const stats = await responseTimeService.generateStats(period as string);
        const serviceStats = responseTimeService.getStats();

        const performance = {
            period,
            summary: {
                totalIncidents: stats.totalIncidents,
                averageResponseTime: stats.averageResponseTime,
                targetCompliance: stats.targetCompliance,
                grade: this.calculateOverallGrade(stats.targetCompliance),
                trend: this.calculateTrend(stats.trends),
                benchmark: stats.benchmarks
            },
            byZone: stats.byZone.map(zone => ({
                ...zone,
                grade: this.calculateGrade(zone.compliance),
                status: this.getZoneStatus(zone.averageTime, zone.compliance)
            })),
            byVehicle: stats.byVehicle.map(vehicle => ({
                ...vehicle,
                grade: this.calculateGrade(vehicle.efficiency),
                status: this.getVehicleStatus(vehicle.averageTime, vehicle.efficiency)
            })),
            alerts: {
                total: serviceStats.totalAlerts,
                active: serviceStats.activeAlerts,
                acknowledged: serviceStats.acknowledgedAlerts,
                resolved: serviceStats.resolvedAlerts
            },
            recommendations: this.generatePerformanceRecommendations(stats, serviceStats)
        };

        res.json({
            success: true,
            data: performance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo métricas de rendimiento para período ${req.query.period}:`, error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/response-time/status
 * Obtiene el estado del servicio
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const stats = responseTimeService.getStats();

        res.json({
            success: true,
            data: {
                isMonitoring: stats.isMonitoring,
                stats,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estado del servicio de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/response-time/start-monitoring
 * Inicia el monitoreo (solo admin)
 */
router.post('/start-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden iniciar el monitoreo'
            });
        }

        responseTimeService.startMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo de tiempos de respuesta iniciado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error iniciando monitoreo de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/response-time/stop-monitoring
 * Detiene el monitoreo (solo admin)
 */
router.post('/stop-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden detener el monitoreo'
            });
        }

        responseTimeService.stopMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo de tiempos de respuesta detenido',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error deteniendo monitoreo de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Métodos auxiliares privados
function calculateOverallGrade(compliance: number): string {
    if (compliance >= 95) return 'A+';
    if (compliance >= 90) return 'A';
    if (compliance >= 85) return 'B+';
    if (compliance >= 80) return 'B';
    if (compliance >= 75) return 'C+';
    if (compliance >= 70) return 'C';
    if (compliance >= 65) return 'D+';
    if (compliance >= 60) return 'D';
    return 'F';
}

function calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

function calculateTrend(trends: any[]): string {
    if (trends.length < 2) return 'STABLE';

    const recent = trends.slice(-7); // Última semana
    const older = trends.slice(-14, -7); // Semana anterior

    if (recent.length === 0 || older.length === 0) return 'STABLE';

    const recentAvg = recent.reduce((acc, t) => acc + t.averageTime, 0) / recent.length;
    const olderAvg = older.reduce((acc, t) => acc + t.averageTime, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'DECLINING';
    if (change < -10) return 'IMPROVING';
    return 'STABLE';
}

function getZoneStatus(averageTime: number, compliance: number): string {
    if (averageTime <= 6 && compliance >= 90) return 'EXCELLENT';
    if (averageTime <= 8 && compliance >= 80) return 'GOOD';
    if (averageTime <= 10 && compliance >= 70) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
}

function getVehicleStatus(averageTime: number, efficiency: number): string {
    if (averageTime <= 6 && efficiency >= 90) return 'EXCELLENT';
    if (averageTime <= 8 && efficiency >= 80) return 'GOOD';
    if (averageTime <= 10 && efficiency >= 70) return 'ACCEPTABLE';
    return 'NEEDS_IMPROVEMENT';
}

function generatePerformanceRecommendations(stats: ResponseTimeStats, serviceStats: any): string[] {
    const recommendations: string[] = [];

    if (stats.targetCompliance < 80) {
        recommendations.push('Implementar mejoras urgentes para cumplir objetivos de tiempo');
    }

    if (stats.averageResponseTime > stats.benchmarks.target) {
        recommendations.push('Optimizar rutas y procesos para reducir tiempos promedio');
    }

    if (serviceStats.activeAlerts > 5) {
        recommendations.push('Revisar y resolver alertas activas prioritariamente');
    }

    const worstZone = stats.byZone[0];
    if (worstZone && worstZone.averageTime > 10) {
        recommendations.push(`Mejorar respuesta en zona ${worstZone.zone} (${worstZone.averageTime} min promedio)`);
    }

    if (recommendations.length === 0) {
        recommendations.push('Rendimiento óptimo - mantener estándares actuales');
    }

    return recommendations;
}

export default router;
