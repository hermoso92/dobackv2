/**
 * ScheduledReportController - Controlador de Reportes Programados
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/authorization';
import { ScheduledReportService } from '../services/ScheduledReportService';
import { logger } from '../utils/logger';

export class ScheduledReportController {
    /**
     * Obtener reportes programados de la organización
     */
    static async getScheduledReports(req: AuthRequest, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            if (!organizationId) {
                res.status(400).json({
                    success: false,
                    error: 'OrganizationId requerido'
                });
                return;
            }

            const reports = await ScheduledReportService.getScheduledReports(organizationId);

            res.json({
                success: true,
                data: reports
            });
        } catch (error) {
            logger.error('Error obteniendo reportes programados', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo reportes programados'
            });
        }
    }

    /**
     * Crear reporte programado
     */
    static async createScheduledReport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const organizationId = req.user?.organizationId;

            if (!userId || !organizationId) {
                res.status(401).json({
                    success: false,
                    error: 'Usuario no autenticado'
                });
                return;
            }

            const {
                name,
                description,
                frequency,
                dayOfWeek,
                dayOfMonth,
                timeOfDay,
                filters,
                reportType,
                format,
                recipients
            } = req.body;

            // Validaciones
            if (!name || !frequency || !timeOfDay || !reportType || !format || !recipients) {
                res.status(400).json({
                    success: false,
                    error: 'Campos requeridos faltantes'
                });
                return;
            }

            const report = await ScheduledReportService.createScheduledReport({
                userId,
                organizationId,
                name,
                description,
                frequency,
                dayOfWeek,
                dayOfMonth,
                timeOfDay,
                filters: filters || {},
                reportType,
                format,
                recipients,
                createdBy: userId
            });

            res.status(201).json({
                success: true,
                data: report,
                message: 'Reporte programado creado correctamente'
            });
        } catch (error) {
            logger.error('Error creando reporte programado', error);
            res.status(500).json({
                success: false,
                error: 'Error creando reporte programado'
            });
        }
    }

    /**
     * Actualizar reporte programado
     */
    static async updateScheduledReport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const report = await ScheduledReportService.updateScheduledReport(id, updateData);

            res.json({
                success: true,
                data: report,
                message: 'Reporte programado actualizado correctamente'
            });
        } catch (error) {
            logger.error('Error actualizando reporte programado', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando reporte programado'
            });
        }
    }

    /**
     * Eliminar reporte programado
     */
    static async deleteScheduledReport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            await ScheduledReportService.deleteScheduledReport(id);

            res.json({
                success: true,
                message: 'Reporte programado eliminado correctamente'
            });
        } catch (error) {
            logger.error('Error eliminando reporte programado', error);
            res.status(500).json({
                success: false,
                error: 'Error eliminando reporte programado'
            });
        }
    }

    /**
     * Ejecutar reporte manualmente
     */
    static async executeReport(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Ejecutar en background
            ScheduledReportService.executeReport(id).catch(err =>
                logger.error('Error en ejecución de reporte', err)
            );

            res.json({
                success: true,
                message: 'Reporte en ejecución'
            });
        } catch (error) {
            logger.error('Error ejecutando reporte', error);
            res.status(500).json({
                success: false,
                error: 'Error ejecutando reporte'
            });
        }
    }
}

