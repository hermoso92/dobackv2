/**
 * 🚒 RUTAS DEL DASHBOARD DE EMERGENCIAS - BOMBEROS MADRID
 * Endpoints para el sistema de emergencias en tiempo real
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiCacheMiddleware, performanceMetricsMiddleware, queryOptimizationMiddleware } from '../middleware/optimizationMiddleware';
import { optimizedVehicleService } from '../services/optimizedVehicleService';
import { realTimeGPSService } from '../services/realTimeGPSService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación y optimización
router.use(authenticate);
router.use(queryOptimizationMiddleware);
router.use(performanceMetricsMiddleware);

/**
 * GET /api/emergency-dashboard/vehicles
 * Obtiene todos los vehículos con su estado actual
 */
router.get('/vehicles', apiCacheMiddleware(30000), async (req: Request, res: Response) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const vehicles = await optimizedVehicleService.getAllVehicles(forceRefresh);

        res.json({
            success: true,
            data: vehicles,
            timestamp: new Date().toISOString(),
            count: vehicles.length,
            cached: !forceRefresh
        });
    } catch (error) {
        logger.error('Error obteniendo vehículos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-dashboard/vehicle/:vehicleId
 * Obtiene un vehículo específico
 */
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const vehicle = realTimeGPSService.getVehicle(vehicleId);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehículo no encontrado'
            });
        }

        res.json({
            success: true,
            data: vehicle,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo vehículo ${req.params.vehicleId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-dashboard/emergencies
 * Obtiene vehículos en estado de emergencia
 */
router.get('/emergencies', async (req: Request, res: Response) => {
    try {
        const emergencyVehicles = realTimeGPSService.getEmergencyVehicles();

        res.json({
            success: true,
            data: emergencyVehicles,
            count: emergencyVehicles.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo emergencias:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-dashboard/available
 * Obtiene vehículos disponibles
 */
router.get('/available', async (req: Request, res: Response) => {
    try {
        const availableVehicles = realTimeGPSService.getAvailableVehicles();

        res.json({
            success: true,
            data: availableVehicles,
            count: availableVehicles.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo vehículos disponibles:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-dashboard/stats
 * Obtiene estadísticas generales del dashboard
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = realTimeGPSService.getStats();
        const isMonitoring = realTimeGPSService.isMonitoring();

        res.json({
            success: true,
            data: {
                ...stats,
                isMonitoring,
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-dashboard/force-update
 * Fuerza una actualización inmediata de todos los vehículos
 */
router.post('/force-update', async (req: Request, res: Response) => {
    try {
        realTimeGPSService.forceUpdate();

        res.json({
            success: true,
            message: 'Actualización forzada iniciada',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error en actualización forzada:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-dashboard/start-monitoring
 * Inicia el monitoreo GPS (solo admin)
 */
router.post('/start-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden iniciar el monitoreo'
            });
        }

        realTimeGPSService.startMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo GPS iniciado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error iniciando monitoreo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/emergency-dashboard/stop-monitoring
 * Detiene el monitoreo GPS (solo admin)
 */
router.post('/stop-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden detener el monitoreo'
            });
        }

        realTimeGPSService.stopMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo GPS detenido',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error deteniendo monitoreo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/emergency-dashboard/status
 * Obtiene el estado del servicio de monitoreo
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const isMonitoring = realTimeGPSService.isMonitoring();
        const stats = realTimeGPSService.getStats();

        res.json({
            success: true,
            data: {
                isMonitoring,
                stats,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estado del servicio:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * WebSocket endpoint para actualizaciones en tiempo real
 * GET /api/emergency-dashboard/ws
 */
router.get('/ws', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'WebSocket endpoint - implementar con Socket.IO',
        endpoint: '/socket.io/',
        timestamp: new Date().toISOString()
    });
});

export default router;
