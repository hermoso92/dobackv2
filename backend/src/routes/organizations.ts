import { Router } from 'express';
import { OrganizationController } from '../controllers/OrganizationController';
import { authenticate, authorize } from '../middlewares/auth';
import { OrganizationService } from '../services/OrganizationService';

const router = Router();
// Crear instancia del servicio primero
const organizationService = new OrganizationService();
// Pasar la instancia del servicio al controlador
const controller = new OrganizationController(organizationService);

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores
router.get('/', authorize(['admin']), controller.getOrganizations);
router.get('/:id', authorize(['admin']), controller.getOrganizationById);
router.post('/', authorize(['admin']), controller.createOrganization);
router.put('/:id', authorize(['admin']), controller.updateOrganization);
router.delete('/:id', authorize(['admin']), controller.deleteOrganization);

// Rutas de configuración
router.get('/:id/config', authorize(['admin']), controller.getOrganizationConfig);
router.put('/:id/config', authorize(['admin']), controller.updateOrganizationConfig);

// Rutas de usuarios
router.get('/:id/users', authorize(['admin']), controller.getOrganizationUsers);
router.post('/:id/users', authorize(['admin']), controller.addOrganizationUser);
router.delete('/:id/users/:userId', authorize(['admin']), controller.removeOrganizationUser);

// Rutas de vehículos
router.get('/:id/vehicles', authorize(['admin']), controller.getOrganizationVehicles);
router.get('/:id/vehicles/stats', authorize(['admin']), controller.getOrganizationVehicleStats);

// Rutas de eventos
router.get('/:id/events', authorize(['admin']), controller.getOrganizationEvents);
router.get('/:id/events/stats', authorize(['admin']), controller.getOrganizationEventStats);

// Rutas de reportes
router.get(
    '/:id/reports/stability',
    authorize(['admin']),
    controller.getOrganizationStabilityReport
);
router.get(
    '/:id/reports/performance',
    authorize(['admin']),
    controller.getOrganizationPerformanceReport
);
router.get(
    '/:id/reports/maintenance',
    authorize(['admin']),
    controller.getOrganizationMaintenanceReport
);
router.get('/:id/reports/custom', authorize(['admin']), controller.getOrganizationCustomReport);

// Rutas de facturación
router.get('/:id/billing', authorize(['admin']), controller.getOrganizationBilling);
router.get('/:id/billing/invoices', authorize(['admin']), controller.getOrganizationInvoices);
router.get('/:id/billing/usage', authorize(['admin']), controller.getOrganizationUsage);

export { router as organizationRoutes };
