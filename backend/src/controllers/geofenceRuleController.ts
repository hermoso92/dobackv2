import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { GeofenceAction, GeofenceCondition, GeofenceRule, GeofenceRuleEngine } from '../services/GeofenceRuleEngine';
import { logger } from '../utils/logger';

export class GeofenceRuleController {
    private ruleEngine?: GeofenceRuleEngine;

    constructor(prisma: PrismaClient, ruleEngine?: GeofenceRuleEngine) {
        this.ruleEngine = ruleEngine;
    }

    /**
     * Crea una nueva regla de geocerca
     */
    async createRule(req: Request, res: Response): Promise<void> {
        try {
            const {
                name,
                description,
                zoneId,
                parkId,
                conditions,
                actions,
                priority = 1
            } = req.body;

            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            if (!name || !conditions || !actions) {
                res.status(400).json({
                    error: 'Datos requeridos: name, conditions, actions'
                });
                return;
            }

            // Validar condiciones
            if (!Array.isArray(conditions) || conditions.length === 0) {
                res.status(400).json({ error: 'Se requiere al menos una condición' });
                return;
            }

            // Validar acciones
            if (!Array.isArray(actions) || actions.length === 0) {
                res.status(400).json({ error: 'Se requiere al menos una acción' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // const rule = await prisma.geofenceRule.create({
            //   data: {
            //     name,
            //     description,
            //     organizationId,
            //     zoneId,
            //     parkId,
            //     conditions,
            //     actions,
            //     priority,
            //     isActive: true
            //   }
            // });

            // Crear regla temporal para demostración
            const rule: GeofenceRule = {
                id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                description,
                organizationId,
                zoneId,
                parkId,
                conditions: conditions as GeofenceCondition[],
                actions: actions as GeofenceAction[],
                isActive: true,
                priority,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            res.status(201).json({
                success: true,
                message: 'Regla creada exitosamente',
                rule
            });

            logger.info(`Regla de geocerca creada: ${name} para organización ${organizationId}`);
        } catch (error) {
            logger.error('Error creando regla de geocerca:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtiene todas las reglas de una organización
     */
    async getRules(req: Request, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // const rules = await prisma.geofenceRule.findMany({
            //   where: { organizationId },
            //   orderBy: { priority: 'desc' }
            // });

            // Por ahora, retornar array vacío
            const rules: GeofenceRule[] = [];

            res.json({
                success: true,
                rules,
                count: rules.length
            });
        } catch (error) {
            logger.error('Error obteniendo reglas:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtiene una regla específica
     */
    async getRule(req: Request, res: Response): Promise<void> {
        try {
            const { ruleId } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // const rule = await prisma.geofenceRule.findFirst({
            //   where: { 
            //     id: ruleId,
            //     organizationId 
            //   }
            // });

            // Por ahora, retornar error 404
            res.status(404).json({
                error: 'Regla no encontrada'
            });
        } catch (error) {
            logger.error('Error obteniendo regla:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Actualiza una regla existente
     */
    async updateRule(req: Request, res: Response): Promise<void> {
        try {
            const { ruleId } = req.params;
            const {
                name,
                description,
                zoneId,
                parkId,
                conditions,
                actions,
                priority,
                isActive
            } = req.body;

            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // const rule = await prisma.geofenceRule.update({
            //   where: { 
            //     id: ruleId,
            //     organizationId 
            //   },
            //   data: {
            //     name,
            //     description,
            //     zoneId,
            //     parkId,
            //     conditions,
            //     actions,
            //     priority,
            //     isActive,
            //     updatedAt: new Date()
            //   }
            // });

            res.json({
                success: true,
                message: 'Regla actualizada exitosamente',
                ruleId
            });

            logger.info(`Regla de geocerca actualizada: ${ruleId}`);
        } catch (error) {
            logger.error('Error actualizando regla:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Elimina una regla
     */
    async deleteRule(req: Request, res: Response): Promise<void> {
        try {
            const { ruleId } = req.params;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // await prisma.geofenceRule.delete({
            //   where: { 
            //     id: ruleId,
            //     organizationId 
            //   }
            // });

            res.json({
                success: true,
                message: 'Regla eliminada exitosamente'
            });

            logger.info(`Regla de geocerca eliminada: ${ruleId}`);
        } catch (error) {
            logger.error('Error eliminando regla:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Activa/desactiva una regla
     */
    async toggleRuleStatus(req: Request, res: Response): Promise<void> {
        try {
            const { ruleId } = req.params;
            const { isActive } = req.body;
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            if (typeof isActive !== 'boolean') {
                res.status(400).json({ error: 'isActive debe ser un booleano' });
                return;
            }

            // TODO: Implementar cuando se cree la tabla de reglas
            // const rule = await prisma.geofenceRule.update({
            //   where: { 
            //     id: ruleId,
            //     organizationId 
            //   },
            //   data: {
            //     isActive,
            //     updatedAt: new Date()
            //   }
            // });

            res.json({
                success: true,
                message: `Regla ${isActive ? 'activada' : 'desactivada'} exitosamente`,
                ruleId,
                isActive
            });

            logger.info(`Estado de regla ${ruleId} cambiado a: ${isActive ? 'activa' : 'inactiva'}`);
        } catch (error) {
            logger.error('Error cambiando estado de regla:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Obtiene estadísticas del motor de reglas
     */
    async getRuleEngineStats(req: Request, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            const stats = this.ruleEngine.getStats();

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            logger.error('Error obteniendo estadísticas del motor de reglas:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Ejecuta limpieza del motor de reglas
     */
    async cleanupRuleEngine(req: Request, res: Response): Promise<void> {
        try {
            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            this.ruleEngine.cleanup();

            res.json({
                success: true,
                message: 'Limpieza del motor de reglas completada'
            });

            logger.info('Limpieza del motor de reglas ejecutada manualmente');
        } catch (error) {
            logger.error('Error ejecutando limpieza del motor de reglas:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Valida una regla sin guardarla
     */
    async validateRule(req: Request, res: Response): Promise<void> {
        try {
            const {
                name,
                conditions,
                actions
            } = req.body;

            const organizationId = req.user?.organizationId;

            if (!organizationId) {
                res.status(401).json({ error: 'Usuario no autenticado' });
                return;
            }

            const validationErrors: string[] = [];

            // Validar nombre
            if (!name || name.trim().length === 0) {
                validationErrors.push('El nombre es requerido');
            }

            if (name && name.length > 100) {
                validationErrors.push('El nombre no puede exceder 100 caracteres');
            }

            // Validar condiciones
            if (!Array.isArray(conditions) || conditions.length === 0) {
                validationErrors.push('Se requiere al menos una condición');
            } else {
                for (let i = 0; i < conditions.length; i++) {
                    const condition = conditions[i];
                    const conditionErrors = this.validateCondition(condition, i);
                    validationErrors.push(...conditionErrors);
                }
            }

            // Validar acciones
            if (!Array.isArray(actions) || actions.length === 0) {
                validationErrors.push('Se requiere al menos una acción');
            } else {
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    const actionErrors = this.validateAction(action, i);
                    validationErrors.push(...actionErrors);
                }
            }

            if (validationErrors.length > 0) {
                res.status(400).json({
                    success: false,
                    error: 'Regla inválida',
                    validationErrors
                });
                return;
            }

            res.json({
                success: true,
                message: 'Regla válida',
                validationErrors: []
            });
        } catch (error) {
            logger.error('Error validando regla:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    /**
     * Valida una condición individual
     */
    private validateCondition(condition: any, index: number): string[] {
        const errors: string[] = [];

        if (!condition.type) {
            errors.push(`Condición ${index + 1}: tipo es requerido`);
        }

        if (!condition.operator) {
            errors.push(`Condición ${index + 1}: operador es requerido`);
        }

        if (!condition.field) {
            errors.push(`Condición ${index + 1}: campo es requerido`);
        }

        if (condition.value === undefined || condition.value === null) {
            errors.push(`Condición ${index + 1}: valor es requerido`);
        }

        // Validar tipos específicos
        if (condition.type === 'TIME_WINDOW') {
            if (!this.isValidTimeFormat(condition.value)) {
                errors.push(`Condición ${index + 1}: formato de tiempo inválido (use HH:MM)`);
            }
            if (condition.operator === 'BETWEEN' && !this.isValidTimeFormat(condition.secondaryValue)) {
                errors.push(`Condición ${index + 1}: valor secundario de tiempo inválido para operador BETWEEN`);
            }
        }

        return errors;
    }

    /**
     * Valida una acción individual
     */
    private validateAction(action: any, index: number): string[] {
        const errors: string[] = [];

        if (!action.type) {
            errors.push(`Acción ${index + 1}: tipo es requerido`);
        }

        if (!action.target) {
            errors.push(`Acción ${index + 1}: objetivo es requerido`);
        }

        if (!action.message) {
            errors.push(`Acción ${index + 1}: mensaje es requerido`);
        }

        // Validar tipos específicos
        if (action.type === 'EMAIL' && !this.isValidEmail(action.target)) {
            errors.push(`Acción ${index + 1}: formato de email inválido`);
        }

        if (action.type === 'WEBHOOK' && !this.isValidUrl(action.target)) {
            errors.push(`Acción ${index + 1}: formato de URL inválido`);
        }

        return errors;
    }

    /**
     * Valida formato de tiempo HH:MM
     */
    private isValidTimeFormat(time: string): boolean {
        if (typeof time !== 'string') return false;
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * Valida formato de email
     */
    private isValidEmail(email: string): boolean {
        if (typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida formato de URL
     */
    private isValidUrl(url: string): boolean {
        if (typeof url !== 'string') return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
} 