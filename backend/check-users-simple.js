const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true,
            name: true
        }
    });
    
    console.log('\nUsuarios disponibles:');
    users.forEach(u => {
        console.log(`- ${u.email} (${u.role}) - ${u.name}`);
    });
    
    await prisma.$disconnect();
}

checkUsers();

