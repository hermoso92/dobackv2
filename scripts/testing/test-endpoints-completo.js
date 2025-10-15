/**
 * SCRIPT DE VERIFICACIÓN COMPLETA DE ENDPOINTS
 * Prueba todos los endpoints modificados
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const API_BASE = 'http://localhost:9998';

// Función para hacer peticiones HTTP
function makeRequest(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 9998,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Función para obtener token de admin
async function getAdminToken() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@doback.com' }
    });

    if (!user) {
        console.log('❌ Usuario admin no encontrado');
        return null;
    }

    console.log(`✅ Usuario encontrado: ${user.email} (${user.id})`);
    console.log(`   Organización: ${user.organizationId}`);

    // Simular token (en producción se obtendría del login)
    return `fake-token-${user.id}`;
}

async function verificarEndpoints() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 VERIFICACIÓN COMPLETA DE ENDPOINTS');
    console.log('='.repeat(80) + '\n');

    try {
        // 1. Verificar que hay sesiones en BD
        console.log('📊 1. VERIFICANDO BASE DE DATOS...\n');
        
        const totalSessions = await prisma.session.count();
        const totalGPS = await prisma.gpsMeasurement.count();
        const totalStability = await prisma.stabilityMeasurement.count();
        const totalRotativo = await prisma.rotativoMeasurement.count();

        console.log(`   ✅ Sesiones: ${totalSessions}`);
        console.log(`   ✅ GPS Measurements: ${totalGPS}`);
        console.log(`   ✅ Stability Measurements: ${totalStability}`);
        console.log(`   ✅ Rotativo Measurements: ${totalRotativo}`);

        if (totalSessions === 0) {
            console.log('\n❌ ERROR: No hay sesiones en la BD');
            console.log('   Ejecuta: node process-multi-session-correct.js');
            return;
        }

        // Obtener una sesión de ejemplo
        const sampleSession = await prisma.session.findFirst({
            include: {
                Vehicle: true
            }
        });

        console.log(`\n   📍 Sesión de ejemplo:`);
        console.log(`      ID: ${sampleSession.id}`);
        console.log(`      Vehículo: ${sampleSession.Vehicle?.name || sampleSession.vehicleId}`);
        console.log(`      Fecha: ${sampleSession.startTime.toISOString().split('T')[0]}`);
        console.log(`      OrganizationId: ${sampleSession.organizationId}`);

        const orgId = sampleSession.organizationId;
        const vehicleId = sampleSession.vehicleId;

        // 2. Probar endpoint /api/kpis/summary
        console.log('\n' + '-'.repeat(80));
        console.log('📊 2. PROBANDO /api/kpis/summary...\n');

        try {
            const token = await getAdminToken();
            const result = await makeRequest(`/api/kpis/summary?organizationId=${orgId}`, token);

            console.log(`   Status: ${result.statusCode}`);

            if (result.statusCode === 200 && result.data.success) {
                const data = result.data.data;
                console.log(`   ✅ Endpoint responde correctamente`);
                console.log(`\n   📊 DATOS RECIBIDOS:`);
                console.log(`      States - Total time: ${data.states?.total_time_formatted || 'N/A'}`);
                console.log(`      Activity - KM total: ${data.activity?.km_total || 0}`);
                console.log(`      Activity - Horas conducción: ${data.activity?.driving_hours_formatted || 'N/A'}`);
                console.log(`      Stability - Total incidencias: ${data.stability?.total_incidents || 0}`);
                console.log(`      Quality - Índice promedio: ${data.quality?.indice_promedio ? (data.quality.indice_promedio * 100).toFixed(1) + '%' : 'N/A'}`);
                console.log(`      Quality - Calificación: ${data.quality?.calificacion || 'N/A'} ${data.quality?.estrellas || ''}`);

                if (data.stability?.por_tipo) {
                    console.log(`\n      Eventos por tipo:`);
                    Object.entries(data.stability.por_tipo).forEach(([tipo, count]) => {
                        console.log(`         - ${tipo}: ${count}`);
                    });
                }

                // Validar valores
                if (data.activity?.km_total === 0) {
                    console.log(`\n   ⚠️  ADVERTENCIA: KM total es 0 (puede ser que no hay datos GPS)`);
                }
                if (!data.quality) {
                    console.log(`\n   ⚠️  ADVERTENCIA: quality es undefined (índice SI no se está calculando)`);
                }
                if (!data.stability?.por_tipo) {
                    console.log(`\n   ⚠️  ADVERTENCIA: por_tipo es undefined (eventos no se están detectando)`);
                }
            } else {
                console.log(`   ❌ Error: ${result.statusCode}`);
                console.log(`   Respuesta:`, result.data);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }

        // 3. Probar endpoint /api/kpis/states
        console.log('\n' + '-'.repeat(80));
        console.log('🔑 3. PROBANDO /api/kpis/states...\n');

        try {
            const token = await getAdminToken();
            console.log(`   Llamando a: /api/kpis/states?organizationId=${orgId}`);
            const result = await makeRequest(`/api/kpis/states?organizationId=${orgId}`, token);

            console.log(`   Status: ${result.statusCode}`);

            if (result.statusCode === 200 && result.data.success) {
                const states = result.data.data.states;
                console.log(`   ✅ Endpoint responde correctamente`);
                console.log(`\n   🔑 CLAVES OPERATIVAS:`);
                states.forEach(state => {
                    console.log(`      Clave ${state.key} - ${state.name}: ${state.duration_formatted} (${state.duration_seconds}s)`);
                });

                // Validar que no todos están en 0
                const algunoConValor = states.some(s => s.duration_seconds > 0);
                if (!algunoConValor) {
                    console.log(`\n   ⚠️  ADVERTENCIA: Todas las claves están en 0 (keyCalculator no está calculando)`);
                } else {
                    console.log(`\n   ✅ Al menos una clave tiene valor (keyCalculator funciona)`);
                }
            } else {
                console.log(`   ❌ Error: ${result.statusCode}`);
                console.log(`   Respuesta:`, result.data);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }

        // 4. Probar endpoint /api/hotspots/critical-points
        console.log('\n' + '-'.repeat(80));
        console.log('📍 4. PROBANDO /api/hotspots/critical-points...\n');

        try {
            const token = await getAdminToken();
            const result = await makeRequest(`/api/hotspots/critical-points?organizationId=${orgId}&severity=all`, token);

            console.log(`   Status: ${result.statusCode}`);

            if (result.statusCode === 200 && result.data.success) {
                const clusters = result.data.data.clusters || [];
                const eventosDetectados = result.data.data.eventosDetectados;

                console.log(`   ✅ Endpoint responde correctamente`);
                console.log(`\n   📍 PUNTOS NEGROS:`);
                console.log(`      Total clusters: ${clusters.length}`);
                console.log(`      Total eventos: ${result.data.data.totalEvents || 0}`);

                if (eventosDetectados) {
                    console.log(`\n      Eventos detectados por eventDetector:`);
                    console.log(`         Total: ${eventosDetectados.total}`);
                    console.log(`         Por tipo:`, eventosDetectados.por_tipo);
                    console.log(`         Por severidad:`, eventosDetectados.por_severidad);
                }

                if (clusters.length > 0) {
                    console.log(`\n      Ejemplo de cluster:`);
                    console.log(`         Location: ${clusters[0].location}`);
                    console.log(`         Frequency: ${clusters[0].frequency}`);
                    console.log(`         Severity: ${clusters[0].dominantSeverity}`);
                }

                if (clusters.length === 0) {
                    console.log(`\n   ⚠️  ADVERTENCIA: No hay clusters (puede ser que no hay eventos detectados)`);
                }
            } else {
                console.log(`   ❌ Error: ${result.statusCode}`);
                console.log(`   Respuesta:`, result.data);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }

        // 5. Probar endpoint /api/speed/violations
        console.log('\n' + '-'.repeat(80));
        console.log('🚗 5. PROBANDO /api/speed/violations...\n');

        try {
            const token = await getAdminToken();
            const result = await makeRequest(`/api/speed/violations?organizationId=${orgId}`, token);

            console.log(`   Status: ${result.statusCode}`);

            if (result.statusCode === 200 && result.data.success) {
                const violations = result.data.data.violations || [];
                const stats = result.data.data.stats;
                const summary = result.data.data.summary;

                console.log(`   ✅ Endpoint responde correctamente`);
                console.log(`\n   🚗 ANÁLISIS DE VELOCIDAD:`);
                console.log(`      Total violaciones: ${violations.length}`);
                console.log(`      Graves: ${stats?.graves || 0}`);
                console.log(`      Leves: ${stats?.leves || 0}`);
                console.log(`      Con rotativo: ${stats?.withRotativo || 0}`);
                console.log(`      Sin rotativo: ${stats?.withoutRotativo || 0}`);

                if (summary) {
                    console.log(`\n      Summary de speedAnalyzer:`);
                    console.log(`         Velocidad máxima: ${summary.velocidad_maxima} km/h`);
                    console.log(`         Velocidad promedio: ${summary.velocidad_promedio} km/h`);
                    console.log(`         Excesos totales: ${summary.excesos_totales}`);
                    console.log(`         Excesos graves: ${summary.excesos_graves}`);
                }

                if (violations.length > 0) {
                    console.log(`\n      Ejemplo de violación:`);
                    console.log(`         Vehículo: ${violations[0].vehicleName}`);
                    console.log(`         Velocidad: ${violations[0].speed} km/h`);
                    console.log(`         Límite: ${violations[0].speedLimit} km/h`);
                    console.log(`         Exceso: ${violations[0].excess} km/h`);
                    console.log(`         Rotativo: ${violations[0].rotativoOn ? 'ON' : 'OFF'}`);
                }

                if (violations.length === 0) {
                    console.log(`\n   ℹ️  INFO: No hay violaciones (puede ser normal si todos cumplen límites)`);
                }
            } else {
                console.log(`   ❌ Error: ${result.statusCode}`);
                console.log(`   Respuesta:`, result.data);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ VERIFICACIÓN COMPLETADA');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ ERROR FATAL:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar verificación
verificarEndpoints()
    .then(() => {
        console.log('\n✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error fatal:', error);
        process.exit(1);
    });

