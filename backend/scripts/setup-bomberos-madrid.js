const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupBomberosMadrid() {
    try {
        console.log('🚒 Iniciando configuración de Bomberos Madrid...');

        // 1. Crear organización Bomberos Madrid
        const organization = await prisma.organization.upsert({
            where: { id: 'bomberos-madrid-001' },
            update: {},
            create: {
                id: 'bomberos-madrid-001',
                name: 'Bomberos Madrid',
                apiKey: 'bomberos-madrid-api-key-2025'
            }
        });
        console.log('✅ Organización creada:', organization.name);

        // 2. Crear usuario jefe de bomberos
        const hashedPassword = await bcrypt.hash('jefe123', 10);
        const jefe = await prisma.user.upsert({
            where: { email: 'jefe@bomberosmadrid.es' },
            update: {},
            create: {
                id: 'jefe-bomberos-001',
                email: 'jefe@bomberosmadrid.es',
                password: hashedPassword,
                name: 'Jefe de Bomberos Madrid',
                role: 'USER',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        });
        console.log('✅ Jefe de bomberos creado:', jefe.email);

        // 3. Crear usuario operador
        const operadorPassword = await bcrypt.hash('operador123', 10);
        const operador = await prisma.user.upsert({
            where: { email: 'operador@bomberosmadrid.es' },
            update: {},
            create: {
                id: 'operador-bomberos-001',
                email: 'operador@bomberosmadrid.es',
                password: operadorPassword,
                name: 'Operador Bomberos Madrid',
                role: 'USER',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        });
        console.log('✅ Operador creado:', operador.email);

        // 4. Crear vehículos de bomberos
        const vehiculos = [
            {
                id: 'bomba-001',
                name: 'Bomba Escalera 1',
                licensePlate: 'M-1234-BM',
                identifier: 'BE-001',
                model: 'Iveco Magirus',
                brand: 'Iveco',
                type: 'TRUCK',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'bomba-002',
                name: 'Bomba Escalera 2',
                licensePlate: 'M-5678-BM',
                identifier: 'BE-002',
                model: 'Mercedes Atego',
                brand: 'Mercedes',
                type: 'TRUCK',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'bomba-003',
                name: 'Bomba Urbana 1',
                licensePlate: 'M-9012-BM',
                identifier: 'BU-001',
                model: 'Scania P320',
                brand: 'Scania',
                type: 'TRUCK',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'bomba-004',
                name: 'Bomba Forestal 1',
                licensePlate: 'M-3456-BM',
                identifier: 'BF-001',
                model: 'MAN TGM',
                brand: 'MAN',
                type: 'TRUCK',
                status: 'ACTIVE',
                organizationId: organization.id
            },
            {
                id: 'bomba-005',
                name: 'Ambulancia 1',
                licensePlate: 'M-7890-BM',
                identifier: 'AMB-001',
                model: 'Mercedes Sprinter',
                brand: 'Mercedes',
                type: 'VAN',
                status: 'ACTIVE',
                organizationId: organization.id
            }
        ];

        for (const vehiculoData of vehiculos) {
            const vehiculo = await prisma.vehicle.upsert({
                where: { id: vehiculoData.id },
                update: {},
                create: vehiculoData
            });
            console.log('✅ Vehículo creado:', vehiculo.name);
        }

        // 5. Crear parques de bomberos
        const parques = [
            {
                id: 'parque-centro',
                name: 'Parque de Bomberos Centro',
                identifier: 'PBC-001',
                geometry: {
                    type: 'Point',
                    coordinates: [-3.703790, 40.416775]
                },
                organizationId: organization.id
            },
            {
                id: 'parque-norte',
                name: 'Parque de Bomberos Norte',
                identifier: 'PBN-001',
                geometry: {
                    type: 'Point',
                    coordinates: [-3.703790, 40.450000]
                },
                organizationId: organization.id
            },
            {
                id: 'parque-sur',
                name: 'Parque de Bomberos Sur',
                identifier: 'PBS-001',
                geometry: {
                    type: 'Point',
                    coordinates: [-3.703790, 40.380000]
                },
                organizationId: organization.id
            }
        ];

        for (const parqueData of parques) {
            const parque = await prisma.park.upsert({
                where: { id: parqueData.id },
                update: {},
                create: parqueData
            });
            console.log('✅ Parque creado:', parque.name);
        }

        // 6. Crear zonas de riesgo
        const zonas = [
            {
                id: 'zona-centro-historico',
                name: 'Centro Histórico - Zona de Riesgo',
                type: 'HIGH_RISK',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-3.703790, 40.416775],
                        [-3.703000, 40.416775],
                        [-3.703000, 40.417500],
                        [-3.703790, 40.417500],
                        [-3.703790, 40.416775]
                    ]]
                },
                organizationId: organization.id,
                parkId: 'parque-centro'
            },
            {
                id: 'zona-hospitales',
                name: 'Zona Hospitales - Prioridad Alta',
                type: 'HIGH_PRIORITY',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [-3.704000, 40.415000],
                        [-3.702000, 40.415000],
                        [-3.702000, 40.416000],
                        [-3.704000, 40.416000],
                        [-3.704000, 40.415000]
                    ]]
                },
                organizationId: organization.id,
                parkId: 'parque-centro'
            }
        ];

        for (const zonaData of zonas) {
            const zona = await prisma.zone.upsert({
                where: { id: zonaData.id },
                update: {},
                create: zonaData
            });
            console.log('✅ Zona creada:', zona.name);
        }

        // 7. Crear sesiones de estabilidad de ejemplo
        const sesiones = [
            {
                id: 'sesion-bomba-001-2025-01-15',
                vehicleId: 'bomba-001',
                userId: jefe.id,
                startTime: new Date('2025-01-15T08:00:00Z'),
                endTime: new Date('2025-01-15T16:00:00Z'),
                sessionNumber: 1,
                sequence: 1,
                type: 'ROUTINE',
                organizationId: organization.id,
                parkId: 'parque-centro',
                source: 'manual'
            },
            {
                id: 'sesion-bomba-002-2025-01-15',
                vehicleId: 'bomba-002',
                userId: operador.id,
                startTime: new Date('2025-01-15T10:00:00Z'),
                endTime: new Date('2025-01-15T18:00:00Z'),
                sessionNumber: 1,
                sequence: 1,
                type: 'EMERGENCY',
                organizationId: organization.id,
                parkId: 'parque-norte',
                source: 'manual'
            }
        ];

        for (const sesionData of sesiones) {
            const sesion = await prisma.session.upsert({
                where: { id: sesionData.id },
                update: {},
                create: sesionData
            });
            console.log('✅ Sesión creada:', sesion.id);
        }

        // 8. Crear eventos de ejemplo
        const eventos = [
            {
                id: 'evento-emergencia-001',
                type: 'GPS',
                status: 'ACTIVE',
                timestamp: new Date('2025-01-15T14:30:00Z'),
                data: {
                    latitude: 40.416775,
                    longitude: -3.703790,
                    severity: 'HIGH',
                    eventType: 'EMERGENCY_CALL',
                    emergencyType: 'FIRE',
                    address: 'Calle Mayor, 1, Madrid'
                },
                displayData: {
                    message: 'Llamada de emergencia - Incendio en edificio',
                    location: 'Calle Mayor, 1, Madrid',
                    priority: 'ALTA'
                },
                organizationId: organization.id
            },
            {
                id: 'evento-mantenimiento-001',
                type: 'GPS',
                status: 'ACTIVE',
                timestamp: new Date('2025-01-15T16:00:00Z'),
                data: {
                    latitude: 40.450000,
                    longitude: -3.703790,
                    severity: 'MEDIUM',
                    eventType: 'MAINTENANCE_REQUIRED',
                    maintenanceType: 'ROUTINE_CHECK'
                },
                displayData: {
                    message: 'Mantenimiento rutinario requerido',
                    location: 'Parque Norte',
                    priority: 'MEDIA'
                },
                organizationId: organization.id
            }
        ];

        for (const eventoData of eventos) {
            const evento = await prisma.event.upsert({
                where: { id: eventoData.id },
                update: {},
                create: eventoData
            });
            console.log('✅ Evento creado:', evento.type);
        }

        console.log('\n🎉 Configuración de Bomberos Madrid completada!\n');
        console.log('📋 Resumen:');
        console.log('- 1 Organización: Bomberos Madrid');
        console.log('- 2 Usuarios (Jefe y Operador)');
        console.log('- 5 Vehículos de bomberos');
        console.log('- 3 Parques de bomberos');
        console.log('- 2 Zonas de riesgo');
        console.log('- 2 Sesiones de estabilidad');
        console.log('- 2 Eventos de emergencia');
        console.log('\n🔑 Credenciales de acceso:');
        console.log('Jefe: jefe@bomberosmadrid.es / jefe123');
        console.log('Operador: operador@bomberosmadrid.es / operador123');
        console.log('✅ Script completado exitosamente');

    } catch (error) {
        console.error('❌ Error configurando Bomberos Madrid:', error);
        console.error('❌ Script falló:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setupBomberosMadrid();
