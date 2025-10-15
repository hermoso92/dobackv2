/**
 * Validar cálculo de KPIs comparando cálculo manual vs backend
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const http = require('http');

// Función Haversine
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

function consultarBackend(vehicleId, fecha) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: `/api/kpis/summary?vehicleIds[]=${vehicleId}&from=${fecha}&to=${fecha}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Invalid JSON' });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => reject(new Error('Timeout')));
        req.end();
    });
}

async function validarCalculo() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('VALIDACIÓN DE CÁLCULO DE KPIs');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    try {
        // Tomar 1 vehículo con sesiones
        const primeraSession = await prisma.session.findFirst({
            where: {
                GpsMeasurement: {
                    some: {}
                }
            },
            include: {
                Vehicle: {
                    select: {
                        name: true,
                        id: true
                    }
                }
            }
        });

        if (!primeraSession) {
            console.log('❌ No se encontró sesión con GPS\n');
            return;
        }

        const vehicleId = primeraSession.Vehicle.id;
        const fecha = primeraSession.startTime.toISOString().split('T')[0];

        // Obtener TODAS las sesiones de ese vehículo ese día
        const sesiones = await prisma.session.findMany({
            where: {
                vehicleId: vehicleId,
                startTime: {
                    gte: new Date(fecha + 'T00:00:00'),
                    lte: new Date(fecha + 'T23:59:59')
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
                stability_events: {
                    select: {
                        type: true,
                        timestamp: true
                    }
                },
                RotativoMeasurement: {
                    orderBy: { timestamp: 'asc' },
                    select: {
                        state: true,
                        timestamp: true
                    }
                }
            }
        });

        if (sesiones.length === 0) {
            console.log('❌ No se encontraron sesiones\n');
            return;
        }

        console.log(`📍 ANÁLISIS SELECCIONADO:\n`);
        console.log(`   Vehículo: ${primeraSession.Vehicle.name}`);
        console.log(`   Fecha: ${fecha}`);
        console.log(`   Total Sesiones: ${sesiones.length}\n`);

        // CÁLCULO MANUAL
        console.log('═══════════════════════════════════════════════════════════');
        console.log('CÁLCULO MANUAL (TODAS LAS SESIONES DEL DÍA)');
        console.log('═══════════════════════════════════════════════════════════\n');

        let kmTotal = 0;
        let tiempoMovimiento = 0;
        let tiempoParado = 0;
        let totalIncidencias = 0;
        let totalCriticas = 0;
        let totalModeradas = 0;
        let sesionesOperacion = 0;

        for (const sesion of sesiones) {
            const gpsData = sesion.GpsMeasurement;
            let kmSesion = 0;
            
            // Calcular distancia y tiempos
            for (let i = 0; i < gpsData.length - 1; i++) {
                const curr = gpsData[i];
                const next = gpsData[i + 1];

                if (curr.latitude && curr.longitude && next.latitude && next.longitude &&
                    curr.latitude !== 0 && curr.longitude !== 0 &&
                    Math.abs(curr.latitude) <= 90 && Math.abs(curr.longitude) <= 180) {
                    
                    const dist = haversine(curr.latitude, curr.longitude, next.latitude, next.longitude);
                    
                    if (dist > 0 && dist < 5) {
                        kmTotal += dist;
                        kmSesion += dist;
                    }

                    const timeDiff = (new Date(next.timestamp) - new Date(curr.timestamp)) / 1000;
                    
                    if (curr.speed < 5) {
                        tiempoParado += timeDiff;
                    } else {
                        tiempoMovimiento += timeDiff;
                    }
                }
            }

            const esOperacion = kmSesion >= 0.5;
            if (esOperacion) sesionesOperacion++;

            // Contar incidencias
            totalIncidencias += sesion.stability_events.length;
            totalCriticas += sesion.stability_events.filter(e => 
                e.type?.includes('rollover') || e.type?.includes('CRITICAL')).length;
            totalModeradas += sesion.stability_events.filter(e => 
                e.type?.includes('drift') || e.type?.includes('MODERATE')).length;
        }

        const totalLeves = totalIncidencias - totalCriticas - totalModeradas;

        console.log(`   Sesiones Totales: ${sesiones.length}`);
        console.log(`   Sesiones con Operación (>0.5km): ${sesionesOperacion}`);
        console.log(`   Distancia Total: ${kmTotal.toFixed(2)} km`);
        console.log(`   Tiempo Movimiento: ${Math.round(tiempoMovimiento/60)} min`);
        console.log(`   Tiempo Parado: ${Math.round(tiempoParado/60)} min\n`);

        console.log(`   📊 INCIDENCIAS:\n`);
        console.log(`      Total: ${totalIncidencias}`);
        console.log(`      Críticas: ${totalCriticas}`);
        console.log(`      Moderadas: ${totalModeradas}`);
        console.log(`      Leves: ${totalLeves}\n`);

        // CONSULTAR BACKEND
        console.log('═══════════════════════════════════════════════════════════');
        console.log('CONSULTANDO BACKEND');
        console.log('═══════════════════════════════════════════════════════════\n');

        const respuesta = await consultarBackend(vehicleId, fecha);

        if (respuesta.error) {
            console.log('❌ Error consultando backend\n');
            return;
        }

        const backend = respuesta.data;

        console.log(`   Kilómetros: ${backend.activity.km_total} km`);
        console.log(`   Horas Conducción: ${backend.activity.driving_hours_formatted}`);
        console.log(`   % Rotativo: ${backend.activity.rotativo_on_percentage}%`);
        console.log(`   Incidencias: ${backend.stability.total_incidents}\n`);

        // COMPARACIÓN
        console.log('═══════════════════════════════════════════════════════════');
        console.log('COMPARACIÓN');
        console.log('═══════════════════════════════════════════════════════════\n');

        const toleranciaKm = 10; // 10% tolerancia
        const difKm = Math.abs(backend.activity.km_total - kmTotal);
        const difPorcentaje = (difKm / kmTotal) * 100;

        console.log(`   Kilómetros:`);
        console.log(`      Manual: ${kmTotal.toFixed(2)} km`);
        console.log(`      Backend: ${backend.activity.km_total} km`);
        console.log(`      Diferencia: ${difKm.toFixed(2)} km (${difPorcentaje.toFixed(1)}%)`);
        
        if (difPorcentaje < toleranciaKm) {
            console.log(`      ✅ CORRECTO (tolerancia ${toleranciaKm}%)\n`);
        } else {
            console.log(`      ❌ DESVIACIÓN ALTA\n`);
        }

        console.log(`   Incidencias:`);
        console.log(`      Manual: ${totalIncidencias}`);
        console.log(`      Backend: ${backend.stability.total_incidents}`);
        
        if (backend.stability.total_incidents === totalIncidencias) {
            console.log(`      ✅ CORRECTO\n`);
        } else {
            console.log(`      ⚠️  DIFERENCIA\n`);
        }

        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

validarCalculo();

