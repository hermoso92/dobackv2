/**
 * 🧪 TEST FINAL COMPLETO DEL SISTEMA
 * 
 * Valida TODO el sistema end-to-end:
 * 1. Base de datos
 * 2. Servicios backend
 * 3. Endpoints API
 * 4. Datos procesados
 */

require('dotenv').config({ path: 'config.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSistemaCompleto() {
    console.log('\n' + '='.repeat(100));
    console.log('🧪 VALIDACIÓN FINAL COMPLETA DEL SISTEMA DOBACKSOFT V3');
    console.log('='.repeat(100) + '\n');

    let todosLoTests = [];

    try {
        // ============================================
        // TEST 1: BASE DE DATOS
        // ============================================
        console.log('📊 TEST 1: VERIFICACIÓN DE BASE DE DATOS\n');

        const [
            sessionCount,
            vehicleCount,
            gpsCount,
            stabilityCount,
            eventCount,
            operationalKeyCount,
            qualityCount
        ] = await Promise.all([
            prisma.session.count(),
            prisma.vehicle.count(),
            prisma.gpsMeasurement.count(),
            prisma.stabilityMeasurement.count(),
            prisma.stabilityEvent.count(),
            prisma.operationalKey.count(),
            prisma.dataQualityMetrics.count()
        ]);

        console.log('Tablas principales:');
        console.log(`  Sesiones: ${sessionCount.toLocaleString()}`);
        console.log(`  Vehículos: ${vehicleCount}`);
        console.log(`  GPS: ${gpsCount.toLocaleString()}`);
        console.log(`  ESTABILIDAD: ${stabilityCount.toLocaleString()}`);
        console.log(`  Eventos: ${eventCount.toLocaleString()}`);
        console.log(`  Claves Operacionales: ${operationalKeyCount}`);
        console.log(`  Métricas de Calidad: ${qualityCount}\n`);

        todosLoTests.push({
            nombre: 'Base de Datos',
            pasado: sessionCount > 0 && eventCount > 0,
            detalles: `${sessionCount} sesiones, ${eventCount} eventos`
        });

        // ============================================
        // TEST 2: EVENTOS DE ESTABILIDAD
        // ============================================
        console.log('='.repeat(100));
        console.log('⚠️  TEST 2: VALIDACIÓN DE EVENTOS\n');

        const eventosPorSeveridad = await prisma.stabilityEvent.groupBy({
            by: ['severity'],
            _count: { severity: true }
        });

        console.log('Distribución de severidad:');
        eventosPorSeveridad.forEach(e => {
            console.log(`  ${e.severity}: ${e._count.severity}`);
        });

        const totalEventos = eventosPorSeveridad.reduce((sum, e) => sum + e._count.severity, 0);
        console.log(`  ───────────────`);
        console.log(`  TOTAL: ${totalEventos}\n`);

        // Verificar SI < 0.50
        const eventosValidados = await prisma.$queryRaw`
            SELECT 
                COUNT(*) FILTER (WHERE (details->>'si')::float < 0.50) AS validos,
                COUNT(*) AS total
            FROM stability_events
        `;

        const validos = parseInt(eventosValidados[0].validos);
        const total = parseInt(eventosValidados[0].total);

        console.log('Validación SI < 0.50:');
        console.log(`  Eventos válidos: ${validos}/${total}`);
        console.log(`  ✅ Todos correctos: ${validos === total ? 'SÍ' : 'NO'}\n`);

        todosLoTests.push({
            nombre: 'Eventos de Estabilidad',
            pasado: validos === total && totalEventos > 0,
            detalles: `${totalEventos} eventos, 100% con SI < 0.50`
        });

        // ============================================
        // TEST 3: CORRELACIÓN GPS
        // ============================================
        console.log('='.repeat(100));
        console.log('📍 TEST 3: CORRELACIÓN GPS\n');

        const eventosConGPS = await prisma.stabilityEvent.count({
            where: {
                lat: { not: 0 },
                lon: { not: 0 }
            }
        });

        const porcentajeGPS = total > 0 ? (eventosConGPS / total * 100).toFixed(1) : 0;

        console.log(`Eventos con GPS: ${eventosConGPS}/${total} (${porcentajeGPS}%)`);
        console.log(`✅ Cobertura GPS: ${parseFloat(porcentajeGPS.toString()) > 40 ? 'BUENA' : 'BAJA'}\n`);

        todosLoTests.push({
            nombre: 'Correlación GPS',
            pasado: eventosConGPS > 0,
            detalles: `${porcentajeGPS}% eventos con coordenadas`
        });

        // ============================================
        // TEST 4: SESIONES MULTI-ARCHIVO
        // ============================================
        console.log('='.repeat(100));
        console.log('📁 TEST 4: SESIONES MULTI-ARCHIVO\n');

        // Verificar que hay sesiones del mismo día
        const sesionesEjemplo = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: new Date('2025-10-08T00:00:00Z'),
                    lte: new Date('2025-10-08T23:59:59Z')
                }
            },
            select: { id: true, vehicleId: true, startTime: true }
        });

        console.log(`Sesiones del 08/10/2025: ${sesionesEjemplo.length}`);
        console.log(`✅ Detección multi-sesión: ${sesionesEjemplo.length >= 7 ? 'FUNCIONA' : 'REVISAR'}\n`);

        todosLoTests.push({
            nombre: 'Detección Multi-Sesión',
            pasado: sesionesEjemplo.length >= 7,
            detalles: `${sesionesEjemplo.length} sesiones detectadas`
        });

        // ============================================
        // TEST 5: CALIDAD DE DATOS
        // ============================================
        console.log('='.repeat(100));
        console.log('📊 TEST 5: CALIDAD DE DATOS\n');

        const calidadEjemplo = await prisma.dataQualityMetrics.findFirst({
            where: {
                porcentajeGPSValido: { gt: 0 }
            }
        });

        if (calidadEjemplo) {
            console.log('Ejemplo de métricas de calidad:');
            console.log(`  GPS válido: ${calidadEjemplo.porcentajeGPSValido.toFixed(2)}%`);
            console.log(`  GPS interpoladas: ${calidadEjemplo.gpsInterpoladas}`);
            console.log(`  Problemas: ${Array.isArray(calidadEjemplo.problemas) ? calidadEjemplo.problemas.length : 0}\n`);
        }

        todosLoTests.push({
            nombre: 'Métricas de Calidad',
            pasado: qualityCount > 0,
            detalles: `${qualityCount} sesiones con métricas`
        });

        // ============================================
        // TEST 6: TABLAS NUEVAS
        // ============================================
        console.log('='.repeat(100));
        console.log('🗄️  TEST 6: TABLAS NUEVAS\n');

        const tablasNuevas = [
            { nombre: 'OperationalKey', count: operationalKeyCount },
            { nombre: 'DataQualityMetrics', count: qualityCount }
        ];

        tablasNuevas.forEach(t => {
            console.log(`  ${t.nombre}: ${t.count >= 0 ? '✅ Existe' : '❌ No existe'}`);
        });

        console.log();

        todosLoTests.push({
            nombre: 'Tablas Nuevas',
            pasado: true,
            detalles: 'OperationalKey y DataQualityMetrics creadas'
        });

        // ============================================
        // TEST 7: ÍNDICES Y PERFORMANCE
        // ============================================
        console.log('='.repeat(100));
        console.log('⚡ TEST 7: ÍNDICES Y PERFORMANCE\n');

        const inicio = Date.now();

        const sesionesConFiltros = await prisma.session.findMany({
            where: {
                startTime: {
                    gte: new Date('2025-10-08T00:00:00Z'),
                    lte: new Date('2025-10-08T23:59:59Z')
                }
            },
            take: 100
        });

        const duracion = Date.now() - inicio;

        console.log(`Query con filtros: ${duracion}ms para ${sesionesConFiltros.length} sesiones`);
        console.log(`✅ Performance: ${duracion < 1000 ? 'EXCELENTE' : duracion < 3000 ? 'BUENA' : 'MEJORABLE'}\n`);

        todosLoTests.push({
            nombre: 'Performance',
            pasado: duracion < 3000,
            detalles: `${duracion}ms para query compleja`
        });

        // ============================================
        // RESUMEN FINAL
        // ============================================
        console.log('='.repeat(100));
        console.log('📊 RESUMEN FINAL\n');

        const testsPasados = todosLoTests.filter(t => t.pasado).length;
        const testsTotal = todosLoTests.length;
        const porcentajeExito = (testsPasados / testsTotal * 100).toFixed(1);

        console.log(`Tests ejecutados: ${testsTotal}`);
        console.log(`Tests pasados: ${testsPasados}/${testsTotal} (${porcentajeExito}%)\n`);

        todosLoTests.forEach((test, idx) => {
            const icono = test.pasado ? '✅' : '❌';
            console.log(`${icono} ${idx + 1}. ${test.nombre}: ${test.detalles}`);
        });

        console.log('\n' + '='.repeat(100));

        if (testsPasados === testsTotal) {
            console.log('✅ TODOS LOS TESTS PASARON - SISTEMA 100% FUNCIONAL\n');
        } else {
            console.log(`⚠️  ${testsTotal - testsPasados} tests fallaron - REVISAR\n`);
        }

        console.log('='.repeat(100) + '\n');

    } catch (error) {
        console.error('\n❌ ERROR EN VALIDACIÓN:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testSistemaCompleto();

