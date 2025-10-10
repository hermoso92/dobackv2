const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('\n🔍 VERIFICANDO USUARIOS EN LA BD\n');
    
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true
        }
    });
    
    console.log(`📊 Total usuarios: ${users.length}\n`);
    
    users.forEach((user, idx) => {
        console.log(`${idx + 1}. Email: ${user.email}`);
        console.log(`   Nombre: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Org ID: ${user.organizationId}`);
        console.log('');
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(err => {
        console.error(err);
        prisma.$disconnect();
    });

