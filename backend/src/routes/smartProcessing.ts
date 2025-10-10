import { Router } from 'express';
import { SmartProcessingController } from '../controllers/SmartProcessingController';
import { authenticate, authorize } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const controller = new SmartProcessingController();

// Middleware para logging
router.use((req, res, next) => {
    logger.info(`Acceso a ruta de procesamiento inteligente: ${req.method} ${req.path}`);
    next();
});

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * @route POST /api/smart-processing/process-vehicle
 * @desc Procesa archivos de un vehículo de forma inteligente
 * @access Admin, Operator
 */
router.post(
    '/process-vehicle',
    authorize(['ADMIN', 'OPERATOR']),
    controller.processVehicleSmart.bind(controller)
);

/**
 * @route POST /api/smart-processing/process-all-vehicles
 * @desc Procesa archivos de todos los vehículos de forma inteligente
 * @access Admin
 */
router.post(
    '/process-all-vehicles',
    authorize(['ADMIN']),
    controller.processAllVehiclesSmart.bind(controller)
);

/**
 * @route GET /api/smart-processing/file-status/:vehicleId
 * @desc Obtiene el estado de archivos de un vehículo específico
 * @access Admin, Operator
 */
router.get(
    '/file-status/:vehicleId',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getVehicleFileStatus.bind(controller)
);

/**
 * @route GET /api/smart-processing/pending-files
 * @desc Obtiene archivos pendientes de procesamiento
 * @access Admin, Operator
 */
router.get(
    '/pending-files',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getPendingFiles.bind(controller)
);

/**
 * @route GET /api/smart-processing/can-files-needing-decoding
 * @desc Obtiene archivos CAN que necesitan decodificación
 * @access Admin, Operator
 */
router.get(
    '/can-files-needing-decoding',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getCANFilesNeedingDecoding.bind(controller)
);

/**
 * @route GET /api/smart-processing/statistics
 * @desc Obtiene estadísticas de procesamiento inteligente
 * @access Admin, Operator
 */
router.get(
    '/statistics',
    authorize(['ADMIN', 'OPERATOR']),
    controller.getSmartProcessingStatistics.bind(controller)
);

/**
 * @route POST /api/smart-processing/clean-old-files
 * @desc Limpia archivos antiguos del sistema
 * @access Admin
 */
router.post(
    '/clean-old-files',
    authorize(['ADMIN']),
    controller.cleanOldFiles.bind(controller)
);

export default router;
