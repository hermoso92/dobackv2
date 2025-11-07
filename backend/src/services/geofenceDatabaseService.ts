/**
 * 🗺️ SERVICIO DE BASE DE DATOS PARA GEOFENCES - BOMBEROS MADRID
 * Servicio completo para gestión de geofences con base de datos
 */


import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { PostGISGeometryService } from './PostGISGeometryService';



interface GeofenceData {
    id?: string;
    externalId?: string;
    name: string;
    description?: string;
    tag?: string;
    type: 'POLYGON' | 'CIRCLE' | 'RECTANGLE';
    mode: 'CAR' | 'FOOT' | 'BIKE' | 'ALL';
    enabled: boolean;
    live: boolean;
    geometry: any;
    geometryCenter?: any;
    geometryRadius?: number;
    disallowedPrecedingTagSubstrings?: any;
    ip?: any;
    organizationId: string;
}

interface GeofenceEventData {
    geofenceId: string;
    vehicleId: string;
    organizationId: string;
    type: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE';
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    data?: any;
}

interface GeofenceQuery {
    organizationId: string;
    enabled?: boolean;
    type?: string;
    tag?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

class GeofenceDatabaseService extends EventEmitter {
    private postgisService: PostGISGeometryService;

    constructor() {
        super();
        this.postgisService = new PostGISGeometryService(prisma);
    }

    /**
     * Crear una nueva geocerca
     */
    async createGeofence(data: GeofenceData): Promise<any> {
        try {
            logger.info(`[GeofenceDB] Creando geocerca: ${data.name}`);

            // ✅ Convertir geometría JSON a PostGIS
            let geometryPostgis = null;
            if (data.geometry) {
                geometryPostgis = await this.postgisService.convertJsonToPostGIS(data.geometry);
                logger.info(`[GeofenceDB] Geometría PostGIS generada: ${geometryPostgis ? 'SÍ' : 'NO'}`);
            }

            const geofence = await prisma.geofence.create({
                data: {
                    externalId: data.externalId,
                    name: data.name,
                    description: data.description,
                    tag: data.tag,
                    type: data.type,
                    mode: data.mode,
                    enabled: data.enabled,
                    live: data.live,
                    geometry: data.geometry,
                    geometryCenter: data.geometryCenter,
                    geometryRadius: data.geometryRadius,
                    disallowedPrecedingTagSubstrings: data.disallowedPrecedingTagSubstrings,
                    ip: data.ip,
                    organizationId: data.organizationId,
                    // ✅ NUEVO: Guardar geometría PostGIS
                    geometry_postgis: geometryPostgis ? prisma.$queryRawUnsafe(`ST_GeomFromText('${geometryPostgis}', 4326)`) : null
                }
            });

            logger.info(`[GeofenceDB] Geocerca creada: ${geofence.id} (PostGIS: ${geometryPostgis ? 'SÍ' : 'NO'})`);
            this.emit('geofenceCreated', geofence);
            return geofence;
        } catch (error) {
            logger.error(`[GeofenceDB] Error creando geocerca:`, error);
            throw error;
        }
    }

    /**
     * Obtener geocerca por ID
     */
    async getGeofenceById(id: string, organizationId: string): Promise<any | null> {
        try {
            const geofence = await prisma.geofence.findFirst({
                where: {
                    id,
                    organizationId
                },
                include: {
                    events: {
                        orderBy: { timestamp: 'desc' },
                        take: 10
                    }
                }
            });

            return geofence;
        } catch (error) {
            logger.error(`[GeofenceDB] Error obteniendo geocerca ${id}:`, error);
            throw error;
        }
    }

    /**
     * Obtener todas las geocercas de una organización
     */
    async getGeofences(query: GeofenceQuery): Promise<{
        geofences: any[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const {
                organizationId,
                enabled,
                type,
                tag,
                search,
                limit = 50,
                offset = 0
            } = query;

            const where: any = {
                organizationId
            };

            if (enabled !== undefined) {
                where.enabled = enabled;
            }

            if (type) {
                where.type = type;
            }

            if (tag) {
                where.tag = tag;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }

            const [geofences, total] = await Promise.all([
                prisma.geofence.findMany({
                    where,
                    include: {
                        _count: {
                            select: {
                                events: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip: offset
                }),
                prisma.geofence.count({ where })
            ]);

            return {
                geofences,
                total,
                hasMore: offset + geofences.length < total
            };
        } catch (error) {
            logger.error(`[GeofenceDB] Error obteniendo geocercas:`, error);
            throw error;
        }
    }

    /**
     * Actualizar geocerca
     */
    async updateGeofence(id: string, organizationId: string, data: Partial<GeofenceData>): Promise<any> {
        try {
            logger.info(`[GeofenceDB] Actualizando geocerca: ${id}`);

            const geofence = await prisma.geofence.updateMany({
                where: {
                    id,
                    organizationId
                },
                data: {
                    ...(data.name && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.tag !== undefined && { tag: data.tag }),
                    ...(data.type && { type: data.type }),
                    ...(data.mode && { mode: data.mode }),
                    ...(data.enabled !== undefined && { enabled: data.enabled }),
                    ...(data.live !== undefined && { live: data.live }),
                    ...(data.geometry && { geometry: data.geometry }),
                    ...(data.geometryCenter && { geometryCenter: data.geometryCenter }),
                    ...(data.geometryRadius !== undefined && { geometryRadius: data.geometryRadius }),
                    ...(data.disallowedPrecedingTagSubstrings && { disallowedPrecedingTagSubstrings: data.disallowedPrecedingTagSubstrings }),
                    ...(data.ip && { ip: data.ip })
                }
            });

            if (geofence.count === 0) {
                throw new Error('Geocerca no encontrada');
            }

            const updatedGeofence = await this.getGeofenceById(id, organizationId);
            this.emit('geofenceUpdated', updatedGeofence);
            return updatedGeofence;
        } catch (error) {
            logger.error(`[GeofenceDB] Error actualizando geocerca ${id}:`, error);
            throw error;
        }
    }

    /**
     * Eliminar geocerca
     */
    async deleteGeofence(id: string, organizationId: string): Promise<boolean> {
        try {
            logger.info(`[GeofenceDB] Eliminando geocerca: ${id}`);

            const result = await prisma.geofence.deleteMany({
                where: {
                    id,
                    organizationId
                }
            });

            if (result.count === 0) {
                throw new Error('Geocerca no encontrada');
            }

            this.emit('geofenceDeleted', { id, organizationId });
            return true;
        } catch (error) {
            logger.error(`[GeofenceDB] Error eliminando geocerca ${id}:`, error);
            throw error;
        }
    }

    /**
     * Crear evento de geocerca
     */
    async createGeofenceEvent(data: GeofenceEventData): Promise<any> {
        try {
            const event = await prisma.geofenceEvent.create({
                data: {
                    geofenceId: data.geofenceId,
                    vehicleId: data.vehicleId,
                    organizationId: data.organizationId,
                    type: data.type,
                    timestamp: new Date(),
                    latitude: data.latitude,
                    longitude: data.longitude,
                    speed: data.speed,
                    heading: data.heading,
                    data: data.data
                }
            });

            this.emit('geofenceEventCreated', event);
            return event;
        } catch (error) {
            logger.error(`[GeofenceDB] Error creando evento de geocerca:`, error);
            throw error;
        }
    }

    /**
     * Obtener eventos de geocerca
     */
    async getGeofenceEvents(filters: {
        geofenceId?: string;
        vehicleId?: string;
        organizationId: string;
        type?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: any[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const {
                geofenceId,
                vehicleId,
                organizationId,
                type,
                startDate,
                endDate,
                limit = 100,
                offset = 0
            } = filters;

            const where: any = {
                organizationId
            };

            if (geofenceId) {
                where.geofenceId = geofenceId;
            }

            if (vehicleId) {
                where.vehicleId = vehicleId;
            }

            if (type) {
                where.type = type;
            }

            if (startDate || endDate) {
                where.timestamp = {};
                if (startDate) {
                    where.timestamp.gte = startDate;
                }
                if (endDate) {
                    where.timestamp.lte = endDate;
                }
            }

            const [events, total] = await Promise.all([
                prisma.geofenceEvent.findMany({
                    where,
                    include: {
                        geofence: {
                            select: {
                                name: true,
                                type: true
                            }
                        }
                    },
                    orderBy: { timestamp: 'desc' },
                    take: limit,
                    skip: offset
                }),
                prisma.geofenceEvent.count({ where })
            ]);

            return {
                events,
                total,
                hasMore: offset + events.length < total
            };
        } catch (error) {
            logger.error(`[GeofenceDB] Error obteniendo eventos de geocerca:`, error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas de geocercas
     */
    async getGeofenceStats(organizationId: string): Promise<{
        totalGeofences: number;
        activeGeofences: number;
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsLast24h: number;
        mostActiveGeofences: Array<{
            id: string;
            name: string;
            eventCount: number;
        }>;
    }> {
        try {
            const [
                totalGeofences,
                activeGeofences,
                totalEvents,
                eventsByType,
                eventsLast24h,
                mostActiveGeofences
            ] = await Promise.all([
                prisma.geofence.count({
                    where: { organizationId }
                }),
                prisma.geofence.count({
                    where: {
                        organizationId,
                        enabled: true
                    }
                }),
                prisma.geofenceEvent.count({
                    where: { organizationId }
                }),
                prisma.geofenceEvent.groupBy({
                    by: ['type'],
                    where: { organizationId },
                    _count: { type: true }
                }),
                prisma.geofenceEvent.count({
                    where: {
                        organizationId,
                        timestamp: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                        }
                    }
                }),
                prisma.geofenceEvent.groupBy({
                    by: ['geofenceId'],
                    where: { organizationId },
                    _count: { geofenceId: true },
                    orderBy: { _count: { geofenceId: 'desc' } },
                    take: 5
                })
            ]);

            // Obtener nombres de geocercas más activas
            const geofenceNames = await prisma.geofence.findMany({
                where: {
                    id: { in: mostActiveGeofences.map(g => g.geofenceId) }
                },
                select: { id: true, name: true }
            });

            const geofenceNameMap = new Map(geofenceNames.map(g => [g.id, g.name]));

            return {
                totalGeofences,
                activeGeofences,
                totalEvents,
                eventsByType: eventsByType.reduce((acc, item) => {
                    acc[item.type] = item._count.type;
                    return acc;
                }, {} as Record<string, number>),
                eventsLast24h,
                mostActiveGeofences: mostActiveGeofences.map(g => ({
                    id: g.geofenceId,
                    name: geofenceNameMap.get(g.geofenceId) || 'Geocerca desconocida',
                    eventCount: g._count.geofenceId
                }))
            };
        } catch (error) {
            logger.error(`[GeofenceDB] Error obteniendo estadísticas:`, error);
            throw error;
        }
    }

    /**
     * Verificar si un vehículo está dentro de alguna geocerca
     */
    async checkVehicleInGeofences(
        vehicleId: string,
        organizationId: string,
        latitude: number,
        longitude: number
    ): Promise<{
        insideGeofences: Array<{
            geofenceId: string;
            geofenceName: string;
            type: string;
        }>;
        events: any[];
    }> {
        try {
            // Obtener todas las geocercas activas
            const geofences = await prisma.geofence.findMany({
                where: {
                    organizationId,
                    enabled: true
                }
            });

            const insideGeofences = [];
            const events = [];

            for (const geofence of geofences) {
                let isInside = false;

                // Verificar si el punto está dentro de la geocerca
                if (geofence.type === 'CIRCLE' && geofence.geometryRadius && geofence.geometryCenter) {
                    const center = geofence.geometryCenter as { lat: number; lng: number };
                    const distance = this.calculateDistance(
                        [latitude, longitude],
                        [center.lat, center.lng]
                    );
                    isInside = distance <= geofence.geometryRadius;
                } else if (geofence.type === 'POLYGON' && geofence.geometry) {
                    const polygon = geofence.geometry as { coordinates: number[][] };
                    isInside = this.isPointInPolygon(
                        [latitude, longitude],
                        polygon.coordinates
                    );
                }

                if (isInside) {
                    insideGeofences.push({
                        geofenceId: geofence.id,
                        geofenceName: geofence.name,
                        type: geofence.type
                    });

                    // Crear evento de entrada si es necesario
                    const lastEvent = await prisma.geofenceEvent.findFirst({
                        where: {
                            geofenceId: geofence.id,
                            vehicleId,
                            organizationId
                        },
                        orderBy: { timestamp: 'desc' }
                    });

                    if (!lastEvent || lastEvent.type === 'EXIT') {
                        const event = await this.createGeofenceEvent({
                            geofenceId: geofence.id,
                            vehicleId,
                            organizationId,
                            type: 'ENTER',
                            latitude,
                            longitude
                        });
                        events.push(event);
                    }
                }
            }

            return {
                insideGeofences,
                events
            };
        } catch (error) {
            logger.error(`[GeofenceDB] Error verificando geocercas:`, error);
            throw error;
        }
    }

    /**
     * Calcular distancia entre dos puntos
     */
    private calculateDistance(point1: [number, number], point2: [number, number]): number {
        const R = 6371000; // Radio de la Tierra en metros
        const [lat1, lng1] = point1;
        const [lat2, lng2] = point2;

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Verificar si un punto está dentro de un polígono
     */
    private isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Obtener métricas de rendimiento
     */
    async getPerformanceMetrics(): Promise<{
        totalGeofences: number;
        totalEvents: number;
        avgEventsPerGeofence: number;
        lastActivity: Date | null;
    }> {
        try {
            const [totalGeofences, totalEvents, lastEvent] = await Promise.all([
                prisma.geofence.count(),
                prisma.geofenceEvent.count(),
                prisma.geofenceEvent.findFirst({
                    orderBy: { timestamp: 'desc' },
                    select: { timestamp: true }
                })
            ]);

            return {
                totalGeofences,
                totalEvents,
                avgEventsPerGeofence: totalGeofences > 0 ? totalEvents / totalGeofences : 0,
                lastActivity: lastEvent?.timestamp || null
            };
        } catch (error) {
            logger.error(`[GeofenceDB] Error obteniendo métricas:`, error);
            throw error;
        }
    }
}

export const geofenceDatabaseService = new GeofenceDatabaseService();
export default geofenceDatabaseService;
