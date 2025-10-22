import { Router } from 'express';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import { eventDetector } from '../services/eventDetector';
// import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/generate-events
 * Genera eventos de estabilidad para todas las sesiones SIN eventos de la organización
 */
router.post('/', authenticate, attachOrg, async (req, res) => {
    try {
        const orgId = (req as any).orgId;
        const { force = false } = req.body; // Forzar regeneración para TODAS las sesiones

        logger.info('🚀 Iniciando generación masiva de eventos', { organizationId: orgId, force });

        const { generateStabilityEventsForSession } = await import('../services/eventDetector');

        // Obtener TODAS las sesiones de la organización
        const allSessions = await prisma.session.findMany({
            where: {
                organizationId: orgId
            },
            select: {
                id: true,
                vehicleId: true,
                startTime: true,
                endTime: true,
                vehicle: { select: { identifier: true } }
            },
            orderBy: { startTime: 'desc' }
        });

        logger.info(`📊 Encontradas ${allSessions.length} sesiones totales`);

        // Filtrar sesiones sin eventos (solo si no es force)
        let sesionesToProcess = allSessions;
        if (!force) {
            const sessionIds = allSessions.map(s => s.id);
            const sessionsWithEvents = await prisma.$queryRaw<Array<{ session_id: string }>>`
                SELECT DISTINCT session_id
                FROM stability_events
                WHERE session_id = ANY(${sessionIds}::text[])
            `;

            const sessionIdsWithEvents = new Set(sessionsWithEvents.map(s => s.session_id));
            sesionesToProcess = allSessions.filter(s => !sessionIdsWithEvents.has(s.id));

            logger.info(`📊 Sesiones sin eventos: ${sesionesToProcess.length} de ${allSessions.length}`);
        }

        let totalEventosGenerados = 0;
        let sesionesProcesadas = 0;
        let sesionesConError = 0;
        const resultados: any[] = [];

        for (const sesion of sesionesToProcess) {
            try {
                // Si force=true, eliminar eventos existentes primero
                if (force) {
                    await prisma.$executeRaw`
                        DELETE FROM stability_events
                        WHERE session_id = ${sesion.id}
                    `;
                }

                // Generar eventos usando el método correcto
                const eventos = await generateStabilityEventsForSession(sesion.id);

                logger.info(`✅ Sesión ${sesion.id}: ${eventos.length} eventos generados`);
                totalEventosGenerados += eventos.length;
                sesionesProcesadas++;

                resultados.push({
                    sessionId: sesion.id,
                    vehicleIdentifier: sesion.vehicle?.identifier || 'N/A',
                    eventosNuevos: eventos.length,
                    status: 'processed'
                });

            } catch (error: any) {
                logger.error(`❌ Error procesando sesión ${sesion.id}:`, error.message);
                sesionesConError++;
                resultados.push({
                    sessionId: sesion.id,
                    vehicleIdentifier: sesion.vehicle?.identifier || 'N/A',
                    eventosNuevos: 0,
                    status: 'error',
                    error: error.message
                });
            }
        }

        // Verificar eventos totales en BD
        const totalEventosBD = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count
            FROM stability_events
            WHERE session_id IN (
                SELECT id FROM "Session" WHERE "organizationId" = ${orgId}
            )
        `;
        const eventCount = Number(totalEventosBD[0]?.count || 0);

        logger.info('📊 Generación masiva de eventos completada', {
            sesionesTotales: allSessions.length,
            sesionesProcesadas,
            sesionesConError,
            totalEventosGenerados,
            totalEventosBD: eventCount
        });

        res.json({
            success: true,
            message: `Eventos generados: ${totalEventosGenerados} eventos en ${sesionesProcesadas} sesiones`,
            data: {
                sesionesTotales: allSessions.length,
                sesionesProcesadas,
                sesionesConError,
                totalEventosGenerados,
                totalEventosBD: eventCount,
                resultados: resultados.slice(0, 50) // Solo primeros 50 en respuesta
            }
        });

    } catch (error: any) {
        logger.error('❌ Error generando eventos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * POST /api/generate-events/session/:id
 * Regenera eventos de estabilidad para UNA sesión específica
 */
router.post('/session/:id', authenticate, attachOrg, async (req, res) => {
    try {
        const { id } = req.params;
        const orgId = (req as any).orgId;
        const { force = false } = req.body; // Forzar regeneración aunque ya existan eventos

        logger.info('🚀 Regenerando eventos para sesión', { sessionId: id, force });

        // Verificar que la sesión pertenece a la organización
        const session = await prisma.session.findFirst({
            where: { id, organizationId: orgId },
            include: { vehicle: true }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }

        // Si force=true, eliminar eventos existentes
        if (force) {
            const deleted = await prisma.stabilityEvent.deleteMany({
                where: { session_id: id }
            });
            logger.info(`🗑️ Eliminados ${deleted.count} eventos existentes`);
        } else {
            // Verificar si ya tiene eventos
            const eventosExistentes = await prisma.stabilityEvent.count({
                where: { session_id: id }
            });

            if (eventosExistentes > 0) {
                return res.json({
                    success: true,
                    message: `Sesión ya tiene ${eventosExistentes} eventos. Usa force=true para regenerar.`,
                    data: {
                        eventosExistentes,
                        eventosNuevos: 0,
                        status: 'skipped'
                    }
                });
            }
        }

        // Generar y guardar eventos
        const resultado = await eventDetector.detectarYGuardarEventos(id);

        logger.info(`✅ Sesión ${id}: ${resultado.guardados} eventos guardados de ${resultado.total} detectados`);

        res.json({
            success: true,
            message: `Eventos regenerados exitosamente`,
            data: {
                sessionId: id,
                vehicleName: session.vehicle?.name || 'N/A',
                eventosDetectados: resultado.total,
                eventosGuardados: resultado.guardados,
                status: 'completed'
            }
        });

    } catch (error: any) {
        logger.error('❌ Error regenerando eventos de sesión:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

export default router;
