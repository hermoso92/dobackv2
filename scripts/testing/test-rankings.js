// Script para probar los endpoints de ranking
const http = require('http');

const testEndpoint = (path, description) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`\n✅ ${description}`);
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Data:`, JSON.stringify(json, null, 2));
                    resolve({ success: true, data: json });
                } catch (e) {
                    console.log(`\n❌ ${description}`);
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Error parsing JSON:`, data);
                    resolve({ success: false, error: data });
                }
            });
        });

        req.on('error', (err) => {
            console.log(`\n❌ ${description}`);
            console.log(`Connection error:`, err.message);
            resolve({ success: false, error: err.message });
        });

        req.setTimeout(5000, () => {
            console.log(`\n❌ ${description}`);
            console.log(`Timeout`);
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });

        req.end();
    });
};

async function testRankings() {
    console.log('🧪 Probando endpoints de ranking...\n');

    // Probar endpoints de ranking
    await testEndpoint('/api/hotspots/ranking?organizationId=default-org&limit=3', 'Puntos Negros - Ranking');
    await testEndpoint('/api/speed/critical-zones?organizationId=default-org&limit=3', 'Velocidad - Zonas Críticas');
    await testEndpoint('/api/sessions/ranking?organizationId=default-org&limit=3', 'Sesiones - Ranking');
    
    console.log('\n🏁 Pruebas completadas');
}

testRankings().catch(console.error);





