import { Router } from 'express';
import upload from '../config/multer';
import { TelemetryController } from '../controllers/TelemetryController';
import { authenticate } from '../middleware/auth';

const router = Router();
const telemetryController = new TelemetryController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Obtener sesiones de telemetría por vehículo
router.get('/:vehicleId/sessions', telemetryController.getVehicleSessions);

// Obtener alarmas de telemetría por vehículo
router.get('/:vehicleId/alarms', telemetryController.getVehicleAlarms);

// Procesar datos de telemetría
router.post('/process', telemetryController.processTelemetryData);

// Subir archivos de telemetría (GPS + CAN + Estabilidad)
router.post(
    '/upload',
    upload.fields([
        { name: 'gpsFile', maxCount: 1 },
        { name: 'canFile', maxCount: 1 },
        { name: 'stabilityFile', maxCount: 1 }
    ]),
    telemetryController.uploadTelemetryFiles
);

export default router;
