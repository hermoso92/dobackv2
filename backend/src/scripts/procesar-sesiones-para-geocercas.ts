/**
 * 🔄 PROCESAR SESIONES EXISTENTES PARA GEOCERCAS
 * 
 * Toma sesiones que ya tienen GPS y las procesa retroactivamente
 * para detectar eventos de geocercas
 */

import { prisma } from '../config/prisma';
import { geofenceDetectorService } from '../services/geoprocessing/GeofenceDetectorService';
import { logger } from '../utils/logger';

async function procesarSesionesParaGeocercas() {
    console.log('\n🔄 PROCESAMIENTO RETROACTIVO - EVENTOS DE GEOCERCAS');
    console.log('='.repeat(80));

    try {
        // 1. Verificar geocercas activas
        const geofences = await prisma.geofence.findMany({
            where: { enabled: true }
        });

        console.log(`\n📍 Geocercas activas: ${geofences.length}`);
        for (const g of geofences) {
            const center = g.geometryCenter as any;
            console.log(`   - ${g.name} [${center.coordinates[1]}, ${center.coordinates[0]}]`);
        }

        if (geofences.length === 0) {
            console.log('\n❌ No hay geocercas activas para procesar');
            return;
        }

        // 2. Buscar sesiones con GPS (últimas 20)
        console.log(`\n\n🔍 Buscando sesiones con GPS...`);
        
        const sessions = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: new Date('2025-10-01')
                }
            },
            orderBy: { startTime: 'desc' },
            take: 20
        });

        console.log(`   Sesiones encontradas: ${sessions.length}`);

        let processed = 0;
        let totalEvents = 0;

        for (const session of sessions) {
            // Verificar si ya tiene eventos de geocercas
            const existingEvents = await prisma.geofenceEvent.count({
                where: { 
                    vehicleId: session.vehicleId,
                    timestamp: {
                        gte: session.startTime,
                        lte: session.endTime
                    }
                }
            });

            if (existingEvents > 0) {
                console.log(`   ⏭️  Sesión ${session.sessionNumber} ya tiene ${existingEvents} eventos, saltando...`);
                continue;
            }

            // Obtener puntos GPS
            const gpsPoints = await prisma.gpsMeasurement.findMany({
                where: { sessionId: session.id },
                select: {
                    latitude: true,
                    longitude: true,
                    timestamp: true
                },
                orderBy: { timestamp: 'asc' }
            });

            if (gpsPoints.length === 0) {
                continue;
            }

            console.log(`\n📍 Procesando sesión ${session.sessionNumber} (${gpsPoints.length} puntos GPS)...`);

            // Detectar eventos de geocercas
            const events = await geofenceDetectorService.detectGeofenceEvents(
                session.id,
                gpsPoints.map(p => ({
                    lat: p.latitude,
                    lon: p.longitude,
                    timestamp: p.timestamp
                }))
            );

            if (events.length > 0) {
                console.log(`   ✅ ${events.length} eventos detectados`);

                // Guardar eventos en BD
                for (const event of events) {
                    await prisma.$executeRaw`
                        INSERT INTO "GeofenceEvent" (
                            id, "geofenceId", "vehicleId", "organizationId",
                            type, timestamp, latitude, longitude, status, "updatedAt"
                        ) VALUES (
                            (gen_random_uuid())::text,
                            ${event.geofenceId},
                            ${session.vehicleId},
                            ${session.organizationId},
                            ${event.type}::text::"GeofenceEventType",
                            ${event.timestamp},
                            ${event.lat},
                            ${event.lon},
                            'ACTIVE'::"GeofenceEventStatus",
                            NOW()
                        )
                    `;
                }

                events.forEach(e => {
                    console.log(`      - ${e.type} → ${e.geofenceName} @ ${e.timestamp.toISOString()}`);
                });

                totalEvents += events.length;
            } else {
                console.log(`   ℹ️  No cruza ninguna geocerca`);
            }

            processed++;

            // Límite de 5 sesiones para no saturar
            if (processed >= 5) {
                console.log(`\n⚠️  Límite de 5 sesiones alcanzado (para no saturar)`);
                break;
            }
        }

        // Resumen
        console.log('\n\n📊 RESUMEN:');
        console.log('='.repeat(80));
        console.log(`✅ Sesiones procesadas: ${processed}`);
        console.log(`✅ Eventos generados: ${totalEvents}`);

        // Verificar eventos en BD
        const totalEventsInDB = await prisma.geofenceEvent.count();
        console.log(`\n📦 Total eventos en BD ahora: ${totalEventsInDB}`);

        if (totalEventsInDB > 0) {
            console.log(`\n🎉 ÉXITO - El sistema de geocercas está funcionando!`);
            console.log(`   Ve a "Geofences" → "Eventos de Geocercas" para ver los eventos`);
        }

    } catch (error) {
        logger.error('Error procesando sesiones:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar
procesarSesionesParaGeocercas()
    .then(() => {
        console.log('\n✅ PROCESAMIENTO COMPLETADO\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });


