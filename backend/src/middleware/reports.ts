import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error';

interface ReportConfig {
    startDate: Date;
    endDate: Date;
    vehicleId?: number;
    organizationId?: number;
    type: 'stability' | 'maintenance' | 'activity';
}

interface Vehicle {
    id: number;
    name: string;
}

interface Event {
    id: number;
    type: EventType;
    severity: EventSeverity;
    description: string | null;
    createdAt: Date;
    vehicleId: number;
    vehicle: Vehicle;
}

interface Session {
    id: number;
    startTime: Date;
    endTime: Date | null;
    vehicleId: number;
    vehicle: Vehicle;
    events: Event[];
}

// Generar reporte de estabilidad
const generateStabilityReport = async (config: ReportConfig) => {
    const events = await prisma.event.findMany({
        where: {
            type: EventType.STABILITY_WARNING,
            createdAt: {
                gte: config.startDate,
                lte: config.endDate
            },
            ...(config.vehicleId && { vehicleId: config.vehicleId }),
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    // Procesar eventos
    const stabilityData = events
        .map((event) => {
            if (!event.description) return null;
            const matches = event.description.match(/LTR: ([\d.]+), SSF: ([\d.]+), DRS: ([\d.]+)/);
            return matches
                ? {
                    timestamp: event.createdAt,
                    vehicleId: event.vehicleId,
                    vehicleName: event.vehicle.name,
                    metrics: {
                        ltr: parseFloat(matches[1]),
                        ssf: parseFloat(matches[2]),
                        drs: parseFloat(matches[3])
                    }
                }
                : null;
        })
        .filter((data): data is NonNullable<typeof data> => data !== null);

    // Calcular estadísticas
    const stats = stabilityData.reduce(
        (acc, data) => {
            acc.ltr.values.push(data.metrics.ltr);
            acc.ssf.values.push(data.metrics.ssf);
            acc.drs.values.push(data.metrics.drs);
            return acc;
        },
        {
            ltr: { values: [] as number[] },
            ssf: { values: [] as number[] },
            drs: { values: [] as number[] }
        }
    );

    const calculateStats = (values: number[]) => ({
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
    });

    return {
        period: {
            start: config.startDate,
            end: config.endDate
        },
        data: stabilityData,
        statistics: {
            ltr: calculateStats(stats.ltr.values),
            ssf: calculateStats(stats.ssf.values),
            drs: calculateStats(stats.drs.values),
            totalEvents: events.length
        }
    };
};

// Generar reporte de mantenimiento
const generateMaintenanceReport = async (config: ReportConfig) => {
    const events = await prisma.event.findMany({
        where: {
            type: EventType.MAINTENANCE,
            createdAt: {
                gte: config.startDate,
                lte: config.endDate
            },
            ...(config.vehicleId && { vehicleId: config.vehicleId }),
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    // Agrupar por vehículo
    const maintenanceByVehicle = events.reduce((acc, event) => {
        const vehicleId = event.vehicleId;
        if (!acc[vehicleId]) {
            acc[vehicleId] = {
                vehicleName: event.vehicle.name,
                events: []
            };
        }
        acc[vehicleId].events.push({
            timestamp: event.createdAt,
            description: event.description,
            severity: event.severity
        });
        return acc;
    }, {} as Record<number, { vehicleName: string; events: any[] }>);

    return {
        period: {
            start: config.startDate,
            end: config.endDate
        },
        data: Object.entries(maintenanceByVehicle).map(([vehicleId, data]) => ({
            vehicleId: parseInt(vehicleId),
            ...data
        })),
        statistics: {
            totalEvents: events.length,
            byVehicle: Object.entries(maintenanceByVehicle).map(([vehicleId, data]) => ({
                vehicleId: parseInt(vehicleId),
                vehicleName: data.vehicleName,
                eventCount: data.events.length
            }))
        }
    };
};

// Generar reporte de actividad
const generateActivityReport = async (config: ReportConfig) => {
    // Obtener sesiones y eventos por separado
    const sessions = await prisma.session.findMany({
        where: {
            startTime: {
                gte: config.startDate,
                lte: config.endDate
            },
            ...(config.vehicleId && { vehicleId: config.vehicleId })
        },
        include: {
            vehicle: true
        },
        orderBy: {
            startTime: 'asc'
        }
    });

    // Obtener eventos para las sesiones
    const sessionIds = sessions.map((s) => s.id);
    const events = await prisma.event.findMany({
        where: {
            sessionId: {
                in: sessionIds
            }
        }
    });

    // Agrupar eventos por sesión
    const eventsBySession = events.reduce((acc, event) => {
        if (!acc[event.sessionId]) {
            acc[event.sessionId] = [];
        }
        acc[event.sessionId].push(event);
        return acc;
    }, {} as Record<number, Event[]>);

    // Procesar sesiones con sus eventos
    const activityData = sessions.map((session) => ({
        sessionId: session.id,
        vehicleId: session.vehicleId,
        vehicleName: session.vehicle.name,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime
            ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60) // horas
            : null,
        events: {
            total: eventsBySession[session.id]?.length || 0,
            byType: (eventsBySession[session.id] || []).reduce(
                (acc: Record<string, number>, event: Event) => {
                    acc[event.type] = (acc[event.type] || 0) + 1;
                    return acc;
                },
                {}
            )
        }
    }));

    // Calcular estadísticas
    const totalDuration = activityData.reduce((acc, session) => acc + (session.duration || 0), 0);

    return {
        period: {
            start: config.startDate,
            end: config.endDate
        },
        data: activityData,
        statistics: {
            totalSessions: sessions.length,
            totalDuration,
            averageDuration: totalDuration / sessions.length,
            byVehicle: activityData.reduce((acc, session) => {
                const vehicleId = session.vehicleId;
                if (!acc[vehicleId]) {
                    acc[vehicleId] = {
                        vehicleName: session.vehicleName,
                        sessions: 0,
                        totalDuration: 0
                    };
                }
                acc[vehicleId].sessions++;
                acc[vehicleId].totalDuration += session.duration || 0;
                return acc;
            }, {} as Record<number, { vehicleName: string; sessions: number; totalDuration: number }>)
        }
    };
};

// Middleware para generar reportes
export const reportGeneratorMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config: ReportConfig = {
            startDate: new Date(req.query.startDate as string),
            endDate: new Date(req.query.endDate as string),
            vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
            organizationId: req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : undefined,
            type: req.query.type as 'stability' | 'maintenance' | 'activity'
        };

        // Validar fechas
        if (isNaN(config.startDate.getTime()) || isNaN(config.endDate.getTime())) {
            throw new AppError(400, 'Fechas inválidas');
        }

        // Generar reporte según el tipo
        let report;
        switch (config.type) {
            case 'stability':
                report = await generateStabilityReport(config);
                break;
            case 'maintenance':
                report = await generateMaintenanceReport(config);
                break;
            case 'activity':
                report = await generateActivityReport(config);
                break;
            default:
                throw new AppError(400, 'Tipo de reporte inválido');
        }

        // Almacenar reporte en la respuesta
        (req as any).report = report;
        next();
    } catch (error) {
        next(error);
    }
};
