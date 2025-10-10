/**
 * Script para convertir un usuario en ADMIN
 * Uso: ts-node backend/scripts/set-user-admin.ts <username>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setUserAdmin() {
    try {
        const username = process.argv[2];

        if (!username) {
            console.log('❌ Error: Debes proporcionar un nombre de usuario\n');
            console.log('💡 Uso: ts-node backend/scripts/set-user-admin.ts <username>\n');
            console.log('📋 Usuarios disponibles:');
            
            const users = await prisma.user.findMany({
                select: {
                    username: true,
                    email: true,
                    role: true,
                    firstName: true,
                    lastName: true
                }
            });

            users.forEach(user => {
                console.log(`   - ${user.username} (${user.email}) - Rol actual: ${user.role}`);
            });

            return;
        }

        console.log(`🔍 Buscando usuario: ${username}...\n`);

        // Buscar el usuario
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username }
                ]
            }
        });

        if (!user) {
            console.log(`❌ Usuario "${username}" no encontrado\n`);
            console.log('📋 Usuarios disponibles:');
            
            const users = await prisma.user.findMany({
                select: {
                    username: true,
                    email: true
                }
            });

            users.forEach(u => {
                console.log(`   - ${u.username} (${u.email})`);
            });

            return;
        }

        console.log('✅ Usuario encontrado:');
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rol actual: ${user.role}\n`);

        if (user.role === 'ADMIN') {
            console.log('ℹ️  El usuario ya es ADMIN\n');
            return;
        }

        // Actualizar a ADMIN
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });

        console.log('✅ Usuario actualizado exitosamente!');
        console.log(`   Rol anterior: ${user.role}`);
        console.log(`   Rol nuevo: ${updatedUser.role}\n`);
        console.log('🎉 Ahora puedes acceder a la sección de Gestión con este usuario\n');

    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setUserAdmin();

