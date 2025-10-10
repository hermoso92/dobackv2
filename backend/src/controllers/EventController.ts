import { EventStatus, EventType } from '@prisma/client';
import { Request, Response } from 'express';
import { EventService } from '../services/EventService';
import { CreateEventDTO } from '../types/event';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const eventService = new EventService();

export class EventController {
    async createEvent(req: Request, res: Response): Promise<void> {
        try {
            const { type, status, organizationId, data, displayData, vehicleIds } = req.body;

            if (!organizationId) {
                res.status(400).json({ success: false, message: 'ID de organización no válido' });
                return;
            }

            if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Debe seleccionar al menos un vehículo'
                });
                return;
            }

            // Validar que el evento tenga nombre y descripción
            if (!data?.name?.trim() || !displayData?.message?.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre y la descripción son requeridos'
                });
                return;
            }

            // Verificar que el usuario esté autenticado
            if (!req.user?.id) {
                res.status(401).json({ success: false, message: 'Usuario no autenticado' });
                return;
            }

            const eventData: CreateEventDTO = {
                name: data.name.trim(),
                description: displayData.message.trim(),
                type: type as EventType,
                status: status as EventStatus,
                isPredefined: data.isPredefined || false,
                conditions: data.conditions || [],
                vehicles: vehicleIds,
                organizationId,
                createdById: req.user.id // Usar el ID del usuario autenticado
            };

            const event = await eventService.createEvent(eventData);

            res.json({ success: true, data: event });
        } catch (error) {
            logger.error('Error en createEvent:', error);
            res.status(500).json({ success: false, message: 'Error al crear el evento' });
        }
    }

    async updateEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { type, status, data, displayData, vehicleIds } = req.body;

            if (!id) {
                res.status(400).json({ success: false, message: 'ID de evento no válido' });
                return;
            }

            // Validar que se hayan proporcionado vehículos
            if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Debe seleccionar al menos un vehículo'
                });
                return;
            }

            const event = await eventService.updateEvent(id, {
                name: data.name,
                description: data.description,
                type: type as EventType,
                status: status as EventStatus,
                isPredefined: data.isPredefined || false,
                conditions: data.conditions || [],
                vehicles: vehicleIds,
                organizationId: req.user?.organizationId || ''
            });

            res.json({ success: true, data: event });
        } catch (error) {
            logger.error('Error en updateEvent:', error);
            res.status(error instanceof ApiError ? error.statusCode : 500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Error al actualizar el evento'
            });
        }
    }

    async getEvents(req: Request, res: Response): Promise<void> {
        try {
            const { status, type, vehicleId } = req.query;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                logger.warn('Intento de acceso a eventos sin organizationId');
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere organizationId'
                });
            }

            logger.info('Obteniendo eventos para organización', { organizationId });

            const events = await eventService.getEvents({
                status: status as EventStatus,
                type: type as EventType,
                vehicleId: vehicleId as string,
                organizationId: organizationId
            });

            logger.info(
                `Se encontraron ${events.length} eventos para la organización ${organizationId}`
            );

            res.json({ success: true, data: events });
        } catch (error) {
            logger.error('Error en getEvents:', error);
            res.status(500).json({ success: false, message: 'Error al obtener los eventos' });
        }
    }

    async getEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ success: false, message: 'ID de evento no válido' });
                return;
            }

            const event = await eventService.getEvent(id);

            res.json({ success: true, data: event });
        } catch (error) {
            logger.error('Error en getEvent:', error);
            res.status(500).json({ success: false, message: 'Error al obtener el evento' });
        }
    }

    async updateEventStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!id || !status) {
                res.status(400).json({
                    success: false,
                    message: 'ID de evento o estado no válido'
                });
                return;
            }

            const event = await eventService.updateEventStatus(id, status as EventStatus);

            res.json({ success: true, data: event });
        } catch (error) {
            logger.error('Error en updateEventStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el estado del evento'
            });
        }
    }

    async deleteEvent(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({ success: false, message: 'ID de evento no válido' });
                return;
            }

            await eventService.deleteEvent(id);

            res.json({ success: true, message: 'Evento eliminado correctamente' });
        } catch (error) {
            logger.error('Error en deleteEvent:', error);
            res.status(500).json({ success: false, message: 'Error al eliminar el evento' });
        }
    }

    async deleteAllEvents(req: Request, res: Response): Promise<void> {
        try {
            await eventService.deleteAllEvents();

            res.json({ success: true, message: 'Todos los eventos han sido eliminados' });
        } catch (error) {
            logger.error('Error en deleteAllEvents:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar todos los eventos'
            });
        }
    }

    async getEventClusters(req: Request, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;
            const userRole = req.user?.role;

            // Para usuarios ADMIN sin organización, devolver lista vacía
            if (!organizationId && userRole === 'ADMIN') {
                return res.json([]);
            }

            if (!organizationId) {
                res.status(400).json({ success: false, message: 'Se requiere organizationId' });
                return;
            }

            // Filtros
            const { vehicleId, parkId, eventType, severity, dateFrom, dateTo } = req.query;

            // Obtener eventos de la organización
            const events = await eventService.getEvents({
                organizationId,
                vehicleId: vehicleId as string,
                parkId: parkId as string,
                type: eventType as string,
                dateFrom: dateFrom as string,
                dateTo: dateTo as string
            });

            // Agrupar por lat/lon redondeado, tipo y severidad
            const clustersMap = new Map<string, any>();
            for (const ev of events) {
                if (!ev.lat || !ev.lon || typeof ev.lat !== 'number' || typeof ev.lon !== 'number') continue;

                const lat = Number(ev.lat.toFixed(4));
                const lon = Number(ev.lon.toFixed(4));
                const key = `${lat}_${lon}_${ev.type || 'unknown'}_${ev.severity || 'unknown'}`;

                if (!clustersMap.has(key)) {
                    clustersMap.set(key, {
                        lat,
                        lon,
                        count: 1,
                        type: ev.type || 'unknown',
                        severity: ev.severity || 'unknown',
                        vehicleIdentifier: ev.vehicleIdentifier || 'unknown',
                        date: ev.timestamp || new Date()
                    });
                } else {
                    clustersMap.get(key).count++;
                }
            }

            const clusters = Array.from(clustersMap.values());
            res.json(clusters);
        } catch (error) {
            logger.error('Error en getEventClusters:', error);
            res.status(500).json({ success: false, message: 'Error al obtener clusters de eventos' });
        }
    }
}
