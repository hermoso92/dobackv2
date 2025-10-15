/**
 * 🔍 VERIFICAR SESIONES CREADAS
 * 
 * Comprueba las sesiones guardadas en BD y compara con análisis real
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarSesiones() {
    console.log('🔍 VERIFICACIÓN DE SESIONES CREADAS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Contar sesiones
        const totalSessions = await prisma.session.count({});
        console.log(`📊 Total sesiones en BD: ${totalSessions}\n`);

        if (totalSessions === 0) {
            console.log('⚠️  No hay sesiones en la base de datos\n');
            return;
        }

        // Obtener sesiones por vehículo
        const sessions = await prisma.session.findMany({
            include: {
                Vehicle: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Agrupar por vehículo
        const sessionsByVehicle = {};
        sessions.forEach(session => {
            const vehicleId = session.Vehicle.identifier;
            if (!sessionsByVehicle[vehicleId]) {
                sessionsByVehicle[vehicleId] = [];
            }
            sessionsByVehicle[vehicleId].push(session);
        });

        console.log('📋 SESIONES POR VEHÍCULO:\n');

        for (const [vehicleId, vehicleSessions] of Object.entries(sessionsByVehicle)) {
            console.log(`🚗 ${vehicleId.toUpperCase()} (${vehicleSessions.length} sesiones):\n`);

            // Agrupar por fecha
            const sessionsByDate = {};
            vehicleSessions.forEach(session => {
                const date = session.startTime.toISOString().split('T')[0];
                if (!sessionsByDate[date]) {
                    sessionsByDate[date] = [];
                }
                sessionsByDate[date].push(session);
            });

            for (const [date, dateSessions] of Object.entries(sessionsByDate)) {
                const [year, month, day] = date.split('-');
                console.log(`   📅 ${day}/${month}/${year}:`);

                dateSessions.forEach((session, index) => {
                    const startTime = session.startTime.toTimeString().split(' ')[0];
                    const endTime = session.endTime ? session.endTime.toTimeString().split(' ')[0] : 'N/A';
                    const duration = session.endTime 
                        ? Math.round((session.endTime - session.startTime) / 1000 / 60)
                        : 0;

                    console.log(`      • Sesión ${index + 1}: ${startTime} - ${endTime} (${duration} min)`);
                });
                console.log();
            }
        }

        // Verificar mediciones
        console.log('📊 MEDICIONES:\n');
        
        const stabilityCount = await prisma.stabilityMeasurement.count({});
        const gpsCount = await prisma.gpsMeasurement.count({});
        const rotativoCount = await prisma.rotativoMeasurement.count({});

        console.log(`   • ESTABILIDAD: ${stabilityCount.toLocaleString()}`);
        console.log(`   • GPS: ${gpsCount.toLocaleString()}`);
        console.log(`   • ROTATIVO: ${rotativoCount.toLocaleString()}`);
        console.log();

        // Comparación con análisis real
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 COMPARACIÓN CON ANÁLISIS REAL');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Ejemplo esperado para DOBACK024 - 30/09/2025
        if (sessionsByVehicle['doback024']) {
            const doback024Sessions = sessionsByVehicle['doback024'];
            const sept30Sessions = doback024Sessions.filter(s => {
                const date = s.startTime.toISOString().split('T')[0];
                return date === '2025-09-30';
            });

            console.log('🚗 DOBACK024 - 30/09/2025:\n');
            console.log(`   Encontradas: ${sept30Sessions.length} sesiones`);
            console.log(`   Esperadas (según análisis real): 2 sesiones\n`);

            if (sept30Sessions.length > 0) {
                console.log('   Detalle:\n');
                sept30Sessions.forEach((s, i) => {
                    const start = s.startTime.toTimeString().split(' ')[0];
                    const end = s.endTime ? s.endTime.toTimeString().split(' ')[0] : 'N/A';
                    const duration = s.endTime 
                        ? Math.round((s.endTime - s.startTime) / 1000 / 60)
                        : 0;
                    console.log(`      Sesión ${i + 1}: ${start} - ${end} (${duration} min)`);
                });
                console.log();

                console.log('   Esperado según análisis real:\n');
                console.log('      Sesión 1: 09:33:37 - 10:38:25 (65 min) ✅ Con GPS');
                console.log('      Sesión 2: 12:41:43 - 14:05:48 (84 min) ⚠️ Sin GPS\n');
            }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ VERIFICACIÓN COMPLETADA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verificarSesiones();

