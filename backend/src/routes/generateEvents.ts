import { Router } from 'express';
import { attachOrg } from '../middleware/attachOrg';
import { authenticate } from '../middleware/auth';
import { eventDetector } from '../services/eventDetector';
// import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/generate-events
 * Genera eventos de estabilidad para todas las sesiones de la organización
 */
router.post('/generate-events', authenticate, attachOrg, async (req, res) => {
    try {
        const orgId = (req as any).orgId;
        const limit = parseInt(req.body.limit as string) || 10; // Limitar para pruebas

        logger.info('🚀 Iniciando generación de eventos', { organizationId: orgId, limit });

        const { prisma } = await import('../config/prisma');

        // Obtener sesiones de la organización
        const sesiones = await prisma.session.findMany({
            where: {
                organizationId: orgId
            },
            select: {
                id: true,
                vehicleId: true,
                startTime: true,
                endTime: true
            },
            orderBy: { startTime: 'desc' },
            take: limit
        });

        logger.info(`📊 Encontradas ${sesiones.length} sesiones para procesar`);

        let totalEventosGenerados = 0;
        let sesionesProcesadas = 0;
        const resultados = [];

        for (const sesion of sesiones) {
            try {
                // Verificar si ya tiene eventos
                const eventosExistentes = await prisma.stability_events.count({
                    where: { session_id: sesion.id }
                });

                if (eventosExistentes > 0) {
                    logger.info(`⏭️ Sesión ${sesion.id} ya tiene ${eventosExistentes} eventos`);
                    resultados.push({
                        sessionId: sesion.id,
                        eventosExistentes,
                        eventosNuevos: 0,
                        status: 'skipped'
                    });
                    continue;
                }

                // Generar y guardar eventos
                const resultado = await eventDetector.detectarYGuardarEventos(sesion.id);

                logger.info(`✅ Sesión ${sesion.id}: ${resultado.guardados} eventos guardados de ${resultado.total} detectados`);
                totalEventosGenerados += resultado.guardados;
                sesionesProcesadas++;

                resultados.push({
                    sessionId: sesion.id,
                    eventosExistentes: 0,
                    eventosNuevos: resultado.guardados,
                    status: 'processed'
                });

            } catch (error: any) {
                logger.error(`❌ Error procesando sesión ${sesion.id}:`, error.message);
                resultados.push({
                    sessionId: sesion.id,
                    eventosExistentes: 0,
                    eventosNuevos: 0,
                    status: 'error',
                    error: error.message
                });
            }
        }

        // Verificar eventos totales en BD
        const totalEventosBD = await prisma.stability_events.count();

        logger.info('📊 Generación de eventos completada', {
            sesionesProcesadas,
            totalEventosGenerados,
            totalEventosBD
        });

        res.json({
            success: true,
            message: 'Eventos generados exitosamente',
            data: {
                sesionesProcesadas,
                totalEventosGenerados,
                totalEventosBD,
                resultados
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

export default router;
