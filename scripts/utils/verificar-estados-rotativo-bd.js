/**
 * Verificar qué estados hay en la tabla RotativoMeasurement de la BD
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarEstados() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('VERIFICACIÓN DE ESTADOS EN ROTATIVOMEASUREMENT');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // Contar total de mediciones
        const total = await prisma.rotativoMeasurement.count();
        console.log(`📊 Total mediciones en BD: ${total}\n`);

        // Contar por estado
        const estados = await prisma.$queryRaw`
            SELECT 
                state,
                COUNT(*) as count
            FROM "RotativoMeasurement"
            GROUP BY state
            ORDER BY state::int
        `;

        console.log('📋 Distribución por estado:\n');
        
        const nombres = {
            '0': 'Taller / Fuera de servicio',
            '1': 'Operativo en Parque',
            '2': 'Emergencia con rotativo',
            '3': 'En Siniestro',
            '4': 'Fin de Actuación',
            '5': 'Regreso al Parque'
        };

        let total1 = 0;
        estados.forEach(e => {
            const count = parseInt(e.count);
            const percentage = ((count / total) * 100).toFixed(2);
            const nombre = nombres[e.state] || 'Desconocido';
            console.log(`   Estado ${e.state} (${nombre}): ${count} (${percentage}%)`);
        });

        console.log('\n📊 ANÁLISIS:\n');

        const estados2a5 = estados.filter(e => ['2', '3', '4', '5'].includes(e.state));
        if (estados2a5.length === 0) {
            console.log('   ⚠️  NO HAY ESTADOS 2-5 en la base de datos');
            console.log('   → Los vehículos nunca salieron en emergencias');
            console.log('   → O los archivos ROTATIVO no contienen esos datos\n');
        } else {
            const totalOperaciones = estados2a5.reduce((sum, e) => sum + parseInt(e.count), 0);
            const pctOperaciones = ((totalOperaciones / total) * 100).toFixed(2);
            console.log(`   ✅ HAY ${totalOperaciones} mediciones en operaciones (${pctOperaciones}%)\n`);
        }

        // Mostrar sesiones con más estados 2-5
        console.log('🔍 Sesiones con más tiempo en operaciones (Estados 2-5):\n');
        
        const sessionesOperaciones = await prisma.$queryRaw`
            SELECT 
                s.id,
                s."vehicleId",
                s."startTime",
                COUNT(CASE WHEN rm.state IN ('2', '3', '4', '5') THEN 1 END) as operacion_count,
                COUNT(*) as total_count
            FROM "Session" s
            LEFT JOIN "RotativoMeasurement" rm ON s.id = rm."sessionId"
            WHERE rm.id IS NOT NULL
            GROUP BY s.id, s."vehicleId", s."startTime"
            HAVING COUNT(CASE WHEN rm.state IN ('2', '3', '4', '5') THEN 1 END) > 0
            ORDER BY operacion_count DESC
            LIMIT 10
        `;

        if (sessionesOperaciones.length === 0) {
            console.log('   ❌ NO hay ninguna sesión con estados 2-5\n');
        } else {
            sessionesOperaciones.forEach((s, idx) => {
                const pct = ((parseInt(s.operacion_count) / parseInt(s.total_count)) * 100).toFixed(1);
                console.log(`   ${idx + 1}. Sesión ${s.id.substring(0, 8)}...`);
                console.log(`      Operaciones: ${s.operacion_count}/${s.total_count} (${pct}%)`);
                console.log(`      Inicio: ${new Date(s.startTime).toLocaleString()}\n`);
            });
        }

        console.log('═══════════════════════════════════════════════════════════');
        console.log('VERIFICACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarEstados();

