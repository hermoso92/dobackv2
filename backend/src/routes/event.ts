import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { authenticate } from '../middleware/auth';
import { eventSchema, validate } from '../middleware/validation';

const router = Router();
const controller = new EventController();

// Rutas públicas
router.post(
    '/',
    authenticate,
    validate(eventSchema),
    controller.createEvent.bind(controller)
);
router.get('/', authenticate, controller.getEvents.bind(controller));
router.get('/stats', authenticate, controller.getEventStats.bind(controller));

export default router;
