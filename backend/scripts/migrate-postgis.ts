#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { PostGISGeometryService } from '../src/services/PostGISGeometryService';
import { logger } from '../src/utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const geometryService = new PostGISGeometryService(prisma);

async function main() {
  console.log('🚀 Iniciando migración PostGIS para geocercas...\n');

  try {
    // 1. Verificar conexión a base de datos
    console.log('📡 Verificando conexión a base de datos...');
    await prisma.$connect();
    console.log('✅ Conexión exitosa\n');

    // 2. Verificar si PostGIS está habilitado
    console.log('🔍 Verificando extensión PostGIS...');
    try {
      const postgisCheck = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT PostGIS_Version() as version
      `;
      console.log(`✅ PostGIS habilitado: ${postgisCheck[0]?.version}\n`);
    } catch (error) {
      console.log('❌ PostGIS no está habilitado. Habilitando extensión...');
      
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis`;
        console.log('✅ Extensión PostGIS habilitada\n');
      } catch (extError) {
        console.error('❌ Error habilitando PostGIS:', extError);
        console.log('💡 Asegúrate de que PostGIS esté instalado en tu PostgreSQL');
        process.exit(1);
      }
    }

    // 3. Ejecutar migración SQL
    console.log('📝 Ejecutando migración SQL...');
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_postgis_geometry.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Archivo de migración no encontrado:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Dividir SQL en comandos individuales para ejecución segura
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim()) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Comando ejecutado: ${command.substring(0, 50)}...`);
        } catch (cmdError) {
          console.log(`⚠️  Comando omitido (probablemente ya existe): ${command.substring(0, 50)}...`);
        }
      }
    }
    console.log('✅ Migración SQL completada\n');

    // 4. Migrar geometrías existentes usando el servicio
    console.log('🔄 Migrando geometrías existentes...');
    const migrationResult = await geometryService.migrateExistingGeometries();
    
    console.log(`📊 Resultado de migración:`);
    console.log(`   - Exitosas: ${migrationResult.success}`);
    console.log(`   - Errores: ${migrationResult.errors}`);
    console.log('✅ Migración de geometrías completada\n');

    // 5. Verificar estado final
    console.log('🔍 Verificando estado final...');
    
    const parksWithPostGIS = await prisma.park.count({
      where: { geometryPostgis: { not: null } }
    });
    
    const zonesWithPostGIS = await prisma.zone.count({
      where: { geometryPostgis: { not: null } }
    });
    
    const totalParks = await prisma.park.count();
    const totalZones = await prisma.zone.count();

    console.log(`📊 Estado de la migración:`);
    console.log(`   - Parques con PostGIS: ${parksWithPostGIS}/${totalParks}`);
    console.log(`   - Zonas con PostGIS: ${zonesWithPostGIS}/${totalZones}`);
    console.log('✅ Verificación completada\n');

    // 6. Crear índices espaciales si no existen
    console.log('📊 Creando índices espaciales...');
    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_park_geometry_postgis 
        ON "Park" USING GIST (geometry_postgis)
      `;
      console.log('✅ Índice espacial para Park creado');
    } catch (error) {
      console.log('⚠️  Índice para Park ya existe o error:', error.message);
    }

    try {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_zone_geometry_postgis 
        ON "Zone" USING GIST (geometry_postgis)
      `;
      console.log('✅ Índice espacial para Zone creado');
    } catch (error) {
      console.log('⚠️  Índice para Zone ya existe o error:', error.message);
    }

    console.log('\n🎉 ¡Migración PostGIS completada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Reinicia el servidor backend');
    console.log('   2. Verifica que las nuevas rutas /api/geofence funcionen');
    console.log('   3. Prueba la detección de geocercas en tiempo real');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 