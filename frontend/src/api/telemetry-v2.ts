import { apiService } from '../services/api';
import {
    EventDTO,
    GeofenceDTO,
    TelemetryFilters,
    TelemetryPointDTO,
    TelemetryPointsParams,
    TelemetrySessionDTO,
    TelemetrySessionParams
} from '../types/telemetry';
import { logger } from '../utils/logger';

// API v2 para Telemetría según especificación
export class TelemetryAPI {
    /**
     * Obtiene sesiones de telemetría con filtros
     */
    static async getSessions(params: TelemetrySessionParams = {}): Promise<TelemetrySessionDTO[]> {
        try {
            const response = await apiService.get<TelemetrySessionDTO[]>('/api/telemetry-v2/sessions', {
                params: {
                    from: params.from,
                    to: params.to,
                    vehicleId: params.vehicleId,
                    page: params.page || 1,
                    limit: params.limit || 20
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las sesiones');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo sesiones de telemetría', { error, params });
            throw error;
        }
    }

    /**
     * Obtiene puntos de una sesión con opción de downsample
     */
    static async getSessionPoints(
        sessionId: string,
        params: TelemetryPointsParams = {}
    ): Promise<TelemetryPointDTO[]> {
        try {
            const response = await apiService.get<TelemetryPointDTO[]>(
                `/api/telemetry-v2/sessions/${sessionId}/points`,
                {
                    params: {
                        downsample: params.downsample || '10s'
                    }
                }
            );

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los puntos');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo puntos de sesión', { error, sessionId, params });
            throw error;
        }
    }

    /**
     * Obtiene eventos con filtros
     */
    static async getEvents(filters: TelemetryFilters = {}): Promise<EventDTO[]> {
        try {
            const response = await apiService.get<EventDTO[]>('/api/telemetry-v2/events', {
                params: {
                    sessionId: filters.sessionId,
                    type: filters.type,
                    severity: filters.severity,
                    geofenceId: filters.geofenceId,
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los eventos');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo eventos', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene geocercas de Radar
     */
    static async getGeofences(): Promise<GeofenceDTO[]> {
        try {
            const response = await apiService.get<GeofenceDTO[]>('/api/telemetry-v2/radar/geofences');

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las geocercas');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo geocercas', { error });
            throw error;
        }
    }

    /**
     * Crea una nueva geocerca
     */
    static async createGeofence(geofence: Omit<GeofenceDTO, 'id' | 'version'>): Promise<GeofenceDTO> {
        try {
            const response = await apiService.post<GeofenceDTO>('/api/radar/geofences', geofence);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo crear la geocerca');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error creando geocerca', { error, geofence });
            throw error;
        }
    }

    /**
     * Actualiza una geocerca existente
     */
    static async updateGeofence(id: string, geofence: Partial<GeofenceDTO>): Promise<GeofenceDTO> {
        try {
            const response = await apiService.put<GeofenceDTO>(`/api/radar/geofences/${id}`, geofence);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo actualizar la geocerca');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error actualizando geocerca', { error, id, geofence });
            throw error;
        }
    }

    /**
     * Elimina una geocerca
     */
    static async deleteGeofence(id: string): Promise<void> {
        try {
            const response = await apiService.delete(`/api/radar/geofences/${id}`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo eliminar la geocerca');
            }
        } catch (error) {
            logger.error('Error eliminando geocerca', { error, id });
            throw error;
        }
    }

    /**
     * Procesa webhook de Radar
     */
    static async processRadarWebhook(payload: unknown): Promise<EventDTO> {
        try {
            const response = await apiService.post<EventDTO>('/api/radar/webhook', payload);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo procesar el webhook');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error procesando webhook de Radar', { error, payload });
            throw error;
        }
    }

    /**
     * Obtiene tiles de TomTom (proxy)
     */
    static async getTomTomTiles(x: number, y: number, z: number, style: string = 'basic-main'): Promise<Blob> {
        try {
            const response = await fetch(`/api/tomtom/tiles/${style}/${z}/${x}/${y}`);

            if (!response.ok) {
                throw new Error(`Error obteniendo tile: ${response.status}`);
            }

            return await response.blob();
        } catch (error) {
            logger.error('Error obteniendo tiles de TomTom', { error, x, y, z, style });
            throw error;
        }
    }

    /**
     * Exporta datos a CSV
     */
    static async exportToCSV(
        sessionId: string,
        options: {
            includePoints?: boolean;
            includeEvents?: boolean;
            dateRange?: { from: string; to: string };
        } = {}
    ): Promise<Blob> {
        try {
            const response = await apiService.post<Blob>(
                `/api/telemetry-v2/sessions/${sessionId}/export/csv`,
                options,
                { responseType: 'blob' }
            );

            if (!response.success) {
                throw new Error(response.error || 'No se pudo exportar a CSV');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error exportando a CSV', { error, sessionId, options });
            throw error;
        }
    }

    /**
     * Exporta datos a PDF
     */
    static async exportToPDF(
        sessionId: string,
        options: {
            includeHeatmap?: boolean;
            includeEvents?: boolean;
            includeKPIs?: boolean;
        } = {}
    ): Promise<Blob> {
        try {
            const response = await apiService.post<Blob>(
                `/api/telemetry-v2/sessions/${sessionId}/export/pdf`,
                options,
                { responseType: 'blob' }
            );

            if (!response.success) {
                throw new Error(response.error || 'No se pudo exportar a PDF');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error exportando a PDF', { error, sessionId, options });
            throw error;
        }
    }
}
