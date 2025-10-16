/**
 * Detectar ubicaciones de parques de bomberos desde coordenadas GPS
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function detectarParques() {
    console.log('\n🚒 DETECTANDO PARQUES DE BOMBEROS\n');
    
    try {
        // Obtener todos los puntos GPS
        const gpsData = await prisma.gpsMeasurement.findMany({
            select: {
                latitude: true,
                longitude: true,
                speed: true,
                Session: {
                    select: {
                        vehicleId: true
                    }
                }
            },
            where: {
                AND: [
                    { latitude: { not: 0 } },
                    { longitude: { not: 0 } },
                    { latitude: { gte: -90, lte: 90 } },
                    { longitude: { gte: -180, lte: 180 } }
                ]
            }
        });

        console.log(`📊 Total de puntos GPS válidos: ${gpsData.length}\n`);

        // Agrupar por vehículo
        const porVehiculo = {};
        
        gpsData.forEach(point => {
            const vehicleId = point.Session?.vehicleId || 'DESCONOCIDO';
            if (!porVehiculo[vehicleId]) {
                porVehiculo[vehicleId] = [];
            }
            
            // Solo puntos con velocidad <5 km/h (parados en parque)
            if (point.speed < 5) {
                porVehiculo[vehicleId].push({
                    lat: point.latitude,
                    lon: point.longitude
                });
            }
        });

        // Encontrar clusters de puntos (parques)
        for (const [vehicleId, puntos] of Object.entries(porVehiculo)) {
            console.log(`\n🚗 ${vehicleId}: ${puntos.length} puntos parados\n`);
            
            if (puntos.length < 10) {
                console.log('   ⚠️  Muy pocos puntos para detectar parque\n');
                continue;
            }

            // Calcular centro (promedio de coordenadas)
            let sumLat = 0, sumLon = 0;
            puntos.forEach(p => {
                sumLat += p.lat;
                sumLon += p.lon;
            });
            
            const centroLat = sumLat / puntos.length;
            const centroLon = sumLon / puntos.length;

            // Calcular desviación estándar para determinar radio
            let sumDistSq = 0;
            puntos.forEach(p => {
                const dLat = p.lat - centroLat;
                const dLon = p.lon - centroLon;
                sumDistSq += (dLat * dLat + dLon * dLon);
            });
            
            const stdev = Math.sqrt(sumDistSq / puntos.length);
            const radioKm = stdev * 111; // Convertir grados a km aprox.

            console.log(`   📍 Centro detectado: ${centroLat.toFixed(6)}, ${centroLon.toFixed(6)}`);
            console.log(`   📏 Radio estimado: ${(radioKm * 1000).toFixed(0)} metros`);
            
            // Buscar en Google Maps (enlace)
            const mapsUrl = `https://www.google.com/maps?q=${centroLat},${centroLon}`;
            console.log(`   🗺️  Ver en Maps: ${mapsUrl}\n`);

            // Crear geocerca en BD
            try {
                const geofence = await prisma.zone.create({
                    data: {
                        name: `Parque ${vehicleId}`,
                        type: 'PARK',
                        isActive: true,
                        coordinates: JSON.stringify({
                            type: 'circle',
                            center: { lat: centroLat, lon: centroLon },
                            radius: Math.max(radioKm * 1000, 150) // Mínimo 150m
                        }),
                        radius: Math.max(radioKm * 1000, 150),
                        organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                    }
                });
                
                console.log(`   ✅ Geocerca creada: "${geofence.name}" (ID: ${geofence.id})\n`);
            } catch (error) {
                console.log(`   ⚠️  Error creando geocerca: ${error.message}\n`);
            }
        }

        console.log('\n✅ DETECCIÓN COMPLETADA\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

detectarParques();

