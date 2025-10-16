/**
 * 🏢 SCRIPT DE INICIALIZACIÓN - DATOS DE ADMINISTRACIÓN
 * Crea datos de ejemplo para parques, vehículos, geocercas y zonas
 * Para Bomberos Madrid
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando creación de datos de administración...\n');

    // 1. Obtener o crear organización
    let organization = await prisma.organization.findFirst({
        where: {
            name: {
                contains: 'Bomberos',
                mode: 'insensitive'
            }
        }
    });

    if (!organization) {
        organization = await prisma.organization.create({
            data: {
                name: 'Bomberos Madrid',
                description: 'Cuerpo de Bomberos del Ayuntamiento de Madrid',
                type: 'FIRE_DEPARTMENT',
                settings: {
                    timezone: 'Europe/Madrid',
                    language: 'es',
                    theme: 'light'
                }
            }
        });
        console.log('✅ Organización creada:', organization.name);
    } else {
        console.log('✅ Organización encontrada:', organization.name);
    }

    // 2. Crear Parques de Bomberos
    console.log('\n🏢 Creando parques de bomberos...');
    
    const parksData = [
        {
            name: 'Parque Central',
            identifier: 'CENTRAL',
            geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] },
            geometry_postgis: '{"type":"Point","coordinates":[-3.7038,40.4168]}'
        },
        {
            name: 'Parque Chamberí',
            identifier: 'CHAMBERI',
            geometry: { type: 'Point', coordinates: [-3.6975, 40.4325] },
            geometry_postgis: '{"type":"Point","coordinates":[-3.6975,40.4325]}'
        },
        {
            name: 'Parque Vallecas',
            identifier: 'VALLECAS',
            geometry: { type: 'Point', coordinates: [-3.6225, 40.3625] },
            geometry_postgis: '{"type":"Point","coordinates":[-3.6225,40.3625]}'
        },
        {
            name: 'Parque Carabanchel',
            identifier: 'CARABANCHEL',
            geometry: { type: 'Point', coordinates: [-3.7200, 40.3850] },
            geometry_postgis: '{"type":"Point","coordinates":[-3.7200,40.3850]}'
        }
    ];

    const createdParks = [];
    for (const parkData of parksData) {
        // Verificar si ya existe
        const existing = await prisma.park.findFirst({
            where: {
                identifier: parkData.identifier,
                organizationId: organization.id
            }
        });

        if (!existing) {
            const park = await prisma.park.create({
                data: {
                    ...parkData,
                    organizationId: organization.id
                }
            });
            createdParks.push(park);
            console.log(`  ✅ Parque creado: ${park.name}`);
        } else {
            createdParks.push(existing);
            console.log(`  ℹ️  Parque ya existe: ${existing.name}`);
        }
    }

    // 3. Crear Vehículos
    console.log('\n🚗 Creando vehículos...');
    
    const vehiclesData = [
        {
            name: 'BRP CENTRAL 1',
            identifier: 'DOBACK101',
            licensePlate: 'BRP1001',
            model: 'Mercedes-Benz Atego',
            parkId: createdParks[0].id,
            type: 'BRP',
            status: 'ACTIVE'
        },
        {
            name: 'BRP CENTRAL 2',
            identifier: 'DOBACK102',
            licensePlate: 'BRP1002',
            model: 'Mercedes-Benz Atego',
            parkId: createdParks[0].id,
            type: 'BRP',
            status: 'ACTIVE'
        },
        {
            name: 'AMBULANCIA CHAMBERI',
            identifier: 'DOBACK103',
            licensePlate: 'AMB2001',
            model: 'Mercedes-Benz Sprinter',
            parkId: createdParks[1].id,
            type: 'VAN',
            status: 'ACTIVE'
        },
        {
            name: 'ESCALERA VALLECAS',
            identifier: 'DOBACK104',
            licensePlate: 'ESC3001',
            model: 'Magirus DLK 23-12',
            parkId: createdParks[2].id,
            type: 'ESCALA',
            status: 'ACTIVE'
        },
        {
            name: 'RESCATE CARABANCHEL',
            identifier: 'DOBACK105',
            licensePlate: 'RES4001',
            model: 'Iveco Daily',
            parkId: createdParks[3].id,
            type: 'OTHER',
            status: 'MAINTENANCE'
        }
    ];

    const createdVehicles = [];
    for (const vehicleData of vehiclesData) {
        // Verificar si ya existe
        const existing = await prisma.vehicle.findFirst({
            where: {
                identifier: vehicleData.identifier,
                organizationId: organization.id
            }
        });

        if (!existing) {
            const vehicle = await prisma.vehicle.create({
                data: {
                    ...vehicleData,
                    organizationId: organization.id,
                    updatedAt: new Date()
                }
            });
            createdVehicles.push(vehicle);
            console.log(`  ✅ Vehículo creado: ${vehicle.name} (${vehicle.licensePlate})`);
        } else {
            createdVehicles.push(existing);
            console.log(`  ℹ️  Vehículo ya existe: ${existing.name}`);
        }
    }

    // 4. Crear Geocercas (simular Radar.com)
    console.log('\n🗺️  Creando geocercas...');
    
    const geofencesData = [
        {
            name: 'Parque Central - Zona de Seguridad',
            description: 'Geocerca del parque central de bomberos',
            type: 'CIRCLE',
            mode: 'CAR',
            enabled: true,
            live: true,
            geometry: {
                type: 'Circle',
                center: [40.4168, -3.7038],
                radius: 150
            },
            geometryCenter: {
                type: 'Point',
                coordinates: [-3.7038, 40.4168]
            },
            geometryRadius: 150,
            tag: 'PARQUE_CENTRAL',
            externalId: 'radar_001'
        },
        {
            name: 'Gran Vía - Zona Comercial',
            description: 'Zona comercial de alto riesgo',
            type: 'POLYGON',
            mode: 'CAR',
            enabled: true,
            live: true,
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-3.7100, 40.4200],
                    [-3.7050, 40.4200],
                    [-3.7050, 40.4150],
                    [-3.7100, 40.4150],
                    [-3.7100, 40.4200]
                ]]
            },
            geometryCenter: {
                type: 'Point',
                coordinates: [-3.7075, 40.4175]
            },
            tag: 'GRAN_VIA',
            externalId: 'radar_002'
        },
        {
            name: 'Zona Industrial Carabanchel',
            description: 'Área industrial con riesgo de incendios químicos',
            type: 'CIRCLE',
            mode: 'CAR',
            enabled: true,
            live: true,
            geometry: {
                type: 'Circle',
                center: [40.3850, -3.7200],
                radius: 200
            },
            geometryCenter: {
                type: 'Point',
                coordinates: [-3.7200, 40.3850]
            },
            geometryRadius: 200,
            tag: 'INDUSTRIAL',
            externalId: 'radar_003'
        }
    ];

    const createdGeofences = [];
    for (const geofenceData of geofencesData) {
        // Verificar si ya existe
        const existing = await prisma.geofence.findFirst({
            where: {
                externalId: geofenceData.externalId,
                organizationId: organization.id
            }
        });

        if (!existing) {
            const geofence = await prisma.geofence.create({
                data: {
                    ...geofenceData,
                    organizationId: organization.id
                }
            });
            createdGeofences.push(geofence);
            console.log(`  ✅ Geocerca creada: ${geofence.name}`);
        } else {
            createdGeofences.push(existing);
            console.log(`  ℹ️  Geocerca ya existe: ${existing.name}`);
        }
    }

    // 5. Crear Zonas vinculadas a Parques
    console.log('\n🌐 Creando zonas...');
    
    const zonesData = [
        {
            name: 'Zona Parque Central',
            type: 'PARK',
            geometry: {
                type: 'Circle',
                center: [40.4168, -3.7038],
                radius: 200
            },
            parkId: createdParks[0].id
        },
        {
            name: 'Zona Parque Chamberí',
            type: 'PARK',
            geometry: {
                type: 'Circle',
                center: [40.4325, -3.6975],
                radius: 200
            },
            parkId: createdParks[1].id
        },
        {
            name: 'Zona Parque Vallecas',
            type: 'PARK',
            geometry: {
                type: 'Circle',
                center: [40.3625, -3.6225],
                radius: 200
            },
            parkId: createdParks[2].id
        },
        {
            name: 'Zona Parque Carabanchel',
            type: 'PARK',
            geometry: {
                type: 'Circle',
                center: [40.3850, -3.7200],
                radius: 200
            },
            parkId: createdParks[3].id
        }
    ];

    for (const zoneData of zonesData) {
        // Verificar si ya existe
        const existing = await prisma.zone.findFirst({
            where: {
                name: zoneData.name,
                organizationId: organization.id
            }
        });

        if (!existing) {
            const zone = await prisma.zone.create({
                data: {
                    ...zoneData,
                    organizationId: organization.id
                }
            });
            console.log(`  ✅ Zona creada: ${zone.name}`);
        } else {
            console.log(`  ℹ️  Zona ya existe: ${existing.name}`);
        }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log(`  🏢 Parques: ${createdParks.length}`);
    console.log(`  🚗 Vehículos: ${createdVehicles.length}`);
    console.log(`  🗺️  Geocercas: ${createdGeofences.length}`);
    console.log(`  🌐 Zonas: ${zonesData.length}`);
    console.log('\n✅ Datos de administración inicializados correctamente\n');
}

main()
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

