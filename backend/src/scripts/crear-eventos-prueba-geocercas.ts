/**
 * 🧪 CREAR EVENTOS DE PRUEBA - GEOCERCAS
 * 
 * Crea eventos de ejemplo para verificar que la visualización funciona
 */

import { prisma } from '../config/prisma';

async function crearEventosPrueba() {
    console.log('\n🧪 CREANDO EVENTOS DE PRUEBA');
    console.log('='.repeat(80));

    try {
        // 1. Obtener geocercas activas
        const geofences = await prisma.geofence.findMany({
            where: { enabled: true }
        });

        if (geofences.length === 0) {
            console.log('❌ No hay geocercas activas');
            return;
        }

        console.log(`\n✅ Geocercas encontradas: ${geofences.length}`);

        // 2. Obtener un vehículo
        const vehicle = await prisma.vehicle.findFirst({
            where: { licensePlate: { contains: 'DOBACK' } }
        });

        if (!vehicle) {
            console.log('❌ No se encontró vehículo');
            return;
        }

        console.log(`✅ Vehículo: ${vehicle.licensePlate}`);

        // 3. Crear eventos de prueba para cada geocerca
        let count = 0;
        const now = new Date();

        for (const geofence of geofences) {
            const center = geofence.geometryCenter as any;
            if (!center) continue;

            const lat = center.coordinates[1];
            const lon = center.coordinates[0];

            console.log(`\n📍 Creando eventos para: ${geofence.name}`);

            // Evento ENTER (hace 2 horas)
            const enterTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            await prisma.$executeRaw`
                INSERT INTO "GeofenceEvent" (
                    id, "geofenceId", "vehicleId", "organizationId",
                    type, timestamp, latitude, longitude, status, "updatedAt"
                ) VALUES (
                    (gen_random_uuid())::text,
                    ${geofence.id},
                    ${vehicle.id},
                    ${vehicle.organizationId},
                    'ENTER'::"GeofenceEventType",
                    ${enterTime},
                    ${lat},
                    ${lon},
                    'ACTIVE'::"GeofenceEventStatus",
                    NOW()
                )
            `;
            console.log(`   ✅ ENTER @ ${enterTime.toISOString()}`);
            count++;

            // Evento EXIT (hace 1 hora)
            const exitTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            await prisma.$executeRaw`
                INSERT INTO "GeofenceEvent" (
                    id, "geofenceId", "vehicleId", "organizationId",
                    type, timestamp, latitude, longitude, status, "updatedAt"
                ) VALUES (
                    (gen_random_uuid())::text,
                    ${geofence.id},
                    ${vehicle.id},
                    ${vehicle.organizationId},
                    'EXIT'::"GeofenceEventType",
                    ${exitTime},
                    ${lat},
                    ${lon},
                    'ACTIVE'::"GeofenceEventStatus",
                    NOW()
                )
            `;
            console.log(`   ✅ EXIT @ ${exitTime.toISOString()}`);
            count++;
        }

        console.log(`\n\n✅ EVENTOS CREADOS: ${count}`);
        console.log(`\n🎉 Ahora ve a "Geofences" → "Eventos de Geocercas" para verlos!`);

        // Verificar
        const totalEvents = await prisma.geofenceEvent.count();
        console.log(`\n📊 Total eventos en BD: ${totalEvents}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

crearEventosPrueba();










