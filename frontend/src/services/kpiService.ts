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
    force?: boolean; // fuerza recálculo en servidor (invalida cache)
}

class KPIService {
    /**
     * Obtiene resumen de estados operativos (claves 0-5)
     */
    async getStatesSummary(filters?: KPIFilters): Promise<StatesSummary> {
        try {
            const params = this.buildQueryParams(filters);
            const response = await apiService.get<StatesSummary>(
                `/api/kpis/states${params}`
            );

            if ((response as any).success !== undefined) {
                // Soportar ApiResponse envolviendo data
                const resp = response as unknown as { success: boolean; data: StatesSummary };
                if (resp.success && resp.data) return resp.data;
            } else {
                // Soportar retorno directo de StatesSummary
                return response as unknown as StatesSummary;
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
            const response = await apiService.get<ActivityMetrics>(
                `/api/kpis/activity${params}`
            );

            if ((response as any).success !== undefined) {
                const resp = response as unknown as { success: boolean; data: ActivityMetrics };
                if (resp.success && resp.data) return resp.data;
            } else {
                return response as unknown as ActivityMetrics;
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
            const response = await apiService.get<StabilityMetrics>(
                `/api/kpis/stability${params}`
            );

            if ((response as any).success !== undefined) {
                const resp = response as unknown as { success: boolean; data: StabilityMetrics };
                if (resp.success && resp.data) return resp.data;
            } else {
                return response as unknown as StabilityMetrics;
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
            const response = await apiService.get<CompleteSummary>(
                `/api/kpis/summary${params}`
            );

            if ((response as any).success !== undefined) {
                const resp = response as unknown as { success: boolean; data: CompleteSummary };
                if (resp.success && resp.data) return resp.data;
            } else {
                return response as unknown as CompleteSummary;
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
    private buildQueryParams(f?: KPIFilters): string {
        if (!f) return '';

        const params = new URLSearchParams();

        if (f.from) {
            params.append('from', f.from);
        }

        if (f.to) {
            params.append('to', f.to);
        }

        if (f.vehicleIds && f.vehicleIds.length > 0) {
            f.vehicleIds.forEach(id => {
                params.append('vehicleIds[]', id);
            });
        }

        if (f.force) {
            params.append('force', 'true');
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
    async getMaxSpeed(): Promise<number> {
        // TODO: Implementar cuando tengamos endpoint de velocidad máxima
        return 0;
    }
}

export const kpiService = new KPIService();

