import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ObservabilityAPI } from '../api/observability';
import { logger } from '../utils/logger';

export const useObservabilityData = () => {
    const queryClient = useQueryClient();

    // Gestión de logs
    const useLogs = (filters: any = {}) => {
        return useQuery({
            queryKey: ['observability-logs', filters],
            queryFn: () => ObservabilityAPI.getLogs(filters),
            staleTime: 30 * 1000, // 30 segundos
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useLog = (logId: string) => {
        return useQuery({
            queryKey: ['observability-log', logId],
            queryFn: () => ObservabilityAPI.getLog(logId),
            enabled: !!logId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    // Gestión de métricas
    const useMetrics = (filters: any = {}) => {
        return useQuery({
            queryKey: ['observability-metrics', filters],
            queryFn: () => ObservabilityAPI.getMetrics(filters),
            staleTime: 30 * 1000, // 30 segundos
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useSystemMetrics = () => {
        return useQuery({
            queryKey: ['observability-system-metrics'],
            queryFn: () => ObservabilityAPI.getSystemMetrics(),
            staleTime: 10 * 1000, // 10 segundos
            gcTime: 1 * 60 * 1000, // 1 minuto
            refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
        });
    };

    const usePerformanceMetrics = () => {
        return useQuery({
            queryKey: ['observability-performance-metrics'],
            queryFn: () => ObservabilityAPI.getPerformanceMetrics(),
            staleTime: 30 * 1000, // 30 segundos
            gcTime: 5 * 60 * 1000, // 5 minutos
            refetchInterval: 60 * 1000, // Refrescar cada minuto
        });
    };

    // Health checks
    const useHealth = () => {
        return useQuery({
            queryKey: ['observability-health'],
            queryFn: () => ObservabilityAPI.getHealth(),
            staleTime: 10 * 1000, // 10 segundos
            gcTime: 1 * 60 * 1000, // 1 minuto
            refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
        });
    };

    const useHealthCheck = (checkName: string) => {
        return useQuery({
            queryKey: ['observability-health-check', checkName],
            queryFn: () => ObservabilityAPI.getHealthCheck(checkName),
            enabled: !!checkName,
            staleTime: 10 * 1000, // 10 segundos
            gcTime: 1 * 60 * 1000, // 1 minuto
            refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
        });
    };

    // Gestión de alertas
    const useAlerts = (filters: any = {}) => {
        return useQuery({
            queryKey: ['observability-alerts', filters],
            queryFn: () => ObservabilityAPI.getAlerts(filters),
            staleTime: 30 * 1000, // 30 segundos
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useAlert = (alertId: string) => {
        return useQuery({
            queryKey: ['observability-alert', alertId],
            queryFn: () => ObservabilityAPI.getAlert(alertId),
            enabled: !!alertId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useAcknowledgeAlert = () => {
        return useMutation({
            mutationFn: ({ alertId, message }: { alertId: string; message?: string }) =>
                ObservabilityAPI.acknowledgeAlert(alertId, message),
            onSuccess: (data, { alertId }) => {
                logger.info('Alerta reconocida exitosamente', { alertId });
                queryClient.invalidateQueries({ queryKey: ['observability-alert', alertId] });
                queryClient.invalidateQueries({ queryKey: ['observability-alerts'] });
            },
            onError: (error) => {
                logger.error('Error reconociendo alerta', { error });
            },
        });
    };

    const useResolveAlert = () => {
        return useMutation({
            mutationFn: ({ alertId, message }: { alertId: string; message?: string }) =>
                ObservabilityAPI.resolveAlert(alertId, message),
            onSuccess: (data, { alertId }) => {
                logger.info('Alerta resuelta exitosamente', { alertId });
                queryClient.invalidateQueries({ queryKey: ['observability-alert', alertId] });
                queryClient.invalidateQueries({ queryKey: ['observability-alerts'] });
            },
            onError: (error) => {
                logger.error('Error resolviendo alerta', { error });
            },
        });
    };

    // Gestión de tests
    const useTestSuites = () => {
        return useQuery({
            queryKey: ['observability-test-suites'],
            queryFn: () => ObservabilityAPI.getTestSuites(),
            staleTime: 2 * 60 * 1000, // 2 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useTestSuite = (suiteId: string) => {
        return useQuery({
            queryKey: ['observability-test-suite', suiteId],
            queryFn: () => ObservabilityAPI.getTestSuite(suiteId),
            enabled: !!suiteId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useRunTestSuite = () => {
        return useMutation({
            mutationFn: (suiteType: 'unit' | 'integration' | 'e2e' | 'performance') =>
                ObservabilityAPI.runTestSuite(suiteType),
            onSuccess: (data) => {
                logger.info('Suite de tests ejecutada exitosamente', { suiteId: data.id });
                queryClient.invalidateQueries({ queryKey: ['observability-test-suites'] });
                queryClient.invalidateQueries({ queryKey: ['observability-test-suite', data.id] });
            },
            onError: (error) => {
                logger.error('Error ejecutando suite de tests', { error });
            },
        });
    };

    const useTestResult = (testId: string) => {
        return useQuery({
            queryKey: ['observability-test-result', testId],
            queryFn: () => ObservabilityAPI.getTestResult(testId),
            enabled: !!testId,
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    // Estadísticas de observabilidad
    const useObservabilityStats = () => {
        return useQuery({
            queryKey: ['observability-stats'],
            queryFn: () => ObservabilityAPI.getObservabilityStats(),
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
            refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
        });
    };

    // Configuración de observabilidad
    const useObservabilitySettings = () => {
        return useQuery({
            queryKey: ['observability-settings'],
            queryFn: () => ObservabilityAPI.getObservabilitySettings(),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useUpdateObservabilitySettings = () => {
        return useMutation({
            mutationFn: (settings: any) => ObservabilityAPI.updateObservabilitySettings(settings),
            onSuccess: (data) => {
                logger.info('Configuración de observabilidad actualizada', { settings: data });
                queryClient.invalidateQueries({ queryKey: ['observability-settings'] });
            },
            onError: (error) => {
                logger.error('Error actualizando configuración de observabilidad', { error });
            },
        });
    };

    // Utilidades
    const useExportLogs = () => {
        return useMutation({
            mutationFn: ({ filters, format }: { filters: any; format: 'json' | 'csv' }) =>
                ObservabilityAPI.exportLogs(filters, format),
            onSuccess: (data, { filters, format }) => {
                logger.info('Logs exportados exitosamente', { filters, format });
                // Crear descarga automática
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            onError: (error) => {
                logger.error('Error exportando logs', { error });
            },
        });
    };

    const useExportMetrics = () => {
        return useMutation({
            mutationFn: ({ filters, format }: { filters: any; format: 'json' | 'csv' }) =>
                ObservabilityAPI.exportMetrics(filters, format),
            onSuccess: (data, { filters, format }) => {
                logger.info('Métricas exportadas exitosamente', { filters, format });
                // Crear descarga automática
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = `metrics-${new Date().toISOString().split('T')[0]}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            onError: (error) => {
                logger.error('Error exportando métricas', { error });
            },
        });
    };

    // Utilidades de cache
    const invalidateObservabilityCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-logs'] });
        queryClient.invalidateQueries({ queryKey: ['observability-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['observability-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['observability-health'] });
        queryClient.invalidateQueries({ queryKey: ['observability-test-suites'] });
        queryClient.invalidateQueries({ queryKey: ['observability-stats'] });
    };

    const invalidateLogsCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-logs'] });
    };

    const invalidateMetricsCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['observability-system-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['observability-performance-metrics'] });
    };

    const invalidateAlertsCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-alerts'] });
    };

    const invalidateHealthCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-health'] });
    };

    const invalidateTestsCache = () => {
        queryClient.invalidateQueries({ queryKey: ['observability-test-suites'] });
    };

    return {
        // Logs
        useLogs,
        useLog,

        // Métricas
        useMetrics,
        useSystemMetrics,
        usePerformanceMetrics,

        // Health checks
        useHealth,
        useHealthCheck,

        // Alertas
        useAlerts,
        useAlert,
        useAcknowledgeAlert,
        useResolveAlert,

        // Tests
        useTestSuites,
        useTestSuite,
        useRunTestSuite,
        useTestResult,

        // Estadísticas y configuración
        useObservabilityStats,
        useObservabilitySettings,
        useUpdateObservabilitySettings,

        // Utilidades
        useExportLogs,
        useExportMetrics,

        // Utilidades de cache
        invalidateObservabilityCache,
        invalidateLogsCache,
        invalidateMetricsCache,
        invalidateAlertsCache,
        invalidateHealthCache,
        invalidateTestsCache,
    };
};
