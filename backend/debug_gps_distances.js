const { PrismaClient } = require('@prisma/client');

async function debugGPSDistances() {
    const prisma = new PrismaClient();
    const sessionId = '9cf0abd0-fe51-4831-8fdf-1f3bb84d7bc7';

    console.log('🔍 ANÁLISIS DE DISTANCIAS GPS');
    console.log('============================\n');

    try {
        // Obtener datos GPS reales
        const gpsPoints = await prisma.gpsMeasurement.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            take: 10 // Solo primeros 10 puntos para análisis
        });

        console.log(`📊 Total puntos GPS encontrados: ${gpsPoints.length}`);
        
        if (gpsPoints.length === 0) {
            console.log('❌ No hay datos GPS para esta sesión');
            return;
        }

        console.log('\n🗺️ PRIMEROS 10 PUNTOS GPS:');
        console.log('============================');

        let totalDistance = 0;
        
        gpsPoints.forEach((point, index) => {
            console.log(`Punto ${index + 1}:`);
            console.log(`  📍 Coordenadas: ${point.latitude}, ${point.longitude}`);
            console.log(`  ⏰ Timestamp: ${point.timestamp}`);
            console.log(`  🚗 Velocidad: ${point.speed || 0} km/h`);
            
            if (index > 0) {
                const prev = gpsPoints[index - 1];
                const distance = haversineDistance(
                    prev.latitude, prev.longitude,
                    point.latitude, point.longitude
                );
                console.log(`  📏 Distancia desde punto anterior: ${distance.toFixed(4)} km`);
                totalDistance += distance;
            }
            console.log('');
        });

        console.log(`📏 DISTANCIA TOTAL (primeros 10 puntos): ${totalDistance.toFixed(4)} km`);

        // Análisis completo si hay más puntos
        if (gpsPoints.length < 50) { // Solo si no son demasiados
            const allPoints = await prisma.gpsMeasurement.findMany({
                where: { sessionId },
                orderBy: { timestamp: 'asc' }
            });

            let fullDistance = 0;
            for (let i = 1; i < allPoints.length; i++) {
                const prev = allPoints[i - 1];
                const curr = allPoints[i];
                
                const distance = haversineDistance(
                    prev.latitude, prev.longitude,
                    curr.latitude, curr.longitude
                );
                fullDistance += distance;
            }

            console.log(`\n📏 DISTANCIA TOTAL COMPLETA: ${fullDistance.toFixed(4)} km`);
            console.log(`📊 Total puntos procesados: ${allPoints.length}`);
            
            // Verificar si hay saltos enormes
            console.log('\n🚨 ANALIZANDO SALTOS GRANDES:');
            for (let i = 1; i < Math.min(allPoints.length, 100); i++) {
                const prev = allPoints[i - 1];
                const curr = allPoints[i];
                
                const distance = haversineDistance(
                    prev.latitude, prev.longitude,
                    curr.latitude, curr.longitude
                );
                
                if (distance > 1) { // Saltos mayores a 1 km
                    console.log(`⚠️ Salto grande detectado:`);
                    console.log(`   Punto ${i}: ${prev.latitude}, ${prev.longitude}`);
                    console.log(`   Punto ${i+1}: ${curr.latitude}, ${curr.longitude}`);
                    console.log(`   Distancia: ${distance.toFixed(4)} km`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

debugGPSDistances().catch(console.error); 