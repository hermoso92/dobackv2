/**
 * 🧪 SCRIPT DE VERIFICACIÓN - FASE 1 ChatGPT
 * 
 * Verifica que todos los cambios críticos funcionen correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
    details?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Verificar constraints
 */
async function testConstraints() {
    console.log('\n🧪 TEST 1: Verificando constraints...');
    
    try {
        const constraints = await prisma.$queryRaw<any[]>`
            SELECT 
                conname as constraint_name, 
                conrelid::regclass as table_name
            FROM pg_constraint
            WHERE conname LIKE 'chk_%'
            ORDER BY conrelid::regclass::text, conname
        `;
        
        const expectedConstraints = [
            'chk_si_range',
            'chk_accel_sane',
            'chk_speed_sane',
            'chk_lat_lon',
            'chk_satellites',
            'chk_session_time',
            'chk_segment_time',
            'chk_clave_range'
        ];
        
        const found = constraints.map(c => c.constraint_name);
        const missing = expectedConstraints.filter(c => !found.includes(c));
        
        if (missing.length === 0) {
            results.push({
                name: 'Constraints',
                passed: true,
                message: `✅ Todos los constraints aplicados (${constraints.length})`,
                details: found
            });
        } else {
            results.push({
                name: 'Constraints',
                passed: false,
                message: `❌ Faltan constraints: ${missing.join(', ')}`,
                details: { found, missing }
            });
        }
    } catch (error: any) {
        results.push({
            name: 'Constraints',
            passed: false,
            message: `❌ Error: ${error.message}`
        });
    }
}

/**
 * Test 2: Verificar índices
 */
async function testIndexes() {
    console.log('\n🧪 TEST 2: Verificando índices...');
    
    try {
        const indexes = await prisma.$queryRaw<any[]>`
            SELECT indexname
            FROM pg_indexes
            WHERE indexname LIKE 'idx_%'
            ORDER BY indexname
        `;
        
        const expectedIndexes = [
            'idx_session_org_time',
            'idx_events_session_ts',
            'idx_gps_session_ts',
            'idx_segments_session_clave',
            'idx_geofence_org',
            'idx_vehicle_org',
            'idx_processing_status'
        ];
        
        const found = indexes.map(i => i.indexname);
        const missing = expectedIndexes.filter(i => !found.includes(i));
        
        if (missing.length === 0) {
            results.push({
                name: 'Índices',
                passed: true,
                message: `✅ Todos los índices creados (${indexes.length})`,
                details: found
            });
        } else {
            results.push({
                name: 'Índices',
                passed: false,
                message: `❌ Faltan índices: ${missing.join(', ')}`,
                details: { found, missing }
            });
        }
    } catch (error: any) {
        results.push({
            name: 'Índices',
            passed: false,
            message: `❌ Error: ${error.message}`
        });
    }
}

/**
 * Test 3: Verificar datos válidos (constraints funcionando)
 */
async function testDataValidity() {
    console.log('\n🧪 TEST 3: Verificando validez de datos...');
    
    try {
        // Verificar SI en rango
        const invalidSI = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as count 
            FROM "StabilityMeasurement" 
            WHERE si < 0 OR si > 1
        `;
        
        // Verificar GPS en rango
        const invalidGPS = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as count 
            FROM "GpsMeasurement" 
            WHERE latitude NOT BETWEEN 35 AND 45 
               OR longitude NOT BETWEEN -10 AND 5
        `;
        
        // Verificar sesiones con timestamps inválidos
        const invalidSessions = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as count 
            FROM "Session" 
            WHERE "endTime" IS NOT NULL AND "endTime" <= "startTime"
        `;
        
        const allValid = 
            invalidSI[0].count === '0' &&
            invalidGPS[0].count === '0' &&
            invalidSessions[0].count === '0';
        
        if (allValid) {
            results.push({
                name: 'Validez de Datos',
                passed: true,
                message: '✅ Todos los datos son válidos',
                details: {
                    invalidSI: 0,
                    invalidGPS: 0,
                    invalidSessions: 0
                }
            });
        } else {
            results.push({
                name: 'Validez de Datos',
                passed: false,
                message: '❌ Hay datos inválidos',
                details: {
                    invalidSI: invalidSI[0].count,
                    invalidGPS: invalidGPS[0].count,
                    invalidSessions: invalidSessions[0].count
                }
            });
        }
    } catch (error: any) {
        results.push({
            name: 'Validez de Datos',
            passed: false,
            message: `❌ Error: ${error.message}`
        });
    }
}

/**
 * Test 4: Verificar que no hay sesiones huérfanas
 */
async function testNoOrphanSessions() {
    console.log('\n🧪 TEST 4: Verificando sesiones huérfanas...');
    
    try {
        const orphanSessions = await prisma.$queryRaw<any[]>`
            SELECT s.id, s."sessionNumber", s."startTime"
            FROM "Session" s
            WHERE NOT EXISTS (
                SELECT 1 FROM "GpsMeasurement" WHERE "sessionId" = s.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM "StabilityMeasurement" WHERE "sessionId" = s.id
            )
            AND NOT EXISTS (
                SELECT 1 FROM "RotativoMeasurement" WHERE "sessionId" = s.id
            )
            LIMIT 10
        `;
        
        if (orphanSessions.length === 0) {
            results.push({
                name: 'Sesiones Huérfanas',
                passed: true,
                message: '✅ No hay sesiones sin mediciones (transactions funcionan)'
            });
        } else {
            results.push({
                name: 'Sesiones Huérfanas',
                passed: false,
                message: `❌ Encontradas ${orphanSessions.length} sesiones sin mediciones`,
                details: orphanSessions
            });
        }
    } catch (error: any) {
        results.push({
            name: 'Sesiones Huérfanas',
            passed: false,
            message: `❌ Error: ${error.message}`
        });
    }
}

/**
 * Test 5: Verificar rotativo desde segmentos
 */
async function testRotativoFromSegments() {
    console.log('\n🧪 TEST 5: Verificando cálculo de rotativo...');
    
    try {
        // Obtener tiempo de rotativo de segmentos clave 2
        const segmentosResult = await prisma.$queryRaw<any[]>`
            SELECT COALESCE(SUM("durationSeconds"), 0)::int AS total_seconds
            FROM operational_state_segments
            WHERE clave = 2
        `;
        
        const rotativoFromSegments = segmentosResult[0]?.total_seconds || 0;
        
        if (rotativoFromSegments > 0) {
            results.push({
                name: 'Rotativo desde Segmentos',
                passed: true,
                message: `✅ Rotativo calculado desde segmentos: ${rotativoFromSegments}s`,
                details: { rotativo_on_seconds: rotativoFromSegments }
            });
        } else {
            results.push({
                name: 'Rotativo desde Segmentos',
                passed: false,
                message: '⚠️ No hay segmentos clave 2 (verificar post-procesamiento)',
                details: { rotativo_on_seconds: 0 }
            });
        }
    } catch (error: any) {
        results.push({
            name: 'Rotativo desde Segmentos',
            passed: false,
            message: `❌ Error: ${error.message}`
        });
    }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
    console.log('🚀 INICIANDO VERIFICACIÓN FASE 1 - ChatGPT Critical Fixes\n');
    console.log('================================================');
    
    await testConstraints();
    await testIndexes();
    await testDataValidity();
    await testNoOrphanSessions();
    await testRotativoFromSegments();
    
    console.log('\n================================================');
    console.log('📊 RESULTADOS:\n');
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}: ${result.message}`);
        if (result.details && !result.passed) {
            console.log(`   Detalles:`, result.details);
        }
    });
    
    console.log('\n================================================');
    console.log(`📊 RESUMEN: ${passed}/${results.length} tests pasados`);
    
    if (failed === 0) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON! FASE 1 COMPLETADA ✅');
    } else {
        console.log(`\n⚠️  ${failed} tests fallaron. Revisar detalles arriba.`);
    }
    
    console.log('\n================================================\n');
    
    await prisma.$disconnect();
    
    process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar
runAllTests().catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
});

