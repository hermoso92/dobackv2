/**
 * Analizar una sesión específica en detalle
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarSesion() {
    console.log('\n🔍 ANÁLISIS DETALLADO DE SESIÓN\n');
    
    try {
        // Buscar sesión con más GPS
        const sesion = await prisma.session.findFirst({
            where: {
                GpsMeasurement: {
                    some: {}
                }
            },
            include: {
                GpsMeasurement: {
                    orderBy: { timestamp: 'asc' },
                    select: {
                        latitude: true,
                        longitude: true,
                        speed: true,
                        timestamp: true
                    }
                },
                Vehicle: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                startTime: 'desc'
            }
        });

        if (!sesion) {
            console.log('❌ No se encontró sesión\n');
            return;
        }

        const gpsData = sesion.GpsMeasurement;

        console.log(`📍 SESIÓN: ${sesion.Vehicle.name}`);
        console.log(`   Fecha: ${sesion.startTime.toISOString().split('T')[0]}`);
        console.log(`   Inicio: ${sesion.startTime.toISOString().split('T')[1].substring(0,8)}`);
        console.log(`   Fin: ${sesion.endTime ? sesion.endTime.toISOString().split('T')[1].substring(0,8) : 'N/A'}`);
        console.log(`   Puntos GPS: ${gpsData.length}\n`);

        if (gpsData.length < 2) {
            console.log('⚠️  Muy pocos puntos GPS\n');
            return;
        }

        // Analizar velocidades
        let tiempoParado = 0;
        let tiempoMovimiento = 0;
        let velocidades = [];

        console.log('📊 ANÁLISIS DE VELOCIDADES:\n');

        for (let i = 0; i < gpsData.length - 1; i++) {
            const current = gpsData[i];
            const next = gpsData[i + 1];
            
            const timeDiff = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000;
            velocidades.push(current.speed);

            if (current.speed < 5) {
                tiempoParado += timeDiff;
            } else {
                tiempoMovimiento += timeDiff;
            }
        }

        // Estadísticas
        const velPromedio = velocidades.reduce((a,b) => a+b, 0) / velocidades.length;
        const velMax = Math.max(...velocidades);
        const velMin = Math.min(...velocidades);

        console.log(`   Velocidad Promedio: ${velPromedio.toFixed(1)} km/h`);
        console.log(`   Velocidad Máxima: ${velMax.toFixed(1)} km/h`);
        console.log(`   Velocidad Mínima: ${velMin.toFixed(1)} km/h\n`);

        console.log(`   Tiempo en Movimiento (>5 km/h): ${Math.round(tiempoMovimiento/60)} minutos`);
        console.log(`   Tiempo Parado (<5 km/h): ${Math.round(tiempoParado/60)} minutos\n`);

        // Primera y última coordenada
        const primera = gpsData[0];
        const ultima = gpsData[gpsData.length - 1];

        console.log(`📍 COORDENADAS:\n`);
        console.log(`   Primera: ${primera.latitude}, ${primera.longitude}`);
        console.log(`   Última:  ${ultima.latitude}, ${ultima.longitude}\n`);

        // Distancia entre primera y última
        const R = 6371;
        const dLat = (ultima.latitude - primera.latitude) * Math.PI / 180;
        const dLon = (ultima.longitude - primera.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(primera.latitude * Math.PI / 180) * Math.cos(ultima.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distancia = R * c;

        console.log(`   Distancia inicio-fin: ${(distancia * 1000).toFixed(0)} metros\n`);

        if (distancia < 0.2) {
            console.log('✅ VUELVE AL PARQUE (ida y vuelta en misma sesión)\n');
            console.log('   Estados inferidos:');
            console.log(`   - Estado 2 (Ida): ${Math.round(tiempoMovimiento * 0.5 / 60)} min`);
            console.log(`   - Estado 3 (Siniestro): ${Math.round(tiempoParado / 60)} min`);
            console.log(`   - Estado 5 (Regreso): ${Math.round(tiempoMovimiento * 0.5 / 60)} min\n`);
        } else {
            console.log('⚠️  NO VUELVE AL PARQUE (solo ida, otra sesión para vuelta)\n');
            console.log('   Estados inferidos:');
            console.log(`   - Estado 2 (Ida): ${Math.round(tiempoMovimiento / 60)} min`);
            console.log(`   - Estado 3 (Siniestro): ${Math.round(tiempoParado / 60)} min`);
            console.log(`   - Estado 5 (Regreso): 0 min\n`);
        }

        // Distribución de velocidades
        console.log('📈 DISTRIBUCIÓN DE VELOCIDADES:\n');
        const velocidadParada = velocidades.filter(v => v < 5).length;
        const velocidadLenta = velocidades.filter(v => v >= 5 && v < 30).length;
        const velocidadMedia = velocidades.filter(v => v >= 30 && v < 60).length;
        const velocidadRapida = velocidades.filter(v => v >= 60).length;

        const total = velocidades.length;
        console.log(`   Parado (<5 km/h):     ${velocidadParada} puntos (${Math.round(velocidadParada/total*100)}%)`);
        console.log(`   Lento (5-30 km/h):    ${velocidadLenta} puntos (${Math.round(velocidadLenta/total*100)}%)`);
        console.log(`   Medio (30-60 km/h):   ${velocidadMedia} puntos (${Math.round(velocidadMedia/total*100)}%)`);
        console.log(`   Rápido (>60 km/h):    ${velocidadRapida} puntos (${Math.round(velocidadRapida/total*100)}%)\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

analizarSesion();

