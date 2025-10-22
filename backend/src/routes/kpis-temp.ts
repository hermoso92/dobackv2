/**
 * Rutas API temporales para KPIs operativos.
 * Implementación temporal para resolver el problema de importación
 */
import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const router = Router();
const logger = createLogger('KPIRoutesTemp');

router.get('/summary', authenticate, async (req: Request, res: Response) => {
    try {
        const organizationId = (req as any).user?.organizationId;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'OrganizationId requerido'
            });
        }

        logger.info('📊 Calculando KPIs temporales', { organizationId });

        // Importar prisma dinámicamente

        // Obtener sesiones básicas
        const sessions = await prisma.session.findMany({
            where: { organizationId },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                vehicleId: true
            },
            take: 10 // Limitar para prueba
        });

        logger.info(`📊 Encontradas ${sessions.length} sesiones`);

        // Calcular KPIs básicos
        const totalSessions = sessions.length;
        const totalVehicles = new Set(sessions.map(s => s.vehicleId)).size;

        // Obtener eventos de estabilidad
        const sessionIds = sessions.map(s => s.id);
        const events = await prisma.stability_events.findMany({
            where: { session_id: { in: sessionIds } },
            select: { type: true, session_id: true }
        });

        const totalEvents = events.length;
        const eventsByType = events.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Respuesta temporal con datos básicos
        const kpis = {
            availability: {
                total_sessions: totalSessions,
                total_vehicles: totalVehicles,
                availability_percentage: totalSessions > 0 ? 100 : 0
            },
            activity: {
                km_total: 0, // TODO: calcular desde GPS
                driving_hours: 0, // TODO: calcular desde GPS
                rotativo_on_seconds: 0, // TODO: calcular desde rotativo
                rotativo_on_percentage: 0
            },
            stability: {
                total_incidents: totalEvents,
                critical: eventsByType['CRITICO'] || 0,
                moderate: eventsByType['MODERADO'] || 0,
                light: eventsByType['LEVE'] || 0
            },
            quality: {
                indice_promedio: totalEvents > 0 ? Math.max(0, 100 - totalEvents) : 100,
                calificacion: totalEvents === 0 ? 'EXCELENTE' : totalEvents < 5 ? 'BUENA' : 'REGULAR',
                estrellas: totalEvents === 0 ? '⭐⭐⭐⭐⭐' : totalEvents < 5 ? '⭐⭐⭐⭐' : '⭐⭐⭐'
            }
        };

        logger.info('✅ KPIs temporales calculados', {
            totalSessions,
            totalVehicles,
            totalEvents
        });

        res.json({
            success: true,
            data: kpis
        });

    } catch (error: any) {
        logger.error('❌ Error calculando KPIs temporales:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

export default router;
