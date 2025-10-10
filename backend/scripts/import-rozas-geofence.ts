#!/usr/bin/env node

/**
 * Script para importar la geocerca del Parque de Bomberos de Las Rozas
 * desde radar.com al sistema DobackSoft
 */

import { PrismaClient } from '@prisma/client';
import { geofenceService } from '../src/services/GeofenceService';

const prisma = new PrismaClient();

// Datos de la geocerca de Las Rozas desde radar.com
const rozasGeofenceData = {
    "_id": "68db4b4aeff6af4d34e55b39",
    "createdAt": "2025-09-30T03:15:22.125Z",
    "updatedAt": "2025-09-30T03:15:22.124Z",
    "live": true,
    "description": "Parque Las Rozas",
    "tag": "parque",
    "externalId": "rozas",
    "type": "polygon",
    "mode": "car",
    "geometryCenter": {
        "type": "Point",
        "coordinates": [
            -3.8841334864808306,
            40.5202177500439
        ]
    },
    "geometryRadius": 194,
    "disallowedPrecedingTagSubstrings": [],
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -3.8824916163242125,
                    40.52197243635178
                ],
                [
                    -3.8851186084482996,
                    40.5211501677684
                ],
                [
                    -3.8850606602334543,
                    40.52090789012914
                ],
                [
                    -3.8854566405618645,
                    40.5207610548202
                ],
                [
                    -3.8854373247357885,
                    40.51932205133368
                ],
                [
                    -3.884809550811229,
                    40.51823543735193
                ],
                [
                    -3.880560004250965,
                    40.51917521255216
                ],
                [
                    -3.8824916163242125,
                    40.52197243635178
                ]
            ]
        ]
    },
    "ip": [],
    "enabled": true,
    "place": {}
};

async function importRozasGeofence() {
    try {
        console.log('🚀 Iniciando importación de geocerca de Las Rozas...');

        // Obtener la primera organización disponible (Bomberos Madrid)
        let organization = await prisma.organization.findFirst();

        if (!organization) {
            console.log('📝 Creando organización de prueba...');
            organization = await prisma.organization.create({
                data: {
                    name: 'Bomberos Madrid',
                    apiKey: 'test-api-key-' + Date.now()
                }
            });
            console.log(`✅ Organización creada: ${organization.name} (ID: ${organization.id})`);
        } else {
            console.log(`✅ Usando organización existente: ${organization.name} (ID: ${organization.id})`);
        }

        // Verificar si la geocerca ya existe
        const existingGeofence = await prisma.geofence.findFirst({
            where: {
                OR: [
                    { externalId: rozasGeofenceData._id },
                    { name: rozasGeofenceData.description }
                ]
            }
        });

        if (existingGeofence) {
            console.log(`⚠️  La geocerca ya existe: ${existingGeofence.name} (ID: ${existingGeofence.id})`);
            console.log('🔄 Actualizando geocerca existente...');

            const updatedGeofence = await geofenceService.updateGeofence(existingGeofence.id, {
                name: rozasGeofenceData.description,
                description: rozasGeofenceData.description,
                tag: rozasGeofenceData.tag,
                type: rozasGeofenceData.type.toUpperCase() as any,
                mode: rozasGeofenceData.mode.toUpperCase() as any,
                enabled: rozasGeofenceData.enabled,
                live: rozasGeofenceData.live,
                geometry: rozasGeofenceData.geometry,
                geometryCenter: rozasGeofenceData.geometryCenter,
                geometryRadius: rozasGeofenceData.geometryRadius,
                disallowedPrecedingTagSubstrings: rozasGeofenceData.disallowedPrecedingTagSubstrings,
                ip: rozasGeofenceData.ip,
                organizationId: organization.id
            });

            console.log(`✅ Geocerca actualizada exitosamente: ${updatedGeofence.name}`);
            console.log(`📍 Centro: ${updatedGeofence.geometryCenter?.coordinates?.[1]}, ${updatedGeofence.geometryCenter?.coordinates?.[0]}`);
            console.log(`📏 Radio: ${updatedGeofence.geometryRadius} metros`);

        } else {
            console.log('🆕 Creando nueva geocerca...');

            const newGeofence = await geofenceService.importFromRadar(rozasGeofenceData, organization.id);

            console.log(`✅ Geocerca creada exitosamente: ${newGeofence.name}`);
            console.log(`📍 Centro: ${newGeofence.geometryCenter?.coordinates?.[1]}, ${newGeofence.geometryCenter?.coordinates?.[0]}`);
            console.log(`📏 Radio: ${newGeofence.geometryRadius} metros`);
            console.log(`🆔 ID interno: ${newGeofence.id}`);
        }

        // Mostrar información de la geocerca
        console.log('\n📊 Información de la geocerca:');
        console.log(`   Nombre: ${rozasGeofenceData.description}`);
        console.log(`   Tipo: ${rozasGeofenceData.type.toUpperCase()}`);
        console.log(`   Modo: ${rozasGeofenceData.mode.toUpperCase()}`);
        console.log(`   Habilitada: ${rozasGeofenceData.enabled}`);
        console.log(`   En vivo: ${rozasGeofenceData.live}`);
        console.log(`   Coordenadas del polígono:`);

        rozasGeofenceData.geometry.coordinates[0].forEach((coord, index) => {
            console.log(`     ${index + 1}. ${coord[1]}, ${coord[0]}`);
        });

        // Mostrar resumen de todas las geocercas
        const totalGeofences = await prisma.geofence.count({
            where: { organizationId: organization.id }
        });

        console.log('\n🗺️ Resumen de geocercas en la organización:');
        console.log(`   Total: ${totalGeofences}`);

        const allGeofences = await prisma.geofence.findMany({
            where: { organizationId: organization.id },
            select: { name: true, type: true, enabled: true }
        });

        allGeofences.forEach((geofence, index) => {
            console.log(`   ${index + 1}. ${geofence.name} (${geofence.type}) - ${geofence.enabled ? 'Activa' : 'Inactiva'}`);
        });

    } catch (error) {
        console.error('❌ Error importando geocerca:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
if (require.main === module) {
    importRozasGeofence()
        .then(() => {
            console.log('\n🎉 Importación completada exitosamente!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Error en la importación:', error);
            process.exit(1);
        });
}

export { importRozasGeofence };
