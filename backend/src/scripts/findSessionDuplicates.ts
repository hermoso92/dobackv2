import { prisma } from '../lib/prisma';





async function findDuplicates() {
    const result = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "vehicleId", "startTime", COUNT(*) as count
     FROM "Session"
     GROUP BY "vehicleId", "startTime"
     HAVING COUNT(*) > 1`
    );

    if (result.length === 0) {
        console.log('No se encontraron duplicados.');
    } else {
        console.log('Duplicados encontrados:');
        result.forEach((row) => {
            console.log(
                `vehicleId: ${row.vehicleId}, startTime: ${row.startTime}, count: ${row.count}`
            );
        });
    }
}

findDuplicates()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
