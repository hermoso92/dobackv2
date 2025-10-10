import { NextFunction, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

interface CacheConfig {
    ttl: number; // Tiempo de vida en segundos
    checkperiod?: number; // Período de revisión en segundos
    useClones?: boolean; // Usar clones de objetos
}

interface CacheStats {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
}

// Crear instancia de caché
const cache = new NodeCache({
    stdTTL: 300, // 5 minutos por defecto
    checkperiod: 60, // Revisar cada minuto
    useClones: false // No usar clones para mejorar rendimiento
});

// Generar clave de caché
const generateCacheKey = (req: Request): string => {
    const key = `${req.method}:${req.originalUrl}`;
    const queryParams = Object.keys(req.query)
        .sort()
        .map((k) => `${k}=${req.query[k]}`)
        .join('&');
    return queryParams ? `${key}?${queryParams}` : key;
};

// Middleware de caché
export const cacheMiddleware = (config?: Partial<CacheConfig>) => {
    const ttl = config?.ttl || 300;

    return (req: Request, res: Response, next: NextFunction) => {
        // Solo cachear peticiones GET
        if (req.method !== 'GET') {
            return next();
        }

        const key = generateCacheKey(req);
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            logger.debug('Cache hit', { key });
            return res.json(cachedResponse);
        }

        // Capturar la respuesta
        const originalJson = res.json;
        res.json = function (body) {
            cache.set(key, body, ttl);
            logger.debug('Cache set', { key, ttl });
            return originalJson.call(this, body);
        };

        next();
    };
};

// Middleware para invalidar caché
export const invalidateCacheMiddleware = (pattern?: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (pattern) {
            const keys = cache.keys().filter((key) => key.includes(pattern));
            cache.del(keys);
            logger.debug('Cache invalidated by pattern', { pattern, count: keys.length });
        } else {
            cache.flushAll();
            logger.debug('Cache flushed');
        }
        next();
    };
};

// Middleware para estadísticas de caché
export const cacheStatsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const stats = cache.getStats();
    (req as any).cacheStats = {
        hits: stats.hits,
        misses: stats.misses,
        keys: cache.keys().length,
        ksize: stats.ksize,
        vsize: stats.vsize
    };
    next();
};

// Funciones de utilidad
export const getCacheStats = (): CacheStats => {
    const stats = cache.getStats();
    return {
        hits: stats.hits,
        misses: stats.misses,
        keys: cache.keys().length,
        ksize: stats.ksize,
        vsize: stats.vsize
    };
};

export const clearCache = (pattern?: string): void => {
    if (pattern) {
        const keys = cache.keys().filter((key) => key.includes(pattern));
        cache.del(keys);
        logger.debug('Cache cleared by pattern', { pattern, count: keys.length });
    } else {
        cache.flushAll();
        logger.debug('Cache cleared');
    }
};

export const setCacheValue = (key: string, value: any, ttl?: number): void => {
    cache.set(key, value, ttl);
    logger.debug('Cache value set', { key, ttl });
};

export const getCacheValue = <T>(key: string): T | undefined => {
    return cache.get<T>(key);
};

export const deleteCacheValue = (key: string): void => {
    cache.del(key);
    logger.debug('Cache value deleted', { key });
};
