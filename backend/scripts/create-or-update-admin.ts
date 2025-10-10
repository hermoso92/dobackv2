/**
 * Script para crear o actualizar tu usuario como ADMIN
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createOrUpdateAdmin() {
    try {
        console.log('\n🔧 Script de Configuración de Usuario ADMIN\n');
        
        // Primero, listar todos los usuarios existentes
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true
            }
        });

        console.log('📋 Usuarios actuales en la base de datos:');
        if (allUsers.length === 0) {
            console.log('   ⚠️  No hay usuarios en la base de datos\n');
        } else {
            allUsers.forEach(u => {
                console.log(`   - ${u.username} (${u.email}) - Rol: ${u.role} - Activo: ${u.isActive}`);
            });
            console.log('');
        }

        // Preguntar qué hacer
        console.log('💡 Opciones:');
        console.log('   1. Crear usuario ADMIN por defecto (username: admin, password: Admin123!)');
        console.log('   2. Actualizar usuario existente a ADMIN');
        console.log('   3. Crear usuario personalizado como ADMIN\n');

        // Por simplicidad, vamos a crear el usuario admin por defecto si no existe
        const adminUser = await prisma.user.findFirst({
            where: { username: 'admin' }
        });

        // Buscar o crear organización
        let organization = await prisma.organization.findFirst();
        
        if (!organization) {
            console.log('🏢 Creando organización "Bomberos Madrid"...');
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    code: 'BM001'
                }
            });
            console.log('✅ Organización creada\n');
        }

        if (adminUser) {
            console.log('👤 Usuario "admin" encontrado');
            console.log(`   Rol actual: ${adminUser.role}\n`);
            
            if (adminUser.role !== 'ADMIN') {
                console.log('🔄 Actualizando usuario a ADMIN...');
                await prisma.user.update({
                    where: { id: adminUser.id },
                    data: { 
                        role: 'ADMIN',
                        isActive: true
                    }
                });
                console.log('✅ Usuario actualizado a ADMIN\n');
            } else {
                console.log('✅ El usuario ya es ADMIN\n');
            }
        } else {
            console.log('👤 Usuario "admin" no encontrado');
            console.log('🔄 Creando usuario ADMIN...\n');
            
            const hashedPassword = await bcrypt.hash('Admin123!', 10);
            
            const newUser = await prisma.user.create({
                data: {
                    username: 'admin',
                    email: 'admin@dobacksoft.com',
                    password: hashedPassword,
                    firstName: 'Super',
                    lastName: 'Admin',
                    role: 'ADMIN',
                    isActive: true,
                    organizationId: organization.id
                }
            });

            console.log('✅ Usuario ADMIN creado exitosamente!');
            console.log(`   Username: ${newUser.username}`);
            console.log(`   Password: Admin123!`);
            console.log(`   Email: ${newUser.email}`);
            console.log(`   Rol: ${newUser.role}\n`);
        }

        console.log('🎉 Configuración completada!\n');
        console.log('📝 Credenciales para acceder:');
        console.log('   Username: admin');
        console.log('   Password: Admin123!\n');
        console.log('🔗 Ahora puedes acceder a: http://localhost:5174/administration\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createOrUpdateAdmin();

