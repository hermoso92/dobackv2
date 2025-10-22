/**
 * Rutas de Alertas
 */

import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireRole } from '../middleware/authorization';
import { UserRole } from '../types/domain';
import { Permission } from '../types/permissions';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/alerts
 * Obtener alertas de la organización del usuario
 * ADMIN y MANAGER
 */
router.get('/',
    requirePermission(Permission.ALERTS_VIEW),
    AlertController.getAlerts
);

/**
 * GET /api/alerts/stats
 * Obtener estadísticas de alertas
 * ADMIN y MANAGER
 */
router.get('/stats',
    requirePermission(Permission.ALERTS_VIEW),
    AlertController.getStats
);

/**
 * POST /api/alerts/:id/resolve
 * Resolver una alerta
 * ADMIN y MANAGER
 */
router.post('/:id/resolve',
    requirePermission(Permission.ALERTS_RESOLVE),
    AlertController.resolveAlert
);

/**
 * POST /api/alerts/:id/ignore
 * Ignorar una alerta
 * ADMIN y MANAGER
 */
router.post('/:id/ignore',
    requirePermission(Permission.ALERTS_RESOLVE),
    AlertController.ignoreAlert
);

/**
 * POST /api/alerts/check
 * Ejecutar verificación manual de archivos faltantes
 * Solo ADMIN
 */
router.post('/check',
    requireRole([UserRole.ADMIN]),
    AlertController.checkMissingFiles
);

export default router;
