import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { authenticate } from '../middleware/auth';

const router = Router();
const eventController = new EventController();

// Asegurar que todos los métodos estén vinculados al contexto del controlador
const boundController = {
    getEvents: eventController.getEvents.bind(eventController),
    getEvent: eventController.getEvent.bind(eventController),
    createEvent: eventController.createEvent.bind(eventController),
    updateEvent: eventController.updateEvent.bind(eventController),
    updateEventStatus: eventController.updateEventStatus.bind(eventController),
    deleteEvent: eventController.deleteEvent.bind(eventController)
};

// Rutas protegidas por autenticación
router.use(authenticate);

// Obtener eventos
router.get('/', boundController.getEvents);

// Obtener clusters de eventos (debe ir antes de rutas con :id)
router.get('/cluster', eventController.getEventClusters.bind(eventController));

// Obtener evento específico
router.get('/:id', boundController.getEvent);

// Obtener eventos por organización (usando getEvents con query param)
router.get('/organization/:organizationId', (req, res) => {
    req.query.organizationId = req.params.organizationId;
    boundController.getEvents(req, res);
});

// Crear evento
router.post('/', boundController.createEvent);

// Actualizar evento
router.put('/:id', boundController.updateEvent);

// Actualizar estado de evento
router.patch('/:id/status', boundController.updateEventStatus);

// Eliminar evento
router.delete('/:id', boundController.deleteEvent);

export default router;
