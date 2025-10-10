#!/usr/bin/env node

/**
 * Script para importar la geocerca del Parque de Bomberos de Alcobendas
 * desde radar.com al sistema DobackSoft
 */

import { PrismaClient } from '@prisma/client';
import { geofenceService } from '../src/services/GeofenceService';

const prisma = new PrismaClient();

// Datos de la geocerca de Alcobendas desde radar.com
const alcobendasGeofenceData = {
    "_id": "68db36628bca41a4743fe196",
    "createdAt": "2025-09-30T01:46:10.395Z",
    "updatedAt": "2025-09-30T01:46:10.394Z",
    "live": true,
    "description": "Parque Alcobendas",
    "tag": "parque",
    "externalId": "alcobendas",
    "type": "polygon",
    "mode": "car",
    "geometryCenter": {
        "type": "Point",
        "coordinates": [
            -3.618328905581324,
            40.53553949812811
        ]
    },
    "geometryRadius": 71,
    "disallowedPrecedingTagSubstrings": [],
    "geometry": {
        "type": "Polygon",
        "coordinates": [
            [
                [
                    -3.6182157851212655,
                    40.536219940618956
                ],
                [
                    -3.6187156196533077,
                    40.535932037075234
                ],
                [
                    -3.6190628730376395,
                    40.53536422371056
                ],
                [
                    -3.6187156196533077,
                    40.53474842065209
                ],
                [
                    -3.6174055269571213,
                    40.53521227257284
                ],
                [
                    -3.6178580090653005,
                    40.53576009413895
                ],
                [
                    -3.6182157851212655,
                    40.536219940618956
                ]
            ]
        ]
    },
    "ip": [],
    "enabled": true,
    "place": {}
};

async function importAlcobendasGeofence() {
    try {
        console.log('🚀 Iniciando importación de geocerca de Alcobendas...');

        // Obtener la primera organización disponible (o crear una de prueba)
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
                    { externalId: alcobendasGeofenceData._id },
                    { name: alcobendasGeofenceData.description }
                ]
            }
        });

        if (existingGeofence) {
            console.log(`⚠️  La geocerca ya existe: ${existingGeofence.name} (ID: ${existingGeofence.id})`);
            console.log('🔄 Actualizando geocerca existente...');

            const updatedGeofence = await geofenceService.updateGeofence(existingGeofence.id, {
                name: alcobendasGeofenceData.description,
                description: alcobendasGeofenceData.description,
                tag: alcobendasGeofenceData.tag,
                type: alcobendasGeofenceData.type.toUpperCase() as any,
                mode: alcobendasGeofenceData.mode.toUpperCase() as any,
                enabled: alcobendasGeofenceData.enabled,
                live: alcobendasGeofenceData.live,
                geometry: alcobendasGeofenceData.geometry,
                geometryCenter: alcobendasGeofenceData.geometryCenter,
                geometryRadius: alcobendasGeofenceData.geometryRadius,
                disallowedPrecedingTagSubstrings: alcobendasGeofenceData.disallowedPrecedingTagSubstrings,
                ip: alcobendasGeofenceData.ip,
                organizationId: organization.id
            });

            console.log(`✅ Geocerca actualizada exitosamente: ${updatedGeofence.name}`);
            console.log(`📍 Centro: ${updatedGeofence.geometryCenter?.coordinates?.[1]}, ${updatedGeofence.geometryCenter?.coordinates?.[0]}`);
            console.log(`📏 Radio: ${updatedGeofence.geometryRadius} metros`);

        } else {
            console.log('🆕 Creando nueva geocerca...');

            const newGeofence = await geofenceService.importFromRadar(alcobendasGeofenceData, organization.id);

            console.log(`✅ Geocerca creada exitosamente: ${newGeofence.name}`);
            console.log(`📍 Centro: ${newGeofence.geometryCenter?.coordinates?.[1]}, ${newGeofence.geometryCenter?.coordinates?.[0]}`);
            console.log(`📏 Radio: ${newGeofence.geometryRadius} metros`);
            console.log(`🆔 ID interno: ${newGeofence.id}`);
        }

        // Mostrar información de la geocerca
        console.log('\n📊 Información de la geocerca:');
        console.log(`   Nombre: ${alcobendasGeofenceData.description}`);
        console.log(`   Tipo: ${alcobendasGeofenceData.type.toUpperCase()}`);
        console.log(`   Modo: ${alcobendasGeofenceData.mode.toUpperCase()}`);
        console.log(`   Habilitada: ${alcobendasGeofenceData.enabled}`);
        console.log(`   En vivo: ${alcobendasGeofenceData.live}`);
        console.log(`   Coordenadas del polígono:`);

        alcobendasGeofenceData.geometry.coordinates[0].forEach((coord, index) => {
            console.log(`     ${index + 1}. ${coord[1]}, ${coord[0]}`);
        });

        console.log('\n🎯 Próximos pasos:');
        console.log('   1. Ejecutar migración de base de datos: npx prisma migrate dev');
        console.log('   2. Generar cliente Prisma: npx prisma generate');
        console.log('   3. Probar la API: GET /api/geofences');
        console.log('   4. Verificar en el frontend');

    } catch (error) {
        console.error('❌ Error importando geocerca:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
if (require.main === module) {
    importAlcobendasGeofence()
        .then(() => {
            console.log('\n🎉 Importación completada exitosamente!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Error en la importación:', error);
            process.exit(1);
        });
}

export { importAlcobendasGeofence };
