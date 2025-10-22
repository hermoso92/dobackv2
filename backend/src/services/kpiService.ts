
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';



type RangeFilter = {
    from?: Date;
    to?: Date;
};

export class KPIService {
    async getDashboardKpis(organizationId: string, range: RangeFilter) {
        const where = {
            organizationId,
            occurredAt: {
                gte: range.from,
                lte: range.to
            }
        };

        const [totalEvents, enterEvents, exitEvents] = await Promise.all([
            prisma.geofenceEvent.count({ where }),
            prisma.geofenceEvent.count({ where: { ...where, eventType: 'ENTER' } }),
            prisma.geofenceEvent.count({ where: { ...where, eventType: 'EXIT' } })
        ]);

        logger.info('KPIs calculados', { totalEvents, enterEvents, exitEvents });
        return {
            totalGeofenceEvents: totalEvents,
            enterEvents,
            exitEvents
        };
    }
}

export const kpiService = new KPIService();
