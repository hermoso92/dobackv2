import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    CompleteSummary,
    kpiService
} from '../services/kpiService';
import { logger } from '../utils/logger';
import { useGlobalFilters } from './useGlobalFilters';

export const useKPIs = () => {
    const { filters, filterVersion, updateTrigger } = useGlobalFilters();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [kpis, setKpis] = useState<CompleteSummary | null>(null);

    // Crear clave de dependencia basada en el contenido de filters
    const filtersKey = useMemo(() => {
        return JSON.stringify({
            version: filterVersion,
            start: filters.dateRange?.start || '',
            end: filters.dateRange?.end || '',
            vehicles: filters.vehicles ? [...filters.vehicles].sort() : [],
            rotativo: filters.rotativo || 'all',
            severity: filters.severity ? [...filters.severity].sort() : []
        });
    }, [
        filterVersion,
        filters.dateRange?.start,
        filters.dateRange?.end,
        filters.vehicles,
        filters.rotativo,
        filters.severity
    ]);

    /**
     * Carga todos los KPIs basándose en los filtros globales
     */
    const loadKPIs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Construir filtros para la API
            const apiFilters = {
                from: filters.dateRange?.start || undefined,
                to: filters.dateRange?.end || undefined,
                vehicleIds: filters.vehicles && filters.vehicles.length > 0
                    ? filters.vehicles
                    : undefined
            };

            logger.info('Cargando KPIs con filtros', { apiFilters });

            // Cargar resumen completo
            const summary = await kpiService.getCompleteSummary(apiFilters);

            setKpis(summary);
            logger.info('KPIs cargados exitosamente');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido cargando KPIs';
            setError(errorMessage);
            logger.error('Error cargando KPIs', { error: err });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtersKey]);

    /**
     * Recarga los KPIs
     */
    const reload = useCallback(() => {
        loadKPIs();
    }, [loadKPIs]);

    /**
     * Carga inicial y cuando cambian los filtros
     * Usa updateTrigger como dependencia para garantizar ejecución
     */
    useEffect(() => {
        loadKPIs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateTrigger]);

    /**
     * Obtener estado específico por clave
     */
    const getStateByKey = useCallback((key: number) => {
        if (!kpis?.states?.states) return null;
        return kpis.states.states.find(s => s.key === key) || null;
    }, [kpis]);

    /**
     * Obtener duración formateada de un estado
     */
    const getStateDuration = useCallback((key: number): string => {
        const state = getStateByKey(key);
        return state?.duration_formatted || '00:00:00';
    }, [getStateByKey]);

    /**
     * Obtener conteo de un estado
     */
    const getStateCount = useCallback((key: number): number => {
        const state = getStateByKey(key);
        return state?.count || 0;
    }, [getStateByKey]);

    return {
        loading,
        error,
        kpis,
        reload,
        getStateByKey,
        getStateDuration,
        getStateCount,
        // Accesos directos a datos comunes
        states: kpis?.states,
        activity: kpis?.activity,
        stability: kpis?.stability,
        quality: kpis?.quality // Añadido: índice de estabilidad
    };
};

