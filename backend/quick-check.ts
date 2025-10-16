import prisma from './src/lib/prisma';

async function main() {
    try {
        const count = await prisma.session.count();
        console.log(`Total sesiones: ${count}`);

        const doback024 = await prisma.session.findMany({
            where: {
                vehicle: { identifier: 'DOBACK024' },
                startTime: {
                    gte: new Date('2025-09-30'),
                    lt: new Date('2025-10-01')
                }
            },
            select: {
                sessionNumber: true,
                startTime: true,
                endTime: true
            },
            orderBy: { sessionNumber: 'asc' }
        });

        console.log(`\nDOBACK024 - 30/09/2025: ${doback024.length} sesiones`);
        doback024.forEach(s => {
            const start = s.startTime.toISOString().substring(11, 19);
            const end = s.endTime?.toISOString().substring(11, 19) || 'NULL';
            console.log(`  S${s.sessionNumber}: ${start} - ${end}`);
        });

        console.log(`\nEsperado:`);
        console.log(`  S1: 09:33:37 - 10:38:25`);
        console.log(`  S2: 12:41:43 - 14:05:48`);

        if (doback024.length === 2) {
            const s1 = doback024[0].startTime.toISOString();
            const s2 = doback024[1].startTime.toISOString();
            if (s1.includes('09:33') && s2.includes('12:41')) {
                console.log(`\n✅ TIMESTAMPS CORREGIDOS!`);
            } else {
                console.log(`\n❌ Timestamps aun incorrectos`);
            }
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

