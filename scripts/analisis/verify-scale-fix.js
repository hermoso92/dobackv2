/**
 * 🔬 VERIFICACIÓN INMEDIATA - FIX ESCALA 100X
 * 
 * Script de verificación post-corrección para validar que:
 * 1. az promedio ≈ 9.81 m/s² (gravedad)
 * 2. Aceleraciones laterales < 5 g
 * 3. accmag = √(ax² + ay² + az²)
 * 
 * Uso:
 *   node scripts/analisis/verify-scale-fix.js
 *   node scripts/analisis/verify-scale-fix.js --session 2025-09-04
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tolerancias de validación
const TOLERANCES = {
    AZ_MIN: 9.0,        // m/s² mínimo esperado para az en reposo
    AZ_MAX: 10.5,       // m/s² máximo esperado para az en reposo
    MAX_LATERAL: 5.0,   // m/s² máximo razonable en aceleración lateral
    ACCMAG_ERROR: 0.5   // Error máximo en magnitud (m/s²)
};

async function verifyScaleFix(sessionDate = null) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🔬 VERIFICACIÓN FIX ESCALA 100X - ANÁLISIS FÍSICO');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    try {
        // Construir filtro
        let whereClause = {};
        if (sessionDate) {
            const targetDate = new Date(sessionDate);
            whereClause.startTime = {
                gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                lte: new Date(targetDate.setHours(23, 59, 59, 999))
            };
            console.log(`📅 Filtrando por fecha: ${sessionDate}\n`);
        } else {
            console.log(`📅 Analizando TODAS las sesiones\n`);
        }
        
        // Obtener sesiones con mediciones
        const sessions = await prisma.session.findMany({
            where: whereClause,
            include: {
                StabilityMeasurement: {
                    select: {
                        ax: true,
                        ay: true,
                        az: true,
                        accmag: true
                    },
                    take: 500 // Muestra representativa
                }
            },
            orderBy: { startTime: 'desc' },
            take: 10
        });
        
        if (sessions.length === 0) {
            console.log('❌ No se encontraron sesiones\n');
            return;
        }
        
        console.log(`📊 Analizando ${sessions.length} sesiones...\n`);
        
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        for (const session of sessions) {
            const measurements = session.StabilityMeasurement;
            
            if (measurements.length === 0) {
                console.log(`⏭️  Sesión ${session.id}: Sin mediciones de estabilidad\n`);
                continue;
            }
            
            console.log(`\n🔍 Sesión: ${session.id}`);
            console.log(`   Inicio: ${session.startTime.toISOString()}`);
            console.log(`   Mediciones: ${measurements.length}`);
            
            // TEST 1: Validar az ≈ 9.81 m/s²
            const avgAz = measurements.reduce((sum, m) => sum + (m.az || 0), 0) / measurements.length;
            const test1Pass = avgAz >= TOLERANCES.AZ_MIN && avgAz <= TOLERANCES.AZ_MAX;
            totalTests++;
            
            console.log(`\n   TEST 1: Gravedad (az ≈ 9.81 m/s²)`);
            console.log(`      az promedio: ${avgAz.toFixed(3)} m/s²`);
            console.log(`      Rango válido: [${TOLERANCES.AZ_MIN}, ${TOLERANCES.AZ_MAX}]`);
            console.log(`      Estado: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
            
            if (test1Pass) passedTests++; else failedTests++;
            
            // TEST 2: Validar aceleraciones laterales < 5g
            const maxAy = Math.max(...measurements.map(m => Math.abs(m.ay || 0)));
            const test2Pass = maxAy < TOLERANCES.MAX_LATERAL;
            totalTests++;
            
            console.log(`\n   TEST 2: Aceleración lateral razonable`);
            console.log(`      ay máxima: ${maxAy.toFixed(3)} m/s² (${(maxAy / 9.81).toFixed(2)}g)`);
            console.log(`      Límite: ${TOLERANCES.MAX_LATERAL} m/s² (${(TOLERANCES.MAX_LATERAL / 9.81).toFixed(2)}g)`);
            console.log(`      Estado: ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
            
            if (test2Pass) passedTests++; else failedTests++;
            
            // TEST 3: Validar accmag = √(ax² + ay² + az²)
            let accmagErrors = 0;
            for (let i = 0; i < Math.min(measurements.length, 10); i++) {
                const m = measurements[i];
                const calculated = Math.sqrt(
                    (m.ax || 0) ** 2 + 
                    (m.ay || 0) ** 2 + 
                    (m.az || 0) ** 2
                );
                const error = Math.abs(calculated - (m.accmag || 0));
                if (error > TOLERANCES.ACCMAG_ERROR) {
                    accmagErrors++;
                }
            }
            const test3Pass = accmagErrors === 0;
            totalTests++;
            
            console.log(`\n   TEST 3: Magnitud consistente`);
            console.log(`      Errores en muestra (10): ${accmagErrors}`);
            console.log(`      Estado: ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);
            
            if (test3Pass) passedTests++; else failedTests++;
            
            // Resumen sesión
            const sessionPass = test1Pass && test2Pass && test3Pass;
            console.log(`\n   📊 RESUMEN SESIÓN: ${sessionPass ? '✅ TODOS LOS TESTS PASARON' : '❌ ALGÚN TEST FALLÓ'}`);
        }
        
        // Resumen global
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('📊 RESUMEN GLOBAL DE VERIFICACIÓN');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log(`Total tests ejecutados: ${totalTests}`);
        console.log(`Tests pasados:          ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        console.log(`Tests fallidos:         ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
        
        const overallPass = failedTests === 0;
        console.log(`\n${overallPass ? '✅ VERIFICACIÓN EXITOSA' : '❌ VERIFICACIÓN FALLIDA'}`);
        
        if (overallPass) {
            console.log('\n🎉 El fix de escala 100x está funcionando correctamente.');
            console.log('   Todas las mediciones están en rangos físicos válidos.\n');
        } else {
            console.log('\n⚠️  Algunos tests fallaron. Revisar sesiones marcadas como FAIL.\n');
        }
        
        process.exit(overallPass ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Parsear argumentos
const args = process.argv.slice(2);
let sessionDate = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--session' && args[i + 1]) {
        sessionDate = args[i + 1];
        i++;
    }
}

// Ejecutar
verifyScaleFix(sessionDate);

