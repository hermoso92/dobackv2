import express from 'express';
import { getVehicleData } from '../controllers/vehicleDataController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Ruta para obtener todos los tipos de datos
router.get('/:vehicleId/:date', getVehicleData);

// Ruta para obtener todos los tipos de datos de una sesión específica
router.get('/:vehicleId/:date/session/:sessionId', getVehicleData);

// Ruta para obtener un tipo específico de datos
router.get('/:vehicleId/:date/:dataType', getVehicleData);

// Ruta para obtener un tipo específico de datos de una sesión específica
router.get('/:vehicleId/:date/:dataType/session/:sessionId', getVehicleData);

// Endpoint mínimo de ejemplo para telemetría
router.get('/vehicle/:vehicleId/data', (req, res) => {
    // Devuelve datos mock para desarrollo
    res.json({
        success: true,
        data: [
            {
                id: '1',
                vehicleId: req.params.vehicleId,
                timestamp: new Date().toISOString(),
                can: { speed: 60, rpm: 2000, temperature: 90, fuel: 50 },
                gps: { latitude: 40.4168, longitude: -3.7038, speed: 60, heading: 90 }
            }
        ]
    });
});

export default router;
