import { Router } from 'express';
import { TelemetryController } from '../controllers/TelemetryController';

const router = Router();
const telemetryController = new TelemetryController();

// Procesar datos de telemetría
router.post('/process', (req: Request, res: Response) => telemetryController.processTelemetryData(req, res));

// Obtener una sesión específica
router.get('/sessions/:sessionId', (req: Request, res: Response) => telemetryController.getSession(req, res));

// Obtener sesiones de un vehículo en un rango de tiempo
router.get('/vehicles/:vehicleId/sessions', (req: Request, res: Response) => telemetryController.getVehicleSessions(req, res));

export default router; 