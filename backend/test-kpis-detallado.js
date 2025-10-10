/**
 * Test detallado del endpoint /api/kpis/summary
 */

const fetch = require('node-fetch');

async function testKPIsDetallado() {
    console.log('\n🧪 TEST DETALLADO - /api/kpis/summary\n');
    
    const BASE_URL = 'http://localhost:9998';
    const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
    
    // Login primero para obtener token
    console.log('🔐 Haciendo login...\n');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@dobacksoft.com',
            password: 'Admin123!'
        })
    });
    
    if (!loginResponse.ok) {
        console.log('❌ Login falló');
        return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ Login exitoso\n');
    console.log('📡 Llamando /api/kpis/summary CON autenticación...\n');
    
    const response = await fetch(`${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    console.log(`📡 Status: ${response.status}\n`);
    
    if (!response.ok) {
        const error = await response.text();
        console.log('❌ ERROR:', error);
        return;
    }
    
    const data = await response.json();
    
    if (!data.success) {
        console.log('❌ Respuesta no exitosa:', data);
        return;
    }
    
    const summary = data.data;
    
    console.log('📊 DATOS RECIBIDOS:\n');
    console.log(`✅ success: ${data.success}`);
    console.log(`\n📊 STATES:`);
    console.log(`   total_time: ${summary.states?.total_time_formatted || 'N/A'}`);
    console.log(`   states: ${summary.states?.states?.length || 0} claves`);
    
    console.log(`\n📊 ACTIVITY:`);
    console.log(`   km_total: ${summary.activity?.km_total || 0}`);
    console.log(`   driving_hours: ${summary.activity?.driving_hours || 0}`);
    console.log(`   rotativo_on_percentage: ${summary.activity?.rotativo_on_percentage || 0}%`);
    
    console.log(`\n📊 STABILITY:`);
    console.log(`   total_incidents: ${summary.stability?.total_incidents || 0}`);
    console.log(`   critical: ${summary.stability?.critical || 0}`);
    console.log(`   high: ${summary.stability?.high || 0}`);
    console.log(`   moderate: ${summary.stability?.moderate || 0}`);
    console.log(`   light: ${summary.stability?.light || 0}`);
    
    console.log(`\n🔍 POR_TIPO (clave para verificar):`);
    if (summary.stability?.por_tipo) {
        console.log('   ✅ EXISTE');
        Object.entries(summary.stability.por_tipo).forEach(([tipo, count]) => {
            console.log(`      ${tipo}: ${count}`);
        });
    } else {
        console.log('   ❌ NO EXISTE');
    }
    
    console.log(`\n📊 QUALITY (índice SI):`);
    if (summary.quality) {
        console.log('   ✅ EXISTE');
        console.log(`      indice_promedio: ${summary.quality.indice_promedio}`);
        console.log(`      calificacion: ${summary.quality.calificacion}`);
        console.log(`      estrellas: ${summary.quality.estrellas}`);
    } else {
        console.log('   ❌ NO EXISTE');
    }
    
    console.log(`\n📊 METADATA:`);
    console.log(`   sesiones_analizadas: ${summary.metadata?.sesiones_analizadas || 0}`);
    console.log(`   cobertura_gps: ${summary.metadata?.cobertura_gps || 0}%`);
    
    // Verificación final
    console.log('\n' + '='.repeat(80));
    console.log('🎯 VERIFICACIÓN FINAL:\n');
    
    const checks = [
        { nombre: 'Total eventos ~1,853', ok: summary.stability?.total_incidents > 1000 && summary.stability?.total_incidents < 3000 },
        { nombre: 'Tiene por_tipo', ok: !!summary.stability?.por_tipo },
        { nombre: 'Tiene quality', ok: !!summary.quality },
        { nombre: 'DERIVA_PELIGROSA < 2000', ok: (summary.stability?.por_tipo?.DERIVA_PELIGROSA || 0) < 2000 },
        { nombre: 'VUELCO_INMINENTE < 100', ok: (summary.stability?.por_tipo?.VUELCO_INMINENTE || 0) < 100 }
    ];
    
    checks.forEach(check => {
        const simbolo = check.ok ? '✅' : '❌';
        console.log(`${simbolo} ${check.nombre}`);
    });
    
    const todoBien = checks.every(c => c.ok);
    
    console.log('\n' + '='.repeat(80));
    console.log(todoBien ? '✅ ENDPOINT FUNCIONANDO CORRECTAMENTE' : '⚠️ ENDPOINT TIENE PROBLEMAS');
    console.log('');
}

testKPIsDetallado().catch(console.error);

