/**
 * Script de migración usando Prisma ORM para evitar problemas de tipos SQL
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEY_TYPE_NAMES = {
    0: 'TALLER',
    1: 'PARQUE',
    2: 'EMERGENCIA',
    3: 'INCENDIO',
    5: 'REGRESO'
};

async function convertSegmentsToOperationalKeys(sessionId) {
    console.log(`  🔄 Procesando sesión ${sessionId.substring(0, 8)}...`);

    // Verificar si ya existen OperationalKeys para esta sesión
    const existingCount = await prisma.operationalKey.count({
        where: { sessionId }
    });

    if (existingCount > 0) {
        console.log(`  ⏭️  Ya existen ${existingCount} claves, saltando...`);
        return existingCount;
    }

    // Obtener segmentos de la sesión usando queryRaw (tabla no tiene modelo Prisma)
    const segments = await prisma.$queryRaw`
        SELECT id, clave, "startTime", "endTime", "durationSeconds"
        FROM operational_state_segments
        WHERE "sessionId"::text = ${sessionId}
        ORDER BY "startTime" ASC
    `;

    if (segments.length === 0) {
        return 0;
    }

    // Obtener datos GPS de la sesión
    const gpsData = await prisma.gpsMeasurement.findMany({
        where: { sessionId },
        select: {
            timestamp: true,
            latitude: true,
            longitude: true
        },
        orderBy: { timestamp: 'asc' }
    });

    // Crear OperationalKeys usando Prisma ORM
    let created = 0;
    for (const segment of segments) {
        // Buscar GPS más cercano al inicio y fin
        let startGps = null;
        let endGps = null;
        
        if (gpsData.length > 0) {
            let minDiffStart = Infinity;
            let minDiffEnd = Infinity;
            
            for (const gps of gpsData) {
                const diffStart = Math.abs(gps.timestamp.getTime() - segment.startTime.getTime());
                const diffEnd = Math.abs(gps.timestamp.getTime() - segment.endTime.getTime());
                
                if (diffStart < minDiffStart && diffStart < 10000) {
                    minDiffStart = diffStart;
                    startGps = gps;
                }
                
                if (diffEnd < minDiffEnd && diffEnd < 10000) {
                    minDiffEnd = diffEnd;
                    endGps = gps;
                }
            }
        }

        // Obtener estado del rotativo
        const rotativoMeasurement = await prisma.rotativoMeasurement.findFirst({
            where: {
                sessionId,
                timestamp: {
                    gte: segment.startTime,
                    lte: segment.endTime
                }
            },
            select: { state: true },
            orderBy: { timestamp: 'asc' }
        });

        const rotativoState = rotativoMeasurement ? 
            (rotativoMeasurement.state === '1' || rotativoMeasurement.state === '2') : false;

        const keyTypeName = KEY_TYPE_NAMES[segment.clave] || `CLAVE_${segment.clave}`;
        const duration = segment.durationSeconds || Math.floor((segment.endTime.getTime() - segment.startTime.getTime()) / 1000);

        // Crear usando Prisma ORM
        await prisma.operationalKey.create({
            data: {
                sessionId,
                keyType: segment.clave,
                keyTypeName,
                startTime: segment.startTime,
                endTime: segment.endTime,
                duration,
                startLat: startGps?.latitude || null,
                startLon: startGps?.longitude || null,
                endLat: endGps?.latitude || null,
                endLon: endGps?.longitude || null,
                rotativoState,
                geofenceId: null,
                geofenceName: null,
                details: {
                    segmentId: segment.id,
                    hasGPS: !!startGps
                }
            }
        });

        created++;
    }

    console.log(`  ✅ ${created} claves creadas`);
    return created;
}

async function main() {
    console.log('🔑 Iniciando migración de OperationalKeys (usando Prisma ORM)...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión a base de datos establecida\n');

        // Obtener sesiones pendientes
        const sessionsWithSegments = await prisma.$queryRaw`
            SELECT DISTINCT "sessionId", COUNT(*) as "segmentCount"
            FROM operational_state_segments
            WHERE "sessionId" NOT IN (
                SELECT DISTINCT "sessionId" FROM "OperationalKey"
            )
            GROUP BY "sessionId"
            ORDER BY "sessionId"
        `;

        if (sessionsWithSegments.length === 0) {
            console.log('✅ No hay sesiones pendientes de convertir\n');
            return;
        }

        console.log(`📊 Encontradas ${sessionsWithSegments.length} sesiones con segmentos\n`);

        let totalKeysCreated = 0;
        let sessionsProcessed = 0;
        let sessionsFailed = 0;
        let errors = [];

        for (const session of sessionsWithSegments) {
            try {
                const keysCreated = await convertSegmentsToOperationalKeys(session.sessionId);
                totalKeysCreated += keysCreated;
                sessionsProcessed++;
            } catch (error) {
                sessionsFailed++;
                if (sessionsFailed <= 3) {
                    // Guardar los primeros 3 errores
                    errors.push({
                        sessionId: session.sessionId.substring(0, 8),
                        error: error.message
                    });
                }
            }
        }

        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║           RESUMEN DE MIGRACIÓN DE OPERATIONAL KEYS           ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Sesiones encontradas:     ${String(sessionsWithSegments.length).padStart(4)} sesiones             ║`);
        console.log(`║  Sesiones procesadas:      ${String(sessionsProcessed).padStart(4)} sesiones             ║`);
        console.log(`║  Sesiones fallidas:        ${String(sessionsFailed).padStart(4)} sesiones             ║`);
        console.log(`║  Total claves creadas:     ${String(totalKeysCreated).padStart(4)} claves              ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        if (errors.length > 0) {
            console.log('\n❌ Primeros errores encontrados:');
            errors.forEach((e, i) => {
                console.log(`   ${i + 1}. Sesión ${e.sessionId}: ${e.error}`);
            });
            console.log('');
        }

        console.log('✅ Migración completada\n');

    } catch (error) {
        console.error('\n❌ ERROR FATAL:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => {
        console.log('🎉 Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal');
        process.exit(1);
    });











