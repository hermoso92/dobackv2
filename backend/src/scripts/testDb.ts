import { prisma } from '../lib/prisma';



async function main() {
    

    try {
        await prisma.$connect();
        console.log('✅ Conexión exitosa a la base de datos');

        const orgsCount = await prisma.organization.count();
        console.log(`📊 Número de organizaciones: ${orgsCount}`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        console.log('👋 Desconexión exitosa');
    }
}

main();
