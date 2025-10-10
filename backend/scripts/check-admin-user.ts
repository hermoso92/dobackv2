/**
 * Script para verificar usuarios ADMIN en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUsers() {
    try {
        console.log('🔍 Verificando usuarios ADMIN...\n');

        // Buscar todos los usuarios ADMIN
        const adminUsers = await prisma.user.findMany({
            where: {
                role: 'ADMIN'
            },
            include: {
                organization: true
            }
        });

        console.log(`✅ Usuarios ADMIN encontrados: ${adminUsers.length}\n`);

        if (adminUsers.length === 0) {
            console.log('❌ No hay usuarios ADMIN en la base de datos\n');
            console.log('💡 Para crear un usuario ADMIN, ejecuta:');
            console.log('   ts-node backend/scripts/create-super-admin.ts\n');
            return;
        }

        // Mostrar detalles de cada usuario ADMIN
        adminUsers.forEach((user, index) => {
            console.log(`--- Usuario ADMIN ${index + 1} ---`);
            console.log(`ID: ${user.id}`);
            console.log(`Username: ${user.username}`);
            console.log(`Email: ${user.email}`);
            console.log(`Nombre: ${user.firstName} ${user.lastName}`);
            console.log(`Rol: ${user.role}`);
            console.log(`Organización: ${user.organization?.name || 'N/A'}`);
            console.log(`Activo: ${user.isActive ? 'Sí' : 'No'}`);
            console.log('');
        });

        // Verificar usuarios con otros roles
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true
            }
        });

        console.log('📊 Resumen de todos los usuarios:');
        const roleCount = allUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`   ${role}: ${count} usuario(s)`);
        });

    } catch (error) {
        console.error('❌ Error verificando usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUsers();

