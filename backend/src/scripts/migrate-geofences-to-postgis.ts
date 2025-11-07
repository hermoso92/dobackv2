/**
 * 🔄 MIGRACIÓN: Geocercas JSON → PostGIS
 * 
 * Convierte las geocercas existentes con geometría JSON a PostGIS
 */

import { prisma } from '../config/prisma';
import { PostGISGeometryService } from '../services/PostGISGeometryService';
import { logger } from '../utils/logger';

async function migrateGeofencesToPostGIS() {
    console.log('\n🔄 MIGRACIÓN: Geocercas JSON → PostGIS');
    console.log('='.repeat(60));

    const postgisService = new PostGISGeometryService(prisma);
    let success = 0;
    let failed = 0;

    try {
        // Obtener geocercas sin PostGIS (usando raw query)
        const geofences = await prisma.$queryRaw<Array<{
            id: string;
            name: string;
            type: string;
            geometry: any;
        }>>`
            SELECT id, name, type, geometry
            FROM "Geofence"
            WHERE geometry_postgis IS NULL
        `;

        console.log(`\n📍 Encontradas ${geofences.length} geocercas sin PostGIS\n`);

        for (const geofence of geofences) {
            try {
                console.log(`Procesando: ${geofence.name} (${geofence.type})`);

                if (!geofence.geometry) {
                    console.log(`  ⚠️  Sin geometría JSON, saltando...`);
                    failed++;
                    continue;
                }

                // Convertir geometría JSON a PostGIS
                const postgisGeom = await postgisService.convertJsonToPostGIS(geofence.geometry);

                if (!postgisGeom) {
                    console.log(`  ❌ Error: No se pudo convertir geometría`);
                    failed++;
                    continue;
                }

                // Actualizar en BD usando raw query para insertar PostGIS
                await prisma.$executeRawUnsafe(`
                    UPDATE "Geofence"
                    SET geometry_postgis = ST_GeomFromText($1, 4326)
                    WHERE id = $2
                `, postgisGeom, geofence.id);

                console.log(`  ✅ Convertido exitosamente`);
                success++;

            } catch (error) {
                console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Desconocido'}`);
                failed++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Migración completada:`);
        console.log(`   - Exitosas: ${success}`);
        console.log(`   - Fallidas: ${failed}`);
        console.log(`   - Total: ${geofences.length}`);

        // Verificar resultado
        const withPostGIS = await prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*) as count
            FROM "Geofence"
            WHERE geometry_postgis IS NOT NULL
        `;

        console.log(`\n📊 Geocercas con PostGIS ahora: ${withPostGIS[0].count}`);

    } catch (error) {
        logger.error('Error en migración:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
migrateGeofencesToPostGIS()
    .then(() => {
        console.log('\n✅ MIGRACIÓN FINALIZADA\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error en migración:', error);
        process.exit(1);
    });

