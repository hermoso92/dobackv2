import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { SpeedLimitResult, tomTomSpeedLimitService } from './TomTomSpeedLimitService';

export interface SpeedViolation {
    timestamp: Date;
    lat: number;
    lon: number;
    speed: number;
    speedLimit: number;
    excess: number;
    roadType: string;
    confidence: string;
    source: string;
}

export class SpeedLimitService {
    /**
     * Obtener límite de velocidad para una ubicación
     * Prioridad: TomTom API > Cache > Configuración manual
     */
    async getSpeedLimit(
        lat: number,
        lon: number,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<SpeedLimitResult> {
        return await tomTomSpeedLimitService.getSpeedLimit(lat, lon, vehicleType);
    }

    /**
     * Detectar violaciones de velocidad en una sesión
     */
    async detectViolations(
        gpsPoints: Array<{ lat: number; lon: number; timestamp: Date; speed: number }>,
        vehicleType: 'turismo' | 'camion' | 'emergencia' = 'emergencia'
    ): Promise<SpeedViolation[]> {
        const violations: SpeedViolation[] = [];

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
                violations.push({
                    timestamp: point.timestamp,
                    lat: point.lat,
                    lon: point.lon,
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
        await tomTomSpeedLimitService.cleanOldCache();
    }
}

export const speedLimitService = new SpeedLimitService();

