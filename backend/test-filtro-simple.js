const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function test() {
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
    
    console.log('\n🧪 TEST DE FILTROS SIMPLE\n');
    
    // Test sin filtro
    console.log('1️⃣ SIN FILTRO:');
    const r1 = await fetch(`${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    const d1 = await r1.json();
    console.log(`   Sesiones: ${d1.data?.metadata?.sesiones_analizadas || 0}`);
    console.log(`   Eventos: ${d1.data?.stability?.total_incidents || 0}\n`);
    
    // Test con 1 vehículo
    console.log('2️⃣ CON 1 VEHÍCULO:');
    const r2 = await fetch(
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds[]=7b5627df-ae7f-41e4-aea3-078663c7115f`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
    );
    const d2 = await r2.json();
    console.log(`   Sesiones: ${d2.data?.metadata?.sesiones_analizadas || 0}`);
    console.log(`   Eventos: ${d2.data?.stability?.total_incidents || 0}\n`);
    
    // Comparar
    if (d1.data?.metadata?.sesiones_analizadas === d2.data?.metadata?.sesiones_analizadas) {
        console.log('❌ FILTRO NO FUNCIONA - Mismas sesiones en ambos tests\n');
    } else {
        console.log('✅ FILTRO FUNCIONA - Sesiones diferentes\n');
    }
}

test();

