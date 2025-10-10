import express from 'express';
import { webfleetReportController } from '../controllers/WebfleetReportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * @route POST /api/reports/webfleet
 * @desc Genera un nuevo reporte estilo Webfleet Solutions
 * @access Privado (requiere autenticación)
 */
router.post('/', webfleetReportController.generateWebfleetReport.bind(webfleetReportController));

/**
 * @route GET /api/reports/webfleet/download/:reportId
 * @desc Descarga un reporte estilo Webfleet por ID
 * @access Privado (requiere autenticación)
 */
router.get(
    '/download/:reportId',
    webfleetReportController.downloadWebfleetReport.bind(webfleetReportController)
);

/**
 * @route GET /api/reports/webfleet
 * @desc Lista reportes estilo Webfleet del usuario
 * @access Privado (requiere autenticación)
 */
router.get('/', webfleetReportController.listWebfleetReports.bind(webfleetReportController));

/**
 * @route GET /api/reports/webfleet/preview
 * @desc Obtiene vista previa de datos para reporte estilo Webfleet
 * @access Privado (requiere autenticación)
 */
router.get(
    '/preview',
    webfleetReportController.getWebfleetReportPreview.bind(webfleetReportController)
);

/**
 * @route DELETE /api/reports/webfleet/:reportId
 * @desc Elimina un reporte estilo Webfleet
 * @access Privado (requiere autenticación)
 */
router.delete(
    '/:reportId',
    webfleetReportController.deleteWebfleetReport.bind(webfleetReportController)
);

export default router;
