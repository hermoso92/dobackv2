import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TelemetryService {
    async getSessionTelemetry(sessionId: string) {
        const can = await prisma.canMeasurement.findMany({ where: { sessionId } });
        const gps = await prisma.gpsMeasurement.findMany({ where: { sessionId } });
        return { can, gps };
    }
}
