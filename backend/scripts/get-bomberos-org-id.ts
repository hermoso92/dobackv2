import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getBomberosOrgId() {
    try {
        const organization = await prisma.organization.findFirst({
            where: {
                name: {
                    contains: 'Bomberos',
                    mode: 'insensitive'
                }
            }
        });

        if (organization) {
            console.log('✅ Organización encontrada:');
            console.log(`   ID: ${organization.id}`);
            console.log(`   Nombre: ${organization.name}`);
            console.log(`\n📋 Para usar en el código:`);
            console.log(`   const BOMBEROS_MADRID_ORG_ID = '${organization.id}';`);
        } else {
            console.log('❌ No se encontró la organización de Bomberos Madrid');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getBomberosOrgId();

