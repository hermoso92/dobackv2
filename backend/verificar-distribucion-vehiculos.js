const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificar() {
    console.log('\n📊 DISTRIBUCIÓN DE DATOS POR VEHÍCULO\n');
    console.log('='.repeat(80) + '\n');
    
    const vehicles = await prisma.vehicle.findMany({
        where: { organizationId: 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26' },
        select: { id: true, name: true, identifier: true }
    });
    
    console.log(`Total vehículos: ${vehicles.length}\n`);
    
    for (const vehicle of vehicles) {
        console.log(`🚗 ${vehicle.name} (${vehicle.identifier})`);
        console.log(`   ID: ${vehicle.id}\n`);
        
        // Contar sesiones
        const sesiones = await prisma.session.count({
            where: { vehicleId: vehicle.id }
        });
        
        // Contar eventos
        const sessionIds = await prisma.session.findMany({
            where: { vehicleId: vehicle.id },
            select: { id: true }
        });
        
        const eventos = await prisma.stabilityEvent.count({
            where: { session_id: { in: sessionIds.map(s => s.id) } }
        });
        
        // Calcular KM aproximados
        const gpsCount = await prisma.gpsMeasurement.count({
            where: { sessionId: { in: sessionIds.map(s => s.id) } }
        });
        
        console.log(`   📊 Sesiones: ${sesiones}`);
        console.log(`   📊 Eventos: ${eventos}`);
        console.log(`   📊 Puntos GPS: ${gpsCount}`);
        console.log('');
    }
    
    console.log('='.repeat(80));
    console.log('\n💡 INTERPRETACIÓN:\n');
    console.log('   Si TODOS los vehículos tienen los MISMOS números:');
    console.log('   → Los filtros pueden estar funcionando pero los datos son idénticos\n');
    console.log('   Si cada vehículo tiene DIFERENTES números:');
    console.log('   → Los filtros DEBERÍAN funcionar\n');
    
    await prisma.$disconnect();
}

verificar();

