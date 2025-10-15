import { EventStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateEventDTO } from '../types/event';

export class EventService {
    async getEventsBySession(sessionId: string) {
        return prisma.stability_events.findMany({
            where: { session_id: sessionId },
            include: {
                Session: {
                    select: {
                        organizationId: true,
                        vehicleId: true,
                        parkId: true
                    }
                }
            }
        });
    }

    async getEvents(filters: {
        organizationId: string;
        vehicleId?: string;
        parkId?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        try {
            console.log('🔍 Filtros recibidos:', filters);

            // Construir where clause para la consulta SQL
            const where: any = {};

            // Filtrar por tipo si se proporciona
            if (filters.type) where.type = filters.type;

            // Filtrar por fechas si se proporcionan
            if (filters.dateFrom || filters.dateTo) {
                where.timestamp = {};
                if (filters.dateFrom) where.timestamp.gte = new Date(filters.dateFrom);
                if (filters.dateTo) where.timestamp.lte = new Date(filters.dateTo);
            }

            // Filtrar por organización usando la relación con Session
            if (filters.organizationId) {
                where.Session = {
                    organizationId: filters.organizationId
                };
            }

            // Filtrar por vehículo usando la relación con Session
            if (filters.vehicleId) {
                where.Session = {
                    ...where.Session,
                    vehicleId: filters.vehicleId
                };
            }

            // Filtrar por parque usando la relación con Session
            if (filters.parkId) {
                where.Session = {
                    ...where.Session,
                    parkId: filters.parkId
                };
            }

            console.log('🔍 Where clause:', JSON.stringify(where, null, 2));

            // Consulta directa con filtros en SQL
            const events = await prisma.stability_events.findMany({
                where,
                include: {
                    Session: {
                        select: {
                            organizationId: true,
                            vehicleId: true,
                            parkId: true
                        }
                    }
                }
            });

            console.log('🔍 Eventos encontrados (con filtros SQL):', events.length);
            if (events.length > 0) {
                console.log('🔍 Primer evento:', {
                    id: events[0].id,
                    lat: events[0].lat,
                    lon: events[0].lon,
                    type: events[0].type,
                    session_id: events[0].session_id,
                    Session: events[0].Session
                });
            }

            // Mapear a formato para clustering
            const result = events.map((ev: any) => ({
                lat: ev.lat || 0,
                lon: ev.lon || 0,
                type: ev.type || 'unknown',
                timestamp: ev.timestamp || new Date(),
                severity: ev.details?.severity || 'unknown',
                vehicleIdentifier: ev.Session?.vehicleId || 'unknown'
            }));

            console.log('🔍 Resultado final:', result.length, 'eventos');
            if (result.length > 0) {
                console.log('🔍 Primer resultado:', result[0]);
            }

            return result;
        } catch (error) {
            console.error('Error en getEvents:', error);
            throw error;
        }
    }

    async createEvent(eventData: CreateEventDTO) {
        // Crear el evento principal
        const event = await prisma.event.create({
            data: {
                type: eventData.type,
                status: eventData.status,
                organizationId: eventData.organizationId,
                timestamp: new Date(),
                data: {
                    name: eventData.name,
                    description: eventData.description,
                    isPredefined: eventData.isPredefined,
                    conditions: eventData.conditions
                },
                displayData: {
                    name: eventData.name,
                    message: eventData.description
                }
            }
        });

        // Crear las relaciones con vehículos
        if (eventData.vehicles && eventData.vehicles.length > 0) {
            await prisma.eventVehicle.createMany({
                data: eventData.vehicles.map(vehicleId => ({
                    eventId: event.id,
                    vehicleId
                }))
            });
        }

        return event;
    }

    async updateEvent(id: string, updateData: Partial<CreateEventDTO>) {
        const event = await prisma.event.update({
            where: { id },
            data: {
                type: updateData.type,
                status: updateData.status,
                data: {
                    name: updateData.name,
                    description: updateData.description,
                    isPredefined: updateData.isPredefined,
                    conditions: updateData.conditions
                },
                displayData: {
                    name: updateData.name,
                    message: updateData.description
                }
            }
        });

        // Actualizar relaciones con vehículos si se proporcionan
        if (updateData.vehicles) {
            // Eliminar relaciones existentes
            await prisma.eventVehicle.deleteMany({
                where: { eventId: id }
            });

            // Crear nuevas relaciones
            if (updateData.vehicles.length > 0) {
                await prisma.eventVehicle.createMany({
                    data: updateData.vehicles.map(vehicleId => ({
                        eventId: id,
                        vehicleId
                    }))
                });
            }
        }

        return event;
    }

    async getEvent(id: string) {
        return prisma.event.findUnique({
            where: { id },
            include: {
                vehicles: {
                    include: {
                        vehicle: true
                    }
                }
            }
        });
    }

    async updateEventStatus(id: string, status: EventStatus) {
        return prisma.event.update({
            where: { id },
            data: { status }
        });
    }

    async deleteEvent(id: string) {
        // Eliminar relaciones con vehículos primero
        await prisma.eventVehicle.deleteMany({
            where: { eventId: id }
        });

        // Eliminar el evento
        return prisma.event.delete({
            where: { id }
        });
    }

    async deleteAllEvents() {
        // Eliminar todas las relaciones con vehículos
        await prisma.eventVehicle.deleteMany({});

        // Eliminar todos los eventos
        return prisma.event.deleteMany({});
    }
}
