import { Router } from 'express';
import { z } from 'zod';
import { EventoController } from '../controllers/EventoController';
import { authenticate } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';

const router = Router();
const controller = new EventoController();

// Esquemas de validación
const eventoSchema = z.object({
    nombre: z.string().min(3).max(100),
    tipo: z.enum(['ESTABILIDAD', 'TELEMETRIA']),
    descripcion: z.string().min(5).max(500),
    severidad: z.enum(['INFO', 'WARNING', 'DANGER', 'CRITICAL']).optional(),
    prioridad: z.number().int().min(1).max(5).optional(),
    condiciones: z.array(z.any()).optional(),
    variablesAMostrar: z.array(z.string()).optional(),
    autoEvaluate: z.boolean().optional()
});

const eventoUpdateSchema = z.object({
    nombre: z.string().min(3).max(100).optional(),
    tipo: z.enum(['ESTABILIDAD', 'TELEMETRIA']).optional(),
    descripcion: z.string().min(5).max(500).optional(),
    autoEvaluate: z.boolean().optional()
});

const evaluacionSchema = z.object({
    datos: z.record(z.string(), z.any())
});

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Rutas de eventos
router.get(
    '/',
    validateQuery(
        z.object({
            tipo: z.enum(['ESTABILIDAD', 'TELEMETRIA']).optional(),
            activa: z.boolean().optional()
        })
    ),
    controller.listarEventos
);

router.get('/:id', validateParams(z.object({ id: z.string().uuid() })), controller.obtenerEvento);

router.post('/', validate(eventoSchema), controller.crearEvento);

router.put(
    '/:id',
    validateParams(z.object({ id: z.string().uuid() })),
    validate(eventoUpdateSchema),
    controller.actualizarEvento
);

router.delete(
    '/:id',
    validateParams(z.object({ id: z.string().uuid() })),
    controller.eliminarEvento
);

// Ruta de evaluación
router.post(
    '/:vehiculoId/evaluar',
    validateParams(z.object({ vehiculoId: z.string().uuid() })),
    validate(evaluacionSchema),
    controller.evaluarEventos
);

export default router;
