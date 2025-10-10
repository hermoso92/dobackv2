import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CacheService } from './CacheService';

// Instancia de cache para performance
const cacheService = new CacheService();

const prisma = new PrismaClient();

export class PerformanceService {
    /**
     * Aplica downsample a puntos GPS para mejorar performance
     */
    static downsampleGPSPoints(points: Array<{ lat: number; lng: number; timestamp: string }>, maxPoints: number = 1000): Array<{ lat: number; lng: number; timestamp: string }> {
        if (points.length <= maxPoints) {
            return points;
        }

        logger.info('Aplicando downsample a puntos GPS', {
            original: points.length,
            target: maxPoints
        });

        // Algoritmo de downsample: mantener puntos importantes y distribuir uniformemente
        const step = Math.floor(points.length / maxPoints);
        const downsampled: Array<{ lat: number; lng: number; timestamp: string }> = [];

        // Siempre incluir el primer punto
        downsampled.push(points[0]);

        // Incluir puntos cada 'step' intervalos
        for (let i = step; i < points.length - 1; i += step) {
            downsampled.push(points[i]);
        }

        // Siempre incluir el último punto
        if (points.length > 1) {
            downsampled.push(points[points.length - 1]);
        }

        logger.info('Downsample completado', {
            original: points.length,
            downsampled: downsampled.length
        });

        return downsampled;
    }

    /**
     * Obtiene sesiones con cache y paginación optimizada
     */
    static async getSessionsOptimized(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        vehicleId?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const { organizationId, page = 1, limit = 20, vehicleId, dateFrom, dateTo } = params;
        const cacheKey = `sessions:${organizationId}:${page}:${limit}:${vehicleId || 'all'}:${dateFrom || 'all'}:${dateTo || 'all'}`;

        return await cacheService.getOrSet(
            cacheKey,
            async () => {
                const offset = (page - 1) * limit;
                const where: any = { organizationId };

                if (vehicleId) where.vehicleId = vehicleId;
                if (dateFrom || dateTo) {
                    where.startTime = {};
                    if (dateFrom) where.startTime.gte = new Date(dateFrom);
                    if (dateTo) where.startTime.lte = new Date(dateTo);
                }

                const [sessions, total] = await Promise.all([
                    prisma.session.findMany({
                        where,
                        include: {
                            vehicle: {
                                select: { id: true, name: true, licensePlate: true }
                            },
                            user: {
                                select: { id: true, name: true, email: true }
                            }
                        },
                        orderBy: { startTime: 'desc' },
                        skip: offset,
                        take: limit
                    }),
                    prisma.session.count({ where })
                ]);

                return {
                    sessions,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            },
            2 * 60 * 1000 // Cache por 2 minutos
        );
    }

    /**
     * Obtiene vehículos con cache
     */
    static async getVehiclesOptimized(organizationId: string) {
        const cacheKey = `vehicles:${organizationId}`;

        return await cacheService.getOrSet(
            cacheKey,
            async () => {
                return await prisma.vehicle.findMany({
                    where: { organizationId },
                    select: {
                        id: true,
                        name: true,
                        licensePlate: true,
                        model: true,
                        brand: true,
                        type: true,
                        status: true
                    },
                    orderBy: { name: 'asc' }
                });
            },
            5 * 60 * 1000 // Cache por 5 minutos
        );
    }

    /**
     * Obtiene eventos con cache y filtros optimizados
     */
    static async getEventsOptimized(params: {
        organizationId: string;
        page?: number;
        limit?: number;
        vehicleId?: string;
        type?: string;
        severity?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        const { organizationId, page = 1, limit = 50, vehicleId, type, severity, dateFrom, dateTo } = params;
        const cacheKey = `events:${organizationId}:${page}:${limit}:${vehicleId || 'all'}:${type || 'all'}:${severity || 'all'}:${dateFrom || 'all'}:${dateTo || 'all'}`;

        return await cacheService.getOrSet(
            cacheKey,
            async () => {
                const offset = (page - 1) * limit;
                const where: any = { organizationId };

                if (vehicleId) {
                    where.vehicles = {
                        some: { vehicleId }
                    };
                }
                if (type) where.type = type;
                if (severity) where.data = { path: ['severity'], equals: severity };
                if (dateFrom || dateTo) {
                    where.timestamp = {};
                    if (dateFrom) where.timestamp.gte = new Date(dateFrom);
                    if (dateTo) where.timestamp.lte = new Date(dateTo);
                }

                const [events, total] = await Promise.all([
                    prisma.event.findMany({
                        where,
                        include: {
                            vehicles: {
                                select: {
                                    vehicle: {
                                        select: { id: true, name: true, licensePlate: true }
                                    }
                                }
                            }
                        },
                        orderBy: { timestamp: 'desc' },
                        skip: offset,
                        take: limit
                    }),
                    prisma.event.count({ where })
                ]);

                return {
                    events,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            },
            1 * 60 * 1000 // Cache por 1 minuto
        );
    }

    /**
     * Obtiene métricas de KPI con cache
     */
    static async getKPIMetricsOptimized(organizationId: string) {
        const cacheKey = `kpi:${organizationId}`;

        return await cacheService.getOrSet(
            cacheKey,
            async () => {
                const [totalSessions, totalVehicles, totalEvents, recentEvents] = await Promise.all([
                    prisma.session.count({ where: { organizationId } }),
                    prisma.vehicle.count({ where: { organizationId } }),
                    prisma.event.count({ where: { organizationId } }),
                    prisma.event.count({
                        where: {
                            organizationId,
                            timestamp: {
                                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                            }
                        }
                    })
                ]);

                return {
                    totalSessions,
                    totalVehicles,
                    totalEvents,
                    recentEvents
                };
            },
            5 * 60 * 1000 // Cache por 5 minutos
        );
    }

    /**
     * Optimiza consultas de geocercas
     */
    static async getGeofencesOptimized(organizationId: string) {
        const cacheKey = `geofences:${organizationId}`;

        return await cacheService.getOrSet(
            cacheKey,
            async () => {
                // Mock data para geocercas (en un sistema real, esto vendría de la base de datos)
                return [
                    {
                        id: 'geofence-1',
                        name: 'Geocerca Demo 1',
                        type: 'POLYGON',
                        provider: 'RADAR',
                        organizationId,
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-3.703790, 40.416775],
                                    [-3.703000, 40.417000],
                                    [-3.704000, 40.417500],
                                    [-3.703790, 40.416775]
                                ]
                            ]
                        },
                        tags: ['demo', 'madrid'],
                        version: 1
                    },
                    {
                        id: 'geofence-2',
                        name: 'Geocerca Demo 2',
                        type: 'CIRCLE',
                        provider: 'RADAR',
                        organizationId,
                        geometry: {
                            type: 'Circle',
                            center: { lat: 40.415, lng: -3.705 },
                            radius: 100
                        },
                        tags: ['demo', 'centro'],
                        version: 1
                    }
                ];
            },
            10 * 60 * 1000 // Cache por 10 minutos
        );
    }

    /**
     * Limpia cache relacionado con una organización
     */
    static clearOrganizationCache(organizationId: string): void {
        const patterns = [
            `sessions:${organizationId}:*`,
            `vehicles:${organizationId}`,
            `events:${organizationId}:*`,
            `kpi:${organizationId}`,
            `geofences:${organizationId}`
        ];

        patterns.forEach(pattern => {
            // En una implementación real, usaríamos un cache distribuido como Redis
            // Por ahora, limpiamos todo el cache
            cacheService.clear();
        });

        logger.info('Cache de organización limpiado', { organizationId });
    }

    /**
     * Obtiene estadísticas de performance
     */
    static getPerformanceStats() {
        const cacheStats = cacheService.getStats();

        return {
            cache: cacheStats,
            timestamp: new Date().toISOString()
        };
    }
}
