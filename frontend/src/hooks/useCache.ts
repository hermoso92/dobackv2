import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    key: string;
}

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    staleWhileRevalidate?: boolean;
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
}

interface CacheManager {
    get<T>(key: string): CacheEntry<T> | null;
    set<T>(key: string, data: T, ttl: number): void;
    delete(key: string): void;
    clear(): void;
    cleanup(): void;
    has(key: string): boolean;
    size(): number;
}

class MemoryCacheManager implements CacheManager {
    private cache = new Map<string, CacheEntry<any>>();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    get<T>(key: string): CacheEntry<T> | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            logger.debug(`Cache entry expired: ${key}`);
            return null;
        }

        logger.debug(`Cache hit: ${key}`);
        return entry as CacheEntry<T>;
    }

    set<T>(key: string, data: T, ttl: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            key
        };

        this.cache.set(key, entry);
        logger.debug(`Cache set: ${key}, TTL: ${ttl}ms`);
    }

    delete(key: string): void {
        this.cache.delete(key);
        logger.debug(`Cache deleted: ${key}`);
    }

    clear(): void {
        this.cache.clear();
        logger.debug('Cache cleared');
    }

    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`Cache cleanup: ${cleaned} expired entries removed`);
        }
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    size(): number {
        return this.cache.size;
    }

    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }
}

// Global cache manager instance
const cacheManager = new MemoryCacheManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        cacheManager.destroy();
    });
}

export const useCache = <T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
): {
    data: T | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    invalidate: () => void;
    isStale: boolean;
} => {
    const {
        ttl = 5 * 60 * 1000, // 5 minutes default
        staleWhileRevalidate = true,
        onError,
        onSuccess
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isStale, setIsStale] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (forceRefresh = false) => {
        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Check cache first (unless forcing refresh)
        if (!forceRefresh) {
            const cachedEntry = cacheManager.get<T>(key);
            if (cachedEntry) {
                setData(cachedEntry.data);
                setError(null);

                // Check if data is stale
                const age = Date.now() - cachedEntry.timestamp;
                const isStaleData = age > ttl * 0.8; // Consider stale at 80% of TTL
                setIsStale(isStaleData);

                // If stale and staleWhileRevalidate is enabled, fetch in background
                if (isStaleData && staleWhileRevalidate) {
                    // Don't set loading to true, just fetch in background
                    fetchData(true);
                }

                if (onSuccess) {
                    onSuccess(cachedEntry.data);
                }

                return;
            }
        }

        setLoading(true);
        setError(null);

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const result = await fetchFunction();

            // Only update if request wasn't aborted
            if (!abortControllerRef.current.signal.aborted) {
                setData(result);
                setIsStale(false);

                // Cache the result
                cacheManager.set(key, result, ttl);

                if (onSuccess) {
                    onSuccess(result);
                }
            }
        } catch (err) {
            if (!abortControllerRef.current.signal.aborted) {
                const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
                setError(errorMessage);

                if (onError) {
                    onError(err instanceof Error ? err : new Error(errorMessage));
                }
            }
        } finally {
            if (!abortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    }, [key, fetchFunction, ttl, staleWhileRevalidate, onError, onSuccess]);

    const refresh = useCallback(() => {
        return fetchData(true);
    }, [fetchData]);

    const invalidate = useCallback(() => {
        cacheManager.delete(key);
        setData(null);
        setError(null);
        setIsStale(false);
    }, [key]);

    // Initial fetch
    useEffect(() => {
        fetchData();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        refresh,
        invalidate,
        isStale
    };
};

export const useCacheWithInvalidation = <T>(
    key: string,
    fetchFunction: () => Promise<T>,
    dependencies: any[] = [],
    options: CacheOptions = {}
) => {
    const cacheResult = useCache(key, fetchFunction, options);

    // Invalidate cache when dependencies change
    useEffect(() => {
        cacheResult.invalidate();
    }, dependencies);

    return cacheResult;
};

export const useMultiCache = <T>(
    keys: string[],
    fetchFunction: (key: string) => Promise<T>,
    options: CacheOptions = {}
): {
    data: Map<string, T | null>;
    loading: Map<string, boolean>;
    errors: Map<string, string | null>;
    refresh: (key?: string) => Promise<void>;
    invalidate: (key?: string) => void;
} => {
    const [data, setData] = useState<Map<string, T | null>>(new Map());
    const [loading, setLoading] = useState<Map<string, boolean>>(new Map());
    const [errors, setErrors] = useState<Map<string, string | null>>(new Map());

    const fetchData = useCallback(async (targetKey?: string) => {
        const keysToFetch = targetKey ? [targetKey] : keys;

        for (const key of keysToFetch) {
            setLoading(prev => new Map(prev).set(key, true));
            setErrors(prev => new Map(prev).set(key, null));

            try {
                // Check cache first
                const cachedEntry = cacheManager.get<T>(key);
                if (cachedEntry) {
                    setData(prev => new Map(prev).set(key, cachedEntry.data));
                    setLoading(prev => new Map(prev).set(key, false));
                    continue;
                }

                const result = await fetchFunction(key);
                setData(prev => new Map(prev).set(key, result));
                setLoading(prev => new Map(prev).set(key, false));

                // Cache the result
                cacheManager.set(key, result, options.ttl || 5 * 60 * 1000);

                if (options.onSuccess) {
                    options.onSuccess(result);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error fetching data';
                setErrors(prev => new Map(prev).set(key, errorMessage));
                setLoading(prev => new Map(prev).set(key, false));

                if (options.onError) {
                    options.onError(err instanceof Error ? err : new Error(errorMessage));
                }
            }
        }
    }, [keys, fetchFunction, options]);

    const refresh = useCallback((targetKey?: string) => {
        return fetchData(targetKey);
    }, [fetchData]);

    const invalidate = useCallback((targetKey?: string) => {
        if (targetKey) {
            cacheManager.delete(targetKey);
            setData(prev => {
                const newMap = new Map(prev);
                newMap.delete(targetKey);
                return newMap;
            });
        } else {
            keys.forEach(key => cacheManager.delete(key));
            setData(new Map());
        }
        setErrors(new Map());
    }, [keys]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        errors,
        refresh,
        invalidate
    };
};

export const cacheUtils = {
    get: <T>(key: string): T | null => {
        const entry = cacheManager.get<T>(key);
        return entry ? entry.data : null;
    },
    set: <T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void => {
        cacheManager.set(key, data, ttl);
    },
    delete: (key: string): void => {
        cacheManager.delete(key);
    },
    clear: (): void => {
        cacheManager.clear();
    },
    has: (key: string): boolean => {
        return cacheManager.has(key);
    },
    size: (): number => {
        return cacheManager.size();
    },
    cleanup: (): void => {
        cacheManager.cleanup();
    }
};

export default {
    useCache,
    useCacheWithInvalidation,
    useMultiCache,
    cacheUtils
};