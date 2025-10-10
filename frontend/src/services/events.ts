import type { Event, EventCondition } from '../types/events';
import { EventStatus, EventType } from '../types/events';
import { logger } from '../utils/logger.js';
import { apiService } from './api.js';
import { authService } from './auth.js';

interface Vehicle {
    id: string;
    name: string;
    organizationId: string;
}

interface EventFilters {
    status?: EventStatus;
    type?: EventType;
    vehicleId?: string;
}

interface CreateEventDTO {
    name: string;
    description: string;
    estado: EventStatus;
    tipo: EventType;
    isPredefined: boolean;
    conditions: any[];
    vehicles: string[];
    variablesAMostrar?: string[];
    autoEvaluate?: boolean;
    prioridad?: number;
    severidad?: string;
}

interface EventFormData {
    id?: string;
    name: string;
    description: string;
    type: EventType;
    status: EventStatus;
    organizationId: string;
    vehicles: string[];
    isPredefined?: boolean;
    conditions?: any[];
    severity?: string;
}

export const eventService = {
    async getEvents(filters: EventFilters): Promise<Event[]> {
        try {
            logger.debug('Obteniendo eventos con filtros:', filters);
            const response = await apiService.get<Event[]>('/api/events', { params: filters });

            if (!response.success) {
                throw new Error(response.message || 'Error al obtener eventos');
            }

            // Log de la respuesta completa para depuración
            logger.debug('Respuesta completa del servidor:', {
                success: response.success,
                message: response.message,
                data: response.data
            });

            // Verificar si tenemos datos válidos
            if (!response.data) {
                logger.warn('No se encontraron eventos');
                return [];
            }

            const events = response.data;

            // Log detallado de los eventos recibidos
            logger.debug('Eventos obtenidos:', {
                count: events.length,
                events: events.map((event: Event) => ({
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    estado: event.estado,
                    tipo: event.tipo,
                    isPredefined: event.isPredefined,
                    conditions: event.conditions,
                    vehicles: event.vehicles,
                    vehicle: event.vehicle,
                    vehicleName: event.vehicleName
                }))
            });

            return events;
        } catch (error) {
            logger.error('Error al obtener eventos:', error);
            throw error;
        }
    },

    async getEvent(id: string): Promise<Event> {
        try {
            if (!id) {
                throw new Error('ID de evento no válido');
            }

            logger.debug('Obteniendo evento:', { id });
            const response = await apiService.get<Event>(`/api/events/${id}`);

            if (!response.success) {
                throw new Error(response.message || 'Error al obtener evento');
            }

            // Log de la respuesta completa para depuración
            logger.debug('Respuesta completa del servidor:', {
                success: response.success,
                message: response.message,
                data: response.data
            });

            if (!response.data) {
                throw new Error('No se encontró el evento');
            }

            const event = response.data;

            // Procesar las condiciones
            const conditions: EventCondition[] = [];
            if (Array.isArray(event.conditions)) {
                conditions.push(...event.conditions.map(condition => ({
                    id: condition.id,
                    variable: condition.variable || '',
                    operator: condition.operator || 'EQUALS',
                    value: String(condition.value || ''),
                    value2: condition.value2 ? String(condition.value2) : '',
                    unit: condition.unit || '',
                    type: condition.type || event.type
                })));
            } else if (Array.isArray(event.data?.conditions)) {
                conditions.push(...event.data.conditions.map(condition => ({
                    variable: condition.variable || '',
                    operator: condition.operator || 'EQUALS',
                    value: String(condition.value || ''),
                    value2: condition.value2 ? String(condition.value2) : '',
                    unit: condition.unit || '',
                    type: condition.type || event.type
                })));
            }

            // Procesar los datos del evento para asegurar la estructura correcta
            const processedEvent: Event = {
                ...event,
                name: String(event.name || event.data?.name || 'Sin nombre'),
                description: String(event.description || event.displayData?.message || 'Sin descripción'),
                vehicles: Array.isArray(event.vehicles) ? event.vehicles : [],
                conditions: conditions,
                tipo: event.type || event.tipo || EventType.STABILITY,
                estado: event.status || event.estado || EventStatus.ACTIVE,
                isPredefined: Boolean(event.isPredefined || event.data?.isPredefined)
            };

            // Log detallado de la estructura de datos procesada
            logger.debug('Estructura de datos del evento procesada:', {
                id: processedEvent.id,
                name: processedEvent.name,
                description: processedEvent.description,
                status: processedEvent.status,
                type: processedEvent.type,
                estado: processedEvent.estado,
                tipo: processedEvent.tipo,
                isPredefined: processedEvent.isPredefined,
                conditions: processedEvent.conditions,
                vehicles: processedEvent.vehicles,
                data: processedEvent.data,
                displayData: processedEvent.displayData
            });

            return processedEvent;
        } catch (error) {
            logger.error('Error al obtener evento:', { error, id });
            throw error;
        }
    },

    async createEvent(event: CreateEventDTO, organizationId: string): Promise<Event> {
        try {
            if (!organizationId) {
                throw new Error('ID de organización no válido');
            }

            if (!event.vehicles || event.vehicles.length === 0) {
                throw new Error('Debe seleccionar al menos un vehículo');
            }

            if (!event.name || event.name.trim() === '') {
                throw new Error('El nombre del evento es requerido');
            }

            if (!event.description || event.description.trim() === '') {
                throw new Error('La descripción del evento es requerida');
            }

            logger.debug('Creando evento:', { event, organizationId });

            // Formatear el evento para el backend (solo campos planos, sin organization)
            const backendEvent = {
                nombre: event.name.trim(),
                descripcion: event.description.trim(),
                tipo: event.tipo,
                estado: event.estado,
                isPredefined: event.isPredefined || false,
                condiciones: event.conditions || [],
                variablesAMostrar: event.variablesAMostrar || [],
                vehiculos: event.vehicles,
                autoEvaluate: event.autoEvaluate || false,
                prioridad: event.prioridad || 3,
                severidad: event.severidad || 'WARNING',
                organizationId
            };

            logger.debug('Datos del evento para crear:', backendEvent);

            const response = await apiService.post<Event>('/api/eventos', backendEvent);

            if (!response.success || !response.data) {
                const errorMessage = response.message || 'Error al crear el evento';
                logger.error('Error en la respuesta del servidor:', {
                    error: errorMessage,
                    response: response.data
                });
                throw new Error(errorMessage);
            }

            return response.data;
        } catch (error) {
            logger.error('Error al crear evento:', error);
            throw error;
        }
    },

    async updateEvent(id: string, event: EventFormData): Promise<Event> {
        try {
            logger.debug('Actualizando evento:', { id, event });

            // Validar que el evento tenga al menos un vehículo seleccionado
            if (!event.vehicles || event.vehicles.length === 0) {
                throw new Error('Debe seleccionar al menos un vehículo');
            }

            // Validar que el evento tenga nombre y descripción
            if (!event.name?.trim() || !event.description?.trim()) {
                throw new Error('El nombre y la descripción son requeridos');
            }

            // Formatear los datos del evento para el backend
            const eventData = {
                type: event.type,
                status: event.status,
                data: {
                    name: event.name,
                    description: event.description,
                    isPredefined: event.isPredefined,
                    conditions: event.conditions || []
                },
                displayData: {
                    message: event.description
                },
                vehicleIds: event.vehicles
            };

            logger.debug('Datos formateados para actualización:', eventData);

            const response = await apiService.put<Event>(`/api/events/${id}`, eventData);
            logger.debug('Respuesta del servidor:', response.data);

            if (!response.data) {
                throw new Error('No se recibió respuesta del servidor');
            }

            // Procesar la respuesta para asegurar que tiene la estructura correcta
            const processedEvent: Event = {
                ...response.data,
                name: String(response.data.data?.name || response.data.name || ''),
                description: String(response.data.displayData?.message || response.data.description || ''),
                vehicles: response.data.vehicles || [],
                vehicleName: String(response.data.vehicleName || '')
            };

            logger.debug('Evento actualizado:', processedEvent);
            return processedEvent;
        } catch (error) {
            logger.error('Error al actualizar evento:', error);
            throw error;
        }
    },

    async getActiveEvents(vehicleId: string): Promise<Event[]> {
        try {
            logger.debug('Obteniendo eventos activos', { vehicleId });
            const response = await apiService.get<Event[]>(`/api/events/active/${vehicleId}`);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al obtener eventos activos');
            }

            return response.data;
        } catch (error) {
            logger.error('Error al obtener eventos activos:', error);
            throw error;
        }
    },

    async updateEventStatus(id: string, status: EventStatus): Promise<Event> {
        try {
            if (!id) {
                throw new Error('ID de evento no válido');
            }

            if (!status) {
                throw new Error('Estado de evento no válido');
            }

            logger.debug('Actualizando estado del evento', { id, status });
            const response = await apiService.put<Event>(`/api/events/${id}/status`, { status });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al actualizar estado del evento');
            }

            logger.debug('Estado del evento actualizado exitosamente:', { updatedEvent: response.data });
            return response.data;
        } catch (error) {
            logger.error('Error al actualizar estado del evento:', error);
            throw error;
        }
    },

    async evaluateEvent(id: string, data: Record<string, unknown>): Promise<{ triggered: boolean; conditions: { [key: string]: boolean } }> {
        try {
            logger.debug('Evaluando evento', { id, data });
            const response = await apiService.post<{ triggered: boolean; conditions: { [key: string]: boolean } }>(`/api/events/${id}/evaluate`, data);

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Error al evaluar evento');
            }

            logger.debug('Evento evaluado exitosamente', {
                id,
                triggered: response.data.triggered
            });

            return response.data;
        } catch (error) {
            logger.error('Error evaluando evento', {
                error,
                eventId: id,
                data,
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
            throw error;
        }
    },

    async deleteEvent(id: string): Promise<void> {
        try {
            logger.debug('Eliminando evento:', { id });
            const response = await apiService.delete<void>(`/api/events/${id}`);

            if (!response.success) {
                throw new Error(response.message || 'Error al eliminar el evento');
            }

            logger.debug('Evento eliminado exitosamente:', { id });
        } catch (error) {
            logger.error('Error al eliminar evento:', error);
            throw error;
        }
    },

    async deleteAllEvents(): Promise<void> {
        try {
            logger.debug('Eliminando todos los eventos');
            const response = await apiService.delete<void>('/api/events');

            if (!response.success) {
                throw new Error(response.message || 'Error al eliminar todos los eventos');
            }
        } catch (error) {
            logger.error('Error al eliminar todos los eventos:', error);
            throw error;
        }
    },

    async createTestEvent(): Promise<Event> {
        try {
            logger.debug('Creando evento de prueba...');

            const currentUser = authService.getCurrentUser();
            if (!currentUser?.organizationId) {
                throw new Error('Usuario no autenticado o sin organización');
            }

            const testEvent: CreateEventDTO = {
                name: `Evento de Prueba ${new Date().toISOString().slice(0, 19)}`,
                description: 'Evento creado automáticamente para pruebas',
                estado: EventStatus.ACTIVE,
                tipo: EventType.STABILITY,
                isPredefined: false,
                conditions: [
                    {
                        variable: 'roll',
                        operator: 'GREATER_THAN',
                        value: '15.0',
                        value2: '',
                        unit: 'degrees',
                        type: EventType.STABILITY
                    }
                ],
                vehicles: []
            };

            const response = await this.createEvent(testEvent, currentUser.organizationId);
            logger.debug('Evento de prueba creado exitosamente:', response);
            return response;
        } catch (error) {
            logger.error('Error creando evento de prueba:', error);
            throw error;
        }
    },

    async getEventExecutions(filters: any = {}): Promise<any[]> {
        try {
            logger.debug('Obteniendo ejecuciones de eventos con filtros:', filters);
            const response = await apiService.get('/api/eventos/executions', { params: filters });

            if (!response.success) {
                throw new Error(response.message || 'Error al obtener ejecuciones de eventos');
            }

            const executions = Array.isArray(response.data) ? response.data : [];
            logger.debug('Ejecuciones obtenidas exitosamente:', { count: executions.length });
            return executions;
        } catch (error) {
            logger.error('Error obteniendo ejecuciones de eventos:', error);
            throw error;
        }
    },

    async testAutoEvaluation(sessionId: string, vehicleId: string, testData: any): Promise<any> {
        try {
            logger.debug('Probando evaluación automática:', { sessionId, vehicleId, testData });

            // Llamar al endpoint real de evaluación
            const response = await apiService.post('/api/eventos/test-auto-evaluation', {
                sessionId,
                vehicleId,
                testData
            });

            if (!response.success) {
                throw new Error(response.message || 'Error en evaluación automática');
            }

            logger.debug('Evaluación automática completada:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error en evaluación automática:', error);
            throw error;
        }
    },

    async evaluateHistoricalSessions(): Promise<any> {
        try {
            logger.debug('Iniciando evaluación histórica de sesiones');

            const response = await apiService.post('/api/eventos/evaluate-historical', {});

            if (!response.success) {
                throw new Error(response.message || 'Error en evaluación histórica');
            }

            logger.debug('Evaluación histórica completada:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error en evaluación histórica:', error);
            throw error;
        }
    },

    async generateEventReport(eventId: string): Promise<any> {
        try {
            logger.debug('Generando informe PDF para evento:', { eventId });

            const response = await apiService.post(`/api/eventos/${eventId}/generate-report`, {});

            if (!response.success) {
                throw new Error(response.message || 'Error al generar informe PDF');
            }

            logger.debug('Informe PDF generado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Error generando informe PDF:', error);
            throw error;
        }
    }
};