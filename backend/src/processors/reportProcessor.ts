import { PrismaClient, ReportStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { buildReportPdf } from '../utils/report/reportBuilder';

const prisma = new PrismaClient();

/**
 * Procesa todos los Report con estado PENDING.
 * Genera el PDF mediante reportBuilder y actualiza la base.
 */
export async function processPendingReports(): Promise<void> {
    const pending = await prisma.report.findMany({ where: { status: ReportStatus.PENDING } });
    if (!pending.length) return;

    logger.info(`Generando ${pending.length} reportes`);

    for (const rep of pending) {
        try {
            logger.info('Iniciando generación de reporte', { id: rep.id });
            const { filePath, size } = await buildReportPdf(rep);

            logger.info('PDF generado, actualizando base de datos', { id: rep.id, filePath, size });

            await prisma.report.update({
                where: { id: rep.id },
                data: {
                    status: ReportStatus.READY,
                    filePath,
                    sizeBytes: size,
                    updatedAt: new Date()
                }
            });

            logger.info('Reporte listo', { id: rep.id, filePath, size });
        } catch (err) {
            logger.error('Error al generar reporte', { id: rep.id, err });
            await prisma.report.update({
                where: { id: rep.id },
                data: { status: ReportStatus.FAILED }
            });
        }
    }
}

// permite ejecución manual: npx ts-node src/processors/reportProcessor.ts
if (require.main === module) {
    processPendingReports()
        .catch((e) => {
            logger.error(e);
            process.exit(1);
        })
        .finally(() => prisma.$disconnect());
}
