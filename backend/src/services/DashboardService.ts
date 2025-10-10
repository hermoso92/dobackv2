import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class DashboardService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getDashboardStats(organizationId: string) {
        try {
            logger.info('Obteniendo estadísticas del dashboard', { organizationId });

            if (!organizationId) {
                throw new Error('Organization ID is required');
            }

            // Verify organization exists
            const organization = await this.prisma.organization.findUnique({
                where: { id: organizationId }
            });

            if (!organization) {
                throw new Error(`Organization with ID ${organizationId} not found`);
            }

            // Obtener total de vehículos y su distribución por estado
            const vehicleStats = await this.prisma.vehicle.groupBy({
                by: ['status'],
                where: { organizationId },
                _count: true
            });

            // Obtener total de eventos por tipo
            const eventStats = await this.prisma.event.groupBy({
                by: ['type'],
                where: { organizationId },
                _count: true
            });

            // Obtener métricas de sesiones
            const sessionStats = await this.prisma.session.aggregate({
                where: {
                    vehicle: { organizationId }
                },
                _count: true,
                _avg: {
                    sessionNumber: true,
                    sequence: true
                }
            });

            // Obtener eventos recientes
            const recentEvents = await this.prisma.event.findMany({
                where: {
                    organizationId,
                    timestamp: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                },
                include: {
                    vehicles: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            const stats = {
                totalVehicles: vehicleStats.reduce((acc, curr) => acc + curr._count, 0),
                activeVehicles: vehicleStats.find((v) => v.status === 'ACTIVE')?._count || 0,
                totalAlerts: eventStats.reduce((acc, curr) => acc + curr._count, 0),
                activeAlerts: eventStats.find((e) => e.type === 'SYSTEM')?._count || 0,
                recentEvents: recentEvents.map((event) => ({
                    id: event.id,
                    type: event.type,
                    description:
                        typeof event.displayData === 'object' && event.displayData !== null
                            ? (event.displayData as { message?: string }).message || ''
                            : '',
                    severity: event.type,
                    vehicleName: event.vehicles[0]?.vehicle?.name || 'N/A',
                    timestamp: event.timestamp.toISOString()
                }))
            };

            logger.info('Estadísticas obtenidas exitosamente', { stats });
            return stats;
        } catch (error) {
            logger.error('Error al obtener estadísticas del dashboard', {
                error,
                organizationId,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                errorStack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    async getTrends(organizationId: string, timeRange: 'day' | 'week' | 'month' = 'week') {
        try {
            const now = new Date();
            let startDate: Date;

            switch (timeRange) {
                case 'day':
                    startDate = new Date(now.setDate(now.getDate() - 1));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
            }

            // Obtener tendencias de eventos
            const eventTrends = await this.prisma.event.groupBy({
                by: ['timestamp'],
                where: {
                    organizationId,
                    timestamp: {
                        gte: startDate
                    }
                },
                _count: true,
                orderBy: {
                    timestamp: 'asc'
                }
            });

            // Obtener tendencias de sesiones
            const sessionTrends = await this.prisma.session.groupBy({
                by: ['startTime'],
                where: {
                    vehicle: { organizationId },
                    startTime: {
                        gte: startDate
                    }
                },
                _count: true,
                _avg: {
                    sessionNumber: true,
                    sequence: true
                },
                orderBy: {
                    startTime: 'asc'
                }
            });

            // Obtener eventos recientes
            const recentEvents = await this.prisma.event.findMany({
                where: {
                    organizationId,
                    timestamp: {
                        gte: startDate
                    }
                },
                include: {
                    vehicles: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            return {
                events: eventTrends.map((trend) => ({
                    date: trend.timestamp,
                    count: trend._count
                })),
                sessions: sessionTrends.map((trend) => ({
                    date: trend.startTime,
                    count: trend._count,
                    averageSessionNumber: trend._avg?.sessionNumber || 0,
                    averageSequence: trend._avg?.sequence || 0
                })),
                recentEvents: recentEvents.map((event) => ({
                    id: event.id,
                    type: event.type,
                    description:
                        typeof event.displayData === 'object' && event.displayData !== null
                            ? (event.displayData as { message?: string }).message || ''
                            : '',
                    severity: event.type,
                    vehicleName: event.vehicles[0]?.vehicle?.name || 'N/A',
                    timestamp: event.timestamp.toISOString()
                }))
            };
        } catch (error) {
            logger.error('Error al obtener tendencias', { error });
            throw error;
        }
    }

    async getVehiclePerformance(organizationId: string, vehicleId: string) {
        try {
            // Obtener métricas de rendimiento del vehículo
            const performance = await this.prisma.session.aggregate({
                where: {
                    vehicleId,
                    vehicle: { organizationId }
                },
                _count: true,
                _avg: {
                    sessionNumber: true,
                    sequence: true
                }
            });

            // Obtener eventos recientes del vehículo
            const recentEvents = await this.prisma.event.findMany({
                where: {
                    vehicles: {
                        some: {
                            vehicleId,
                            vehicle: {
                                organizationId
                            }
                        }
                    },
                    timestamp: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                },
                include: {
                    vehicles: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            return {
                metrics: {
                    totalSessions: performance._count,
                    averageSessionNumber: performance._avg?.sessionNumber || 0,
                    averageSequence: performance._avg?.sequence || 0
                },
                recentEvents: recentEvents.map((event) => ({
                    id: event.id,
                    type: event.type,
                    description:
                        typeof event.displayData === 'object' && event.displayData !== null
                            ? (event.displayData as { message?: string }).message || ''
                            : '',
                    severity: event.type,
                    vehicleName: event.vehicles[0]?.vehicle?.name || 'N/A',
                    timestamp: event.timestamp.toISOString()
                }))
            };
        } catch (error) {
            logger.error('Error al obtener rendimiento del vehículo', { error });
            throw error;
        }
    }

    async getRecentActivity(organizationId: string, limit = 10) {
        try {
            const events = await this.prisma.event.findMany({
                where: { organizationId },
                include: {
                    vehicles: {
                        include: {
                            vehicle: true
                        }
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                },
                take: limit
            });

            return events.map((event) => ({
                id: event.id,
                type: event.type,
                description:
                    typeof event.displayData === 'object' && event.displayData !== null
                        ? (event.displayData as { message?: string }).message || ''
                        : '',
                severity: event.type,
                vehicleName: event.vehicles[0]?.vehicle?.name || 'N/A',
                timestamp: event.timestamp.toISOString()
            }));
        } catch (error) {
            logger.error('Error al obtener actividad reciente:', error);
            throw error;
        }
    }

    async getVehicleStatus(organizationId: string) {
        try {
            const vehicles = await this.prisma.vehicle.findMany({ where: { organizationId } });
            return vehicles.map((vehicle) => ({
                id: vehicle.id,
                name: vehicle.name,
                status: vehicle.status,
                activeSessions: 0,
                activeEvents: 0
            }));
        } catch (error) {
            logger.error('Error getting vehicle status', { error });
            throw error;
        }
    }

    async getMetrics(organizationId: string) {
        try {
            logger.info('Obteniendo métricas para organización:', organizationId);
            const [totalVehicles, totalSessions] = await Promise.all([
                this.prisma.vehicle.count({ where: { organizationId } }),
                this.prisma.session.count({ where: { vehicle: { organizationId } } })
            ]);
            return {
                totalVehicles,
                totalSessions
            };
        } catch (error) {
            logger.error('Error getting metrics', { error });
            throw error;
        }
    }

    async getRecentSessions(organizationId: string, limit = 5) {
        try {
            const sessions = await this.prisma.session.findMany({
                where: {
                    vehicle: { organizationId }
                },
                orderBy: {
                    startTime: 'desc'
                },
                take: limit,
                include: {
                    vehicle: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            return sessions.map((session) => ({
                id: session.id,
                startTime: session.startTime,
                endTime: session.endTime,
                vehicleName: session.vehicle.name,
                status: session.endTime ? 'COMPLETED' : 'IN_PROGRESS'
            }));
        } catch (error) {
            logger.error('Error al obtener sesiones recientes:', error);
            throw error;
        }
    }

    async getAlarmsByType(organizationId: string) {
        try {
            const events = await this.prisma.event.groupBy({
                by: ['type'],
                where: { organizationId },
                _count: {
                    type: true
                }
            });

            return events.map((event) => ({
                type: event.type,
                count: event._count.type
            }));
        } catch (error) {
            logger.error('Error al obtener alarmas por tipo:', error);
            throw error;
        }
    }

    async getVehicleStats(organizationId: string) {
        try {
            const vehicles = await this.prisma.vehicle.findMany({
                where: { organizationId },
                select: {
                    id: true,
                    name: true,
                    parkId: true,
                    identifier: true,
                    licensePlate: true,
                    type: true,
                    status: true,
                    _count: {
                        select: {
                            sessions: true
                        }
                    }
                }
            });

            return vehicles.map((vehicle) => ({
                id: vehicle.id,
                name: vehicle.name,
                parkId: vehicle.parkId,
                dobackId: vehicle.identifier,
                licensePlate: vehicle.licensePlate,
                type: vehicle.type,
                status: vehicle.status,
                sessionCount: vehicle._count.sessions
            }));
        } catch (error) {
            logger.error('Error al obtener estadísticas de vehículos:', error);
            throw error;
        }
    }
}
