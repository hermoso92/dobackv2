
import { prisma } from '../lib/prisma';
import { StabilityMeasurements } from '../types/stability';
import { logger } from '../utils/logger';



export class StabilityMeasurementRepository {
    async createMeasurements(measurements: StabilityMeasurements[]): Promise<void> {
        try {
            const validMeasurements = measurements
                .filter((m) => {
                    // Validar que todos los campos requeridos estén presentes
                    const requiredFields = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];
                    const hasAllFields = requiredFields.every(
                        (field) => (m as any)[field] !== undefined && (m as any)[field] !== null
                    );

                    if (!hasAllFields) {
                        logger.warn(
                            `⚠️ Datos de estabilidad incompletos en Repository, omitiendo: ${JSON.stringify(
                                m
                            )}`
                        );
                        return false;
                    }

                    return true;
                })
                .map((m) => ({
                    id: m.id,
                    timestamp: m.timestamp,
                    sessionId: m.sessionId,
                    ax: Number(m.ax),
                    ay: Number(m.ay),
                    az: Number(m.az),
                    gx: Number(m.gx),
                    gy: Number(m.gy),
                    gz: Number(m.gz),
                    roll: m.roll ? Number(m.roll) : 0,
                    pitch: m.pitch ? Number(m.pitch) : 0,
                    yaw: m.yaw ? Number(m.yaw) : 0,
                    usciclo1: m.usciclo1 ? Number(m.usciclo1) : 0,
                    usciclo2: m.usciclo2 ? Number(m.usciclo2) : 0,
                    usciclo3: m.usciclo3 ? Number(m.usciclo3) : 0,
                    usciclo4: m.usciclo4 ? Number(m.usciclo4) : 0,
                    usciclo5: m.usciclo5 ? Number(m.usciclo5) : 0,
                    si: m.si ? Number(m.si) : 0,
                    accmag: m.accmag ? Number(m.accmag) : 0,
                    microsds: m.microsds ? Number(m.microsds) : 0,
                    timeantwifi: m.timeantwifi ? Number(m.timeantwifi) : 0,
                    isDRSHigh: m.isDRSHigh || false,
                    isLTRCritical: m.isLTRCritical || false,
                    isLateralGForceHigh: m.isLateralGForceHigh || false,
                    temperature: m.temperature ? Number(m.temperature) : 0
                }));

            if (validMeasurements.length > 0) {
                await prisma.stabilityMeasurement.createMany({
                    data: validMeasurements as any
                });
                logger.info(
                    `Created ${validMeasurements.length} stability measurements (filtered from ${measurements.length} total)`
                );
            } else {
                logger.warn('No hay mediciones de estabilidad válidas para crear');
            }
        } catch (error) {
            logger.error('Error creating stability measurements:', error);
            throw error;
        }
    }

    async findBySessionId(sessionId: string): Promise<StabilityMeasurements[]> {
        try {
            const measurements = await prisma.stabilityMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            });
            logger.info(`Found ${measurements.length} measurements for session ${sessionId}`);
            return measurements;
        } catch (error) {
            logger.error('Error finding stability measurements:', error);
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

    async getMeasurementsBySessionAndDateRange(sessionId: string, startDate: Date, endDate: Date) {
        try {
            const measurements = await prisma.stabilityMeasurement.findMany({
                where: {
                    sessionId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { timestamp: 'asc' }
            });

            return measurements;
        } catch (error) {
            logger.error('Error al obtener mediciones de estabilidad', { error, sessionId });
            throw error;
        }
    }

    async deleteMeasurementsBySession(sessionId: string) {
        try {
            const result = await prisma.stabilityMeasurement.deleteMany({
                where: { sessionId }
            });

            logger.info('Mediciones de estabilidad eliminadas', { count: result.count, sessionId });
            return result;
        } catch (error) {
            logger.error('Error al eliminar mediciones de estabilidad', { error, sessionId });
            throw error;
        }
    }
}
