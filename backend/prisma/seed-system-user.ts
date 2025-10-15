/**
 * SEED: Usuario y Organización del Sistema
 * 
 * Crea usuario "system" con UUID fijo para procesamiento automático
 * Esto evita errores de foreign key cuando no hay autenticación
 * 
 * Ejecutar: npx tsx backend/prisma/seed-system-user.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// UUIDs fijos para sistema
const SYSTEM_ORG_ID = '00000000-0000-0000-0000-000000000002';
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
    console.log('🌱 Iniciando seed de usuario system...');

    // 1. Crear organización SYSTEM si no existe
    const existingOrg = await prisma.organization.findUnique({
        where: { id: SYSTEM_ORG_ID }
    });

    if (!existingOrg) {
        await prisma.organization.create({
            data: {
                id: SYSTEM_ORG_ID,
                name: 'SYSTEM',
                apiKey: 'SYSTEM_00000000_0000_0000_0000_000000000002' // API key fijo para sistema
            }
        });
        console.log('✅ Organización SYSTEM creada');
    } else {
        console.log('ℹ️  Organización SYSTEM ya existe');
    }

    // 2. Crear usuario system si no existe
    const existingUser = await prisma.user.findUnique({
        where: { id: SYSTEM_USER_ID }
    });

    if (!existingUser) {
        await prisma.user.create({
            data: {
                id: SYSTEM_USER_ID,
                email: 'system@dobacksoft.com',
                name: 'System User',
                password: '$2b$10$SYSTEM_USER_NO_LOGIN', // No se puede hacer login
                organizationId: SYSTEM_ORG_ID,
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
        console.log('✅ Usuario system creado');
    } else {
        console.log('ℹ️  Usuario system ya existe');
    }

    console.log('\n📊 Información del sistema:');
    console.log(`   Organization ID: ${SYSTEM_ORG_ID}`);
    console.log(`   User ID: ${SYSTEM_USER_ID}`);
    console.log('\n✅ Seed completado exitosamente');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

