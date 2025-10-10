import { Router } from 'express';
import { ProcessingTrackingController } from '../controllers/ProcessingTrackingController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const processingTrackingController = new ProcessingTrackingController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

/**
 * GET /api/processing/stats
 * Obtiene estadísticas de procesamiento
 */
router.get('/stats', processingTrackingController.getProcessingStats);

/**
 * GET /api/processing/health
 * Obtiene el estado de salud del procesamiento
 */
router.get('/health', processingTrackingController.getProcessingHealth);

/**
 * GET /api/processing/events
 * Obtiene eventos de procesamiento recientes
 */
router.get('/events', processingTrackingController.getRecentEvents);

/**
 * POST /api/processing/start
 * Registra el inicio del procesamiento de un archivo
 */
router.post('/start', processingTrackingController.startProcessing);

/**
 * PUT /api/processing/progress/:eventId
 * Actualiza el progreso del procesamiento
 */
router.put('/progress/:eventId', processingTrackingController.updateProgress);

/**
 * PUT /api/processing/complete/:eventId
 * Registra la finalización exitosa del procesamiento
 */
router.put('/complete/:eventId', processingTrackingController.completeProcessing);

/**
 * PUT /api/processing/fail/:eventId
 * Registra un fallo en el procesamiento
 */
router.put('/fail/:eventId', processingTrackingController.failProcessing);

/**
 * PUT /api/processing/skip/:eventId
 * Marca un archivo como omitido
 */
router.put('/skip/:eventId', processingTrackingController.skipProcessing);

export default router;
