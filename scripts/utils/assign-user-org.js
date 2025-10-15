const { PrismaClient } = require("../../backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main(){
  const orgId = "a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26";
  const email = "antoniohermoso92@gmail.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { console.log(JSON.stringify({ updated:false, reason:"user_not_found" })); return; }
  const updated = await prisma.user.update({ where: { id: user.id }, data: { organizationId: orgId, role: "ADMIN" } });
  console.log(JSON.stringify({ updated:true, userId: updated.id, organizationId: updated.organizationId, role: updated.role }));
}

main().then(()=>prisma.$disconnect()).catch(async (e)=>{ console.error(e); await prisma.$disconnect(); process.exit(1); });
