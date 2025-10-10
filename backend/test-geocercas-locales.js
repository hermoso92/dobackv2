/**
 * TEST SIMPLE: Geocercas locales (sin Radar)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function puntoEnGeocerca(lat, lon, geocerca) {
    const coords = geocerca.geometry?.coordinates;
    if (!coords || !coords[0]) return false;
    
    const polygon = coords[0];
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][1], yi = polygon[i][0];
        const xj = polygon[j][1], yj = polygon[j][0];
        
        const intersect = ((yi > lon) !== (yj > lon)) &&
            (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

async function test() {
    try {
        console.log('\n🧪 TEST GEOCERCAS LOCALES (BD)\n');
        console.log('='.repeat(80) + '\n');
        
        // 1. Cargar parques
        const parques = await prisma.park.findMany({
            select: { id: true, name: true, geometry: true }
        });
        
        console.log(`📍 Parques cargados: ${parques.length}\n`);
        
        // 2. Obtener sesión con GPS
        const sesion = await prisma.session.findFirst({
            where: {
                vehicleId: '14b9febb-ca73-4130-a88d-e4d73ed6501a',
                startTime: { gte: new Date('2025-10-08') }
            }
        });
        
        if (!sesion) {
            console.log('❌ No se encontró sesión');
            return;
        }
        
        console.log(`✅ Sesión: ${sesion.id.substring(0, 8)}...`);
        console.log(`   ${sesion.startTime.toISOString()}\n`);
        
        // 3. Obtener algunos puntos GPS
        const puntos = await prisma.gpsMeasurement.findMany({
            where: { sessionId: sesion.id },
            select: { latitude: true, longitude: true, timestamp: true },
            take: 10
        });
        
        console.log(`📊 Puntos GPS: ${puntos.length}\n`);
        
        // 4. Verificar cada punto contra cada parque
        let coincidencias = 0;
        
        console.log('🔍 Verificando puntos contra geocercas...\n');
        
        for (const punto of puntos) {
            for (const parque of parques) {
                const dentro = puntoEnGeocerca(punto.latitude, punto.longitude, parque);
                
                if (dentro) {
                    console.log(`  ✅ Punto (${punto.latitude.toFixed(4)}, ${punto.longitude.toFixed(4)}) está en ${parque.name}`);
                    coincidencias++;
                }
            }
        }
        
        console.log(`\n📊 RESULTADO:`);
        console.log(`   Puntos verificados: ${puntos.length}`);
        console.log(`   Coincidencias: ${coincidencias}`);
        console.log(`   Parques probados: ${parques.length}\n`);
        
        if (coincidencias === 0) {
            console.log('⚠️  No hay coincidencias geográficas (NORMAL)');
            console.log('   El vehículo no estuvo en ningún parque durante esta sesión\n');
        }
        
        console.log('='.repeat(80));
        console.log('✅ TEST COMPLETADO\n');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();

