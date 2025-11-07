const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        await prisma.$connect();
        console.log('✅ Conectado a la base de datos');
        
        // Limpiar tipos temporales
        await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "UserRole_new" CASCADE');
        console.log('✅ UserRole_new eliminado');
        
        await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "OperationalKeyType_new" CASCADE');
        console.log('✅ OperationalKeyType_new eliminado');
        
        console.log('✅ Base de datos limpiada. Ahora puedes ejecutar: npx prisma db push --accept-data-loss');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fix();

