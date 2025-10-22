/**
 * Script para reprocesar segmentos operacionales de sesiones existentes
 * Usa la lógica corregida de geocercas (Point, Polygon, Circle)
 */

import { prisma } from '../lib/prisma';
import { calcularYGuardarSegmentos } from '../services/keyCalculatorBackup';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReprocessSegments');

async function reprocesarTodasLasSesiones() {
    logger.info('🔄 Iniciando reprocesamiento de segmentos operacionales...\n');

    try {
        // Conectar Prisma
        await prisma.$connect();
        logger.info('✅ Prisma conectado\n');

        // 1. Obtener todas las sesiones
        const sessions = await prisma.session.findMany({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            },
            select: { id: true, startTime: true, vehicleId: true },
            orderBy: { startTime: 'asc' }
        });

        logger.info(`📊 Encontradas ${sessions.length} sesiones\n`);

        // 2. Eliminar segmentos existentes
        logger.info('🗑️  Eliminando segmentos antiguos...');
        const sessionIds = sessions.map(s => s.id);

        const deleted = await prisma.$executeRaw`
            DELETE FROM operational_state_segments
            WHERE "sessionId"::text = ANY(${sessionIds}::text[])
        `;

        logger.info(`✅ ${deleted} segmentos eliminados\n`);

        // 3. Regenerar segmentos
        logger.info('⚙️ Regenerando segmentos con lógica corregida...\n');

        let procesados = 0;
        let conSegmentos = 0;
        let errors = 0;
        const errorDetails: string[] = [];

        for (const session of sessions) {
            try {
                const numSegmentos = await calcularYGuardarSegmentos(session.id);
                procesados++;

                if (numSegmentos > 0) {
                    conSegmentos++;
                    logger.info(`  ✓ Sesión ${session.id.substring(0, 8)}... → ${numSegmentos} segmentos`);
                } else {
                    logger.warn(`  ⚠️  Sesión ${session.id.substring(0, 8)}... → 0 segmentos`);
                }

                // Progreso cada 10 sesiones
                if (procesados % 10 === 0) {
                    logger.info(`\n📊 Progreso: ${procesados}/${sessions.length} (${((procesados / sessions.length) * 100).toFixed(1)}%)\n`);
                }

            } catch (error: any) {
                errors++;
                logger.error(`  ✗ Error en ${session.id.substring(0, 8)}...: ${error.message}`);
                errorDetails.push(`${session.id}: ${error.message}`);
            }
        }

        // 4. Resultados finales
        logger.info('\n========================================');
        logger.info('  REPROCESAMIENTO COMPLETADO');
        logger.info('========================================\n');
        logger.info(`Total sesiones: ${sessions.length}`);
        logger.info(`Procesadas: ${procesados}`);
        logger.info(`Con segmentos: ${conSegmentos}`);
        logger.info(`Errores: ${errors}\n`);

        if (errors > 0) {
            logger.warn('⚠️  Errores encontrados:');
            errorDetails.slice(0, 5).forEach(e => logger.warn(`  - ${e}`));
            if (errorDetails.length > 5) {
                logger.warn(`  ... y ${errorDetails.length - 5} más`);
            }
        }

        // 5. Verificar nuevos segmentos
        const nuevosTotales: any[] = await prisma.$queryRaw`
            SELECT 
                clave,
                COUNT(*) as count,
                ROUND(SUM("durationSeconds")::numeric/3600, 2) as hours
            FROM operational_state_segments
            GROUP BY clave
            ORDER BY clave
        `;

        logger.info('\n📊 NUEVOS SEGMENTOS POR CLAVE:\n');

        if (nuevosTotales.length === 0) {
            logger.error('❌ NO SE GENERARON SEGMENTOS');
            logger.error('Posibles causas:');
            logger.error('  1. Sesiones sin datos GPS');
            logger.error('  2. Geocercas no cargadas');
            logger.error('  3. Error en lógica de cálculo');
        } else {
            nuevosTotales.forEach((s: any) => {
                const claveName = {
                    0: 'Taller',
                    1: 'Parque',
                    2: 'Emergencia',
                    3: 'Siniestro',
                    4: 'Retirada',
                    5: 'Regreso'
                }[s.clave] || 'Desconocido';

                logger.info(`  Clave ${s.clave} (${claveName}): ${s.count} segmentos, ${s.hours}h`);
            });
        }

        logger.info('\n✅ Reprocesamiento finalizado');

    } catch (error: any) {
        logger.error('❌ Error fatal:', error);
        logger.error(error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
reprocesarTodasLasSesiones()
    .then(() => {
        logger.info('\n✅ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('\n❌ Script falló:', error);
        process.exit(1);
    });

