import { apiService } from '../services/api';
import {
    AlertDTO,
    HealthCheckDTO,
    LogEntryDTO,
    MetricDTO,
    ObservabilityApiResponse,
    ObservabilityFilters,
    ObservabilitySettings,
    ObservabilityStats,
    PerformanceMetricsDTO,
    SystemHealthDTO,
    SystemMetricsDTO,
    TestResultDTO,
    TestSuiteDTO
} from '../types/observability';
import { logger } from '../utils/logger';

export class ObservabilityAPI {
    // Gestión de logs
    static async getLogs(filters: ObservabilityFilters = {}): Promise<LogEntryDTO[]> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<LogEntryDTO[]>>(
                '/api/observability/logs',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo logs');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo logs', { error, filters });
            throw error;
        }
    }

    static async getLog(logId: string): Promise<LogEntryDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<LogEntryDTO>>(
                `/api/observability/logs/${logId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo log');
            }

            if (!response.data.data) {
                throw new Error('Log no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo log', { error, logId });
            throw error;
        }
    }

    // Gestión de métricas
    static async getMetrics(filters: any = {}): Promise<MetricDTO[]> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<MetricDTO[]>>(
                '/api/observability/metrics',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo métricas');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo métricas', { error, filters });
            throw error;
        }
    }

    static async getSystemMetrics(): Promise<SystemMetricsDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<SystemMetricsDTO>>(
                '/api/observability/metrics/system'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo métricas del sistema');
            }

            if (!response.data.data) {
                throw new Error('Métricas del sistema no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo métricas del sistema', { error });
            throw error;
        }
    }

    static async getPerformanceMetrics(): Promise<PerformanceMetricsDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<PerformanceMetricsDTO>>(
                '/api/observability/metrics/performance'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo métricas de rendimiento');
            }

            if (!response.data.data) {
                throw new Error('Métricas de rendimiento no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo métricas de rendimiento', { error });
            throw error;
        }
    }

    // Health checks
    static async getHealth(): Promise<SystemHealthDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<SystemHealthDTO>>(
                '/api/observability/health'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estado de salud');
            }

            if (!response.data.data) {
                throw new Error('Estado de salud no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estado de salud', { error });
            throw error;
        }
    }

    static async getHealthCheck(checkName: string): Promise<HealthCheckDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<HealthCheckDTO>>(
                `/api/observability/health/${checkName}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo health check');
            }

            if (!response.data.data) {
                throw new Error('Health check no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo health check', { error, checkName });
            throw error;
        }
    }

    // Gestión de alertas
    static async getAlerts(filters: any = {}): Promise<AlertDTO[]> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<AlertDTO[]>>(
                '/api/observability/alerts',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo alertas');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo alertas', { error, filters });
            throw error;
        }
    }

    static async getAlert(alertId: string): Promise<AlertDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<AlertDTO>>(
                `/api/observability/alerts/${alertId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo alerta');
            }

            if (!response.data.data) {
                throw new Error('Alerta no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo alerta', { error, alertId });
            throw error;
        }
    }

    static async acknowledgeAlert(alertId: string, message?: string): Promise<AlertDTO> {
        try {
            const response = await apiService.post<ObservabilityApiResponse<AlertDTO>>(
                `/api/observability/alerts/${alertId}/acknowledge`,
                { message }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error reconociendo alerta');
            }

            if (!response.data.data) {
                throw new Error('Error al reconocer la alerta');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error reconociendo alerta', { error, alertId, message });
            throw error;
        }
    }

    static async resolveAlert(alertId: string, message?: string): Promise<AlertDTO> {
        try {
            const response = await apiService.post<ObservabilityApiResponse<AlertDTO>>(
                `/api/observability/alerts/${alertId}/resolve`,
                { message }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error resolviendo alerta');
            }

            if (!response.data.data) {
                throw new Error('Error al resolver la alerta');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error resolviendo alerta', { error, alertId, message });
            throw error;
        }
    }

    // Gestión de tests
    static async getTestSuites(): Promise<TestSuiteDTO[]> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<TestSuiteDTO[]>>(
                '/api/observability/tests/suites'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo suites de tests');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo suites de tests', { error });
            throw error;
        }
    }

    static async getTestSuite(suiteId: string): Promise<TestSuiteDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<TestSuiteDTO>>(
                `/api/observability/tests/suites/${suiteId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo suite de tests');
            }

            if (!response.data.data) {
                throw new Error('Suite de tests no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo suite de tests', { error, suiteId });
            throw error;
        }
    }

    static async runTestSuite(suiteType: 'unit' | 'integration' | 'e2e' | 'performance'): Promise<TestSuiteDTO> {
        try {
            const response = await apiService.post<ObservabilityApiResponse<TestSuiteDTO>>(
                '/api/observability/tests/run',
                { type: suiteType }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error ejecutando suite de tests');
            }

            if (!response.data.data) {
                throw new Error('Error al ejecutar la suite de tests');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error ejecutando suite de tests', { error, suiteType });
            throw error;
        }
    }

    static async getTestResult(testId: string): Promise<TestResultDTO> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<TestResultDTO>>(
                `/api/observability/tests/${testId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo resultado de test');
            }

            if (!response.data.data) {
                throw new Error('Resultado de test no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo resultado de test', { error, testId });
            throw error;
        }
    }

    // Estadísticas de observabilidad
    static async getObservabilityStats(): Promise<ObservabilityStats> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<ObservabilityStats>>(
                '/api/observability/stats'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estadísticas de observabilidad');
            }

            if (!response.data.data) {
                throw new Error('Estadísticas no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de observabilidad', { error });
            throw error;
        }
    }

    // Configuración de observabilidad
    static async getObservabilitySettings(): Promise<ObservabilitySettings> {
        try {
            const response = await apiService.get<ObservabilityApiResponse<ObservabilitySettings>>(
                '/api/observability/settings'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo configuración de observabilidad');
            }

            if (!response.data.data) {
                throw new Error('Configuración no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo configuración de observabilidad', { error });
            throw error;
        }
    }

    static async updateObservabilitySettings(settings: ObservabilitySettings): Promise<ObservabilitySettings> {
        try {
            const response = await apiService.put<ObservabilityApiResponse<ObservabilitySettings>>(
                '/api/observability/settings',
                settings
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando configuración de observabilidad');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la configuración');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando configuración de observabilidad', { error, settings });
            throw error;
        }
    }

    // Utilidades
    static async exportLogs(filters: ObservabilityFilters = {}, format: 'json' | 'csv' = 'json'): Promise<Blob> {
        try {
            const response = await apiService.get(
                '/api/observability/logs/export',
                {
                    params: { ...filters, format },
                    responseType: 'blob'
                }
            );

            return response.data as Blob;
        } catch (error) {
            logger.error('Error exportando logs', { error, filters, format });
            throw error;
        }
    }

    static async exportMetrics(filters: any = {}, format: 'json' | 'csv' = 'json'): Promise<Blob> {
        try {
            const response = await apiService.get(
                '/api/observability/metrics/export',
                {
                    params: { ...filters, format },
                    responseType: 'blob'
                }
            );

            return response.data as Blob;
        } catch (error) {
            logger.error('Error exportando métricas', { error, filters, format });
            throw error;
        }
    }

    // Suscribirse a eventos en tiempo real
    static subscribeToObservabilityEvents(_callback: (event: any) => void): () => void {
        // TODO: Implementar WebSocket para eventos en tiempo real
        logger.info('Suscribiéndose a eventos de observabilidad');

        // Por ahora, retornar función de cleanup vacía
        return () => {
            logger.info('Desuscribiéndose de eventos de observabilidad');
        };
    }
}
