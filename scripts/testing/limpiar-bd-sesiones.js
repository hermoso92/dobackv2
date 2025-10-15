/**
 * 🧹 LIMPIAR BASE DE DATOS - SESIONES Y MEDICIONES
 * 
 * Elimina todas las sesiones y mediciones para empezar limpio
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarBD() {
    console.log('🧹 LIMPIANDO BASE DE DATOS\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Contar antes de eliminar
        const countBefore = {
            sessions: await prisma.session.count({}),
            stability: await prisma.stabilityMeasurement.count({}),
            gps: await prisma.gpsMeasurement.count({}),
            rotativo: await prisma.rotativoMeasurement.count({})
        };

        console.log('📊 ANTES DE LIMPIAR:\n');
        console.log(`   • Sesiones: ${countBefore.sessions}`);
        console.log(`   • Mediciones ESTABILIDAD: ${countBefore.stability}`);
        console.log(`   • Mediciones GPS: ${countBefore.gps}`);
        console.log(`   • Mediciones ROTATIVO: ${countBefore.rotativo}\n`);

        if (countBefore.sessions === 0) {
            console.log('✅ La base de datos ya está limpia\n');
            return;
        }

        console.log('🗑️  ELIMINANDO DATOS...\n');

        // Orden correcto para respetar foreign keys
        console.log('   1️⃣  Eliminando mediciones ESTABILIDAD...');
        const deletedStability = await prisma.stabilityMeasurement.deleteMany({});
        console.log(`   ✅ ${deletedStability.count} eliminadas\n`);

        console.log('   2️⃣  Eliminando mediciones GPS...');
        const deletedGPS = await prisma.gpsMeasurement.deleteMany({});
        console.log(`   ✅ ${deletedGPS.count} eliminadas\n`);

        console.log('   3️⃣  Eliminando mediciones ROTATIVO...');
        const deletedRotativo = await prisma.rotativoMeasurement.deleteMany({});
        console.log(`   ✅ ${deletedRotativo.count} eliminadas\n`);

        console.log('   4️⃣  Eliminando sesiones...');
        const deletedSessions = await prisma.session.deleteMany({});
        console.log(`   ✅ ${deletedSessions.count} eliminadas\n`);

        // Verificar que todo se eliminó
        const countAfter = {
            sessions: await prisma.session.count({}),
            stability: await prisma.stabilityMeasurement.count({}),
            gps: await prisma.gpsMeasurement.count({}),
            rotativo: await prisma.rotativoMeasurement.count({})
        };

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ LIMPIEZA COMPLETADA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📊 DESPUÉS DE LIMPIAR:\n');
        console.log(`   • Sesiones: ${countAfter.sessions}`);
        console.log(`   • Mediciones ESTABILIDAD: ${countAfter.stability}`);
        console.log(`   • Mediciones GPS: ${countAfter.gps}`);
        console.log(`   • Mediciones ROTATIVO: ${countAfter.rotativo}\n`);

        if (countAfter.sessions === 0 && countAfter.stability === 0 && 
            countAfter.gps === 0 && countAfter.rotativo === 0) {
            console.log('🎉 Base de datos limpia exitosamente\n');
        } else {
            console.log('⚠️  Algunos datos no se eliminaron correctamente\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR LIMPIANDO BD:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

limpiarBD();

