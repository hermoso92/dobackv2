const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('Organizaciones:');
  console.log(orgs);
  
  const users = await prisma.user.findMany();
  console.log('\nUsuarios:');
  users.forEach(u => console.log(`${u.email} - Org: ${u.organizationId}`));
  
  const vehicles = await prisma.vehicle.findMany();
  console.log('\nVehículos:');
  vehicles.forEach(v => console.log(`${v.name} - Org: ${v.organizationId}`));
}

main().then(() => process.exit(0)).catch(console.error); 