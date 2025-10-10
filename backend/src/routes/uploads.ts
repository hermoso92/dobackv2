import { Router } from 'express';
import { UploadsController } from '../controllers/UploadsController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const uploadsController = new UploadsController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Rutas para lotes de subida
router.get('/batches', uploadsController.getBatches);
router.get('/batches/:id', uploadsController.getBatch);
router.post('/batches', uploadsController.createBatch);
router.post('/batches/:id/start', uploadsController.startBatch);
router.post('/batches/:id/cancel', uploadsController.cancelBatch);
router.get('/batches/:id/progress', uploadsController.getBatchProgress);

// Rutas para archivos
router.post('/batches/:batchId/files/:fileId/retry', uploadsController.retryFile);
router.post('/batches/:batchId/files/:fileId/discard', uploadsController.discardFile);

// Rutas para estadísticas y configuración
router.get('/stats', uploadsController.getUploadStats);
router.get('/settings', uploadsController.getUploadSettings);
router.put('/settings', uploadsController.updateUploadSettings);

// Rutas para patrones de archivo
router.get('/patterns', uploadsController.getFilePatterns);
router.post('/patterns', uploadsController.createFilePattern);
router.put('/patterns/:id', uploadsController.updateFilePattern);
router.delete('/patterns/:id', uploadsController.deleteFilePattern);

// Rutas para asistente de vehículos
router.post('/vehicle-assistant', uploadsController.getVehicleCreationAssistant);
router.post('/vehicle-assistant/create', uploadsController.createVehicleFromAssistant);

// Rutas para pruebas y escaneo
router.post('/test-ftp', uploadsController.testFTPConnection);
router.post('/scan-local', uploadsController.scanLocalDirectory);

export default router;
