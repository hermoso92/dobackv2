/**
 * Test: Generar segmentos para UNA sesión para debugging
 */

async function testSingleSession() {
    console.log('🧪 Test de generación de segmentos para una sesión\n');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // 1. Obtener una sesión con GPS y rotativo
        const session = await prisma.session.findFirst({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            },
            include: {
                GpsMeasurement: { take: 5 },
                RotativoMeasurement: { take: 5 }
            }
        });

        if (!session) {
            console.log('❌ No se encontró sesión');
            return;
        }

        console.log(`✅ Sesión encontrada: ${session.id}`);
        console.log(`   GPS points: ${session.GpsMeasurement.length}`);
        console.log(`   Rotativo points: ${session.RotativoMeasurement.length}\n`);

        // 2. Importar y ejecutar función
        console.log('⚙️ Ejecutando calcularYGuardarSegmentos...\n');
        
        const keyCalc = require('../../backend/src/services/keyCalculatorBackup');
        const numSegmentos = await keyCalc.calcularYGuardarSegmentos(session.id);

        console.log(`\n✅ Resultado: ${numSegmentos} segmentos generados`);

        // 3. Ver segmentos generados
        const segmentos = await prisma.$queryRaw`
            SELECT clave, "startTime", "endTime", "durationSeconds"
            FROM operational_state_segments
            WHERE "sessionId" = ${session.id}
            ORDER BY "startTime"
        `;

        console.log(`\n📊 Segmentos generados:\n`);
        segmentos.forEach((s, i) => {
            const horas = (s.durationSeconds / 3600).toFixed(2);
            console.log(`  ${i+1}. Clave ${s.clave}: ${horas}h (${s.startTime.toISOString().substring(11,19)} - ${s.endTime.toISOString().substring(11,19)})`);
        });

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testSingleSession();

