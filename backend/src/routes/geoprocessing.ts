import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/auth';
import { requireOrganizationAccess, validateGeofenceAccess } from '../middleware/organizationAccess';
import { osrmService } from '../services/geoprocessing/OSRMService';
import { routeProcessorService } from '../services/geoprocessing/RouteProcessorService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/geoprocessing/health
 * Healthcheck público de servicios de geoprocesamiento
 */
router.get('/health', async (req, res) => {
    try {
        const osrmHealthy = await osrmService.healthCheck();
        const postgisHealthy = await checkPostGIS();

        const status = osrmHealthy && postgisHealthy ? 'healthy' : 'degraded';

        res.status(status === 'healthy' ? 200 : 503).json({
            status,
            services: {
                osrm: osrmHealthy ? 'healthy' : 'unhealthy',
                postgis: postgisHealthy ? 'healthy' : 'unhealthy'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        logger.error('Error en health check:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/geoprocessing/session/:id
 * Procesar geoprocesamiento de una sesión
 */
router.post('/session/:id', authenticate, requireOrganizationAccess, async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = res.locals.organizationId as string;

        // Verificar que la sesión pertenece a la organización
        const session = await prisma.session.findFirst({
            where: { id, organizationId },
            select: { id: true }
        });

        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada' });
        }

        logger.info(`Iniciando geoprocesamiento manual para sesión ${id}`);

        const result = await routeProcessorService.processSession(id);

        res.json({
            success: true,
            data: result
        });

    } catch (error: any) {
        logger.error('Error procesando sesión:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/geofences/:id/events
 * Obtener eventos de una geocerca específica
 */
router.get(
    '/geofences/:id/events',
    authenticate,
    requireOrganizationAccess,
    validateGeofenceAccess(prisma),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { startDate, endDate, limit = '1000' } = req.query;
            const organizationId = res.locals.organizationId as string;

            const events = await prisma.geofenceEvent.findMany({
                where: {
                    geofenceId: id,
                    organizationId,
                    ...(startDate && endDate ? {
                        timestamp: {
                            gte: new Date(startDate as string),
                            lte: new Date(endDate as string)
                        }
                    } : {})
                },
                orderBy: { timestamp: 'desc' },
                take: parseInt(limit as string, 10)
            });

            res.json({
                success: true,
                count: events.length,
                data: events
            });

        } catch (error: any) {
            logger.error('Error obteniendo eventos de geocerca:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

/**
 * Helper: Verificar PostGIS
 */
async function checkPostGIS(): Promise<boolean> {
    try {
        const result = await prisma.$queryRaw<Array<{ version: string }>>`
            SELECT PostGIS_version() as version
        `;
        return result.length > 0;
    } catch (error) {
        return false;
    }
}

export default router;
















