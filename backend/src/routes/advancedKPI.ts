import { Router } from 'express';
import { AdvancedKPIController } from '../controllers/AdvancedKPIController';
import { extractOrganizationId, requireAuth } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y scoping por organización
router.use(requireAuth, extractOrganizationId);

// Obtener KPIs avanzados de un vehículo específico
router.get('/vehicle/:vehicleId', AdvancedKPIController.getVehicleAdvancedKPI);

// Obtener formato de dashboard para KPIs avanzados
router.get('/dashboard', AdvancedKPIController.getDashboardFormat);

// Comparar KPIs entre fechas
router.get('/compare', AdvancedKPIController.compareKPIs);

export default router; 