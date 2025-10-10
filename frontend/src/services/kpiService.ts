import { logger } from '../utils/logger';
import { apiService } from './api';

export interface StateInterval {
    key: number;
    name: string;
    duration_seconds: number;
    duration_formatted: string;
    count: number;
}

export interface StatesSummary {
    states: StateInterval[];
    total_time_seconds: number;
    total_time_formatted: string;
    time_outside_station: number;
    time_outside_formatted: string;
}

export interface ActivityMetrics {
    km_total: number;
    driving_hours: number;
    driving_hours_formatted: string;
    rotativo_on_seconds: number;
    rotativo_on_percentage: number;
    rotativo_on_formatted: string;
    emergency_departures: number;
}

export interface StabilityMetrics {
    total_incidents: number;
    critical: number;
    moderate: number;
    light: number;
    por_tipo?: Record<string, number>; // Eventos por tipo
}

export interface QualityMetrics {
    indice_promedio: number;
    calificacion: string;
    estrellas: string;
    total_muestras: number;
}

export interface CompleteSummary {
    states: StatesSummary;
    activity: ActivityMetrics;
    stability: StabilityMetrics;
    quality?: QualityMetrics; // Índice de estabilidad
}

export interface KPIFilters {
    from?: string;  // YYYY-MM-DD
    to?: string;    // YYYY-MM-DD
    vehicleIds?: string[];
}

class KPIService {
    /**
     * Obtiene resumen de estados operativos (claves 0-5)
     */
    async getStatesSummary(filters?: KPIFilters): Promise<StatesSummary> {
        try {
            const params = this.buildQueryParams(filters);
            const response = await apiService.get<{ success: boolean; data: StatesSummary }>(
                `/api/kpis/states${params}`
            );

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Invalid response from server');
        } catch (error) {
            logger.error('Error obteniendo resumen de estados', { error });
            return this.getEmptyStatesSummary();
        }
    }

    /**
     * Obtiene métricas de actividad (km, horas, rotativo, salidas)
     */
    async getActivityMetrics(filters?: KPIFilters): Promise<ActivityMetrics> {
        try {
            const params = this.buildQueryParams(filters);
            const response = await apiService.get<{ success: boolean; data: ActivityMetrics }>(
                `/api/kpis/activity${params}`
            );

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Invalid response from server');
        } catch (error) {
            logger.error('Error obteniendo métricas de actividad', { error });
            return this.getEmptyActivityMetrics();
        }
    }

    /**
     * Obtiene métricas de estabilidad (incidencias)
     */
    async getStabilityMetrics(filters?: KPIFilters): Promise<StabilityMetrics> {
        try {
            const params = this.buildQueryParams(filters);
            const response = await apiService.get<{ success: boolean; data: StabilityMetrics }>(
                `/api/kpis/stability${params}`
            );

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Invalid response from server');
        } catch (error) {
            logger.error('Error obteniendo métricas de estabilidad', { error });
            return this.getEmptyStabilityMetrics();
        }
    }

    /**
     * Obtiene resumen completo con todos los KPIs
     */
    async getCompleteSummary(filters?: KPIFilters): Promise<CompleteSummary> {
        try {
            const params = this.buildQueryParams(filters);
            const response = await apiService.get<{ success: boolean; data: CompleteSummary }>(
                `/api/kpis/summary${params}`
            );

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error('Invalid response from server');
        } catch (error) {
            logger.error('Error obteniendo resumen completo', { error });
            return {
                states: this.getEmptyStatesSummary(),
                activity: this.getEmptyActivityMetrics(),
                stability: this.getEmptyStabilityMetrics()
            };
        }
    }

    /**
     * Construye query params para los filtros
     */
    private buildQueryParams(filters?: KPIFilters): string {
        if (!filters) return '';

        const params = new URLSearchParams();

        if (filters.from) {
            params.append('from', filters.from);
        }

        if (filters.to) {
            params.append('to', filters.to);
        }

        if (filters.vehicleIds && filters.vehicleIds.length > 0) {
            filters.vehicleIds.forEach(id => {
                params.append('vehicleIds[]', id);
            });
        }

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Retorna estructura vacía de estados
     */
    private getEmptyStatesSummary(): StatesSummary {
        const stateNames = [
            'Taller',
            'Operativo en Parque',
            'Salida en Emergencia',
            'En Siniestro',
            'Fin de Actuación',
            'Regreso al Parque'
        ];

        return {
            states: stateNames.map((name, index) => ({
                key: index,
                name,
                duration_seconds: 0,
                duration_formatted: '00:00:00',
                count: 0
            })),
            total_time_seconds: 0,
            total_time_formatted: '00:00:00',
            time_outside_station: 0,
            time_outside_formatted: '00:00:00'
        };
    }

    /**
     * Retorna estructura vacía de actividad
     */
    private getEmptyActivityMetrics(): ActivityMetrics {
        return {
            km_total: 0,
            driving_hours: 0,
            driving_hours_formatted: '00:00:00',
            rotativo_on_seconds: 0,
            rotativo_on_percentage: 0,
            rotativo_on_formatted: '00:00:00',
            emergency_departures: 0
        };
    }

    /**
     * Retorna estructura vacía de estabilidad
     */
    private getEmptyStabilityMetrics(): StabilityMetrics {
        return {
            total_incidents: 0,
            critical: 0,
            moderate: 0,
            light: 0
        };
    }

    /**
     * Formatea segundos a formato legible (HH:MM)
     */
    formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Calcula velocidad promedio
     */
    calculateAverageSpeed(km: number, hours: number): number {
        if (hours === 0) return 0;
        return Math.round(km / hours);
    }

    /**
     * Calcula velocidad máxima desde datos GPS (pendiente implementar)
     */
    async getMaxSpeed(filters?: KPIFilters): Promise<number> {
        // TODO: Implementar cuando tengamos endpoint de velocidad máxima
        return 0;
    }
}

export const kpiService = new KPIService();

