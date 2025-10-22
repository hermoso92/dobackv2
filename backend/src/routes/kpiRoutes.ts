import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { compareDashboardPeriodsHandler, getExecutiveDashboardHandler } from '../controllers/executiveDashboardController';
import { getHeatmapHandler, getSpeedingHandler } from '../controllers/kpiController';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Endpoint de prueba sin autenticación para debug
router.get('/dashboard-test', async (req: Request, res: Response) => {
    try {
        const organizationId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
        const from = req.query.from as string || '2025-10-01';
        const to = req.query.to as string || '2025-10-08';
        const vehicleId = req.query.vehicleId as string || '0d0c4f74-e196-4d32-b413-752b22530583';

        logger.info('🔍 DEBUG Dashboard Test - Parámetros:', { from, to, vehicleId, organizationId });

        // Construir filtros de fecha
        const dateFrom = new Date(from);
        const dateTo = new Date(to);

        // Obtener eventos de estabilidad
        const stabilityEvents = await prisma.stability_events.findMany({
            where: {
                Session: {
                    vehicleId: vehicleId,
                    organizationId: organizationId
                },
                timestamp: {
                    gte: dateFrom,
                    lte: dateTo
                }
            },
            take: 100
        });

        // Obtener sesiones
        const sessions = await prisma.session.findMany({
            where: {
                vehicleId: vehicleId,
                organizationId: organizationId,
                startTime: {
                    gte: dateFrom,
                    lte: dateTo
                }
            },
            take: 100
        });

        // Calcular tiempo real de sesiones
        const totalSessionTime = sessions.reduce((total, session) => {
            if (session.startTime && session.endTime) {
                const start = new Date(session.startTime);
                const end = new Date(session.endTime);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60); // horas
            }
            return total;
        }, 0);

        // Analizar eventos
        const dangerousDriftEvents = stabilityEvents.filter(e => e.type === 'dangerous_drift').length;
        const rolloverRiskEvents = stabilityEvents.filter(e => e.type === 'rollover_risk').length;
        const rotaryOnEvents = stabilityEvents.filter(e => (e as any).rotativoState === 1).length;

        logger.info('🔍 DEBUG Dashboard Test - Resultados:', {
            totalEvents: stabilityEvents.length,
            totalSessionTime,
            dangerousDriftEvents,
            rolloverRiskEvents,
            rotaryOnEvents,
            sessions: sessions.length
        });

        res.json({
            success: true,
            debug: {
                parameters: { from, to, vehicleId, organizationId },
                totalEvents: stabilityEvents.length,
                totalSessionTimeHours: totalSessionTime,
                dangerousDriftEvents,
                rolloverRiskEvents,
                rotaryOnEvents,
                sessions: sessions.length,
                sampleEvents: stabilityEvents.slice(0, 3).map(e => ({
                    id: e.id,
                    type: e.type,
                    timestamp: e.timestamp,
                    rotativoState: (e as any).rotativoState
                }))
            }
        });

    } catch (error: any) {
        logger.error('Error en dashboard test:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
        });
    }
});

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticate);

// Dashboard ejecutivo con datos reales
router.get('/dashboard', getExecutiveDashboardHandler);

// Comparativa de períodos del dashboard ejecutivo
router.post('/dashboard/compare', compareDashboardPeriodsHandler);

// Otros endpoints de KPI
router.get('/heatmap', getHeatmapHandler);
router.get('/speeding', getSpeedingHandler);

export default router;
