/**
 * 🚀 CACHE MIDDLEWARE
 * 
 * Middleware para cachear responses de endpoints
 * Reduce latencia en endpoints de lectura frecuente
 * 
 * @version 1.0
 * @date 2025-11-03
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/RedisService';
import { createLogger } from '../utils/logger';

const logger = createLogger('CacheMiddleware');

interface CacheMiddlewareOptions {
    ttl?: number; // Time to live en segundos
    keyPrefix?: string; // Prefijo para las claves
    varyBy?: string[]; // Headers para variar el caché (ej: ['organizationId'])
}

/**
 * Middleware para cachear responses
 * 
 * @example
 * router.get('/api/kpis/summary',
 *   authenticate,
 *   cacheMiddleware({ ttl: 300, keyPrefix: 'kpis' }),
 *   controller.getSummary
 * );
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
    const ttl = options.ttl || 300; // Default: 5 minutos
    const keyPrefix = options.keyPrefix || 'cache';
    const varyBy = options.varyBy || [];
    
    return async (req: Request, res: Response, next: NextFunction) => {
        // Solo cachear GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        // Si Redis no está conectado, skip caché
        if (!redisService.isConnected()) {
            logger.debug('Redis no disponible, saltando caché');
            return next();
        }
        
        try {
            // Construir clave de caché
            const cacheKey = buildCacheKey(req, keyPrefix, varyBy);
            
            // Intentar obtener de caché
            const cached = await redisService.get<any>(cacheKey);
            
            if (cached) {
                logger.info('✅ Cache HIT', { key: cacheKey });
                
                // Agregar header indicando que viene de caché
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('X-Cache-Key', cacheKey);
                
                return res.json(cached);
            }
            
            logger.debug('⚠️ Cache MISS', { key: cacheKey });
            res.setHeader('X-Cache', 'MISS');
            res.setHeader('X-Cache-Key', cacheKey);
            
            // Interceptar el response para guardarlo en caché
            const originalJson = res.json.bind(res);
            
            res.json = function(data: any) {
                // Guardar en caché de forma asíncrona (no bloqueante)
                redisService.set(cacheKey, data, { ttl })
                    .then(() => {
                        logger.debug('Respuesta guardada en caché', { key: cacheKey });
                    })
                    .catch((error) => {
                        logger.error('Error guardando en caché', { key: cacheKey, error });
                    });
                
                return originalJson(data);
            };
            
            next();
            
        } catch (error: any) {
            logger.error('Error en cache middleware', { error: error.message });
            // En caso de error, continuar sin caché
            next();
        }
    };
}

/**
 * Construir clave de caché basada en request
 */
function buildCacheKey(req: Request, prefix: string, varyBy: string[]): string {
    const parts = [prefix];
    
    // Agregar path
    parts.push(req.path.replace(/\//g, ':'));
    
    // Agregar query params (ordenados para consistencia)
    const queryKeys = Object.keys(req.query).sort();
    if (queryKeys.length > 0) {
        const queryString = queryKeys
            .map(key => `${key}=${req.query[key]}`)
            .join('&');
        parts.push(queryString);
    }
    
    // Agregar headers especificados en varyBy
    for (const header of varyBy) {
        const value = req.get(header) || req.headers[header.toLowerCase()];
        if (value) {
            parts.push(`${header}:${value}`);
        }
    }
    
    // Agregar organizationId si está en el user
    const user = (req as any).user;
    if (user?.organizationId) {
        parts.push(`org:${user.organizationId}`);
    }
    
    return parts.join(':');
}

/**
 * Middleware para invalidar caché por patrón
 * 
 * Usar en endpoints que modifican datos (POST, PUT, DELETE)
 * 
 * @example
 * router.post('/api/sessions',
 *   authenticate,
 *   invalidateCachePattern('kpis:*'),
 *   controller.createSession
 * );
 */
export function invalidateCachePattern(pattern: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Ejecutar después de que el handler termine
        res.on('finish', async () => {
            // Solo invalidar si la operación fue exitosa (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const deleted = await redisService.delPattern(pattern);
                    
                    if (deleted > 0) {
                        logger.info('🗑️ Caché invalidado', { pattern, deleted });
                    }
                } catch (error: any) {
                    logger.error('Error invalidando caché', { pattern, error: error.message });
                }
            }
        });
        
        next();
    };
}

/**
 * Middleware para invalidar caché por organización
 * 
 * Invalida todo el caché relacionado con la organización del usuario
 */
export function invalidateOrgCache() {
    return async (req: Request, res: Response, next: NextFunction) => {
        res.on('finish', async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const user = (req as any).user;
                
                if (user?.organizationId) {
                    try {
                        const pattern = `*:org:${user.organizationId}*`;
                        const deleted = await redisService.delPattern(pattern);
                        
                        if (deleted > 0) {
                            logger.info('🗑️ Caché de organización invalidado', {
                                organizationId: user.organizationId,
                                deleted
                            });
                        }
                    } catch (error: any) {
                        logger.error('Error invalidando caché de organización', { error: error.message });
                    }
                }
            }
        });
        
        next();
    };
}

/**
 * Endpoint de health check para Redis
 */
export async function cacheHealthCheck(req: Request, res: Response) {
    try {
        const stats = await redisService.getStats();
        
        res.json({
            success: true,
            redis: {
                connected: stats.connected,
                dbSize: stats.dbSize,
                usedMemory: stats.usedMemory,
                hitRate: stats.hitRate ? `${stats.hitRate.toFixed(2)}%` : 'N/A'
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estado de Redis',
            message: error.message
        });
    }
}
