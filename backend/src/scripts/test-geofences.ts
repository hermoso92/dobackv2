/**
 * 🧪 SCRIPT DE TESTING - SISTEMA DE GEOCERCAS
 * 
 * Verifica el estado completo del sistema de geocercas
 */

import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

async function testGeofences() {
    console.log('\n🧪 TESTING COMPLETO - SISTEMA DE GEOCERCAS');
    console.log('='.repeat(60));

    try {
        // 1. Geocercas existentes
        console.log('\n📍 1. GEOCERCAS EXISTENTES:');
        console.log('-'.repeat(60));

        const geofences = await prisma.geofence.findMany({
            orderBy: { createdAt: 'desc' }
        });

        if (geofences.length === 0) {
            console.log('⚠️  No hay geocercas configuradas');
        } else {
            for (const g of geofences) {
                const eventCount = await prisma.geofenceEvent.count({
                    where: { geofenceId: g.id }
                });

                console.log(`\n${geofences.indexOf(g) + 1}. ${g.name}`);
                console.log(`   Tipo: ${g.type} | Activa: ${g.enabled ? '✅' : '❌'} | Eventos: ${eventCount}`);
                console.log(`   ID: ${g.id}`);
                if (g.geometryCenter) {
                    const center = g.geometryCenter as any;
                    console.log(`   Centro: [${center.coordinates[1]}, ${center.coordinates[0]}]`);
                }
                if (g.geometryRadius) {
                    console.log(`   Radio: ${g.geometryRadius}m`);
                }
            }
            console.log(`\n✅ Total: ${geofences.length} geocercas (${geofences.filter(g => g.enabled).length} activas)`);
        }

        // 2. Eventos de geocercas
        console.log('\n\n📊 2. EVENTOS DE GEOCERCAS:');
        console.log('-'.repeat(60));

        const events = await prisma.geofenceEvent.findMany({
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        if (events.length === 0) {
            console.log('⚠️  No hay eventos de geocercas registrados');
        } else {
            for (const e of events) {
                const geofence = await prisma.geofence.findUnique({
                    where: { id: e.geofenceId },
                    select: { name: true }
                });
                const vehicle = await prisma.vehicle.findUnique({
                    where: { id: e.vehicleId },
                    select: { licensePlate: true }
                });

                console.log(`\n${events.indexOf(e) + 1}. ${e.type} - ${geofence?.name || 'N/A'}`);
                console.log(`   Vehículo: ${vehicle?.licensePlate || 'N/A'}`);
                console.log(`   Timestamp: ${e.timestamp.toISOString()}`);
                console.log(`   Coords: [${e.latitude}, ${e.longitude}]`);
                if (e.speed) console.log(`   Velocidad: ${e.speed} km/h`);
            }
            console.log(`\n✅ Mostrando últimos ${events.length} eventos`);
        }

        // 3. Estadísticas por geocerca
        console.log('\n\n📈 3. ESTADÍSTICAS POR GEOCERCA:');
        console.log('-'.repeat(60));

        const stats = await prisma.geofence.findMany();

        for (const g of stats) {
            const allEvents = await prisma.geofenceEvent.findMany({
                where: { geofenceId: g.id },
                select: { type: true, timestamp: true }
            });

            const enters = allEvents.filter(e => e.type === 'ENTER').length;
            const exits = allEvents.filter(e => e.type === 'EXIT').length;
            const lastEvent = allEvents.length > 0
                ? new Date(Math.max(...allEvents.map(e => e.timestamp.getTime())))
                : null;

            console.log(`\n${g.enabled ? '✅' : '❌'} ${g.name}`);
            console.log(`   Total eventos: ${allEvents.length}`);
            console.log(`   Entradas: ${enters} | Salidas: ${exits}`);
            if (lastEvent) {
                console.log(`   Último evento: ${lastEvent.toISOString()}`);
            }
        }

        // 4. Sesiones recientes con GPS
        console.log('\n\n🚗 4. SESIONES RECIENTES CON GPS:');
        console.log('-'.repeat(60));

        const sessions = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: new Date('2025-09-01')
                }
            },
            orderBy: { startTime: 'desc' },
            take: 5
        });

        if (sessions.length === 0) {
            console.log('⚠️  No hay sesiones con GPS desde sept 2025');
        } else {
            for (const s of sessions) {
                const vehicle = await prisma.vehicle.findUnique({
                    where: { id: s.vehicleId },
                    select: { licensePlate: true }
                });
                const gpsCount = await prisma.gpsMeasurement.count({
                    where: { sessionId: s.id }
                });

                console.log(`\n${sessions.indexOf(s) + 1}. ${vehicle?.licensePlate || 'N/A'} - Sesión ${s.sessionNumber}`);
                console.log(`   ID: ${s.id}`);
                console.log(`   Inicio: ${s.startTime.toISOString()}`);
                console.log(`   Puntos GPS: ${gpsCount}`);
            }
        }

        // 5. Resumen general
        console.log('\n\n📊 5. RESUMEN GENERAL:');
        console.log('-'.repeat(60));

        const totalGeofences = await prisma.geofence.count();
        const activeGeofences = await prisma.geofence.count({ where: { enabled: true } });
        const totalEvents = await prisma.geofenceEvent.count();
        const eventsLast24h = await prisma.geofenceEvent.count({
            where: {
                timestamp: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            }
        });
        const allSessions = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: new Date('2025-09-01')
                }
            },
            select: { id: true }
        });

        let sessionsWithGPS = 0;
        for (const s of allSessions) {
            const gpsCount = await prisma.gpsMeasurement.count({
                where: { sessionId: s.id }
            });
            if (gpsCount > 0) sessionsWithGPS++;
        }

        console.log(`\n✅ Geocercas totales: ${totalGeofences}`);
        console.log(`✅ Geocercas activas: ${activeGeofences}`);
        console.log(`✅ Eventos totales: ${totalEvents}`);
        console.log(`✅ Eventos últimas 24h: ${eventsLast24h}`);
        console.log(`✅ Sesiones con GPS (desde sept): ${sessionsWithGPS}`);

        // 6. Verificar geometrías PostGIS
        console.log('\n\n🗺️  6. VERIFICACIÓN GEOMETRÍAS POSTGIS:');
        console.log('-'.repeat(60));

        const geofencesWithPostGIS = await prisma.$queryRaw<Array<{
            name: string;
            type: string;
            has_postgis: boolean;
        }>>`
            SELECT 
                name,
                type,
                CASE WHEN geometry_postgis IS NOT NULL THEN true ELSE false END as has_postgis
            FROM "Geofence"
            WHERE enabled = true
        `;

        geofencesWithPostGIS.forEach(g => {
            console.log(`${g.has_postgis ? '✅' : '❌'} ${g.name} (${g.type})`);
        });

        console.log('\n\n✅ TESTING COMPLETADO');
        console.log('='.repeat(60));

    } catch (error) {
        logger.error('Error en testing:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
testGeofences()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

