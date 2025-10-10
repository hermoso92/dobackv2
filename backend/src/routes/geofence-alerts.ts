/**
 * 🚨 RUTAS DE ALERTAS DE GEOCERCAS - BOMBEROS MADRID
 * API REST para gestión de alertas por entrada/salida de parques
 */

import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { geofenceAlertService } from '../services/GeofenceAlertService';
import { logger } from '../utils/logger';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(requireAuth);

/**
 * GET /api/geofence-alerts
 * Obtener alertas activas de geocercas
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const limit = parseInt(req.query.limit as string) || 50;
        const severity = req.query.severity as string;

        let alerts = await geofenceAlertService.getActiveAlerts(organizationId, limit);

        // Filtrar por severidad si se especifica
        if (severity) {
            alerts = alerts.filter(alert => alert.severity.toLowerCase() === severity.toLowerCase());
        }

        res.json({
            success: true,
            data: alerts,
            count: alerts.length
        });
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error obteniendo alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofence-alerts/:id/acknowledge
 * Marcar alerta como reconocida
 */
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const acknowledgedBy = (req as any).user.id;

        const success = await geofenceAlertService.acknowledgeAlert(id, acknowledgedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Alerta reconocida exitosamente'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'No se pudo reconocer la alerta'
            });
        }
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error reconociendo alerta:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofence-alerts/config
 * Obtener configuración de alertas
 */
router.get('/config', async (req: Request, res: Response) => {
    try {
        const config = geofenceAlertService.getConfig();

        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error obteniendo configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/geofence-alerts/config
 * Actualizar configuración de alertas
 */
router.put('/config', async (req: Request, res: Response) => {
    try {
        const config = req.body;

        // Validar configuración
        if (typeof config.longStayOutsideHours !== 'number' || config.longStayOutsideHours < 1) {
            return res.status(400).json({
                success: false,
                error: 'longStayOutsideHours debe ser un número mayor a 0'
            });
        }

        if (typeof config.longStayInsideHours !== 'number' || config.longStayInsideHours < 1) {
            return res.status(400).json({
                success: false,
                error: 'longStayInsideHours debe ser un número mayor a 0'
            });
        }

        geofenceAlertService.updateConfig(config);

        res.json({
            success: true,
            message: 'Configuración actualizada exitosamente',
            data: geofenceAlertService.getConfig()
        });
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error actualizando configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/geofence-alerts/check-long-stay
 * Ejecutar verificación manual de permanencia larga
 */
router.post('/check-long-stay', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;

        await geofenceAlertService.checkLongStayOutside(organizationId);

        res.json({
            success: true,
            message: 'Verificación de permanencia larga ejecutada exitosamente'
        });
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error ejecutando verificación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/geofence-alerts/stats
 * Obtener estadísticas de alertas
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user.organizationId;
        const alerts = await geofenceAlertService.getActiveAlerts(organizationId, 1000);

        const stats = {
            total: alerts.length,
            byType: {
                ENTRY: alerts.filter(a => a.type === 'ENTRY').length,
                EXIT: alerts.filter(a => a.type === 'EXIT').length,
                LONG_STAY_OUTSIDE: alerts.filter(a => a.type === 'LONG_STAY_OUTSIDE').length,
                LONG_STAY_INSIDE: alerts.filter(a => a.type === 'LONG_STAY_INSIDE').length
            },
            bySeverity: {
                LOW: alerts.filter(a => a.severity === 'LOW').length,
                MEDIUM: alerts.filter(a => a.severity === 'MEDIUM').length,
                HIGH: alerts.filter(a => a.severity === 'HIGH').length,
                CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length
            },
            acknowledged: alerts.filter(a => a.acknowledged).length,
            unacknowledged: alerts.filter(a => !a.acknowledged).length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('[GeofenceAlertAPI] Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
