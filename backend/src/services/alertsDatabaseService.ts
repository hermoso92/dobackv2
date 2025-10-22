/**
 * 🚨 SERVICIO DE BASE DE DATOS PARA ALERTAS - BOMBEROS MADRID
 * Servicio completo para gestión de alertas con base de datos
 */


import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';



interface AlertData {
    id?: string;
    type: 'EMERGENCY_RESPONSE' | 'VEHICLE_OFFLINE' | 'HIGH_SPEED' | 'GEOFENCE_VIOLATION' | 'MAINTENANCE_DUE' | 'CRITICAL_EVENT';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    vehicleId?: string;
    vehicleName?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    organizationId: string;
    acknowledged?: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    escalationLevel?: number;
    autoResolved?: boolean;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}

interface AlertRuleData {
    id?: string;
    name: string;
    description?: string;
    type: string;
    conditions: any;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    enabled: boolean;
    organizationId: string;
    escalationConfig?: any;
    notificationConfig?: any;
}

interface AlertQuery {
    organizationId: string;
    type?: string;
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    vehicleId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

class AlertsDatabaseService extends EventEmitter {
    /**
     * Crear nueva alerta
     */
    async createAlert(data: AlertData): Promise<any> {
        try {
            logger.info(`[AlertsDB] Creando alerta: ${data.title}`);

            const alert = await prisma.alert.create({
                data: {
                    type: data.type,
                    severity: data.severity,
                    title: data.title,
                    description: data.description,
                    vehicleId: data.vehicleId,
                    vehicleName: data.vehicleName,
                    location: data.location,
                    organizationId: data.organizationId,
                    acknowledged: data.acknowledged || false,
                    acknowledgedBy: data.acknowledgedBy,
                    acknowledgedAt: data.acknowledgedAt,
                    escalationLevel: data.escalationLevel || 0,
                    autoResolved: data.autoResolved || false,
                    resolvedAt: data.resolvedAt,
                    metadata: data.metadata
                }
            });

            logger.info(`[AlertsDB] Alerta creada: ${alert.id}`);
            this.emit('alertCreated', alert);
            return alert;
        } catch (error) {
            logger.error(`[AlertsDB] Error creando alerta:`, error);
            throw error;
        }
    }

    /**
     * Obtener alerta por ID
     */
    async getAlertById(id: string, organizationId: string): Promise<any | null> {
        try {
            const alert = await prisma.alert.findFirst({
                where: {
                    id,
                    organizationId
                }
            });

            return alert;
        } catch (error) {
            logger.error(`[AlertsDB] Error obteniendo alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener alertas con filtros
     */
    async getAlerts(query: AlertQuery): Promise<{
        alerts: any[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const {
                organizationId,
                type,
                severity,
                acknowledged,
                resolved,
                vehicleId,
                startDate,
                endDate,
                limit = 50,
                offset = 0
            } = query;

            const where: any = {
                organizationId
            };

            if (type) {
                where.type = type;
            }

            if (severity) {
                where.severity = severity;
            }

            if (acknowledged !== undefined) {
                where.acknowledged = acknowledged;
            }

            if (resolved !== undefined) {
                if (resolved) {
                    where.resolvedAt = { not: null };
                } else {
                    where.resolvedAt = null;
                }
            }

            if (vehicleId) {
                where.vehicleId = vehicleId;
            }

            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt.gte = startDate;
                }
                if (endDate) {
                    where.createdAt.lte = endDate;
                }
            }

            const [alerts, total] = await Promise.all([
                prisma.alert.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset
                }),
                prisma.alert.count({ where })
            ]);

            return {
                alerts,
                total,
                hasMore: offset + alerts.length < total
            };
        } catch (error) {
            logger.error(`[AlertsDB] Error obteniendo alertas:`, error);
            throw error;
        }
    }

    /**
     * Actualizar alerta
     */
    async updateAlert(id: string, organizationId: string, data: Partial<AlertData>): Promise<any> {
        try {
            logger.info(`[AlertsDB] Actualizando alerta: ${id}`);

            const alert = await prisma.alert.updateMany({
                where: {
                    id,
                    organizationId
                },
                data: {
                    ...(data.title && { title: data.title }),
                    ...(data.description && { description: data.description }),
                    ...(data.severity && { severity: data.severity }),
                    ...(data.acknowledged !== undefined && { acknowledged: data.acknowledged }),
                    ...(data.acknowledgedBy && { acknowledgedBy: data.acknowledgedBy }),
                    ...(data.acknowledgedAt && { acknowledgedAt: data.acknowledgedAt }),
                    ...(data.escalationLevel !== undefined && { escalationLevel: data.escalationLevel }),
                    ...(data.autoResolved !== undefined && { autoResolved: data.autoResolved }),
                    ...(data.resolvedAt && { resolvedAt: data.resolvedAt }),
                    ...(data.metadata && { metadata: data.metadata })
                }
            });

            if (alert.count === 0) {
                throw new Error('Alerta no encontrada');
            }

            const updatedAlert = await this.getAlertById(id, organizationId);
            this.emit('alertUpdated', updatedAlert);
            return updatedAlert;
        } catch (error) {
            logger.error(`[AlertsDB] Error actualizando alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Reconocer alerta
     */
    async acknowledgeAlert(id: string, organizationId: string, acknowledgedBy: string): Promise<any> {
        try {
            return this.updateAlert(id, organizationId, {
                acknowledged: true,
                acknowledgedBy,
                acknowledgedAt: new Date()
            });
        } catch (error) {
            logger.error(`[AlertsDB] Error reconociendo alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Resolver alerta
     */
    async resolveAlert(id: string, organizationId: string, resolvedBy?: string): Promise<any> {
        try {
            return this.updateAlert(id, organizationId, {
                autoResolved: false,
                resolvedAt: new Date(),
                acknowledgedBy: resolvedBy
            });
        } catch (error) {
            logger.error(`[AlertsDB] Error resolviendo alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Escalar alerta
     */
    async escalateAlert(id: string, organizationId: string, escalationLevel: number): Promise<any> {
        try {
            return this.updateAlert(id, organizationId, {
                escalationLevel
            });
        } catch (error) {
            logger.error(`[AlertsDB] Error escalando alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Eliminar alerta
     */
    async deleteAlert(id: string, organizationId: string): Promise<boolean> {
        try {
            logger.info(`[AlertsDB] Eliminando alerta: ${id}`);

            const result = await prisma.alert.deleteMany({
                where: {
                    id,
                    organizationId
                }
            });

            if (result.count === 0) {
                throw new Error('Alerta no encontrada');
            }

            this.emit('alertDeleted', { id, organizationId });
            return true;
        } catch (error) {
            logger.error(`[AlertsDB] Error eliminando alerta ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear regla de alerta
     */
    async createAlertRule(data: AlertRuleData): Promise<any> {
        try {
            logger.info(`[AlertsDB] Creando regla de alerta: ${data.name}`);

            const rule = await prisma.alertRule.create({
                data: {
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    conditions: data.conditions,
                    severity: data.severity,
                    enabled: data.enabled,
                    organizationId: data.organizationId,
                    escalationConfig: data.escalationConfig,
                    notificationConfig: data.notificationConfig
                }
            });

            logger.info(`[AlertsDB] Regla de alerta creada: ${rule.id}`);
            this.emit('alertRuleCreated', rule);
            return rule;
        } catch (error) {
            logger.error(`[AlertsDB] Error creando regla de alerta:`, error);
            throw error;
        }
    }

    /**
     * Obtener reglas de alerta
     */
    async getAlertRules(organizationId: string, enabled?: boolean): Promise<any[]> {
        try {
            const where: any = { organizationId };
            if (enabled !== undefined) {
                where.enabled = enabled;
            }

            const rules = await prisma.alertRule.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });

            return rules;
        } catch (error) {
            logger.error(`[AlertsDB] Error obteniendo reglas de alerta:`, error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de alertas
     */
    async getAlertStats(organizationId: string): Promise<{
        totalAlerts: number;
        unacknowledgedAlerts: number;
        criticalAlerts: number;
        alertsByType: Record<string, number>;
        alertsBySeverity: Record<string, number>;
        alertsLast24h: number;
        avgResolutionTime: number;
        escalationRate: number;
    }> {
        try {
            const [
                totalAlerts,
                unacknowledgedAlerts,
                criticalAlerts,
                alertsByType,
                alertsBySeverity,
                alertsLast24h,
                resolvedAlerts
            ] = await Promise.all([
                prisma.alert.count({
                    where: { organizationId }
                }),
                prisma.alert.count({
                    where: {
                        organizationId,
                        acknowledged: false,
                        resolvedAt: null
                    }
                }),
                prisma.alert.count({
                    where: {
                        organizationId,
                        severity: 'CRITICAL',
                        resolvedAt: null
                    }
                }),
                prisma.alert.groupBy({
                    by: ['type'],
                    where: { organizationId },
                    _count: { type: true }
                }),
                prisma.alert.groupBy({
                    by: ['severity'],
                    where: { organizationId },
                    _count: { severity: true }
                }),
                prisma.alert.count({
                    where: {
                        organizationId,
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                prisma.alert.findMany({
                    where: {
                        organizationId,
                        resolvedAt: { not: null }
                    },
                    select: {
                        createdAt: true,
                        resolvedAt: true
                    }
                })
            ]);

            // Calcular tiempo promedio de resolución
            const avgResolutionTime = resolvedAlerts.length > 0
                ? resolvedAlerts.reduce((sum, alert) => {
                    const resolutionTime = alert.resolvedAt!.getTime() - alert.createdAt.getTime();
                    return sum + resolutionTime;
                }, 0) / resolvedAlerts.length / (1000 * 60) // Convertir a minutos
                : 0;

            // Calcular tasa de escalamiento
            const escalatedAlerts = await prisma.alert.count({
                where: {
                    organizationId,
                    escalationLevel: { gt: 0 }
                }
            });

            const escalationRate = totalAlerts > 0 ? (escalatedAlerts / totalAlerts) * 100 : 0;

            return {
                totalAlerts,
                unacknowledgedAlerts,
                criticalAlerts,
                alertsByType: alertsByType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {} as Record<string, number>),
                alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
                    acc[item.severity] = item._count.severity;
                    return acc;
                }, {} as Record<string, number>),
                alertsLast24h,
                avgResolutionTime,
                escalationRate
            };
        } catch (error) {
            logger.error(`[AlertsDB] Error obteniendo estadísticas:`, error);
            throw error;
        }
    }

    /**
     * Obtener métricas de rendimiento
     */
    async getPerformanceMetrics(): Promise<{
        totalAlerts: number;
        totalRules: number;
        avgAlertsPerHour: number;
        lastActivity: Date | null;
    }> {
        try {
            const [totalAlerts, totalRules, lastAlert] = await Promise.all([
                prisma.alert.count(),
                prisma.alertRule.count(),
                prisma.alert.findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true }
                })
            ]);

            // Calcular promedio de alertas por hora en las últimas 24 horas
            const alertsLast24h = await prisma.alert.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            });

            const avgAlertsPerHour = alertsLast24h / 24;

            return {
                totalAlerts,
                totalRules,
                avgAlertsPerHour,
                lastActivity: lastAlert?.createdAt || null
            };
        } catch (error) {
            logger.error(`[AlertsDB] Error obteniendo métricas:`, error);
            throw error;
        }
    }

    /**
     * Limpiar alertas antiguas
     */
    async cleanupOldAlerts(daysToKeep: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

            const result = await prisma.alert.deleteMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    resolvedAt: { not: null }
                }
            });

            logger.info(`[AlertsDB] Limpieza completada: ${result.count} alertas eliminadas`);
            return result.count;
        } catch (error) {
            logger.error(`[AlertsDB] Error en limpieza de alertas:`, error);
            throw error;
        }
    }
}

export const alertsDatabaseService = new AlertsDatabaseService();
export default alertsDatabaseService;
