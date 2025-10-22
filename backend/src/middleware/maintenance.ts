import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface MaintenanceCheck {
    vehicleId: number;
    checkType: string;
    result: boolean;
    details?: any;
}

// Verificar necesidad de mantenimiento
const checkMaintenanceNeeded = async (vehicleId: number): Promise<MaintenanceCheck[]> => {
    try {
        // Obtener datos del vehículo y sus eventos
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
                events: {
                    where: {
                        type: 'MAINTENANCE',
                        createdAt: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
                        }
                    }
                },
                sessions: {
                    where: {
                        endTime: {
                            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });

        if (!vehicle) {
            throw new AppError(404, 'Vehículo no encontrado');
        }

        const checks: MaintenanceCheck[] = [];

        // Verificar frecuencia de eventos de mantenimiento
        checks.push({
            vehicleId,
            checkType: 'EVENT_FREQUENCY',
            result: vehicle.events.length >= 3,
            details: {
                eventCount: vehicle.events.length,
                threshold: 3
            }
        });

        // Verificar tiempo de operación
        const totalOperationTime = vehicle.sessions.reduce((total, session) => {
            const endTime = session.endTime || new Date();
            const duration = endTime.getTime() - session.startTime.getTime();
            return total + duration;
        }, 0);

        checks.push({
            vehicleId,
            checkType: 'OPERATION_TIME',
            result: totalOperationTime > 100 * 60 * 60 * 1000, // 100 horas
            details: {
                operationHours: totalOperationTime / (60 * 60 * 1000),
                threshold: 100
            }
        });

        return checks;
    } catch (error) {
        logger.error('Error verificando mantenimiento', { error, vehicleId });
        throw error;
    }
};

// Middleware para verificación de mantenimiento
export const maintenanceCheckMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const vehicleId = parseInt(req.params.vehicleId);

        if (isNaN(vehicleId)) {
            throw new AppError(400, 'ID de vehículo inválido');
        }

        const checks = await checkMaintenanceNeeded(vehicleId);
        const maintenanceNeeded = checks.some((check) => check.result);

        if (maintenanceNeeded) {
            // Obtener la organización del vehículo
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: vehicleId },
                select: { organizationId: true }
            });

            if (!vehicle) {
                throw new AppError(404, 'Vehículo no encontrado');
            }

            // Crear solicitud de mantenimiento
            await prisma.maintenanceRequest.create({
                data: {
                    vehicleId,
                    status: 'PENDING',
                    createdAt: new Date()
                }
            });

            // Crear evento de mantenimiento
            await prisma.event.create({
                data: {
                    type: 'MAINTENANCE',
                    severity: 'HIGH',
                    description: 'Mantenimiento requerido',
                    vehicleId,
                    organizationId: vehicle.organizationId
                }
            });
        }

        // Añadir resultado a la respuesta
        (req as any).maintenanceChecks = checks;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para actualización de mantenimiento
export const maintenanceUpdateMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const maintenanceId = parseInt(req.params.maintenanceId);
        const { status, completedAt, notes } = req.body;

        if (isNaN(maintenanceId)) {
            throw new AppError(400, 'ID de mantenimiento inválido');
        }

        // Actualizar solicitud de mantenimiento
        await prisma.maintenanceRequest.update({
            where: { id: maintenanceId },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        // Si el mantenimiento está completado, crear evento
        if (status === 'COMPLETED') {
            const maintenance = await prisma.maintenanceRequest.findUnique({
                where: { id: maintenanceId }
            });

            if (maintenance) {
                await prisma.event.create({
                    data: {
                        type: 'MAINTENANCE',
                        severity: 'LOW',
                        description: `Mantenimiento #${maintenanceId} completado`,
                        vehicleId: maintenance.vehicleId,
                        organizationId: maintenance.organizationId
                    }
                });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};
