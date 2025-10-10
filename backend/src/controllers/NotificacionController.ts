import { Request, Response } from 'express';
import { NotificacionService } from '../services/NotificacionService';
import { logger } from '../utils/logger';

const notificacionService = new NotificacionService();

export class NotificacionController {
    async crearNotificacion(req: Request, res: Response) {
        try {
            const notificacion = await notificacionService.crearNotificacion(req.body);
            res.status(201).json(notificacion);
        } catch (error) {
            logger.error('Error creando notificación', { error });
            res.status(500).json({ error: 'Error creando notificación' });
        }
    }

    async actualizarNotificacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const notificacion = await notificacionService.actualizarNotificacion(id, req.body);
            res.json(notificacion);
        } catch (error) {
            logger.error('Error actualizando notificación', { error });
            res.status(500).json({ error: 'Error actualizando notificación' });
        }
    }

    async eliminarNotificacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await notificacionService.eliminarNotificacion(id);
            res.status(204).send();
        } catch (error) {
            logger.error('Error eliminando notificación', { error });
            res.status(500).json({ error: 'Error eliminando notificación' });
        }
    }

    async obtenerNotificacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const notificacion = await notificacionService.obtenerNotificacion(id);
            if (!notificacion) return res.status(404).json({ error: 'Notificación no encontrada' });
            res.json(notificacion);
        } catch (error) {
            logger.error('Error obteniendo notificación', { error });
            res.status(500).json({ error: 'Error obteniendo notificación' });
        }
    }

    async listarNotificaciones(req: Request, res: Response) {
        try {
            const notificaciones = await notificacionService.listarNotificaciones(req.query);
            res.json(notificaciones);
        } catch (error) {
            logger.error('Error listando notificaciones', { error });
            res.status(500).json({ error: 'Error listando notificaciones' });
        }
    }

    async marcarComoEnviada(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const notificacion = await notificacionService.marcarComoEnviada(id);
            res.json(notificacion);
        } catch (error) {
            logger.error('Error marcando como enviada', { error });
            res.status(500).json({ error: 'Error marcando como enviada' });
        }
    }

    async marcarComoRecibida(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const notificacion = await notificacionService.marcarComoRecibida(id);
            res.json(notificacion);
        } catch (error) {
            logger.error('Error marcando como recibida', { error });
            res.status(500).json({ error: 'Error marcando como recibida' });
        }
    }

    async listarPorUsuario(req: Request, res: Response) {
        try {
            const { usuarioId } = req.params;
            const notificaciones = await notificacionService.listarPorUsuario(usuarioId);
            res.json(notificaciones);
        } catch (error) {
            logger.error('Error listando notificaciones por usuario', { error });
            res.status(500).json({ error: 'Error listando notificaciones por usuario' });
        }
    }

    async listarPorTipo(req: Request, res: Response) {
        try {
            const { tipo } = req.params;
            const notificaciones = await notificacionService.listarPorTipo(tipo);
            res.json(notificaciones);
        } catch (error) {
            logger.error('Error listando notificaciones por tipo', { error });
            res.status(500).json({ error: 'Error listando notificaciones por tipo' });
        }
    }
}
