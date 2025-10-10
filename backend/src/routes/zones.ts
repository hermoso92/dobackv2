import { Router } from 'express';
import { createZone, deleteZone, getZone, getZones, updateZone } from '../controllers/zonesController';
import { extractOrganizationId, requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación y scoping por organización
router.use(requireAuth, extractOrganizationId);

router.get('/', getZones);
router.get('/:id', getZone);
router.post('/', requireAdmin, createZone);
router.put('/:id', requireAdmin, updateZone);
router.delete('/:id', requireAdmin, deleteZone);

export default router; 