const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('🔍 Verificando datos en la base de datos...\n');
        
        // Verificar vehículos
        const vehicles = await prisma.vehicle.findMany({ take: 5 });
        console.log(`🚗 Vehículos: ${vehicles.length}`);
        vehicles.forEach(v => console.log(`  - ${v.name} (${v.id})`));
        
        // Verificar zonas
        const zones = await prisma.zone.findMany();
        console.log(`\n🏢 Zonas: ${zones.length}`);
        zones.forEach(z => console.log(`  - ${z.name} (${z.type}) - ${z.organizationId}`));
        
        // Verificar sesiones
        const sessions = await prisma.session.findMany({ take: 5 });
        console.log(`\n📅 Sesiones: ${sessions.length}`);
        sessions.forEach(s => console.log(`  - ${s.id} - ${s.startTime}`));
        
        // Verificar datos GPS
        const gpsCount = await prisma.gpsMeasurement.count();
        console.log(`\n📍 Puntos GPS: ${gpsCount}`);
        
        // Verificar eventos de estabilidad
        const stabilityCount = await prisma.stabilityEvent.count();
        console.log(`⚠️ Eventos estabilidad: ${stabilityCount}`);
        
        // Verificar mediciones rotativo
        const rotativoCount = await prisma.rotativoMeasurement.count();
        console.log(`🔄 Mediciones rotativo: ${rotativoCount}`);
        
        // Verificar organizaciones
        const orgs = await prisma.organization.findMany();
        console.log(`\n🏢 Organizaciones: ${orgs.length}`);
        orgs.forEach(o => console.log(`  - ${o.name} (${o.id})`));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData(); 