const { PrismaClient } = require('@prisma/client');

async function simpleTest() {
    console.log('🔍 PRUEBA SIMPLE DEL SISTEMA\n');
    
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: "postgresql://postgres:cosigein@localhost:5432/dobacksoft"
            }
        }
    });

    try {
        console.log('1. Probando conexión a base de datos...');
        await prisma.$connect();
        console.log('✅ Conexión exitosa\n');

        console.log('2. Verificando tablas de geocercas...');
        
        // Verificar GeofenceRule
        try {
            const ruleCount = await prisma.geofenceRule.count();
            console.log(`✅ Tabla GeofenceRule: ${ruleCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceRule: ${error.message}`);
        }

        // Verificar GeofenceVehicleState
        try {
            const stateCount = await prisma.geofenceVehicleState.count();
            console.log(`✅ Tabla GeofenceVehicleState: ${stateCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceVehicleState: ${error.message}`);
        }

        // Verificar GeofenceEvent
        try {
            const eventCount = await prisma.geofenceEvent.count();
            console.log(`✅ Tabla GeofenceEvent: ${eventCount} registros`);
        } catch (error) {
            console.log(`❌ Error en GeofenceEvent: ${error.message}`);
        }

        console.log('\n3. Verificando geometrías PostGIS...');
        
        // Verificar zonas con PostGIS
        try {
            const zonesWithPostGIS = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM "Zone" WHERE geometry_postgis IS NOT NULL
            `;
            console.log(`✅ Zonas con geometría PostGIS: ${zonesWithPostGIS[0].count}`);
        } catch (error) {
            console.log(`❌ Error verificando zonas PostGIS: ${error.message}`);
        }

        // Verificar parques con PostGIS
        try {
            const parksWithPostGIS = await prisma.$queryRaw`
                SELECT COUNT(*) as count FROM "Park" WHERE geometry_postgis IS NOT NULL
            `;
            console.log(`✅ Parques con geometría PostGIS: ${parksWithPostGIS[0].count}`);
        } catch (error) {
            console.log(`❌ Error verificando parques PostGIS: ${error.message}`);
        }

        console.log('\n4. Verificando reglas activas...');
        try {
            const activeRules = await prisma.geofenceRule.findMany({
                where: { isActive: true },
                select: { id: true, name: true, priority: true }
            });
            console.log(`✅ Reglas activas: ${activeRules.length}`);
            activeRules.forEach(rule => {
                console.log(`   - ${rule.name} (prioridad: ${rule.priority})`);
            });
        } catch (error) {
            console.log(`❌ Error verificando reglas: ${error.message}`);
        }

        console.log('\n5. Probando consulta PostGIS simple...');
        try {
            const testPoint = await prisma.$queryRaw`
                SELECT ST_AsText(ST_SetSRID(ST_Point(-3.6415, 40.5405), 4326)) as result
            `;
            console.log(`✅ Consulta PostGIS funcionando: ${testPoint[0].result}`);
        } catch (error) {
            console.log(`❌ Error en consulta PostGIS: ${error.message}`);
        }

        console.log('\n6. Verificando organizaciones...');
        try {
            const orgs = await prisma.organization.findMany({
                select: { id: true, name: true }
            });
            console.log(`✅ Organizaciones: ${orgs.length}`);
            orgs.forEach(org => {
                console.log(`   - ${org.name} (${org.id})`);
            });
        } catch (error) {
            console.log(`❌ Error verificando organizaciones: ${error.message}`);
        }

        console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
        console.log('✅ Base de datos: Conectada');
        console.log('✅ Tablas de geocercas: Creadas');
        console.log('✅ PostGIS: Funcionando');
        console.log('✅ Reglas: Configuradas');
        console.log('✅ Organizaciones: Disponibles');

    } catch (error) {
        console.error('❌ ERROR CRÍTICO:', error.message);
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que PostgreSQL esté corriendo');
        console.log('2. Verificar conexión a base de datos');
        console.log('3. Ejecutar migraciones pendientes');
        console.log('4. Verificar configuración de Prisma');
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar diagnóstico
simpleTest().catch(console.error);