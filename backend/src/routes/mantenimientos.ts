import { Router } from 'express';
import { z } from 'zod';
import { MantenimientoController } from '../controllers/MantenimientoController';
import { authenticate } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';

const router = Router();
const controller = new MantenimientoController();

// Esquemas de validación
const mantenimientoSchema = z.object({
    tipo: z.enum(['PREVENTIVO', 'CORRECTIVO']),
    descripcion: z.string().min(5).max(500),
    fechaProgramada: z.string().datetime().optional(),
    vehiculoId: z.string().uuid(),
    prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']).optional()
});

const comentarioSchema = z.object({
    texto: z.string().min(1).max(1000)
});

const responsableSchema = z.object({
    userId: z.string().uuid()
});

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Rutas principales
router.post('/', validate(mantenimientoSchema), controller.crearMantenimiento);

router.put(
    '/:id',
    validateParams(z.object({ id: z.string().uuid() })),
    validate(mantenimientoSchema.partial()),
    controller.actualizarMantenimiento
);

router.delete(
    '/:id',
    validateParams(z.object({ id: z.string().uuid() })),
    controller.eliminarMantenimiento
);

router.get(
    '/:id',
    validateParams(z.object({ id: z.string().uuid() })),
    controller.obtenerMantenimiento
);

router.get('/', controller.listarMantenimientos);

// Rutas adicionales
router.post(
    '/:id/asignar-responsable',
    validateParams(z.object({ id: z.string().uuid() })),
    validate(responsableSchema),
    controller.asignarResponsable
);

router.post(
    '/:id/comentarios',
    validateParams(z.object({ id: z.string().uuid() })),
    validate(comentarioSchema),
    controller.agregarComentario
);

router.post(
    '/:id/archivos',
    validateParams(z.object({ id: z.string().uuid() })),
    controller.agregarArchivo
);

router.get(
    '/vehiculo/:vehiculoId',
    validateParams(z.object({ vehiculoId: z.string().uuid() })),
    controller.listarPorVehiculo
);

router.get(
    '/usuario/:responsableId',
    validateParams(z.object({ responsableId: z.string().uuid() })),
    controller.listarPorUsuario
);

export default router;
