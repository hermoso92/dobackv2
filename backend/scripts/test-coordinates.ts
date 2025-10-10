#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCoordinates() {
    console.log('🧪 Probando coordenadas y geometrías...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida');

        // Obtener zonas y parques
        const zones = await prisma.zone.findMany({
            where: { geometryPostgis: { not: null } },
            take: 3
        });

        const parks = await prisma.park.findMany({
            where: { geometryPostgis: { not: null } },
            take: 3
        });

        console.log(`📋 Zonas encontradas: ${zones.length}`);
        console.log(`📋 Parques encontrados: ${parks.length}`);

        // Probar coordenadas específicas
        const testCoordinates = [
            { lat: 40.5405, lon: -3.6415, description: 'Coordenada de prueba 1' },
            { lat: 40.4955, lon: -3.8790, description: 'Coordenada de prueba 2' }
        ];

        for (const coord of testCoordinates) {
            console.log(`\n📍 Probando: ${coord.description} (${coord.lat}, ${coord.lon})`);

            // Probar con PostGIS directamente
            const result = await prisma.$queryRaw<Array<{ id: string; name: string; type: string }>>`
                SELECT 
                  z.id,
                  z.name,
                  z.type
                FROM "Zone" z
                WHERE ST_Contains(
                  z.geometry_postgis,
                  ST_SetSRID(ST_Point(${coord.lon}, ${coord.lat}), 4326)
                )
                AND z.geometry_postgis IS NOT NULL
            `;

            console.log(`   🗺️  Zonas que contienen el punto: ${result.length}`);
            result.forEach(zone => {
                console.log(`      - ${zone.name} (${zone.type})`);
            });

            // Probar con parques
            const parkResult = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
                SELECT 
                  p.id,
                  p.name
                FROM "Park" p
                WHERE ST_Contains(
                  p.geometry_postgis,
                  ST_SetSRID(ST_Point(${coord.lon}, ${coord.lat}), 4326)
                )
                AND p.geometry_postgis IS NOT NULL
            `;

            console.log(`   🏢 Parques que contienen el punto: ${parkResult.length}`);
            parkResult.forEach(park => {
                console.log(`      - ${park.name}`);
            });
        }

        // Mostrar geometrías existentes
        console.log('\n📋 Geometrías existentes:');

        if (zones.length > 0) {
            console.log('\n🗺️  Zonas:');
            for (const zone of zones) {
                const geometry = await prisma.$queryRaw<Array<{ geometry_text: string }>>`
                    SELECT ST_AsText(geometry_postgis) as geometry_text 
                    FROM "Zone" 
                    WHERE id = ${zone.id}
                `;
                console.log(`   - ${zone.name}: ${geometry[0]?.geometry_text || 'N/A'}`);
            }
        }

        if (parks.length > 0) {
            console.log('\n🏢 Parques:');
            for (const park of parks) {
                const geometry = await prisma.$queryRaw<Array<{ geometry_text: string }>>`
                    SELECT ST_AsText(geometry_postgis) as geometry_text 
                    FROM "Park" 
                    WHERE id = ${park.id}
                `;
                console.log(`   - ${park.name}: ${geometry[0]?.geometry_text || 'N/A'}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    testCoordinates().catch(console.error);
}

export { testCoordinates };
