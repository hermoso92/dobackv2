import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authenticate, authorize } from '../middlewares/auth';
import { validateUser } from '../middlewares/validation';

const router = Router();
const controller = new UserController();

// Rutas protegidas
router.use(authenticate);

// Rutas para administradores
router.get('/', authorize(['admin']), controller.getUsers);
router.get('/:id', authorize(['admin']), controller.getUserById);
router.post('/', authorize(['admin']), validateUser, controller.createUser);
router.put('/:id', authorize(['admin']), validateUser, controller.updateUser);
router.delete('/:id', authorize(['admin']), controller.deleteUser);
router.post('/:id/activate', authorize(['admin']), controller.activateUser);
router.post('/:id/deactivate', authorize(['admin']), controller.deactivateUser);
router.post('/:id/reset-password', authorize(['admin']), controller.resetUserPassword);

// Rutas de roles
router.get('/roles', authorize(['admin']), controller.getRoles);
router.post('/roles', authorize(['admin']), controller.createRole);
router.put('/roles/:roleId', authorize(['admin']), controller.updateRole);
router.delete('/roles/:roleId', authorize(['admin']), controller.deleteRole);
router.get('/roles/:roleId/permissions', authorize(['admin']), controller.getRolePermissions);
router.put('/roles/:roleId/permissions', authorize(['admin']), controller.updateRolePermissions);

// Rutas de permisos
router.get('/permissions', authorize(['admin']), controller.getPermissions);
router.post('/permissions', authorize(['admin']), controller.createPermission);
router.put('/permissions/:permissionId', authorize(['admin']), controller.updatePermission);
router.delete('/permissions/:permissionId', authorize(['admin']), controller.deletePermission);

// Rutas de actividad
router.get('/:id/activity', authorize(['admin']), controller.getUserActivity);
router.get('/:id/sessions', authorize(['admin']), controller.getUserSessions);
router.get('/:id/permissions', authorize(['admin']), controller.getUserPermissions);

export { router as userRoutes };
