import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populateGeofences() {
    try {
        console.log('🚒 Poblando geofences para Bomberos Madrid...\n');

        // Buscar organización de Bomberos Madrid
        let organization = await prisma.organization.findFirst({
            where: {
                name: {
                    contains: 'Bomberos',
                    mode: 'insensitive'
                }
            }
        });

        if (!organization) {
            console.log('⚠️  No se encontró la organización de Bomberos Madrid. Creándola...');
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    apiKey: 'bomberos-madrid-' + Date.now(),
                }
            });
            console.log(`✅ Organización creada: ${organization.name}`);
        } else {
            console.log(`✅ Organización encontrada: ${organization.name}`);
        }

        // Eliminar geofences existentes para evitar duplicados
        const deleted = await prisma.geofence.deleteMany({
            where: { organizationId: organization.id }
        });
        console.log(`🗑️  Eliminadas ${deleted.count} geofences existentes\n`);

        // Datos reales de Parques de Bomberos de Madrid
        const geofencesData = [
            {
                name: "Parque Central - Puerta del Sol",
                description: "Parque central de bomberos en el corazón de Madrid",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_CENTRAL",
                geometry: {
                    type: "Circle",
                    center: [40.4168, -3.7038],
                    radius: 200
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7038, 40.4168]
                },
                geometryRadius: 200
            },
            {
                name: "Parque 1 - Chamberí",
                description: "Parque de bomberos en distrito Chamberí, zona residencial densa",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_1_CHAMBERI",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7100, 40.4400],
                        [-3.7050, 40.4400],
                        [-3.7050, 40.4350],
                        [-3.7100, 40.4350],
                        [-3.7100, 40.4400]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7075, 40.4375]
                }
            },
            {
                name: "Parque 2 - Carabanchel",
                description: "Parque de bomberos en Carabanchel, zona industrial y residencial",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_2_CARABANCHEL",
                geometry: {
                    type: "Circle",
                    center: [40.3850, -3.7400],
                    radius: 250
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7400, 40.3850]
                },
                geometryRadius: 250
            },
            {
                name: "Parque 3 - Vallecas",
                description: "Parque de bomberos en Puente de Vallecas",
                type: "RECTANGLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_3_VALLECAS",
                geometry: {
                    type: "Rectangle",
                    bounds: {
                        north: 40.3750,
                        south: 40.3700,
                        east: -3.6300,
                        west: -3.6350
                    }
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6325, 40.3725]
                }
            },
            {
                name: "Parque 4 - Retiro",
                description: "Parque cerca del Retiro, zona alta densidad turística",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_4_RETIRO",
                geometry: {
                    type: "Circle",
                    center: [40.4153, -3.6824],
                    radius: 180
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6824, 40.4153]
                },
                geometryRadius: 180
            },
            {
                name: "Zona de Alto Riesgo - Gran Vía",
                description: "Zona comercial de alto riesgo con alta densidad de población",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "ZONA_RIESGO_GRANVIA",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7150, 40.4220],
                        [-3.7050, 40.4220],
                        [-3.7050, 40.4170],
                        [-3.7150, 40.4170],
                        [-3.7150, 40.4220]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7100, 40.4195]
                }
            },
            {
                name: "Zona Industrial - Villaverde",
                description: "Área industrial con riesgo de incendios químicos",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "ZONA_INDUSTRIAL_VILLAVERDE",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7050, 40.3450],
                        [-3.6900, 40.3450],
                        [-3.6900, 40.3350],
                        [-3.7050, 40.3350],
                        [-3.7050, 40.3450]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6975, 40.3400]
                }
            },
            {
                name: "Hospital La Paz - Zona Prioritaria",
                description: "Zona prioritaria alrededor del Hospital La Paz",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "HOSPITAL_LA_PAZ",
                geometry: {
                    type: "Circle",
                    center: [40.4789, -3.7112],
                    radius: 300
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7112, 40.4789]
                },
                geometryRadius: 300
            },
            {
                name: "Aeropuerto Barajas - Zona Crítica",
                description: "Zona crítica del Aeropuerto Adolfo Suárez Madrid-Barajas",
                type: "RECTANGLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "AEROPUERTO_BARAJAS",
                geometry: {
                    type: "Rectangle",
                    bounds: {
                        north: 40.4950,
                        south: 40.4850,
                        east: -3.5500,
                        west: -3.5650
                    }
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.5575, 40.4900]
                }
            },
            {
                name: "Estadio Santiago Bernabéu",
                description: "Zona de eventos masivos - Estadio Santiago Bernabéu",
                type: "CIRCLE",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "ESTADIO_BERNABEU",
                geometry: {
                    type: "Circle",
                    center: [40.4531, -3.6883],
                    radius: 250
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6883, 40.4531]
                },
                geometryRadius: 250
            },
            {
                name: "Palacio Real - Zona Histórica",
                description: "Zona histórica protegida - Palacio Real de Madrid",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PALACIO_REAL",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.7180, 40.4200],
                        [-3.7120, 40.4200],
                        [-3.7120, 40.4160],
                        [-3.7180, 40.4160],
                        [-3.7180, 40.4200]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.7150, 40.4180]
                }
            },
            {
                name: "Parque Las Rozas",
                description: "Parque de bomberos en Las Rozas, zona metropolitana norte",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_LAS_ROZAS",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.8750, 40.4950],
                        [-3.8700, 40.4950],
                        [-3.8700, 40.4900],
                        [-3.8750, 40.4900],
                        [-3.8750, 40.4950]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.8725, 40.4925]
                }
            },
            {
                name: "Parque Alcobendas",
                description: "Parque de bomberos en Alcobendas, zona norte empresarial",
                type: "POLYGON",
                mode: "CAR",
                enabled: true,
                live: true,
                tag: "PARQUE_ALCOBENDAS",
                geometry: {
                    type: "Polygon",
                    coordinates: [[
                        [-3.6450, 40.5450],
                        [-3.6400, 40.5450],
                        [-3.6400, 40.5400],
                        [-3.6450, 40.5400],
                        [-3.6450, 40.5450]
                    ]]
                },
                geometryCenter: {
                    type: "Point",
                    coordinates: [-3.6425, 40.5425]
                }
            }
        ];

        console.log(`📝 Creando ${geofencesData.length} geofences...\n`);

        // Crear todas las geofences
        const createdGeofences = [];
        for (const data of geofencesData) {
            const geofence = await prisma.geofence.create({
                data: {
                    ...data,
                    organizationId: organization.id
                }
            });
            createdGeofences.push(geofence);
            console.log(`✅ ${geofence.name} (${geofence.type})`);
        }

        console.log(`\n✨ ¡Proceso completado! Se crearon ${createdGeofences.length} geofences para ${organization.name}`);
        console.log(`\n📊 Resumen:`);
        console.log(`   - Círculos: ${createdGeofences.filter(g => g.type === 'CIRCLE').length}`);
        console.log(`   - Polígonos: ${createdGeofences.filter(g => g.type === 'POLYGON').length}`);
        console.log(`   - Rectángulos: ${createdGeofences.filter(g => g.type === 'RECTANGLE').length}`);
        console.log(`   - Activas: ${createdGeofences.filter(g => g.enabled).length}`);
        console.log(`   - En vivo: ${createdGeofences.filter(g => g.live).length}`);

    } catch (error) {
        console.error('❌ Error poblando geofences:', error);
    } finally {
        await prisma.$disconnect();
    }
}

populateGeofences();

