import { Router } from 'express';
import { parkKPIController } from '../controllers/ParkKPIController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas
router.use(authenticate);

// Obtener KPI de un parque específico
router.get('/:parkId', parkKPIController.getParkKPI.bind(parkKPIController));

// Calcular KPI de un parque específico
router.post('/:parkId/calculate', parkKPIController.calculateParkKPI.bind(parkKPIController));

// Calcular KPIs de todos los parques de una organización
router.post('/calculate-all', parkKPIController.calculateAllParksKPI.bind(parkKPIController));

// Obtener estadísticas de KPIs de parque
router.get('/stats', parkKPIController.getParkKPIStats.bind(parkKPIController));

export default router; 