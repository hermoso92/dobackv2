import { Router } from 'express';
import { GeofenceRuleController } from '../controllers/geofenceRuleController';
import { authenticate } from '../middleware/auth';

// Función para crear y configurar el router con el controlador
export const createGeofenceRulesRouter = (controller: GeofenceRuleController) => {
    const router = Router();

    // Todas las rutas requieren autenticación
    router.use(authenticate);

    // ============================================================================
    // RUTAS PARA GESTIÓN DE REGLAS
    // ============================================================================

    /**
     * POST /api/geofence-rules
     * Crea una nueva regla de geocerca
     */
    router.post('/', controller.createRule.bind(controller));

    /**
     * GET /api/geofence-rules
     * Obtiene todas las reglas de la organización
     */
    router.get('/', controller.getRules.bind(controller));

    /**
     * GET /api/geofence-rules/:ruleId
     * Obtiene una regla específica
     */
    router.get('/:ruleId', controller.getRule.bind(controller));

    /**
     * PUT /api/geofence-rules/:ruleId
     * Actualiza una regla existente
     */
    router.put('/:ruleId', controller.updateRule.bind(controller));

    /**
     * DELETE /api/geofence-rules/:ruleId
     * Elimina una regla
     */
    router.delete('/:ruleId', controller.deleteRule.bind(controller));

    /**
     * PATCH /api/geofence-rules/:ruleId/status
     * Activa/desactiva una regla
     */
    router.patch('/:ruleId/status', controller.toggleRuleStatus.bind(controller));

    // ============================================================================
    // RUTAS PARA VALIDACIÓN Y ADMINISTRACIÓN
    // ============================================================================

    /**
     * POST /api/geofence-rules/validate
     * Valida una regla sin guardarla
     */
    router.post('/validate', controller.validateRule.bind(controller));

    /**
     * GET /api/geofence-rules/stats/engine
     * Obtiene estadísticas del motor de reglas
     */
    router.get('/stats/engine', controller.getRuleEngineStats.bind(controller));

    /**
     * POST /api/geofence-rules/cleanup
     * Ejecuta limpieza del motor de reglas
     */
    router.post('/cleanup', controller.cleanupRuleEngine.bind(controller));

    return router;
}; 