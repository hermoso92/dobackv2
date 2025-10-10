import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface SimulationConfig {
    duration: number; // Duración en segundos
    interval: number; // Intervalo en milisegundos
    vehicleId: number;
    sessionId: number;
    patterns: {
        ltr: {
            base: number;
            variation: number;
            trend?: number;
        };
        ssf: {
            base: number;
            variation: number;
            trend?: number;
        };
        drs: {
            base: number;
            variation: number;
            trend?: number;
        };
    };
}

// Middleware para iniciar simulación
export const simulationStartMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config: SimulationConfig = req.body;

        // Verificar vehículo
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: config.vehicleId },
            select: { organizationId: true }
        });

        if (!vehicle) {
            throw new AppError(404, 'Vehículo no encontrado');
        }

        // Crear sesión de simulación
        const session = await prisma.session.create({
            data: {
                vehicleId: config.vehicleId,
                startTime: new Date(),
                status: 'ACTIVE',
                metadata: { isSimulation: true }
            }
        });

        // Iniciar simulación
        const simulationInterval = setInterval(async () => {
            try {
                const time = (Date.now() - session.startTime.getTime()) / 1000;
                if (time >= config.duration) {
                    clearInterval(simulationInterval);
                    await prisma.session.update({
                        where: { id: session.id },
                        data: {
                            status: 'COMPLETED',
                            endTime: new Date()
                        }
                    });
                    return;
                }

                // Crear evento
                await prisma.event.create({
                    data: {
                        type: EventType.STABILITY_WARNING,
                        severity: EventSeverity.MEDIUM,
                        description: `Simulación - LTR: ${data.ltr.toFixed(
                            2
                        )}, SSF: ${data.ssf.toFixed(2)}, DRS: ${data.drs.toFixed(2)}`,
                        vehicleId: config.vehicleId,
                        organizationId: vehicle.organizationId
                    }
                });
            } catch (error) {
                logger.error('Error en simulación', { error });
            }
        }, config.interval);

        // Almacenar referencia a la simulación
        (req as any).simulation = {
            sessionId: session.id,
            interval: simulationInterval
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para detener simulación
export const simulationStopMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        if (isNaN(sessionId)) {
            throw new AppError(400, 'ID de sesión inválido');
        }

        // Detener simulación
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId,
                metadata: {
                    path: ['isSimulation'],
                    equals: true
                }
            }
        });

        if (!session) {
            throw new AppError(404, 'Sesión de simulación no encontrada');
        }

        // Actualizar sesión
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                endTime: new Date()
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para pausar simulación
export const simulationPauseMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const sessionId = parseInt(req.params.sessionId);

        if (isNaN(sessionId)) {
            throw new AppError(400, 'ID de sesión inválido');
        }

        // Pausar simulación
        const session = await prisma.session.findFirst({
            where: {
                id: sessionId,
                metadata: {
                    path: ['isSimulation'],
                    equals: true
                }
            }
        });

        if (!session) {
            throw new AppError(404, 'Sesión de simulación no encontrada');
        }

        // Actualizar sesión
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'INACTIVE'
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};
