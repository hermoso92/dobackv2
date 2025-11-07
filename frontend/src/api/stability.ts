import { apiService } from '../services/api';
import {
    StabilityApiResponse,
    StabilityComparisonDTO,
    StabilityComparisonParams,
    StabilityExportOptions,
    StabilityFilters,
    StabilitySessionDTO,
    StabilitySessionParams
} from '../types/stability';
import { logger } from '../utils/logger';

export class StabilityAPI {
    // Obtener sesiones de estabilidad
    static async getSessions(params: StabilitySessionParams = {}): Promise<StabilitySessionDTO[]> {
        try {
            const response = await apiService.get<StabilityApiResponse<StabilitySessionDTO[]>>(
                '/api/stability/sessions',
                { params }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo sesiones de estabilidad');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo sesiones de estabilidad', { error, params });
            throw error;
        }
    }

    // Obtener sesión específica
    static async getSession(sessionId: string): Promise<StabilitySessionDTO> {
        try {
            const response = await apiService.get<StabilityApiResponse<StabilitySessionDTO>>(
                `/api/stability/sessions/${sessionId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo sesión de estabilidad');
            }

            if (!response.data.data) {
                throw new Error('Sesión no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo sesión de estabilidad', { error, sessionId });
            throw error;
        }
    }

    // Obtener eventos de una sesión
    static async getSessionEvents(sessionId: string, filters?: StabilityFilters): Promise<any[]> {
        try {
            const response = await apiService.get<StabilityApiResponse<any[]>>(
                `/api/stability/sessions/${sessionId}/events`,
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo eventos de sesión');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo eventos de sesión', { error, sessionId, filters });
            throw error;
        }
    }

    // Comparar sesiones
    static async compareSessions(params: StabilityComparisonParams): Promise<StabilityComparisonDTO> {
        try {
            const response = await apiService.post<StabilityApiResponse<StabilityComparisonDTO>>(
                '/api/stability/compare',
                params
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error comparando sesiones');
            }

            if (!response.data.data) {
                throw new Error('Error en la comparación de sesiones');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error comparando sesiones', { error, params });
            throw error;
        }
    }

    // Obtener métricas de estabilidad
    static async getStabilityMetrics(filters: StabilityFilters = {}): Promise<any> {
        try {
            const response = await apiService.get<StabilityApiResponse<any>>(
                '/api/stability/metrics',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo métricas de estabilidad');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo métricas de estabilidad', { error, filters });
            throw error;
        }
    }

    // Obtener estadísticas de estabilidad
    static async getStabilityStats(filters: StabilityFilters = {}): Promise<any> {
        try {
            const response = await apiService.get<StabilityApiResponse<any>>(
                '/api/stability/stats',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estadísticas de estabilidad');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de estabilidad', { error, filters });
            throw error;
        }
    }

    // Exportar datos de estabilidad
    static async exportStabilityData(sessionId: string, options: StabilityExportOptions): Promise<Blob> {
        try {
            const response = await apiService.post(
                `/api/stability/sessions/${sessionId}/export`,
                options,
                { responseType: 'blob' }
            );

            return response.data as Blob;
        } catch (error) {
            logger.error('Error exportando datos de estabilidad', { error, sessionId, options });
            throw error;
        }
    }

    // Obtener comparaciones guardadas
    static async getComparisons(params: { limit?: number; offset?: number } = {}): Promise<StabilityComparisonDTO[]> {
        try {
            const response = await apiService.get<StabilityApiResponse<StabilityComparisonDTO[]>>(
                '/api/stability/comparisons',
                { params }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo comparaciones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo comparaciones', { error, params });
            throw error;
        }
    }

    // Guardar comparación
    static async saveComparison(comparison: Omit<StabilityComparisonDTO, 'id' | 'createdAt' | 'version'>): Promise<StabilityComparisonDTO> {
        try {
            const response = await apiService.post<StabilityApiResponse<StabilityComparisonDTO>>(
                '/api/stability/comparisons',
                comparison
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error guardando comparación');
            }

            if (!response.data.data) {
                throw new Error('Error al guardar la comparación');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error guardando comparación', { error, comparison });
            throw error;
        }
    }

    // Eliminar comparación
    static async deleteComparison(comparisonId: string): Promise<void> {
        try {
            const response = await apiService.delete<StabilityApiResponse<void>>(
                `/api/stability/comparisons/${comparisonId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error eliminando comparación');
            }
        } catch (error) {
            logger.error('Error eliminando comparación', { error, comparisonId });
            throw error;
        }
    }

    // Obtener vehículos con datos de estabilidad
    static async getVehiclesWithStability(): Promise<any[]> {
        try {
            const response = await apiService.get<StabilityApiResponse<any[]>>(
                '/api/stability/vehicles'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo vehículos');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo vehículos con estabilidad', { error });
            throw error;
        }
    }

    // Obtener datos en tiempo real de una sesión
    static async getRealtimeData(sessionId: string): Promise<any> {
        try {
            const response = await apiService.get<StabilityApiResponse<any>>(
                `/api/stability/sessions/${sessionId}/realtime`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo datos en tiempo real');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo datos en tiempo real', { error, sessionId });
            throw error;
        }
    }

    // Suscribirse a eventos en tiempo real
    static subscribeToRealtimeEvents(sessionId: string, callback: (event: any) => void): () => void {
        // TODO: Implementar WebSocket para eventos en tiempo real
        logger.info('Suscribiéndose a eventos en tiempo real', { sessionId });

        // Por ahora, retornar función de cleanup vacía
        return () => {
            logger.info('Desuscribiéndose de eventos en tiempo real', { sessionId });
        };
    }
}
