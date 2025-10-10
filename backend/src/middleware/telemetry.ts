import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface TelemetryData {
    vehicleId: number;
    timestamp: Date;
    data: {
        ltr: number;
        ssf: number;
        drs: number;
        [key: string]: any;
    };
}

// Validar datos de telemetría
const validateTelemetryData = (data: any): TelemetryData => {
    if (!data.vehicleId || !data.timestamp || !data.data) {
        throw new AppError(400, 'Datos de telemetría inválidos');
    }

    if (
        typeof data.data.ltr !== 'number' ||
        typeof data.data.ssf !== 'number' ||
        typeof data.data.drs !== 'number'
    ) {
        throw new AppError(400, 'Métricas de estabilidad inválidas');
    }

    return {
        vehicleId: data.vehicleId,
        timestamp: new Date(data.timestamp),
        data: data.data
    };
};

// Procesar datos de telemetría
const processTelemetryData = async (data: TelemetryData) => {
    try {
        // Verificar si el vehículo existe
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: data.vehicleId }
        });

        if (!vehicle) {
            throw new AppError(404, 'Vehículo no encontrado');
        }

        // Verificar si hay una sesión activa
        const activeSession = await prisma.session.findFirst({
            where: {
                vehicleId: data.vehicleId,
                status: 'ACTIVE'
            }
        });

        if (!activeSession) {
            throw new AppError(400, 'No hay sesión activa para este vehículo');
        }

        // Verificar límites de estabilidad
        if (data.data.ltr > 0.8) {
            await prisma.event.create({
                data: {
                    type: EventType.STABILITY,
                    severity: EventSeverity.WARNING,
                    description: 'LTR excede el límite seguro',
                    vehicleId: data.vehicleId,
                    sessionId: activeSession.id
                }
            });
        }

        if (data.data.ssf < 1.2) {
            await prisma.event.create({
                data: {
                    type: EventType.STABILITY,
                    severity: EventSeverity.CRITICAL,
                    description: 'SSF por debajo del límite seguro',
                    vehicleId: data.vehicleId,
                    sessionId: activeSession.id
                }
            });
        }

        // Guardar datos de telemetría
        await prisma.$queryRaw`
            INSERT INTO telemetry (vehicle_id, session_id, timestamp, data)
            VALUES (${data.vehicleId}, ${activeSession.id}, ${data.timestamp}, ${JSON.stringify(
            data.data
        )})
        `;

        return true;
    } catch (error) {
        logger.error('Error procesando telemetría', { error, data });
        throw error;
    }
};

// Middleware para procesar telemetría
export const telemetryMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const telemetryData = validateTelemetryData(req.body);
        await processTelemetryData(telemetryData);
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para verificar límites de telemetría
export const telemetryRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const vehicleId = req.body.vehicleId;
    const key = `telemetry:${vehicleId}`;
    const limit = 100; // Límite de mensajes por minuto
    const window = 60000; // Ventana de tiempo (1 minuto)

    // Aquí iría la lógica de rate limiting
    // Por ahora, simplemente pasamos al siguiente middleware
    next();
};
