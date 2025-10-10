import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { geofenceAlertService } from './GeofenceAlertService';

const prisma = new PrismaClient();

export interface GeofenceData {
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

export interface GeofenceEventData {
    geofenceId: string;
    vehicleId: string;
    organizationId: string;
    type: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE';
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    data?: any;
}

export class GeofenceService {
    /**
     * Crear una nueva geocerca
     */
    async createGeofence(data: GeofenceData): Promise<any> {
        try {
            logger.info(`[GeofenceService] Creando geocerca: ${data.name}`);

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
                    organizationId: data.organizationId
                }
            });

            logger.info(`[GeofenceService] Geocerca creada exitosamente: ${geofence.id}`);
            return geofence;
        } catch (error) {
            logger.error(`[GeofenceService] Error creando geocerca:`, error);
            throw error;
        }
    }

    /**
     * Obtener todas las geocercas de una organización
     */
    async getGeofencesByOrganization(organizationId: string): Promise<any[]> {
        try {
            logger.info(`[GeofenceService] Obteniendo geocercas para organización: ${organizationId}`);

            const geofences = await prisma.geofence.findMany({
                where: { organizationId },
                orderBy: { createdAt: 'desc' }
            });

            logger.info(`[GeofenceService] Encontradas ${geofences.length} geocercas`);
            return geofences;
        } catch (error) {
            logger.error(`[GeofenceService] Error obteniendo geocercas:`, error);
            throw error;
        }
    }

    /**
     * Obtener una geocerca por ID
     */
    async getGeofenceById(id: string): Promise<any | null> {
        try {
            logger.info(`[GeofenceService] Obteniendo geocerca: ${id}`);

            const geofence = await prisma.geofence.findUnique({
                where: { id }
            });

            return geofence;
        } catch (error) {
            logger.error(`[GeofenceService] Error obteniendo geocerca:`, error);
            throw error;
        }
    }

    /**
     * Actualizar una geocerca
     */
    async updateGeofence(id: string, data: Partial<GeofenceData>): Promise<any> {
        try {
            logger.info(`[GeofenceService] Actualizando geocerca: ${id}`);

            const geofence = await prisma.geofence.update({
                where: { id },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });

            logger.info(`[GeofenceService] Geocerca actualizada exitosamente: ${id}`);
            return geofence;
        } catch (error) {
            logger.error(`[GeofenceService] Error actualizando geocerca:`, error);
            throw error;
        }
    }

    /**
     * Eliminar una geocerca
     */
    async deleteGeofence(id: string): Promise<void> {
        try {
            logger.info(`[GeofenceService] Eliminando geocerca: ${id}`);

            await prisma.geofence.delete({
                where: { id }
            });

            logger.info(`[GeofenceService] Geocerca eliminada exitosamente: ${id}`);
        } catch (error) {
            logger.error(`[GeofenceService] Error eliminando geocerca:`, error);
            throw error;
        }
    }

    /**
     * Verificar si un punto está dentro de una geocerca
     */
    async isPointInsideGeofence(geofenceId: string, latitude: number, longitude: number): Promise<boolean> {
        try {
            const geofence = await this.getGeofenceById(geofenceId);
            if (!geofence || !geofence.enabled) {
                return false;
            }

            switch (geofence.type) {
                case 'CIRCLE':
                    return this.isPointInsideCircle(
                        latitude,
                        longitude,
                        geofence.geometryCenter.coordinates[1],
                        geofence.geometryCenter.coordinates[0],
                        geofence.geometryRadius || 0
                    );

                case 'POLYGON':
                    return this.isPointInsidePolygon(
                        latitude,
                        longitude,
                        geofence.geometry.coordinates[0]
                    );

                case 'RECTANGLE':
                    return this.isPointInsideRectangle(
                        latitude,
                        longitude,
                        geofence.geometry
                    );

                default:
                    return false;
            }
        } catch (error) {
            logger.error(`[GeofenceService] Error verificando punto en geocerca:`, error);
            return false;
        }
    }

    /**
     * Verificar si un punto está dentro de un círculo
     */
    private isPointInsideCircle(lat: number, lng: number, centerLat: number, centerLng: number, radius: number): boolean {
        const distance = this.calculateDistance(lat, lng, centerLat, centerLng);
        return distance <= radius;
    }

    /**
     * Verificar si un punto está dentro de un polígono usando el algoritmo ray casting
     */
    private isPointInsidePolygon(lat: number, lng: number, polygon: number[][]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            if (((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    /**
     * Verificar si un punto está dentro de un rectángulo
     */
    private isPointInsideRectangle(lat: number, lng: number, rectangle: any): boolean {
        // Implementación básica para rectángulo
        // Asumiendo que rectangle tiene formato {minLat, maxLat, minLng, maxLng}
        const { minLat, maxLat, minLng, maxLng } = rectangle;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
    }

    /**
     * Calcular distancia entre dos puntos usando la fórmula de Haversine
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convertir grados a radianes
     */
    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Crear un evento de geocerca
     */
    async createGeofenceEvent(data: GeofenceEventData): Promise<any> {
        try {
            logger.info(`[GeofenceService] Creando evento de geocerca: ${data.type} para vehículo ${data.vehicleId}`);

            const event = await prisma.geofenceEvent.create({
                data: {
                    geofenceId: data.geofenceId,
                    vehicleId: data.vehicleId,
                    organizationId: data.organizationId,
                    type: data.type,
                    timestamp: data.timestamp,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    speed: data.speed,
                    heading: data.heading,
                    data: data.data
                }
            });

            logger.info(`[GeofenceService] Evento de geocerca creado exitosamente: ${event.id}`);
            return event;
        } catch (error) {
            logger.error(`[GeofenceService] Error creando evento de geocerca:`, error);
            throw error;
        }
    }

    /**
     * Obtener eventos de geocerca para un vehículo
     */
    async getGeofenceEventsByVehicle(vehicleId: string, organizationId: string, from?: Date, to?: Date): Promise<any[]> {
        try {
            logger.info(`[GeofenceService] Obteniendo eventos de geocerca para vehículo: ${vehicleId}`);

            const where: any = {
                vehicleId,
                organizationId
            };

            if (from && to) {
                where.timestamp = {
                    gte: from,
                    lte: to
                };
            }

            const events = await prisma.geofenceEvent.findMany({
                where,
                include: {
                    geofence: true
                },
                orderBy: { timestamp: 'desc' }
            });

            logger.info(`[GeofenceService] Encontrados ${events.length} eventos de geocerca`);
            return events;
        } catch (error) {
            logger.error(`[GeofenceService] Error obteniendo eventos de geocerca:`, error);
            throw error;
        }
    }

    /**
     * Procesar puntos GPS y detectar eventos de geocerca
     */
    async processGPSPoints(vehicleId: string, organizationId: string, gpsPoints: any[]): Promise<void> {
        try {
            logger.info(`[GeofenceService] Procesando ${gpsPoints.length} puntos GPS para vehículo: ${vehicleId}`);

            // Obtener todas las geocercas habilitadas de la organización
            const geofences = await this.getGeofencesByOrganization(organizationId);
            const enabledGeofences = geofences.filter(g => g.enabled);

            if (enabledGeofences.length === 0) {
                logger.info(`[GeofenceService] No hay geocercas habilitadas para procesar`);
                return;
            }

            // Obtener el último estado conocido del vehículo
            const lastState = await prisma.geofenceVehicleState.findFirst({
                where: { vehicleId, organizationId },
                orderBy: { lastUpdate: 'desc' }
            });

            const currentZones = lastState?.currentZones || [];

            // Procesar cada punto GPS
            for (const point of gpsPoints) {
                const { latitude, longitude, timestamp } = point;

                for (const geofence of enabledGeofences) {
                    const isInside = await this.isPointInsideGeofence(geofence.id, latitude, longitude);
                    const wasInside = currentZones.includes(geofence.id);

                    // Detectar entrada
                    if (isInside && !wasInside) {
                        await this.createGeofenceEvent({
                            geofenceId: geofence.id,
                            vehicleId,
                            organizationId,
                            type: 'ENTER',
                            timestamp: new Date(timestamp),
                            latitude,
                            longitude,
                            speed: point.speed,
                            heading: point.heading,
                            data: { geofenceName: geofence.name }
                        });

                        // Generar alerta de entrada
                        await geofenceAlertService.processGeofenceEvent(
                            vehicleId,
                            geofence.id,
                            'ENTER',
                            new Date(timestamp),
                            organizationId
                        );

                        currentZones.push(geofence.id);
                        logger.info(`[GeofenceService] Vehículo ${vehicleId} entró en geocerca: ${geofence.name}`);
                    }

                    // Detectar salida
                    if (!isInside && wasInside) {
                        await this.createGeofenceEvent({
                            geofenceId: geofence.id,
                            vehicleId,
                            organizationId,
                            type: 'EXIT',
                            timestamp: new Date(timestamp),
                            latitude,
                            longitude,
                            speed: point.speed,
                            heading: point.heading,
                            data: { geofenceName: geofence.name }
                        });

                        // Generar alerta de salida
                        await geofenceAlertService.processGeofenceEvent(
                            vehicleId,
                            geofence.id,
                            'EXIT',
                            new Date(timestamp),
                            organizationId
                        );

                        const index = currentZones.indexOf(geofence.id);
                        if (index > -1) {
                            currentZones.splice(index, 1);
                        }
                        logger.info(`[GeofenceService] Vehículo ${vehicleId} salió de geocerca: ${geofence.name}`);
                    }
                }
            }

            // Actualizar el estado del vehículo
            await prisma.geofenceVehicleState.upsert({
                where: { vehicleId_organizationId: { vehicleId, organizationId } },
                update: {
                    currentZones,
                    lastUpdate: new Date()
                },
                create: {
                    vehicleId,
                    organizationId,
                    currentZones,
                    lastUpdate: new Date()
                }
            });

            logger.info(`[GeofenceService] Procesamiento de puntos GPS completado para vehículo: ${vehicleId}`);
        } catch (error) {
            logger.error(`[GeofenceService] Error procesando puntos GPS:`, error);
            throw error;
        }
    }

    /**
     * Importar geocerca desde radar.com
     */
    async importFromRadar(radarData: any, organizationId: string): Promise<any> {
        try {
            logger.info(`[GeofenceService] Importando geocerca desde radar.com: ${radarData.description}`);

            const geofenceData: GeofenceData = {
                externalId: radarData._id,
                name: radarData.description,
                description: radarData.description,
                tag: radarData.tag,
                type: radarData.type.toUpperCase(),
                mode: radarData.mode.toUpperCase(),
                enabled: radarData.enabled,
                live: radarData.live,
                geometry: radarData.geometry,
                geometryCenter: radarData.geometryCenter,
                geometryRadius: radarData.geometryRadius,
                disallowedPrecedingTagSubstrings: radarData.disallowedPrecedingTagSubstrings,
                ip: radarData.ip,
                organizationId
            };

            const geofence = await this.createGeofence(geofenceData);

            logger.info(`[GeofenceService] Geocerca importada exitosamente desde radar.com: ${geofence.id}`);
            return geofence;
        } catch (error) {
            logger.error(`[GeofenceService] Error importando geocerca desde radar.com:`, error);
            throw error;
        }
    }
}

export const geofenceService = new GeofenceService();
