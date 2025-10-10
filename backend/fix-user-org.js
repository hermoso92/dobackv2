const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserOrganizations() {
  try {
    console.log('🔍 Verificando usuarios y organizaciones...');
    
    // Verificar organizaciones existentes
    const orgs = await prisma.organization.findMany();
    console.log('\n🏢 ORGANIZACIONES:');
    orgs.forEach(org => console.log(`  ${org.id} - ${org.name}`));
    
    // Verificar usuarios existentes
    const users = await prisma.user.findMany({
      include: { organization: true }
    });
    console.log('\n👥 USUARIOS:');
    users.forEach(user => {
      console.log(`  ${user.email} - OrgId: ${user.organizationId} - Org: ${user.organization?.name || 'SIN ORG'}`);
    });
    
    // Buscar usuarios sin organización válida
    const usersWithoutOrg = users.filter(u => !u.organizationId || !u.organization);
    console.log(`\n⚠️  USUARIOS SIN ORGANIZACIÓN: ${usersWithoutOrg.length}`);
    
    if (usersWithoutOrg.length > 0 && orgs.length > 0) {
      console.log('\n🔧 Asignando organización a usuarios sin org...');
      
      // Usar la primera organización disponible
      const defaultOrg = orgs[0];
      
      for (const user of usersWithoutOrg) {
        console.log(`  Asignando ${user.email} a ${defaultOrg.name}`);
        await prisma.user.update({
          where: { id: user.id },
          data: { organizationId: defaultOrg.id }
        });
      }
      
      console.log('✅ Usuarios actualizados correctamente');
    }
    
    // Verificar vehículos
    const vehicles = await prisma.vehicle.findMany({
      include: { organization: true }
    });
    console.log('\n🚗 VEHÍCULOS POR ORGANIZACIÓN:');
    orgs.forEach(org => {
      const orgVehicles = vehicles.filter(v => v.organizationId === org.id);
      console.log(`  ${org.name}: ${orgVehicles.length} vehículos`);
      orgVehicles.forEach(v => console.log(`    - ${v.name} (${v.licensePlate})`));
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

fixUserOrganizations(); 