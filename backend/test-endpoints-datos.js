/**
 * TEST DIRECTO DE ENDPOINTS CON DATOS
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function testEndpoints() {
    console.log('\n🔍 TEST DE ENDPOINTS CON DATOS\n');
    
    try {
        // Login
        console.log('🔐 Obteniendo token...');
        const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
            email: 'antoniohermoso92@gmail.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.access_token;
        console.log(`   ✅ Token obtenido\n`);
        
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // TEST 1: PUNTOS NEGROS
        console.log('='.repeat(80));
        console.log('🗺️  TEST 1: PUNTOS NEGROS (Hotspots)');
        console.log('='.repeat(80) + '\n');
        
        const hotspotsUrl = `${BACKEND_URL}/api/hotspots/critical-points?organizationId=${ORG_ID}&severity=all&minFrequency=1&clusterRadius=20&rotativoOn=all`;
        console.log(`URL: ${hotspotsUrl}\n`);
        
        const hotspotsRes = await axios.get(hotspotsUrl, { headers });
        console.log(`   Status: ${hotspotsRes.status}`);
        console.log(`   Success: ${hotspotsRes.data.success}`);
        console.log(`   Total eventos: ${hotspotsRes.data.data?.total_events || 0}`);
        console.log(`   Total clusters: ${hotspotsRes.data.data?.totalClusters || 0}`);
        
        if (hotspotsRes.data.data?.clusters && hotspotsRes.data.data.clusters.length > 0) {
            console.log(`\n   ✅ CLUSTERS ENCONTRADOS: ${hotspotsRes.data.data.clusters.length}`);
            console.log('\n   Primeros 3:');
            hotspotsRes.data.data.clusters.slice(0, 3).forEach((c, i) => {
                console.log(`      ${i+1}. (${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}) - Frecuencia: ${c.frequency}`);
                console.log(`         Graves: ${c.severity_counts.grave}, Moderadas: ${c.severity_counts.moderada}, Leves: ${c.severity_counts.leve}`);
            });
        } else {
            console.log('\n   ⚠️  0 CLUSTERS DEVUELTOS');
            console.log(`   Eventos totales: ${hotspotsRes.data.data?.total_events || 0}`);
        }
        
        // TEST 2: VELOCIDAD
        console.log('\n' + '='.repeat(80));
        console.log('🚗 TEST 2: ANÁLISIS DE VELOCIDAD');
        console.log('='.repeat(80) + '\n');
        
        const speedUrl = `${BACKEND_URL}/api/speed/violations?organizationId=${ORG_ID}&rotativoOn=all&inPark=all&violationType=all&minSpeed=0`;
        console.log(`URL: ${speedUrl}\n`);
        
        const speedRes = await axios.get(speedUrl, { headers });
        console.log(`   Status: ${speedRes.status}`);
        console.log(`   Success: ${speedRes.data.success}`);
        console.log(`   Total puntos analizados: ${speedRes.data.data?.total || 0}`);
        console.log(`   Graves: ${speedRes.data.data?.grave || 0}`);
        console.log(`   Leves: ${speedRes.data.data?.leve || 0}`);
        console.log(`   Correctos: ${speedRes.data.data?.correcto || 0}`);
        
        if (speedRes.data.data?.violations && speedRes.data.data.violations.length > 0) {
            console.log(`\n   ✅ VIOLACIONES ENCONTRADAS: ${speedRes.data.data.violations.length}`);
            console.log('\n   Primeras 3:');
            speedRes.data.data.violations.slice(0, 3).forEach((v, i) => {
                console.log(`      ${i+1}. ${v.speed} km/h (límite: ${v.speedLimit}) - Exceso: ${v.excess} km/h`);
            });
        } else {
            console.log('\n   ⚠️  0 VIOLACIONES DEVUELTAS');
        }
        
        // TEST 3: CLAVES OPERACIONALES  
        console.log('\n' + '='.repeat(80));
        console.log('🔑 TEST 3: CLAVES OPERACIONALES');
        console.log('='.repeat(80) + '\n');
        
        const clavesUrl = `${BACKEND_URL}/api/operational-keys/summary?from=2025-10-01&to=2025-10-11`;
        console.log(`URL: ${clavesUrl}\n`);
        
        const clavesRes = await axios.get(clavesUrl, { headers });
        console.log(`   Status: ${clavesRes.status}`);
        console.log(`   Total claves: ${clavesRes.data.totalClaves || 0}`);
        console.log(`   Duración total: ${clavesRes.data.duracionTotalMinutos || 0} minutos`);
        
        if (clavesRes.data.porTipo && clavesRes.data.porTipo.length > 0) {
            console.log('\n   ✅ CLAVES POR TIPO:');
            clavesRes.data.porTipo.forEach(t => {
                console.log(`      Clave ${t.tipo}: ${t.cantidad} (${t.duracionTotalMinutos} min)`);
            });
        } else {
            console.log('\n   ⚠️  0 CLAVES DEVUELTAS');
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESUMEN');
        console.log('='.repeat(80) + '\n');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testEndpoints().catch(console.error);

