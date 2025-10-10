/**
 * 🔧 SERVICIO DE OPERACIONES
 * Gestión de eventos críticos, alertas y mantenimiento con datos reales
 */

import { logger } from '../utils/logger';
import { apiService } from './api';

export interface CriticalEvent {
    id: string;
    sessionId: string;
    timestamp: string;
    lat: number;
    lon: number;
    type: string;
    level: 'critico' | 'peligroso' | 'moderado' | 'leve';
    perc: number;
    tipos: string[];
    valores: {
        si?: number;
        roll?: number;
        ay?: number;
        yaw?: number;
    };
    can?: {
        engineRPM?: number;
        vehicleSpeed?: number;
        rotativo?: boolean;
    };
    vehicle: {
        id: string;
        name: string;
        dobackId: string;
    };
    vehicleId: string;
    vehicleName: string;
    location: {
        lat: number;
        lng: number;
    };
    description: string;
}

export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    vehicleId: string;
    vehicleName: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    data: any;
}

export interface MaintenanceTask {
    id: string;
    vehicleId: string;
    vehicleName: string;
    type: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
    scheduledDate: string;
    completedDate?: string;
    assignedTo: string;
    department: string;
    cost?: number;
    parts?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OperationsStats {
    events: {
        total: number;
        today: number;
        last30Days: number;
    };
    alerts: {
        total: number;
        active: number;
    };
    maintenance: {
        active: number;
        completed: number;
        total: number;
    };
}

export class OperationsService {
    /**
     * Obtiene eventos críticos reales de la base de datos
     */
    async getCriticalEvents(params?: {
        sessionId?: string;
        severity?: string;
        limit?: number;
        offset?: number;
        vehicleId?: string;
    }): Promise<{
        events: CriticalEvent[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
        stats: {
            total: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    }> {
        try {
            logger.info('[OperationsService] Obteniendo eventos críticos', params);

            const queryParams = new URLSearchParams();
            if (params?.sessionId) queryParams.append('sessionId', params.sessionId);
            if (params?.severity) queryParams.append('severity', params.severity);
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());
            if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);

            const response = await apiService.get<any>(
                `/api/operations/critical-events?${queryParams.toString()}`
            );

            if (!response.success) {
                throw new Error(response.error || 'Error obteniendo eventos críticos');
            }

            logger.info('[OperationsService] Eventos críticos obtenidos', {
                count: response.data.events.length,
                total: response.data.pagination.total
            });

            return response.data;
        } catch (error) {
            logger.error('[OperationsService] Error obteniendo eventos críticos:', error);
            throw error;
        }
    }

    /**
     * Obtiene alertas basadas en eventos críticos
     */
    async getAlerts(params?: {
        status?: string;
        severity?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        alerts: Alert[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
        stats: {
            total: number;
            active: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
    }> {
        try {
            logger.info('[OperationsService] Obteniendo alertas', params);

            const queryParams = new URLSearchParams();
            if (params?.status) queryParams.append('status', params.status);
            if (params?.severity) queryParams.append('severity', params.severity);
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());

            const response = await apiService.get<any>(
                `/api/operations/alerts?${queryParams.toString()}`
            );

            if (!response.success) {
                throw new Error(response.error || 'Error obteniendo alertas');
            }

            logger.info('[OperationsService] Alertas obtenidas', {
                count: response.data.alerts.length,
                total: response.data.pagination.total
            });

            return response.data;
        } catch (error) {
            logger.error('[OperationsService] Error obteniendo alertas:', error);
            throw error;
        }
    }

    /**
     * Obtiene registros de mantenimiento reales
     */
    async getMaintenanceTasks(params?: {
        vehicleId?: string;
        type?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        records: MaintenanceTask[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        };
        stats: {
            total: number;
            scheduled: number;
            in_progress: number;
            completed: number;
            cancelled: number;
            totalCost: number;
        };
    }> {
        try {
            logger.info('[OperationsService] Obteniendo tareas de mantenimiento', params);

            const queryParams = new URLSearchParams();
            if (params?.vehicleId) queryParams.append('vehicleId', params.vehicleId);
            if (params?.type) queryParams.append('type', params.type);
            if (params?.status) queryParams.append('status', params.status);
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.offset) queryParams.append('offset', params.offset.toString());

            const response = await apiService.get<any>(
                `/api/operations/maintenance?${queryParams.toString()}`
            );

            if (!response.success) {
                throw new Error(response.error || 'Error obteniendo mantenimiento');
            }

            logger.info('[OperationsService] Tareas de mantenimiento obtenidas', {
                count: response.data.records.length,
                total: response.data.pagination.total
            });

            return response.data;
        } catch (error) {
            logger.error('[OperationsService] Error obteniendo mantenimiento:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas generales de operaciones
     */
    async getStats(): Promise<OperationsStats> {
        try {
            logger.info('[OperationsService] Obteniendo estadísticas de operaciones');

            const response = await apiService.get<any>('/api/operations/stats');

            if (!response.success) {
                throw new Error(response.error || 'Error obteniendo estadísticas');
            }

            logger.info('[OperationsService] Estadísticas obtenidas', response.data);

            return response.data as OperationsStats;
        } catch (error) {
            logger.error('[OperationsService] Error obteniendo estadísticas:', error);
            throw error;
        }
    }
}

// Exportar instancia única del servicio
export const operationsService = new OperationsService();

