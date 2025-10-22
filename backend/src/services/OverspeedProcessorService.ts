import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { speedLimitCorrectionService } from './SpeedLimitCorrectionService';

export class OverspeedProcessorService {
    private toleranceKmh: number;
    private searchRadiusM: number;

    constructor(prisma: PrismaClient, toleranceKmh = 3, searchRadiusM = 50) {
        this.toleranceKmh = toleranceKmh;
        this.searchRadiusM = searchRadiusM;
    }

    /**
     * Procesa eventos de velocidad para una sesión específica
     * @param sessionId ID de la sesión a procesar
     * @returns Número de eventos insertados
     */
    async processSession(sessionId: string): Promise<number> {
        try {
            logger.info(`[OverspeedProcessor] Procesando sesión: ${sessionId}`);

            // 1. Obtener puntos GPS de la sesión
            const gpsPointsRaw = await prisma.gpsMeasurement.findMany({
                where: {
                    sessionId: sessionId
                },
                select: {
                    timestamp: true,
                    latitude: true,
                    longitude: true,
                    speed: true
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });

            // Filtrar puntos con datos válidos
            const gpsPoints = gpsPointsRaw.filter(
                (point) =>
                    point.latitude !== null && point.longitude !== null && point.speed !== null
            );

            if (gpsPoints.length === 0) {
                logger.warn(
                    `[OverspeedProcessor] No se encontraron puntos GPS para la sesión: ${sessionId}`
                );
                return 0;
            }

            logger.info(`[OverspeedProcessor] Procesando ${gpsPoints.length} puntos GPS`);

            let insertedEvents = 0;

            for (const point of gpsPoints) {
                const speedKmh = point.speed;

                // Ignorar cuando el vehículo está casi parado (< 5 km/h)
                if (speedKmh < 5) {
                    continue;
                }

                // Buscar límite de velocidad más cercano Y CORREGIDO
                const speedLimit = await this.findNearestCorrectedSpeedLimit(
                    point.latitude,
                    point.longitude
                );

                if (speedLimit === null) {
                    // Sin límite detectado: omitir punto para evitar falsos positivos
                    continue;
                }

                // Verificar si hay exceso de velocidad
                if (speedKmh > speedLimit + this.toleranceKmh) {
                    await this.insertOverspeedEvent(
                        sessionId,
                        point.timestamp,
                        point.latitude,
                        point.longitude,
                        speedKmh,
                        speedLimit
                    );
                    insertedEvents++;
                }
            }

            logger.info(
                `[OverspeedProcessor] Sesión ${sessionId} procesada: ${insertedEvents} eventos de velocidad insertados`
            );
            return insertedEvents;
        } catch (error) {
            logger.error(`[OverspeedProcessor] Error procesando sesión ${sessionId}:`, error);
            throw error;
        }
    }

    /**
     * Busca el límite de velocidad más cercano Y LO CORRIGE según normativa española
     * @param lat Latitud
     * @param lon Longitud
     * @returns Límite de velocidad corregido en km/h o null si no se encuentra
     */
    private async findNearestCorrectedSpeedLimit(lat: number, lon: number): Promise<number | null> {
        try {
            // Primero intentar con el servicio de corrección
            const correctedLimit = await speedLimitCorrectionService.getCorrectedSpeedLimit(
                lat,
                lon
            );
            if (correctedLimit !== null) {
                return correctedLimit;
            }

            // Si no hay datos OSM, buscar usando el método original pero corregir el resultado
            const rawLimit = await this.findNearestSpeedLimit(lat, lon);
            if (rawLimit !== null) {
                // Aplicar corrección española
                const corrected = speedLimitCorrectionService.correctSpeedLimit(rawLimit);
                logger.debug(
                    `[OverspeedProcessor] Límite corregido: ${rawLimit} → ${corrected} km/h`
                );
                return corrected;
            }

            return null;
        } catch (error) {
            logger.error(
                `[OverspeedProcessor] Error buscando límite corregido en ${lat}, ${lon}:`,
                error
            );
            return null;
        }
    }

    /**
     * Busca el límite de velocidad más cercano a las coordenadas dadas (método original)
     * @param lat Latitud
     * @param lon Longitud
     * @returns Límite de velocidad en km/h o null si no se encuentra
     */
    private async findNearestSpeedLimit(lat: number, lon: number): Promise<number | null> {
        try {
            // Intentar con radios crecientes hasta 200m
            const radii = [this.searchRadiusM, 100, 150, 200];

            for (const radius of radii) {
                const result = await prisma.$queryRaw<Array<{ speed_limit: number }>>`
                    SELECT regexp_replace(maxspeed::text, '[^0-9]', '', 'g')::int AS speed_limit
                    FROM road_speed_limits
                    WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography, ${radius})
                    ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography)
                    LIMIT 1
                `;

                if (result.length > 0 && result[0].speed_limit) {
                    return result[0].speed_limit;
                }
            }

            // No se encontró límite en ninguno de los radios
            return null;
        } catch (error) {
            logger.error(
                `[OverspeedProcessor] Error buscando límite de velocidad en ${lat}, ${lon}:`,
                error
            );
            return null;
        }
    }

    /**
     * Inserta un evento de exceso de velocidad en la base de datos
     */
    private async insertOverspeedEvent(
        sessionId: string,
        timestamp: Date,
        lat: number,
        lon: number,
        speed: number,
        limit: number
    ): Promise<void> {
        try {
            await prisma.stability_events.create({
                data: {
                    session_id: sessionId,
                    timestamp: timestamp,
                    lat: lat,
                    lon: lon,
                    type: 'limite_superado_velocidad',
                    details: {
                        tipos: ['limite_superado_velocidad'],
                        valores: {
                            velocidad_vehiculo: Math.round(speed * 10) / 10, // Redondear a 1 decimal
                            limite_via: limit
                        },
                        level: 'warning',
                        perc: Math.round(((speed - limit) / limit) * 100)
                    }
                }
            });

            logger.debug(
                `[OverspeedProcessor] Evento insertado: ${speed.toFixed(
                    1
                )} km/h > ${limit} km/h en ${lat}, ${lon}`
            );
        } catch (error) {
            logger.error(`[OverspeedProcessor] Error insertando evento:`, error);
            throw error;
        }
    }

    /**
     * Procesa todas las sesiones de un vehículo
     * @param vehicleId ID del vehículo
     * @returns Número total de eventos insertados
     */
    async processVehicleSessions(vehicleId: string): Promise<number> {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    vehicleId: vehicleId
                },
                select: {
                    id: true
                }
            });

            let totalEvents = 0;
            for (const session of sessions) {
                const events = await this.processSession(session.id);
                totalEvents += events;
            }

            logger.info(
                `[OverspeedProcessor] Vehículo ${vehicleId} procesado: ${totalEvents} eventos totales`
            );
            return totalEvents;
        } catch (error) {
            logger.error(`[OverspeedProcessor] Error procesando vehículo ${vehicleId}:`, error);
            throw error;
        }
    }

    /**
     * Elimina eventos de velocidad existentes para una sesión
     * @param sessionId ID de la sesión
     */
    async clearSessionOverspeedEvents(sessionId: string): Promise<void> {
        try {
            await prisma.stability_events.deleteMany({
                where: {
                    session_id: sessionId,
                    type: 'limite_superado_velocidad'
                }
            });

            logger.info(
                `[OverspeedProcessor] Eventos de velocidad eliminados para sesión: ${sessionId}`
            );
        } catch (error) {
            logger.error(
                `[OverspeedProcessor] Error eliminando eventos de sesión ${sessionId}:`,
                error
            );
            throw error;
        }
    }
}
