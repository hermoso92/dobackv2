import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany();
    console.log('\n📋 Usuarios en la base de datos:\n');
    users.forEach(u => {
        console.log(`Username: ${u.username}`);
        console.log(`Email: ${u.email}`);
        console.log(`Rol: ${u.role}`);
        console.log(`Activo: ${u.isActive}`);
        console.log('---');
    });
    await prisma.$disconnect();
}

listUsers();

