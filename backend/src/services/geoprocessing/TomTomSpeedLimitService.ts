import axios from 'axios';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { speedLimitCorrectionService } from '../SpeedLimitCorrectionService';

export interface SpeedLimitResult {
    speedLimit: number;
    confidence: 'high' | 'medium' | 'low';
    source: 'tomtom' | 'cache' | 'default';
    roadType: 'urban' | 'interurban' | 'highway';
}

export class TomTomSpeedLimitService {
    private readonly TOMTOM_API_KEY = process.env.TOMTOM_API_KEY || '';
    private readonly TOMTOM_BASE_URL = 'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json';
    private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hora
    private readonly MAX_DISTANCE_FROM_CACHE = 100; // metros

    /**
     * Obtiene el límite de velocidad para un punto GPS
     */
    async getSpeedLimit(
        lat: number,
        lon: number,
        vehicleType: 'turismo' | 'camion' | 'emergencia'
    ): Promise<SpeedLimitResult> {
        // 1. Intentar obtener de caché
        const cached = await this.getFromCache(lat, lon);
        if (cached && this.isCacheValid(cached)) {
            logger.debug(`📍 Límite de velocidad desde caché: ${cached.speed_limit} km/h`);
            return {
                speedLimit: cached.speed_limit,
                confidence: 'high',
                source: 'cache',
                roadType: cached.road_type as any,
            };
        }

        // 2. Intentar obtener de TomTom API
        if (this.TOMTOM_API_KEY) {
            try {
                const tomtomResult = await this.getFromTomTom(lat, lon);
                if (tomtomResult) {
                    // Guardar en caché
                    await this.saveToCache(lat, lon, tomtomResult.speedLimit, tomtomResult.roadType);
                    return tomtomResult;
                }
            } catch (error: any) {
                logger.warn(`⚠️ Error al obtener límite de TomTom: ${error.message}`);
            }
        }

        // 3. Fallback: Intentar obtener de OSM (road_speed_limits)
        try {
            const osmLimit = await speedLimitCorrectionService.getCorrectedSpeedLimit(lat, lon);
            if (osmLimit) {
                logger.debug(`📍 Límite de velocidad desde OSM: ${osmLimit} km/h`);

                // Determinar tipo de vía según el límite
                let roadType: 'urban' | 'interurban' | 'highway' = 'urban';
                if (osmLimit >= 100) roadType = 'highway';
                else if (osmLimit >= 70) roadType = 'interurban';

                // Guardar en caché
                await this.saveToCache(lat, lon, osmLimit, roadType);

                return {
                    speedLimit: osmLimit,
                    confidence: 'medium',
                    source: 'cache', // Se guarda como cache
                    roadType,
                };
            }
        } catch (error: any) {
            logger.debug(`OSM no disponible: ${error.message}`);
        }

        // 4. Último fallback: usar configuración por defecto
        logger.debug(`📍 Usando límite de velocidad por defecto para ${vehicleType}`);
        return this.getDefaultSpeedLimit(vehicleType);
    }

    /**
     * Obtiene límite de velocidad desde TomTom API
     */
    private async getFromTomTom(lat: number, lon: number): Promise<SpeedLimitResult | null> {
        try {
            const url = `${this.TOMTOM_BASE_URL}?point=${lat},${lon}&unit=KMPH&key=${this.TOMTOM_API_KEY}`;

            const response = await axios.get(url, {
                timeout: 5000,
            });

            const data = response.data;

            if (!data.flowSegmentData) {
                logger.warn('TomTom API no devolvió datos de flujo');
                return null;
            }

            const speedLimit = data.flowSegmentData.currentSpeed || data.flowSegmentData.freeFlowSpeed;
            const functionalRoadClass = data.flowSegmentData.frc;

            if (!speedLimit) {
                logger.warn('TomTom API no devolvió límite de velocidad');
                return null;
            }

            // Determinar tipo de vía basado en FRC (Functional Road Class)
            let roadType: 'urban' | 'interurban' | 'highway' = 'urban';
            if (functionalRoadClass <= 2) {
                roadType = 'highway';
            } else if (functionalRoadClass <= 4) {
                roadType = 'interurban';
            }

            return {
                speedLimit: Math.round(speedLimit),
                confidence: 'high',
                source: 'tomtom',
                roadType,
            };
        } catch (error: any) {
            logger.error(`Error en TomTom API: ${error.message}`);
            return null;
        }
    }

    /**
     * Obtiene límite de velocidad desde caché
     */
    private async getFromCache(lat: number, lon: number): Promise<any> {
        try {
            const result = await prisma.speed_limits_cache.findFirst({
                where: {
                    lat: {
                        gte: lat - 0.001, // ~100m
                        lte: lat + 0.001,
                    },
                    lon: {
                        gte: lon - 0.001,
                        lte: lon + 0.001,
                    },
                },
                orderBy: {
                    cached_at: 'desc',
                },
            });

            return result;
        } catch (error: any) {
            logger.error(`Error al obtener de caché: ${error.message}`);
            return null;
        }
    }

    /**
     * Verifica si el caché es válido
     */
    private isCacheValid(cached: any): boolean {
        if (!cached.cached_at) return false;

        const age = Date.now() - new Date(cached.cached_at).getTime();
        return age < this.CACHE_TTL;
    }

    /**
     * Guarda límite de velocidad en caché
     */
    private async saveToCache(
        lat: number,
        lon: number,
        speedLimit: number,
        roadType: string
    ): Promise<void> {
        try {
            await prisma.speed_limits_cache.create({
                data: {
                    lat: lat,
                    lon: lon,
                    speed_limit: speedLimit,
                    road_type: roadType,
                },
            });

            logger.debug(`💾 Límite de velocidad guardado en caché: ${speedLimit} km/h`);
        } catch (error: any) {
            logger.error(`Error al guardar en caché: ${error.message}`);
        }
    }

    /**
     * Obtiene límite de velocidad por defecto según tipo de vehículo
     */
    private getDefaultSpeedLimit(vehicleType: 'turismo' | 'camion' | 'emergencia'): SpeedLimitResult {
        // Límites por defecto para vehículos de emergencia en España
        const defaultLimits = {
            emergencia: {
                urban: 50,
                interurban: 80,
                highway: 120,
            },
            camion: {
                urban: 50,
                interurban: 70,
                highway: 90,
            },
            turismo: {
                urban: 50,
                interurban: 90,
                highway: 120,
            },
        };

        // Por defecto, asumimos vía urbana (más restrictiva)
        return {
            speedLimit: defaultLimits[vehicleType].urban,
            confidence: 'low',
            source: 'default',
            roadType: 'urban',
        };
    }

    /**
     * Limpia caché antiguo (más de 24 horas)
     */
    async cleanOldCache(): Promise<void> {
        try {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            const result = await prisma.speed_limits_cache.deleteMany({
                where: {
                    cached_at: {
                        lt: oneDayAgo,
                    },
                },
            });

            logger.info(`🗑️ Caché limpiado: ${result.count} registros eliminados`);
        } catch (error: any) {
            logger.error(`Error al limpiar caché: ${error.message}`);
        }
    }
}

export const tomTomSpeedLimitService = new TomTomSpeedLimitService();

