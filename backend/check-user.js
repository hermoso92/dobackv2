const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function checkCurrentUser() {
  try {
    // Primero verificar si hay organizaciones
    const orgs = await prisma.organization.findMany();
    console.log('🏢 ORGANIZACIONES:', orgs.length);
    if (orgs.length > 0) {
      orgs.forEach(org => console.log(`  ${org.id} - ${org.name}`));
    } else {
      console.log('  ❌ NO HAY ORGANIZACIONES');
    }
    
    // Verificar usuarios y sus organizaciones
    const users = await prisma.user.findMany({
      include: { organization: true }
    });
    console.log('\n👥 USUARIOS:', users.length);
    users.forEach(user => {
      console.log(`  ${user.email} - OrgId: ${user.organizationId} - Org: ${user.organization?.name || 'SIN ORG'}`);
    });
    
    // Verificar vehículos
    const vehicles = await prisma.vehicle.findMany({
      include: { organization: true }
    });
    console.log('\n🚗 VEHÍCULOS:', vehicles.length);
    vehicles.forEach(v => {
      console.log(`  ${v.name} (${v.licensePlate}) - OrgId: ${v.organizationId} - Org: ${v.organization?.name || 'SIN ORG'}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkCurrentUser(); 