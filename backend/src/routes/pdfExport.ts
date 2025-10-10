import { Router } from 'express';
import { PDFExportController } from '../controllers/PDFExportController';
import { authenticate } from '../middleware/auth';
import { organizationMiddleware } from '../middleware/organizationMiddleware';

const router = Router();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(organizationMiddleware);

/**
 * POST /api/reports/dashboard-pdf
 * Exporta el dashboard ejecutivo a PDF
 */
router.post('/dashboard-pdf', PDFExportController.exportDashboardPDF);

/**
 * POST /api/reports/speed-analysis-pdf
 * Exporta análisis de velocidad a PDF
 */
router.post('/speed-analysis-pdf', PDFExportController.exportSpeedAnalysisPDF);

/**
 * POST /api/reports/events-pdf
 * Exporta eventos a PDF
 */
router.post('/events-pdf', PDFExportController.exportEventsPDF);

/**
 * GET /api/reports/download/:filename
 * Descarga un PDF generado
 */
router.get('/download/:filename', PDFExportController.downloadPDF);

/**
 * POST /api/reports/kpis-pdf
 * Exporta KPIs avanzados a PDF
 */
router.post('/kpis-pdf', PDFExportController.exportKPIsPDF);

export default router;
