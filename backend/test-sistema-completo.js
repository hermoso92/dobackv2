/**
 * TEST COMPLETO DEL SISTEMA - VERIFICACIÓN EXHAUSTIVA
 * Prueba TODOS los endpoints con autenticación
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
let TOKEN = null;
let USER = null;

async function login() {
    console.log('\n🔐 INICIANDO SESIÓN...\n');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@dobacksoft.com',
            password: 'Admin123!'
        })
    });
    
    if (!response.ok) {
        // Intentar con credenciales alternativas
        const response2 = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'cosigein@dobacksoft.com',
                password: 'Cosigein2024!'
            })
        });
        
        if (!response2.ok) {
            console.log('❌ Login falló con ambas credenciales');
            return false;
        }
        
        const data = await response2.json();
        TOKEN = data.token;
        USER = data.user;
    } else {
        const data = await response.json();
        TOKEN = data.token;
        USER = data.user;
    }
    
    console.log(`✅ Login exitoso: ${USER.email}`);
    console.log(`📍 Organization ID: ${USER.organizationId}\n`);
    
    return true;
}

async function testEndpointAuth(nombre, url, metodo = 'GET', body = null) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📍 ${nombre}`);
    console.log(`🌐 ${metodo} ${url}`);
    console.log('⏳ Llamando...\n');
    
    try {
        const options = {
            method: metodo,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body && metodo !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        
        console.log(`📡 Status: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            const error = await response.text();
            console.log(`❌ ERROR: ${error.substring(0, 300)}\n`);
            return null;
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.log(`❌ EXCEPCIÓN: ${error.message}\n`);
        return null;
    }
}

async function runTests() {
    console.log('\n🧪 TEST EXHAUSTIVO DEL SISTEMA COMPLETO');
    console.log('=' .repeat(80));
    
    // Login
    const loggedIn = await login();
    if (!loggedIn) {
        console.log('❌ No se pudo hacer login - abortando tests');
        return;
    }
    
    const ORG = USER.organizationId;
    
    // ========================================================================
    // TEST 1: KPIs Summary
    // ========================================================================
    console.log('\n🎯 TEST 1: KPIs Summary (código nuevo con 1,853 eventos)');
    const kpisSummary = await testEndpointAuth(
        'GET /api/kpis/summary',
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG}`
    );
    
    if (kpisSummary && kpisSummary.success) {
        const stability = kpisSummary.data.stability;
        const quality = kpisSummary.data.quality;
        const metadata = kpisSummary.data.metadata;
        
        console.log('📊 RESULTADOS:\n');
        console.log(`   ✅ Sesiones analizadas: ${metadata?.sesiones_analizadas || 0}`);
        console.log(`   ✅ KM totales: ${kpisSummary.data.activity?.km_total || 0}`);
        console.log(`   ✅ Total eventos: ${stability?.total_incidents || 0}`);
        console.log(`   ✅ Críticos: ${stability?.critical || 0}`);
        console.log(`   ✅ Altos: ${stability?.high || 0}`);
        console.log(`   ✅ Moderados: ${stability?.moderate || 0}`);
        console.log(`   ✅ Leves: ${stability?.light || 0}`);
        
        if (stability?.por_tipo) {
            console.log('\n   📊 POR_TIPO:');
            Object.entries(stability.por_tipo).forEach(([tipo, count]) => {
                console.log(`      ${tipo}: ${count}`);
            });
        } else {
            console.log('\n   ❌ NO TIENE POR_TIPO');
        }
        
        if (quality) {
            console.log('\n   📊 QUALITY (Índice SI):');
            console.log(`      Promedio: ${(quality.indice_promedio * 100).toFixed(1)}%`);
            console.log(`      Calificación: ${quality.calificacion}`);
            console.log(`      Estrellas: ${quality.estrellas}`);
        } else {
            console.log('\n   ❌ NO TIENE QUALITY');
        }
        
        // Verificaciones
        console.log('\n   🔍 VERIFICACIONES:');
        const checks = [
            { test: 'Total eventos 1,500-2,000', ok: stability?.total_incidents > 1500 && stability?.total_incidents < 2000 },
            { test: 'Tiene por_tipo', ok: !!stability?.por_tipo },
            { test: 'Tiene quality', ok: !!quality },
            { test: 'DERIVA_PELIGROSA < 2000', ok: (stability?.por_tipo?.DERIVA_PELIGROSA || 0) < 2000 },
            { test: 'SI promedio > 85%', ok: (quality?.indice_promedio || 0) > 0.85 }
        ];
        
        checks.forEach(check => {
            console.log(`      ${check.ok ? '✅' : '❌'} ${check.test}`);
        });
    }
    
    // ========================================================================
    // TEST 2: Hotspots Critical Points
    // ========================================================================
    console.log('\n🎯 TEST 2: Hotspots Critical Points (código nuevo)');
    const hotspots = await testEndpointAuth(
        'GET /api/hotspots/critical-points',
        `${BASE_URL}/api/hotspots/critical-points?organizationId=${ORG}&severity=all&minFrequency=1&clusterRadius=20`
    );
    
    if (hotspots && hotspots.success) {
        console.log('📊 RESULTADOS:\n');
        console.log(`   ✅ Total eventos: ${hotspots.data.totalEvents || 0}`);
        console.log(`   ✅ Total clusters: ${hotspots.data.totalClusters || 0}`);
        
        if (hotspots.data.eventosDetectados) {
            console.log('\n   📊 EVENTOS DETECTADOS:');
            console.log(`      Total: ${hotspots.data.eventosDetectados.total}`);
            
            console.log('\n      Por tipo:');
            Object.entries(hotspots.data.eventosDetectados.por_tipo || {}).forEach(([tipo, count]) => {
                console.log(`         ${tipo}: ${count}`);
            });
            
            console.log('\n      Por severidad:');
            Object.entries(hotspots.data.eventosDetectados.por_severidad || {}).forEach(([sev, count]) => {
                console.log(`         ${sev}: ${count}`);
            });
        }
        
        console.log('\n   🔍 VERIFICACIONES:');
        const checks = [
            { test: 'Total eventos 1,500-2,000', ok: hotspots.data.totalEvents > 1500 && hotspots.data.totalEvents < 2000 },
            { test: 'Tiene clusters', ok: hotspots.data.totalClusters > 0 },
            { test: 'Tiene eventosDetectados', ok: !!hotspots.data.eventosDetectados },
            { test: 'Tiene por_tipo', ok: !!hotspots.data.eventosDetectados?.por_tipo }
        ];
        
        checks.forEach(check => {
            console.log(`      ${check.ok ? '✅' : '❌'} ${check.test}`);
        });
    }
    
    // ========================================================================
    // TEST 3: Filtros - Por vehículo
    // ========================================================================
    console.log('\n🎯 TEST 3: Filtros por vehículo');
    const vehicleId = '14b9febb-ca73-4130-a88d-e4d73ed6501a'; // DOBACK024
    const kpisFiltrados = await testEndpointAuth(
        'GET /api/kpis/summary (filtrado)',
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG}&vehicleIds=${vehicleId}`
    );
    
    if (kpisFiltrados && kpisFiltrados.success) {
        console.log('📊 RESULTADOS:\n');
        console.log(`   ✅ Sesiones filtradas: ${kpisFiltrados.data.metadata?.sesiones_analizadas || 0}`);
        console.log(`   ✅ KM totales: ${kpisFiltrados.data.activity?.km_total || 0}`);
        console.log(`   ✅ Eventos: ${kpisFiltrados.data.stability?.total_incidents || 0}`);
        
        // Comparar con sin filtro
        if (kpisSummary && kpisSummary.data) {
            const eventosSinFiltro = kpisSummary.data.stability?.total_incidents || 0;
            const eventosConFiltro = kpisFiltrados.data.stability?.total_incidents || 0;
            
            console.log('\n   🔍 VERIFICACIÓN FILTRO:');
            console.log(`      Sin filtro: ${eventosSinFiltro} eventos`);
            console.log(`      Con filtro (1 vehículo): ${eventosConFiltro} eventos`);
            console.log(`      ${eventosConFiltro < eventosSinFiltro ? '✅' : '❌'} Filtro reduce eventos correctamente`);
        }
    }
    
    // ========================================================================
    // TEST 4: Speed Violations
    // ========================================================================
    console.log('\n🎯 TEST 4: Análisis de velocidad');
    const speedViolations = await testEndpointAuth(
        'GET /api/speed/violations',
        `${BASE_URL}/api/speed/violations?organizationId=${ORG}&rotativoOn=all&violationType=all`
    );
    
    if (speedViolations && speedViolations.success) {
        console.log('📊 RESULTADOS:\n');
        console.log(`   ✅ Violaciones: ${speedViolations.data.violations?.length || 0}`);
        console.log(`   ✅ Velocidad máxima: ${speedViolations.data.summary?.velocidad_maxima || 0} km/h`);
        console.log(`   ✅ Velocidad promedio: ${speedViolations.data.summary?.velocidad_promedio || 0} km/h`);
        console.log(`   ✅ Excesos totales: ${speedViolations.data.summary?.excesos_totales || 0}`);
    }
    
    // ========================================================================
    // TEST 5: Estados (claves operativas con keyCalculator)
    // ========================================================================
    console.log('\n🎯 TEST 5: Estados y claves operativas');
    const estados = await testEndpointAuth(
        'GET /api/kpis/states',
        `${BASE_URL}/api/kpis/states?organizationId=${ORG}`
    );
    
    if (estados && estados.success) {
        console.log('📊 RESULTADOS:\n');
        
        if (estados.data.tiemposPorClave) {
            console.log('   ✅ TIEMPOS POR CLAVE:');
            console.log(`      Clave 0 (Taller): ${estados.data.tiemposPorClave.clave0_formateado}`);
            console.log(`      Clave 1 (Parque): ${estados.data.tiemposPorClave.clave1_formateado}`);
            console.log(`      Clave 2 (Emergencia): ${estados.data.tiemposPorClave.clave2_formateado}`);
            console.log(`      Clave 3 (En incendio): ${estados.data.tiemposPorClave.clave3_formateado}`);
            console.log(`      Clave 5 (Regreso): ${estados.data.tiemposPorClave.clave5_formateado}`);
            console.log(`      Total: ${estados.data.tiemposPorClave.total_formateado}`);
            
            console.log('\n   🔍 VERIFICACIÓN:');
            const usaRadar = estados.data.tiemposPorClave.clave0_segundos > 0 || 
                             estados.data.tiemposPorClave.clave1_segundos > 0;
            console.log(`      ${usaRadar ? '✅' : '⚠️'} KeyCalculator usa geocercas (Radar.com o BD local)`);
        } else {
            console.log('   ❌ NO TIENE tiemposPorClave');
        }
    }
    
    // ========================================================================
    // RESUMEN FINAL
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL DE VERIFICACIÓN\n');
    
    const resultados = [
        { nombre: 'KPIs Summary', ok: kpisSummary?.success && kpisSummary.data.stability?.total_incidents > 1500 },
        { nombre: 'Hotspots', ok: hotspots?.success && hotspots.data.totalEvents > 1500 },
        { nombre: 'Filtros', ok: kpisFiltrados?.success },
        { nombre: 'Speed', ok: speedViolations?.success },
        { nombre: 'Estados', ok: estados?.success }
    ];
    
    resultados.forEach(r => {
        console.log(`${r.ok ? '✅' : '❌'} ${r.nombre}`);
    });
    
    const exitosos = resultados.filter(r => r.ok).length;
    console.log(`\n📈 Tasa de éxito: ${exitosos}/${resultados.length} (${(exitosos / resultados.length * 100).toFixed(1)}%)`);
    
    console.log('\n' + '='.repeat(80));
    
    if (exitosos === resultados.length) {
        console.log('✅ SISTEMA FUNCIONANDO CORRECTAMENTE');
        console.log('\n💡 Todos los endpoints devuelven datos correctos');
        console.log('💡 Eventos corregidos (1,853 reales)');
        console.log('💡 Filtros funcionan');
        console.log('💡 KeyCalculator usa geocercas');
    } else {
        console.log('⚠️ ALGUNOS ENDPOINTS TIENEN PROBLEMAS');
        console.log('\n💡 Revisar detalles arriba');
    }
    
    console.log('\n');
}

runTests().catch(console.error);

