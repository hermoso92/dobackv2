const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Verificar tablas operational
    const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%operational%' OR table_name LIKE '%Operational%'
    `;
    
    console.log('Tablas encontradas:');
    console.log(JSON.stringify(tables, null, 2));
    
    // Verificar tipos enum
    const types = await prisma.$queryRaw`
        SELECT typname 
        FROM pg_type 
        WHERE typname LIKE '%operational%'
    `;
    
    console.log('\nTipos encontrados:');
    console.log(JSON.stringify(types, null, 2));
    
    // Verificar estructura de la tabla OperationalKey
    const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'OperationalKey'
    `;
    
    console.log('\nColumnas de OperationalKey:');
    console.log(JSON.stringify(columns, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
