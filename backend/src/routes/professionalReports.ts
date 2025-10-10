import { Router } from 'express';
import { professionalReportController } from '../controllers/ProfessionalReportController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * @swagger
 * /api/reports/professional:
 *   post:
 *     summary: Genera un reporte profesional
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID de la sesión
 *               title:
 *                 type: string
 *                 description: Título personalizado del reporte
 *               includeClusterAnalysis:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir análisis de clustering
 *               includeMaps:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir mapas estáticos
 *               includeCharts:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir gráficos
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *                 description: Incluir recomendaciones
 *               filters:
 *                 type: object
 *                 properties:
 *                   speedFilter:
 *                     type: string
 *                     enum: [all, "40", "60", "80", "100", "120", "140"]
 *                     default: all
 *                   rpmFilter:
 *                     type: string
 *                     enum: [all, "1500", "2000", "2500"]
 *                     default: all
 *                   selectedTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   severityLevels:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [critical, danger, moderate]
 *               clusteringOptions:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     default: true
 *                   spatialRadius:
 *                     type: number
 *                     default: 50
 *                   temporalWindow:
 *                     type: number
 *                     default: 30
 *                   minEventsPerCluster:
 *                     type: number
 *                     default: 2
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     size:
 *                       type: number
 *                     downloadUrl:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 */
router.post(
    '/',
    professionalReportController.generateProfessionalReport.bind(professionalReportController)
);

/**
 * @swagger
 * /api/reports/professional/download/{reportId}:
 *   get:
 *     summary: Descarga un reporte profesional
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Archivo PDF del reporte
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Reporte no encontrado
 */
router.get(
    '/download/:reportId',
    professionalReportController.downloadProfessionalReport.bind(professionalReportController)
);

/**
 * @swagger
 * /api/reports/professional/preview/{sessionId}:
 *   get:
 *     summary: Obtiene vista previa de un reporte
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sesión
 *       - in: query
 *         name: speedFilter
 *         schema:
 *           type: string
 *           enum: [all, "40", "60", "80", "100", "120", "140"]
 *           default: all
 *       - in: query
 *         name: rpmFilter
 *         schema:
 *           type: string
 *           enum: [all, "1500", "2000", "2500"]
 *           default: all
 *       - in: query
 *         name: selectedTypes
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: clusteringEnabled
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Vista previa del reporte
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     sessionInfo:
 *                       type: object
 *                     metrics:
 *                       type: object
 *                     eventsSummary:
 *                       type: object
 *                     clusteringSummary:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     estimatedPages:
 *                       type: number
 */
router.get(
    '/preview/:sessionId',
    professionalReportController.getReportPreview.bind(professionalReportController)
);

/**
 * @swagger
 * /api/reports/professional/list:
 *   get:
 *     summary: Lista reportes profesionales generados
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reportes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       reportId:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       sessionId:
 *                         type: string
 *                       size:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       downloadUrl:
 *                         type: string
 */
router.get(
    '/list',
    professionalReportController.listProfessionalReports.bind(professionalReportController)
);

/**
 * @swagger
 * /api/reports/professional/{reportId}:
 *   delete:
 *     summary: Elimina un reporte profesional
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte eliminado exitosamente
 *       404:
 *         description: Reporte no encontrado
 */
router.delete(
    '/:reportId',
    professionalReportController.deleteProfessionalReport.bind(professionalReportController)
);

export default router;
