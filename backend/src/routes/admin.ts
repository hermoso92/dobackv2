import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

// Aplicar middleware de autenticación y organización a todas las rutas
router.use(authenticate);
router.use(attachOrg);

// Rutas para gestión de usuarios
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Rutas para gestión de organizaciones
router.get('/organizations', adminController.getOrganizations);
router.get('/organizations/:id', adminController.getOrganization);
router.put('/organizations/:id', adminController.updateOrganization);

// Rutas para gestión de API Keys
router.get('/api-keys', adminController.getApiKeys);
router.post('/api-keys', adminController.createApiKey);
router.put('/api-keys/:id', adminController.updateApiKey);
router.delete('/api-keys/:id', adminController.revokeApiKey);

// Rutas para gestión de Feature Flags
router.get('/feature-flags', adminController.getFeatureFlags);
router.put('/feature-flags/:id', adminController.updateFeatureFlag);

// Rutas para configuración de seguridad
router.get('/security/settings', adminController.getSecuritySettings);
router.put('/security/settings', adminController.updateSecuritySettings);

// Rutas para eventos de seguridad
router.get('/security/events', adminController.getSecurityEvents);
router.post('/security/events/:id/resolve', adminController.resolveSecurityEvent);

// Rutas para logs de auditoría
router.get('/audit/logs', adminController.getAuditLogs);

// Rutas para estadísticas de administración
router.get('/stats', adminController.getAdminStats);

// Rutas para configuración general
router.get('/settings', adminController.getAdminSettings);
router.put('/settings', adminController.updateAdminSettings);

export default router;