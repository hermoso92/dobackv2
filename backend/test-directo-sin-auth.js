/**
 * Test directo llamando a kpiCalculator sin HTTP
 */

async function testDirecto() {
    console.log('\n🧪 TEST DIRECTO - Importando módulos TS compilados\n');
    
    try {
        // Importar desde dist/ (código compilado)
        const { kpiCalculator } = require('./dist/src/services/kpiCalculator');
        const { eventDetector } = require('./dist/src/services/eventDetector');
        
        console.log('✅ Módulos importados desde dist/\n');
        
        const organizationId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
        
        console.log('📊 Llamando kpiCalculator.calcularKPIsCompletos()...\n');
        
        const summary = await kpiCalculator.calcularKPIsCompletos({
            organizationId
        });
        
        console.log('✅ KPIs calculados\n');
        console.log('📊 RESULTADO:\n');
        console.log(`   States total: ${summary.states?.total_time_formatted}`);
        console.log(`   KM total: ${summary.activity?.km_total}`);
        console.log(`   Total eventos: ${summary.stability?.total_incidents}`);
        
        console.log('\n🔍 POR_TIPO:');
        if (summary.stability?.por_tipo) {
            console.log('   ✅ EXISTE');
            Object.entries(summary.stability.por_tipo).forEach(([tipo, count]) => {
                console.log(`      ${tipo}: ${count}`);
            });
        } else {
            console.log('   ❌ NO EXISTE');
        }
        
        console.log('\n📊 QUALITY:');
        if (summary.quality) {
            console.log('   ✅ EXISTE');
            console.log(`      indice_promedio: ${summary.quality.indice_promedio}`);
            console.log(`      calificacion: ${summary.quality.calificacion}`);
        } else {
            console.log('   ❌ NO EXISTE');
        }
        
        console.log('\n' + '='.repeat(80));
        
        const todoBien = 
            summary.stability?.total_incidents > 1000 &&
            summary.stability?.total_incidents < 3000 &&
            summary.stability?.por_tipo &&
            summary.quality;
        
        if (todoBien) {
            console.log('✅ KPICALCULATOR FUNCIONANDO CON CÓDIGO NUEVO');
        } else {
            console.log('⚠️ KPICALCULATOR USA CÓDIGO VIEJO O HAY PROBLEMAS');
        }
        
        console.log('');
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
        console.log('\n💡 Posiblemente dist/ no está actualizado o falta recompilar');
    }
}

testDirecto();

