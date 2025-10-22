import { prisma } from '../lib/prisma';





export class TelemetryService {
    async getSessionTelemetry(sessionId: string) {
        const can = await prisma.canMeasurement.findMany({ where: { sessionId } });
        const gps = await prisma.gpsMeasurement.findMany({ where: { sessionId } });
        return { can, gps };
    }
}
