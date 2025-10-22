/**
 * Endpoint temporal para reprocesar segmentos operacionales
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { calcularYGuardarSegmentos } from '../services/keyCalculatorBackup';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('ReprocessEndpoint');

/**
 * POST /api/reprocess/segments
 * Reprocesa segmentos operacionales de todas las sesiones
 */
router.post('/segments', authenticate, async (req, res) => {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
        return res.status(400).json({ error: 'OrganizationId requerido' });
    }

    try {
        logger.info('🔄 Iniciando reprocesamiento...');

        // 1. Obtener sesiones
        const sessions = await prisma.session.findMany({
            where: { organizationId },
            select: { id: true }
        });

        logger.info(`📊 ${sessions.length} sesiones encontradas`);

        // 2. Eliminar segmentos antiguos
        const sessionIds = sessions.map(s => s.id);
        const deleted = await prisma.$executeRaw`
            DELETE FROM operational_state_segments
            WHERE "sessionId"::text = ANY(${sessionIds}::text[])
        `;

        logger.info(`🗑️  ${deleted} segmentos eliminados`);

        // 3. Regenerar segmentos
        let procesados = 0;
        let conSegmentos = 0;
        let errores = 0;

        for (const session of sessions) {
            try {
                const num = await calcularYGuardarSegmentos(session.id);
                procesados++;
                if (num > 0) conSegmentos++;

                if (procesados % 10 === 0) {
                    logger.info(`Progreso: ${procesados}/${sessions.length}`);
                }
            } catch (error: any) {
                errores++;
                logger.error(`Error en sesión ${session.id}: ${error.message}`);
            }
        }

        // 4. Verificar resultados
        const totales: any[] = await prisma.$queryRaw`
            SELECT clave, COUNT(*) as count, ROUND(SUM("durationSeconds")::numeric/3600, 2) as hours
            FROM operational_state_segments
            GROUP BY clave
            ORDER BY clave
        `;

        logger.info('✅ Reprocesamiento completado');

        res.json({
            success: true,
            sesiones: sessions.length,
            procesadas: procesados,
            conSegmentos,
            errores,
            segmentosPorClave: totales
        });

    } catch (error: any) {
        logger.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;

