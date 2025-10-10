import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export class PostGISGeometryService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Convierte geometría JSON a formato PostGIS
     */
    async convertJsonToPostGIS(geometry: any): Promise<string | null> {
        try {
            if (!geometry || typeof geometry !== 'object') {
                return null;
            }

            const { type, coordinates, center, radius } = geometry;

            if (type === 'Circle' && center && radius) {
                // Convertir círculo a polígono usando PostGIS
                const result = await this.prisma.$queryRaw<Array<{ geom: string }>>`
          SELECT ST_AsText(
            ST_Buffer(
              ST_Point(${center.lon}, ${center.lat})::GEOMETRY,
              ${radius / 111000.0},
              32
            )
          ) as geom
        `;

                return result[0]?.geom || null;
            }

            if (type === 'Polygon' && coordinates) {
                // Convertir GeoJSON Polygon a PostGIS
                const result = await this.prisma.$queryRaw<Array<{ geom: string }>>`
          SELECT ST_AsText(ST_GeomFromGeoJSON(${JSON.stringify(geometry)})) as geom
        `;

                return result[0]?.geom || null;
            }

            return null;
        } catch (error) {
            logger.error('Error convirtiendo geometría a PostGIS:', error);
            return null;
        }
    }

    /**
     * Verifica si un punto está dentro de una zona usando PostGIS
     */
    async isPointInZone(
        pointLon: number,
        pointLat: number,
        zoneId: string,
        organizationId: string
    ): Promise<boolean> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ is_inside: boolean }>>`
        SELECT ST_Contains(
          z.geometry_postgis,
          ST_SetSRID(ST_Point(${pointLon}, ${pointLat}), 4326)
        ) as is_inside
        FROM "Zone" z
        WHERE z.id = ${zoneId} 
        AND z."organizationId" = ${organizationId}
        AND z.geometry_postgis IS NOT NULL
      `;

            return result[0]?.is_inside || false;
        } catch (error) {
            logger.error('Error verificando punto en zona:', error);
            return false;
        }
    }

    /**
     * Verifica si un punto está dentro de un parque usando PostGIS
     */
    async isPointInPark(
        pointLon: number,
        pointLat: number,
        parkId: string,
        organizationId: string
    ): Promise<boolean> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ is_inside: boolean }>>`
        SELECT ST_Contains(
          p.geometry_postgis,
          ST_SetSRID(ST_Point(${pointLon}, ${pointLat}), 4326)
        ) as is_inside
        FROM "Park" p
        WHERE p.id = ${parkId} 
        AND p."organizationId" = ${organizationId}
        AND p.geometry_postgis IS NOT NULL
      `;

            return result[0]?.is_inside || false;
        } catch (error) {
            logger.error('Error verificando punto en parque:', error);
            return false;
        }
    }

    /**
     * Encuentra todas las zonas que contienen un punto
     */
    async findZonesContainingPoint(
        pointLon: number,
        pointLat: number,
        organizationId: string
    ): Promise<Array<{ id: string; name: string; type: string }>> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ id: string; name: string; type: string }>>`
        SELECT 
          z.id,
          z.name,
          z.type
        FROM "Zone" z
        WHERE ST_Contains(
          z.geometry_postgis,
          ST_SetSRID(ST_Point(${pointLon}, ${pointLat}), 4326)
        )
        AND z."organizationId" = ${organizationId}
        AND z.geometry_postgis IS NOT NULL
      `;

            return result;
        } catch (error) {
            logger.error('Error encontrando zonas que contienen punto:', error);
            return [];
        }
    }

    /**
     * Encuentra todos los parques que contienen un punto
     */
    async findParksContainingPoint(
        pointLon: number,
        pointLat: number,
        organizationId: string
    ): Promise<Array<{ id: string; name: string; identifier: string }>> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ id: string; name: string; identifier: string }>>`
        SELECT 
          p.id,
          p.name,
          p.identifier
        FROM "Park" p
        WHERE ST_Contains(
          p.geometry_postgis,
          ST_SetSRID(ST_Point(${pointLon}, ${pointLat}), 4326)
        )
        AND p."organizationId" = ${organizationId}
        AND p.geometry_postgis IS NOT NULL
      `;

            return result;
        } catch (error) {
            logger.error('Error encontrando parques que contienen punto:', error);
            return [];
        }
    }

    /**
     * Calcula la distancia entre dos puntos en metros
     */
    async calculateDistance(
        lon1: number,
        lat1: number,
        lon2: number,
        lat2: number
    ): Promise<number> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ distance: number }>>`
        SELECT ST_Distance(
          ST_Point(${lon1}, ${lat1})::GEOMETRY,
          ST_Point(${lon2}, ${lat2})::GEOMETRY
        ) * 111000 as distance
      `;

            return result[0]?.distance || 0;
        } catch (error) {
            logger.error('Error calculando distancia:', error);
            return 0;
        }
    }

    /**
     * Encuentra zonas dentro de un radio de un punto
     */
    async findZonesInRadius(
        centerLon: number,
        centerLat: number,
        radiusMeters: number,
        organizationId: string
    ): Promise<Array<{ id: string; name: string; type: string; distance: number }>> {
        try {
            const result = await this.prisma.$queryRaw<Array<{ id: string; name: string; type: string; distance: number }>>`
        SELECT 
          z.id,
          z.name,
          z.type,
          ST_Distance(
            z.geometry_postgis,
            ST_Point(${centerLon}, ${centerLat})::GEOMETRY
          ) * 111000 as distance
        FROM "Zone" z
        WHERE ST_DWithin(
          z.geometry_postgis,
          ST_Point(${centerLon}, ${centerLat})::GEOMETRY,
          ${radiusMeters / 111000.0}
        )
        AND z."organizationId" = ${organizationId}
        AND z.geometry_postgis IS NOT NULL
        ORDER BY distance ASC
      `;

            return result;
        } catch (error) {
            logger.error('Error encontrando zonas en radio:', error);
            return [];
        }
    }

    /**
     * Migra geometrías existentes a PostGIS
     */
    async migrateExistingGeometries(): Promise<{ success: number; errors: number }> {
        let success = 0;
        let errors = 0;

        try {
            // Migrar parques
            const parks = await this.prisma.park.findMany({
                where: { geometryPostgis: null },
                select: { id: true, geometry: true }
            });

            for (const park of parks) {
                try {
                    const postgisGeom = await this.convertJsonToPostGIS(park.geometry);
                    if (postgisGeom) {
                        await this.prisma.park.update({
                            where: { id: park.id },
                            data: { geometryPostgis: postgisGeom }
                        });
                        success++;
                    }
                } catch (error) {
                    logger.error(`Error migrando parque ${park.id}:`, error);
                    errors++;
                }
            }

            // Migrar zonas
            const zones = await this.prisma.zone.findMany({
                where: { geometryPostgis: null },
                select: { id: true, geometry: true }
            });

            for (const zone of zones) {
                try {
                    const postgisGeom = await this.convertJsonToPostGIS(zone.geometry);
                    if (postgisGeom) {
                        await this.prisma.zone.update({
                            where: { id: zone.id },
                            data: { geometryPostgis: postgisGeom }
                        });
                        success++;
                    }
                } catch (error) {
                    logger.error(`Error migrando zona ${zone.id}:`, error);
                    errors++;
                }
            }

            logger.info(`Migración completada: ${success} exitosas, ${errors} errores`);
        } catch (error) {
            logger.error('Error en migración masiva:', error);
        }

        return { success, errors };
    }
} 