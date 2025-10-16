/**
 * TEST DETALLADO DE /api/hotspots/critical-points
 * Verificar estructura exacta de la respuesta
 */

const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function testHotspots() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 TEST DETALLADO DE /api/hotspots/critical-points');
    console.log('='.repeat(80) + '\n');

    try {
        const orgId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';
        const path = `/api/hotspots/critical-points?organizationId=${orgId}&severity=all`;

        console.log(`📍 Llamando a: ${path}\n`);

        const result = await makeRequest(path);

        console.log(`✅ Status: ${result.statusCode}\n`);

        if (result.data.success) {
            const { clusters, totalEvents, totalClusters, eventosDetectados } = result.data.data;

            console.log(`📊 RESPUESTA:\n`);
            console.log(`   Total clusters: ${totalClusters}`);
            console.log(`   Total eventos: ${totalEvents}`);

            if (eventosDetectados) {
                console.log(`\n   📊 eventosDetectados:`);
                console.log(`      total: ${eventosDetectados.total}`);
                console.log(`      por_tipo:`, JSON.stringify(eventosDetectados.por_tipo, null, 2));
                console.log(`      por_severidad:`, JSON.stringify(eventosDetectados.por_severidad, null, 2));
            }

            console.log(`\n   🗺️  CLUSTERS (${clusters.length}):\n`);
            
            if (clusters.length === 0) {
                console.log(`   ❌ NO HAY CLUSTERS - El mapa estará vacío\n`);
                console.log(`   Causas posibles:`);
                console.log(`      1. eventDetector no devuelve eventos con lat/lng`);
                console.log(`      2. Clustering filtra todos los eventos`);
                console.log(`      3. No hay eventos en las sesiones`);
            } else {
                clusters.slice(0, 3).forEach((cluster, i) => {
                    console.log(`   Cluster #${i + 1}:`);
                    console.log(`      id: ${cluster.id}`);
                    console.log(`      lat: ${cluster.lat}`);
                    console.log(`      lng: ${cluster.lng}`);
                    console.log(`      location: ${cluster.location}`);
                    console.log(`      frequency: ${cluster.frequency}`);
                    console.log(`      dominantSeverity: ${cluster.dominantSeverity}`);
                    console.log(`      severity_counts:`, cluster.severity_counts);
                    console.log(`      events: ${cluster.events?.length || 0} eventos`);
                    
                    if (cluster.events && cluster.events.length > 0) {
                        console.log(`      Ejemplo evento:`, {
                            lat: cluster.events[0].lat,
                            lng: cluster.events[0].lng,
                            eventType: cluster.events[0].eventType,
                            severity: cluster.events[0].severity,
                            si: cluster.events[0].si
                        });
                    }
                    console.log('');
                });
            }

            // Verificar si los clusters tienen lat/lng válidos
            const clustersConCoordenadas = clusters.filter(c => c.lat && c.lng);
            console.log(`   ✅ Clusters con lat/lng: ${clustersConCoordenadas.length} de ${clusters.length}`);
            
            if (clustersConCoordenadas.length === 0) {
                console.log(`   ❌ NINGÚN CLUSTER TIENE LAT/LNG - Por eso el mapa está vacío`);
            }

        } else {
            console.log(`   ❌ Error en respuesta:`, result.data);
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETADO');
    console.log('='.repeat(80) + '\n');
}

testHotspots();

