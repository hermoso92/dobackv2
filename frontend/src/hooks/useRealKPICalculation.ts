import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface KPICalculationResult {
    hoursDriving: string;
    km: number;
    timeInPark: string;
    timeOutPark: string;
    timeInWorkshop: string;
    rotativoPct: number;
    incidents: {
        total: number;
        leve: number;
        moderada: number;
        grave: number;
    };
    speeding: {
        on: { count: number; duration: string };
        off: { count: number; duration: string };
    };
    clave: {
        "2": string;
        "5": string;
    };
    activacionesClave2: number;
}

interface UseRealKPICalculationOptions {
    startDate?: Date;
    endDate?: Date;
    vehicleIds?: string[];
    autoRefresh?: boolean;
    refreshInterval?: number;
}

interface UseRealKPICalculationReturn {
    kpis: KPICalculationResult | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    lastUpdated: Date | null;
}

export const useRealKPICalculation = (options: UseRealKPICalculationOptions = {}): UseRealKPICalculationReturn => {
    const {
        startDate,
        endDate,
        vehicleIds,
        autoRefresh = false,
        refreshInterval = 30000 // 30 segundos
    } = options;

    const [kpis, setKpis] = useState<KPICalculationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchKPIs = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Construir parámetros de consulta
            const params: Record<string, any> = {};

            if (startDate) {
                params.startDate = startDate.toISOString();
            }
            if (endDate) {
                params.endDate = endDate.toISOString();
            }
            if (vehicleIds && vehicleIds.length > 0) {
                params.vehicleIds = vehicleIds;
            }

            logger.info('Calculando KPIs reales', { params });

            const response = await apiService.get('/api/kpi/calculate', { params });

            if (response.success && response.data) {
                setKpis(response.data as KPICalculationResult);
                setLastUpdated(new Date());
                logger.info('KPIs calculados exitosamente', { kpis: response.data });
            } else {
                throw new Error(response.message || 'Error calculando KPIs');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido calculando KPIs';
            setError(errorMessage);
            logger.error('Error calculando KPIs reales', { error: err });
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, vehicleIds]);

    // Efecto para cargar KPIs inicialmente
    useEffect(() => {
        fetchKPIs();
    }, [fetchKPIs]);

    // Efecto para auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchKPIs();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchKPIs]);

    return {
        kpis,
        isLoading,
        error,
        refetch: fetchKPIs,
        lastUpdated
    };
};

/**
 * Hook para obtener resumen de KPIs en múltiples períodos
 */
export const useKPISummary = (vehicleIds?: string[]) => {
    const [summary, setSummary] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params: Record<string, any> = {};
            if (vehicleIds && vehicleIds.length > 0) {
                params.vehicleIds = vehicleIds;
            }

            const response = await apiService.get('/api/kpi/calculate/summary', { params });

            if (response.success && response.data) {
                setSummary(response.data as any[]);
            } else {
                throw new Error(response.message || 'Error calculando resumen de KPIs');
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error calculando resumen de KPIs', { error: err });
        } finally {
            setIsLoading(false);
        }
    }, [vehicleIds]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    return {
        summary,
        isLoading,
        error,
        refetch: fetchSummary
    };
};
