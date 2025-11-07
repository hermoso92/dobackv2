/**
 * 🔑 ENDPOINT ADMIN: MIGRAR OPERATIONAL KEYS
 * 
 * Endpoint temporal para migrar segmentos operacionales a OperationalKeys
 * 
 * POST /api/admin/migrate-operational-keys
 */

import { Request, Response, Router } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { convertSegmentsToOperationalKeys } from '../../services/OperationalKeyCalculator';
import { createLogger } from '../../utils/logger';

const router = Router();
const logger = createLogger('MigrateOperationalKeys');

router.post('/migrate-operational-keys', authenticate, async (req: Request, res: Response) => {
    try {
        // Solo permitir a usuarios ADMIN
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso denegado. Solo ADMIN puede ejecutar esta migración.' });
        }

        logger.info('🔑 Iniciando migración de OperationalKeys');

        // 1. Obtener sesiones que tienen segmentos pero no tienen OperationalKeys
        const sessionsWithSegments = await prisma.$queryRaw<Array<{ sessionId: string; segmentCount: bigint }>>`
            SELECT DISTINCT "sessionId", COUNT(*) as "segmentCount"
            FROM operational_state_segments
            WHERE "sessionId" NOT IN (
                SELECT DISTINCT "sessionId" FROM operational_keys
            )
            GROUP BY "sessionId"
            ORDER BY "sessionId"
        `;

        if (sessionsWithSegments.length === 0) {
            logger.info('✅ No hay sesiones pendientes de convertir');
            return res.json({
                success: true,
                message: 'No hay sesiones pendientes de convertir',
                sessionsFound: 0,
                sessionsProcessed: 0,
                totalKeysCreated: 0
            });
        }

        logger.info(`📊 Encontradas ${sessionsWithSegments.length} sesiones con segmentos pero sin OperationalKeys`);

        // 2. Procesar cada sesión
        let totalKeysCreated = 0;
        let sessionsProcessed = 0;
        let sessionsFailed = 0;
        const errors: string[] = [];

        for (const session of sessionsWithSegments) {
            try {
                logger.info(`🔄 Procesando sesión ${session.sessionId} (${session.segmentCount} segmentos)...`);

                const keysCreated = await convertSegmentsToOperationalKeys(session.sessionId);
                totalKeysCreated += keysCreated;
                sessionsProcessed++;

                logger.info(`✅ Sesión ${session.sessionId} procesada: ${keysCreated} claves creadas`);

            } catch (error: any) {
                sessionsFailed++;
                const errorMsg = `Sesión ${session.sessionId}: ${error.message}`;
                errors.push(errorMsg);
                logger.error(`❌ Error procesando sesión ${session.sessionId}:`, error);
            }
        }

        // 3. Retornar resumen
        const result = {
            success: true,
            message: 'Migración completada',
            sessionsFound: sessionsWithSegments.length,
            sessionsProcessed,
            sessionsFailed,
            totalKeysCreated,
            errors
        };

        logger.info('✅ Migración completada', result);

        return res.json(result);

    } catch (error: any) {
        logger.error('❌ Error en migración:', error);
        return res.status(500).json({
            success: false,
            error: 'Error ejecutando migración',
            details: error.message
        });
    }
});

export default router;



