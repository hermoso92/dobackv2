/**
 * TEST: Verificar que el backend REALMENTE filtra por vehicleIds
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:9998';
const ORG_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

async function test() {
    console.log('\n🔍 VERIFICACIÓN: ¿El backend filtra por vehicleIds?\n');
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
        select: { id: true, name: true }
    });
    
    console.log(`📊 Vehículos disponibles:\n`);
    vehicles.forEach((v, idx) => {
        console.log(`   ${idx + 1}. ${v.name}: ${v.id}`);
    });
    console.log('');
    
    // ========================================================================
    // TEST 1: TODOS los vehículos (sin filtro)
    // ========================================================================
    console.log('='.repeat(80));
    console.log('🎯 TEST 1: SIN FILTRO de vehículos\n');
    
    const res1 = await fetch(
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}`,
        { headers }
    );
    const data1 = await res1.json();
    
    console.log(`   ✅ Total eventos: ${data1.data?.stability?.total_incidents || 0}`);
    console.log(`   ✅ Total sesiones: ${data1.data?.metadata?.sesiones_analizadas || 0}`);
    console.log(`   ✅ KM total: ${data1.data?.activity?.km_total?.toFixed(2) || 0}\n`);
    
    const totalEventosSinFiltro = data1.data?.stability?.total_incidents || 0;
    const totalSesionesSinFiltro = data1.data?.metadata?.sesiones_analizadas || 0;
    
    // ========================================================================
    // TEST 2: SOLO vehículo 1
    // ========================================================================
    console.log('='.repeat(80));
    console.log(`🎯 TEST 2: SOLO vehículo "${vehicles[0].name}"\n`);
    
    const res2 = await fetch(
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds[]=${vehicles[0].id}`,
        { headers }
    );
    const data2 = await res2.json();
    
    console.log(`   ✅ Total eventos: ${data2.data?.stability?.total_incidents || 0}`);
    console.log(`   ✅ Total sesiones: ${data2.data?.metadata?.sesiones_analizadas || 0}`);
    console.log(`   ✅ KM total: ${data2.data?.activity?.km_total?.toFixed(2) || 0}\n`);
    
    const eventosVehiculo1 = data2.data?.stability?.total_incidents || 0;
    const sesionesVehiculo1 = data2.data?.metadata?.sesiones_analizadas || 0;
    
    // ========================================================================
    // TEST 3: SOLO vehículo 2
    // ========================================================================
    console.log('='.repeat(80));
    console.log(`🎯 TEST 3: SOLO vehículo "${vehicles[1].name}"\n`);
    
    const res3 = await fetch(
        `${BASE_URL}/api/kpis/summary?organizationId=${ORG_ID}&vehicleIds[]=${vehicles[1].id}`,
        { headers }
    );
    const data3 = await res3.json();
    
    console.log(`   ✅ Total eventos: ${data3.data?.stability?.total_incidents || 0}`);
    console.log(`   ✅ Total sesiones: ${data3.data?.metadata?.sesiones_analizadas || 0}`);
    console.log(`   ✅ KM total: ${data3.data?.activity?.km_total?.toFixed(2) || 0}\n`);
    
    const eventosVehiculo2 = data3.data?.stability?.total_incidents || 0;
    const sesionesVehiculo2 = data3.data?.metadata?.sesiones_analizadas || 0;
    
    // ========================================================================
    // ANÁLISIS
    // ========================================================================
    console.log('='.repeat(80));
    console.log('\n📊 ANÁLISIS DE RESULTADOS\n');
    
    const suma = eventosVehiculo1 + eventosVehiculo2;
    
    console.log(`   Sin filtro: ${totalEventosSinFiltro} eventos, ${totalSesionesSinFiltro} sesiones`);
    console.log(`   Vehículo 1: ${eventosVehiculo1} eventos, ${sesionesVehiculo1} sesiones`);
    console.log(`   Vehículo 2: ${eventosVehiculo2} eventos, ${sesionesVehiculo2} sesiones`);
    console.log(`   Suma 1+2: ${suma} eventos\n`);
    
    if (totalEventosSinFiltro === eventosVehiculo1 && totalEventosSinFiltro === eventosVehiculo2) {
        console.log('❌ FILTROS NO FUNCIONAN - Todos devuelven los mismos datos');
        console.log('💡 Problema: El backend NO está aplicando el filtro vehicleIds\n');
    } else if (eventosVehiculo1 !== eventosVehiculo2) {
        console.log('✅ FILTROS FUNCIONAN CORRECTAMENTE');
        console.log('💡 Cada vehículo devuelve datos diferentes\n');
    } else {
        console.log('⚠️ RESULTADO AMBIGUO - Necesita investigación');
        console.log('💡 Los valores cambian pero puede haber un problema\n');
    }
    
    await prisma.$disconnect();
}

test();

