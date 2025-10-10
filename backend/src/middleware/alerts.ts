import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from './error';

interface AlertConfig {
    vehicleId?: number;
    organizationId?: number;
    type: 'stability' | 'maintenance' | 'system';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    threshold?: number;
}

interface AlertRule {
    id: number;
    type: string;
    condition: string;
    threshold: number;
    severity: string;
    message: string;
}

// Evaluar condición de alerta
const evaluateAlertCondition = (condition: string, value: number, threshold: number): boolean => {
    switch (condition) {
        case '>':
            return value > threshold;
        case '<':
            return value < threshold;
        case '>=':
            return value >= threshold;
        case '<=':
            return value <= threshold;
        case '=':
            return value === threshold;
        default:
            return false;
    }
};

// Procesar alerta de estabilidad
const processStabilityAlert = async (data: any, rules: AlertRule[]) => {
    const alerts = [];

    for (const rule of rules) {
        const value = data[rule.type.toLowerCase()];
        if (value !== undefined && evaluateAlertCondition(rule.condition, value, rule.threshold)) {
            alerts.push({
                type: EventType.STABILITY_WARNING,
                severity: rule.severity as EventSeverity,
                description: rule.message.replace('{value}', value.toFixed(2)),
                vehicleId: data.vehicleId,
                organizationId: data.organizationId
            });
        }
    }

    return alerts;
};

// Procesar alerta de mantenimiento
const processMaintenanceAlert = async (data: any, rules: AlertRule[]) => {
    const alerts = [];

    for (const rule of rules) {
        const value = data[rule.type.toLowerCase()];
        if (value !== undefined && evaluateAlertCondition(rule.condition, value, rule.threshold)) {
            alerts.push({
                type: EventType.MAINTENANCE,
                severity: rule.severity as EventSeverity,
                description: rule.message.replace('{value}', value.toString()),
                vehicleId: data.vehicleId,
                organizationId: data.organizationId
            });
        }
    }

    return alerts;
};

// Middleware para procesar alertas
export const alertProcessorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: AlertConfig = req.body;
        const data = req.body.data;

        // Obtener reglas de alerta
        const rules = await prisma.rule
            .findMany({
                where: {
                    isActive: true,
                    ...(config.organizationId && { organizationId: config.organizationId })
                }
            })
            .then((rules) =>
                rules.map((rule) => ({
                    id: rule.id,
                    type: rule.name.split('.')[0],
                    condition: rule.condition,
                    threshold: parseFloat(rule.action.split(':')[1]),
                    severity: rule.action.split(':')[0],
                    message: rule.description || ''
                }))
            );

        // Procesar alertas según el tipo
        let alerts;
        switch (config.type) {
            case 'stability':
                alerts = await processStabilityAlert(data, rules);
                break;
            case 'maintenance':
                alerts = await processMaintenanceAlert(data, rules);
                break;
            default:
                throw new AppError(400, 'Tipo de alerta no soportado');
        }

        // Crear eventos de alerta
        if (alerts.length > 0) {
            await prisma.event.createMany({
                data: alerts
            });
        }

        // Almacenar alertas en la respuesta
        (req as any).alerts = alerts;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar alertas
export const alertCheckerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const vehicleId = parseInt(req.params.vehicleId);

        if (isNaN(vehicleId)) {
            throw new AppError(400, 'ID de vehículo inválido');
        }

        // Obtener alertas activas
        const activeAlerts = await prisma.event.findMany({
            where: {
                vehicleId,
                severity: {
                    in: ['HIGH', 'MEDIUM']
                },
                status: 'ACTIVE'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Agrupar alertas por tipo
        const alertsByType = activeAlerts.reduce((acc, alert) => {
            if (!acc[alert.type]) {
                acc[alert.type] = [];
            }
            acc[alert.type].push(alert);
            return acc;
        }, {} as Record<string, any[]>);

        // Almacenar alertas en la respuesta
        (req as any).activeAlerts = {
            total: activeAlerts.length,
            byType: alertsByType
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para actualizar alertas
export const alertUpdateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alertId = parseInt(req.params.alertId);
        const { status, notes } = req.body;

        if (isNaN(alertId)) {
            throw new AppError(400, 'ID de alerta inválido');
        }

        // Actualizar alerta
        await prisma.event.update({
            where: { id: alertId },
            data: {
                status,
                description: notes ? `${notes} (${new Date().toISOString()})` : undefined
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};
