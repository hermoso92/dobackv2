/**
 * 🚨 RUTAS DE ALERTAS INTELIGENTES - BOMBEROS MADRID
 * Endpoints para el sistema de alertas específico de bomberos
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { FireAlert, intelligentAlertsService } from '../services/intelligentAlertsService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/intelligent-alerts/active
 * Obtiene todas las alertas activas
 */
router.get('/active', async (req: Request, res: Response) => {
    try {
        const alerts = intelligentAlertsService.getActiveAlerts();

        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo alertas activas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/by-severity/:severity
 * Obtiene alertas por severidad
 */
router.get('/by-severity/:severity', async (req: Request, res: Response) => {
    try {
        const { severity } = req.params;
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

        if (!validSeverities.includes(severity.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Severidad inválida. Valores válidos: LOW, MEDIUM, HIGH, CRITICAL'
            });
        }

        const alerts = intelligentAlertsService.getAlertsBySeverity(severity.toUpperCase() as FireAlert['severity']);

        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            severity: severity.toUpperCase(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo alertas por severidad ${req.params.severity}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/critical
 * Obtiene alertas críticas (alias para /by-severity/CRITICAL)
 */
router.get('/critical', async (req: Request, res: Response) => {
    try {
        const alerts = intelligentAlertsService.getAlertsBySeverity('CRITICAL');

        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            severity: 'CRITICAL',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo alertas críticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/stats
 * Obtiene estadísticas de alertas
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = intelligentAlertsService.getAlertStats();
        const isMonitoring = intelligentAlertsService.isMonitoring();

        res.json({
            success: true,
            data: {
                ...stats,
                isMonitoring,
                lastUpdate: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/intelligent-alerts/acknowledge/:alertId
 * Reconoce una alerta
 */
router.post('/acknowledge/:alertId', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const user = (req as any).user;
        const acknowledgedBy = user.email || user.name || 'Usuario desconocido';

        const success = intelligentAlertsService.acknowledgeAlert(alertId, acknowledgedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Alerta reconocida exitosamente',
                acknowledgedBy,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Alerta no encontrada o ya reconocida'
            });
        }
    } catch (error) {
        logger.error(`Error reconociendo alerta ${req.params.alertId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/intelligent-alerts/start-monitoring
 * Inicia el monitoreo de alertas (solo admin)
 */
router.post('/start-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden iniciar el monitoreo de alertas'
            });
        }

        intelligentAlertsService.startMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo de alertas iniciado',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error iniciando monitoreo de alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/intelligent-alerts/stop-monitoring
 * Detiene el monitoreo de alertas (solo admin)
 */
router.post('/stop-monitoring', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                error: 'Solo administradores pueden detener el monitoreo de alertas'
            });
        }

        intelligentAlertsService.stopMonitoring();

        res.json({
            success: true,
            message: 'Monitoreo de alertas detenido',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error deteniendo monitoreo de alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/status
 * Obtiene el estado del servicio de alertas
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const isMonitoring = intelligentAlertsService.isMonitoring();
        const stats = intelligentAlertsService.getAlertStats();

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
        logger.error('Error obteniendo estado del servicio de alertas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/high-risk-zones
 * Obtiene información sobre zonas de alto riesgo
 */
router.get('/high-risk-zones', async (req: Request, res: Response) => {
    try {
        // Zonas de alto riesgo específicas de Madrid
        const highRiskZones = [
            {
                id: 'centro-historico',
                name: 'Centro Histórico',
                description: 'Zona de alto riesgo por densidad de edificios históricos',
                bounds: {
                    north: 40.4250,
                    south: 40.4050,
                    east: -3.6900,
                    west: -3.7200
                },
                riskLevel: 'HIGH',
                riskFactors: [
                    'Edificios históricos con materiales inflamables',
                    'Calles estrechas y difícil acceso',
                    'Alta densidad de población'
                ]
            },
            {
                id: 'zona-industrial-sur',
                name: 'Zona Industrial Sur',
                description: 'Zona de riesgo crítico por presencia de materiales peligrosos',
                bounds: {
                    north: 40.3800,
                    south: 40.3500,
                    east: -3.6800,
                    west: -3.7200
                },
                riskLevel: 'CRITICAL',
                riskFactors: [
                    'Almacenes de materiales peligrosos',
                    'Plantas químicas',
                    'Riesgo de explosión'
                ]
            },
            {
                id: 'barrio-salamanca',
                name: 'Barrio de Salamanca',
                description: 'Zona de riesgo medio por edificios residenciales',
                bounds: {
                    north: 40.4350,
                    south: 40.4150,
                    east: -3.6800,
                    west: -3.7000
                },
                riskLevel: 'MEDIUM',
                riskFactors: [
                    'Edificios residenciales de alta densidad',
                    'Tráfico intenso',
                    'Acceso limitado para vehículos de emergencia'
                ]
            }
        ];

        res.json({
            success: true,
            data: highRiskZones,
            count: highRiskZones.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo zonas de alto riesgo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/intelligent-alerts/vehicle/:vehicleId
 * Obtiene alertas específicas de un vehículo
 */
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
    try {
        const { vehicleId } = req.params;
        const alerts = intelligentAlertsService.getActiveAlerts()
            .filter(alert => alert.vehicleId === vehicleId.toUpperCase());

        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            vehicleId: vehicleId.toUpperCase(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo alertas del vehículo ${req.params.vehicleId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
