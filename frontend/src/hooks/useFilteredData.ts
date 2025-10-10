import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';
import { useGlobalFilters } from './useGlobalFilters';

interface UseFilteredDataOptions {
    endpoint: string;
    queryKey: string;
    enabled?: boolean;
    refetchInterval?: number;
    onError?: (error: any) => void;
}

export const useFilteredData = <T = any>(options: UseFilteredDataOptions) => {
    const { endpoint, queryKey, enabled = true, refetchInterval, onError } = options;
    const { getApiQuery, hasActiveFilters } = useGlobalFilters();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const [data, setData] = useState<T | null>(null);

    // Función para hacer la petición con filtros
    const fetchData = useCallback(async (): Promise<T> => {
        const queryParams = getApiQuery();
        logger.info(`Fetching filtered data from ${endpoint}:`, queryParams);

        const response = await apiService.get(endpoint, { params: queryParams });

        if (response.success) {
            return response.data as T;
        } else {
            throw new Error(response.message || 'Error fetching data');
        }
    }, [endpoint, getApiQuery]);

    // React Query para cache y refetch automático
    const queryResult = useQuery<T>({
        queryKey: [queryKey, getApiQuery()],
        queryFn: fetchData,
        enabled,
        refetchInterval,
        staleTime: 30000, // 30 segundos
        gcTime: 300000, // 5 minutos
    });

    // Actualizar estado local cuando cambie el resultado de React Query
    useEffect(() => {
        if (queryResult.data !== undefined) {
            setData(queryResult.data);
        }
        if (queryResult.error) {
            const errorMessage = queryResult.error instanceof Error ? queryResult.error.message : String(queryResult.error);
            setError(errorMessage);

            if (onError) {
                onError(queryResult.error);
            }
        }
        setIsLoading(queryResult.isLoading);
    }, [queryResult.data, queryResult.error, queryResult.isLoading, onError]);

    // Función para refetch manual
    const refetch = useCallback(() => {
        return queryResult.refetch();
    }, [queryResult]);

    return {
        data,
        isLoading: isLoading || queryResult.isLoading,
        error,
        refetch,
        hasActiveFilters,
        isStale: queryResult.isStale,
        lastUpdated: queryResult.dataUpdatedAt
    };
};

// Hook específico para datos del dashboard
export const useFilteredDashboardData = () => {
    return useFilteredData({
        endpoint: '/api/kpis/summary',
        queryKey: 'dashboard-data',
        refetchInterval: 60000, // Refetch cada minuto
        onError: (error) => {
            logger.error('Error loading dashboard data:', error);
        }
    });
};

// Hook específico para datos de telemetría
export const useFilteredTelemetryData = () => {
    return useFilteredData({
        endpoint: '/telemetry/data',
        queryKey: 'telemetry-data',
        refetchInterval: 30000, // Refetch cada 30 segundos
        onError: (error) => {
            logger.error('Error loading telemetry data:', error);
        }
    });
};

// Hook específico para datos de estabilidad
export const useFilteredStabilityData = () => {
    return useFilteredData({
        endpoint: '/stability/sessions',
        queryKey: 'stability-data',
        refetchInterval: 60000, // Refetch cada minuto
        onError: (error) => {
            logger.error('Error loading stability data:', error);
        }
    });
};

// Hook específico para eventos
export const useFilteredEventsData = () => {
    return useFilteredData({
        endpoint: '/events',
        queryKey: 'events-data',
        refetchInterval: 30000, // Refetch cada 30 segundos
        onError: (error) => {
            logger.error('Error loading events data:', error);
        }
    });
};

// Hook específico para KPIs
export const useFilteredKPIData = () => {
    return useFilteredData({
        endpoint: '/kpi/advanced',
        queryKey: 'kpi-data',
        refetchInterval: 120000, // Refetch cada 2 minutos
        onError: (error) => {
            logger.error('Error loading KPI data:', error);
        }
    });
};
