/**
 * Ver contenido RAW de las geocercas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verGeocercasRaw() {
    try {
        const parques = await prisma.zone.findMany({
            where: { type: 'PARK' }
        });

        for (const p of parques) {
            console.log(`\n📍 ${p.name}`);
            console.log('Geometry RAW:');
            console.log(JSON.stringify(p.geometry, null, 2));
            console.log('\n---');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verGeocercasRaw();

