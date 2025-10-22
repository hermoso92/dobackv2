import { EventSeverity, EventType } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error';

interface SearchConfig {
    query: string;
    type?: 'vehicle' | 'event' | 'session' | 'all';
    organizationId?: number;
    limit?: number;
    offset?: number;
}

interface SearchResult {
    total: number;
    results: any[];
    type: string;
}

// Buscar vehículos
const searchVehicles = async (config: SearchConfig): Promise<SearchResult> => {
    const vehicles = await prisma.vehicle.findMany({
        where: {
            OR: [
                { name: { contains: config.query } },
                { model: { contains: config.query } },
                { plateNumber: { contains: config.query } }
            ],
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        skip: config.offset || 0,
        take: config.limit || 10,
        include: {
            _count: {
                select: {
                    sessions: true,
                    events: true
                }
            }
        }
    });

    const total = await prisma.vehicle.count({
        where: {
            OR: [
                { name: { contains: config.query } },
                { model: { contains: config.query } },
                { plateNumber: { contains: config.query } }
            ],
            ...(config.organizationId && { organizationId: config.organizationId })
        }
    });

    return {
        total,
        results: vehicles,
        type: 'vehicle'
    };
};

// Buscar eventos
const searchEvents = async (config: SearchConfig): Promise<SearchResult> => {
    const events = await prisma.event.findMany({
        where: {
            OR: [
                { description: { contains: config.query } },
                { type: { equals: config.query as EventType } },
                { severity: { equals: config.query as EventSeverity } }
            ],
            ...(config.organizationId && { organizationId: config.organizationId })
        },
        skip: config.offset || 0,
        take: config.limit || 10,
        include: {
            vehicle: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const total = await prisma.event.count({
        where: {
            OR: [
                { description: { contains: config.query } },
                { type: { equals: config.query as EventType } },
                { severity: { equals: config.query as EventSeverity } }
            ],
            ...(config.organizationId && { organizationId: config.organizationId })
        }
    });

    return {
        total,
        results: events,
        type: 'event'
    };
};

// Buscar sesiones
const searchSessions = async (config: SearchConfig): Promise<SearchResult> => {
    const sessions = await prisma.session.findMany({
        where: {
            OR: [
                { status: { equals: config.query as any } },
                {
                    vehicle: {
                        OR: [
                            { name: { contains: config.query } },
                            { plateNumber: { contains: config.query } }
                        ]
                    }
                }
            ],
            vehicle: config.organizationId
                ? {
                    organizationId: config.organizationId
                }
                : undefined
        },
        skip: config.offset || 0,
        take: config.limit || 10,
        include: {
            vehicle: true
        },
        orderBy: {
            startTime: 'desc'
        }
    });

    // Obtener conteo de eventos por sesión
    const sessionIds = sessions.map((s) => s.id);
    const eventCounts = await prisma.event.groupBy({
        by: ['sessionId'],
        where: {
            sessionId: {
                in: sessionIds
            }
        },
        _count: {
            _all: true
        }
    });

    // Agregar conteo de eventos a las sesiones
    const sessionsWithCounts = sessions.map((session) => ({
        ...session,
        eventCount: eventCounts.find((c) => c.sessionId === session.id)?._count._all || 0
    }));

    const total = await prisma.session.count({
        where: {
            OR: [
                { status: { equals: config.query as any } },
                {
                    vehicle: {
                        OR: [
                            { name: { contains: config.query } },
                            { plateNumber: { contains: config.query } }
                        ]
                    }
                }
            ],
            vehicle: config.organizationId
                ? {
                    organizationId: config.organizationId
                }
                : undefined
        }
    });

    return {
        total,
        results: sessionsWithCounts,
        type: 'session'
    };
};

// Middleware de búsqueda
export const searchMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config: SearchConfig = {
            query: req.query.q as string,
            type: req.query.type as 'vehicle' | 'event' | 'session' | 'all',
            organizationId: req.query.organizationId
                ? parseInt(req.query.organizationId as string)
                : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        if (!config.query) {
            throw new AppError(400, 'Término de búsqueda requerido');
        }

        let results: SearchResult[];

        if (!config.type || config.type === 'all') {
            // Buscar en todos los tipos
            results = await Promise.all([
                searchVehicles(config),
                searchEvents(config),
                searchSessions(config)
            ]);
        } else {
            // Buscar en un tipo específico
            switch (config.type) {
                case 'vehicle':
                    results = [await searchVehicles(config)];
                    break;
                case 'event':
                    results = [await searchEvents(config)];
                    break;
                case 'session':
                    results = [await searchSessions(config)];
                    break;
                default:
                    throw new AppError(400, 'Tipo de búsqueda inválido');
            }
        }

        // Almacenar resultados en la respuesta
        (req as any).searchResults = results;
        next();
    } catch (error) {
        next(error);
    }
};
