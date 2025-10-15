/**
 * CALCULAR CLAVES OPERACIONALES PARA SESIONES EXISTENTES
 */

const { PrismaClient } = require('@prisma/client');
const { OperationalKeyCalculator } = require('./dist/services/OperationalKeyCalculator');

const prisma = new PrismaClient();

async function calcularClavesParaSesiones() {
    console.log('\n🔑 CALCULANDO CLAVES OPERACIONALES PARA SESIONES EXISTENTES\n');
    
    try {
        // Obtener sesiones del último mes sin claves calculadas
        const sesiones = await prisma.session.findMany({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
                startTime: {
                    gte: new Date('2025-10-01')
                }
            },
            include: {
                vehicle: true
            },
            take: 20
        });
        
        console.log(`📊 Sesiones encontradas: ${sesiones.length}\n`);
        
        let clavesCalculadas = 0;
        
        for (const sesion of sesiones) {
            console.log(`\n📍 Procesando sesión ${sesion.id.substring(0, 8)}...`);
            console.log(`   Vehículo: ${sesion.vehicle.name}`);
            console.log(`   Fecha: ${sesion.startTime.toISOString()}`);
            
            try {
                // Usar OperationalKeyCalculator para calcular claves
                const calculator = new OperationalKeyCalculator();
                const claves = await calculator.calcularClavesOperacionales(sesion.id);
                
                console.log(`   ✅ ${claves.length} claves calculadas`);
                clavesCalculadas += claves.length;
                
                // Mostrar resumen de claves
                const resumen = {};
                claves.forEach(c => {
                    if (!resumen[c.keyType]) resumen[c.keyType] = 0;
                    resumen[c.keyType]++;
                });
                console.log(`   📋 Resumen:`, resumen);
                
            } catch (error) {
                console.log(`   ⚠️  Error: ${error.message}`);
            }
        }
        
        console.log(`\n========================================`);
        console.log(`✅ COMPLETADO`);
        console.log(`   Total sesiones procesadas: ${sesiones.length}`);
        console.log(`   Total claves calculadas: ${clavesCalculadas}`);
        console.log(`========================================\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('   Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

calcularClavesParaSesiones().catch(console.error);

