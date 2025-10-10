/**
 * TEST FINAL COMPLETO - Sin autenticación (usando organizationId)
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function testFinal() {
    console.log('\n🧪 TEST FINAL COMPLETO DEL SISTEMA');
    console.log('=' .repeat(80));
    console.log('\n📍 Organization ID: ' + ORG_ID + '\n');
    
    const tests = [];
    
    // ========================================================================
    // TEST 1: KPIs Summary
    // ========================================================================
    console.log('🎯 TEST 1: /api/kpis/summary\n');
    
    try {
        const response = await fetch(`${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`);
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const total = data.data.stability?.total_incidents || 0;
                const porTipo = data.data.stability?.por_tipo;
                const quality = data.data.quality;
                
                console.log(`   ✅ Total eventos: ${total}`);
                console.log(`   ${porTipo ? '✅' : '❌'} Tiene por_tipo`);
                console.log(`   ${quality ? '✅' : '❌'} Tiene quality`);
                console.log(`   ${total > 1500 && total < 2000 ? '✅' : '⚠️'} Eventos en rango esperado (1,500-2,000)`);
                
                if (porTipo) {
                    console.log('\n   📊 POR_TIPO:');
                    Object.entries(porTipo).slice(0, 5).forEach(([tipo, count]) => {
                        console.log(`      ${tipo}: ${count}`);
                    });
                }
                
                tests.push({ nombre: 'KPIs Summary', ok: total > 1500 && total < 2000 && porTipo && quality });
            } else {
                console.log('   ❌ Respuesta sin data');
                tests.push({ nombre: 'KPIs Summary', ok: false });
            }
        } else {
            console.log('   ❌ Error HTTP');
            tests.push({ nombre: 'KPIs Summary', ok: false });
        }
    } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
        tests.push({ nombre: 'KPIs Summary', ok: false });
    }
    
    // ========================================================================
    // TEST 2: Hotspots
    // ========================================================================
    console.log('\n🎯 TEST 2: /api/hotspots/critical-points\n');
    
    try {
        const response = await fetch(`${BASE_URL}/api/hotspots/critical-points?organizationId=${ORG_ID}&severity=all&minFrequency=1&clusterRadius=20`);
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const totalEventos = data.data.totalEvents || 0;
                const eventosDetectados = data.data.eventosDetectados;
                
                console.log(`   ✅ Total eventos: ${totalEventos}`);
                console.log(`   ✅ Total clusters: ${data.data.totalClusters || 0}`);
                console.log(`   ${eventosDetectados ? '✅' : '❌'} Tiene eventosDetectados`);
                console.log(`   ${totalEventos > 1500 && totalEventos < 2000 ? '✅' : '⚠️'} Eventos en rango`);
                
                if (eventosDetectados) {
                    console.log(`\n   📊 EVENTOS DETECTADOS:`);
                    console.log(`      Total: ${eventosDetectados.total}`);
                    console.log(`      Por tipo: ${Object.keys(eventosDetectados.por_tipo || {}).length} tipos`);
                }
                
                tests.push({ nombre: 'Hotspots', ok: totalEventos > 1500 && totalEventos < 2000 && eventosDetectados });
            } else {
                console.log('   ❌ Respuesta sin data');
                tests.push({ nombre: 'Hotspots', ok: false });
            }
        } else {
            console.log('   ❌ Error HTTP');
            tests.push({ nombre: 'Hotspots', ok: false });
        }
    } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
        tests.push({ nombre: 'Hotspots', ok: false });
    }
    
    // ========================================================================
    // TEST 3: Speed Violations
    // ========================================================================
    console.log('\n🎯 TEST 3: /api/speed/violations\n');
    
    try {
        const response = await fetch(`${BASE_URL}/api/speed/violations?organizationId=${ORG_ID}&rotativoOn=all&violationType=all`);
        console.log(`   Status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const violations = data.data.violations || [];
                const summary = data.data.summary;
                
                console.log(`   ✅ Violaciones: ${violations.length}`);
                console.log(`   ${summary ? '✅' : '❌'} Tiene summary`);
                
                if (summary) {
                    console.log(`   ✅ Velocidad máxima: ${summary.velocidad_maxima} km/h`);
                    console.log(`   ✅ Velocidad promedio: ${summary.velocidad_promedio} km/h`);
                }
                
                tests.push({ nombre: 'Speed', ok: summary !== undefined });
            } else {
                console.log('   ❌ Respuesta sin data');
                tests.push({ nombre: 'Speed', ok: false });
            }
        } else {
            console.log('   ❌ Error HTTP');
            tests.push({ nombre: 'Speed', ok: false });
        }
    } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
        tests.push({ nombre: 'Speed', ok: false });
    }
    
    // ========================================================================
    // RESUMEN
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL\n');
    
    tests.forEach(t => {
        console.log(`${t.ok ? '✅' : '❌'} ${t.nombre}`);
    });
    
    const exitosos = tests.filter(t => t.ok).length;
    console.log(`\n📈 Tasa de éxito: ${exitosos}/${tests.length} (${(exitosos / tests.length * 100).toFixed(1)}%)\n`);
    
    if (exitosos === tests.length) {
        console.log('✅ SISTEMA VERIFICADO - TODO FUNCIONA\n');
    } else {
        console.log('⚠️ HAY PROBLEMAS - REVISAR ARRIBA\n');
    }
}

testFinal();

