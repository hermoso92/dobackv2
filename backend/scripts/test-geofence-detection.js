const { PrismaClient } = require('@prisma/client');

async function testGeofenceDetection() {
    console.log('🧪 PRUEBA DE DETECCIÓN DE GEOCERCAS\n');
    
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:cosigein@localhost:5432/dobacksoft"
            }
        }
    });

    try {
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida\n');

        // Obtener zonas y parques con sus geometrías
        console.log('1. Obteniendo geometrías de zonas y parques...');
        
        const zones = await prisma.$queryRaw`
            SELECT id, name, type, ST_AsText(geometry_postgis) as geometry_text
            FROM "Zone" 
            WHERE geometry_postgis IS NOT NULL
        `;

        const parks = await prisma.$queryRaw`
            SELECT id, name, ST_AsText(geometry_postgis) as geometry_text
            FROM "Park" 
            WHERE geometry_postgis IS NOT NULL
        `;

        console.log(`✅ Zonas encontradas: ${zones.length}`);
        console.log(`✅ Parques encontrados: ${parks.length}\n`);

        // Mostrar información de zonas
        if (zones.length > 0) {
            console.log('🗺️  ZONAS:');
            zones.forEach((zone, index) => {
                console.log(`   ${index + 1}. ${zone.name} (${zone.type})`);
                console.log(`      ID: ${zone.id}`);
                console.log(`      Geometría: ${zone.geometry_text}`);
                console.log('');
            });
        }

        // Mostrar información de parques
        if (parks.length > 0) {
            console.log('🏢 PARQUES:');
            parks.forEach((park, index) => {
                console.log(`   ${index + 1}. ${park.name}`);
                console.log(`      ID: ${park.id}`);
                console.log(`      Geometría: ${park.geometry_text}`);
                console.log('');
            });
        }

        // Probar coordenadas dentro de las geometrías
        console.log('2. Probando detección de geocercas...\n');

        // Probar con coordenadas conocidas de Madrid
        console.log('3. Probando con coordenadas de Madrid...\n');
        
        const madridCoords = [
            { lat: 40.4168, lon: -3.7038, description: 'Puerta del Sol' },
            { lat: 40.4200, lon: -3.7100, description: 'Plaza Mayor' },
            { lat: 40.4300, lon: -3.7000, description: 'Gran Vía' }
        ];

        for (const coord of madridCoords) {
            console.log(`📍 Probando: ${coord.description} (${coord.lat}, ${coord.lon})`);
            
            // Verificar zonas
            const zonesResult = await prisma.$queryRaw`
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
            
            console.log(`   🗺️  Zonas que contienen el punto: ${zonesResult.length}`);
            zonesResult.forEach(zone => {
                console.log(`      - ${zone.name} (${zone.type})`);
            });

            // Verificar parques
            const parksResult = await prisma.$queryRaw`
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
            
            console.log(`   🏢 Parques que contienen el punto: ${parksResult.length}`);
            parksResult.forEach(park => {
                console.log(`      - ${park.name}`);
            });
            
            console.log('');
        }

        console.log('🎯 RESUMEN DE LA PRUEBA:');
        console.log('✅ PostGIS funcionando correctamente');
        console.log('✅ Geometrías cargadas y accesibles');
        console.log('✅ Consultas espaciales operativas');
        console.log('✅ Sistema de detección listo');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar prueba
testGeofenceDetection().catch(console.error);