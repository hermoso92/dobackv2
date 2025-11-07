import { apiService } from '../services/api';
import {
    Alert,
    GeofenceStats,
    HeatmapData,
    KPIData,
    PanelFilters,
    RealtimeEvent,
    SpeedStats,
    TimeStats,
    VehicleStats
} from '../types/panel';
import { logger } from '../utils/logger';

// API para el módulo Panel & KPIs
export class PanelAPI {
    /**
     * Obtiene KPIs numéricas con filtros
     */
    static async getKPIs(filters: PanelFilters = {}): Promise<KPIData> {
        try {
            const response = await apiService.get<KPIData>('/api/panel/kpis', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los KPIs');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo KPIs', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene datos de heatmap
     */
    static async getHeatmapData(
        type: 'speeding' | 'critical' | 'violations',
        filters: PanelFilters = {}
    ): Promise<HeatmapData> {
        try {
            const response = await apiService.get<HeatmapData>(`/api/panel/heatmap/${type}`, {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los datos de heatmap');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo datos de heatmap', { error, type, filters });
            throw error;
        }
    }

    /**
     * Obtiene alertas recientes
     */
    static async getAlerts(filters: PanelFilters = {}): Promise<Alert[]> {
        try {
            const response = await apiService.get<Alert[]>('/api/panel/alerts', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    severity: filters.severity,
                    eventType: filters.eventType,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las alertas');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo alertas', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene eventos en tiempo real
     */
    static async getRealtimeEvents(limit: number = 50): Promise<RealtimeEvent[]> {
        try {
            const response = await apiService.get<RealtimeEvent[]>('/api/panel/realtime', {
                params: { limit }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener los eventos en tiempo real');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo eventos en tiempo real', { error, limit });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas detalladas de vehículos
     */
    static async getVehicleStats(filters: PanelFilters = {}): Promise<VehicleStats[]> {
        try {
            const response = await apiService.get<VehicleStats[]>('/api/panel/vehicles/stats', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las estadísticas de vehículos');
            }

            return response.data || [];
        } catch (error) {
            logger.error('Error obteniendo estadísticas de vehículos', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de tiempo
     */
    static async getTimeStats(filters: PanelFilters = {}): Promise<TimeStats> {
        try {
            const response = await apiService.get<TimeStats>('/api/panel/time/stats', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las estadísticas de tiempo');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de tiempo', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de velocidad
     */
    static async getSpeedStats(filters: PanelFilters = {}): Promise<SpeedStats> {
        try {
            const response = await apiService.get<SpeedStats>('/api/panel/speed/stats', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las estadísticas de velocidad');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de velocidad', { error, filters });
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de geocercas
     */
    static async getGeofenceStats(filters: PanelFilters = {}): Promise<GeofenceStats> {
        try {
            const response = await apiService.get<GeofenceStats>('/api/panel/geofence/stats', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudieron obtener las estadísticas de geocercas');
            }

            return response.data!;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de geocercas', { error, filters });
            throw error;
        }
    }

    /**
     * Marca una alerta como leída
     */
    static async markAlertAsRead(alertId: string): Promise<void> {
        try {
            const response = await apiService.put(`/api/panel/alerts/${alertId}/read`);

            if (!response.success) {
                throw new Error(response.error || 'No se pudo marcar la alerta como leída');
            }
        } catch (error) {
            logger.error('Error marcando alerta como leída', { error, alertId });
            throw error;
        }
    }

    /**
     * Obtiene el resumen ejecutivo
     */
    static async getExecutiveSummary(filters: PanelFilters = {}): Promise<{
        summary: string;
        trends: Array<{
            metric: string;
            change: number;
            direction: 'up' | 'down' | 'stable';
            period: string;
        }>;
        recommendations: Array<{
            type: 'warning' | 'info' | 'success';
            message: string;
            action?: string;
        }>;
    }> {
        try {
            const response = await apiService.get('/api/panel/executive-summary', {
                params: {
                    from: filters.from,
                    to: filters.to,
                    vehicleId: filters.vehicleId,
                    organizationId: filters.organizationId
                }
            });

            if (!response.success) {
                throw new Error(response.error || 'No se pudo obtener el resumen ejecutivo');
            }

            return response.data! as any;
        } catch (error) {
            logger.error('Error obteniendo resumen ejecutivo', { error, filters });
            throw error;
        }
    }
}
