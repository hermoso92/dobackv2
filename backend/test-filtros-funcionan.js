/**
 * TEST: Verificar que los filtros aplican correctamente
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function testFiltros() {
    console.log('\n🧪 TEST: VERIFICACIÓN DE FILTROS');
    console.log('='.repeat(80) + '\n');
    
    // Login
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
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // Obtener vehículos
    const vehicles = await prisma.vehicle.findMany({
        where: { organizationId: ORG_ID },
        select: { id: true, name: true, identifier: true }
    });
    
    console.log(`📊 Vehículos en BD: ${vehicles.length}\n`);
    vehicles.forEach(v => {
        console.log(`   - ${v.name} (${v.identifier}): ${v.id.substring(0, 8)}`);
    });
    
    const vehicleIds = vehicles.map(v => v.id);
    
    // ========================================================================
    // TEST 1: SIN FILTROS (todos los datos)
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('🎯 TEST 1: SIN FILTROS (todos los vehículos)\n');
    
    try {
        const res = await fetch(
            `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`,
            { headers }
        );
        const data = await res.json();
        
        const stability = data.data?.stability || {};
        const activity = data.data?.activity || {};
        
        console.log(`   Total eventos: ${stability.total_incidents || 0}`);
        console.log(`   KM total: ${activity.km_total?.toFixed(2) || 0}`);
        console.log(`   Sesiones: ${data.data?.metadata?.sesiones_analizadas || 0}\n`);
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // ========================================================================
    // TEST 2: FILTRO POR VEHÍCULO 1
    // ========================================================================
    console.log('='.repeat(80));
    console.log(`🎯 TEST 2: FILTRO solo vehículo ${vehicles[0]?.name}\n`);
    
    if (vehicles[0]) {
        try {
            const res = await fetch(
                `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds[]=${vehicles[0].id}`,
                { headers }
            );
            const data = await res.json();
            
            const stability = data.data?.stability || {};
            const activity = data.data?.activity || {};
            
            console.log(`   Total eventos: ${stability.total_incidents || 0}`);
            console.log(`   KM total: ${activity.km_total?.toFixed(2) || 0}`);
            console.log(`   Sesiones: ${data.data?.metadata?.sesiones_analizadas || 0}\n`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
    
    // ========================================================================
    // TEST 3: FILTRO POR 2 VEHÍCULOS
    // ========================================================================
    console.log('='.repeat(80));
    console.log(`🎯 TEST 3: FILTRO 2 vehículos (${vehicles[0]?.name} + ${vehicles[1]?.name})\n`);
    
    if (vehicles.length >= 2) {
        try {
            const res = await fetch(
                `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds[]=${vehicles[0].id}&vehicleIds[]=${vehicles[1].id}`,
                { headers }
            );
            const data = await res.json();
            
            const stability = data.data?.stability || {};
            const activity = data.data?.activity || {};
            
            console.log(`   Total eventos: ${stability.total_incidents || 0}`);
            console.log(`   KM total: ${activity.km_total?.toFixed(2) || 0}`);
            console.log(`   Sesiones: ${data.data?.metadata?.sesiones_analizadas || 0}\n`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}\n`);
        }
    }
    
    // ========================================================================
    // TEST 4: FILTRO POR FECHAS
    // ========================================================================
    console.log('='.repeat(80));
    console.log('🎯 TEST 4: FILTRO por fechas (últimos 7 días)\n');
    
    try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const res = await fetch(
            `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&from=${startDate}&to=${endDate}`,
            { headers }
        );
        const data = await res.json();
        
        const stability = data.data?.stability || {};
        const activity = data.data?.activity || {};
        
        console.log(`   Rango: ${startDate} a ${endDate}`);
        console.log(`   Total eventos: ${stability.total_incidents || 0}`);
        console.log(`   KM total: ${activity.km_total?.toFixed(2) || 0}`);
        console.log(`   Sesiones: ${data.data?.metadata?.sesiones_analizadas || 0}\n`);
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }
    
    // ========================================================================
    // CONCLUSIÓN
    // ========================================================================
    console.log('='.repeat(80));
    console.log('\n✅ VERIFICACIÓN COMPLETA\n');
    console.log('💡 Si los valores cambian entre tests, los filtros están funcionando.');
    console.log('💡 Valores esperados:');
    console.log('   - TEST 1 (sin filtros): Mayor número de eventos/km/sesiones');
    console.log('   - TEST 2 (1 vehículo): ~1/3 de TEST 1');
    console.log('   - TEST 3 (2 vehículos): ~2/3 de TEST 1');
    console.log('   - TEST 4 (fechas): Similar a TEST 1 si todas las sesiones son recientes\n');
    
    await prisma.$disconnect();
}

testFiltros();

