import { prisma } from '../lib/prisma';





async function cleanDuplicates() {
    // Buscar todos los duplicados
    const duplicates = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "vehicleId", "startTime", array_agg("id") as ids
     FROM "Session"
     GROUP BY "vehicleId", "startTime"
     HAVING COUNT(*) > 1`
    );

    let totalEliminados = 0;
    for (const row of duplicates) {
        // Mantener el primer id, eliminar el resto
        const ids = row.ids;
        if (ids.length > 1) {
            const idsToDelete = ids.slice(1); // Mantener el primero

            // Eliminar datos relacionados
            await prisma.canMeasurement.deleteMany({ where: { sessionId: { in: idsToDelete } } });
            await prisma.gpsMeasurement.deleteMany({ where: { sessionId: { in: idsToDelete } } });
            await prisma.stabilityMeasurement.deleteMany({
                where: { sessionId: { in: idsToDelete } }
            });
            await prisma.attachment.deleteMany({ where: { sessionId: { in: idsToDelete } } });
            await prisma.eventExecution.deleteMany({ where: { sessionId: { in: idsToDelete } } });

            // Eliminar las sesiones duplicadas
            const deleted = await prisma.session.deleteMany({
                where: {
                    id: { in: idsToDelete }
                }
            });
            totalEliminados += deleted.count;
            console.log(
                `Eliminados ${deleted.count} duplicados para vehicleId: ${row.vehicleId}, startTime: ${row.startTime}`
            );
        }
    }
    if (totalEliminados === 0) {
        console.log('No se eliminaron duplicados.');
    } else {
        console.log(`Total de duplicados eliminados: ${totalEliminados}`);
    }
}

cleanDuplicates()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
