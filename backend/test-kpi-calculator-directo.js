/**
 * TEST DIRECTO DE kpiCalculator
 * Verifica que calcularKPIsCompletos devuelve quality y por_tipo
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testKPICalculator() {
    console.log('\n🧪 PROBANDO kpiCalculator DIRECTAMENTE\n');

    try {
        // Importar kpiCalculator compilado
        const { kpiCalculator } = require('./dist/src/services/kpiCalculator');

        // Obtener organizationId real
        const session = await prisma.session.findFirst();
        const organizationId = session.organizationId;

        console.log(`📍 OrganizationId: ${organizationId}`);
        console.log(`📍 Sesiones en BD: ${await prisma.session.count()}`);

        console.log('\n⏳ Llamando a kpiCalculator.calcularKPIsCompletos()...\n');

        const result = await kpiCalculator.calcularKPIsCompletos({
            organizationId
        });

        console.log('✅ kpiCalculator.calcularKPIsCompletos() ejecutado\n');

        console.log('📊 RESULTADO:\n');
        console.log(`   states.total_time: ${result.states?.total_time_formatted || 'undefined'}`);
        console.log(`   activity.km_total: ${result.activity?.km_total || 'undefined'}`);
        console.log(`   stability.total_incidents: ${result.stability?.total_incidents || 'undefined'}`);
        console.log(`   stability.por_tipo: ${result.stability?.por_tipo ? 'EXISTE ✅' : 'undefined ❌'}`);
        console.log(`   quality: ${result.quality ? 'EXISTE ✅' : 'undefined ❌'}`);

        if (result.quality) {
            console.log(`\n   📊 QUALITY (Índice SI):`);
            console.log(`      indice_promedio: ${result.quality.indice_promedio}`);
            console.log(`      calificacion: ${result.quality.calificacion}`);
            console.log(`      estrellas: ${result.quality.estrellas}`);
            console.log(`      total_muestras: ${result.quality.total_muestras}`);
        } else {
            console.log(`\n   ❌ quality es undefined`);
        }

        if (result.stability?.por_tipo) {
            console.log(`\n   📊 POR_TIPO (Eventos):`);
            Object.entries(result.stability.por_tipo).forEach(([tipo, count]) => {
                console.log(`      ${tipo}: ${count}`);
            });
        } else {
            console.log(`\n   ❌ por_tipo es undefined`);
        }

        console.log('\n✅ TEST COMPLETADO\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nStack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testKPICalculator().catch(console.error);

