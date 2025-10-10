import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class StabilityMeasurementRepository {
    async createMeasurements(measurements: any[]): Promise<void> {
        try {
            await prisma.stabilityMeasurement.createMany({ data: measurements });
            logger.info(`Created ${measurements.length} stability measurements`);
        } catch (error) {
            logger.error('Error creating stability measurements:', error);
            throw error;
        }
    }

    async getMeasurementsBySession(sessionId: string) {
        try {
            const measurements = await prisma.stabilityMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            });
            return measurements;
        } catch (error) {
            logger.error('Error al obtener mediciones de estabilidad', { error, sessionId });
            throw error;
        }
    }
} 