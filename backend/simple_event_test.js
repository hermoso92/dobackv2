const { PrismaClient } = require('@prisma/client');

async function simpleEventTest() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Test simple de eventos');
        
        // Obtener última sesión
        const session = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        console.log('Sesión ID:', session?.id || 'N/A');
        
        if (!session) {
            console.log('❌ No hay sesiones');
            return;
        }
        
        // Contar eventos
        const count = await prisma.stability_events.count({
            where: { session_id: session.id }
        });
        
        console.log('Eventos encontrados:', count);
        
        // Contar puntos de estabilidad (tabla correcta)
        const stabilityCount = await prisma.stabilityMeasurement.count({
            where: { sessionId: session.id }
        });
        
        console.log('Puntos de estabilidad total:', stabilityCount);
        
        // Contar puntos críticos
        const criticalCount = await prisma.stabilityMeasurement.count({
            where: {
                sessionId: session.id,
                si: { lt: 0.5 }
            }
        });
        
        console.log('Puntos críticos (SI < 50%):', criticalCount);
        
        if (criticalCount > 0 && count === 0) {
            console.log('❌ HAY PUNTOS CRÍTICOS PERO NO HAY EVENTOS GUARDADOS');
            console.log('El problema está en el guardado, no en la generación');
        } else if (criticalCount === 0) {
            console.log('⚠️ No hay puntos críticos, por eso no hay eventos');
        } else {
            console.log('✅ Todo funcionando correctamente');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

simpleEventTest(); 