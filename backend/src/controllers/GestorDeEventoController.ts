import { Request, Response } from 'express';
import { GestorDeEventoService } from '../services/GestorDeEventoService';
import { logger } from '../utils/logger';

export class GestorDeEventoController {
    private gestorDeEventoService: GestorDeEventoService;

    constructor() {
        this.gestorDeEventoService = new GestorDeEventoService();
    }

    // Métodos principales de eventos
    async crearEvento(req: Request, res: Response) {
        try {
            // Extraer userId y organizationId del JWT decodificado (debería estar en req.user)
            const userId = (req as any).user?.id || (req as any).user?.sub;
            const organizationId = (req as any).user?.organizationId;

            if (!userId || !organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado o sin organización'
                });
            }

            // Agregar el userId y organizationId a los datos
            const eventData = {
                ...req.body,
                createdById: userId,
                organizationId
            };

            const event = await this.gestorDeEventoService.crearEvento(eventData);
            res.status(201).json({
                success: true,
                data: event,
                message: 'Evento creado correctamente'
            });
        } catch (error) {
            logger.error('Error creating event:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear evento'
            });
        }
    }

    async listarEventos(req: Request, res: Response) {
        try {
            const organizationId = (req as any).user?.organizationId;
            if (!organizationId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado o sin organización'
                });
            }
            // Pasar organizationId como filtro
            const events = await this.gestorDeEventoService.listarEventos({ organizationId });
            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error('Error getting events:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener eventos'
            });
        }
    }

    async obtenerEvento(req: Request, res: Response) {
        try {
            const event = await this.gestorDeEventoService.obtenerEvento(req.params.id);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: 'Evento no encontrado'
                });
            }
            res.json({
                success: true,
                data: event
            });
        } catch (error) {
            logger.error(`Error getting event ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener evento'
            });
        }
    }

    async actualizarEvento(req: Request, res: Response) {
        try {
            const event = await this.gestorDeEventoService.actualizarEvento(
                req.params.id,
                req.body
            );
            res.json({
                success: true,
                data: event,
                message: 'Evento actualizado correctamente'
            });
        } catch (error) {
            logger.error(`Error updating event ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar evento'
            });
        }
    }

    async eliminarEvento(req: Request, res: Response) {
        try {
            await this.gestorDeEventoService.eliminarEvento(req.params.id);
            res.json({
                success: true,
                message: 'Evento eliminado correctamente'
            });
        } catch (error) {
            logger.error(`Error deleting event ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar evento'
            });
        }
    }

    async eliminarTodosLosEventos(req: Request, res: Response) {
        try {
            await this.gestorDeEventoService.eliminarTodosEventos();
            res.json({
                success: true,
                message: 'Todos los eventos eliminados correctamente'
            });
        } catch (error) {
            logger.error('Error deleting all events:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar todos los eventos'
            });
        }
    }

    // Métodos de evaluación
    async evaluarCondicionesEvento(req: Request, res: Response) {
        try {
            const { data } = req.body;
            const result = await this.gestorDeEventoService.evaluarCondicionesEvento(
                req.params.id,
                data
            );
            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error(`Error evaluating event conditions for ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al evaluar condiciones del evento'
            });
        }
    }

    // Métodos de ejecuciones
    async obtenerEjecucionesEventos(req: Request, res: Response) {
        try {
            const { vehicleId, eventId, sessionId, limit = 50, offset = 0 } = req.query;

            const filters: any = {};
            if (vehicleId) filters.vehicleId = vehicleId;
            if (eventId) filters.eventId = eventId;
            if (sessionId) filters.sessionId = sessionId;

            const executions = await this.gestorDeEventoService.obtenerEjecucionesEventos(filters, {
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
            });

            res.json({
                success: true,
                data: executions
            });
        } catch (error) {
            logger.error('Error getting event executions:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ejecuciones de eventos'
            });
        }
    }

    async obtenerEjecucionEvento(req: Request, res: Response) {
        try {
            const execution = await this.gestorDeEventoService.obtenerEjecucionEvento(
                req.params.id
            );
            if (!execution) {
                return res.status(404).json({
                    success: false,
                    message: 'Ejecución de evento no encontrada'
                });
            }
            res.json({
                success: true,
                data: execution
            });
        } catch (error) {
            logger.error(`Error getting event execution ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener ejecución de evento'
            });
        }
    }

    // Métodos de utilidad
    async obtenerEventosActivosVehiculo(req: Request, res: Response) {
        try {
            const events = await this.gestorDeEventoService.obtenerEventosActivosVehiculo(
                req.params.vehicleId
            );
            res.json({
                success: true,
                data: events
            });
        } catch (error) {
            logger.error(`Error getting active events for vehicle ${req.params.vehicleId}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener eventos activos del vehículo'
            });
        }
    }

    async actualizarEstadoEvento(req: Request, res: Response) {
        try {
            const { estado } = req.body;
            const event = await this.gestorDeEventoService.updateEventStatus(req.params.id, estado);
            res.json({
                success: true,
                data: event,
                message: 'Estado del evento actualizado correctamente'
            });
        } catch (error) {
            logger.error(`Error updating event status for ${req.params.id}:`, error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar estado del evento'
            });
        }
    }

    // Métodos de compatibilidad (aliases)
    crearCondicion = this.crearEvento;
    obtenerEventos = this.listarEventos;
}
