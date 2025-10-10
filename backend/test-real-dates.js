const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRealDates() {
    try {
        console.log('🔍 Verificando fechas reales en las ejecuciones de eventos...');
        
        // Obtener algunas ejecuciones de eventos
        const executions = await prisma.ejecucionEvento.findMany({
            take: 5,
            include: {
                event: true,
                session: true
            },
            orderBy: {
                triggeredAt: 'desc'
            }
        });

        console.log(`\n📊 Encontradas ${executions.length} ejecuciones:`);
        
        executions.forEach((execution, index) => {
            console.log(`\n--- Ejecución ${index + 1} ---`);
            console.log(`Evento: ${execution.event?.name || 'Desconocido'}`);
            console.log(`Fecha del evento (triggeredAt): ${execution.triggeredAt}`);
            console.log(`Fecha de la sesión (startTime): ${execution.session?.startTime || 'N/A'}`);
            console.log(`Datos del evento:`, JSON.stringify(execution.data, null, 2));
            
            // Verificar si la fecha es real o actual
            const now = new Date();
            const eventDate = new Date(execution.triggeredAt);
            const diffHours = Math.abs(now - eventDate) / (1000 * 60 * 60);
            
            if (diffHours < 1) {
                console.log(`⚠️  POSIBLE FECHA ACTUAL (diferencia: ${diffHours.toFixed(2)} horas)`);
            } else {
                console.log(`✅ FECHA REAL DEL EVENTO (diferencia: ${diffHours.toFixed(2)} horas)`);
            }
        });

        // Verificar sesiones con datos reales
        console.log('\n🔍 Verificando sesiones con datos para obtener timestamps reales...');
        
        const sessions = await prisma.session.findMany({
            take: 3,
            include: {
                gpsMeasurements: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                },
                stabilityMeasurements: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                },
                canMeasurements: {
                    take: 1,
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        sessions.forEach((session, index) => {
            console.log(`\n--- Sesión ${index + 1} ---`);
            console.log(`ID: ${session.id}`);
            console.log(`Inicio: ${session.startTime}`);
            
            if (session.gpsMeasurements.length > 0) {
                console.log(`GPS más reciente: ${session.gpsMeasurements[0].timestamp}`);
            }
            if (session.stabilityMeasurements.length > 0) {
                console.log(`Estabilidad más reciente: ${session.stabilityMeasurements[0].timestamp}`);
            }
            if (session.canMeasurements.length > 0) {
                console.log(`CAN más reciente: ${session.canMeasurements[0].timestamp}`);
            }
        });

    } catch (error) {
        console.error('❌ Error verificando fechas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRealDates(); 