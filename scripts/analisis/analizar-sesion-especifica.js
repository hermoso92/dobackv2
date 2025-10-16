/**
 * Analizar una sesión específica en detalle
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analizarSesion(sessionId) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('ANÁLISIS DETALLADO DE SESIÓN');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Obtener sesión con todos los datos
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                vehicle: true,
                RotativoMeasurement: {
                    orderBy: { timestamp: 'asc' }
                },
                GpsMeasurement: {
                    orderBy: { timestamp: 'asc' }
                },
                stability_events: true
            }
        });

        if (!session) {
            console.log('❌ Sesión no encontrada');
            return;
        }

        console.log('📍 INFORMACIÓN DE LA SESIÓN:');
        console.log(`   ID: ${session.id}`);
        console.log(`   Vehículo: ${session.vehicle.name} (${session.vehicle.licensePlate})`);
        console.log(`   Inicio: ${session.startTime?.toLocaleString()}`);
        console.log(`   Fin: ${session.endTime?.toLocaleString()}\n`);

        // Analizar ROTATIVO
        console.log('🔑 ANÁLISIS DE MEDICIONES ROTATIVO:');
        console.log(`   Total mediciones: ${session.RotativoMeasurement.length}\n`);

        if (session.RotativoMeasurement.length === 0) {
            console.log('   ⚠️  NO HAY MEDICIONES DE ROTATIVO\n');
        } else {
            // Contar por clave
            const countByState = {};
            session.RotativoMeasurement.forEach(m => {
                const state = m.state;
                countByState[state] = (countByState[state] || 0) + 1;
            });

            console.log('   Distribución por clave:');
            Object.entries(countByState).sort((a, b) => a[0] - b[0]).forEach(([state, count]) => {
                const percentage = ((count / session.RotativoMeasurement.length) * 100).toFixed(2);
                console.log(`      Clave ${state}: ${count} mediciones (${percentage}%)`);
            });

            // Mostrar primeras 10 mediciones
            console.log('\n   Primeras 10 mediciones:');
            session.RotativoMeasurement.slice(0, 10).forEach((m, idx) => {
                console.log(`      ${idx + 1}. ${m.timestamp.toISOString()} - Clave ${m.state}`);
            });

            // Mostrar últimas 10 mediciones
            if (session.RotativoMeasurement.length > 10) {
                console.log('\n   Últimas 10 mediciones:');
                session.RotativoMeasurement.slice(-10).forEach((m, idx) => {
                    console.log(`      ${idx + 1}. ${m.timestamp.toISOString()} - Clave ${m.state}`);
                });
            }
        }

        // Analizar GPS
        console.log('\n\n🛰️  ANÁLISIS DE PUNTOS GPS:');
        console.log(`   Total puntos: ${session.GpsMeasurement.length}\n`);

        if (session.GpsMeasurement.length === 0) {
            console.log('   ⚠️  NO HAY PUNTOS GPS\n');
        } else {
            // Validar coordenadas
            let validPoints = 0;
            let invalidPoints = 0;

            session.GpsMeasurement.forEach(g => {
                if (g.latitude !== 0 && g.longitude !== 0 && 
                    g.latitude >= -90 && g.latitude <= 90 &&
                    g.longitude >= -180 && g.longitude <= 180) {
                    validPoints++;
                } else {
                    invalidPoints++;
                }
            });

            console.log(`   Puntos válidos: ${validPoints}`);
            console.log(`   Puntos inválidos: ${invalidPoints}\n`);

            // Mostrar primeros 5 puntos
            console.log('   Primeros 5 puntos GPS:');
            session.GpsMeasurement.slice(0, 5).forEach((g, idx) => {
                console.log(`      ${idx + 1}. ${g.timestamp.toISOString()}`);
                console.log(`         Coords: (${g.latitude}, ${g.longitude})`);
                console.log(`         Speed: ${g.speed} km/h`);
            });
        }

        // Analizar eventos
        console.log('\n\n⚠️  ANÁLISIS DE EVENTOS:');
        console.log(`   Total eventos: ${session.stability_events.length}\n`);

        if (session.stability_events.length > 0) {
            // Contar por tipo
            const countByType = {};
            session.stability_events.forEach(e => {
                countByType[e.type] = (countByType[e.type] || 0) + 1;
            });

            console.log('   Distribución por tipo:');
            Object.entries(countByType).forEach(([type, count]) => {
                console.log(`      ${type}: ${count}`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('ANÁLISIS COMPLETADO');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar con el primer sessionId del diagnóstico
const sessionId = process.argv[2] || '96b50bd0-d948-4b7a-b52a-fcdfc8bd7673';

console.log(`\n🔍 Analizando sesión: ${sessionId}\n`);
analizarSesion(sessionId);

