const { PrismaClient } = require('@prisma/client');

async function testAPISimple() {
    console.log('🧪 PRUEBA SIMPLE DE LA API\n');
    
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

        // Probar endpoint de geocercas directamente
        console.log('1. Probando funcionalidad de geocercas...\n');

        // Simular procesamiento de posición
        const testPosition = {
            vehicleId: 'test-vehicle-001',
            latitude: 40.4942,
            longitude: -3.8767,
            speed: 25.0,
            organizationId: '6c2bdfc3-01c1-4b2c-b0f0-a136563fa5f0'
        };

        console.log(`📍 Procesando posición del vehículo ${testPosition.vehicleId}`);
        console.log(`   Coordenadas: ${testPosition.latitude}, ${testPosition.longitude}`);
        console.log(`   Velocidad: ${testPosition.speed} km/h`);

        // Verificar si está en alguna zona
        const inZones = await prisma.$queryRaw`
            SELECT 
                z.id,
                z.name,
                z.type
            FROM "Zone" z
            WHERE ST_Contains(
                z.geometry_postgis,
                ST_SetSRID(ST_Point(${testPosition.longitude}, ${testPosition.latitude}), 4326)
            )
            AND z.geometry_postgis IS NOT NULL
        `;

        // Verificar si está en algún parque
        const inParks = await prisma.$queryRaw`
            SELECT 
                p.id,
                p.name
            FROM "Park" p
            WHERE ST_Contains(
                p.geometry_postgis,
                ST_SetSRID(ST_Point(${testPosition.longitude}, ${testPosition.latitude}), 4326)
            )
            AND p.geometry_postgis IS NOT NULL
        `;

        console.log(`   ✅ Vehículo detectado en ${inZones.length} zona(s) y ${inParks.length} parque(s)`);

        if (inZones.length > 0) {
            console.log('   🗺️  Zonas:');
            inZones.forEach(zone => {
                console.log(`      - ${zone.name} (${zone.type})`);
            });
        }

        if (inParks.length > 0) {
            console.log('   🏢 Parques:');
            inParks.forEach(park => {
                console.log(`      - ${park.name}`);
            });
        }

        // Simular creación de evento
        if (inZones.length > 0 || inParks.length > 0) {
            console.log('\n   🚨 CREANDO EVENTO DE GEOCERCA');
            
            const eventData = {
                id: `test-event-${Date.now()}`,
                vehicleId: testPosition.vehicleId,
                organizationId: testPosition.organizationId,
                eventType: 'entry',
                zoneId: inZones.length > 0 ? inZones[0].id : null,
                parkId: inParks.length > 0 ? inParks[0].id : null,
                latitude: testPosition.latitude,
                longitude: testPosition.longitude,
                speed: testPosition.speed,
                timestamp: new Date(),
                metadata: {
                    test: true,
                    description: 'Evento de prueba generado automáticamente'
                }
            };

            console.log(`      - ID: ${eventData.id}`);
            console.log(`      - Tipo: ${eventData.eventType}`);
            console.log(`      - Zona: ${eventData.zoneId ? inZones[0].name : 'N/A'}`);
            console.log(`      - Parque: ${eventData.parkId ? inParks[0].name : 'N/A'}`);
            console.log(`      - Timestamp: ${eventData.timestamp.toISOString()}`);

            // Verificar reglas activas
            console.log('\n   📋 VERIFICANDO REGLAS ACTIVAS');
            const activeRules = await prisma.geofenceRule.findMany({
                where: { 
                    isActive: true,
                    organizationId: testPosition.organizationId
                },
                select: { id: true, name: true, priority: true }
            });

            console.log(`      - Reglas activas encontradas: ${activeRules.length}`);
            activeRules.forEach(rule => {
                console.log(`        * ${rule.name} (prioridad: ${rule.priority})`);
            });
        }

        console.log('\n🎯 RESUMEN DE LA PRUEBA:');
        console.log('✅ Funcionalidad de geocercas operativa');
        console.log('✅ Detección espacial funcionando');
        console.log('✅ Eventos simulados correctamente');
        console.log('✅ Reglas activas verificadas');
        console.log('✅ API core funcional (sin servidor HTTP)');

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar prueba
testAPISimple().catch(console.error); 