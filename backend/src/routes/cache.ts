/**
 * 🚀 CACHE ROUTES
 * 
 * Endpoints para gestión y monitoreo de caché
 * 
 * @version 1.0
 * @date 2025-11-03
 */

import { Router } from 'express';
import { redisService } from '../services/RedisService';
import { authenticate } from '../middleware/auth';
import { cacheHealthCheck } from '../middleware/cache';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('CacheRoutes');

/**
 * GET /api/cache/health
 * Health check de Redis y estadísticas
 */
router.get('/health', cacheHealthCheck);

/**
 * GET /api/cache/stats
 * Estadísticas detalladas de caché
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const stats = await redisService.getStats();
        
        res.json({
            success: true,
            data: {
                connected: stats.connected,
                dbSize: stats.dbSize,
                usedMemory: stats.usedMemory,
                hitRate: stats.hitRate ? `${stats.hitRate.toFixed(2)}%` : 'N/A',
                uptime: stats.connected ? 'Connected' : 'Disconnected'
            }
        });
    } catch (error: any) {
        logger.error('Error obteniendo estadísticas de caché', { error: error.message });
        
        res.status(500).json({
            success: false,
            error: 'Error obteniendo estadísticas',
            message: error.message
        });
    }
});

/**
 * DELETE /api/cache/clear
 * Limpiar toda la caché (solo ADMIN)
 */
router.delete('/clear', authenticate, async (req, res) => {
    try {
        // Verificar que el usuario es ADMIN
        const user = (req as any).user;
        
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden limpiar la caché'
            });
        }
        
        const success = await redisService.flushAll();
        
        if (success) {
            logger.info('✅ Caché limpiada por admin', { userId: user.id, userName: user.name });
            
            res.json({
                success: true,
                message: 'Caché limpiada exitosamente'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error limpiando caché'
            });
        }
        
    } catch (error: any) {
        logger.error('Error limpiando caché', { error: error.message });
        
        res.status(500).json({
            success: false,
            error: 'Error limpiando caché',
            message: error.message
        });
    }
});

/**
 * DELETE /api/cache/pattern/:pattern
 * Limpiar caché por patrón (solo ADMIN)
 */
router.delete('/pattern/:pattern', authenticate, async (req, res) => {
    try {
        const user = (req as any).user;
        
        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden limpiar la caché'
            });
        }
        
        const { pattern } = req.params;
        const deleted = await redisService.delPattern(pattern);
        
        logger.info('✅ Caché limpiada por patrón', {
            userId: user.id,
            pattern,
            deleted
        });
        
        res.json({
            success: true,
            message: `${deleted} claves eliminadas`,
            deleted
        });
        
    } catch (error: any) {
        logger.error('Error limpiando caché por patrón', { error: error.message });
        
        res.status(500).json({
            success: false,
            error: 'Error limpiando caché',
            message: error.message
        });
    }
});

/**
 * GET /api/cache/ping
 * Verificar conectividad con Redis
 */
router.get('/ping', async (req, res) => {
    try {
        const pong = await redisService.ping();
        
        res.json({
            success: true,
            connected: pong,
            message: pong ? 'PONG' : 'Redis no disponible'
        });
    } catch (error: any) {
        res.json({
            success: false,
            connected: false,
            message: error.message
        });
    }
});

export default router;

