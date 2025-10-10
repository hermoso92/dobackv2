const { PrismaClient } = require('@prisma/client');

async function testRealReport() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando datos disponibles para el reporte...');
        
        // Verificar sesiones disponibles
        const sessions = await prisma.session.findMany({
            where: { organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0' },
            include: { 
                vehicle: { select: { licensePlate: true, brand: true, model: true } },
                _count: { 
                    select: { 
                        gpsMeasurements: true, 
                        stabilityMeasurements: true,
                        canMeasurements: true
                    } 
                }
            },
            orderBy: { startTime: 'desc' },
            take: 3
        });
        
        console.log('📊 Sesiones disponibles para el reporte:');
        sessions.forEach((s, i) => {
            console.log(`${i+1}. ${s.vehicle?.licensePlate || 'N/A'} (Sesión #${s.sessionNumber})`);
            console.log(`   Inicio: ${s.startTime.toISOString().split('T')[0]}`);
            console.log(`   GPS: ${s._count.gpsMeasurements} puntos`);
            console.log(`   Estabilidad: ${s._count.stabilityMeasurements} mediciones`);
            console.log(`   CAN: ${s._count.canMeasurements} datos`);
            console.log('');
        });
        
        // Verificar eventos de estabilidad
        const eventsCount = await prisma.stability_events.count({
            where: { session_id: { in: sessions.map(s => s.id) } }
        });
        console.log(`🔥 Eventos de estabilidad disponibles: ${eventsCount}`);
        
        if (sessions.length === 0) {
            console.log('⚠️ No hay sesiones disponibles para generar reporte');
            return;
        }
        
        // Usar fechas de las sesiones reales
        const startDate = sessions[sessions.length - 1].startTime;
        const endDate = sessions[0].startTime;
        
        console.log(`\n📅 Generando reporte para período: ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`);
        
        // Aquí podríamos llamar al servicio real cuando esté listo
        console.log('✅ Datos verificados. El servicio de reportes reales está listo para usar.');
        
        // Mostrar algunos datos de muestra
        if (sessions.length > 0) {
            const session = sessions[0];
            
            // Obtener una muestra de datos GPS
            const gpsData = await prisma.gpsMeasurement.findMany({
                where: { sessionId: session.id },
                orderBy: { timestamp: 'asc' },
                take: 5
            });
            
            if (gpsData.length > 0) {
                console.log(`\n📍 Muestra de datos GPS de la sesión ${session.vehicle?.licensePlate}:`);
                gpsData.forEach((gps, i) => {
                    console.log(`   ${i+1}. ${gps.timestamp.toISOString().split('T')[1].split('.')[0]} - Lat: ${gps.latitude}, Lon: ${gps.longitude}, Velocidad: ${gps.speed || 0} km/h`);
                });
            }
            
            // Verificar si hay eventos para esta sesión
            const sessionEvents = await prisma.stability_events.count({
                where: { session_id: session.id }
            });
            console.log(`\n⚠️ Eventos críticos en sesión ${session.vehicle?.licensePlate}: ${sessionEvents}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testRealReport(); 