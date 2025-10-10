const { PrismaClient } = require('@prisma/client');

async function checkUsers() {
    const prisma = new PrismaClient();
    
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                organizationId: true
            }
        });
        
        console.log('👥 Usuarios en la base de datos:');
        users.forEach(user => {
            console.log(`- Email: ${user.email}`);
            console.log(`  Nombre: ${user.name || 'N/A'}`);
            console.log(`  Rol: ${user.role}`);
            console.log(`  Org ID: ${user.organizationId}`);
            console.log('');
        });
        
        if (users.length === 0) {
            console.log('❌ No hay usuarios en la base de datos');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers(); 