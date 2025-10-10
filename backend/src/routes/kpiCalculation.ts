import { Request, Response, Router } from 'express';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import { KPICalculationService } from '../services/KPICalculationService';
import { logger } from '../utils/logger';

const router = Router();

// Aplicar middleware de autenticación y organización
router.use(authenticate);
router.use(attachOrg);

/**
 * GET /api/kpi/calculate
 * Calcula KPIs reales para una organización
 */
router.get('/calculate', async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, vehicleIds } = req.query;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        // Validar fechas
        const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Últimos 7 días
        const end = endDate ? new Date(endDate as string) : new Date();

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format'
            });
        }

        // Procesar vehicleIds si se proporcionan
        const vehicleIdsArray = vehicleIds ?
            (Array.isArray(vehicleIds) ? vehicleIds as string[] : [vehicleIds as string]) :
            undefined;

        logger.info('Calculando KPIs reales', {
            organizationId,
            start: start.toISOString(),
            end: end.toISOString(),
            vehicleIds: vehicleIdsArray
        });

        // Calcular KPIs reales
        const kpis = await KPICalculationService.calculateRealKPIs(
            organizationId,
            { start, end },
            vehicleIdsArray
        );

        res.json({
            success: true,
            data: kpis,
            metadata: {
                organizationId,
                timeRange: {
                    start: start.toISOString(),
                    end: end.toISOString()
                },
                vehicleIds: vehicleIdsArray,
                calculatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error calculando KPIs reales', { error, orgId: (req as any).orgId });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al calcular KPIs'
        });
    }
});

/**
 * GET /api/kpi/calculate/summary
 * Calcula resumen de KPIs para múltiples períodos
 */
router.get('/calculate/summary', async (req: Request, res: Response) => {
    try {
        const { vehicleIds } = req.query;
        const organizationId = (req as any).orgId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }

        const now = new Date();
        const periods = [
            {
                name: 'Hoy',
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: now
            },
            {
                name: 'Última semana',
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now
            },
            {
                name: 'Último mes',
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now
            }
        ];

        const vehicleIdsArray = vehicleIds ?
            (Array.isArray(vehicleIds) ? vehicleIds as string[] : [vehicleIds as string]) :
            undefined;

        // Calcular KPIs para cada período
        const summary = await Promise.all(
            periods.map(async (period) => {
                try {
                    const kpis = await KPICalculationService.calculateRealKPIs(
                        organizationId,
                        { start: period.start, end: period.end },
                        vehicleIdsArray
                    );
                    return {
                        period: period.name,
                        timeRange: {
                            start: period.start.toISOString(),
                            end: period.end.toISOString()
                        },
                        kpis
                    };
                } catch (error) {
                    logger.error(`Error calculando KPIs para período ${period.name}`, { error });
                    return {
                        period: period.name,
                        error: 'Error calculando KPIs para este período'
                    };
                }
            })
        );

        res.json({
            success: true,
            data: summary,
            metadata: {
                organizationId,
                vehicleIds: vehicleIdsArray,
                calculatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error calculando resumen de KPIs', { error, orgId: (req as any).orgId });
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al calcular resumen de KPIs'
        });
    }
});

export default router;
