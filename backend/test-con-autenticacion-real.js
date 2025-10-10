/**
 * TEST CON AUTENTICACIÓN REAL
 * Usando credenciales de iniciar.ps1
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function testConAuth() {
    console.log('\n🧪 TEST CON AUTENTICACIÓN REAL');
    console.log('='.repeat(80) + '\n');
    
    // Credenciales reales de la BD
    const credenciales = [
        { email: 'test@bomberosmadrid.es', password: 'test123', nombre: 'TEST' },
        { email: 'test@bomberosmadrid.es', password: 'admin123', nombre: 'TEST-ADMIN' },
        { email: 'antoniohermoso92@gmail.com', password: 'admin123', nombre: 'ANTONIO' },
        { email: 'antoniohermoso92@cosigein.com', password: 'admin123', nombre: 'ANTONIO2' }
    ];
    
    let token = null;
    let usuario = null;
    
    // Intentar login con cada credencial
    for (const cred of credenciales) {
        console.log(`🔐 Intentando login con ${cred.nombre}...`);
        
        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: cred.email,
                    password: cred.password
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                // Estructura puede ser: access_token, data.token, data.data.token, data.data.access_token
                const tokenValue = data.access_token || data.token || data.data?.token || data.data?.access_token;
                // Usuario puede no estar en la respuesta de login
                const userValue = data.user || data.data?.user || { email: cred.email, organizationId: ORG_ID };
                
                if (tokenValue) {
                    token = tokenValue;
                    usuario = userValue;
                    console.log(`✅ Login exitoso con ${cred.nombre}\n`);
                    break;
                } else {
                    console.log(`   ⚠️ Respuesta: ${JSON.stringify(data).substring(0, 200)}`);
                }
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Falló (${response.status}): ${errorText.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
    }
    
    if (!token || !usuario) {
        console.log('\n❌ No se pudo hacer login con ninguna credencial');
        console.log('💡 Verifica que el backend esté corriendo en puerto 9998\n');
        return;
    }
    
    console.log(`📍 Usuario: ${usuario.email}`);
    console.log(`📍 Organization: ${usuario.organizationId}\n`);
    
    // ========================================================================
    // TEST 1: KPIs Summary con autenticación
    // ========================================================================
    console.log('='.repeat(80));
    console.log('🎯 TEST 1: /api/kpis/summary (CON AUTENTICACIÓN)\n');
    
    try {
        const response = await fetch(`${BASE_URL}/api/kpis/summary?organizationId=${usuario.organizationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📡 Status: ${response.status}\n`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const stability = data.data.stability || {};
                const quality = data.data.quality;
                const activity = data.data.activity || {};
                const metadata = data.data.metadata || {};
                
                console.log('📊 RESULTADOS:\n');
                console.log(`   Sesiones: ${metadata.sesiones_analizadas || 0}`);
                console.log(`   KM: ${activity.km_total || 0}`);
                console.log(`   Total eventos: ${stability.total_incidents || 0}`);
                console.log(`   Críticos: ${stability.critical || 0}`);
                console.log(`   Altos: ${stability.high || 0}`);
                console.log(`   Moderados: ${stability.moderate || 0}`);
                console.log(`   Leves: ${stability.light || 0}`);
                
                console.log(`\n   ${stability.por_tipo ? '✅' : '❌'} Tiene por_tipo`);
                console.log(`   ${quality ? '✅' : '❌'} Tiene quality`);
                
                if (stability.por_tipo) {
                    console.log('\n   📊 DESGLOSE POR_TIPO:');
                    Object.entries(stability.por_tipo).forEach(([tipo, count]) => {
                        console.log(`      ${tipo}: ${count}`);
                    });
                } else {
                    console.log('\n   ❌ SIN DESGLOSE POR_TIPO');
                    console.log('   💡 Esto significa que kpiCalculator NO devuelve por_tipo');
                }
                
                if (quality) {
                    console.log('\n   📊 QUALITY:');
                    console.log(`      Promedio SI: ${(quality.indice_promedio * 100).toFixed(1)}%`);
                    console.log(`      Calificación: ${quality.calificacion}`);
                    console.log(`      Estrellas: ${quality.estrellas}`);
                } else {
                    console.log('\n   ❌ SIN QUALITY');
                    console.log('   💡 Esto significa que kpiCalculator NO devuelve quality');
                }
                
                // Mostrar toda la estructura
                console.log('\n   📋 ESTRUCTURA COMPLETA DE LA RESPUESTA:');
                console.log('   ' + JSON.stringify(Object.keys(data.data), null, 2));
                
            } else {
                console.log('❌ Respuesta sin success o data');
            }
        } else {
            const error = await response.text();
            console.log(`❌ ERROR: ${error.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`❌ EXCEPCIÓN: ${error.message}`);
    }
    
    // ========================================================================
    // TEST 2: Verificar archivo que se está ejecutando
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VERIFICACIÓN: ¿Qué archivo se está ejecutando?\n');
    
    try {
        const { kpiCalculator } = require('./dist/src/services/kpiCalculator');
        
        console.log('✅ Importado desde dist/\n');
        console.log('⏳ Ejecutando directamente kpiCalculator...\n');
        
        const summaryDirecto = await kpiCalculator.calcularKPIsCompletos({
            organizationId: usuario.organizationId
        });
        
        console.log('📊 RESULTADO DIRECTO (dist/):\n');
        console.log(`   Total eventos: ${summaryDirecto.stability?.total_incidents || 0}`);
        console.log(`   Tiene por_tipo: ${summaryDirecto.stability?.por_tipo ? 'SÍ' : 'NO'}`);
        console.log(`   Tiene quality: ${summaryDirecto.quality ? 'SÍ' : 'NO'}`);
        
        if (summaryDirecto.stability?.por_tipo) {
            console.log('\n   Tipos de eventos:');
            Object.entries(summaryDirecto.stability.por_tipo).slice(0, 3).forEach(([tipo, count]) => {
                console.log(`      ${tipo}: ${count}`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Error importando desde dist/: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 CONCLUSIÓN:');
    console.log('   Si HTTP devuelve 736 pero dist/ devuelve 1,853:');
    console.log('   → Backend HTTP usa src/ (ts-node-dev)');
    console.log('   → src/ tiene código viejo o caché de ts-node-dev\n');
}

testConAuth();

