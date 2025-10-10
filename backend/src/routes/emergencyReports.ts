/**
 * 📊 RUTAS DE REPORTES DE EMERGENCIAS - BOMBEROS MADRID
 * Endpoints para generar y consultar reportes específicos de emergencias
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { emergencyReportsService } from '../services/emergencyReportsService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/emergency-reports
 * Obtiene todos los reportes generados
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { type, limit = '50', offset = '0' } = req.query;

        let reports = emergencyReportsService.getAllReports();

        // Filtrar por tipo si se especifica
        if (type && typeof type === 'string') {
            reports = reports.filter(report => report.type === type);
        }

        // Ordenar por fecha de generación (más recientes primero)
        reports.sort((a, b) => b.metadata.generatedAt.getTime() - a.metadata.generatedAt.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedReports = reports.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedReports,
            pagination: {
                total: reports.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < reports.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo reportes de emergencias:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-reports/:reportId
 * Obtiene un reporte específico
 */
router.get('/:reportId', async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const report = emergencyReportsService.getReport(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }

        res.json({
            success: true,
            data: report,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo reporte ${req.params.reportId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/daily-summary
 * Genera un reporte diario de resumen
 */
router.post('/daily-summary', async (req: Request, res: Response) => {
    try {
        const { date } = req.body;
        const reportDate = date ? new Date(date) : new Date();

        const report = await emergencyReportsService.generateDailySummaryReport(reportDate);

        res.status(201).json({
            success: true,
            data: report,
            message: 'Reporte diario generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando reporte diario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/incident-analysis
 * Genera análisis de incidentes
 */
router.post('/incident-analysis', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren startDate y endDate'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({
                success: false,
                error: 'La fecha de inicio debe ser anterior a la fecha de fin'
            });
        }

        const report = await emergencyReportsService.generateIncidentAnalysisReport(start, end);

        res.status(201).json({
            success: true,
            data: report,
            message: 'Análisis de incidentes generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando análisis de incidentes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/response-time
 * Genera análisis de tiempos de respuesta
 */
router.post('/response-time', async (req: Request, res: Response) => {
    try {
        const { period = 'month' } = req.body;

        const report = await emergencyReportsService.generateResponseTimeAnalysis(period);

        res.status(201).json({
            success: true,
            data: report,
            message: 'Análisis de tiempos de respuesta generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando análisis de tiempos de respuesta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/vehicle-efficiency
 * Genera reporte de eficiencia de vehículos
 */
router.post('/vehicle-efficiency', async (req: Request, res: Response) => {
    try {
        const { period = 'month' } = req.body;

        const report = await emergencyReportsService.generateVehicleEfficiencyReport(period);

        res.status(201).json({
            success: true,
            data: report,
            message: 'Reporte de eficiencia de vehículos generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando reporte de eficiencia de vehículos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/zone-risk
 * Genera reporte de zonas de riesgo
 */
router.post('/zone-risk', async (req: Request, res: Response) => {
    try {
        const report = await emergencyReportsService.generateZoneRiskReport();

        res.status(201).json({
            success: true,
            data: report,
            message: 'Reporte de zonas de riesgo generado exitosamente',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error generando reporte de zonas de riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-reports/types
 * Obtiene los tipos de reportes disponibles
 */
router.get('/types', async (req: Request, res: Response) => {
    try {
        const reportTypes = [
            {
                type: 'DAILY_SUMMARY',
                name: 'Resumen Diario',
                description: 'Reporte diario de todas las emergencias y operaciones',
                icon: '📊'
            },
            {
                type: 'INCIDENT_ANALYSIS',
                name: 'Análisis de Incidentes',
                description: 'Análisis detallado de incidentes en un período específico',
                icon: '🚨'
            },
            {
                type: 'RESPONSE_TIME',
                name: 'Tiempos de Respuesta',
                description: 'Análisis de tiempos de respuesta por zona y vehículo',
                icon: '⏱️'
            },
            {
                type: 'VEHICLE_EFFICIENCY',
                name: 'Eficiencia de Vehículos',
                description: 'Análisis de eficiencia operativa de vehículos',
                icon: '🚛'
            },
            {
                type: 'ZONE_RISK',
                name: 'Zonas de Riesgo',
                description: 'Evaluación de riesgo por zonas geográficas',
                icon: '🗺️'
            }
        ];

        res.json({
            success: true,
            data: reportTypes,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo tipos de reportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-reports/stats
 * Obtiene estadísticas de reportes
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = emergencyReportsService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de reportes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/emergency-reports/:reportId
 * Elimina un reporte
 */
router.delete('/:reportId', async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const user = (req as any).user;

        // Solo administradores pueden eliminar reportes
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden eliminar reportes'
            });
        }

        const deleted = emergencyReportsService.deleteReport(reportId);

        if (deleted) {
            res.json({
                success: true,
                message: 'Reporte eliminado exitosamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }
    } catch (error) {
        logger.error(`Error eliminando reporte ${req.params.reportId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-reports/export/:reportId
 * Exporta un reporte a PDF
 */
router.post('/export/:reportId', async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const { format = 'pdf' } = req.body;

        const report = emergencyReportsService.getReport(reportId);

        if (!report) {
            return res.status(404).json({
                success: false,
                error: 'Reporte no encontrado'
            });
        }

        // Simular generación de PDF (en producción usaría una librería como puppeteer)
        const pdfData = {
            reportId: report.id,
            title: report.title,
            generatedAt: report.metadata.generatedAt,
            format: format,
            size: '2.5MB',
            downloadUrl: `/api/emergency-reports/download/${reportId}.${format}`
        };

        res.json({
            success: true,
            data: pdfData,
            message: `Reporte exportado a ${format.toUpperCase()} exitosamente`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error exportando reporte ${req.params.reportId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-reports/download/:filename
 * Descarga un reporte exportado
 */
router.get('/download/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        // Simular descarga de archivo
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // En producción, aquí se enviaría el archivo real
        res.json({
            success: true,
            message: 'Descarga simulada - En producción se enviaría el archivo real',
            filename,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error descargando archivo ${req.params.filename}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
