/**
 * Script para importar geocercas REALES desde Radar.com
 * Vincula: Geocercas → Parques → Vehículos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Geocercas reales de Radar.com
const radarGeofences = [
    {
        "_id": "68db36628bca41a4743fe196",
        "externalId": "alcobendas",
        "description": "Parque Alcobendas",
        "tag": "parque",
        "type": "polygon",
        "mode": "car",
        "live": true,
        "enabled": true,
        "geometryCenter": {
            "type": "Point",
            "coordinates": [-3.618328905581324, 40.53553949812811]
        },
        "geometryRadius": 71,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-3.6182157851212655, 40.536219940618956],
                    [-3.6187156196533077, 40.535932037075234],
                    [-3.6190628730376395, 40.53536422371056],
                    [-3.6187156196533077, 40.53474842065209],
                    [-3.6174055269571213, 40.53521227257284],
                    [-3.6178580090653005, 40.53576009413895],
                    [-3.6182157851212655, 40.536219940618956]
                ]
            ]
        }
    },
    {
        "_id": "68db4b4aeff6af4d34e55b39",
        "externalId": "rozas",
        "description": "Parque Las Rozas",
        "tag": "parque",
        "type": "polygon",
        "mode": "car",
        "live": true,
        "enabled": true,
        "geometryCenter": {
            "type": "Point",
            "coordinates": [-3.8841334864808306, 40.5202177500439]
        },
        "geometryRadius": 194,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-3.8824916163242125, 40.52197243635178],
                    [-3.8851186084482996, 40.5211501677684],
                    [-3.8850606602334543, 40.52090789012914],
                    [-3.8854566405618645, 40.5207610548202],
                    [-3.8854373247357885, 40.51932205133368],
                    [-3.884809550811229, 40.51823543735193],
                    [-3.880560004250965, 40.51917521255216],
                    [-3.8824916163242125, 40.52197243635178]
                ]
            ]
        }
    }
];

async function main() {
    try {
        console.log('🚨 Importando geocercas REALES desde Radar.com...\n');

        // 1. Obtener organización de Bomberos Madrid
        let organization = await prisma.organization.findFirst({
            where: {
                OR: [
                    { name: { contains: 'Bomberos', mode: 'insensitive' } },
                    { name: { contains: 'Madrid', mode: 'insensitive' } }
                ]
            }
        });

        if (!organization) {
            console.log('❌ Organización Bomberos Madrid no encontrada');
            const apiKey = `bmad_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    apiKey: apiKey
                }
            });
            console.log(`✅ Organización creada: ${organization.id}`);
        } else {
            console.log(`✅ Organización encontrada: ${organization.name} (${organization.id})\n`);
        }

        // 2. Eliminar geocercas antiguas (las de prueba)
        console.log('🗑️  Eliminando geocercas de prueba antiguas...');
        const existingGeofences = await prisma.geofence.findMany({
            where: { organizationId: organization.id },
            select: { id: true, name: true }
        });

        if (existingGeofences.length > 0) {
            console.log(`   Encontradas ${existingGeofences.length} geocercas antiguas:`);
            existingGeofences.forEach(g => console.log(`   - ${g.name}`));

            const existingGeofenceIds = existingGeofences.map(g => g.id);

            // Eliminar relaciones
            await prisma.geofenceEvent.deleteMany({
                where: { geofenceId: { in: existingGeofenceIds } }
            });
            await prisma.geofenceVehicleState.deleteMany({
                where: { geofenceId: { in: existingGeofenceIds } }
            });

            // Eliminar geocercas
            const deleted = await prisma.geofence.deleteMany({
                where: { organizationId: organization.id }
            });
            console.log(`✅ Eliminadas ${deleted.count} geocercas antiguas\n`);
        } else {
            console.log('   No hay geocercas antiguas\n');
        }

        // 3. Crear o encontrar parques
        console.log('🏢 Verificando parques...');
        const parks = [];

        // Parque Alcobendas
        let parkAlcobendas = await prisma.park.findFirst({
            where: {
                organizationId: organization.id,
                name: { contains: 'Alcobendas', mode: 'insensitive' }
            }
        });

        if (!parkAlcobendas) {
            parkAlcobendas = await prisma.park.create({
                data: {
                    name: 'Parque Alcobendas',
                    identifier: 'ALCOBENDAS',
                    organizationId: organization.id,
                    geometry: {
                        type: 'Point',
                        coordinates: [-3.618328905581324, 40.53553949812811]
                    },
                    geometryPostgis: JSON.stringify({
                        type: 'Point',
                        coordinates: [-3.618328905581324, 40.53553949812811]
                    })
                }
            });
            console.log(`   ✅ Parque Alcobendas creado: ${parkAlcobendas.id}`);
        } else {
            console.log(`   ✅ Parque Alcobendas encontrado: ${parkAlcobendas.id}`);
        }
        parks.push(parkAlcobendas);

        // Parque Las Rozas
        let parkRozas = await prisma.park.findFirst({
            where: {
                organizationId: organization.id,
                OR: [
                    { name: { contains: 'Rozas', mode: 'insensitive' } },
                    { name: { contains: 'Las Rozas', mode: 'insensitive' } }
                ]
            }
        });

        if (!parkRozas) {
            parkRozas = await prisma.park.create({
                data: {
                    name: 'Parque Las Rozas',
                    identifier: 'LAS_ROZAS',
                    organizationId: organization.id,
                    geometry: {
                        type: 'Point',
                        coordinates: [-3.8841334864808306, 40.5202177500439]
                    },
                    geometryPostgis: JSON.stringify({
                        type: 'Point',
                        coordinates: [-3.8841334864808306, 40.5202177500439]
                    })
                }
            });
            console.log(`   ✅ Parque Las Rozas creado: ${parkRozas.id}`);
        } else {
            console.log(`   ✅ Parque Las Rozas encontrado: ${parkRozas.id}`);
        }
        parks.push(parkRozas);

        console.log('');

        // 4. Importar geocercas reales desde Radar.com
        console.log('📡 Importando geocercas desde Radar.com...');
        const createdGeofences = [];

        for (const radarGeofence of radarGeofences) {
            const parkId = radarGeofence.externalId === 'alcobendas' ? parkAlcobendas.id : parkRozas.id;
            const parkName = radarGeofence.externalId === 'alcobendas' ? 'Alcobendas' : 'Las Rozas';

            const geofence = await prisma.geofence.create({
                data: {
                    externalId: radarGeofence._id, // ID de Radar.com
                    name: radarGeofence.description,
                    description: `Geocerca del ${parkName} importada desde Radar.com`,
                    tag: radarGeofence.tag,
                    type: radarGeofence.type.toUpperCase() as any,
                    mode: radarGeofence.mode.toUpperCase() as any,
                    enabled: radarGeofence.enabled,
                    live: radarGeofence.live,
                    geometry: radarGeofence.geometry,
                    geometryCenter: radarGeofence.geometryCenter,
                    geometryRadius: radarGeofence.geometryRadius,
                    organizationId: organization.id
                }
            });

            // Vincular geocerca al parque mediante Zone
            const zone = await prisma.zone.create({
                data: {
                    name: `Zona ${radarGeofence.description}`,
                    type: 'PARK',
                    geometry: radarGeofence.geometry,
                    geometryPostgis: JSON.stringify(radarGeofence.geometry),
                    organizationId: organization.id,
                    parkId: parkId
                }
            });

            createdGeofences.push({
                geofence,
                zone,
                park: radarGeofence.externalId === 'alcobendas' ? parkAlcobendas : parkRozas
            });

            console.log(`   ✅ ${radarGeofence.description}`);
            console.log(`      - Geocerca ID: ${geofence.id}`);
            console.log(`      - Zona ID: ${zone.id}`);
            console.log(`      - Parque: ${parkName}`);
            console.log(`      - Radar.com ID: ${radarGeofence._id}`);
        }

        console.log('');

        // 5. Vincular vehículos a parques
        console.log('🚗 Vinculando vehículos a parques...');

        // Vehículos de Alcobendas
        const vehiculosAlcobendas = ['DOBACK023', 'DOBACK024', 'DOBACK027'];
        for (const vehicleId of vehiculosAlcobendas) {
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    OR: [
                        { id: { contains: vehicleId, mode: 'insensitive' } },
                        { name: { contains: vehicleId, mode: 'insensitive' } },
                        { licensePlate: { contains: vehicleId, mode: 'insensitive' } }
                    ]
                }
            });

            if (vehicle) {
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { parkId: parkAlcobendas.id }
                });
                console.log(`   ✅ ${vehicleId} → Parque Alcobendas`);
            } else {
                console.log(`   ⚠️  Vehículo ${vehicleId} no encontrado en BD`);
            }
        }

        // Vehículos de Las Rozas
        const vehiculosRozas = ['DOBACK022', 'DOBACK025', 'DOBACK028'];
        for (const vehicleId of vehiculosRozas) {
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    OR: [
                        { id: { contains: vehicleId, mode: 'insensitive' } },
                        { name: { contains: vehicleId, mode: 'insensitive' } },
                        { licensePlate: { contains: vehicleId, mode: 'insensitive' } }
                    ]
                }
            });

            if (vehicle) {
                await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: { parkId: parkRozas.id }
                });
                console.log(`   ✅ ${vehicleId} → Parque Las Rozas`);
            } else {
                console.log(`   ⚠️  Vehículo ${vehicleId} no encontrado en BD`);
            }
        }

        console.log('');

        // 6. Resumen final
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 IMPORTACIÓN COMPLETA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📊 Resumen:');
        console.log(`   ✅ Organización: ${organization.name}`);
        console.log(`   ✅ Parques: ${parks.length}`);
        console.log(`   ✅ Geocercas: ${createdGeofences.length}`);
        console.log(`   ✅ Zonas: ${createdGeofences.length}`);
        console.log('');
        console.log('🗺️  Geocercas importadas:');
        createdGeofences.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.geofence.name}`);
            console.log(`      - Tipo: ${item.geofence.type}`);
            console.log(`      - Parque: ${item.park.name}`);
            console.log(`      - Radio: ${item.geofence.geometryRadius}m`);
            console.log(`      - Radar ID: ${item.geofence.externalId}`);
        });
        console.log('');
        console.log('🔗 Vinculaciones:');
        console.log('   Geocerca → Zona → Parque → Vehículos');
        console.log('');
        console.log('✅ Sistema listo para detectar entradas/salidas de parques');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error importando geocercas:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

