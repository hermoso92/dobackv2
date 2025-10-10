import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';

interface StatsConfig {
    period: number; // días
    vehicleId?: number;
    organizationId?: number;
}

interface StatsResult {
    period: {
        start: Date;
        end: Date;
    };
    vehicles: {
        total: number;
        active: number;
        inactive: number;
    };
    sessions: {
        total: number;
        active: number;
        completed: number;
        averageDuration: number;
    };
    events: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    stability: {
        criticalEvents: number;
        warningEvents: number;
        averageMetrics: {
            ltr: number;
            ssf: number;
            drs: number;
        };
    };
}

// Calcular estadísticas
const calculateStats = async (config: StatsConfig): Promise<StatsResult> => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.period);

    // Estadísticas de vehículos
    const vehicles = await prisma.vehicle.findMany({
        where: {
            ...(config.organizationId && { organizationId: config.organizationId }),
            ...(config.vehicleId && { id: config.vehicleId })
        }
    });

    const vehicleIds = vehicles.map((v) => v.id);

    // Estadísticas de sesiones
    const sessions = await prisma.session.findMany({
        where: {
            vehicleId: {
                in: vehicleIds
            },
            startTime: {
                gte: startDate
            }
        }
    });

    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
    const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
    const totalDuration = completedSessions.reduce((acc, s) => {
        const duration = s.endTime
            ? (s.endTime.getTime() - s.startTime.getTime()) / (1000 * 60 * 60)
            : 0;
        return acc + duration;
    }, 0);

    // Estadísticas de eventos
    const events = await prisma.event.findMany({
        where: {
            vehicleId: {
                in: vehicleIds
            },
            createdAt: {
                gte: startDate
            }
        }
    });

    const eventsByType = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Estadísticas de estabilidad
    const stabilityEvents = events.filter((e) => e.type === EventType.STABILITY_WARNING);
    const stabilityMetrics = stabilityEvents
        .map((event) => {
            const matches = event.description?.match(/LTR: ([\d.]+), SSF: ([\d.]+), DRS: ([\d.]+)/);
            return matches
                ? {
                      ltr: parseFloat(matches[1]),
                      ssf: parseFloat(matches[2]),
                      drs: parseFloat(matches[3])
                  }
                : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

    const averageMetrics = stabilityMetrics.reduce(
        (acc, metrics) => {
            acc.ltr += metrics.ltr;
            acc.ssf += metrics.ssf;
            acc.drs += metrics.drs;
            return acc;
        },
        { ltr: 0, ssf: 0, drs: 0 }
    );

    if (stabilityMetrics.length > 0) {
        averageMetrics.ltr /= stabilityMetrics.length;
        averageMetrics.ssf /= stabilityMetrics.length;
        averageMetrics.drs /= stabilityMetrics.length;
    }

    return {
        period: {
            start: startDate,
            end: endDate
        },
        vehicles: {
            total: vehicles.length,
            active: vehicles.filter((v) => v.status === 'ACTIVE').length,
            inactive: vehicles.filter((v) => v.status === 'INACTIVE').length
        },
        sessions: {
            total: sessions.length,
            active: activeSessions.length,
            completed: completedSessions.length,
            averageDuration:
                completedSessions.length > 0 ? totalDuration / completedSessions.length : 0
        },
        events: {
            total: events.length,
            byType: eventsByType,
            bySeverity: eventsBySeverity
        },
        stability: {
            criticalEvents: stabilityEvents.filter((e) => e.severity === EventSeverity.HIGH).length,
            warningEvents: stabilityEvents.filter((e) => e.severity === EventSeverity.MEDIUM)
                .length,
            averageMetrics
        }
    };
};

// Middleware para obtener estadísticas
export const statsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: StatsConfig = {
            period: parseInt(req.query.period as string) || 30,
            vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
            organizationId: req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : undefined
        };

        const stats = await calculateStats(config);

        // Almacenar estadísticas en la respuesta
        (req as any).stats = stats;
        next();
    } catch (error) {
        next(error);
    }
};
