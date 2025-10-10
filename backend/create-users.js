const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUsers() {
    try {
        console.log('🚀 Creando usuarios...');

        // Crear Super Admin
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);
        
        const superAdmin = await prisma.user.upsert({
            where: { email: 'superadmin@dobacksoft.com' },
            update: {},
            create: {
                email: 'superadmin@dobacksoft.com',
                name: 'Super Administrador',
                password: superAdminPassword,
                role: 'ADMIN',
                organizationId: null,
                status: 'ACTIVE'
            }
        });

        console.log('✅ Super Admin creado:', superAdmin.email);

        // Crear organización de prueba
        const organization = await prisma.organization.upsert({
            where: { name: 'Empresa de Pruebas S.L.' },
            update: {},
            create: {
                name: 'Empresa de Pruebas S.L.',
                apiKey: 'api_key_pruebas_2024_' + Date.now()
            }
        });

        console.log('✅ Organización creada:', organization.name);

        // Crear usuarios de prueba
        const users = [
            {
                email: 'admin@pruebas.com',
                name: 'Administrador Pruebas',
                role: 'ADMIN',
                password: 'admin123'
            },
            {
                email: 'usuario@pruebas.com',
                name: 'Usuario Normal',
                role: 'USER',
                password: 'user123'
            }
        ];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: {},
                create: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    role: userData.role,
                    organizationId: organization.id,
                    status: 'ACTIVE'
                }
            });

            console.log(`✅ Usuario creado: ${user.email} (${user.role})`);
        }

        console.log('\n🎉 ¡Usuarios creados exitosamente!');
        console.log('\n📋 Credenciales disponibles:');
        console.log('Super Admin:');
        console.log('  Email: superadmin@dobacksoft.com');
        console.log('  Password: superadmin123');
        console.log('\nUsuario de prueba:');
        console.log('  Email: usuario@pruebas.com');
        console.log('  Password: user123');

    } catch (error) {
        console.error('❌ Error creando usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createUsers();
