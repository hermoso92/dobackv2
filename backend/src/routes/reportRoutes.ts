import { Router } from 'express';
import {
    createReportHandler,
    downloadReportHandler,
    healthHandler,
    listReportsHandler,
    retryReportHandler
} from '../controllers/reportController';
import { authenticate, extractOrganizationId } from '../middleware/auth';
import { ReportService } from '../services/ReportService';

const router = Router();

// Middleware de autenticación aplica a todas las rutas de reportes
router.use(authenticate);

// GET /api/reports        → listado paginado
router.get('/', listReportsHandler);

// POST /api/reports       → generar nuevo PDF
router.post('/', createReportHandler);

// POST /api/reports/:id/retry → reintento si falló
router.post('/:id/retry', retryReportHandler);

// GET /api/reports/:id/file  → descarga PDF
router.get('/:id/file', downloadReportHandler);

// HEAD /api/reports/health   → monitorización
router.head('/health', healthHandler);

// GET /api/reports/kpi7/generate → generar reporte KPI7
router.get('/kpi7/generate', async (req, res) => {
    try {
        // Mock response para KPI7
        res.json({
            success: true,
            data: {
                reportId: 'kpi7-' + Date.now(),
                status: 'completed',
                downloadUrl: '/api/reports/kpi7-' + Date.now() + '/file'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error generando reporte KPI7'
        });
    }
});

// POST /api/reports/stability/generate → generar reporte de estabilidad
router.post('/stability/generate', extractOrganizationId, async (req, res) => {
    try {
        const { sessionIds, vehicleIds, dateRange, includeCharts, includeMaps, format = 'pdf' } = req.body;
        const organizationId = (req as any).organizationId;

        // Generar reporte real usando ReportService
        const report = await ReportService.generateStabilityReport({
            sessionIds,
            vehicleIds,
            dateRange,
            includeCharts,
            includeMaps,
            organizationId
        });

        res.json({
            success: true,
            data: {
                ...report,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error generando reporte de estabilidad'
        });
    }
});

// POST /api/reports/telemetry/generate → generar reporte de telemetría
router.post('/telemetry/generate', async (req, res) => {
    try {
        const { sessionIds, vehicleIds, dateRange, includeCharts, includeMaps, format = 'pdf' } = req.body;

        // Mock response para reporte de telemetría
        res.json({
            success: true,
            data: {
                reportId: 'telemetry-' + Date.now(),
                downloadUrl: '/api/reports/telemetry-' + Date.now() + '/file',
                filename: `reporte_telemetria_${new Date().toISOString().split('T')[0]}.pdf`,
                size: 2048000,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error generando reporte de telemetría'
        });
    }
});

// POST /api/reports/comparison/generate → generar reporte de comparación
router.post('/comparison/generate', async (req, res) => {
    try {
        const { sessionId1, sessionId2, includeCharts, includeMaps, format = 'pdf' } = req.body;

        // Mock response para reporte de comparación
        res.json({
            success: true,
            data: {
                reportId: 'comparison-' + Date.now(),
                downloadUrl: '/api/reports/comparison-' + Date.now() + '/file',
                filename: `reporte_comparacion_${sessionId1}_vs_${sessionId2}.pdf`,
                size: 1536000,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error generando reporte de comparación'
        });
    }
});

export default router;
