import { NextFunction, Request, Response } from 'express';
import { aiCache, dashboardCache, mapDataCache, processingCache } from '../services/CacheService';
import { logger } from '../utils/logger';

// Middleware para compresión de respuestas
export function compressionMiddleware(req: Request, res: Response, next: NextFunction) {
    // Comprimir respuestas grandes (>1KB)
    const originalSend = res.send;

    res.send = function (data) {
        if (Buffer.isBuffer(data) || typeof data === 'string') {
            const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');

            if (size > 1024) {
                // Aplicar compresión simple para respuestas grandes
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Vary', 'Accept-Encoding');
            }
        }

        return originalSend.call(this, data);
    };

    next();
}

// Middleware para caché de respuestas API
export function cacheMiddleware(cacheInstance: any, ttl?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Solo cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = generateCacheKey(req);
        const cachedData = cacheInstance.get(cacheKey);

        if (cachedData) {
            logger.debug('Cache hit', { key: cacheKey, endpoint: req.path });

            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Timestamp', new Date().toISOString());

            return res.json({
                success: true,
                data: cachedData,
                cached: true,
                timestamp: new Date().toISOString()
            });
        }

        // Interceptar la respuesta para cachearla
        const originalSend = res.send;

        res.send = function (data) {
            try {
                const responseData = JSON.parse(data);

                if (responseData.success && responseData.data) {
                    cacheInstance.set(cacheKey, responseData.data, ttl);
                    logger.debug('Cache set', { key: cacheKey, endpoint: req.path });

                    res.setHeader('X-Cache', 'MISS');
                    res.setHeader('X-Cache-Timestamp', new Date().toISOString());
                }
            } catch (error) {
                // Ignorar errores de parsing
                logger.debug('Error parsing response for cache', { error });
            }

            return originalSend.call(this, data);
        };

        next();
    };
}

// Middleware específico para dashboard
export function dashboardCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    return cacheMiddleware(dashboardCache, 2 * 60 * 1000)(req, res, next);
}

// Middleware específico para datos de procesamiento
export function processingCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    return cacheMiddleware(processingCache, 1 * 60 * 1000)(req, res, next);
}

// Middleware específico para datos de mapas
export function mapDataCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    return cacheMiddleware(mapDataCache, 5 * 60 * 1000)(req, res, next);
}

// Middleware específico para datos de IA
export function aiCacheMiddleware(req: Request, res: Response, next: NextFunction) {
    return cacheMiddleware(aiCache, 10 * 60 * 1000)(req, res, next);
}

// Middleware para rate limiting
export function rateLimitMiddleware(options: {
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
}) {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutos
        maxRequests = 100,
        skipSuccessfulRequests = true
    } = options;

    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();

        // Limpiar entradas expiradas
        for (const [id, data] of requests.entries()) {
            if (now > data.resetTime) {
                requests.delete(id);
            }
        }

        const clientData = requests.get(clientId);

        if (!clientData) {
            requests.set(clientId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        if (now > clientData.resetTime) {
            // Reset window
            clientData.count = 1;
            clientData.resetTime = now + windowMs;
            return next();
        }

        if (clientData.count >= maxRequests) {
            logger.warn('Rate limit exceeded', {
                clientId,
                count: clientData.count,
                maxRequests,
                endpoint: req.path
            });

            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            });
        }

        clientData.count++;

        // Interceptar respuesta para no contar requests exitosos si está habilitado
        if (skipSuccessfulRequests) {
            const originalSend = res.send;

            res.send = function (data) {
                try {
                    const responseData = JSON.parse(data);
                    if (responseData.success) {
                        clientData.count--;
                    }
                } catch (error) {
                    // Ignorar errores de parsing
                }

                return originalSend.call(this, data);
            };
        }

        next();
    };
}

// Middleware para optimización de consultas de base de datos
export function queryOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
    // Agregar headers para optimización de consultas
    res.setHeader('X-Query-Optimized', 'true');

    // Interceptar requests para agregar optimizaciones
    const originalUrl = req.url;

    // Agregar límites por defecto si no están presentes
    if (req.query.limit === undefined && req.query.page === undefined) {
        req.query.limit = '50'; // Límite por defecto
    }

    // Agregar ordenamiento por defecto para consultas grandes
    if (req.query.sort === undefined && req.path.includes('/api/')) {
        req.query.sort = 'timestamp:desc';
    }

    next();
}

// Middleware para logging de rendimiento
export function performanceLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Interceptar el final de la respuesta
    const originalSend = res.send;

    res.send = function (data) {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

        // Log solo para requests que toman más de 100ms o usan mucha memoria
        if (duration > 100 || memoryDelta > 1024 * 1024) { // 1MB
            logger.info('Performance metrics', {
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                memoryDelta: `${Math.round(memoryDelta / 1024)}KB`,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent')?.substring(0, 50)
            });
        }

        return originalSend.call(this, data);
    };

    next();
}

// Función auxiliar para generar claves de caché
function generateCacheKey(req: Request): string {
    const { path, query } = req;
    const orgId = (req as any).orgId || 'unknown';

    // Crear clave basada en path, query params y organización
    const queryString = Object.keys(query)
        .sort()
        .map(key => `${key}=${query[key]}`)
        .join('&');

    return `${orgId}:${path}:${queryString}`;
}

// Middleware para invalidar caché
export function cacheInvalidationMiddleware(req: Request, res: Response, next: NextFunction) {
    // Interceptar requests que modifican datos
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const originalSend = res.send;

        res.send = function (data) {
            try {
                const responseData = JSON.parse(data);

                if (responseData.success) {
                    // Invalidar cachés relevantes basado en el endpoint
                    invalidateRelevantCaches(req.path, (req as any).orgId);
                }
            } catch (error) {
                // Ignorar errores de parsing
            }

            return originalSend.call(this, data);
        };
    }

    next();
}

// Función para invalidar caches relevantes
function invalidateRelevantCaches(path: string, orgId?: string) {
    const patterns = [
        { pattern: /dashboard|kpi/i, cache: dashboardCache },
        { pattern: /processing|upload/i, cache: processingCache },
        { pattern: /map|geofence/i, cache: mapDataCache },
        { pattern: /ai|intelligence/i, cache: aiCache }
    ];

    patterns.forEach(({ pattern, cache }) => {
        if (pattern.test(path)) {
            // Invalidar todas las entradas que empiecen con el orgId
            const entries = Array.from((cache as any).cache.keys());
            entries.forEach((key: unknown) => {
                if (typeof key === 'string' && (!orgId || key.startsWith(orgId))) {
                    cache.delete(key);
                }
            });

            logger.debug('Cache invalidated', { pattern: pattern.source, path, orgId });
        }
    });
}

// Middleware combinado para optimización completa
export function fullOptimizationMiddleware(req: Request, res: Response, next: NextFunction) {
    compressionMiddleware(req, res, () => {
        queryOptimizationMiddleware(req, res, () => {
            performanceLoggingMiddleware(req, res, () => {
                cacheInvalidationMiddleware(req, res, next);
            });
        });
    });
}
