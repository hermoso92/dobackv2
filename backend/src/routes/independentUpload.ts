import { Router } from 'express';
import { IndependentUploadController } from '../controllers/IndependentUploadController';
import { authenticate, authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const controller = new IndependentUploadController();

// Middleware para logging
router.use((req, res, next) => {
    logger.info(`Acceso a ruta de procesamiento independiente: ${req.method} ${req.path}`);
    next();
});

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * @route POST /api/independent/process-vehicle
 * @desc Procesa todos los archivos de un vehículo de forma independiente
 * @access Admin, Operator
 */
router.post(
    '/process-vehicle',
    authorize(['ADMIN', 'OPERATOR']),
    controller.processVehicleData.bind(controller)
);

/**
 * @route POST /api/independent/process-all-vehicles
 * @desc Procesa todos los vehículos de una organización
 * @access Admin
 */
router.post(
    '/process-all-vehicles',
    authorize(['ADMIN']),
    controller.processAllVehicles.bind(controller)
);

/**
 * @route GET /api/independent/status/:vehicleId
 * @desc Obtiene el estado del procesamiento de un vehículo
 * @access Admin, Operator
 */
router.get(
    '/status/:vehicleId',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getProcessingStatus.bind(controller)
);

/**
 * @route GET /api/independent/statistics
 * @desc Obtiene estadísticas generales de procesamiento
 * @access Admin, Operator
 */
router.get(
    '/statistics',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getProcessingStatistics.bind(controller)
);

export default router;
