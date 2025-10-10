import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController';

const router = Router();
const controller = new NotificacionController();

router.post('/', controller.crearNotificacion.bind(controller));
router.put('/:id', controller.actualizarNotificacion.bind(controller));
router.delete('/:id', controller.eliminarNotificacion.bind(controller));
router.get('/:id', controller.obtenerNotificacion.bind(controller));
router.get('/', controller.listarNotificaciones.bind(controller));
router.post('/:id/enviada', controller.marcarComoEnviada.bind(controller));
router.post('/:id/recibida', controller.marcarComoRecibida.bind(controller));
router.get('/usuario/:usuarioId', controller.listarPorUsuario.bind(controller));
router.get('/tipo/:tipo', controller.listarPorTipo.bind(controller));

export default router;
