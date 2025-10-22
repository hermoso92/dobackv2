import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error';

interface StabilityData {
    vehicleId: number;
    sessionId: number;
    ltr: number;
    ssf: number;
    drs: number;
    timestamp: Date;
}

interface StabilityMetric {
    value: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
}

interface StabilityMetrics {
    ltr: StabilityMetric;
    ssf: StabilityMetric;
    drs: StabilityMetric;
    overallStatus: 'SAFE' | 'WARNING' | 'CRITICAL';
}

// Calcular métricas de estabilidad
const calculateStabilityMetrics = (data: StabilityData): StabilityMetrics => {
    const metrics = {
        ltr: {
            value: data.ltr,
            status: data.ltr <= 0.6 ? 'SAFE' : data.ltr <= 0.8 ? 'WARNING' : 'CRITICAL'
        } as StabilityMetric,
        ssf: {
            value: data.ssf,
            status: data.ssf >= 1.5 ? 'SAFE' : data.ssf >= 1.2 ? 'WARNING' : 'CRITICAL'
        } as StabilityMetric,
        drs: {
            value: data.drs,
            status: data.drs <= 0.3 ? 'SAFE' : data.drs <= 0.5 ? 'WARNING' : 'CRITICAL'
        } as StabilityMetric
    };

    return {
        ...metrics,
        overallStatus: Object.values(metrics).some((m) => m.status === 'CRITICAL')
            ? 'CRITICAL'
            : Object.values(metrics).some((m) => m.status === 'WARNING')
                ? 'WARNING'
                : 'SAFE'
    };
};

// Middleware para procesar datos de estabilidad
export const stabilityProcessorMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const data: StabilityData = req.body;
        const metrics = calculateStabilityMetrics(data);

        // Obtener vehículo y organización
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: data.vehicleId },
            select: { organizationId: true }
        });

        if (!vehicle) {
            throw new AppError(404, 'Vehículo no encontrado');
        }

        // Guardar datos de estabilidad en la tabla de eventos
        await prisma.event.create({
            data: {
                type: EventType.STABILITY_WARNING,
                severity:
                    metrics.overallStatus === 'CRITICAL'
                        ? EventSeverity.HIGH
                        : EventSeverity.MEDIUM,
                description: `LTR: ${data.ltr.toFixed(2)}, SSF: ${data.ssf.toFixed(
                    2
                )}, DRS: ${data.drs.toFixed(2)}`,
                vehicleId: data.vehicleId,
                organizationId: vehicle.organizationId
            }
        });

        // Añadir métricas a la respuesta
        (req as any).stabilityMetrics = metrics;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar límites de estabilidad
export const stabilityLimitsMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const vehicleId = parseInt(req.params.vehicleId);

        if (isNaN(vehicleId)) {
            throw new AppError(400, 'ID de vehículo inválido');
        }

        // Usar límites por defecto
        (req as any).stabilityLimits = {
            ltrMax: 0.8,
            ssfMin: 1.2,
            drsMax: 0.5
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para análisis histórico
export const stabilityHistoryMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const vehicleId = parseInt(req.params.vehicleId);
        const days = parseInt(req.query.days as string) || 30;

        if (isNaN(vehicleId)) {
            throw new AppError(400, 'ID de vehículo inválido');
        }

        // Obtener datos históricos
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const history = await prisma.event.findMany({
            where: {
                vehicleId,
                type: EventType.STABILITY_WARNING,
                createdAt: {
                    gte: startDate
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Extraer datos de estabilidad de la descripción
        const stabilityData = history
            .map((event) => {
                if (!event.description) return null;
                const matches = event.description.match(
                    /LTR: ([\d.]+), SSF: ([\d.]+), DRS: ([\d.]+)/
                );
                return matches
                    ? {
                        ltr: parseFloat(matches[1]),
                        ssf: parseFloat(matches[2]),
                        drs: parseFloat(matches[3]),
                        timestamp: event.createdAt
                    }
                    : null;
            })
            .filter((data): data is NonNullable<typeof data> => data !== null);

        // Calcular tendencias
        const trends = {
            ltr: {
                avg: stabilityData.reduce((sum, data) => sum + data.ltr, 0) / stabilityData.length,
                max: Math.max(...stabilityData.map((data) => data.ltr)),
                trend:
                    stabilityData.length > 1
                        ? (stabilityData[stabilityData.length - 1].ltr - stabilityData[0].ltr) /
                        days
                        : 0
            },
            ssf: {
                avg: stabilityData.reduce((sum, data) => sum + data.ssf, 0) / stabilityData.length,
                min: Math.min(...stabilityData.map((data) => data.ssf)),
                trend:
                    stabilityData.length > 1
                        ? (stabilityData[stabilityData.length - 1].ssf - stabilityData[0].ssf) /
                        days
                        : 0
            },
            drs: {
                avg: stabilityData.reduce((sum, data) => sum + data.drs, 0) / stabilityData.length,
                max: Math.max(...stabilityData.map((data) => data.drs)),
                trend:
                    stabilityData.length > 1
                        ? (stabilityData[stabilityData.length - 1].drs - stabilityData[0].drs) /
                        days
                        : 0
            }
        };

        // Añadir datos históricos a la respuesta
        (req as any).stabilityHistory = {
            data: stabilityData,
            trends
        };

        next();
    } catch (error) {
        next(error);
    }
};
