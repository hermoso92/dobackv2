import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { DetectedSpeedViolation } from './geoprocessing/SpeedLimitService';

type ViolationSeverity = 'leve' | 'moderada' | 'grave' | 'critica';

class SpeedViolationPersistenceService {
    async storeViolations(
        sessionId: string,
        organizationId: string,
        vehicleId: string,
        violations: DetectedSpeedViolation[]
    ): Promise<number> {
        if (!violations || violations.length === 0) {
            await prisma.speedViolation.deleteMany({ where: { sessionId } });
            return 0;
        }

        try {
            // Limpiar registros previos para evitar duplicados
            await prisma.speedViolation.deleteMany({ where: { sessionId } });

            const data = violations.map((violation) => ({
                sessionId,
                organizationId,
                vehicleId,
                timestamp: violation.timestamp,
                lat: violation.lat,
                lon: violation.lon,
                snappedLat: violation.snappedLat ?? null,
                snappedLon: violation.snappedLon ?? null,
                speed: violation.speed,
                speedLimit: violation.speedLimit,
                excess: violation.excess,
                violationType: this.classifyViolation(violation.excess),
                roadType: violation.roadType,
                source: violation.source ?? 'google',
                confidence: violation.confidence ?? 'unknown',
                placeId: violation.placeId ?? null,
                metadata: violation.metadata ?? null,
                rotativoOn: violation.metadata?.rotativoOn ?? false,
                inPark: violation.metadata?.inPark ?? false,
            }));

            const result = await prisma.speedViolation.createMany({ data });

            logger.info('✅ Violaciones de velocidad almacenadas', {
                sessionId,
                organizationId,
                vehicleId,
                violations: data.length,
            });

            return result.count;
        } catch (error: any) {
            logger.error('❌ Error almacenando violaciones de velocidad', {
                sessionId,
                organizationId,
                vehicleId,
                error: error.message,
            });
            return 0;
        }
    }

    private classifyViolation(excess: number): ViolationSeverity {
        if (excess >= 30) return 'critica';
        if (excess >= 20) return 'grave';
        if (excess >= 10) return 'moderada';
        return 'leve';
    }
}

export const speedViolationPersistenceService = new SpeedViolationPersistenceService();









