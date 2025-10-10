/**
 * 📈 RUTAS DE ESCALAMIENTO AUTOMÁTICO DE ALERTAS - BOMBEROS MADRID
 * Endpoints para el sistema de escalamiento automático de alertas
 */

import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { alertEscalationService } from '../services/alertEscalationService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * POST /api/alert-escalation/process
 * Procesa una nueva alerta para escalamiento
 */
router.post('/process', async (req: Request, res: Response) => {
    try {
        const {
            id,
            type,
            severity,
            title,
            description,
            zone,
            vehicleId,
            timestamp
        } = req.body;

        // Validar campos requeridos
        if (!id || !type || !severity || !title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: id, type, severity, title, description'
            });
        }

        // Validar tipos y severidades
        const validTypes = ['EMERGENCY', 'ALERT', 'WARNING', 'INFO', 'CRITICAL'];
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Tipo inválido. Valores válidos: ${validTypes.join(', ')}`
            });
        }

        if (!validSeverities.includes(severity)) {
            return res.status(400).json({
                success: false,
                error: `Severidad inválida. Valores válidos: ${validSeverities.join(', ')}`
            });
        }

        const alertData = {
            id,
            type,
            severity,
            title,
            description,
            zone,
            vehicleId,
            timestamp: timestamp ? new Date(timestamp) : new Date()
        };

        const escalatedAlert = await alertEscalationService.processAlert(alertData);

        if (escaledAlert) {
            res.status(201).json({
                success: true,
                data: escalatedAlert,
                message: 'Alerta procesada para escalamiento exitosamente',
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                data: null,
                message: 'Alerta procesada pero no requiere escalamiento',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Error procesando alerta para escalamiento:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/escalations
 * Obtiene todos los escalamientos
 */
router.get('/escalations', async (req: Request, res: Response) => {
    try {
        const {
            status,
            ruleId,
            originalAlertId,
            limit = '50',
            offset = '0'
        } = req.query;

        let escalations = alertEscalationService.getAllEscalations();

        // Filtrar por estado
        if (status && typeof status === 'string') {
            escalations = escalations.filter(e => e.status === status.toUpperCase());
        }

        // Filtrar por regla
        if (ruleId && typeof ruleId === 'string') {
            escalations = escalations.filter(e => e.ruleId === ruleId);
        }

        // Filtrar por alerta original
        if (originalAlertId && typeof originalAlertId === 'string') {
            escalations = escalations.filter(e => e.originalAlertId === originalAlertId);
        }

        // Ordenar por fecha de creación (más recientes primero)
        escalations.sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());

        // Aplicar paginación
        const limitNum = parseInt(limit as string);
        const offsetNum = parseInt(offset as string);
        const paginatedEscalations = escalations.slice(offsetNum, offsetNum + limitNum);

        res.json({
            success: true,
            data: paginatedEscalations,
            pagination: {
                total: escalations.length,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + limitNum < escalations.length
            },
            filters: {
                status: status || 'all',
                ruleId: ruleId || 'all',
                originalAlertId: originalAlertId || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo escalamientos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/escalations/:escalationId
 * Obtiene un escalamiento específico
 */
router.get('/escalations/:escalationId', async (req: Request, res: Response) => {
    try {
        const { escalationId } = req.params;
        const escalation = alertEscalationService.getEscalation(escalationId);

        if (!escalation) {
            return res.status(404).json({
                success: false,
                error: 'Escalamiento no encontrado'
            });
        }

        res.json({
            success: true,
            data: escalation,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo escalamiento ${req.params.escalationId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/alert-escalation/escalations/:escalationId/acknowledge
 * Reconoce un escalamiento
 */
router.post('/escalations/:escalationId/acknowledge', async (req: Request, res: Response) => {
    try {
        const { escalationId } = req.params;
        const user = (req as any).user;
        const acknowledgedBy = user.email || user.name || 'Usuario desconocido';

        const success = alertEscalationService.acknowledgeEscalation(escalationId, acknowledgedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Escalamiento reconocido exitosamente',
                acknowledgedBy,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Escalamiento no encontrado o no está activo'
            });
        }
    } catch (error) {
        logger.error(`Error reconociendo escalamiento ${req.params.escalationId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/alert-escalation/escalations/:escalationId/resolve
 * Resuelve un escalamiento
 */
router.post('/escalations/:escalationId/resolve', async (req: Request, res: Response) => {
    try {
        const { escalationId } = req.params;
        const user = (req as any).user;
        const resolvedBy = user.email || user.name || 'Usuario desconocido';

        const success = alertEscalationService.resolveEscalation(escalationId, resolvedBy);

        if (success) {
            res.json({
                success: true,
                message: 'Escalamiento resuelto exitosamente',
                resolvedBy,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Escalamiento no encontrado o ya está resuelto'
            });
        }
    } catch (error) {
        logger.error(`Error resolviendo escalamiento ${req.params.escalationId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/rules
 * Obtiene todas las reglas de escalamiento
 */
router.get('/rules', async (req: Request, res: Response) => {
    try {
        const { active, priority } = req.query;

        let rules = alertEscalationService.getAllRules();

        // Filtrar por estado activo
        if (active !== undefined) {
            const isActive = active === 'true';
            rules = rules.filter(r => r.isActive === isActive);
        }

        // Filtrar por prioridad
        if (priority && typeof priority === 'string') {
            const priorityNum = parseInt(priority);
            if (!isNaN(priorityNum)) {
                rules = rules.filter(r => r.priority === priorityNum);
            }
        }

        // Ordenar por prioridad (menor número = mayor prioridad)
        rules.sort((a, b) => a.priority - b.priority);

        res.json({
            success: true,
            data: rules,
            filters: {
                active: active || 'all',
                priority: priority || 'all'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo reglas de escalamiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/rules/:ruleId
 * Obtiene una regla específica
 */
router.get('/rules/:ruleId', async (req: Request, res: Response) => {
    try {
        const { ruleId } = req.params;
        const rule = alertEscalationService.getRule(ruleId);

        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'Regla de escalamiento no encontrada'
            });
        }

        res.json({
            success: true,
            data: rule,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo regla ${req.params.ruleId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/stats
 * Obtiene estadísticas del servicio
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = alertEscalationService.getStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo estadísticas de escalamiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/status
 * Obtiene el estado del servicio
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const stats = alertEscalationService.getStats();
        const rules = alertEscalationService.getAllRules();
        const escalations = alertEscalationService.getAllEscalations();

        res.json({
            success: true,
            data: {
                isRunning: true, // El servicio siempre está corriendo
                stats,
                activeRules: rules.filter(r => r.isActive).length,
                totalRules: rules.length,
                activeEscalations: escalations.filter(e => e.status === 'ACTIVE').length,
                totalEscalations: escalations.length,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error obteniendo estado del servicio de escalamiento:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/active
 * Obtiene escalamientos activos
 */
router.get('/active', async (req: Request, res: Response) => {
    try {
        const escalations = alertEscalationService.getAllEscalations()
            .filter(e => e.status === 'ACTIVE')
            .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());

        res.json({
            success: true,
            data: escalations,
            count: escalations.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo escalamientos activos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/critical
 * Obtiene escalamientos críticos
 */
router.get('/critical', async (req: Request, res: Response) => {
    try {
        const escalations = alertEscalationService.getAllEscalations()
            .filter(e => e.status === 'ACTIVE' && e.metadata.severity === 'CRITICAL')
            .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());

        res.json({
            success: true,
            data: escalations,
            count: escalations.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error obteniendo escalamientos críticos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alert-escalation/history/:escalationId
 * Obtiene el historial de un escalamiento
 */
router.get('/history/:escalationId', async (req: Request, res: Response) => {
    try {
        const { escalationId } = req.params;
        const escalation = alertEscalationService.getEscalation(escalationId);

        if (!escalation) {
            return res.status(404).json({
                success: false,
                error: 'Escalamiento no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                escalationId,
                history: escalation.escalationHistory,
                metadata: escalation.metadata,
                currentLevel: escalation.currentLevel,
                maxLevel: escalation.maxLevel,
                status: escalation.status
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error(`Error obteniendo historial del escalamiento ${req.params.escalationId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/alert-escalation/test
 * Prueba el sistema de escalamiento con una alerta de ejemplo
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        const { severity = 'CRITICAL', type = 'EMERGENCY', zone = 'centro-historico' } = req.body;

        const testAlert = {
            id: `test_alert_${Date.now()}`,
            type,
            severity,
            title: 'Prueba de Escalamiento Automático',
            description: 'Esta es una alerta de prueba para verificar el sistema de escalamiento',
            zone,
            vehicleId: 'DOBACK027',
            timestamp: new Date()
        };

        const escalatedAlert = await alertEscalationService.processAlert(testAlert);

        if (escalatedAlert) {
            res.status(201).json({
                success: true,
                data: escalatedAlert,
                message: 'Alerta de prueba procesada para escalamiento exitosamente',
                testAlert,
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                success: true,
                data: null,
                message: 'Alerta de prueba procesada pero no requiere escalamiento',
                testAlert,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Error procesando alerta de prueba:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Error interno del servidor'
        });
    }
});

export default router;
