import { Request, Response } from 'express';
import { ProcessingTrackingService } from '../services/ProcessingTrackingService';
import { logger } from '../utils/logger';

export class ProcessingTrackingController {
    private trackingService = new ProcessingTrackingService();

    /**
     * GET /api/processing/stats
     * Obtiene estadísticas de procesamiento
     */
    getProcessingStats = async (req: Request, res: Response) => {
        try {
            const { startDate, endDate } = req.query;
            const organizationId = (req as any).orgId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            const timeRange = startDate && endDate ? {
                start: new Date(startDate as string),
                end: new Date(endDate as string)
            } : undefined;

            const stats = await this.trackingService.getProcessingStatistics(organizationId, timeRange);

            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento', { error, orgId: (req as any).orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener estadísticas'
            });
        }
    };

    /**
     * GET /api/processing/health
     * Obtiene el estado de salud del procesamiento
     */
    getProcessingHealth = async (req: Request, res: Response) => {
        try {
            const organizationId = (req as any).orgId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            const health = await this.trackingService.getProcessingHealth(organizationId);

            res.json({
                success: true,
                data: health,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error obteniendo salud del procesamiento', { error, orgId: (req as any).orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al evaluar salud del procesamiento'
            });
        }
    };

    /**
     * GET /api/processing/events
     * Obtiene eventos de procesamiento recientes
     */
    getRecentEvents = async (req: Request, res: Response) => {
        try {
            const { limit = '50' } = req.query;
            const organizationId = (req as any).orgId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            const events = await this.trackingService.getRecentProcessingEvents(
                organizationId,
                parseInt(limit as string)
            );

            res.json({
                success: true,
                data: events,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error obteniendo eventos recientes', { error, orgId: (req as any).orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al obtener eventos'
            });
        }
    };

    /**
     * POST /api/processing/start
     * Registra el inicio del procesamiento de un archivo
     */
    startProcessing = async (req: Request, res: Response) => {
        try {
            const { fileName, filePath, fileType, vehicleId, metadata } = req.body;
            const organizationId = (req as any).orgId;

            if (!organizationId) {
                return res.status(400).json({
                    success: false,
                    error: 'Organization ID is required'
                });
            }

            if (!fileName || !filePath || !fileType || !vehicleId) {
                return res.status(400).json({
                    success: false,
                    error: 'fileName, filePath, fileType, and vehicleId are required'
                });
            }

            const eventId = await this.trackingService.startProcessing({
                fileName,
                filePath,
                fileType,
                vehicleId,
                organizationId,
                metadata
            });

            res.json({
                success: true,
                data: { eventId },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error registrando inicio de procesamiento', { error, orgId: (req as any).orgId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al registrar inicio de procesamiento'
            });
        }
    };

    /**
     * PUT /api/processing/progress/:eventId
     * Actualiza el progreso del procesamiento
     */
    updateProgress = async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { dataPointsProcessed, metadata } = req.body;

            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }

            await this.trackingService.updateProgress(eventId, dataPointsProcessed, metadata);

            res.json({
                success: true,
                data: { message: 'Progress updated successfully' },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error actualizando progreso de procesamiento', { error, eventId: req.params.eventId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al actualizar progreso'
            });
        }
    };

    /**
     * PUT /api/processing/complete/:eventId
     * Registra la finalización exitosa del procesamiento
     */
    completeProcessing = async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { dataPointsProcessed, processingTime, metadata } = req.body;

            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }

            await this.trackingService.completeProcessing(eventId, dataPointsProcessed, processingTime, metadata);

            res.json({
                success: true,
                data: { message: 'Processing completed successfully' },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error registrando finalización de procesamiento', { error, eventId: req.params.eventId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al registrar finalización'
            });
        }
    };

    /**
     * PUT /api/processing/fail/:eventId
     * Registra un fallo en el procesamiento
     */
    failProcessing = async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { errorMessage, errorCode, metadata } = req.body;

            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }

            if (!errorMessage) {
                return res.status(400).json({
                    success: false,
                    error: 'Error message is required'
                });
            }

            await this.trackingService.failProcessing(eventId, errorMessage, errorCode, metadata);

            res.json({
                success: true,
                data: { message: 'Processing failure recorded' },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error registrando fallo de procesamiento', { error, eventId: req.params.eventId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al registrar fallo'
            });
        }
    };

    /**
     * PUT /api/processing/skip/:eventId
     * Marca un archivo como omitido
     */
    skipProcessing = async (req: Request, res: Response) => {
        try {
            const { eventId } = req.params;
            const { reason, metadata } = req.body;

            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }

            if (!reason) {
                return res.status(400).json({
                    success: false,
                    error: 'Reason is required'
                });
            }

            await this.trackingService.skipProcessing(eventId, reason, metadata);

            res.json({
                success: true,
                data: { message: 'Processing skipped' },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger.error('Error registrando omisión de procesamiento', { error, eventId: req.params.eventId });
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al registrar omisión'
            });
        }
    };
}
