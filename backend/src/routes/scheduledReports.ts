/**
 * Rutas de Reportes Programados
 */

import { Router } from 'express';
import { ScheduledReportController } from '../controllers/ScheduledReportController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';
import { Permission } from '../types/permissions';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/scheduled-reports
 * Obtener reportes programados de la organización
 * ADMIN y MANAGER
 */
router.get('/',
    requirePermission(Permission.REPORTS_VIEW_SCHEDULED),
    ScheduledReportController.getScheduledReports
);

/**
 * POST /api/scheduled-reports
 * Crear reporte programado
 * ADMIN y MANAGER
 */
router.post('/',
    requirePermission(Permission.REPORTS_SCHEDULE),
    ScheduledReportController.createScheduledReport
);

/**
 * PUT /api/scheduled-reports/:id
 * Actualizar reporte programado
 * ADMIN y MANAGER
 */
router.put('/:id',
    requirePermission(Permission.REPORTS_EDIT_SCHEDULED),
    ScheduledReportController.updateScheduledReport
);

/**
 * DELETE /api/scheduled-reports/:id
 * Eliminar reporte programado
 * ADMIN y MANAGER
 */
router.delete('/:id',
    requirePermission(Permission.REPORTS_DELETE_SCHEDULED),
    ScheduledReportController.deleteScheduledReport
);

/**
 * POST /api/scheduled-reports/:id/execute
 * Ejecutar reporte manualmente
 * ADMIN y MANAGER
 */
router.post('/:id/execute',
    requirePermission(Permission.REPORTS_VIEW_SCHEDULED),
    ScheduledReportController.executeReport
);

export default router;

