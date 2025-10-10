import { Router } from 'express';
import { BulkDataProcessorController } from '../controllers/BulkDataProcessorController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new BulkDataProcessorController();

// Obtener vista general de datos disponibles
router.get('/overview', authenticate, controller.getDataOverview.bind(controller));

// Procesar todos los datos de datosDoback
router.post('/process-all', authenticate, controller.processAllData.bind(controller));

// Obtener emparejamiento de archivos por sesión
router.get(
    '/session-file-pairing',
    authenticate,
    controller.getSessionFilePairing.bind(controller)
);

// Obtener resumen de cabeceras de archivos
router.get('/scan-headers', authenticate, controller.getScanHeaders.bind(controller));

export default router;
