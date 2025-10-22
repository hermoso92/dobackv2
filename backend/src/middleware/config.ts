import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error';

interface ConfigItem {
    key: string;
    value: string;
    description?: string;
    organizationId?: number;
    vehicleId?: number;
}

// Obtener configuración
const getConfig = async (key: string, organizationId?: number, vehicleId?: number) => {
    const config = await prisma.event.findFirst({
        where: {
            type: EventType.OTHER,
            description: {
                contains: `"configKey":"${key}"`
            },
            ...(organizationId && { organizationId }),
            ...(vehicleId && { vehicleId })
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    if (!config) return null;

    try {
        const metadata = JSON.parse(config.description || '{}');
        return {
            key: metadata.configKey,
            value: metadata.configValue,
            description: metadata.configDescription,
            organizationId: config.organizationId,
            vehicleId: config.vehicleId
        };
    } catch {
        return null;
    }
};

// Middleware para obtener configuración
export const configGetMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.params.key;
        const organizationId = req.query.organizationId
            ? parseInt(req.query.organizationId as string)
            : undefined;
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;

        const config = await getConfig(key, organizationId, vehicleId);
        if (!config) {
            throw new AppError(404, 'Configuración no encontrada');
        }

        // Almacenar configuración en la respuesta
        (req as any).config = config;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para establecer configuración
export const configSetMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: ConfigItem = req.body;

        // Validar configuración
        if (!config.key || !config.value) {
            throw new AppError(400, 'Configuración inválida');
        }

        // Crear evento de configuración
        const configEvent = await prisma.event.create({
            data: {
                type: EventType.OTHER,
                severity: EventSeverity.LOW,
                description: JSON.stringify({
                    configKey: config.key,
                    configValue: config.value,
                    configDescription: config.description
                }),
                organizationId: config.organizationId || 1, // Organización por defecto
                vehicleId: config.vehicleId || 1 // Vehículo por defecto
            }
        });

        // Almacenar configuración en la respuesta
        (req as any).config = {
            key: config.key,
            value: config.value,
            description: config.description,
            organizationId: configEvent.organizationId,
            vehicleId: configEvent.vehicleId
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para listar configuración
export const configListMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.query.organizationId
            ? parseInt(req.query.organizationId as string)
            : undefined;
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;

        // Buscar eventos de configuración
        const configEvents = await prisma.event.findMany({
            where: {
                type: EventType.OTHER,
                description: {
                    contains: '"configKey":'
                },
                ...(organizationId && { organizationId }),
                ...(vehicleId && { vehicleId })
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Procesar configuraciones
        const configs = configEvents
            .map((event) => {
                try {
                    const metadata = JSON.parse(event.description || '{}');
                    return {
                        key: metadata.configKey,
                        value: metadata.configValue,
                        description: metadata.configDescription,
                        organizationId: event.organizationId,
                        vehicleId: event.vehicleId
                    };
                } catch {
                    return null;
                }
            })
            .filter((config): config is NonNullable<typeof config> => config !== null);

        // Almacenar configuraciones en la respuesta
        (req as any).configs = configs;
        next();
    } catch (error) {
        next(error);
    }
};

// Middleware para eliminar configuración
export const configDeleteMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = req.params.key;
        const organizationId = req.query.organizationId
            ? parseInt(req.query.organizationId as string)
            : undefined;
        const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : undefined;

        // Buscar configuración
        const config = await getConfig(key, organizationId, vehicleId);
        if (!config) {
            throw new AppError(404, 'Configuración no encontrada');
        }

        // Eliminar eventos de configuración
        await prisma.event.deleteMany({
            where: {
                type: EventType.OTHER,
                description: {
                    contains: `"configKey":"${key}"`
                },
                ...(organizationId && { organizationId }),
                ...(vehicleId && { vehicleId })
            }
        });

        next();
    } catch (error) {
        next(error);
    }
};
