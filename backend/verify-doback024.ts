import prisma from './src/lib/prisma';

async function main() {
    const sessions = await prisma.session.findMany({
        where: {
            vehicle: { identifier: 'DOBACK024' },
            startTime: {
                gte: new Date('2025-09-30T00:00:00Z'),
                lt: new Date('2025-10-01T00:00:00Z')
            }
        },
        orderBy: { sessionNumber: 'asc' }
    });

    console.log(`\nDOBACK024 - 30/09/2025:`);
    console.log(`Sesiones: ${sessions.length} (esperadas: 2)`);

    sessions.forEach(s => {
        const start = s.startTime.toISOString();
        const end = s.endTime?.toISOString();
        console.log(`  Sesion ${s.sessionNumber}: ${start} -> ${end}`);
    });

    // Comparar con real
    console.log(`\nComparacion con archivo real:`);
    console.log(`  Esperado sesion 1: 2025-09-30T09:33:37`);
    console.log(`  Esperado sesion 2: 2025-09-30T12:41:43`);

    if (sessions.length === 2) {
        const s1Start = sessions[0].startTime.toISOString();
        const s2Start = sessions[1].startTime.toISOString();

        if (s1Start.includes('09:33') && s2Start.includes('12:41')) {
            console.log(`\n[EXITO] Timestamps corregidos!`);
        } else {
            console.log(`\n[FALLO] Timestamps aun incorrectos`);
        }
    } else {
        console.log(`\n[FALLO] ${sessions.length} sesiones en lugar de 2`);
    }

    await prisma.$disconnect();
}

main();

