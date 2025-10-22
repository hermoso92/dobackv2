import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { logger } from '../utils/logger';

export class DashboardController {
    private dashboardService: DashboardService;

    constructor() {
        this.dashboardService = new DashboardService();
    }

    async getStats(req: Request, res: Response) {
        try {
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso sin organizationId');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere organizationId'
                });
            }

            logger.info('Obteniendo estadísticas del dashboard para organización:', organizationId);
            const stats = await this.dashboardService.getDashboardStats(organizationId);

            logger.info('Estadísticas obtenidas exitosamente');
            return res.json({
                success: true,
                data: {
                    totalVehicles: stats.totalVehicles,
                    activeVehicles: stats.activeVehicles,
                    totalAlerts: stats.totalAlerts,
                    activeAlerts: stats.activeAlerts,
                    recentEvents: stats.recentEvents
                }
            });
        } catch (error) {
            logger.error('Error al obtener estadísticas del dashboard:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas del dashboard',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }

    async getVehicleStats(req: Request, res: Response) {
        try {
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso sin organizationId');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere organizationId'
                });
            }

            logger.info('Obteniendo estadísticas de vehículos para organización:', organizationId);
            const stats = await this.dashboardService.getVehicleStats(organizationId);

            logger.info('Estadísticas de vehículos obtenidas exitosamente');
            return res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error al obtener estadísticas de vehículos:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de vehículos',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }

    async getRecentSessions(req: Request, res: Response) {
        try {
            const organizationId = req.user?.organizationId;
            const limit = parseInt(req.query.limit as string) || 5;

            if (!organizationId) {
                logger.warn('Intento de acceso sin organizationId');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere organizationId'
                });
            }

            logger.info('Obteniendo sesiones recientes para organización:', organizationId);
            const sessions = await this.dashboardService.getRecentSessions(organizationId, limit);

            logger.info('Sesiones recientes obtenidas exitosamente');
            res.json(sessions);
        } catch (error) {
            logger.error('Error getting recent sessions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAlarmsByType(req: Request, res: Response) {
        try {
            const organizationId = (req as any).user?.organizationId;
            if (!organizationId) {
                return res.status(401).json({ error: 'Organization ID not found' });
            }
            const alarms = await this.dashboardService.getAlarmsByType(organizationId);
            res.json(alarms);
        } catch (error) {
            logger.error('Error getting alarms by type:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
