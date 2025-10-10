import { Router } from 'express';
import { StabilityController } from '../controllers/StabilityController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const stabilityController = new StabilityController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Rutas para sesiones de estabilidad
router.get('/sessions', stabilityController.getSessions);
router.get('/sessions/:id', stabilityController.getSession);
router.get('/sessions/:id/events', stabilityController.getSessionEvents);
router.get('/sessions/:id/realtime', stabilityController.getRealtimeData);
router.post('/sessions/:id/export', stabilityController.exportStabilityData);

// ⭐ NUEVO: Endpoint crítico para obtener datos completos (mediciones + GPS + eventos)
router.get('/session/:id/data', stabilityController.getSessionData);

// ⭐ NUEVO: Endpoint para obtener sesiones de un vehículo específico
router.get('/vehicle/:vehicleId/sessions', stabilityController.getVehicleSessions);

// ⭐ NUEVO: Endpoint para obtener datos del mapa de calor
router.get('/events/heatmap', stabilityController.getHeatmapData);

// ⭐ NUEVO: Endpoint para exportar mapa de calor a PDF
router.get('/events/heatmap/export', stabilityController.exportHeatmapPDF);

// Rutas para métricas y estadísticas
router.get('/metrics', stabilityController.getStabilityMetrics);
router.get('/stats', stabilityController.getStabilityStats);

// Rutas para comparaciones
router.post('/compare', stabilityController.compareSessions);
router.get('/comparisons', stabilityController.getComparisons);
router.post('/comparisons', stabilityController.saveComparison);
router.delete('/comparisons/:id', stabilityController.deleteComparison);

// Rutas para vehículos con datos de estabilidad
router.get('/vehicles', stabilityController.getVehiclesWithStability);

export default router;