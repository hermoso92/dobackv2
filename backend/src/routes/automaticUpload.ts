import { Router } from 'express';
import { AutomaticUploadController } from '../controllers/AutomaticUploadController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new AutomaticUploadController();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Rutas del servicio automático
router.post('/start', controller.startService.bind(controller));
router.post('/stop', controller.stopService.bind(controller));
router.post('/restart', controller.restartService.bind(controller));
router.get('/status', controller.getStatus.bind(controller));
router.get('/stats', controller.getDetailedStats.bind(controller));
router.post('/process-pending', controller.processPendingFiles.bind(controller));
router.get('/pending-files', controller.getPendingFiles.bind(controller));
router.get('/error-files', controller.getErrorFiles.bind(controller));
router.post('/reset-stats', controller.resetStats.bind(controller));
router.post('/set-base-path', controller.setBasePath.bind(controller));
router.get('/base-path', controller.getBasePath.bind(controller));

export default router;