import { Router } from 'express';
import { PanelController } from '../controllers/PanelController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const panelController = new PanelController();

// Middleware de autenticación y organización
router.use(authenticate);
router.use(attachOrg);

// Rutas de KPIs
router.get('/kpis', panelController.getKPIs);
router.get('/vehicles/stats', panelController.getVehicleStats);
router.get('/time/stats', panelController.getTimeStats);
router.get('/speed/stats', panelController.getSpeedStats);
router.get('/geofence/stats', panelController.getGeofenceStats);

// Rutas de heatmap
router.get('/heatmap/:type', panelController.getHeatmapData);

// Rutas de alertas
router.get('/alerts', panelController.getAlerts);
router.put('/alerts/:id/read', panelController.markAlertAsRead);

// Rutas de tiempo real
router.get('/realtime', panelController.getRealtimeEvents);

// Rutas de resumen ejecutivo
router.get('/executive-summary', panelController.getExecutiveSummary);

export default router;
