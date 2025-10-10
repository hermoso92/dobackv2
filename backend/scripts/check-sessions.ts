import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
    try {
        console.log('Buscando sesiones...');

        const sessions = await prisma.session.findMany({
            take: 5
        });

        console.log(`Encontradas ${sessions.length} sesiones:`);

        sessions.forEach((session, index) => {
            console.log(`${index + 1}. ID: ${session.id}`);
            console.log(`   Vehicle: ${session.vehicleId}`);
            console.log(`   Start: ${session.startTime}`);
            console.log(`   Status: ${session.status}`);
            console.log('---');
        });

        if (sessions.length > 0) {
            const firstSession = sessions[0];

            // Verificar datos de la primera sesión
            const stabilityCount = await prisma.stabilityMeasurement.count({
                where: { sessionId: firstSession.id }
            });

            const gpsCount = await prisma.gpsMeasurement.count({
                where: { sessionId: firstSession.id }
            });

            const canCount = await prisma.canMeasurement.count({
                where: { sessionId: firstSession.id }
            });

            console.log(`\nDatos de la sesión ${firstSession.id}:`);
            console.log(`- Stability measurements: ${stabilityCount}`);
            console.log(`- GPS measurements: ${gpsCount}`);
            console.log(`- CAN measurements: ${canCount}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSessions();
