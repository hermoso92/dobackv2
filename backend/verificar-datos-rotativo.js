const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarRotativo() {
    console.log('\n🔄 VERIFICANDO DATOS DE ROTATIVO\n');
    
    try {
        const sesion = await prisma.session.findFirst({
            where: {
                organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26',
                startTime: {
                    gte: new Date('2025-10-01')
                }
            },
            include: {
                vehicle: true
            }
        });
        
        if (!sesion) {
            console.log('❌ No hay sesiones');
            return;
        }
        
        console.log(`📊 Sesión: ${sesion.id.substring(0, 8)}`);
        console.log(`   Vehículo: ${sesion.vehicle.name}`);
        console.log(`   Fecha: ${sesion.startTime.toISOString()}\n`);
        
        const rotativoData = await prisma.rotativoMeasurement.findMany({
            where: {
                sessionId: sesion.id
            },
            orderBy: {
                timestamp: 'asc'
            },
            take: 100
        });
        
        console.log(`📍 Datos de rotativo encontrados: ${rotativoData.length}\n`);
        
        if (rotativoData.length > 0) {
            console.log('📋 Primeros 10 registros:');
            rotativoData.slice(0, 10).forEach((r, i) => {
                console.log(`   ${i+1}. ${r.timestamp.toISOString()} - Estado: ${r.state} - Clave: ${r.key}`);
            });
            
            // Contar cambios de estado
            let cambios = 0;
            for (let i = 1; i < rotativoData.length; i++) {
                if (rotativoData[i].state !== rotativoData[i-1].state) {
                    cambios++;
                }
            }
            console.log(`\n   📊 Cambios de estado detectados: ${cambios}`);
            
            // Contar cambios de clave
            let cambiosClav = 0;
            for (let i = 1; i < rotativoData.length; i++) {
                if (rotativoData[i].key !== rotativoData[i-1].key) {
                    cambiosClav++;
                }
            }
            console.log(`   🔑 Cambios de clave detectados: ${cambiosClav}\n`);
        } else {
            console.log('⚠️  No hay datos de rotativo para esta sesión\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarRotativo().catch(console.error);

