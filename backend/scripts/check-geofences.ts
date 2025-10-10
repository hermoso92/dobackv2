import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGeofences() {
    try {
        console.log('🔍 Verificando geofences en la base de datos...\n');

        // Contar total de geofences
        const totalGeofences = await prisma.geofence.count();
        console.log(`📊 Total de geofences: ${totalGeofences}`);

        // Contar geofences activas
        const activeGeofences = await prisma.geofence.count({
            where: { enabled: true }
        });
        console.log(`✅ Geofences activas: ${activeGeofences}`);

        // Contar geofences por organización
        const geofencesByOrg = await prisma.geofence.groupBy({
            by: ['organizationId'],
            _count: {
                id: true
            }
        });

        console.log('\n📋 Geofences por organización:');
        for (const org of geofencesByOrg) {
            const orgData = await prisma.organization.findUnique({
                where: { id: org.organizationId },
                select: { name: true }
            });
            console.log(`   - ${orgData?.name || org.organizationId}: ${org._count.id} geofences`);
        }

        // Mostrar algunas geofences de ejemplo
        const sampleGeofences = await prisma.geofence.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                enabled: true,
                live: true,
                organizationId: true,
                createdAt: true
            }
        });

        console.log('\n📍 Últimas geofences creadas:');
        for (const gf of sampleGeofences) {
            console.log(`   - ${gf.name} (${gf.type}) - ${gf.enabled ? '✅' : '❌'} ${gf.live ? '🔴 LIVE' : ''}`);
        }

        // Verificar eventos de geofences
        const totalEvents = await prisma.geofenceEvent.count();
        console.log(`\n🎯 Total de eventos de geofences: ${totalEvents}`);

        if (totalGeofences === 0) {
            console.log('\n⚠️  No hay geofences en la base de datos.');
            console.log('💡 Ejecuta el endpoint POST /api/geofences/create-real-data para crear datos de prueba.');
        }

    } catch (error) {
        console.error('❌ Error verificando geofences:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGeofences();

