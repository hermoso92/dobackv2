/**
 * Test REAL del endpoint de puntos negros
 */

const fetch = require('node-fetch');

async function testHotspotsEndpoint() {
    console.log('\n🧪 TEST ENDPOINT /api/hotspots/critical-points\n');
    
    const BASE_URL = 'http://localhost:9998';
    const organizationId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
    
    try {
        // Test 1: Critical points
        console.log('📍 TEST 1: /api/hotspots/critical-points\n');
        
        const url = `${BASE_URL}/api/hotspots/critical-points?organizationId=${organizationId}&severity=all&minFrequency=1&clusterRadius=20`;
        
        console.log(`URL: ${url}\n`);
        console.log('⏳ Llamando endpoint...\n');
        
        const response = await fetch(url);
        
        console.log(`📡 Status: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            const error = await response.text();
            console.log('❌ ERROR:', error);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ RESPUESTA EXITOSA:\n');
            console.log(`   Total eventos: ${data.data.totalEvents}`);
            console.log(`   Total clusters: ${data.data.totalClusters}`);
            console.log(`   Eventos por tipo:`);
            
            if (data.data.eventosDetectados) {
                console.log(`      Total: ${data.data.eventosDetectados.total}`);
                console.log('      Por tipo:');
                Object.entries(data.data.eventosDetectados.por_tipo).forEach(([tipo, count]) => {
                    console.log(`         ${tipo}: ${count}`);
                });
                console.log('      Por severidad:');
                Object.entries(data.data.eventosDetectados.por_severidad).forEach(([sev, count]) => {
                    console.log(`         ${sev}: ${count}`);
                });
            }
            
            console.log(`\n   Clusters generados: ${data.data.clusters.length}`);
            
            if (data.data.clusters.length > 0) {
                console.log('\n   📍 TOP 5 CLUSTERS:\n');
                data.data.clusters.slice(0, 5).forEach((cluster, i) => {
                    console.log(`      ${i + 1}. ${cluster.location || `${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}`}`);
                    console.log(`         Frecuencia: ${cluster.frequency}`);
                    console.log(`         Severidad: ${cluster.dominantSeverity}`);
                    console.log('');
                });
            }
            
            console.log('\n✅ ENDPOINT FUNCIONANDO CORRECTAMENTE');
            
        } else {
            console.log('❌ RESPUESTA NO EXITOSA:', data);
        }
        
        // Test 2: Ranking
        console.log('\n' + '='.repeat(80));
        console.log('📍 TEST 2: /api/hotspots/ranking\n');
        
        const urlRanking = `${BASE_URL}/api/hotspots/ranking?organizationId=${organizationId}&limit=5`;
        
        const responseRanking = await fetch(urlRanking);
        console.log(`📡 Status: ${responseRanking.status} ${responseRanking.statusText}\n`);
        
        if (responseRanking.ok) {
            const dataRanking = await responseRanking.json();
            
            if (dataRanking.success && dataRanking.data.ranking) {
                console.log(`✅ RANKING GENERADO: ${dataRanking.data.ranking.length} zonas\n`);
                
                dataRanking.data.ranking.forEach((zone) => {
                    console.log(`   ${zone.rank}. ${zone.location}`);
                    console.log(`      Total eventos: ${zone.totalEvents}`);
                    console.log(`      Graves: ${zone.grave}, Moderadas: ${zone.moderada}, Leves: ${zone.leve}`);
                    console.log('');
                });
                
                console.log('✅ ENDPOINT RANKING FUNCIONANDO');
            }
        }
        
    } catch (error) {
        console.log('❌ ERROR:', error.message);
    }
}

testHotspotsEndpoint();

