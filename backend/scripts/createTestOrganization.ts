import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestOrganization() {
    console.log('🏢 Creando organización de prueba...');

    try {
        // 1. Crear la organización
        const organization = await prisma.organization.create({
            data: {
                name: 'Empresa de Pruebas S.L.',
                apiKey: 'api_key_pruebas_2024_' + Date.now()
            }
        });

        console.log(`✅ Organización creada: ${organization.name}`);
        console.log(`🔑 API Key: ${organization.apiKey}`);

        // 2. Crear usuarios
        const users = [
            {
                email: 'admin@pruebas.com',
                name: 'Administrador Pruebas',
                role: 'ADMIN' as const,
                password: 'admin123'
            },
            {
                email: 'usuario@pruebas.com',
                name: 'Usuario Normal',
                role: 'USER' as const,
                password: 'user123'
            },
            {
                email: 'manager@pruebas.com',
                name: 'Manager Pruebas',
                role: 'MANAGER' as const,
                password: 'manager123'
            }
        ];

        const createdUsers = [];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    role: userData.role,
                    organizationId: organization.id,
                    status: 'ACTIVE'
                }
            });

            createdUsers.push(user);
            console.log(`👤 Usuario creado: ${user.name} (${user.role}) - ${user.email}`);
        }

        // 3. Crear vehículos específicos para esta organización
        const vehicles = [
            {
                name: 'Vehículo Prueba 01',
                model: 'Ford Transit',
                licensePlate: 'PR-001-TE',
                brand: 'Ford',
                identifier: 'PRUEBA_001',
                type: 'CAR' as const
            },
            {
                name: 'Vehículo Prueba 02',
                model: 'Volkswagen Crafter',
                licensePlate: 'PR-002-TE',
                brand: 'Volkswagen',
                identifier: 'PRUEBA_002',
                type: 'TRUCK' as const
            }
        ];

        const createdVehicles = [];

        for (const vehicleData of vehicles) {
            const vehicle = await prisma.vehicle.create({
                data: {
                    name: vehicleData.name,
                    model: vehicleData.model,
                    licensePlate: vehicleData.licensePlate,
                    brand: vehicleData.brand,
                    identifier: vehicleData.identifier,
                    type: vehicleData.type,
                    organizationId: organization.id,
                    userId: createdUsers[1].id, // Asignar al usuario normal
                    status: 'ACTIVE'
                }
            });

            createdVehicles.push(vehicle);
            console.log(`🚗 Vehículo creado: ${vehicle.name} - ${vehicle.licensePlate}`);
        }

        // 4. Crear algunas sesiones de prueba
        const sessions = [
            {
                vehicleId: createdVehicles[0].id,
                userId: createdUsers[1].id,
                startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ayer
                endTime: new Date(Date.now() - 23 * 60 * 60 * 1000),
                sessionNumber: 1,
                sequence: 1
            },
            {
                vehicleId: createdVehicles[1].id,
                userId: createdUsers[1].id,
                startTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // Hace 12 horas
                endTime: new Date(Date.now() - 11 * 60 * 60 * 1000),
                sessionNumber: 1,
                sequence: 1
            }
        ];

        for (const sessionData of sessions) {
            const session = await prisma.session.create({
                data: sessionData
            });

            console.log(
                `📊 Sesión creada: Vehículo ${sessionData.vehicleId} - Sesión ${session.sessionNumber}`
            );
        }

        // 5. Mostrar resumen
        console.log('\n🎉 ¡Organización de prueba creada exitosamente!');
        console.log('\n📋 RESUMEN:');
        console.log(`🏢 Organización: ${organization.name}`);
        console.log(`🆔 ID: ${organization.id}`);

        console.log('\n👥 USUARIOS CREADOS:');
        users.forEach((user) => {
            console.log(`  📧 ${user.email} / ${user.password} (${user.role})`);
        });

        console.log('\n🚗 VEHÍCULOS CREADOS:');
        createdVehicles.forEach((vehicle) => {
            console.log(`  🚙 ${vehicle.name} - ${vehicle.licensePlate}`);
        });

        console.log('\n🔍 PARA PROBAR SCOPING:');
        console.log('1. Inicia sesión con: usuario@pruebas.com / user123');
        console.log('2. Verifica que solo ves los vehículos de "Empresa de Pruebas S.L."');
        console.log('3. Compara con otros usuarios de otras organizaciones');

        return {
            organization,
            users: createdUsers,
            vehicles: createdVehicles
        };
    } catch (error) {
        console.error('❌ Error creando organización de prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTestOrganization().catch(console.error);
}

export { createTestOrganization };
