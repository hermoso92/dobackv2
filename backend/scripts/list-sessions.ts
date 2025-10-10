import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function listSessions() {
    try {
        const sessions = await prisma.session.findMany({
            include: {
                stabilityMeasurements: true,
                gpsMeasurements: true,
                canMeasurements: true,
                vehicle: true
            },
            orderBy: {
                startTime: 'desc'
            },
            take: 10
        });

        logger.info('Sesiones encontradas:', {
            total: sessions.length
        });

        sessions.forEach((session, index) => {
            logger.info(`Sesión ${index + 1}:`, {
                id: session.id,
                vehicleId: session.vehicleId,
                vehicleName: session.vehicle?.name || 'N/A',
                startTime: session.startTime,
                endTime: session.endTime,
                stabilityMeasurements: session.stabilityMeasurements.length,
                gpsMeasurements: session.gpsMeasurements.length,
                canMeasurements: session.canMeasurements.length,
                status: session.status
            });
        });
    } catch (error) {
        logger.error('Error listando sesiones', { error });
    } finally {
        await prisma.$disconnect();
    }
}

listSessions();
