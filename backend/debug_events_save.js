const { PrismaClient } = require('@prisma/client');

async function debugEventsSave() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Debug: Por qué no se guardan los eventos\n');
        
        // 1. Obtener la última sesión
        const lastSession = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        if (!lastSession) {
            console.log('❌ No hay sesiones');
            return;
        }
        
        console.log('📊 Última sesión:', lastSession.id);
        
        // 2. Verificar si hay eventos para esta sesión
        const eventsCount = await prisma.stability_events.count({
            where: { session_id: lastSession.id }
        });
        
        console.log(`🎯 Eventos existentes en BBDD: ${eventsCount}`);
        
        if (eventsCount === 0) {
            console.log('\n❌ No hay eventos guardados');
            
            // 3. Probar crear un evento de prueba
            console.log('🧪 Creando evento de prueba...');
            
            try {
                const testEvent = await prisma.stability_events.create({
                    data: {
                        session_id: lastSession.id,
                        timestamp: new Date(),
                        lat: 40.4168,
                        lon: -3.7038,
                        type: 'test_event',
                        details: {
                            level: 'moderate',
                            perc: 45,
                            tipos: ['test'],
                            valores: { si: 0.45, roll: 0, ay: 1.2, yaw: 0.05 },
                            can: { engineRPM: 1500, vehicleSpeed: 50, rotativo: true }
                        }
                    }
                });
                
                console.log('✅ Evento de prueba creado:', testEvent.id);
                
                // Eliminar el evento de prueba
                await prisma.stability_events.delete({
                    where: { id: testEvent.id }
                });
                
                console.log('🧹 Evento de prueba eliminado');
                console.log('\n💡 La tabla funciona correctamente');
                console.log('❓ El problema puede ser:');
                console.log('   1. Los eventos no se generan (filtros muy estrictos)');
                console.log('   2. Error en la función generateStabilityEvents');
                console.log('   3. Error en la validación de timestamps');
                
            } catch (createError) {
                console.error('❌ Error creando evento de prueba:', createError.message);
                console.log('\n💡 Hay un problema con la tabla o campos');
            }
            
        } else {
            console.log(`✅ Hay ${eventsCount} eventos guardados`);
            
            // Mostrar algunos ejemplos
            const sampleEvents = await prisma.stability_events.findMany({
                where: { session_id: lastSession.id },
                take: 3,
                orderBy: { timestamp: 'asc' }
            });
            
            console.log('\n📋 Eventos de ejemplo:');
            sampleEvents.forEach((event, i) => {
                const details = event.details || {};
                console.log(`  ${i + 1}. ${details.level || 'N/A'} | ${details.tipos || 'N/A'} | SI: ${details.perc || 'N/A'}%`);
            });
        }
        
        // 4. Verificar datos de entrada
        const stabilityCount = await prisma.stabilityData.count({
            where: { sessionId: lastSession.id }
        });
        
        const criticalPoints = await prisma.stabilityData.count({
            where: {
                sessionId: lastSession.id,
                si: { lt: 0.5 }
            }
        });
        
        console.log(`\n📈 Datos de entrada:`);
        console.log(`   - Puntos de estabilidad: ${stabilityCount}`);
        console.log(`   - Puntos críticos (SI < 50%): ${criticalPoints}`);
        
        if (criticalPoints === 0) {
            console.log('⚠️  Todos los puntos son estables (SI ≥ 50%)');
            console.log('   Por eso no se generan eventos');
        }
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugEventsSave(); 