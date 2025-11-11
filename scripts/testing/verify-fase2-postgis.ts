/**
 * 🔍 SCRIPT DE VERIFICACIÓN FASE 2: Geography + Clustering PostGIS
 * 
 * Valida que la migración a geography PostGIS se aplicó correctamente
 * y que el clustering nativo funciona como se espera.
 * 
 * Ejecutar desde raíz del proyecto:
 * npx ts-node scripts/testing/verify-fase2-postgis.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VerificationResult {
    test: string;
    passed: boolean;
    details?: any;
    error?: string;
}

const results: VerificationResult[] = [];

/**
 * Test 1: Verificar que columna geog existe en GpsMeasurement
 */
async function test1_ColumnGeogExists() {
    console.log('\n🔍 Test 1: Verificar columna geog en GpsMeasurement...');

    try {
        const result = await prisma.$queryRaw<any[]>`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'GpsMeasurement'
              AND column_name = 'geog'
        `;

        const passed = result.length > 0 && result[0].udt_name === 'geography';

        results.push({
            test: 'Columna geog existe en GpsMeasurement',
            passed,
            details: result[0] || 'Columna no encontrada'
        });

        console.log(passed ? '✅ PASS' : '❌ FAIL', result[0] || 'No encontrado');
    } catch (error: any) {
        results.push({
            test: 'Columna geog existe en GpsMeasurement',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 2: Verificar que columna geog existe en stability_events
 */
async function test2_ColumnGeogStabilityEvents() {
    console.log('\n🔍 Test 2: Verificar columna geog en stability_events...');

    try {
        const result = await prisma.$queryRaw<any[]>`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'stability_events'
              AND column_name = 'geog'
        `;

        const passed = result.length > 0 && result[0].udt_name === 'geography';

        results.push({
            test: 'Columna geog existe en stability_events',
            passed,
            details: result[0] || 'Columna no encontrada'
        });

        console.log(passed ? '✅ PASS' : '❌ FAIL', result[0] || 'No encontrado');
    } catch (error: any) {
        results.push({
            test: 'Columna geog existe en stability_events',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 3: Verificar índices GIST espaciales
 */
async function test3_GistIndexes() {
    console.log('\n🔍 Test 3: Verificar índices GIST espaciales...');

    try {
        const result = await prisma.$queryRaw<any[]>`
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE indexname LIKE '%geog%'
            ORDER BY tablename, indexname
        `;

        const expectedIndexes = ['idx_gps_geog', 'idx_stability_events_geog'];
        const foundIndexes = result.map(r => r.indexname);
        const passed = expectedIndexes.every(idx => foundIndexes.includes(idx));

        results.push({
            test: 'Índices GIST espaciales creados',
            passed,
            details: {
                expected: expectedIndexes,
                found: foundIndexes,
                total: result.length
            }
        });

        console.log(passed ? '✅ PASS' : '❌ FAIL');
        console.log('Índices encontrados:', foundIndexes);
    } catch (error: any) {
        results.push({
            test: 'Índices GIST espaciales creados',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 4: Cobertura GPS en eventos de estabilidad
 */
async function test4_GpsCoverage() {
    console.log('\n🔍 Test 4: Cobertura GPS en stability_events...');

    try {
        const [stats] = await prisma.$queryRaw<any[]>`
            SELECT 
                COUNT(*) as total_eventos,
                COUNT(geog) as eventos_con_geog,
                ROUND(COUNT(geog)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as porcentaje_cobertura
            FROM stability_events
        `;

        const passed = parseFloat(stats.porcentaje_cobertura) >= 95;

        results.push({
            test: 'Cobertura GPS >95% en eventos',
            passed,
            details: stats
        });

        console.log(passed ? '✅ PASS' : '⚠️ WARN');
        console.log(`Cobertura: ${stats.porcentaje_cobertura}% (${stats.eventos_con_geog}/${stats.total_eventos})`);
    } catch (error: any) {
        results.push({
            test: 'Cobertura GPS >95% en eventos',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 5: Test funcional de clustering PostGIS (ST_ClusterDBSCAN)
 */
async function test5_ClusteringFunctional() {
    console.log('\n🔍 Test 5: Clustering PostGIS funcional...');

    try {
        const result = await prisma.$queryRawUnsafe(`
            WITH clustered AS (
                SELECT 
                    id,
                    geog,
                    ST_ClusterDBSCAN(geog::geometry, eps := 30, minpoints := 1) OVER () as cluster_id
                FROM stability_events
                WHERE geog IS NOT NULL
                LIMIT 100
            )
            SELECT 
                cluster_id,
                COUNT(*) as event_count
            FROM clustered
            WHERE cluster_id IS NOT NULL
            GROUP BY cluster_id
            ORDER BY event_count DESC
            LIMIT 5
        `) as any[];

        const passed = result.length > 0;

        results.push({
            test: 'Clustering PostGIS funcional',
            passed,
            details: {
                clusters_generados: result.length,
                top_cluster_eventos: result[0]?.event_count || 0
            }
        });

        console.log(passed ? '✅ PASS' : '❌ FAIL');
        console.log(`Clusters generados: ${result.length}`);
        if (result[0]) {
            console.log(`Mayor cluster: ${result[0].event_count} eventos`);
        }
    } catch (error: any) {
        results.push({
            test: 'Clustering PostGIS funcional',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 6: Performance clustering (debe ser <500ms con 1000 eventos)
 */
async function test6_ClusteringPerformance() {
    console.log('\n🔍 Test 6: Performance clustering PostGIS...');

    try {
        const start = Date.now();

        await prisma.$queryRawUnsafe(`
            WITH clustered AS (
                SELECT 
                    id,
                    geog,
                    ST_ClusterDBSCAN(geog::geometry, eps := 30, minpoints := 1) OVER () as cluster_id
                FROM stability_events
                WHERE geog IS NOT NULL
                LIMIT 1000
            )
            SELECT 
                cluster_id,
                COUNT(*) as event_count,
                ST_AsText(ST_Centroid(ST_Collect(geog::geometry))) as centroid
            FROM clustered
            WHERE cluster_id IS NOT NULL
            GROUP BY cluster_id
        `);

        const duration = Date.now() - start;
        const passed = duration < 500;

        results.push({
            test: 'Performance clustering <500ms (1000 eventos)',
            passed,
            details: {
                duration_ms: duration,
                threshold_ms: 500
            }
        });

        console.log(passed ? '✅ PASS' : '⚠️ SLOW');
        console.log(`Tiempo: ${duration}ms`);
    } catch (error: any) {
        results.push({
            test: 'Performance clustering <500ms',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 7: Validar distancias ST_Distance vs Haversine
 */
async function test7_DistanceAccuracy() {
    console.log('\n🔍 Test 7: Precisión ST_Distance vs Haversine...');

    try {
        // Comparar distancia entre Madrid y Alcorcón
        const [result] = await prisma.$queryRaw<any[]>`
            SELECT 
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)::geography,  -- Madrid
                    ST_SetSRID(ST_MakePoint(-3.8879, 40.3877), 4326)::geography   -- Alcorcón
                ) as distancia_metros
        `;

        // Distancia real aproximada: ~14.5 km
        const distancia = parseFloat(result.distancia_metros);
        const esperado = 14500; // metros
        const margen = 1000; // ±1 km
        const passed = Math.abs(distancia - esperado) < margen;

        results.push({
            test: 'Precisión ST_Distance geográfica',
            passed,
            details: {
                distancia_metros: distancia,
                esperado_metros: esperado,
                diferencia_metros: Math.abs(distancia - esperado)
            }
        });

        console.log(passed ? '✅ PASS' : '❌ FAIL');
        console.log(`Distancia calculada: ${(distancia / 1000).toFixed(2)} km`);
    } catch (error: any) {
        results.push({
            test: 'Precisión ST_Distance geográfica',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Test 8: Verificar interpolación GPS en eventos
 */
async function test8_GpsInterpolation() {
    console.log('\n🔍 Test 8: Verificar interpolación GPS en eventos...');

    try {
        const [stats] = await prisma.$queryRaw<any[]>`
            SELECT 
                COUNT(*) FILTER (WHERE "interpolatedGPS" = true) as eventos_interpolados,
                COUNT(*) as total_eventos,
                ROUND(
                    COUNT(*) FILTER (WHERE "interpolatedGPS" = true)::numeric / 
                    NULLIF(COUNT(*), 0) * 100, 
                    2
                ) as porcentaje_interpolados
            FROM stability_events
        `;

        const passed = true; // Este test es informativo, siempre pasa

        results.push({
            test: 'Interpolación GPS documentada',
            passed,
            details: stats
        });

        console.log('ℹ️ INFO');
        console.log(`Eventos interpolados: ${stats.porcentaje_interpolados}% (${stats.eventos_interpolados}/${stats.total_eventos})`);
    } catch (error: any) {
        results.push({
            test: 'Interpolación GPS documentada',
            passed: false,
            error: error.message
        });
        console.log('❌ ERROR:', error.message);
    }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   VERIFICACIÓN FASE 2: Geography + Clustering PostGIS   ');
    console.log('═══════════════════════════════════════════════════════════');

    await test1_ColumnGeogExists();
    await test2_ColumnGeogStabilityEvents();
    await test3_GistIndexes();
    await test4_GpsCoverage();
    await test5_ClusteringFunctional();
    await test6_ClusteringPerformance();
    await test7_DistanceAccuracy();
    await test8_GpsInterpolation();

    // Resumen final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                      RESUMEN                            ');
    console.log('═══════════════════════════════════════════════════════════');

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    results.forEach((result, idx) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} Test ${idx + 1}: ${result.test}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });

    console.log('\n───────────────────────────────────────────────────────────');
    console.log(`Total: ${totalTests} tests`);
    console.log(`Pasados: ${passedTests} ✅`);
    console.log(`Fallidos: ${failedTests} ❌`);
    console.log(`Tasa de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Estado final
    if (failedTests === 0) {
        console.log('🎉 FASE 2 VERIFICADA EXITOSAMENTE 🎉');
        console.log('\nSistema listo para:');
        console.log('  - Clustering PostGIS nativo');
        console.log('  - Distancias geográficas precisas');
        console.log('  - Queries espaciales optimizadas');
    } else {
        console.log('⚠️ FASE 2 INCOMPLETA ⚠️');
        console.log('\nRevisa los tests fallidos arriba.');
        console.log('Ejecuta la migración: database/migrations/003-chatgpt-geography-migration.sql');
    }

    await prisma.$disconnect();
    process.exit(failedTests > 0 ? 1 : 0);
}

// Ejecutar
runAllTests().catch((error) => {
    console.error('💥 Error fatal:', error);
    prisma.$disconnect();
    process.exit(1);
});









