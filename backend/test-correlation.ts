/**
 * Test de Correlación de Datos
 * Verifica que GPS, ESTABILIDAD y ROTATIVO se correlacionan correctamente
 */

import { PrismaClient } from '@prisma/client';
import { dataCorrelationService } from './src/services/DataCorrelationService';
import { createLogger } from './src/utils/logger';

const logger = createLogger('TestCorrelation');
const prisma = new PrismaClient();

async function testCorrelacion() {
    try {
        console.log('🧪 TEST DE CORRELACIÓN DE DATOS\n');
        console.log('='.repeat(80));

        // 1. Obtener una sesión reciente con datos
        const sesion = await prisma.session.findFirst({
            where: {
                vehicleId: '14b9febb-ca73-4130-a88d-e4d73ed6501a' // DOBACK024
            },
            orderBy: { startTime: 'desc' },
            include: {
                vehicle: true
            }
        });

        if (!sesion) {
            throw new Error('No se encontró ninguna sesión para probar');
        }

        console.log(`\n📋 Sesión de prueba: ${sesion.id}`);
        console.log(`   Vehículo: ${sesion.vehicle.name}`);
        console.log(`   Inicio: ${sesion.startTime.toISOString()}\n`);

        // 2. Obtener conteos antes de correlacionar
        const [gpsCount, estabilidadCount, rotativoCount] = await Promise.all([
            prisma.gpsMeasurement.count({ where: { sessionId: sesion.id } }),
            prisma.stabilityMeasurement.count({ where: { sessionId: sesion.id } }),
            prisma.rotativoMeasurement.count({ where: { sessionId: sesion.id } })
        ]);

        console.log('📊 DATOS EN BD:');
        console.log(`   GPS: ${gpsCount} mediciones`);
        console.log(`   ESTABILIDAD: ${estabilidadCount} mediciones`);
        console.log(`   ROTATIVO: ${rotativoCount} mediciones\n`);

        // 3. Correlacionar datos
        console.log('🔄 CORRELACIONANDO DATOS...\n');

        const inicio = Date.now();
        const resultado = await dataCorrelationService.correlacionarSesion(sesion.id);
        const duracion = Date.now() - inicio;

        console.log('='.repeat(80));
        console.log('✅ CORRELACIÓN COMPLETADA\n');

        console.log(`📊 ESTADÍSTICAS:`);
        console.log(`   Puntos GPS totales: ${resultado.estadisticas.puntosGPS}`);
        console.log(`   GPS válidos (fix=1): ${resultado.estadisticas.puntosGPSValidos}`);
        console.log(`   Muestras ESTABILIDAD: ${resultado.estadisticas.muestrasEstabilidad}`);
        console.log(`   Cambios ROTATIVO: ${resultado.estadisticas.cambiosRotativo}`);
        console.log(`   Correlaciones GPS↔ROTATIVO: ${resultado.estadisticas.correlacionesGPSRotativo}`);
        console.log(`   Correlaciones ESTABILIDAD↔GPS: ${resultado.estadisticas.correlacionesEstabilidadGPS}`);
        console.log(`   Duración: ${duracion}ms\n`);

        // 4. Verificar correlación GPS con Rotativo
        console.log('='.repeat(80));
        console.log('🔍 VERIFICANDO GPS CON ROTATIVO:\n');

        const puntosConRotativo = resultado.gpsConRotativo.filter(p => p.rotativoOn);
        console.log(`   Total puntos GPS: ${resultado.gpsConRotativo.length}`);
        console.log(`   Puntos con rotativo ON: ${puntosConRotativo.length}`);
        console.log(`   Puntos con rotativo OFF: ${resultado.gpsConRotativo.length - puntosConRotativo.length}\n`);

        if (puntosConRotativo.length > 0) {
            const ejemplo = puntosConRotativo[0];
            console.log(`   Ejemplo con rotativo ON:`);
            console.log(`     Timestamp: ${ejemplo.timestamp.toISOString()}`);
            console.log(`     Coordenadas: ${ejemplo.latitude.toFixed(6)}, ${ejemplo.longitude.toFixed(6)}`);
            console.log(`     Velocidad: ${ejemplo.speed.toFixed(2)} km/h\n`);
        }

        // 5. Verificar correlación Estabilidad con GPS
        console.log('='.repeat(80));
        console.log('🔍 VERIFICANDO ESTABILIDAD CON GPS:\n');

        const estabilidadConCoords = resultado.estabilidadConGPS.filter(e => e.lat !== 0 && e.lon !== 0);
        console.log(`   Total muestras ESTABILIDAD: ${resultado.estabilidadConGPS.length}`);
        console.log(`   Con coordenadas GPS: ${estabilidadConCoords.length}`);
        console.log(`   Sin coordenadas: ${resultado.estabilidadConGPS.length - estabilidadConCoords.length}`);
        console.log(`   % con GPS: ${(estabilidadConCoords.length / resultado.estabilidadConGPS.length * 100).toFixed(2)}%\n`);

        if (estabilidadConCoords.length > 0) {
            const ejemplo = estabilidadConCoords[0];
            console.log(`   Ejemplo con GPS:`);
            console.log(`     Timestamp: ${ejemplo.timestamp.toISOString()}`);
            console.log(`     SI: ${ejemplo.si}`);
            console.log(`     Coordenadas: ${ejemplo.lat.toFixed(6)}, ${ejemplo.lon.toFixed(6)}`);
            console.log(`     Velocidad: ${ejemplo.speed.toFixed(2)} km/h\n`);
        }

        // 6. Verificar eventos de estabilidad baja
        const eventosPotenciales = resultado.estabilidadConGPS.filter(e => e.si < 0.50);
        console.log('='.repeat(80));
        console.log('⚠️  EVENTOS POTENCIALES (SI < 0.50):\n');
        console.log(`   Total con SI < 0.50: ${eventosPotenciales.length}`);
        console.log(`   % del total: ${(eventosPotenciales.length / resultado.estabilidadConGPS.length * 100).toFixed(4)}%\n`);

        if (eventosPotenciales.length > 0) {
            // Agrupar por severidad
            const graves = eventosPotenciales.filter(e => e.si < 0.20).length;
            const moderados = eventosPotenciales.filter(e => e.si >= 0.20 && e.si < 0.35).length;
            const leves = eventosPotenciales.filter(e => e.si >= 0.35 && e.si < 0.50).length;

            console.log(`   Distribución:`);
            console.log(`     GRAVES (SI < 0.20): ${graves}`);
            console.log(`     MODERADOS (0.20 ≤ SI < 0.35): ${moderados}`);
            console.log(`     LEVES (0.35 ≤ SI < 0.50): ${leves}\n`);
        }

        console.log('='.repeat(80));
        console.log('✅ TEST DE CORRELACIÓN COMPLETADO\n');

    } catch (error: any) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testCorrelacion();

