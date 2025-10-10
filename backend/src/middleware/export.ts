import { EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database';
import { AppError } from './error';

interface ExportConfig {
    type: 'vehicle' | 'event' | 'session' | 'stability';
    format: 'csv' | 'json';
    startDate?: Date;
    endDate?: Date;
    vehicleId?: number;
    organizationId?: number;
}

// Exportar datos de vehículos
const exportVehicles = async (config: ExportConfig) => {
    const vehicles = await prisma.vehicle.findMany({
        where: {
            ...(config.organizationId && { organizationId: config.organizationId }),
            ...(config.vehicleId && { id: config.vehicleId })
        },
        include: {
            _count: {
                select: {
                    sessions: true,
                    events: true
                }
            }
        }
    });

    const data = vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        status: vehicle.status,
        organizationId: vehicle.organizationId,
        sessionCount: vehicle._count.sessions,
        eventCount: vehicle._count.events,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt
    }));

    return data;
};

// Exportar datos de eventos
const exportEvents = async (config: ExportConfig) => {
    const events = await prisma.event.findMany({
        where: {
            ...(config.startDate && { createdAt: { gte: config.startDate } }),
            ...(config.endDate && { createdAt: { lte: config.endDate } }),
            ...(config.vehicleId && { vehicleId: config.vehicleId }),
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const data = events.map((event) => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        description: event.description,
        vehicleId: event.vehicleId,
        vehicleName: event.vehicle.name,
        organizationId: event.organizationId,
        createdAt: event.createdAt
    }));

    return data;
};

// Exportar datos de sesiones
const exportSessions = async (config: ExportConfig) => {
    const sessions = await prisma.session.findMany({
        where: {
            ...(config.startDate && { startTime: { gte: config.startDate } }),
            ...(config.endDate && { startTime: { lte: config.endDate } }),
            ...(config.vehicleId && { vehicleId: config.vehicleId }),
            vehicle: config.organizationId
                ? {
                      organizationId: config.organizationId
                  }
                : undefined
        },
        include: {
            vehicle: true
        },
        orderBy: {
            startTime: 'desc'
        }
    });

    const data = sessions.map((session) => ({
        id: session.id,
        vehicleId: session.vehicleId,
        vehicleName: session.vehicle.name,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime
            ? (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)
            : null
    }));

    return data;
};

// Exportar datos de estabilidad
const exportStability = async (config: ExportConfig) => {
    const events = await prisma.event.findMany({
        where: {
            type: EventType.STABILITY_WARNING,
            ...(config.startDate && { createdAt: { gte: config.startDate } }),
            ...(config.endDate && { createdAt: { lte: config.endDate } }),
            ...(config.vehicleId && { vehicleId: config.vehicleId }),
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const data = events
        .map((event) => {
            const matches = event.description?.match(/LTR: ([\d.]+), SSF: ([\d.]+), DRS: ([\d.]+)/);
            return matches
                ? {
                      id: event.id,
                      vehicleId: event.vehicleId,
                      vehicleName: event.vehicle.name,
                      timestamp: event.createdAt,
                      ltr: parseFloat(matches[1]),
                      ssf: parseFloat(matches[2]),
                      drs: parseFloat(matches[3]),
                      severity: event.severity
                  }
                : null;
        })
        .filter((d): d is NonNullable<typeof d> => d !== null);

    return data;
};

// Middleware de exportación
export const exportMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: ExportConfig = {
            type: req.query.type as 'vehicle' | 'event' | 'session' | 'stability',
            format: req.query.format as 'csv' | 'json',
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            vehicleId: req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined,
            organizationId: req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : undefined
        };

        if (!config.type || !config.format) {
            throw new AppError(400, 'Tipo y formato requeridos');
        }

        // Obtener datos según el tipo
        let data;
        switch (config.type) {
            case 'vehicle':
                data = await exportVehicles(config);
                break;
            case 'event':
                data = await exportEvents(config);
                break;
            case 'session':
                data = await exportSessions(config);
                break;
            case 'stability':
                data = await exportStability(config);
                break;
            default:
                throw new AppError(400, 'Tipo de exportación inválido');
        }

        // Generar archivo según el formato
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `export_${config.type}_${timestamp}.${config.format}`;
        const filePath = path.join('uploads', 'exports', fileName);

        await fs.mkdir(path.dirname(filePath), { recursive: true });

        if (config.format === 'csv') {
            const rows = data.map((item) => Object.values(item).join(','));
            const headers = Object.keys(data[0]).join(',');
            const csv = [headers, ...rows].join('\n');
            await fs.writeFile(filePath, csv);
        } else {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        }

        // Almacenar referencia en la respuesta
        (req as any).exportFile = {
            path: filePath,
            name: fileName,
            type: config.type,
            format: config.format,
            count: data.length
        };

        next();
    } catch (error) {
        next(error);
    }
};
