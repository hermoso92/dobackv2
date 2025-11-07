/**
 * Script para generar OperationalKeys para todas las sesiones existentes
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';
import { generateOperationalSegments, convertSegmentsToOperationalKeys } from '../src/services/OperationalKeyCalculator';

const prisma = new PrismaClient();

async function generarKeys() {
    logger.info('═══════════════════════════════════════');
    logger.info('   GENERACIÓN DE OPERATIONAL KEYS');
    logger.info('═══════════════════════════════════════\n');

    try {
        const orgId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

        // Obtener sesiones
        const sesiones = await prisma.session.findMany({
            where: {
                organizationId: orgId,
                endTime: { not: null } // Solo sesiones completas
            },
            select: {
                id: true,
                vehicleId: true,
                startTime: true,
                endTime: true
            },
            orderBy: { startTime: 'desc' }
        });

        logger.info(`📁 Procesando ${sesiones.length} sesiones`);

        let exitosos = 0;
        let errores = 0;
        let sinDatosRotativo = 0;
        let totalKeysCreadas = 0;

        for (const sesion of sesiones) {
            try {
                logger.debug(`Procesando sesión ${sesion.id.substring(0, 8)}...`);
                
                // 1. Generar segmentos
                const segments = await generateOperationalSegments(sesion.id);
                
                // 2. Convertir a OperationalKeys
                const keysCreated = await convertSegmentsToOperationalKeys(sesion.id);
                
                totalKeysCreadas += keysCreated;
                exitosos++;
                
                if (keysCreated > 0) {
                    logger.info(`  ✅ Sesión ${sesion.id.substring(0, 8)}... - ${keysCreated} keys generadas`);
                }
            } catch (e: any) {
                if (e.message.includes('Sin datos de rotativo')) {
                    sinDatosRotativo++;
                    logger.debug(`  ⏭️  Sesión ${sesion.id.substring(0, 8)}... - Sin datos de rotativo`);
                } else {
                    errores++;
                    logger.error(`  ❌ Sesión ${sesion.id.substring(0, 8)}... - Error: ${e.message}`);
                }
            }
        }

        // Verificar resultado
        const countKeys = await prisma.operationalKey.count();

        logger.info('\n═══════════════════════════════════════');
        logger.info('   RESUMEN DE GENERACIÓN');
        logger.info('═══════════════════════════════════════');
        logger.info(`📊 Sesiones procesadas: ${sesiones.length}`);
        logger.info(`✅ Exitosos: ${exitosos}`);
        logger.info(`⏭️  Sin datos rotativo: ${sinDatosRotativo}`);
        logger.info(`❌ Errores: ${errores}`);
        logger.info(`🔑 Total Operational Keys creadas: ${totalKeysCreadas}`);
        logger.info(`📊 Total Operational Keys en BD: ${countKeys}`);

        if (countKeys === 0) {
            logger.warn('\n⚠️  PROBLEMA: NO se crearon OperationalKeys');
            logger.warn('   Revisar OperationalKeyCalculator.ts');
        } else {
            logger.info('\n🎉 ¡GENERACIÓN EXITOSA!');
        }

    } catch (error: any) {
        logger.error('❌ Error crítico:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

generarKeys()
    .then(() => {
        logger.info('\n✅ Script completado');
        process.exit(0);
    })
    .catch((e) => {
        logger.error('❌ Script falló:', e);
        process.exit(1);
    });

