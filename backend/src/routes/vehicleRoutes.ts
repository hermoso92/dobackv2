import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { authenticate } from '../middleware/auth';

const router = Router();
const vehicleController = new VehicleController();

// Rutas públicas
router.get('/status/:id', vehicleController.getVehicleStatus);

// Rutas protegidas
router.use(authenticate);

// Rutas de vehículos
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

// Rutas de telemetría
router.get('/:id/telemetry', vehicleController.getVehicleTelemetry);
router.get('/:id/stability', vehicleController.getVehicleStability);
router.get('/:id/events', vehicleController.getVehicleEvents);
router.get('/:id/sessions', vehicleController.getVehicleSessions);

// Rutas de activación/desactivación
router.post('/:id/activate', vehicleController.activateVehicle);
router.post('/:id/deactivate', vehicleController.deactivateVehicle);

// Rutas de configuración
router.get('/:id/config', vehicleController.getVehicleConfig);
router.put('/:id/config', vehicleController.updateVehicleConfig);
router.post('/:id/telemetry/enable', vehicleController.enableVehicleTelemetry);
router.post('/:id/telemetry/disable', vehicleController.disableVehicleTelemetry);

// Rutas de mantenimiento
router.get('/:id/maintenance', vehicleController.getVehicleMaintenance);
router.post('/:id/maintenance', vehicleController.scheduleVehicleMaintenance);
router.put('/:id/maintenance', vehicleController.updateVehicleMaintenance);
router.delete('/:id/maintenance', vehicleController.deleteVehicleMaintenance);

// Rutas de reportes
router.get('/:id/reports/stability', vehicleController.getVehicleStabilityReport);
router.get('/:id/reports/performance', vehicleController.getVehiclePerformanceReport);
router.get('/:id/reports/maintenance', vehicleController.getVehicleMaintenanceReport);
router.post('/:id/reports/custom', vehicleController.getVehicleCustomReport);

export default router;
