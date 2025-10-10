import { Router } from 'express';
import { createVehicle, deleteVehicle, getVehicle, getVehicles, updateVehicle } from '../controllers/vehiclesController';
import { extractOrganizationId, requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth, extractOrganizationId);

router.get('/', getVehicles);
router.get('/:id', getVehicle);
router.post('/', requireAdmin, createVehicle);
router.put('/:id', requireAdmin, updateVehicle);
router.delete('/:id', requireAdmin, deleteVehicle);

export default router;

