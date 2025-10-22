/**
 * VERIFICACIÓN DE ESTRUCTURA DE BASE DE DATOS
 * Comprueba integridad, índices y consistencia de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDatabase() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🗄️  VERIFICACIÓN DE BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    try {
        // 1. Contar sesiones
        console.log('📊 TABLA: Session\n');
        const sessionCount = await prisma.session.count();
        console.log(`  Total sesiones: ${sessionCount}`);

        const sessionSample = await prisma.session.findMany({
            take: 3,
            select: {
                id: true,
                vehicleId: true,
                startTime: true,
                endTime: true,
                sessionNumber: true,
                organizationId: true,
                _count: {
                    select: {
                        GpsMeasurement: true,
                        StabilityMeasurement: true,
                        RotativoMeasurement: true
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        console.log('\n  MUESTRA (3 sesiones más recientes):\n');
        sessionSample.forEach((s, idx) => {
            console.log(`  ${idx + 1}. Sesión ${s.sessionNumber}`);
            console.log(`     ID: ${s.id.substring(0, 13)}...`);
            console.log(`     Vehículo: ${s.vehicleId.substring(0, 13)}...`);
            console.log(`     Inicio: ${s.startTime.toISOString()}`);
            console.log(`     Fin: ${s.endTime?.toISOString() || 'NULL'}`);
            console.log(`     Datos: GPS=${s._count.GpsMeasurement}, Estabilidad=${s._count.StabilityMeasurement}, Rotativo=${s._count.RotativoMeasurement}`);
            console.log('');
        });

        // 2. Verificar mediciones GPS
        console.log('🛰️  TABLA: GpsMeasurement\n');
        const gpsCount = await prisma.gpsMeasurement.count();
        const gpsWithCoords = await prisma.gpsMeasurement.count({
            where: {
                AND: [
                    { latitude: { not: 0 } },
                    { longitude: { not: 0 } },
                    { latitude: { gte: -90, lte: 90 } },
                    { longitude: { gte: -180, lte: 180 } }
                ]
            }
        });

        console.log(`  Total registros GPS: ${gpsCount.toLocaleString()}`);
        console.log(`  Con coordenadas válidas: ${gpsWithCoords.toLocaleString()} (${((gpsWithCoords/gpsCount)*100).toFixed(1)}%)`);

        // Muestra de GPS
        const gpsSample = await prisma.gpsMeasurement.findMany({
            take: 3,
            where: {
                latitude: { not: 0 },
                longitude: { not: 0 }
            },
            orderBy: { timestamp: 'desc' }
        });

        console.log('\n  MUESTRA (3 puntos GPS recientes):\n');
        gpsSample.forEach((g, idx) => {
            console.log(`  ${idx + 1}. ${g.timestamp.toISOString()}`);
            console.log(`     Coordenadas: [${g.latitude}, ${g.longitude}]`);
            console.log(`     Velocidad: ${g.speed} km/h`);
            console.log(`     Satélites: ${g.satellites}`);
            console.log('');
        });

        // 3. Verificar eventos de estabilidad
        console.log('⚠️  TABLA: stability_events\n');
        const eventsCount = await prisma.$queryRaw`
            SELECT COUNT(*)::int as total FROM stability_events
        `;
        const eventsBySeverity = await prisma.$queryRaw`
            SELECT severity, COUNT(*)::int as count
            FROM stability_events
            GROUP BY severity
            ORDER BY 
                CASE severity
                    WHEN 'GRAVE' THEN 1
                    WHEN 'MODERADA' THEN 2
                    WHEN 'LEVE' THEN 3
                    ELSE 4
                END
        `;

        console.log(`  Total eventos: ${eventsCount[0].total.toLocaleString()}`);
        console.log('\n  Por severidad:');
        eventsBySeverity.forEach(e => {
            console.log(`    ${e.severity}: ${e.count.toLocaleString()}`);
        });

        // 4. Verificar segmentos operacionales
        console.log('\n🔑 TABLA: operational_state_segments\n');
        const segments = await prisma.$queryRaw`
            SELECT clave, 
                   COUNT(*)::int as count,
                   SUM("durationSeconds")::int as total_seconds,
                   AVG("durationSeconds")::int as avg_seconds
            FROM operational_state_segments
            GROUP BY clave
            ORDER BY clave
        `;

        console.log('  SEGMENTOS POR CLAVE:\n');
        segments.forEach(s => {
            const hours = (s.total_seconds / 3600).toFixed(2);
            const avgMin = (s.avg_seconds / 60).toFixed(1);
            const claveNames = ['Taller', 'En Parque', 'Emergencia', 'Siniestro', 'Retorno', 'Regreso'];
            console.log(`    Clave ${s.clave} (${claveNames[s.clave]}): ${s.count.toLocaleString()} segmentos, ${hours}h total, ~${avgMin}min promedio`);
        });

        // 5. Verificar integridad referencial
        console.log('\n🔗 VERIFICACIÓN DE INTEGRIDAD REFERENCIAL:\n');

        const orphanGPS = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM "GpsMeasurement" gps
            WHERE NOT EXISTS (
                SELECT 1 FROM "Session" s WHERE s.id::text = gps."sessionId"::text
            )
        `;

        const orphanStability = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM "StabilityMeasurement" sm
            WHERE NOT EXISTS (
                SELECT 1 FROM "Session" s WHERE s.id::text = sm."sessionId"::text
            )
        `;

        const orphanRotativo = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM "RotativoMeasurement" rm
            WHERE NOT EXISTS (
                SELECT 1 FROM "Session" s WHERE s.id::text = rm."sessionId"::text
            )
        `;

        const orphanSegments = await prisma.$queryRaw`
            SELECT COUNT(*)::int as count
            FROM operational_state_segments oss
            WHERE NOT EXISTS (
                SELECT 1 FROM "Session" s WHERE s.id::text = oss."sessionId"::text
            )
        `;

        console.log(`  GPS huérfanos: ${orphanGPS[0].count} ${orphanGPS[0].count > 0 ? '❌' : '✅'}`);
        console.log(`  Estabilidad huérfanos: ${orphanStability[0].count} ${orphanStability[0].count > 0 ? '❌' : '✅'}`);
        console.log(`  Rotativo huérfanos: ${orphanRotativo[0].count} ${orphanRotativo[0].count > 0 ? '❌' : '✅'}`);
        console.log(`  Segmentos huérfanos: ${orphanSegments[0].count} ${orphanSegments[0].count > 0 ? '❌' : '✅'}`);

        // 6. Verificar geocercas
        console.log('\n🗺️  TABLA: park y zone\n');
        
        const parks = await prisma.park.count();
        const zones = await prisma.zone.count();

        console.log(`  Parques: ${parks}`);
        console.log(`  Zonas: ${zones}`);

        if (parks > 0) {
            const parkSample = await prisma.park.findFirst();
            console.log('\n  MUESTRA DE PARQUE:');
            console.log(`    Nombre: ${parkSample.name}`);
            console.log(`    Geometry: ${JSON.stringify(parkSample.geometry).substring(0, 100)}...`);
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('✅ VERIFICACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDatabase();

