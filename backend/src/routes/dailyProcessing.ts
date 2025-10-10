import { Router } from 'express';
import { DailyProcessingController } from '../controllers/DailyProcessingController';
import { authenticate, authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const controller = new DailyProcessingController();

// Middleware para logging
router.use((req, res, next) => {
    logger.info(`Acceso a ruta de procesamiento diario: ${req.method} ${req.path}`);
    next();
});

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * @route GET /api/daily-processing/status
 * @desc Obtiene el estado del servicio de procesamiento diario
 * @access Admin, Operator
 */
router.get(
    '/status',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getServiceStatus.bind(controller)
);

/**
 * @route POST /api/daily-processing/run-manual
 * @desc Ejecuta procesamiento manual para una fecha específica
 * @access Admin
 */
router.post(
    '/run-manual',
    authorize(['ADMIN']),
    controller.runManualProcessing.bind(controller)
);

/**
 * @route GET /api/daily-processing/reports
 * @desc Obtiene los reportes de procesamiento recientes
 * @access Admin, Operator
 */
router.get(
    '/reports',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getRecentReports.bind(controller)
);

/**
 * @route GET /api/daily-processing/statistics
 * @desc Obtiene estadísticas de procesamiento
 * @access Admin, Operator
 */
router.get(
    '/statistics',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getProcessingStatistics.bind(controller)
);

export default router;
