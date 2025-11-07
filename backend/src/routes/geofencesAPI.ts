/**
 * 🗺️ RUTAS DE API PARA GEOFENCES - BOMBEROS MADRID
 * Endpoints completos para gestión de geofences
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { apiCacheMiddleware, performanceMetricsMiddleware, queryOptimizationMiddleware } from '../middleware/optimizationMiddleware';
import { geofenceDatabaseService } from '../services/geofenceDatabaseService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware
router.use(authenticate);
router.use(queryOptimizationMiddleware);
router.use(performanceMetricsMiddleware);

/**
 * POST /api/geofences
 * Crear nueva geocerca
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const geofenceData = {
            ...req.body,
            organizationId
        };

        const geofence = await geofenceDatabaseService.createGeofence(geofenceData);

        res.status(201).json({
            success: true,
            data: geofence,
            message: 'Geocerca creada exitosamente'
        });
    } catch (error) {
        logger.error('Error creando geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences
 * Obtener geocercas con filtros
 */
router.get('/', apiCacheMiddleware(60000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const {
            enabled,
            type,
            tag,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        const query = {
            organizationId,
            enabled: enabled ? enabled === 'true' : undefined,
            type: type as string,
            tag: tag as string,
            search: search as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const result = await geofenceDatabaseService.getGeofences(query);

        res.json({
            success: true,
            data: result.geofences,
            pagination: {
                total: result.total,
                limit: query.limit,
                offset: query.offset,
                hasMore: result.hasMore
            }
        });
    } catch (error) {
        logger.error('Error obteniendo geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/:id
 * Obtener geocerca específica
 */
router.get('/:id', apiCacheMiddleware(300000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { id } = req.params;

        const geofence = await geofenceDatabaseService.getGeofenceById(id, organizationId);

        if (!geofence) {
            return res.status(404).json({
                success: false,
                error: 'Geocerca no encontrada'
            });
        }

        res.json({
            success: true,
            data: geofence
        });
    } catch (error) {
        logger.error('Error obteniendo geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/geofences/:id
 * Actualizar geocerca
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { id } = req.params;

        const geofence = await geofenceDatabaseService.updateGeofence(id, organizationId, req.body);

        res.json({
            success: true,
            data: geofence,
            message: 'Geocerca actualizada exitosamente'
        });
    } catch (error) {
        logger.error('Error actualizando geocerca:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/geofences/:id
 * Eliminar geocerca
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { id } = req.params;

        await geofenceDatabaseService.deleteGeofence(id, organizationId);

        res.json({
            success: true,
            message: 'Geocerca eliminada exitosamente'
        });
    } catch (error) {
        logger.error('Error eliminando geocerca:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/:id/events
 * Obtener eventos de una geocerca
 */
router.get('/:id/events', apiCacheMiddleware(30000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { id } = req.params;
        const {
            vehicleId,
            type,
            startDate,
            endDate,
            limit = 100,
            offset = 0
        } = req.query;

        const filters = {
            geofenceId: id,
            vehicleId: vehicleId as string,
            organizationId,
            type: type as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        };

        const result = await geofenceDatabaseService.getGeofenceEvents(filters);

        res.json({
            success: true,
            data: result.events,
            pagination: {
                total: result.total,
                limit: filters.limit,
                offset: filters.offset,
                hasMore: result.hasMore
            }
        });
    } catch (error) {
        logger.error('Error obteniendo eventos de geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofences/:id/events
 * Crear evento de geocerca
 */
router.post('/:id/events', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { id } = req.params;

        const eventData = {
            geofenceId: id,
            organizationId,
            ...req.body
        };

        const event = await geofenceDatabaseService.createGeofenceEvent(eventData);

        res.status(201).json({
            success: true,
            data: event,
            message: 'Evento de geocerca creado exitosamente'
        });
    } catch (error) {
        logger.error('Error creando evento de geocerca:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofences/check-vehicle
 * Verificar si un vehículo está dentro de geocercas
 */
router.post('/check-vehicle', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { vehicleId, latitude, longitude } = req.body;

        if (!vehicleId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'vehicleId, latitude y longitude son requeridos'
            });
        }

        const result = await geofenceDatabaseService.checkVehicleInGeofences(
            vehicleId,
            organizationId,
            latitude,
            longitude
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        logger.error('Error verificando geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/stats/summary
 * Obtener estadísticas de geocercas
 */
router.get('/stats/summary', apiCacheMiddleware(60000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;

        const stats = await geofenceDatabaseService.getGeofenceStats(organizationId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/events
 * Obtener eventos de geocercas con filtros opcionales
 */
router.get('/events', apiCacheMiddleware(30000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { limit = 50, vehicleId, geofenceId, type } = req.query;

        const filters = {
            organizationId,
            vehicleId: vehicleId as string,
            geofenceId: geofenceId as string,
            type: type as string,
            limit: parseInt(limit as string),
            offset: 0
        };

        const result = await geofenceDatabaseService.getGeofenceEvents(filters);

        res.json({
            success: true,
            data: result.events,
            pagination: {
                total: result.total,
                hasMore: result.hasMore
            }
        });
    } catch (error) {
        logger.error('Error obteniendo eventos de geocercas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/events/recent
 * Obtener eventos recientes de todas las geocercas
 */
router.get('/events/recent', apiCacheMiddleware(30000), async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const { limit = 50 } = req.query;

        const filters = {
            organizationId,
            limit: parseInt(limit as string),
            offset: 0,
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        };

        const result = await geofenceDatabaseService.getGeofenceEvents(filters);

        res.json({
            success: true,
            data: result.events
        });
    } catch (error) {
        logger.error('Error obteniendo eventos recientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofences/performance/metrics
 * Obtener métricas de rendimiento del sistema de geocercas
 */
router.get('/performance/metrics', apiCacheMiddleware(300000), async (req: Request, res: Response) => {
    try {
        const metrics = await geofenceDatabaseService.getPerformanceMetrics();

        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        logger.error('Error obteniendo métricas de rendimiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
