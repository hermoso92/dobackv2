import { prisma } from '../../backend/src/config/prisma';
import { createLogger } from '../../backend/src/utils/logger';

const logger = createLogger('NormalizeOperationalSegments');

async function main(): Promise<void> {
    logger.info('🚦 Iniciando normalización de segmentos operacionales');

    const totalSegments = await prisma.operational_state_segments.count();
    const segmentsClave4 = await prisma.operational_state_segments.count({ where: { clave: 4 } });

    logger.info('📊 Estado actual', {
        totalSegments,
        segmentsClave4
    });

    if (segmentsClave4 === 0) {
        logger.info('✅ No hay segmentos con clave 4. No se requieren cambios.');
        return;
    }

    const batchSize = 5_000;
    let updated = 0;

    logger.info(`🔄 Actualizando segmentos en lotes de ${batchSize}`);

    while (updated < segmentsClave4) {
        const toUpdate = await prisma.operational_state_segments.findMany({
            where: { clave: 4 },
            select: { id: true },
            take: batchSize
        });

        if (toUpdate.length === 0) {
            break;
        }

        const ids = toUpdate.map(row => row.id);

        const result = await prisma.operational_state_segments.updateMany({
            where: { id: { in: ids } },
            data: { clave: 5 }
        });

        updated += result.count;
        logger.info('✅ Lote actualizado', {
            lote: Math.ceil(updated / batchSize),
            registrosEnLote: result.count,
            totalActualizados: updated
        });
    }

    logger.info('📥 Regenerando duración agregada por clave');

    const resumen = await prisma.operational_state_segments.groupBy({
        by: ['clave'],
        _count: { clave: true },
        _sum: { durationSeconds: true }
    });

    logger.info('📊 Resumen de claves tras normalización', resumen);

    logger.info('✅ Normalización completada');
}

main()
    .catch(error => {
        logger.error('❌ Error normalizando segmentos operacionales', { error: error?.message || error });
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect().catch(() => undefined);
    });
