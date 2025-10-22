/**
 * Middleware de optimización para rutas de API
 * Incluye compresión, caché de headers y optimización de respuestas
 */

import { NextFunction, Request, Response } from 'express';
import { CacheService } from '../services/CacheService';
import { logger } from '../utils/logger';

// Instancia única de CacheService
const cacheService = new CacheService();

interface OptimizedResponse {
    data: any;
    metadata: {
        cached: boolean;
        timestamp: number;
        ttl?: number;
        source: 'cache' | 'database' | 'computed';
    };
}

/**
 * Middleware de compresión de respuestas
 */
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Configurar headers de compresión
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Vary', 'Accept-Encoding');

    next();
};

/**
 * Middleware de caché de headers HTTP
 */
export const cacheHeadersMiddleware = (ttl: number = 300) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Solo aplicar caché a métodos GET
        if (req.method === 'GET') {
            res.setHeader('Cache-Control', `public, max-age=${ttl}`);
            res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
            res.setHeader('Last-Modified', new Date().toUTCString());
        }

        next();
    };
};

/**
 * Middleware de caché de respuestas API
 */
export const apiCacheMiddleware = (ttl: number = 300000) => { // 5 minutos por defecto
    return (req: Request, res: Response, next: NextFunction) => {
        // Solo aplicar caché a métodos GET
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = cacheService.generateKey(
            'api',
            req.path,
            req.query,
            req.headers.authorization?.split(' ')[1] || 'anonymous'
        );

        const cached = cacheService.get<any>(cacheKey);
        if (cached) {
            const response: OptimizedResponse = {
                data: cached,
                metadata: {
                    cached: true,
                    timestamp: Date.now(),
                    source: 'cache'
                }
            };

            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Key', cacheKey);
            return res.json(response);
        }

        // Interceptar la respuesta original
        const originalSend = res.json;
        res.json = function (body: any) {
            // Guardar en caché solo si la respuesta es exitosa
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cacheService.set(cacheKey, body, ttl);

                const response: OptimizedResponse = {
                    data: body,
                    metadata: {
                        cached: false,
                        timestamp: Date.now(),
                        ttl,
                        source: 'database'
                    }
                };

                res.setHeader('X-Cache', 'MISS');
                res.setHeader('X-Cache-Key', cacheKey);
                return originalSend.call(this, response);
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

/**
 * Middleware de optimización de consultas
 */
export const queryOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Optimizar parámetros de consulta comunes
    if (req.query.limit && typeof req.query.limit === 'string') {
        const limit = parseInt(req.query.limit);
        if (limit > 1000) {
            req.query.limit = '1000'; // Limitar a 1000 registros máximo
        }
    }

    if (req.query.page && typeof req.query.page === 'string') {
        const page = parseInt(req.query.page);
        if (page < 1) {
            req.query.page = '1';
        }
    }

    // Añadir orden por defecto si no se especifica
    if (!req.query.sort && !req.query.order) {
        req.query.sort = 'timestamp';
        req.query.order = 'desc';
    }

    next();
};

/**
 * Middleware de validación de parámetros
 */
export const parameterValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Validar fechas
    if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                error: 'Fechas inválidas',
                message: 'startDate y endDate deben ser fechas válidas'
            });
        }

        if (startDate > endDate) {
            return res.status(400).json({
                error: 'Rango de fechas inválido',
                message: 'startDate debe ser anterior a endDate'
            });
        }

        // Limitar rango de fechas a 30 días máximo
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
            return res.status(400).json({
                error: 'Rango de fechas demasiado amplio',
                message: 'El rango máximo permitido es de 30 días'
            });
        }
    }

    next();
};

/**
 * Middleware de métricas de rendimiento
 */
export const performanceMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Interceptar el final de la respuesta
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Log de métricas de rendimiento
        logger.info(`[PERFORMANCE] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);

        // Añadir headers de métricas
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Request-ID', `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`);
    });

    next();
};

/**
 * Middleware de rate limiting básico
 */
export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
        const clientId = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();

        const clientData = requests.get(clientId);

        if (!clientData || now > clientData.resetTime) {
            // Nueva ventana de tiempo o cliente nuevo
            requests.set(clientId, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }

        if (clientData.count >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: `Máximo ${maxRequests} requests por ${windowMs / 1000} segundos`,
                retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
            });
        }

        clientData.count++;
        next();
    };
};

/**
 * Middleware de limpieza de caché para métodos no-GET
 */
export const cacheInvalidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
        // Interceptar el final de la respuesta
        res.on('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Invalidar caches relacionados
                const basePath = req.path.split('/')[1]; // Obtener el primer segmento de la ruta
                cacheService.delete(cacheService.generateKey('api', basePath));

                // Invalidar caches específicos según la operación
                if (req.path.includes('vehicles')) {
                    cacheService.delete('vehicles:all');
                    cacheService.delete('vehicle-stats');
                }

                if (req.path.includes('stability')) {
                    cacheService.delete('stability-general-stats');
                }
            }
        });
    }

    next();
};

export default {
    compressionMiddleware,
    cacheHeadersMiddleware,
    apiCacheMiddleware,
    queryOptimizationMiddleware,
    parameterValidationMiddleware,
    performanceMetricsMiddleware,
    rateLimitMiddleware,
    cacheInvalidationMiddleware
};
