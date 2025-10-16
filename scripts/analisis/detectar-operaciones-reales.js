/**
 * DETECTAR OPERACIONES REALES DE BOMBEROS
 * Lógica: Si una sesión tiene >500m de recorrido, ES una operación
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Haversine para calcular distancia
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function detectarOperaciones() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('DETECTOR DE OPERACIONES REALES DE BOMBEROS');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Obtener todas las sesiones con GPS
        const sessions = await prisma.session.findMany({
            where: {
                GpsMeasurement: {
                    some: {}
                }
            },
            include: {
                Vehicle: true,
                GpsMeasurement: {
                    orderBy: { timestamp: 'asc' },
                    select: { latitude: true, longitude: true, speed: true, timestamp: true }
                },
                stability_events: {
                    select: { type: true }
                }
            },
            take: 100
        });

        console.log(`📊 Analizando ${sessions.length} sesiones con GPS\n`);

        let operacionesReales = 0;
        let pruebasOEncendidos = 0;
        let sesionesEnParque = 0;

        const operaciones = [];

        for (const session of sessions) {
            const gpsData = session.GpsMeasurement;
            
            if (gpsData.length < 2) continue;

            // Calcular distancia total
            let totalKm = 0;
            let maxSpeed = 0;

            for (let i = 0; i < gpsData.length - 1; i++) {
                const current = gpsData[i];
                const next = gpsData[i + 1];

                if (!current.latitude || !current.longitude || !next.latitude || !next.longitude) continue;
                if (current.latitude === 0 && current.longitude === 0) continue;

                const distance = haversine(current.latitude, current.longitude, next.latitude, next.longitude);
                
                if (distance < 5) { // Filtrar distancias imposibles
                    totalKm += distance;
                }

                if (current.speed > maxSpeed) {
                    maxSpeed = current.speed;
                }
            }

            // Calcular duración
            const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000;
            const durationMin = Math.round(duration / 60);

            // CLASIFICAR SESIÓN
            let tipo = '';
            let esOperacion = false;

            if (totalKm < 0.5) {
                tipo = '❌ Prueba/Encendido';
                pruebasOEncendidos++;
            } else if (totalKm >= 0.5 && totalKm < 2) {
                tipo = '⚠️  Movimiento corto';
                sesionesEnParque++;
            } else {
                tipo = '✅ OPERACIÓN REAL';
                operacionesReales++;
                esOperacion = true;
            }

            if (esOperacion || totalKm > 0.1) {
                operaciones.push({
                    vehiculo: session.Vehicle.name,
                    inicio: session.startTime,
                    duracion: durationMin,
                    km: totalKm.toFixed(2),
                    maxSpeed: maxSpeed.toFixed(1),
                    eventos: session.stability_events.length,
                    tipo
                });
            }
        }

        // Ordenar por km descendente
        operaciones.sort((a, b) => parseFloat(b.km) - parseFloat(a.km));

        console.log('═══════════════════════════════════════════════════════════');
        console.log('RESUMEN DE CLASIFICACIÓN');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log(`✅ Operaciones reales (>0.5 km): ${operacionesReales}`);
        console.log(`⚠️  Movimientos cortos (0.5-2 km): ${sesionesEnParque}`);
        console.log(`❌ Pruebas/Encendidos (<0.5 km): ${pruebasOEncendidos}\n`);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('TOP 20 OPERACIONES REALES');
        console.log('═══════════════════════════════════════════════════════════\n');

        const topOperaciones = operaciones.filter(o => o.tipo.includes('OPERACIÓN')).slice(0, 20);

        if (topOperaciones.length === 0) {
            console.log('❌ NO SE ENCONTRARON OPERACIONES REALES\n');
        } else {
            topOperaciones.forEach((op, idx) => {
                console.log(`${idx + 1}. ${op.vehiculo}`);
                console.log(`   ${op.tipo}`);
                console.log(`   📅 ${new Date(op.inicio).toLocaleString()}`);
                console.log(`   📏 ${op.km} km | ⏱️  ${op.duracion} min | 🚗 ${op.maxSpeed} km/h`);
                console.log(`   ⚠️  ${op.eventos} eventos de estabilidad\n`);
            });
        }

        // Calcular KM y tiempo REAL de operaciones
        const kmReales = topOperaciones.reduce((sum, op) => sum + parseFloat(op.km), 0);
        const tiempoReal = topOperaciones.reduce((sum, op) => sum + op.duracion, 0);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('TOTALES DE OPERACIONES REALES');
        console.log('═══════════════════════════════════════════════════════════\n');

        console.log(`📏 Total kilómetros en operaciones: ${kmReales.toFixed(2)} km`);
        console.log(`⏱️  Total tiempo en operaciones: ${tiempoReal} minutos (${(tiempoReal/60).toFixed(1)} horas)`);
        console.log(`🚒 Promedio por operación: ${(kmReales/topOperaciones.length).toFixed(2)} km\n`);

        console.log('═══════════════════════════════════════════════════════════');
        console.log('CONCLUSIÓN');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (operacionesReales > 0) {
            console.log(`✅ SE DETECTARON ${operacionesReales} OPERACIONES REALES`);
            console.log(`   → El sistema DEBE calcular estados desde GPS`);
            console.log(`   → Ignorar estados ROTATIVO (incompletos)`);
            console.log(`   → Usar GPS + distancia + eventos para inferir operaciones\n`);
        } else {
            console.log(`❌ NO se detectaron operaciones reales (todas <0.5 km)`);
            console.log(`   → Los datos pueden ser solo pruebas`);
            console.log(`   → O hay problema con GPS\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

detectarOperaciones();

