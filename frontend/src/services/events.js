import { logger } from '../utils/logger.js';
import { apiService } from './api.js';

export const eventService = {
    async getEvents(filters = {}) {
        try {
            logger.debug('Obteniendo eventos con filtros:', filters);
            const response = await apiService.get('/api/eventos', { params: filters });
            
            if (response.success && response.data) {
                logger.debug('Eventos obtenidos exitosamente:', { count: response.data.length });
                return response.data;
            } else {
                logger.error('Error en respuesta de eventos:', response);
                throw new Error(response.message || 'Error al obtener eventos');
            }
        } catch (error) {
            logger.error('Error obteniendo eventos:', error);
            throw error;
        }
    },

    async createEvent(eventData, organizationId) {
        try {
            logger.debug('Creando evento:', eventData);
            
            // Obtener organizationId del usuario autenticado si no se proporciona
            let finalOrganizationId = organizationId;
            if (!finalOrganizationId) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        finalOrganizationId = payload.organizationId;
                    } catch (e) {
                        logger.error('Error al obtener organizationId del token:', e);
                    }
                }
            }
            
            if (!finalOrganizationId) {
                throw new Error('No se pudo obtener el ID de la organización');
            }
            
            // Mapear campos del frontend al formato del backend
            const mappedData = {
                nombre: eventData.name,
                tipo: eventData.tipo === 'STABILITY' ? 'ESTABILIDAD' : 'TELEMETRIA',
                descripcion: eventData.description,
                severidad: 'WARNING',
                prioridad: 3,
                condiciones: eventData.conditions || [],
                variablesAMostrar: ['roll', 'pitch', 'yaw'],
                vehiculos: eventData.vehicles || [],
                autoEvaluate: eventData.autoEvaluate || false,
                organizationId: finalOrganizationId
            };
            
            const response = await apiService.post('/api/eventos', mappedData);
            
            if (response.success && response.data) {
                logger.debug('Evento creado exitosamente:', response.data);
                return response.data;
            } else {
                logger.error('Error en respuesta de creación:', response);
                throw new Error(response.message || 'Error al crear evento');
            }
        } catch (error) {
            logger.error('Error creando evento:', error);
            throw error;
        }
    },

    async updateEvent(id, eventData) {
        try {
            logger.debug('Actualizando evento:', { id, eventData });
            const mappedData = {
                nombre: eventData.name,
                tipo: eventData.tipo === 'STABILITY' ? 'ESTABILIDAD' : 'TELEMETRIA',
                descripcion: eventData.description,
                severidad: 'WARNING',
                prioridad: 3,
                condiciones: eventData.conditions || [],
                variablesAMostrar: ['roll', 'pitch', 'yaw'],
                vehiculos: eventData.vehicles || [],
                autoEvaluate: eventData.autoEvaluate || false
            };
            
            const response = await apiService.put(`/api/eventos/${id}`, mappedData);
            
            if (response.success && response.data) {
                logger.debug('Evento actualizado exitosamente:', response.data);
                return response.data;
            } else {
                logger.error('Error en respuesta de actualización:', response);
                throw new Error(response.message || 'Error al actualizar evento');
            }
        } catch (error) {
            logger.error('Error actualizando evento:', error);
            throw error;
        }
    },

    async deleteEvent(id) {
        try {
            logger.debug('Eliminando evento:', { id });
            const response = await apiService.delete(`/api/eventos/${id}`);
            
            if (response.success) {
                logger.debug('Evento eliminado exitosamente');
                return true;
            } else {
                logger.error('Error en respuesta de eliminación:', response);
                throw new Error(response.message || 'Error al eliminar evento');
            }
        } catch (error) {
            logger.error('Error eliminando evento:', error);
            throw error;
        }
    },

    async deleteAllEvents() {
        try {
            logger.debug('Eliminando todos los eventos');
            logger.warn('Eliminación masiva no disponible en API actual');
            return true;
        } catch (error) {
            logger.error('Error eliminando todos los eventos:', error);
            throw error;
        }
    },

    async evaluateEvent(eventId, data) {
        try {
            logger.debug('Evaluando evento:', { eventId, data });
            const response = await apiService.post(`/api/eventos/evaluar/${eventId}`, { datos: data });
            
            if (response.success && response.data) {
                logger.debug('Evento evaluado exitosamente:', response.data);
                return response.data;
            } else {
                logger.error('Error en respuesta de evaluación:', response);
                throw new Error(response.message || 'Error al evaluar evento');
            }
        } catch (error) {
            logger.error('Error evaluando evento:', error);
            throw error;
        }
    },

    async getEventExecutions(filters = {}) {
        try {
            logger.debug('Obteniendo ejecuciones de eventos con filtros:', filters);
            const response = await apiService.get('/api/eventos/executions', { params: filters });
            
            if (response.success && response.data) {
                logger.debug('Ejecuciones obtenidas exitosamente:', { count: response.data.length });
                return response.data;
            } else {
                logger.error('Error en respuesta de ejecuciones:', response);
                throw new Error(response.message || 'Error al obtener ejecuciones de eventos');
            }
        } catch (error) {
            logger.error('Error obteniendo ejecuciones de eventos:', error);
            throw error;
        }
    },

    async testAutoEvaluation(sessionId, vehicleId, testData) {
        try {
            logger.debug('Probando evaluación automática:', { sessionId, vehicleId, testData });
            logger.warn('Evaluación automática simulada - implementar en backend');
            return {
                evaluated: true,
                triggeredEvents: [],
                testData: testData,
                message: 'Evaluación automática no implementada aún'
            };
        } catch (error) {
            logger.error('Error en evaluación automática:', error);
            throw error;
        }
    },

    async getEvent(id) {
        try {
            logger.debug('Obteniendo evento por ID:', id);
            const response = await apiService.get(`/api/eventos/${id}`);
            if (response.success && response.data) {
                logger.debug('Evento obtenido exitosamente:', response.data);
                return response.data;
            } else {
                logger.error('Error en respuesta de evento:', response);
                throw new Error(response.message || 'Error al obtener evento');
            }
        } catch (error) {
            logger.error('Error obteniendo evento:', error);
            throw error;
        }
    }
}; 