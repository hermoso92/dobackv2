import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parkKpiService } from '../services/ParkKPIService';
import { logger } from '../utils/logger';

export class ParkKPIController {

    /**
     * Obtiene el KPI de un parque para una fecha específica
     */
    async getParkKPI(req: Request, res: Response): Promise<void> {
        try {
            const { parkId } = req.params;
            const { date } = req.query;

            if (!parkId) {
                res.status(400).json({ success: false, message: 'Se requiere parkId' });
                return;
            }

            const targetDate = date ? new Date(date as string) : new Date();

            const kpi = await parkKpiService.getParkKPI(parkId, targetDate);

            if (!kpi) {
                res.status(404).json({ success: false, message: 'KPI no encontrado para el parque y fecha especificados' });
                return;
            }

            res.json({
                success: true,
                data: kpi
            });

        } catch (error) {
            logger.error('Error en getParkKPI:', error);
            res.status(500).json({ success: false, message: 'Error al obtener KPI del parque' });
        }
    }

    /**
     * Calcula el KPI de un parque para una fecha específica
     */
    async calculateParkKPI(req: Request, res: Response): Promise<void> {
        try {
            const { parkId } = req.params;
            const { date, organizationId } = req.body;

            if (!parkId || !organizationId) {
                res.status(400).json({ success: false, message: 'Se requiere parkId y organizationId' });
                return;
            }

            const targetDate = date ? new Date(date) : new Date();

            const kpi = await parkKpiService.calculateParkKPI(parkId, targetDate, organizationId);

            res.json({
                success: true,
                data: kpi,
                message: 'KPI del parque calculado exitosamente'
            });

        } catch (error) {
            logger.error('Error en calculateParkKPI:', error);
            res.status(500).json({ success: false, message: 'Error al calcular KPI del parque' });
        }
    }

    /**
     * Calcula los KPIs de todos los parques de una organización
     */
    async calculateAllParksKPI(req: Request, res: Response): Promise<void> {
        try {
            const { organizationId, date } = req.body;

            if (!organizationId) {
                res.status(400).json({ success: false, message: 'Se requiere organizationId' });
                return;
            }

            const targetDate = date ? new Date(date) : new Date();

            await parkKpiService.calculateAllParksKPI(targetDate, organizationId);

            res.json({
                success: true,
                message: 'KPIs de todos los parques calculados exitosamente'
            });

        } catch (error) {
            logger.error('Error en calculateAllParksKPI:', error);
            res.status(500).json({ success: false, message: 'Error al calcular KPIs de todos los parques' });
        }
    }

    /**
     * Obtiene estadísticas de KPIs de parque
     */
    async getParkKPIStats(req: Request, res: Response): Promise<void> {
        try {
            const { organizationId, dateFrom, dateTo } = req.query;

            if (!organizationId) {
                res.status(400).json({ success: false, message: 'Se requiere organizationId' });
                return;
            }

            const startDate = dateFrom ? new Date(dateFrom as string) : new Date();
            const endDate = dateTo ? new Date(dateTo as string) : new Date();

            // Obtener todos los parques de la organización
            const { PrismaClient } = require('@prisma/client');
            

            const parks = await prisma.park.findMany({
                where: { organizationId: organizationId as string },
                select: { id: true, name: true }
            });

            const stats = [];

            for (const park of parks) {
                const kpis = await prisma.parkKPI.findMany({
                    where: {
                        parkId: park.id,
                        date: { gte: startDate, lte: endDate }
                    },
                    orderBy: { date: 'desc' }
                });

                if (kpis.length > 0) {
                    const latestKPI = kpis[0];
                    const totalClave2 = kpis.reduce((sum: number, kpi: any) => sum + (kpi.totalClave2 || 0), 0);
                    const totalClave5 = kpis.reduce((sum: number, kpi: any) => sum + (kpi.totalClave5 || 0), 0);
                    const totalEventsHigh = kpis.reduce((sum: number, kpi: any) => sum + (kpi.totalEventsHigh || 0), 0);
                    const totalEventsModerate = kpis.reduce((sum: number, kpi: any) => sum + (kpi.totalEventsModerate || 0), 0);

                    stats.push({
                        parkId: park.id,
                        parkName: park.name,
                        latestKPI,
                        totals: {
                            totalClave2,
                            totalClave5,
                            totalEventsHigh,
                            totalEventsModerate
                        },
                        daysWithData: kpis.length
                    });
                }
            }

            await prisma.$disconnect();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            logger.error('Error en getParkKPIStats:', error);
            res.status(500).json({ success: false, message: 'Error al obtener estadísticas de KPIs de parque' });
        }
    }
}

export const parkKPIController = new ParkKPIController(); 
