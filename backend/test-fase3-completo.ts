/**
 * TEST COMPLETO FASE 3: CORRELACIÓN TEMPORAL Y EVENTOS
 * 
 * Flujo completo:
 * 1. Subir archivos con UnifiedFileProcessor
 * 2. Correlacionar datos (GPS↔ROTATIVO, ESTABILIDAD↔GPS)
 * 3. Detectar eventos con GPS
 * 4. Verificar calidad y cobertura
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { dataCorrelationService } from './src/services/DataCorrelationService';
import { eventDetectorWithGPS } from './src/services/EventDetectorWithGPS';
import { temporalCorrelationService } from './src/services/TemporalCorrelationService';
import { unifiedFileProcessor } from './src/services/UnifiedFileProcessor';
import { createLogger } from './src/utils/logger';

const logger = createLogger('TestFase3');
const prisma = new PrismaClient();

async function testFase3Completo() {
    try {
        console.log('\n' + '='.repeat(100));
        console.log('🧪 TEST COMPLETO FASE 3: CORRELACIÓN TEMPORAL Y EVENTOS');
        console.log('='.repeat(100) + '\n');

        // ============================================
        // PASO 1: SUBIR ARCHIVOS (Caso normal)
        // ============================================
        console.log('📤 PASO 1: SUBIDA DE ARCHIVOS\n');
        console.log('Caso de prueba: DOBACK024 08/10/2025 (7 sesiones, GPS 79%)\n');

        const basePath = path.join(__dirname, 'data', 'datosDoback', 'CMadrid', 'doback024');

        const archivos = [
            {
                nombre: 'ESTABILIDAD_DOBACK024_20251008.txt',
                buffer: fs.readFileSync(path.join(basePath, 'estabilidad', 'ESTABILIDAD_DOBACK024_20251008.txt'))
            },
            {
                nombre: 'GPS_DOBACK024_20251008.txt',
                buffer: fs.readFileSync(path.join(basePath, 'GPS', 'GPS_DOBACK024_20251008.txt'))
            },
            {
                nombre: 'ROTATIVO_DOBACK024_20251008.txt',
                buffer: fs.readFileSync(path.join(basePath, 'ROTATIVO', 'ROTATIVO_DOBACK024_20251008.txt'))
            }
        ];

        // Obtener usuario de prueba
        const usuario = await prisma.user.findFirst({
            where: { email: 'test@bomberosmadrid.es' }
        });

        if (!usuario) {
            throw new Error('Usuario de prueba no encontrado');
        }

        const inicioSubida = Date.now();

        const resultadoSubida = await unifiedFileProcessor.procesarArchivos(
            archivos,
            usuario.organizationId || 'default-org',
            usuario.id
        );

        const duracionSubida = Date.now() - inicioSubida;

        console.log('✅ Subida completada:');
        console.log(`   Sesiones creadas: ${resultadoSubida.sesionesCreadas}`);
        console.log(`   Session IDs: ${resultadoSubida.sessionIds.slice(0, 3).join(', ')}...`);
        console.log(`   Duración: ${duracionSubida}ms\n`);

        // ============================================
        // PASO 2: CORRELACIÓN TEMPORAL
        // ============================================
        console.log('='.repeat(100));
        console.log('🔗 PASO 2: CORRELACIÓN TEMPORAL\n');

        // Usar la primera sesión para pruebas detalladas
        const sesionPrueba = resultadoSubida.sessionIds[0];

        console.log(`Analizando sesión: ${sesionPrueba}\n`);

        const inicioCorrelacion = Date.now();

        const correlacion = await dataCorrelationService.correlacionarSesion(sesionPrueba);

        const duracionCorrelacion = Date.now() - inicioCorrelacion;

        console.log('📊 Resultado de correlación:');
        console.log(`   Puntos GPS totales: ${correlacion.estadisticas.puntosGPS}`);
        console.log(`   GPS válidos (fix=1): ${correlacion.estadisticas.puntosGPSValidos}`);
        console.log(`   Muestras ESTABILIDAD: ${correlacion.estadisticas.muestrasEstabilidad}`);
        console.log(`   Cambios ROTATIVO: ${correlacion.estadisticas.cambiosRotativo}`);
        console.log(`   Correlaciones GPS↔ROTATIVO: ${correlacion.estadisticas.correlacionesGPSRotativo}`);
        console.log(`   Correlaciones ESTABILIDAD↔GPS: ${correlacion.estadisticas.correlacionesEstabilidadGPS}`);
        console.log(`   Duración: ${duracionCorrelacion}ms\n`);

        // Verificar GPS con rotativo
        const puntosConRotativoON = correlacion.gpsConRotativo.filter(p => p.rotativoOn);
        console.log(`✅ GPS con rotativo ON: ${puntosConRotativoON.length} de ${correlacion.gpsConRotativo.length} (${(puntosConRotativoON.length / correlacion.gpsConRotativo.length * 100).toFixed(1)}%)`);

        // Verificar estabilidad con GPS
        const estabilidadConCoords = correlacion.estabilidadConGPS.filter(e => e.lat !== 0 && e.lon !== 0);
        console.log(`✅ ESTABILIDAD con GPS: ${estabilidadConCoords.length} de ${correlacion.estabilidadConGPS.length} (${(estabilidadConCoords.length / correlacion.estabilidadConGPS.length * 100).toFixed(1)}%)\n`);

        // ============================================
        // PASO 3: DETECCIÓN DE EVENTOS
        // ============================================
        console.log('='.repeat(100));
        console.log('⚠️  PASO 3: DETECCIÓN DE EVENTOS DE ESTABILIDAD\n');

        const inicioEventos = Date.now();

        const resultadoEventos = await eventDetectorWithGPS.detectarYGuardarEventos(sesionPrueba);

        const duracionEventos = Date.now() - inicioEventos;

        console.log('📊 Resultado de detección:');
        console.log(`   Total eventos detectados: ${resultadoEventos.total}`);
        console.log(`   Eventos guardados en BD: ${resultadoEventos.guardados}`);
        console.log(`   Duración: ${duracionEventos}ms\n`);

        if (resultadoEventos.guardados > 0) {
            // Consultar eventos guardados y agrupar por severidad
            const eventos = await prisma.stabilityEvent.findMany({
                where: { session_id: sesionPrueba },
                select: { severity: true, type: true, lat: true, lon: true }
            });

            const graves = eventos.filter(e => e.severity === 'GRAVE').length;
            const moderados = eventos.filter(e => e.severity === 'MODERADA').length;
            const leves = eventos.filter(e => e.severity === 'LEVE').length;
            const conGPS = eventos.filter(e => e.lat !== 0 && e.lon !== 0).length;

            console.log('📊 Distribución de eventos:');
            console.log(`   GRAVES (SI < 0.20): ${graves}`);
            console.log(`   MODERADOS (0.20 ≤ SI < 0.35): ${moderados}`);
            console.log(`   LEVES (0.35 ≤ SI < 0.50): ${leves}`);
            console.log(`   Con coordenadas GPS: ${conGPS} (${(conGPS / eventos.length * 100).toFixed(1)}%)\n`);

            // Tipos de eventos detectados
            const tiposCont = new Map<string, number>();
            eventos.forEach(e => {
                const tipos = e.type.split(',');
                tipos.forEach(t => {
                    tiposCont.set(t, (tiposCont.get(t) || 0) + 1);
                });
            });

            console.log('📊 Tipos de eventos:');
            Array.from(tiposCont.entries())
                .sort((a, b) => b[1] - a[1])
                .forEach(([tipo, count]) => {
                    console.log(`   ${tipo}: ${count}`);
                });
            console.log();
        }

        // ============================================
        // PASO 4: COBERTURA DE DATOS
        // ============================================
        console.log('='.repeat(100));
        console.log('📈 PASO 4: ANÁLISIS DE COBERTURA DE DATOS\n');

        const cobertura = await temporalCorrelationService.obtenerCoberturaDatos(sesionPrueba);

        console.log('GPS:');
        console.log(`   Total: ${cobertura.gps.total}`);
        console.log(`   Válidos (fix=1): ${cobertura.gps.validos}`);
        console.log(`   Interpolados: ${cobertura.gps.interpolados}`);
        console.log(`   Calidad: ${cobertura.gps.porcentaje.toFixed(2)}%\n`);

        console.log('ESTABILIDAD:');
        console.log(`   Total: ${cobertura.estabilidad.total}`);
        console.log(`   Con GPS: ${cobertura.estabilidad.conGPS}`);
        console.log(`   % con ubicación: ${cobertura.estabilidad.porcentaje.toFixed(2)}%\n`);

        console.log('ROTATIVO:');
        console.log(`   Total mediciones: ${cobertura.rotativo.total}`);
        console.log(`   Cambios de estado: ${cobertura.rotativo.cambios}\n`);

        // ============================================
        // PASO 5: PROCESAR TODAS LAS SESIONES
        // ============================================
        console.log('='.repeat(100));
        console.log('🔄 PASO 5: PROCESANDO TODAS LAS SESIONES\n');

        const inicioTodas = Date.now();

        let totalEventos = 0;

        for (const sessionId of resultadoSubida.sessionIds) {
            const resultado = await eventDetectorWithGPS.detectarYGuardarEventos(sessionId);
            totalEventos += resultado.guardados;
        }

        const duracionTodas = Date.now() - inicioTodas;

        console.log(`✅ ${resultadoSubida.sessionIds.length} sesiones procesadas`);
        console.log(`   Total eventos detectados: ${totalEventos}`);
        console.log(`   Duración: ${duracionTodas}ms`);
        console.log(`   Promedio: ${(duracionTodas / resultadoSubida.sessionIds.length).toFixed(0)}ms por sesión\n`);

        // ============================================
        // RESUMEN FINAL
        // ============================================
        console.log('='.repeat(100));
        console.log('📊 RESUMEN FINAL - FASE 3\n');

        console.log('TIEMPOS:');
        console.log(`   Subida: ${duracionSubida}ms`);
        console.log(`   Correlación (1 sesión): ${duracionCorrelacion}ms`);
        console.log(`   Eventos (1 sesión): ${duracionEventos}ms`);
        console.log(`   Procesamiento completo (${resultadoSubida.sessionIds.length} sesiones): ${duracionTodas}ms`);
        console.log(`   TOTAL: ${duracionSubida + duracionTodas}ms\n`);

        console.log('DATOS PROCESADOS:');
        console.log(`   GPS: ${resultadoSubida.estadisticas.gpsValido.toLocaleString()} válidas`);
        console.log(`   ESTABILIDAD: ${resultadoSubida.estadisticas.estabilidadValida.toLocaleString()} válidas`);
        console.log(`   ROTATIVO: ${resultadoSubida.estadisticas.rotativoValido.toLocaleString()} válidas`);
        console.log(`   Eventos detectados: ${totalEventos.toLocaleString()}\n`);

        console.log('='.repeat(100));
        console.log('✅ FASE 3 COMPLETADA EXITOSAMENTE\n');

    } catch (error: any) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testFase3Completo();

