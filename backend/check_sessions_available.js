const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
  try {
    console.log('🔍 Verificando sesiones disponibles...');
    
    const totalSessions = await prisma.session.count({
      where: { organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0' }
    });
    
    console.log(`📊 Total de sesiones: ${totalSessions}`);
    
    if (totalSessions === 0) {
      console.log('⚠️ No hay sesiones disponibles');
      return;
    }
    
    const sessions = await prisma.session.findMany({
      where: { organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0' },
      include: { vehicle: true },
      orderBy: { startTime: 'desc' },
      take: 5
    });
    
    console.log('\n📋 Últimas 5 sesiones:');
    sessions.forEach((s, i) => {
      const date = s.startTime.toISOString().split('T')[0];
      const vehicle = s.vehicle?.licensePlate || 'N/A';
      console.log(`${i+1}. ${vehicle} - ${date} - Sesión #${s.sessionNumber}`);
    });
    
    if (sessions.length > 0) {
      const earliestDate = sessions[sessions.length - 1].startTime.toISOString().split('T')[0];
      const latestDate = sessions[0].startTime.toISOString().split('T')[0];
      console.log(`\n🗓️ Rango de fechas: ${earliestDate} a ${latestDate}`);
      
      // Sugerir fechas para el reporte
      console.log('\n💡 Fechas sugeridas para el reporte:');
      console.log(`   Inicio: ${earliestDate}`);
      console.log(`   Fin: ${latestDate}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions(); 