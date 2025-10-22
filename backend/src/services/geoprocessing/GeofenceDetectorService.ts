import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { multiPolygon, point, polygon } from '@turf/helpers';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export interface GeofenceEvent {
    geofenceId: string;
    geofenceName: string;
    type: 'ENTER' | 'EXIT';
    timestamp: Date;
    lat: number;
    lon: number;
}

export class GeofenceDetectorService {
    async detectGeofenceEvents(
        sessionId: string,
        points: Array<{ lat: number; lon: number; timestamp: Date }>
    ): Promise<GeofenceEvent[]> {
        try {
            const session = await prisma.session.findUnique({
                where: { id: sessionId },
                select: { organizationId: true }
            });

            if (!session) {
                throw new Error(`Sesión ${sessionId} no encontrada`);
            }

            // Crear LineString para filtrar geocercas candidatas
            const coordinates = points.map(p => `${p.lon} ${p.lat}`).join(',');
            const lineString = `LINESTRING(${coordinates})`;

            // Consulta ÚNICA: obtener geocercas intersectadas + geometrías
            const intersectedGeofences = await prisma.$queryRaw<Array<{
                id: string;
                name: string;
                type: string;
                geometry: any;
            }>>`
                SELECT DISTINCT
                    g.id,
                    g.name,
                    g.type,
                    ST_AsGeoJSON(g.geometry_postgis)::jsonb as geometry
                FROM "Geofence" g
                WHERE g."organizationId" = ${session.organizationId}
                  AND g.enabled = true
                  AND g.geometry_postgis IS NOT NULL
                  AND ST_Intersects(
                    g.geometry_postgis,
                    ST_SetSRID(ST_GeomFromText(${lineString}), 4326)
                  )
            `;

            if (intersectedGeofences.length === 0) {
                logger.debug(`No se detectaron geocercas para sesión ${sessionId}`);
                return [];
            }

            logger.debug(`${intersectedGeofences.length} geocercas candidatas encontradas`);

            // Para cada geocerca, detectar transiciones EN MEMORIA con Turf.js
            const events: GeofenceEvent[] = [];

            for (const geofence of intersectedGeofences) {
                const transitions = this.detectTransitionsInMemory(geofence, points);
                events.push(...transitions.map(t => ({
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    type: t.type,
                    timestamp: t.timestamp,
                    lat: t.lat,
                    lon: t.lon
                })));
            }

            logger.info(`Detectados ${events.length} eventos de geocerca para sesión ${sessionId}`);

            return events;

        } catch (error: any) {
            logger.error('Error detectando eventos de geocerca:', error);
            return [];
        }
    }

    /**
     * Detecta transiciones EN MEMORIA usando Turf.js (NO SQL)
     */
    private detectTransitionsInMemory(
        geofence: { id: string; name: string; geometry: any },
        points: Array<{ lat: number; lon: number; timestamp: Date }>
    ): Array<{ type: 'ENTER' | 'EXIT'; timestamp: Date; lat: number; lon: number }> {
        const transitions: Array<{ type: 'ENTER' | 'EXIT'; timestamp: Date; lat: number; lon: number }> = [];
        let wasInside = false;

        // Convertir geometría a formato Turf
        const geofencePolygon = this.geoJSONToTurf(geofence.geometry);

        for (const p of points) {
            const pt = point([p.lon, p.lat]);
            const isInside = booleanPointInPolygon(pt, geofencePolygon);

            // Detectar entrada
            if (isInside && !wasInside) {
                transitions.push({
                    type: 'ENTER',
                    timestamp: p.timestamp,
                    lat: p.lat,
                    lon: p.lon
                });
            }

            // Detectar salida
            if (!isInside && wasInside) {
                transitions.push({
                    type: 'EXIT',
                    timestamp: p.timestamp,
                    lat: p.lat,
                    lon: p.lon
                });
            }

            wasInside = isInside;
        }

        return transitions;
    }

    /**
     * Convierte GeoJSON de PostGIS a formato Turf
     */
    private geoJSONToTurf(geom: any): any {
        if (geom.type === 'Polygon') return polygon(geom.coordinates);
        if (geom.type === 'MultiPolygon') return multiPolygon(geom.coordinates);
        throw new Error(`Geofence geometry type not supported: ${geom.type}`);
    }
}

export const geofenceDetectorService = new GeofenceDetectorService();

