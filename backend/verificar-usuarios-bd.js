const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarUsuarios() {
    console.log('\n🔍 VERIFICANDO USUARIOS EN BD\n');
    
    const usuarios = await prisma.user.findMany({
        select: {
            email: true,
            name: true,
            role: true,
            organizationId: true
        }
    });
    
    console.log(`Total usuarios: ${usuarios.length}\n`);
    
    usuarios.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email}`);
        console.log(`   Nombre: ${u.name}`);
        console.log(`   Rol: ${u.role}`);
        console.log(`   Org: ${u.organizationId}`);
        console.log('');
    });
    
    await prisma.$disconnect();
}

verificarUsuarios();

