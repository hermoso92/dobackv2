const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%operational%'
    `;
    
    console.log('Tablas operacionales encontradas:');
    console.log(JSON.stringify(tables, null, 2));
    
    await prisma.$disconnect();
}

main();
