/**
 * Hook optimizado para gestión de datos con caché
 * Optimización de rendimiento para el frontend
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

interface OptimizedDataOptions {
    ttl?: number; // Time to live en milisegundos
    refetchOnFocus?: boolean;
    refetchOnMount?: boolean;
    staleTime?: number; // Tiempo antes de considerar los datos obsoletos
    cacheKey?: string;
}

interface OptimizedDataState<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    cached: boolean;
    lastUpdated: Date | null;
    refetch: () => Promise<void>;
    invalidateCache: () => void;
}

// Caché global en memoria para el frontend
const frontendCache = new Map<string, CacheEntry<any>>();

class FrontendCacheService {
    private static instance: FrontendCacheService;
    private cache = frontendCache;

    static getInstance(): FrontendCacheService {
        if (!FrontendCacheService.instance) {
            FrontendCacheService.instance = new FrontendCacheService();
        }
        return FrontendCacheService.instance;
    }

    set<T>(key: string, data: T, ttl: number = 300000): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.cache.set(key, entry);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    getStats() {
        const now = Date.now();
        let expired = 0;
        let active = 0;

        for (const entry of this.cache.values()) {
            if (now - entry.timestamp > entry.ttl) {
                expired++;
            } else {
                active++;
            }
        }

        return {
            total: this.cache.size,
            active,
            expired,
            memoryUsage: this.cache.size * 1024 // Estimación aproximada
        };
    }
}

const cacheService = FrontendCacheService.getInstance();

/**
 * Hook optimizado para obtener datos con caché
 */
export function useOptimizedData<T>(
    endpoint: string,
    options: OptimizedDataOptions = {}
): OptimizedDataState<T> {
    const {
        ttl = 300000, // 5 minutos por defecto
        refetchOnFocus = true,
        refetchOnMount = true,
        staleTime = 60000, // 1 minuto
        cacheKey
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [cached, setCached] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const cacheKeyRef = useRef(cacheKey || `data:${endpoint}`);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (forceRefresh: boolean = false) => {
        const key = cacheKeyRef.current;

        // Verificar caché si no es refresh forzado
        if (!forceRefresh) {
            const cachedData = cacheService.get<T>(key);
            if (cachedData) {
                setData(cachedData);
                setCached(true);
                setLoading(false);
                setError(null);
                return;
            }
        }

        setLoading(true);
        setError(null);
        setCached(false);

        try {
            // Cancelar request anterior si existe
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            const response = await api.get(endpoint, {
                signal: abortControllerRef.current.signal
            });

            const responseData = response.data?.data || response.data;

            // Guardar en caché
            cacheService.set(key, responseData, ttl);

            setData(responseData);
            setLastUpdated(new Date());
            setLoading(false);
            setCached(false);

        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err);
                setLoading(false);
            }
        }
    }, [endpoint, ttl]);

    const refetch = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    const invalidateCache = useCallback(() => {
        const key = cacheKeyRef.current;
        cacheService.delete(key);
        setCached(false);
    }, []);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        if (refetchOnMount) {
            fetchData();
        }
    }, [fetchData, refetchOnMount]);

    // Efecto para refetch cuando la ventana recibe foco
    useEffect(() => {
        if (!refetchOnFocus) return;

        const handleFocus = () => {
            const key = cacheKeyRef.current;
            const cachedData = cacheService.get<T>(key);

            if (cachedData) {
                const now = Date.now();
                const entry = frontendCache.get(key);

                if (entry && (now - entry.timestamp) > staleTime) {
                    // Los datos están obsoletos, refetch en background
                    fetchData(true);
                }
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchData, refetchOnFocus, staleTime]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        cached,
        lastUpdated,
        refetch,
        invalidateCache
    };
}

/**
 * Hook optimizado para datos en tiempo real
 */
export function useOptimizedRealtimeData<T>(
    endpoint: string,
    interval: number = 30000, // 30 segundos por defecto
    options: OptimizedDataOptions = {}
): OptimizedDataState<T> {
    const optimizedData = useOptimizedData<T>(endpoint, {
        ...options,
        ttl: 60000, // 1 minuto para datos en tiempo real
        refetchOnFocus: false // No refetch automático para datos en tiempo real
    });

    useEffect(() => {
        const intervalId = setInterval(() => {
            optimizedData.refetch();
        }, interval);

        return () => clearInterval(intervalId);
    }, [interval, optimizedData.refetch]);

    return optimizedData;
}

/**
 * Hook para datos que se actualizan automáticamente
 */
export function useOptimizedAutoData<T>(
    endpoint: string,
    autoRefresh: boolean = true,
    refreshInterval: number = 60000, // 1 minuto
    options: OptimizedDataOptions = {}
): OptimizedDataState<T> {
    const optimizedData = useOptimizedData<T>(endpoint, options);

    useEffect(() => {
        if (!autoRefresh) return;

        const intervalId = setInterval(() => {
            optimizedData.refetch();
        }, refreshInterval);

        return () => clearInterval(intervalId);
    }, [autoRefresh, refreshInterval, optimizedData.refetch]);

    return optimizedData;
}

/**
 * Hook para invalidar múltiples caches
 */
export function useCacheInvalidation() {
    const invalidateAll = useCallback(() => {
        cacheService.clear();
    }, []);

    const invalidateByPattern = useCallback((pattern: string) => {
        // Implementar invalidación por patrón si es necesario
        console.log(`Invalidating cache for pattern: ${pattern}`);
    }, []);

    const invalidateByEndpoint = useCallback((endpoint: string) => {
        const key = `data:${endpoint}`;
        cacheService.delete(key);
    }, []);

    return {
        invalidateAll,
        invalidateByPattern,
        invalidateByEndpoint
    };
}

/**
 * Hook para obtener estadísticas del caché
 */
export function useCacheStats() {
    const [stats, setStats] = useState(cacheService.getStats());

    useEffect(() => {
        const intervalId = setInterval(() => {
            setStats(cacheService.getStats());
        }, 5000); // Actualizar cada 5 segundos

        return () => clearInterval(intervalId);
    }, []);

    return stats;
}

/**
 * Hook optimizado para listas con paginación
 */
export function useOptimizedPaginatedData<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    options: OptimizedDataOptions = {}
): OptimizedDataState<{ items: T[]; total: number; page: number; limit: number }> {
    const cacheKey = `${endpoint}:page:${page}:limit:${limit}`;

    return useOptimizedData(`${endpoint}?page=${page}&limit=${limit}`, {
        ...options,
        cacheKey
    });
}

/**
 * Hook para datos que dependen de parámetros
 */
export function useOptimizedParametricData<T>(
    endpoint: string,
    params: Record<string, any>,
    options: OptimizedDataOptions = {}
): OptimizedDataState<T> {
    const paramsString = useMemo(() =>
        Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        , [params]);

    const fullEndpoint = `${endpoint}?${paramsString}`;
    const cacheKey = `data:${endpoint}:${paramsString}`;

    return useOptimizedData(fullEndpoint, {
        ...options,
        cacheKey
    });
}

export default {
    useOptimizedData,
    useOptimizedRealtimeData,
    useOptimizedAutoData,
    useCacheInvalidation,
    useCacheStats,
    useOptimizedPaginatedData,
    useOptimizedParametricData,
    cacheService
};
