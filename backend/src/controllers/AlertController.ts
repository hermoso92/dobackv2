/**
 * AlertController - Controlador de Alertas
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/authorization';
import { AlertService } from '../services/AlertService';
import { logger } from '../utils/logger';

export class AlertController {
    /**
     * Obtener alertas de la organización del usuario
     */
    static async getAlerts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    error: 'OrganizationId requerido'
                });
                return;
            }

            const filters = {
                status: req.query.status as string,
                severity: req.query.severity as string,
                vehicleId: req.query.vehicleId as string,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
            };

            const alerts = await AlertService.getAlerts(organizationId, filters);

            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            logger.error('Error obteniendo alertas', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo alertas'
            });
        }
    }

    /**
     * Obtener estadísticas de alertas
     */
    static async getStats(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    error: 'OrganizationId requerido'
                });
                return;
            }

            const stats = await AlertService.getAlertStats(organizationId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error obteniendo estadísticas de alertas', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo estadísticas'
            });
        }
    }

    /**
     * Resolver una alerta
     */
    static async resolveAlert(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { notes } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
                return;
            }

            const alert = await AlertService.resolveAlert(id, userId, notes);

            res.json({
                success: true,
                data: alert,
                message: 'Alerta resuelta correctamente'
            });
        } catch (error) {
            logger.error('Error resolviendo alerta', error);
            res.status(500).json({
                success: false,
                error: 'Error resolviendo alerta'
            });
        }
    }

    /**
     * Ignorar una alerta
     */
    static async ignoreAlert(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
                return;
            }

            const alert = await AlertService.ignoreAlert(id, userId);

            res.json({
                success: true,
                data: alert,
                message: 'Alerta ignorada'
            });
        } catch (error) {
            logger.error('Error ignorando alerta', error);
            res.status(500).json({
                success: false,
                error: 'Error ignorando alerta'
            });
        }
    }

    /**
     * Ejecutar verificación manual de archivos faltantes
     * Solo ADMIN
     */
    static async checkMissingFiles(req: AuthRequest, res: Response): Promise<void> {
        try {
            const alerts = await AlertService.checkMissingFiles();

            res.json({
                success: true,
                data: alerts,
                message: `Verificación completada. ${alerts.length} alertas creadas.`
            });
        } catch (error) {
            logger.error('Error verificando archivos faltantes', error);
            res.status(500).json({
                success: false,
                error: 'Error verificando archivos'
            });
        }
    }
}

