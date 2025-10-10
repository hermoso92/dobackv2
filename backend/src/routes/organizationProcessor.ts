import { Router } from 'express';
import { OrganizationProcessorController } from '../controllers/OrganizationProcessorController';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const controller = new OrganizationProcessorController();

// Middleware de logging
router.use((req, res, next) => {
    logger.info('Acceso a ruta de procesador de organización:', {
        method: req.method,
        path: req.path,
        user: req.user?.id,
        orgId: req.orgId
    });
    next();
});

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Procesar todas las sesiones de la organización
router.post('/process-sessions', controller.processOrganizationSessions.bind(controller));

// Obtener estado del procesamiento
router.get('/status', controller.getProcessingStatus.bind(controller));

export default router;
