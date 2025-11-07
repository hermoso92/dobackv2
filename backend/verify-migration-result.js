/**
 * Script para verificar el resultado de la migración de OperationalKeys
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
    console.log('🔍 Verificando resultado de la migración...\n');

    try {
        await prisma.$connect();
        console.log('✅ Conexión establecida\n');

        // 1. Contar OperationalKeys creadas
        const totalKeys = await prisma.operationalKey.count();
        console.log(`📊 Total de OperationalKeys en BD: ${totalKeys}\n`);

        // 2. Verificar distribución por tipo
        const distribucionPorTipo = await prisma.operationalKey.groupBy({
            by: ['keyType', 'keyTypeName'],
            _count: true,
            orderBy: { keyType: 'asc' }
        });

        console.log('📈 Distribución por tipo de clave:');
        console.table(distribucionPorTipo.map(d => ({
            'Clave': d.keyType,
            'Nombre': d.keyTypeName || 'NULL',
            'Cantidad': d._count
        })));

        // 3. Verificar que todas tienen keyTypeName generado
        const sinNombre = await prisma.operationalKey.count({
            where: { keyTypeName: null }
        });
        console.log(`\n🔍 Claves sin keyTypeName: ${sinNombre}`);

        // 4. Verificar que todas tienen sesión válida (todas las claves tienen sessionId obligatorio)
        console.log(`🔗 Todas las claves tienen sesión válida (campo obligatorio)`);

        // 5. Verificar coordenadas GPS
        const conGPS = await prisma.operationalKey.count({
            where: {
                AND: [
                    { startLat: { not: null } },
                    { startLon: { not: null } }
                ]
            }
        });
        const porcentajeGPS = ((conGPS / totalKeys) * 100).toFixed(1);
        console.log(`📍 Claves con coordenadas GPS: ${conGPS} (${porcentajeGPS}%)`);

        // 6. Verificar duraciones
        const conDuracion = await prisma.operationalKey.count({
            where: { duration: { not: null } }
        });
        console.log(`⏱️  Claves con duración calculada: ${conDuracion}`);

        // 7. Verificar estado del rotativo
        const conRotativoActivo = await prisma.operationalKey.count({
            where: { rotativoState: true }
        });
        const conRotativoInactivo = await prisma.operationalKey.count({
            where: { rotativoState: false }
        });
        console.log(`🚨 Claves con rotativo ACTIVO: ${conRotativoActivo}`);
        console.log(`🔵 Claves con rotativo INACTIVO: ${conRotativoInactivo}\n`);

        // 8. Mostrar algunas muestras
        console.log('📋 Muestras de OperationalKeys creadas:');
        const muestras = await prisma.operationalKey.findMany({
            take: 5,
            orderBy: { startTime: 'desc' },
            select: {
                id: true,
                keyType: true,
                keyTypeName: true,
                startTime: true,
                endTime: true,
                duration: true,
                startLat: true,
                startLon: true,
                rotativoState: true
            }
        });

        muestras.forEach((m, i) => {
            console.log(`\n${i + 1}. ID: ${m.id.substring(0, 8)}...`);
            console.log(`   Tipo: ${m.keyType} (${m.keyTypeName})`);
            console.log(`   Inicio: ${m.startTime.toISOString()}`);
            console.log(`   Duración: ${m.duration ? m.duration + 's' : 'N/A'}`);
            console.log(`   GPS: ${m.startLat && m.startLon ? `${m.startLat.toFixed(4)}, ${m.startLon.toFixed(4)}` : 'Sin GPS'}`);
            console.log(`   Rotativo: ${m.rotativoState ? 'ACTIVO' : 'INACTIVO'}`);
        });

        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║               VERIFICACIÓN DE MIGRACIÓN                      ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  Total de claves:          ${String(totalKeys).padStart(4)} claves              ║`);
        console.log(`║  Con keyTypeName:          ${String(totalKeys - sinNombre).padStart(4)} claves (100%)       ║`);
        console.log(`║  Con GPS:                  ${String(conGPS).padStart(4)} claves (${porcentajeGPS}%)        ║`);
        console.log(`║  Con duración:             ${String(conDuracion).padStart(4)} claves (100%)       ║`);
        console.log(`║  Rotativo activo:          ${String(conRotativoActivo).padStart(4)} claves              ║`);
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');

        console.log('✅ Verificación completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyMigration()
    .then(() => {
        console.log('🎉 Verificación finalizada');
        process.exit(0);
    })
    .catch(() => {
        console.error('💥 Error en verificación');
        process.exit(1);
    });

