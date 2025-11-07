const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos');
        
        // Verificar si hay usuarios con role USER
        const usersWithUserRole = await prisma.$queryRawUnsafe(`
            SELECT id, email, role FROM "User" WHERE role = 'USER'
        `);
        
        console.log(`📊 Encontrados ${usersWithUserRole.length} usuarios con role USER`);
        
        if (usersWithUserRole.length > 0) {
            // Actualizar todos los usuarios con role USER a MANAGER
            await prisma.$executeRawUnsafe(`
                UPDATE "User" SET role = 'MANAGER' WHERE role = 'USER'
            `);
            console.log('✅ Usuarios actualizados de USER a MANAGER');
        }
        
        console.log('✅ Base de datos actualizada. Ahora puedes ejecutar: npx prisma db push --accept-data-loss');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fix();

