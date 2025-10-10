import { useCallback, useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';
import { useAuth } from './useAuth';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface UseOptimizedDataFetchingOptions<T> {
    endpoint: string;
    cacheKey: string;
    cacheDuration?: number; // en milisegundos
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number; // tiempo antes de considerar los datos como stale
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    dependencies?: any[];
}

interface UseOptimizedDataFetchingReturn<T> {
    data: T | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    invalidateCache: () => void;
    isStale: boolean;
    lastFetch: Date | null;
}

// Cache global para todos los hooks
const globalCache = new Map<string, CacheEntry<any>>();

export function useOptimizedDataFetching<T>({
    endpoint,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutos por defecto
    enabled = true,
    refetchInterval,
    staleTime = 2 * 60 * 1000, // 2 minutos por defecto
    onSuccess,
    onError,
    dependencies = []
}: UseOptimizedDataFetchingOptions<T>): UseOptimizedDataFetchingReturn<T> {
    const { user } = useAuth();
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Función para verificar si los datos están en caché y son válidos
    const getCachedData = useCallback((): T | null => {
        const cached = globalCache.get(cacheKey);
        if (!cached) return null;

        const now = Date.now();
        if (now > cached.expiresAt) {
            globalCache.delete(cacheKey);
            return null;
        }

        return cached.data;
    }, [cacheKey]);

    // Función para guardar datos en caché
    const setCachedData = useCallback((newData: T) => {
        const now = Date.now();
        globalCache.set(cacheKey, {
            data: newData,
            timestamp: now,
            expiresAt: now + cacheDuration
        });
    }, [cacheKey, cacheDuration]);

    // Función para verificar si los datos son stale
    const isDataStale = useCallback((): boolean => {
        const cached = globalCache.get(cacheKey);
        if (!cached) return true;

        const now = Date.now();
        return (now - cached.timestamp) > staleTime;
    }, [cacheKey, staleTime]);

    // Función principal de fetch
    const fetchData = useCallback(async (force = false): Promise<void> => {
        if (!enabled || !user?.organizationId) return;

        // Verificar caché si no es un fetch forzado
        if (!force) {
            const cachedData = getCachedData();
            if (cachedData) {
                setData(cachedData);
                setIsError(false);
                setError(null);
                return;
            }
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController();

        try {
            setIsLoading(true);
            setIsError(false);
            setError(null);

            const response = await apiService.get(endpoint, {
                signal: abortControllerRef.current.signal,
                params: {
                    organizationId: user.organizationId,
                    ...dependencies
                }
            });

            if (response.success) {
                const responseData = response.data as T;
                setData(responseData);
                setCachedData(responseData);
                setLastFetch(new Date());
                onSuccess?.(responseData);

                logger.info('Datos cargados exitosamente', {
                    endpoint,
                    cacheKey,
                    userId: user.id,
                    timestamp: new Date().toISOString()
                });
            } else {
                throw new Error(response.message || 'Error en la respuesta del servidor');
            }

        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Request cancelado, no hacer nada
                return;
            }

            const error = err instanceof Error ? err : new Error('Error desconocido');
            setError(error);
            setIsError(true);
            onError?.(error);

            logger.error('Error cargando datos', {
                endpoint,
                cacheKey,
                error: error.message,
                userId: user?.id
            });
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [
        enabled,
        user,
        endpoint,
        getCachedData,
        setCachedData,
        onSuccess,
        onError,
        dependencies
    ]);

    // Función para refetch manual
    const refetch = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    // Función para invalidar caché
    const invalidateCache = useCallback(() => {
        globalCache.delete(cacheKey);
        setData(null);
        setLastFetch(null);
    }, [cacheKey]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Efecto para refetch automático
    useEffect(() => {
        if (!refetchInterval) return;

        intervalRef.current = setInterval(() => {
            // Solo hacer refetch si los datos están stale
            if (isDataStale()) {
                fetchData();
            }
        }, refetchInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [refetchInterval, fetchData, isDataStale]);

    // Limpiar recursos al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        data,
        isLoading,
        isError,
        error,
        refetch,
        invalidateCache,
        isStale: isDataStale(),
        lastFetch
    };
}

// Hook especializado para datos del dashboard
export function useOptimizedDashboardData() {
    return useOptimizedDataFetching({
        endpoint: '/api/kpis/summary',
        cacheKey: 'dashboard-data',
        cacheDuration: 2 * 60 * 1000, // 2 minutos
        staleTime: 1 * 60 * 1000, // 1 minuto
        refetchInterval: 30 * 1000 // 30 segundos
    });
}

// Hook especializado para datos de procesamiento
export function useOptimizedProcessingData() {
    return useOptimizedDataFetching({
        endpoint: '/api/processing/stats',
        cacheKey: 'processing-stats',
        cacheDuration: 1 * 60 * 1000, // 1 minuto
        staleTime: 30 * 1000, // 30 segundos
        refetchInterval: 15 * 1000 // 15 segundos
    });
}

// Hook especializado para datos de mapas
export function useOptimizedMapData(mapType: 'heatmap' | 'speed' | 'geofences') {
    return useOptimizedDataFetching({
        endpoint: `/api/maps/${mapType}`,
        cacheKey: `map-data-${mapType}`,
        cacheDuration: 5 * 60 * 1000, // 5 minutos
        staleTime: 2 * 60 * 1000, // 2 minutos
        refetchInterval: 60 * 1000 // 1 minuto
    });
}

// Función para limpiar caché global (útil para logout)
export function clearGlobalCache() {
    globalCache.clear();
    logger.info('Caché global limpiado');
}

// Función para obtener estadísticas del caché
export function getCacheStats() {
    const now = Date.now();
    const entries = Array.from(globalCache.entries());

    return {
        totalEntries: entries.length,
        validEntries: entries.filter(([_, entry]) => now <= entry.expiresAt).length,
        expiredEntries: entries.filter(([_, entry]) => now > entry.expiresAt).length,
        totalSize: entries.reduce((sum, [_, entry]) => sum + JSON.stringify(entry.data).length, 0)
    };
}
