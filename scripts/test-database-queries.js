/**
 * Script para probar las consultas de la base de datos directamente
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseQueries() {
    console.log('🧪 PROBANDO CONSULTAS DE BASE DE DATOS');
    console.log('=====================================\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        // Parámetros de prueba (mismo rango que el dashboard)
        const dateFrom = new Date('2025-09-29T00:00:00.000Z');
        const dateTo = new Date('2025-10-08T23:59:59.999Z');
        const organizationId = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

        console.log(`📅 Rango de fechas: ${dateFrom.toISOString()} a ${dateTo.toISOString()}`);
        console.log(`🏢 Organización: ${organizationId}\n`);

        // 1. Probar consulta de sesiones
        console.log('1. Probando consulta de sesiones...');
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: {
                        gte: dateFrom,
                        lte: dateTo
                    }
                },
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    vehicleId: true
                }
            });
            console.log(`   ✅ Sesiones encontradas: ${sessions.length}`);
        } catch (error) {
            console.log(`   ❌ Error en sesiones: ${error.message}`);
        }

        // 2. Probar consulta de GPS
        console.log('\n2. Probando consulta de GPS...');
        try {
            const gpsCount = await prisma.gpsMeasurement.count({
                where: {
                    timestamp: {
                        gte: dateFrom,
                        lte: dateTo
                    },
                    session: {
                        organizationId
                    }
                }
            });
            console.log(`   ✅ Mediciones GPS encontradas: ${gpsCount}`);
        } catch (error) {
            console.log(`   ❌ Error en GPS: ${error.message}`);
        }

        // 3. Probar consulta de rotativo
        console.log('\n3. Probando consulta de rotativo...');
        try {
            const rotativoCount = await prisma.rotativoMeasurement.count({
                where: {
                    timestamp: {
                        gte: dateFrom,
                        lte: dateTo
                    },
                    Session: {
                        organizationId
                    }
                }
            });
            console.log(`   ✅ Mediciones rotativo encontradas: ${rotativoCount}`);
        } catch (error) {
            console.log(`   ❌ Error en rotativo: ${error.message}`);
        }

        // 4. Probar consulta de eventos de estabilidad
        console.log('\n4. Probando consulta de eventos de estabilidad...');
        try {
            const eventsCount = await prisma.stability_events.count({
                where: {
                    timestamp: {
                        gte: dateFrom,
                        lte: dateTo
                    },
                    Session: {
                        organizationId
                    }
                }
            });
            console.log(`   ✅ Eventos de estabilidad encontrados: ${eventsCount}`);
        } catch (error) {
            console.log(`   ❌ Error en eventos de estabilidad: ${error.message}`);
        }

        // 5. Probar consulta de mediciones de estabilidad
        console.log('\n5. Probando consulta de mediciones de estabilidad...');
        try {
            const stabilityCount = await prisma.stabilityMeasurement.count({
                where: {
                    timestamp: {
                        gte: dateFrom,
                        lte: dateTo
                    },
                    session: {
                        organizationId
                    }
                }
            });
            console.log(`   ✅ Mediciones de estabilidad encontradas: ${stabilityCount}`);
        } catch (error) {
            console.log(`   ❌ Error en mediciones de estabilidad: ${error.message}`);
        }

        // 6. Probar la consulta exacta que usa el endpoint de KPIs
        console.log('\n6. Probando consulta exacta del endpoint KPIs...');
        try {
            // Obtener sessionIds primero
            const sessionIds = await prisma.session.findMany({
                where: {
                    organizationId,
                    startTime: {
                        gte: dateFrom,
                        lte: dateTo
                    }
                },
                select: { id: true }
            });

            const sessionIdList = sessionIds.map(s => s.id);
            console.log(`   📋 Session IDs encontrados: ${sessionIdList.length}`);

            if (sessionIdList.length > 0) {
                // Probar la consulta de eventos exacta
                const eventsWhere = { session_id: { in: sessionIdList } };
                const events = await prisma.stability_events.findMany({
                    where: eventsWhere,
                    select: { type: true, session_id: true }
                });
                console.log(`   ✅ Eventos encontrados con consulta exacta: ${events.length}`);
            }
        } catch (error) {
            console.log(`   ❌ Error en consulta exacta: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Error durante las pruebas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar pruebas
testDatabaseQueries().catch(console.error);
