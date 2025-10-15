/**
 * AUDITORÍA COMPLETA DEL SISTEMA DOBACKSOFT
 * Analiza base de datos, geocercas, sesiones y cálculos de KPIs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para formatear duración
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Función Haversine para calcular distancia entre coordenadas GPS
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function auditoriaSistema() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  AUDITORÍA COMPLETA DEL SISTEMA DOBACKSOFT                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    try {
        // ============================================================
        // 1. ANÁLISIS DE BASE DE DATOS
        // ============================================================
        console.log('📊 1. ANÁLISIS DE BASE DE DATOS\n');
        console.log('─'.repeat(60));

        // Contar registros por tabla
        const sessionCount = await prisma.session.count();
        const vehicleCount = await prisma.vehicle.count();
        const rotativoCount = await prisma.rotativoMeasurement.count();
        const gpsCount = await prisma.gpsMeasurement.count();
        const stabilityEventCount = await prisma.stability_events.count();
        const geofenceCount = await prisma.geofence.count();

        console.log(`✅ Sesiones (Session): ${sessionCount}`);
        console.log(`✅ Vehículos (Vehicle): ${vehicleCount}`);
        console.log(`✅ Mediciones Rotativo: ${rotativoCount}`);
        console.log(`✅ Puntos GPS: ${gpsCount}`);
        console.log(`✅ Eventos de Estabilidad: ${stabilityEventCount}`);
        console.log(`✅ Geocercas (Geofence): ${geofenceCount}\n`);

        // ============================================================
        // 2. ANÁLISIS DE GEOCERCAS
        // ============================================================
        console.log('🗺️  2. ANÁLISIS DE GEOCERCAS\n');
        console.log('─'.repeat(60));

        const geofences = await prisma.geofence.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                coordinates: true
            }
        });

        if (geofences.length === 0) {
            console.log('⚠️  NO HAY GEOCERCAS CONFIGURADAS');
            console.log('   → Sin geocercas, NO se puede determinar "Tiempo en Parque"');
            console.log('   → Sin geocercas, NO se puede determinar "Tiempo en Taller"');
            console.log('   → Las claves del rotativo NO tienen contexto geográfico\n');
        } else {
            console.log(`✅ Geocercas configuradas: ${geofences.length}\n`);
            geofences.forEach(g => {
                console.log(`   • ${g.name} (${g.type})`);
                console.log(`     ID: ${g.id}`);
            });
            console.log();
        }

        // ============================================================
        // 3. ANÁLISIS DE VEHÍCULOS
        // ============================================================
        console.log('🚒 3. ANÁLISIS DE VEHÍCULOS\n');
        console.log('─'.repeat(60));

        const vehicles = await prisma.vehicle.findMany({
            select: {
                id: true,
                name: true,
                licensePlate: true,
                organizationId: true,
                _count: {
                    select: { sessions: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`Total de vehículos: ${vehicles.length}\n`);
        vehicles.forEach(v => {
            console.log(`   • ${v.name} (${v.licensePlate})`);
            console.log(`     Sesiones: ${v._count.sessions}`);
            console.log(`     ID: ${v.id}`);
        });
        console.log();

        // ============================================================
        // 4. ANÁLISIS DE SESIONES (MUESTRA)
        // ============================================================
        console.log('📋 4. ANÁLISIS DE SESIONES (últimas 5)\n');
        console.log('─'.repeat(60));

        const sessions = await prisma.session.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            include: {
                vehicle: { select: { name: true, licensePlate: true } },
                _count: {
                    select: {
                        RotativoMeasurement: true,
                        GpsMeasurement: true,
                        stability_events: true
                    }
                }
            }
        });

        if (sessions.length === 0) {
            console.log('⚠️  NO HAY SESIONES EN LA BASE DE DATOS\n');
        } else {
            sessions.forEach((s, idx) => {
                const duration = s.endTime && s.startTime
                    ? (new Date(s.endTime) - new Date(s.startTime)) / 1000
                    : 0;

                console.log(`\n📍 Sesión ${idx + 1}:`);
                console.log(`   ID: ${s.id}`);
                console.log(`   Vehículo: ${s.vehicle.name} (${s.vehicle.licensePlate})`);
                console.log(`   Inicio: ${s.startTime?.toLocaleString() || 'N/A'}`);
                console.log(`   Fin: ${s.endTime?.toLocaleString() || 'N/A'}`);
                console.log(`   Duración: ${formatDuration(duration)}`);
                console.log(`   Mediciones Rotativo: ${s._count.RotativoMeasurement}`);
                console.log(`   Puntos GPS: ${s._count.GpsMeasurement}`);
                console.log(`   Eventos Estabilidad: ${s._count.stability_events}`);
            });
            console.log();
        }

        // ============================================================
        // 5. ANÁLISIS DETALLADO DE UNA SESIÓN ESPECÍFICA
        // ============================================================
        console.log('🔬 5. ANÁLISIS DETALLADO DE UNA SESIÓN COMPLETA\n');
        console.log('─'.repeat(60));

        const sessionDetail = await prisma.session.findFirst({
            where: {
                RotativoMeasurement: { some: {} }, // Que tenga datos de rotativo
                GpsMeasurement: { some: {} }        // Y de GPS
            },
            include: {
                vehicle: true,
                RotativoMeasurement: {
                    select: { state: true, timestamp: true },
                    orderBy: { timestamp: 'asc' }
                },
                GpsMeasurement: {
                    select: { latitude: true, longitude: true, speed: true, timestamp: true },
                    orderBy: { timestamp: 'asc' }
                },
                stability_events: {
                    select: { type: true, severity: true, speed: true, timestamp: true }
                }
            }
        });

        if (!sessionDetail) {
            console.log('⚠️  NO HAY SESIONES CON DATOS COMPLETOS (Rotativo + GPS)\n');
        } else {
            console.log(`\n🎯 SESIÓN SELECCIONADA PARA ANÁLISIS:`);
            console.log(`   ID: ${sessionDetail.id}`);
            console.log(`   Vehículo: ${sessionDetail.vehicle.name}`);
            console.log(`   Inicio: ${sessionDetail.startTime?.toLocaleString()}`);
            console.log(`   Fin: ${sessionDetail.endTime?.toLocaleString()}\n`);

            // Analizar datos de Rotativo (Claves 0-5)
            console.log('🔑 ANÁLISIS DE CLAVES (ROTATIVO):\n');
            
            const statesDuration = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const rotativoData = sessionDetail.RotativoMeasurement;

            if (rotativoData.length < 2) {
                console.log('   ⚠️  Datos insuficientes para calcular duraciones\n');
            } else {
                for (let i = 0; i < rotativoData.length - 1; i++) {
                    const current = rotativoData[i];
                    const next = rotativoData[i + 1];
                    const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / 1000;
                    const state = parseInt(current.state);
                    
                    if (statesDuration.hasOwnProperty(state)) {
                        statesDuration[state] += duration;
                    }
                }

                console.log(`   Clave 0 (Taller): ${formatDuration(statesDuration[0])}`);
                console.log(`   Clave 1 (En Parque): ${formatDuration(statesDuration[1])}`);
                console.log(`   Clave 2 (Emergencia con rotativo): ${formatDuration(statesDuration[2])}`);
                console.log(`   Clave 3 (En Siniestro): ${formatDuration(statesDuration[3])}`);
                console.log(`   Clave 4 (Traslado/Fin Actuación): ${formatDuration(statesDuration[4])}`);
                console.log(`   Clave 5 (Regreso sin rotativo): ${formatDuration(statesDuration[5])}`);
                
                const totalTime = Object.values(statesDuration).reduce((a, b) => a + b, 0);
                console.log(`   TOTAL: ${formatDuration(totalTime)}\n`);

                // Calcular tiempo fuera de parque (2+3+4+5)
                const timeOutside = statesDuration[2] + statesDuration[3] + statesDuration[4] + statesDuration[5];
                console.log(`   ⏱️  Tiempo Fuera de Parque (2+3+4+5): ${formatDuration(timeOutside)}\n`);
            }

            // Analizar GPS y calcular kilómetros
            console.log('🛰️  ANÁLISIS DE GPS Y KILÓMETROS:\n');
            
            const gpsData = sessionDetail.GpsMeasurement;
            let totalKm = 0;
            let validPoints = 0;
            let invalidPoints = 0;

            if (gpsData.length < 2) {
                console.log('   ⚠️  Datos GPS insuficientes para calcular distancia\n');
            } else {
                for (let i = 0; i < gpsData.length - 1; i++) {
                    const current = gpsData[i];
                    const next = gpsData[i + 1];

                    // Validar coordenadas
                    if (!current.latitude || !current.longitude || !next.latitude || !next.longitude) {
                        invalidPoints++;
                        continue;
                    }

                    if (current.latitude === 0 && current.longitude === 0) {
                        invalidPoints++;
                        continue;
                    }

                    // Calcular distancia
                    const distance = haversine(current.latitude, current.longitude, next.latitude, next.longitude);

                    // Filtrar distancias imposibles (>5km entre puntos consecutivos)
                    if (distance > 5) {
                        invalidPoints++;
                        continue;
                    }

                    totalKm += distance;
                    validPoints++;
                }

                console.log(`   Puntos GPS totales: ${gpsData.length}`);
                console.log(`   Puntos válidos: ${validPoints}`);
                console.log(`   Puntos inválidos: ${invalidPoints}`);
                console.log(`   Kilómetros recorridos: ${totalKm.toFixed(2)} km\n`);

                // Calcular velocidad promedio
                if (timeOutside > 0) {
                    const avgSpeed = (totalKm / (timeOutside / 3600)).toFixed(2);
                    console.log(`   Velocidad promedio: ${avgSpeed} km/h\n`);
                }
            }

            // Analizar eventos de estabilidad
            console.log('⚠️  ANÁLISIS DE EVENTOS DE ESTABILIDAD:\n');
            
            const events = sessionDetail.stability_events;
            if (events.length === 0) {
                console.log('   ℹ️  No hay eventos de estabilidad registrados\n');
            } else {
                const eventTypes = {};
                events.forEach(e => {
                    eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
                });

                console.log(`   Total eventos: ${events.length}`);
                console.log('   Distribución por tipo:');
                Object.entries(eventTypes).forEach(([type, count]) => {
                    console.log(`      • ${type}: ${count}`);
                });
                console.log();
            }
        }

        // ============================================================
        // 6. RESUMEN DE PROBLEMAS DETECTADOS
        // ============================================================
        console.log('🚨 6. PROBLEMAS DETECTADOS\n');
        console.log('─'.repeat(60));

        const problemas = [];

        if (geofenceCount === 0) {
            problemas.push('❌ NO HAY GEOCERCAS configuradas → Tiempo en Parque/Taller NO se puede determinar correctamente');
        }

        if (sessionCount === 0) {
            problemas.push('❌ NO HAY SESIONES → No hay datos para calcular KPIs');
        }

        if (rotativoCount === 0) {
            problemas.push('❌ NO HAY DATOS DE ROTATIVO → No se pueden calcular tiempos por clave');
        }

        if (gpsCount === 0) {
            problemas.push('❌ NO HAY DATOS GPS → No se pueden calcular kilómetros');
        }

        if (problemas.length === 0) {
            console.log('✅ No se detectaron problemas críticos en la estructura de datos\n');
        } else {
            problemas.forEach(p => console.log(p));
            console.log();
        }

        // ============================================================
        // 7. RECOMENDACIONES
        // ============================================================
        console.log('💡 7. RECOMENDACIONES\n');
        console.log('─'.repeat(60));

        if (geofenceCount === 0) {
            console.log('1. CREAR GEOCERCAS de parques de bomberos');
            console.log('   → Usar frontend: Sección "Geofences"');
            console.log('   → O ejecutar script SQL para crear geocercas\n');
        }

        if (sessionCount === 0 || rotativoCount === 0 || gpsCount === 0) {
            console.log('2. PROCESAR ARCHIVOS DOBACK');
            console.log('   → Ejecutar: node backend/src/scripts/process-files.js');
            console.log('   → O subir archivos mediante UI\n');
        }

        console.log('3. VERIFICAR CÁLCULO DE KPIs');
        console.log('   → Endpoint: GET /api/kpis/summary');
        console.log('   → Comparar con cálculos manuales de esta auditoría\n');

        console.log('═'.repeat(60));
        console.log('AUDITORÍA COMPLETADA');
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('❌ Error durante auditoría:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar auditoría
auditoriaSistema();

