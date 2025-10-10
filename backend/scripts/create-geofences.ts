/**
 * Script para crear geocercas reales para Bomberos Madrid
 * Ejecutar con: npx ts-node backend/scripts/create-geofences.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realGeofences = [
    {
        name: "Parque de Bomberos Central - Puerta del Sol",
        description: "Estación central de bomberos en Puerta del Sol, Madrid",
        type: "CIRCLE" as const,
        mode: "CAR" as const,
        enabled: true,
        live: true,
        geometry: {
            type: "Circle",
            center: [40.4168, -3.7038],
            radius: 150
        },
        geometryCenter: {
            type: "Point",
            coordinates: [-3.7038, 40.4168]
        },
        geometryRadius: 150,
        tag: "CENTRAL"
    },
    {
        name: "Parque de Bomberos Chamberí",
        description: "Estación de bomberos en el distrito de Chamberí",
        type: "POLYGON" as const,
        mode: "CAR" as const,
        enabled: true,
        live: true,
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-3.7000, 40.4350],
                [-3.6950, 40.4350],
                [-3.6950, 40.4300],
                [-3.7000, 40.4300],
                [-3.7000, 40.4350]
            ]]
        },
        geometryCenter: {
            type: "Point",
            coordinates: [-3.6975, 40.4325]
        },
        tag: "CHAMBERI"
    },
    {
        name: "Zona de Alto Riesgo - Gran Vía",
        description: "Área comercial de alto riesgo en Gran Vía con alta densidad de población",
        type: "POLYGON" as const,
        mode: "CAR" as const,
        enabled: true,
        live: true,
        geometry: {
            type: "Polygon",
            coordinates: [[
                [-3.7100, 40.4200],
                [-3.7050, 40.4200],
                [-3.7050, 40.4150],
                [-3.7100, 40.4150],
                [-3.7100, 40.4200]
            ]]
        },
        geometryCenter: {
            type: "Point",
            coordinates: [-3.7075, 40.4175]
        },
        tag: "GRAN_VIA"
    },
    {
        name: "Parque de Bomberos Vallecas",
        description: "Estación de bomberos en Vallecas, zona residencial",
        type: "RECTANGLE" as const,
        mode: "CAR" as const,
        enabled: true,
        live: true,
        geometry: {
            type: "Rectangle",
            bounds: {
                north: 40.3650,
                south: 40.3600,
                east: -3.6200,
                west: -3.6250
            }
        },
        geometryCenter: {
            type: "Point",
            coordinates: [-3.6225, 40.3625]
        },
        tag: "VALLECAS"
    },
    {
        name: "Zona Industrial - Carabanchel",
        description: "Área industrial con riesgo de incendios químicos",
        type: "CIRCLE" as const,
        mode: "CAR" as const,
        enabled: true,
        live: true,
        geometry: {
            type: "Circle",
            center: [40.3850, -3.7200],
            radius: 200
        },
        geometryCenter: {
            type: "Point",
            coordinates: [-3.7200, 40.3850]
        },
        geometryRadius: 200,
        tag: "CARABANCHEL"
    }
];

async function main() {
    try {
        console.log('🚨 Creando geofences reales para Bomberos Madrid...');

        // Obtener o crear la organización de Bomberos Madrid
        let organization = await prisma.organization.findFirst({
            where: {
                OR: [
                    { name: { contains: 'Bomberos', mode: 'insensitive' } },
                    { name: { contains: 'Madrid', mode: 'insensitive' } }
                ]
            }
        });

        if (!organization) {
            console.log('📝 Organización no encontrada, creando Bomberos Madrid...');
            // Generar API key única
            const apiKey = `bmad_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    apiKey: apiKey
                }
            });
            console.log(`✅ Organización creada: ${organization.id}`);
        } else {
            console.log(`✅ Organización encontrada: ${organization.name} (${organization.id})`);
        }

        // Eliminar relaciones existentes antes de eliminar geofences
        const existingGeofences = await prisma.geofence.findMany({
            where: { organizationId: organization.id },
            select: { id: true }
        });
        const existingGeofenceIds = existingGeofences.map(g => g.id);

        if (existingGeofenceIds.length > 0) {
            // Eliminar eventos de geocerca relacionados
            await prisma.geofenceEvent.deleteMany({
                where: { geofenceId: { in: existingGeofenceIds } }
            });

            // Eliminar estados de vehículos relacionados con geocercas
            await prisma.geofenceVehicleState.deleteMany({
                where: { geofenceId: { in: existingGeofenceIds } }
            });

            console.log(`🗑️  Limpiadas relaciones de ${existingGeofenceIds.length} geocercas`);
        }

        // Ahora sí eliminar las geofences
        const deletedCount = await prisma.geofence.deleteMany({
            where: { organizationId: organization.id }
        });
        console.log(`🗑️  Eliminadas ${deletedCount.count} geocercas anteriores`);

        // Crear nuevas geofences
        const createdGeofences = [];
        for (const geofenceData of realGeofences) {
            const geofence = await prisma.geofence.create({
                data: {
                    name: geofenceData.name,
                    description: geofenceData.description,
                    type: geofenceData.type,
                    mode: geofenceData.mode,
                    enabled: geofenceData.enabled,
                    live: geofenceData.live,
                    geometry: geofenceData.geometry,
                    geometryCenter: geofenceData.geometryCenter,
                    geometryRadius: geofenceData.geometryRadius,
                    tag: geofenceData.tag,
                    organizationId: organization.id
                }
            });
            createdGeofences.push(geofence);
            console.log(`  ✅ ${geofence.name}`);
        }

        console.log(`\n🎉 ¡${createdGeofences.length} geocercas creadas exitosamente!`);
        console.log(`\nGeocercas activas:`);
        createdGeofences.forEach((g, i) => {
            console.log(`  ${i + 1}. ${g.name} (${g.type}) - ${g.tag}`);
        });

        // Verificar las geocercas creadas
        const allGeofences = await prisma.geofence.findMany({
            where: { organizationId: organization.id }
        });
        console.log(`\n📊 Total de geocercas en la base de datos: ${allGeofences.length}`);

    } catch (error) {
        console.error('❌ Error creando geofences:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

