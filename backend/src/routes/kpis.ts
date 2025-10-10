/**
 * Rutas API para KPIs operativos.
 * Implementación TypeScript para backend Node.js/Express
 * ACTUALIZADO: Usa kpiCalculator con datos reales
 */
import { PrismaClient } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { keyCalculator } from '../services/keyCalculator';
import { kpiCalculator } from '../services/kpiCalculator';
import { createLogger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const logger = createLogger('KPIRoutes');


interface KPIFilters {
    from?: string;
    to?: string;
    vehicleIds?: string[];
    organizationId: string;
}

/**
 * GET /api/v1/kpis/summary
 * Retorna resumen completo con todos los KPIs
 */
router.get('/summary', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const from = req.query.from as string;
        const to = req.query.to as string;

        // IMPORTANTE: Express puede parsear como vehicleIds[] O vehicleIds
        const vehicleIdsRaw = req.query['vehicleIds[]'] || req.query.vehicleIds;
        const vehicleIds = vehicleIdsRaw
            ? (Array.isArray(vehicleIdsRaw)
                ? vehicleIdsRaw
                : [vehicleIdsRaw]) as string[]
            : undefined;

        // DEBUG: Ver qué parámetros llegan
        logger.info('📊 FILTROS RECIBIDOS EN /api/kpis/summary', {
            from,
            to,
            vehicleIds,
            queryCompleta: req.query,
            vehicleIdsLength: vehicleIds?.length || 0
        });

        // Construir filtros de fecha
        let dateFrom: Date | undefined;
        let dateTo: Date | undefined;

        if (from && to) {
            dateFrom = new Date(from);
            dateTo = new Date(to);
        }

        // Usar el nuevo servicio de KPI Calculator
        const summary = await kpiCalculator.calcularKPIsCompletos({
            organizationId,
            from: dateFrom,
            to: dateTo,
            vehicleIds: vehicleIds
        });

        logger.info('KPIs calculados correctamente', {
            sesiones: summary.metadata?.sesiones_analizadas,
            km: summary.activity?.km_total,
            incidencias: summary.stability?.total_incidents
        });

        res.json({
            success: true,
            data: summary
        });
    } catch (error: any) {
        logger.error('Error obteniendo resumen de KPIs:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/states
 * Retorna resumen de estados (claves 0-5) con datos reales usando keyCalculator
 */
router.get('/states', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        // Extraer filtros de la query
        const from = req.query.from as string;
        const to = req.query.to as string;
        const vehicleIds = req.query['vehicleIds[]']
            ? (Array.isArray(req.query['vehicleIds[]'])
                ? req.query['vehicleIds[]']
                : [req.query['vehicleIds[]']]) as string[]
            : undefined;

        logger.info('Obteniendo estados con filtros', { from, to, vehicleIds });

        // Construir filtros para sesiones
        const sessionsWhere: any = { organizationId };

        if (from && to) {
            sessionsWhere.startTime = {
                gte: new Date(from),
                lte: new Date(to)
            };
        }

        if (vehicleIds && vehicleIds.length > 0) {
            sessionsWhere.vehicleId = { in: vehicleIds };
        }

        // Obtener sesiones que coincidan con los filtros
        const sessions = await prisma.session.findMany({
            where: sessionsWhere,
            select: { id: true }
        });

        const sessionIds = sessions.map(s => s.id);

        logger.info(`Calculando tiempos para ${sessionIds.length} sesiones`);

        // Calcular tiempos por clave usando keyCalculator
        const tiemposPorClave = await keyCalculator.calcularTiemposPorClave(sessionIds);

        // Formatear respuesta
        const states = {
            states: [
                {
                    key: 0,
                    name: 'Taller',
                    duration_seconds: tiemposPorClave.clave0_segundos,
                    duration_formatted: tiemposPorClave.clave0_formateado,
                    count: Math.floor(tiemposPorClave.clave0_segundos / 60) || 0
                },
                {
                    key: 1,
                    name: 'Operativo en Parque',
                    duration_seconds: tiemposPorClave.clave1_segundos,
                    duration_formatted: tiemposPorClave.clave1_formateado,
                    count: Math.floor(tiemposPorClave.clave1_segundos / 60) || 0
                },
                {
                    key: 2,
                    name: 'Salida en Emergencia',
                    duration_seconds: tiemposPorClave.clave2_segundos,
                    duration_formatted: tiemposPorClave.clave2_formateado,
                    count: Math.floor(tiemposPorClave.clave2_segundos / 60) || 0
                },
                {
                    key: 3,
                    name: 'En Siniestro',
                    duration_seconds: tiemposPorClave.clave3_segundos,
                    duration_formatted: tiemposPorClave.clave3_formateado,
                    count: Math.floor(tiemposPorClave.clave3_segundos / 60) || 0
                },
                {
                    key: 5,
                    name: 'Regreso al Parque',
                    duration_seconds: tiemposPorClave.clave5_segundos,
                    duration_formatted: tiemposPorClave.clave5_formateado,
                    count: Math.floor(tiemposPorClave.clave5_segundos / 60) || 0
                }
            ],
            total_time_seconds: tiemposPorClave.total_segundos,
            total_time_formatted: tiemposPorClave.total_formateado,
            time_outside_station: tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos,
            time_outside_formatted: formatSeconds(tiemposPorClave.clave2_segundos + tiemposPorClave.clave3_segundos + tiemposPorClave.clave5_segundos)
        };

        logger.info('Estados calculados correctamente', {
            total_time: states.total_time_formatted,
            clave2: states.states[2].duration_formatted,
            clave5: states.states[4].duration_formatted
        });

        res.json({
            success: true,
            data: states
        });
    } catch (error: any) {
        logger.error('Error obteniendo estados:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Helper function para formatear segundos a HH:MM:SS
 */
function formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * GET /api/v1/kpis/activity
 * Retorna métricas de actividad
 */
router.get('/activity', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const activity = {
            km_total: 0,
            driving_hours: 0,
            driving_hours_formatted: '00:00:00',
            rotativo_on_seconds: 0,
            rotativo_on_percentage: 0,
            rotativo_on_formatted: '00:00:00',
            emergency_departures: 0
        };

        res.json({
            success: true,
            data: activity
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de actividad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/v1/kpis/stability
 * Retorna métricas de estabilidad
 */
router.get('/stability', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID not found'
            });
        }

        const stability = {
            total_incidents: 0,
            critical: 0,
            moderate: 0,
            light: 0
        };

        res.json({
            success: true,
            data: stability
        });
    } catch (error: any) {
        logger.error('Error obteniendo métricas de estabilidad:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

