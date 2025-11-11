import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { googleRoadsService, GoogleSpeedLimitResult } from './GoogleRoadsService';
import { SpeedLimitResult as TomTomSpeedLimitResult, tomTomSpeedLimitService } from './TomTomSpeedLimitService';

// Tipo unificado que acepta tanto Google como TomTom
export type SpeedLimitResult = GoogleSpeedLimitResult | TomTomSpeedLimitResult;

export interface DetectedSpeedViolation {
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
    speedLimit: number;
    excess: number;
    roadType: string;
    confidence: string;
    source: string;
    placeId?: string;
    snappedLat?: number;
    snappedLon?: number;
    metadata?: Record<string, any>;
}

export class SpeedLimitService {
    private readonly USE_GOOGLE_ROADS = process.env.GOOGLE_ROADS_ENABLED !== 'false'; // Por defecto: true
    private readonly USE_TOMTOM_FALLBACK = process.env.TOMTOM_FALLBACK_ENABLED === 'true'; // Por defecto: false

    /**
     * Obtener límite de velocidad para una ubicación
     * Prioridad: Google Roads API > TomTom API (fallback) > Cache > Configuración manual
     */
    async getSpeedLimit(
        lat: number,
        lon: number,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<SpeedLimitResult> {
        // 1. Intentar Google Roads API primero
        if (this.USE_GOOGLE_ROADS) {
            try {
                const googleResult = await googleRoadsService.getSpeedLimit(lat, lon, vehicleType);

                // Si Google devolvió un resultado con confianza alta o media, usarlo
                if (googleResult.source === 'google' || googleResult.source === 'cache') {
                    return googleResult;
                }

                logger.debug('Google Roads devolvió resultado por defecto, intentando fallback...');
            } catch (error: any) {
                logger.warn(`Error en Google Roads API: ${error.message}, intentando fallback...`);
            }
        }

        // 2. Fallback a TomTom si está habilitado
        if (this.USE_TOMTOM_FALLBACK) {
            try {
                const tomtomResult = await tomTomSpeedLimitService.getSpeedLimit(lat, lon, vehicleType);

                if (tomtomResult.source === 'tomtom' || tomtomResult.source === 'cache') {
                    logger.info('Usando TomTom como fallback');
                    return tomtomResult;
                }
            } catch (error: any) {
                logger.warn(`Error en TomTom API: ${error.message}`);
            }
        }

        // 3. Último recurso: valores por defecto
        logger.debug('Usando valores por defecto para límite de velocidad');
        return googleRoadsService['getDefaultSpeedLimit'](vehicleType);
    }

    /**
     * Detectar violaciones de velocidad en una sesión
     */
    async detectViolations(
        gpsPoints: Array<{ lat: number; lon: number; timestamp: Date; speed: number }>,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<DetectedSpeedViolation[]> {
        const violations: DetectedSpeedViolation[] = [];

        for (const point of gpsPoints) {
            // Obtener límite de velocidad para esta ubicación
            const speedLimitResult = await this.getSpeedLimit(point.lat, point.lon, vehicleType);

            // Aplicar bonus de emergencia si es necesario
            let effectiveSpeedLimit = speedLimitResult.speedLimit;
            if (vehicleType === 'emergencia') {
                const config = await this.getEmergencyBonus(speedLimitResult.roadType);
                if (config) {
                    effectiveSpeedLimit += config.emergency_bonus || 0;
                }
            }

            // Verificar si hay violación
            if (point.speed > effectiveSpeedLimit) {
                const snappedLat = 'snappedLat' in speedLimitResult ? (speedLimitResult as GoogleSpeedLimitResult).snappedLat : undefined;
                const snappedLon = 'snappedLon' in speedLimitResult ? (speedLimitResult as GoogleSpeedLimitResult).snappedLon : undefined;
                const placeId = 'placeId' in speedLimitResult ? (speedLimitResult as GoogleSpeedLimitResult).placeId : undefined;

                violations.push({
                    timestamp: point.timestamp,
                    lat: point.lat,
                    lon: point.lon,
                    snappedLat,
                    snappedLon,
                    placeId,
                    speed: point.speed,
                    speedLimit: effectiveSpeedLimit,
                    excess: point.speed - effectiveSpeedLimit,
                    roadType: speedLimitResult.roadType,
                    confidence: speedLimitResult.confidence,
                    source: speedLimitResult.source,
                });
            }
        }

        if (violations.length > 0) {
            logger.info(`🚨 Detectadas ${violations.length} violaciones de velocidad`);
        }

        return violations;
    }

    /**
     * Obtener bonus de emergencia para un tipo de vía
     */
    private async getEmergencyBonus(roadType: string): Promise<any> {
        try {
            const config = await prisma.speed_limits_config.findFirst({
                where: {
                    vehicle_type: 'emergencia',
                    road_type: roadType,
                },
            });

            return config;
        } catch (error: any) {
            logger.debug(`No se encontró configuración de emergencia: ${error.message}`);
            return null;
        }
    }

    /**
     * Limpiar caché antiguo
     */
    async cleanOldCache(): Promise<void> {
        await googleRoadsService.cleanOldCache();

        if (this.USE_TOMTOM_FALLBACK) {
            await tomTomSpeedLimitService.cleanOldCache();
        }
    }

    /**
     * Batch processing: Obtener límites para múltiples puntos de una vez
     * (Optimización para reducir costes de API)
     */
    async getBatchSpeedLimits(
        points: Array<{ lat: number; lon: number }>,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<SpeedLimitResult[]> {
        if (this.USE_GOOGLE_ROADS) {
            return await googleRoadsService.getBatchSpeedLimits(points, vehicleType);
        }

        // Fallback: procesar uno por uno
        const results: SpeedLimitResult[] = [];
        for (const point of points) {
            const result = await this.getSpeedLimit(point.lat, point.lon, vehicleType);
            results.push(result);
        }
        return results;
    }
}

export const speedLimitService = new SpeedLimitService();

