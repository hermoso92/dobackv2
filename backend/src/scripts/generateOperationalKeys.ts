/**
 * 🔑 SCRIPT: GENERAR OPERATIONAL KEYS
 * 
 * Este script convierte los segmentos operacionales existentes
 * en registros de OperationalKey para todas las sesiones que
 * tienen segmentos pero no tienen claves operacionales.
 * 
 * Uso:
 *   npx ts-node src/scripts/generateOperationalKeys.ts
 * 
 * @version 1.0
 * @date 2025-11-05
 */

import { prisma } from '../lib/prisma';
import { convertSegmentsToOperationalKeys } from '../services/OperationalKeyCalculator';
import { createLogger } from '../utils/logger';

const logger = createLogger('GenerateOperationalKeys');

async function main() {
    console.log('🔑 Iniciando generación de OperationalKeys para sesiones existentes');
    logger.info('🔑 Iniciando generación de OperationalKeys para sesiones existentes');

    try {
        // 0. Conectar Prisma
        console.log('Intentando conectar a Prisma...');
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida');
        logger.info('✅ Conexión a base de datos establecida');

        // 1. Obtener sesiones que tienen segmentos pero no tienen OperationalKeys
        const sessionsWithSegments = await prisma.$queryRaw<Array<{ sessionId: string; segmentCount: number }>>`
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
            return;
        }

        logger.info(`📊 Encontradas ${sessionsWithSegments.length} sesiones con segmentos pero sin OperationalKeys`);

        // 2. Procesar cada sesión
        let totalKeysCreated = 0;
        let sessionsProcessed = 0;
        let sessionsFailed = 0;

        for (const session of sessionsWithSegments) {
            try {
                logger.info(`🔄 Procesando sesión ${session.sessionId} (${session.segmentCount} segmentos)...`);

                const keysCreated = await convertSegmentsToOperationalKeys(session.sessionId);
                totalKeysCreated += keysCreated;
                sessionsProcessed++;

                logger.info(`✅ Sesión ${session.sessionId} procesada: ${keysCreated} claves creadas`);

            } catch (error: any) {
                sessionsFailed++;
                logger.error(`❌ Error procesando sesión ${session.sessionId}:`, error);
            }
        }

        // 3. Resumen final
        logger.info('');
        logger.info('╔═══════════════════════════════════════════════════════════════╗');
        logger.info('║           RESUMEN DE GENERACIÓN DE OPERATIONAL KEYS          ║');
        logger.info('╠═══════════════════════════════════════════════════════════════╣');
        logger.info(`║  Sesiones encontradas:     ${String(sessionsWithSegments.length).padStart(4)} sesiones             ║`);
        logger.info(`║  Sesiones procesadas:      ${String(sessionsProcessed).padStart(4)} sesiones             ║`);
        logger.info(`║  Sesiones fallidas:        ${String(sessionsFailed).padStart(4)} sesiones             ║`);
        logger.info(`║  Total claves creadas:     ${String(totalKeysCreated).padStart(4)} claves              ║`);
        logger.info('╚═══════════════════════════════════════════════════════════════╝');
        logger.info('');

        if (sessionsFailed > 0) {
            logger.warn(`⚠️ ${sessionsFailed} sesiones fallaron. Revisa los logs para más detalles.`);
        }

        logger.info('✅ Generación de OperationalKeys completada');

    } catch (error: any) {
        logger.error('❌ Error fatal en el script:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar script
main()
    .then(() => {
        logger.info('🎉 Script finalizado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('💥 Script finalizado con errores:', error);
        process.exit(1);
    });
