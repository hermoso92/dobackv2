/**
 * Script para diagnosticar por qué los KPIs aparecen en 0
 * Verifica datos en la base de datos y el endpoint de KPIs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseKPIZeros() {
    console.log('🔍 DIAGNÓSTICO DE KPIs EN CERO');
    console.log('================================\n');

    try {
        // 1. Verificar conexión a la base de datos
        console.log('1. Verificando conexión a la base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        // 2. Verificar datos de sesiones
        console.log('2. Verificando sesiones en la base de datos...');
        const totalSessions = await prisma.session.count();
        console.log(`   Total de sesiones: ${totalSessions}`);

        if (totalSessions > 0) {
            const recentSessions = await prisma.session.findMany({
                take: 5,
                orderBy: { startTime: 'desc' },
                select: {
                    id: true,
                    startTime: true,
                    endTime: true,
                    vehicleId: true,
                    organizationId: true
                }
            });
            console.log('   Últimas 5 sesiones:');
            recentSessions.forEach(session => {
                console.log(`   - ${session.id}: ${session.startTime} - ${session.endTime || 'En curso'} (Vehículo: ${session.vehicleId})`);
            });
        }
        console.log('');

        // 3. Verificar datos GPS
        console.log('3. Verificando datos GPS...');
        const totalGPS = await prisma.gpsMeasurement.count();
        console.log(`   Total de mediciones GPS: ${totalGPS}`);

        if (totalGPS > 0) {
            const recentGPS = await prisma.gpsMeasurement.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                select: {
                    sessionId: true,
                    timestamp: true,
                    latitude: true,
                    longitude: true,
                    speed: true
                }
            });
            console.log('   Últimas 5 mediciones GPS:');
            recentGPS.forEach(gps => {
                console.log(`   - ${gps.sessionId}: ${gps.timestamp} - Lat: ${gps.latitude}, Lon: ${gps.longitude}, Vel: ${gps.speed} km/h`);
            });
        }
        console.log('');

        // 4. Verificar datos de rotativo
        console.log('4. Verificando datos de rotativo...');
        const totalRotativo = await prisma.rotativoMeasurement.count();
        console.log(`   Total de mediciones de rotativo: ${totalRotativo}`);

        if (totalRotativo > 0) {
            const recentRotativo = await prisma.rotativoMeasurement.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                select: {
                    sessionId: true,
                    timestamp: true,
                    state: true
                }
            });
            console.log('   Últimas 5 mediciones de rotativo:');
            recentRotativo.forEach(rot => {
                console.log(`   - ${rot.sessionId}: ${rot.timestamp} - Estado: ${rot.state}`);
            });
        }
        console.log('');

        // 5. Verificar eventos de estabilidad
        console.log('5. Verificando eventos de estabilidad...');
        try {
            const totalEvents = await prisma.stabilityEvent.count();
            console.log(`   Total de eventos de estabilidad: ${totalEvents}`);
        } catch (error) {
            console.log(`   Error accediendo a eventos de estabilidad: ${error.message}`);
            console.log(`   Probablemente la tabla no existe o tiene otro nombre`);
        }

        // Intentar obtener eventos si la tabla existe
        try {
            const recentEvents = await prisma.stabilityEvent.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                select: {
                    session_id: true,
                    timestamp: true,
                    type: true
                }
            });
            if (recentEvents.length > 0) {
                console.log('   Últimos 5 eventos:');
                recentEvents.forEach(event => {
                    console.log(`   - ${event.session_id}: ${event.timestamp} - Tipo: ${event.type}`);
                });
            }
        } catch (error) {
            console.log('   No se pudieron obtener eventos de estabilidad');
        }
        console.log('');

        // 6. Verificar organizaciones
        console.log('6. Verificando organizaciones...');
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true
            }
        });
        console.log(`   Total de organizaciones: ${organizations.length}`);
        organizations.forEach(org => {
            console.log(`   - ${org.id}: ${org.name}`);
        });
        console.log('');

        // 7. Verificar vehículos
        console.log('7. Verificando vehículos...');
        const totalVehicles = await prisma.vehicle.count();
        console.log(`   Total de vehículos: ${totalVehicles}`);

        if (totalVehicles > 0) {
            const vehicles = await prisma.vehicle.findMany({
                take: 5,
                select: {
                    id: true,
                    name: true,
                    organizationId: true
                }
            });
            console.log('   Primeros 5 vehículos:');
            vehicles.forEach(vehicle => {
                console.log(`   - ${vehicle.id}: ${vehicle.name} (Org: ${vehicle.organizationId})`);
            });
        }
        console.log('');

        // 8. Simular consulta de KPIs para el rango de fechas mostrado en el dashboard
        console.log('8. Simulando consulta de KPIs para el rango 2025-09-29 a 2025-10-08...');
        const dateFrom = new Date('2025-09-29T00:00:00.000Z');
        const dateTo = new Date('2025-10-08T23:59:59.999Z');
        
        console.log(`   Rango: ${dateFrom.toISOString()} a ${dateTo.toISOString()}`);

        // Buscar sesiones en ese rango
        const sessionsInRange = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: dateFrom,
                    lte: dateTo
                }
            },
            select: {
                id: true,
                startTime: true,
                endTime: true,
                vehicleId: true,
                organizationId: true
            }
        });
        console.log(`   Sesiones en rango: ${sessionsInRange.length}`);

        if (sessionsInRange.length > 0) {
            const sessionIds = sessionsInRange.map(s => s.id);
            
            // Verificar GPS en rango
            const gpsInRange = await prisma.gpsMeasurement.count({
                where: {
                    sessionId: { in: sessionIds },
                    timestamp: { gte: dateFrom, lte: dateTo }
                }
            });
            console.log(`   Mediciones GPS en rango: ${gpsInRange}`);

            // Verificar rotativo en rango
            const rotativoInRange = await prisma.rotativoMeasurement.count({
                where: {
                    sessionId: { in: sessionIds },
                    timestamp: { gte: dateFrom, lte: dateTo }
                }
            });
            console.log(`   Mediciones rotativo en rango: ${rotativoInRange}`);

            // Verificar eventos en rango
            const eventsInRange = await prisma.stabilityEvent.count({
                where: {
                    session_id: { in: sessionIds },
                    timestamp: { gte: dateFrom, lte: dateTo }
                }
            });
            console.log(`   Eventos de estabilidad en rango: ${eventsInRange}`);
        }

        console.log('\n✅ Diagnóstico completado');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar diagnóstico
diagnoseKPIZeros().catch(console.error);
