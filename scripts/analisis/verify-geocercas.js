/**
 * VERIFICACIÓN DE EXACTITUD DE GEOCERCAS
 * Verifica parques, zonas y cálculos de distancia
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función Haversine para verificar cálculos
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio Tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * 
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Metros
}

async function verifyGeocercas() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🗺️  VERIFICACIÓN DE GEOCERCAS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // 1. Listar todos los parques
        console.log('🏢 PARQUES DE BOMBEROS:\n');
        
        const parks = await prisma.park.findMany({
            select: {
                id: true,
                name: true,
                geometry: true,
                organizationId: true
            }
        });

        console.log(`  Total parques: ${parks.length}\n`);

        parks.forEach((park, idx) => {
            console.log(`  ${idx + 1}. ${park.name}`);
            console.log(`     ID: ${park.id.substring(0, 13)}...`);
            
            const geom = typeof park.geometry === 'string' ? 
                JSON.parse(park.geometry) : park.geometry;
            
            console.log(`     Tipo geometría: ${geom.type}`);
            
            if (geom.type === 'Polygon') {
                const coords = geom.coordinates[0];
                console.log(`     Polígono con ${coords.length} vértices`);
                console.log(`     Primer vértice: [${coords[0][1]}, ${coords[0][0]}]`);
                
                // Calcular centro aproximado
                const lats = coords.map(c => c[1]);
                const lons = coords.map(c => c[0]);
                const centerLat = lats.reduce((a,b) => a+b, 0) / lats.length;
                const centerLon = lons.reduce((a,b) => a+b, 0) / lons.length;
                console.log(`     Centro aproximado: [${centerLat.toFixed(6)}, ${centerLon.toFixed(6)}]`);
                
            } else if (geom.type === 'Circle' || geom.type === 'circle') {
                const center = Array.isArray(geom.center) ?
                    { lat: geom.center[0], lon: geom.center[1] } :
                    { lat: geom.center.lat, lon: geom.center.lng };
                console.log(`     Centro: [${center.lat}, ${center.lon}]`);
                console.log(`     Radio: ${geom.radius || 'No definido'} metros`);
            }
            
            console.log('');
        });

        // 2. Listar zonas (talleres, etc.)
        console.log('🔧 ZONAS (Talleres, etc.):\n');
        
        const zones = await prisma.zone.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                geometry: true
            }
        });

        console.log(`  Total zonas: ${zones.length}\n`);

        const zonesByType = {};
        zones.forEach(z => {
            if (!zonesByType[z.type]) zonesByType[z.type] = [];
            zonesByType[z.type].push(z);
        });

        Object.entries(zonesByType).forEach(([type, zonesOfType]) => {
            console.log(`  ${type}: ${zonesOfType.length} zonas`);
            zonesOfType.forEach(z => {
                console.log(`    - ${z.name}`);
            });
        });

        // 3. Prueba de cálculo de distancia
        console.log('\n📐 PRUEBA DE CÁLCULO DE DISTANCIAS:\n');

        // Tomar un punto GPS real
        const sampleGPS = await prisma.gpsMeasurement.findFirst({
            where: {
                latitude: { not: 0 },
                longitude: { not: 0 }
            },
            select: {
                latitude: true,
                longitude: true,
                timestamp: true
            }
        });

        if (sampleGPS && parks.length > 0) {
            console.log(`  Punto GPS de prueba: [${sampleGPS.latitude}, ${sampleGPS.longitude}]`);
            console.log(`  Timestamp: ${sampleGPS.timestamp.toISOString()}\n`);
            console.log(`  DISTANCIAS A PARQUES:\n`);

            parks.forEach(park => {
                const geom = typeof park.geometry === 'string' ? 
                    JSON.parse(park.geometry) : park.geometry;
                
                let distance = null;

                if (geom.type === 'Polygon') {
                    const coords = geom.coordinates[0];
                    const lats = coords.map(c => c[1]);
                    const lons = coords.map(c => c[0]);
                    const centerLat = lats.reduce((a,b) => a+b, 0) / lats.length;
                    const centerLon = lons.reduce((a,b) => a+b, 0) / lons.length;
                    
                    distance = haversineDistance(
                        sampleGPS.latitude, sampleGPS.longitude,
                        centerLat, centerLon
                    );
                } else if (geom.type === 'Circle' || geom.type === 'circle') {
                    const center = Array.isArray(geom.center) ?
                        { lat: geom.center[0], lon: geom.center[1] } :
                        { lat: geom.center.lat, lon: geom.center.lng };
                    
                    distance = haversineDistance(
                        sampleGPS.latitude, sampleGPS.longitude,
                        center.lat, center.lon
                    );
                }

                if (distance !== null) {
                    const km = (distance / 1000).toFixed(2);
                    const inRange = distance <= 100; // 100 metros
                    console.log(`    ${park.name}: ${km} km ${inRange ? '✅ DENTRO' : ''}`);
                }
            });
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ VERIFICACIÓN DE GEOCERCAS COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyGeocercas();

