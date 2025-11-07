const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        await prisma.$connect();
        
        // Verificar constraints
        const constraints = await prisma.$queryRawUnsafe(`
            SELECT conname, contype, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = '"OperationalKey"'::regclass
        `);
        
        console.log('Constraints de la tabla OperationalKey:');
        console.table(constraints);
        
        // Verificar defaults
        const defaults = await prisma.$queryRawUnsafe(`
            SELECT column_name, column_default
            FROM information_schema.columns
            WHERE table_name = 'OperationalKey' AND column_default IS NOT NULL
        `);
        
        console.log('\nDefaults de la tabla OperationalKey:');
        console.table(defaults);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();

