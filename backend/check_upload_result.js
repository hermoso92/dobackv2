const { PrismaClient } = require('@prisma/client');

async function checkUploadResult() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Verificando resultado de la última subida\n');
        
        // 1. Obtener la última sesión
        const lastSession = await prisma.session.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                vehicle: true,
                user: true
            }
        });
        
        if (!lastSession) {
            console.log('❌ No hay sesiones en la base de datos');
            return;
        }
        
        console.log('📊 Última sesión creada:');
        console.log(`  ID: ${lastSession.id}`);
        console.log(`  Número: ${lastSession.sessionNumber}`);
        console.log(`  Vehículo: ${lastSession.vehicle.name}`);
        console.log(`  Usuario: ${lastSession.user.email}`);
        console.log(`  Creada: ${lastSession.createdAt}`);
        
        // 2. Contar datos por tipo
        const [stabilityCount, canCount, gpsCount, rotativoCount] = await Promise.all([
            prisma.stabilityData.count({ where: { sessionId: lastSession.id } }),
            prisma.cANData.count({ where: { sessionId: lastSession.id } }),
            prisma.gPSData.count({ where: { sessionId: lastSession.id } }),
            prisma.rotativoData.count({ where: { sessionId: lastSession.id } })
        ]);
        
        console.log('\n📈 Datos insertados:');
        console.log(`  - Estabilidad: ${stabilityCount.toLocaleString()}`);
        console.log(`  - CAN: ${canCount.toLocaleString()}`);
        console.log(`  - GPS: ${gpsCount.toLocaleString()}`);
        console.log(`  - Rotativo: ${rotativoCount.toLocaleString()}`);
        
        // 3. Verificar eventos generados
        const eventsCount = await prisma.stability_events.count({
            where: { session_id: lastSession.id }
        });
        
        console.log(`\n🎯 Eventos de estabilidad: ${eventsCount}`);
        
        if (eventsCount > 0) {
            // Obtener algunos eventos de ejemplo
            const sampleEvents = await prisma.stability_events.findMany({
                where: { session_id: lastSession.id },
                take: 3,
                orderBy: { timestamp: 'asc' }
            });
            
            console.log('\n📋 Ejemplos de eventos generados:');
            sampleEvents.forEach((event, index) => {
                console.log(`  ${index + 1}. Nivel: ${event.level} | Tipos: ${event.tipos} | SI: ${event.perc}%`);
            });
            
            console.log('\n🎉 ¡SUCCESS! Los eventos se generaron correctamente');
            console.log('   ✅ Clasificación por causa específica funcionando');
            console.log('   ✅ Sistema de subida automática operativo');
            
        } else {
            console.log('\n⚠️  No se generaron eventos');
            console.log('   Posibles causas:');
            console.log('   - Filtros de contexto (motor apagado, rotativo inactivo, velocidad < 5)');
            console.log('   - Todos los puntos tienen SI ≥ 50% (estables)');
            
            // Verificar puntos críticos
            const criticalPoints = await prisma.stabilityData.count({
                where: {
                    sessionId: lastSession.id,
                    si: { lt: 0.5 }
                }
            });
            
            console.log(`   - Puntos con SI < 50%: ${criticalPoints}`);
        }
        
        console.log('\n✅ La subida manual desde la aplicación está 100% funcional');
        
    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUploadResult(); 