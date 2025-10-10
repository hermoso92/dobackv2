const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function loadTestData() {
    try {
        console.log('🚀 Iniciando carga de datos de prueba...');

        // 1. Crear organización de prueba
        const organization = await prisma.organization.upsert({
            where: { id: 'test-org-1' },
            update: {},
            create: {
                id: 'test-org-1',
                name: 'Organización Demo',
                apiKey: 'demo-api-key-123'
            }
        });
        console.log('✅ Organización creada:', organization.name);

        // 2. Crear usuario superadmin si no existe
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        const superadmin = await prisma.user.upsert({
            where: { email: 'superadmin@dobacksoft.com' },
            update: {},
            create: {
                id: 'superadmin-1',
                email: 'superadmin@dobacksoft.com',
                password: hashedPassword,
                name: 'Super Admin',
                role: 'ADMIN',
                status: 'ACTIVE',
                organizationId: null // Superadmin sin organización
            }
        });
        console.log('✅ Superadmin creado:', superadmin.email);

        // 3. Crear usuario manager de prueba
        const managerPassword = await bcrypt.hash('manager123', 10);
        const manager = await prisma.user.upsert({
            where: { email: 'manager@demo.com' },
            update: {},
            create: {
                id: 'manager-1',
                email: 'manager@demo.com',
                password: managerPassword,
                name: 'Manager Demo',
                role: 'USER',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        });
        console.log('✅ Manager creado:', manager.email);

        // 4. Crear vehículos de prueba
        const vehicles = [
            {
                id: 'vehicle-1',
                name: 'Vehículo Demo 1',
                licensePlate: 'DEM-001',
                identifier: 'DEM-001',
                model: 'Ford Transit',
                brand: 'Ford',
                type: 'CAR',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'vehicle-2',
                name: 'Vehículo Demo 2',
                licensePlate: 'DEM-002',
                identifier: 'DEM-002',
                model: 'Volkswagen Crafter',
                brand: 'Volkswagen',
                type: 'TRUCK',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'vehicle-3',
                name: 'Vehículo Demo 3',
                licensePlate: 'DEM-003',
                identifier: 'DEM-003',
                model: 'Mercedes Sprinter',
                brand: 'Mercedes',
                type: 'VAN',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        ];

        for (const vehicleData of vehicles) {
            const vehicle = await prisma.vehicle.upsert({
                where: { id: vehicleData.id },
                update: {},
                create: vehicleData
            });
            console.log('✅ Vehículo creado:', vehicle.name);
        }

        // 5. Crear parques de prueba
        const parks = [
            {
                id: 'park-1',
                name: 'Parque Demo 1',
                identifier: 'PARK-001',
                geometry: {},
                organizationId: organization.id
            },
            {
                id: 'park-2',
                name: 'Parque Demo 2',
                identifier: 'PARK-002',
                geometry: {},
                organizationId: organization.id
            }
        ];

        for (const parkData of parks) {
            const park = await prisma.park.upsert({
                where: { id: parkData.id },
                update: {},
                create: parkData
            });
            console.log('✅ Parque creado:', park.name);
        }

        // 6. Crear zonas de prueba
        const zones = [
            {
                id: 'zone-1',
                name: 'Zona Restringida 1',
                type: 'RESTRICTED',
                geometry: {},
                organizationId: organization.id,
                parkId: 'park-1'
            },
            {
                id: 'zone-2',
                name: 'Zona de Velocidad 2',
                type: 'SPEED_LIMIT',
                geometry: {},
                organizationId: organization.id,
                parkId: 'park-2'
            }
        ];

        for (const zoneData of zones) {
            const zone = await prisma.zone.upsert({
                where: { id: zoneData.id },
                update: {},
                create: zoneData
            });
            console.log('✅ Zona creada:', zone.name);
        }

        // 7. Crear sesiones de prueba
        const sessions = [
            {
                id: 'session-1',
                vehicleId: 'vehicle-1',
                userId: manager.id,
                startTime: new Date('2025-09-26T10:00:00Z'),
                endTime: new Date('2025-09-26T12:00:00Z'),
                sessionNumber: 1,
                sequence: 1,
                type: 'ROUTINE',
                organizationId: organization.id,
                parkId: 'park-1',
                source: 'manual'
            },
            {
                id: 'session-2',
                vehicleId: 'vehicle-2',
                userId: manager.id,
                startTime: new Date('2025-09-26T14:00:00Z'),
                endTime: new Date('2025-09-26T16:30:00Z'),
                sessionNumber: 1,
                sequence: 1,
                type: 'ROUTINE',
                organizationId: organization.id,
                parkId: 'park-2',
                source: 'manual'
            }
        ];

        for (const sessionData of sessions) {
            const session = await prisma.session.upsert({
                where: { id: sessionData.id },
                update: {},
                create: sessionData
            });
            console.log('✅ Sesión creada:', session.id);
        }

        // 8. Crear eventos de prueba
        const events = [
            {
                id: 'event-1',
                type: 'GPS',
                status: 'ACTIVE',
                timestamp: new Date('2025-09-26T10:30:00Z'),
                data: {
                    latitude: 40.4170,
                    longitude: -3.7040,
                    severity: 'MEDIUM',
                    eventType: 'GEOFENCE_ENTER'
                },
                displayData: {
                    message: 'Entrada a geocerca',
                    location: 'Madrid, España'
                },
                organizationId: organization.id
            },
            {
                id: 'event-2',
                type: 'GPS',
                status: 'ACTIVE',
                timestamp: new Date('2025-09-26T11:00:00Z'),
                data: {
                    latitude: 40.4175,
                    longitude: -3.7045,
                    severity: 'HIGH',
                    eventType: 'SPEED_EXCEEDED',
                    speedLimit: 50,
                    actualSpeed: 65
                },
                displayData: {
                    message: 'Velocidad excedida',
                    location: 'Madrid, España'
                },
                organizationId: organization.id
            }
        ];

        for (const eventData of events) {
            const event = await prisma.event.upsert({
                where: { id: eventData.id },
                update: {},
                create: eventData
            });
            console.log('✅ Evento creado:', event.type);
        }

        console.log('🎉 Datos de prueba cargados exitosamente!');
        console.log('\n📋 Resumen:');
        console.log('- 1 Organización');
        console.log('- 2 Usuarios (1 Superadmin, 1 Manager)');
        console.log('- 3 Vehículos');
        console.log('- 2 Parques');
        console.log('- 2 Zonas');
        console.log('- 2 Sesiones de estabilidad');
        console.log('- 2 Eventos');

    } catch (error) {
        console.error('❌ Error cargando datos de prueba:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    loadTestData()
        .then(() => {
            console.log('✅ Script completado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script falló:', error);
            process.exit(1);
        });
}

module.exports = { loadTestData };
