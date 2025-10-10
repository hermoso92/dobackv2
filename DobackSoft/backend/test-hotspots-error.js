/**
 * TEST: Ver error exacto en hotspots
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';

async function test() {
    console.log('\n🧪 TEST: Error en /api/hotspots/critical-points\n');
    
    // Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@bomberosmadrid.es',
            password: 'admin123'
        })
    });
    
    const { access_token } = await loginRes.json();
    console.log('✅ Token obtenido\n');
    
    console.log('📍 Llamando a /api/hotspots/critical-points...\n');
    
    try {
        const res = await fetch(
            `${BASE_URL}/api/hotspots/critical-points?organizationId=a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26&severity=all&minFrequency=1&rotativoOn=all&clusterRadius=20&startDate=2025-10-03&endDate=2025-10-10`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        );
        
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ Status: ${res.status}`);
            console.log(`✅ Clusters: ${data.data?.clusters?.length || 0}`);
            console.log(`✅ Total eventos: ${data.data?.total_events || 0}\n`);
        } else {
            const errorText = await res.text();
            console.log(`❌ Status: ${res.status}`);
            console.log(`❌ Error completo:\n${errorText}\n`);
        }
    } catch (error) {
        console.log(`❌ Excepción: ${error.message}\n`);
    }
}

test();

