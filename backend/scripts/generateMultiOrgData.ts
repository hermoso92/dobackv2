import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface OrganizationData {
    name: string;
    apiKey: string;
    users: {
        email: string;
        name: string;
        role: 'ADMIN' | 'MANAGER' | 'USER';
        password: string;
    }[];
    vehicles: {
        name: string;
        model: string;
        licensePlate: string;
        brand: string;
        identifier: string;
        type: 'CAR' | 'TRUCK' | 'AMBULANCE' | 'FIRE_TRUCK';
    }[];
}

const organizationsData: OrganizationData[] = [
    {
        name: 'Bomberos de Córdoba',
        apiKey: 'api_key_bomberos_cordoba_2024',
        users: [
            {
                email: 'admin@bomberoscordoba.es',
                name: 'Carlos Jiménez',
                role: 'ADMIN',
                password: 'admin123'
            },
            {
                email: 'jefe@bomberoscordoba.es',
                name: 'María González',
                role: 'MANAGER',
                password: 'manager123'
            },
            {
                email: 'conductor1@bomberoscordoba.es',
                name: 'Juan Pérez',
                role: 'USER',
                password: 'user123'
            }
        ],
        vehicles: [
            {
                name: 'Bomberos 01',
                model: 'Actros 3336',
                licensePlate: 'CO-001-BC',
                brand: 'Mercedes-Benz',
                identifier: 'BOMB_001',
                type: 'FIRE_TRUCK'
            },
            {
                name: 'Bomberos 02',
                model: 'Actros 3340',
                licensePlate: 'CO-002-BC',
                brand: 'Mercedes-Benz',
                identifier: 'BOMB_002',
                type: 'FIRE_TRUCK'
            }
        ]
    },
    {
        name: 'Servicios Sanitarios Andalucía',
        apiKey: 'api_key_sanitarios_andalucia_2024',
        users: [
            {
                email: 'admin@sanitarios.es',
                name: 'Dr. Ana Martínez',
                role: 'ADMIN',
                password: 'admin123'
            },
            {
                email: 'coordinador@sanitarios.es',
                name: 'Luis Rodríguez',
                role: 'MANAGER',
                password: 'manager123'
            }
        ],
        vehicles: [
            {
                name: 'Ambulancia 01',
                model: 'Sprinter 519',
                licensePlate: 'SE-001-SA',
                brand: 'Mercedes-Benz',
                identifier: 'AMB_001',
                type: 'AMBULANCE'
            }
        ]
    },
    {
        name: 'Logística TransEuropa',
        apiKey: 'api_key_logistica_transeuropa_2024',
        users: [
            {
                email: 'admin@logistica.es',
                name: 'Roberto Silva',
                role: 'ADMIN',
                password: 'admin123'
            }
        ],
        vehicles: [
            {
                name: 'Camión Logística 01',
                model: 'Actros 1845',
                licensePlate: 'MA-001-LT',
                brand: 'Mercedes-Benz',
                identifier: 'LOG_001',
                type: 'TRUCK'
            }
        ]
    }
];

async function createMultiOrgData() {
    console.log('🚀 Iniciando creación de datos multi-organización...');

    try {
        for (const orgData of organizationsData) {
            console.log(`📊 Creando organización: ${orgData.name}`);

            // Crear organización
            const organization = await prisma.organization.create({
                data: {
                    name: orgData.name,
                    apiKey: orgData.apiKey
                }
            });

            console.log(`✅ Organización creada: ${organization.name}`);

            // Crear usuarios
            for (const userData of orgData.users) {
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

                console.log(`👤 Usuario creado: ${user.name} (${user.role})`);
            }

            // Crear vehículos
            for (const vehicleData of orgData.vehicles) {
                const vehicle = await prisma.vehicle.create({
                    data: {
                        name: vehicleData.name,
                        model: vehicleData.model,
                        licensePlate: vehicleData.licensePlate,
                        brand: vehicleData.brand,
                        identifier: vehicleData.identifier,
                        type: vehicleData.type,
                        organizationId: organization.id,
                        status: 'ACTIVE'
                    }
                });

                console.log(`🚗 Vehículo creado: ${vehicle.name}`);
            }
        }

        // Crear usuario super admin del sistema
        console.log('👑 Creando usuario Super Admin del sistema...');
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);

        const superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@dobacksoft.com',
                name: 'Super Administrador',
                password: superAdminPassword,
                role: 'ADMIN',
                organizationId: null,
                status: 'ACTIVE'
            }
        });

        console.log(`👑 Super Admin creado: ${superAdmin.name}`);

        console.log('\n🔑 CREDENCIALES DE ACCESO:');
        console.log('Super Admin: superadmin@dobacksoft.com / superadmin123');
        console.log('\nPor organización:');
        for (const orgData of organizationsData) {
            console.log(`\n${orgData.name}:`);
            for (const user of orgData.users) {
                console.log(`  ${user.role}: ${user.email} / ${user.password}`);
            }
        }

        console.log('\n✅ Datos multi-organización creados exitosamente!');
    } catch (error) {
        console.error('❌ Error creando datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    createMultiOrgData();
}

export { createMultiOrgData };
