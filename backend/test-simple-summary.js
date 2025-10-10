/**
 * TEST SIMPLE: Solo verifica estructura de respuesta
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function test() {
    console.log('\n🧪 TEST SIMPLE - ESTRUCTURA DE RESPUESTA\n');
    
    // Login
    console.log('🔐 Login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@bomberosmadrid.es',
            password: 'admin123'
        })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log(`✅ Token obtenido\n`);
    
    // KPIs summary con timeout largo
    console.log('📊 Obteniendo /api/kpis/summary (esto puede tardar 1-2 minutos)...\n');
    
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout
        
        const response = await fetch(
            `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            }
        );
        
        clearTimeout(timeout);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.data) {
                const stability = data.data.stability || {};
                const quality = data.data.quality;
                
                console.log('='.repeat(80));
                console.log('✅ RESPUESTA RECIBIDA\n');
                console.log(`   Total eventos: ${stability.total_incidents || 0}`);
                console.log(`   Tiene por_tipo: ${stability.por_tipo ? 'SÍ' : 'NO'}`);
                console.log(`   Tiene quality: ${quality ? 'SÍ' : 'NO'}`);
                
                if (stability.por_tipo) {
                    console.log('\n   📊 POR_TIPO:');
                    Object.entries(stability.por_tipo).forEach(([tipo, count]) => {
                        console.log(`      ${tipo}: ${count}`);
                    });
                }
                
                if (quality) {
                    console.log('\n   📊 QUALITY:');
                    console.log(`      Promedio SI: ${(quality.indice_promedio * 100).toFixed(1)}%`);
                    console.log(`      Calificación: ${quality.calificacion}`);
                }
                
                console.log('\n' + '='.repeat(80));
                
                if (stability.total_incidents >= 1000 && stability.por_tipo && quality) {
                    console.log('\n✅ TODO CORRECTO - Backend usando código nuevo\n');
                    console.log(`📊 Estadísticas:`);
                    console.log(`   - Total eventos: ${stability.total_incidents}`);
                    console.log(`   - Tipos diferentes: ${Object.keys(stability.por_tipo).length}`);
                    console.log(`   - Índice SI: ${(quality.indice_promedio * 100).toFixed(1)}%`);
                    console.log(`   - Calificación: ${quality.calificacion}\n`);
                } else {
                    console.log('\n⚠️ DATOS INCOMPLETOS - Revisar implementación\n');
                    console.log(`   Total eventos: ${stability.total_incidents} (esperado: >1,000)`);
                    console.log(`   Tiene por_tipo: ${stability.por_tipo ? 'SÍ' : 'NO'}`);
                    console.log(`   Tiene quality: ${quality ? 'SÍ' : 'NO'}\n`);
                }
            }
        } else {
            console.log(`❌ Error HTTP ${response.status}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('\n❌ TIMEOUT después de 3 minutos');
            console.log('💡 El endpoint tarda demasiado, necesita optimización\n');
        } else {
            console.log(`\n❌ Error: ${error.message}\n`);
        }
    }
}

test();

