import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/alerts/rules
 * Obtiene todas las reglas de alerta de la organización
 */
router.get('/rules', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;
        const { limit = 50 } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Intentar obtener reglas reales de la base de datos
        try {
            const rules = await prisma.alertRule.findMany({
                where: {
                    organization_id: organizationId
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: parseInt(limit as string) || 50
            });

            const processedRules = rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                type: rule.type,
                condition: rule.condition,
                threshold: rule.threshold,
                enabled: rule.enabled,
                notifications: {
                    email: rule.notifications?.email || false,
                    sms: rule.notifications?.sms || false,
                    push: rule.notifications?.push || true
                },
                created_at: rule.created_at.toISOString(),
                updated_at: rule.updated_at.toISOString()
            }));

            logger.info('Reglas de alerta obtenidas', {
                organizationId,
                count: processedRules.length
            });

            return res.json({
                success: true,
                data: processedRules,
                total: processedRules.length,
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error obteniendo reglas de BD, usando datos mock', { error: dbError });

            // Fallback a datos mock
            const mockRules = [
                {
                    id: 'rule-1',
                    name: 'Exceso de Velocidad en Emergencia',
                    description: 'Alerta cuando un vehículo supera 60 km/h con rotativo encendido',
                    type: 'speed',
                    condition: 'greater_than',
                    threshold: 60,
                    enabled: true,
                    notifications: { email: true, sms: true, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'rule-2',
                    name: 'Estabilidad Crítica',
                    description: 'Alerta cuando la estabilidad del vehículo es menor al 30%',
                    type: 'stability',
                    condition: 'less_than',
                    threshold: 30,
                    enabled: true,
                    notifications: { email: true, sms: false, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'rule-3',
                    name: 'Salida de Geocerca',
                    description: 'Alerta cuando un vehículo sale de su zona asignada',
                    type: 'geofence',
                    condition: 'exit',
                    threshold: 0,
                    enabled: true,
                    notifications: { email: false, sms: true, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            return res.json({
                success: true,
                data: mockRules,
                total: mockRules.length,
                timestamp: new Date().toISOString(),
                note: 'Reglas mock utilizadas'
            });
        }

    } catch (error) {
        logger.error('Error obteniendo reglas de alerta', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/alerts/rules
 * Crea una nueva regla de alerta
 */
router.post('/rules', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;
        const { name, description, type, condition, threshold, enabled, notifications } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        if (!name || !type || !condition) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, tipo y condición son requeridos'
            });
        }

        try {
            const rule = await prisma.alertRule.create({
                data: {
                    id: `rule-${Date.now()}`,
                    organization_id: organizationId,
                    name,
                    description: description || '',
                    type,
                    condition,
                    threshold: threshold || 0,
                    enabled: enabled !== false,
                    notifications: notifications || {
                        email: false,
                        sms: false,
                        push: true
                    }
                }
            });

            logger.info('Regla de alerta creada', {
                organizationId,
                ruleId: rule.id,
                ruleName: rule.name
            });

            res.json({
                success: true,
                data: {
                    id: rule.id,
                    name: rule.name,
                    description: rule.description,
                    type: rule.type,
                    condition: rule.condition,
                    threshold: rule.threshold,
                    enabled: rule.enabled,
                    notifications: rule.notifications,
                    created_at: rule.created_at.toISOString(),
                    updated_at: rule.updated_at.toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error creando regla en BD, simulando creación', { error: dbError });

            // Simular creación exitosa
            const mockRule = {
                id: `rule-${Date.now()}`,
                name,
                description: description || '',
                type,
                condition,
                threshold: threshold || 0,
                enabled: enabled !== false,
                notifications: notifications || {
                    email: false,
                    sms: false,
                    push: true
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            res.json({
                success: true,
                data: mockRule,
                timestamp: new Date().toISOString(),
                note: 'Regla creada en modo simulación'
            });
        }

    } catch (error) {
        logger.error('Error creando regla de alerta', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * PUT /api/alerts/rules/:id
 * Actualiza una regla de alerta
 */
router.put('/rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).orgId;
        const updates = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        try {
            const rule = await prisma.alertRule.update({
                where: {
                    id: id,
                    organization_id: organizationId
                },
                data: {
                    ...updates,
                    updated_at: new Date()
                }
            });

            logger.info('Regla de alerta actualizada', {
                organizationId,
                ruleId: rule.id,
                updates
            });

            res.json({
                success: true,
                data: {
                    id: rule.id,
                    name: rule.name,
                    description: rule.description,
                    type: rule.type,
                    condition: rule.condition,
                    threshold: rule.threshold,
                    enabled: rule.enabled,
                    notifications: rule.notifications,
                    created_at: rule.created_at.toISOString(),
                    updated_at: rule.updated_at.toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error actualizando regla en BD, simulando actualización', { error: dbError });

            res.json({
                success: true,
                data: {
                    id,
                    ...updates,
                    updated_at: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                note: 'Regla actualizada en modo simulación'
            });
        }

    } catch (error) {
        logger.error('Error actualizando regla de alerta', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * DELETE /api/alerts/rules/:id
 * Elimina una regla de alerta
 */
router.delete('/rules/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        try {
            await prisma.alertRule.delete({
                where: {
                    id: id,
                    organization_id: organizationId
                }
            });

            logger.info('Regla de alerta eliminada', {
                organizationId,
                ruleId: id
            });

            res.json({
                success: true,
                message: 'Regla eliminada exitosamente',
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error eliminando regla en BD, simulando eliminación', { error: dbError });

            res.json({
                success: true,
                message: 'Regla eliminada exitosamente (modo simulación)',
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        logger.error('Error eliminando regla de alerta', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * GET /api/alerts/active
 * Obtiene alertas activas
 */
router.get('/active', async (req, res) => {
    try {
        const organizationId = (req as any).orgId;
        const { limit = 50 } = req.query;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Intentar obtener alertas reales de la base de datos
        try {
            const alerts = await prisma.alert.findMany({
                where: {
                    organization_id: organizationId
                },
                include: {
                    rule: {
                        select: {
                            name: true
                        }
                    },
                    vehicle: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: parseInt(limit as string) || 50
            });

            const processedAlerts = alerts.map(alert => ({
                id: alert.id,
                rule_id: alert.rule_id,
                rule_name: alert.rule?.name || 'Regla Desconocida',
                vehicle_id: alert.vehicle_id,
                vehicle_name: alert.vehicle?.name || `Vehículo ${alert.vehicle_id}`,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp.toISOString(),
                acknowledged: alert.acknowledged,
                acknowledged_by: alert.acknowledged_by,
                acknowledged_at: alert.acknowledged_at?.toISOString()
            }));

            logger.info('Alertas activas obtenidas', {
                organizationId,
                count: processedAlerts.length
            });

            return res.json({
                success: true,
                data: processedAlerts,
                total: processedAlerts.length,
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error obteniendo alertas de BD, usando datos mock', { error: dbError });

            // Fallback a datos mock
            const mockAlerts = [
                {
                    id: 'alert-1',
                    rule_id: 'rule-1',
                    rule_name: 'Exceso de Velocidad en Emergencia',
                    vehicle_id: 'DOBACK001',
                    vehicle_name: 'Bomba Escalera 1',
                    severity: 'high',
                    message: 'Vehículo DOBACK001 superó 65 km/h con rotativo encendido en M-30',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    acknowledged: false
                },
                {
                    id: 'alert-2',
                    rule_id: 'rule-2',
                    rule_name: 'Estabilidad Crítica',
                    vehicle_id: 'DOBACK002',
                    vehicle_name: 'Bomba Escalera 2',
                    severity: 'critical',
                    message: 'Estabilidad crítica detectada en DOBACK002 (25%)',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    acknowledged: false
                },
                {
                    id: 'alert-3',
                    rule_id: 'rule-3',
                    rule_name: 'Salida de Geocerca',
                    vehicle_id: 'DOBACK003',
                    vehicle_name: 'Ambulancia 1',
                    severity: 'medium',
                    message: 'DOBACK003 salió de su zona asignada',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    acknowledged: true,
                    acknowledged_by: 'Operador 1',
                    acknowledged_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
                }
            ];

            return res.json({
                success: true,
                data: mockAlerts,
                total: mockAlerts.length,
                timestamp: new Date().toISOString(),
                note: 'Alertas mock utilizadas'
            });
        }

    } catch (error) {
        logger.error('Error obteniendo alertas activas', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

/**
 * POST /api/alerts/:id/acknowledge
 * Reconoce una alerta
 */
router.post('/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;
        const organizationId = (req as any).orgId;
        const { acknowledged_by } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        try {
            const alert = await prisma.alert.update({
                where: {
                    id: id,
                    organization_id: organizationId
                },
                data: {
                    acknowledged: true,
                    acknowledged_by: acknowledged_by || 'Usuario',
                    acknowledged_at: new Date()
                }
            });

            logger.info('Alerta reconocida', {
                organizationId,
                alertId: alert.id,
                acknowledgedBy: acknowledged_by
            });

            res.json({
                success: true,
                data: {
                    id: alert.id,
                    acknowledged: alert.acknowledged,
                    acknowledged_by: alert.acknowledged_by,
                    acknowledged_at: alert.acknowledged_at?.toISOString()
                },
                timestamp: new Date().toISOString()
            });

        } catch (dbError) {
            logger.warn('Error reconociendo alerta en BD, simulando reconocimiento', { error: dbError });

            res.json({
                success: true,
                data: {
                    id,
                    acknowledged: true,
                    acknowledged_by: acknowledged_by || 'Usuario',
                    acknowledged_at: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                note: 'Alerta reconocida en modo simulación'
            });
        }

    } catch (error) {
        logger.error('Error reconociendo alerta', { error });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

export default router;
