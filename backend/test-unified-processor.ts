/**
 * Script de testing para el Procesador Unificado de Archivos
 * Usa los archivos reales de backend/data/datosDoback como banco de pruebas
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { unifiedFileProcessor } from './src/services/UnifiedFileProcessor';
import { createLogger } from './src/utils/logger';

const logger = createLogger('TestUnifiedProcessor');
const prisma = new PrismaClient();

async function testProcesadorUnificado() {
    try {
        console.log('🧪 INICIANDO TEST DEL PROCESADOR UNIFICADO\n');
        console.log('='.repeat(80));

        // 1. Definir archivos de prueba (DOBACK024 del 2025-10-08)
        const basePath = path.join(__dirname, 'data', 'datosDoback', 'CMadrid', 'doback024');

        const archivosTest = [
            {
                nombre: 'ESTABILIDAD_DOBACK024_20251008.txt',
                ruta: path.join(basePath, 'estabilidad', 'ESTABILIDAD_DOBACK024_20251008.txt')
            },
            {
                nombre: 'GPS_DOBACK024_20251008.txt',
                ruta: path.join(basePath, 'GPS', 'GPS_DOBACK024_20251008.txt')
            },
            {
                nombre: 'ROTATIVO_DOBACK024_20251008.txt',
                ruta: path.join(basePath, 'ROTATIVO', 'ROTATIVO_DOBACK024_20251008.txt')
            }
        ];

        // 2. Verificar que los archivos existen
        console.log('📁 VERIFICANDO ARCHIVOS DE PRUEBA:\n');
        for (const archivo of archivosTest) {
            if (!fs.existsSync(archivo.ruta)) {
                throw new Error(`Archivo no encontrado: ${archivo.ruta}`);
            }

            const stats = fs.statSync(archivo.ruta);
            console.log(`  ✅ ${archivo.nombre} (${(stats.size / 1024).toFixed(2)} KB)`);
        }

        // 3. Leer archivos como buffers
        console.log('\n📖 LEYENDO ARCHIVOS...\n');
        const archivos = archivosTest.map(a => ({
            nombre: a.nombre,
            buffer: fs.readFileSync(a.ruta)
        }));

        // 4. Obtener vehículo de prueba
        const vehiculoTest = await prisma.vehicle.findFirst({
            where: { identifier: 'DOBACK024' }
        });

        if (!vehiculoTest) {
            throw new Error('Vehículo DOBACK024 no encontrado en BD');
        }

        console.log(`  ✅ Vehículo encontrado: ${vehiculoTest.name} (${vehiculoTest.id})\n`);

        // 5. Obtener usuario de prueba
        const usuarioTest = await prisma.user.findFirst({
            where: { email: 'test@bomberosmadrid.es' }
        });

        if (!usuarioTest) {
            throw new Error('Usuario test@bomberosmadrid.es no encontrado');
        }

        console.log(`  ✅ Usuario encontrado: ${usuarioTest.email}\n`);
        console.log('='.repeat(80));

        // 6. PROCESAR CON EL SISTEMA UNIFICADO
        console.log('\n🚀 PROCESANDO ARCHIVOS CON SISTEMA UNIFICADO...\n');

        const inicio = Date.now();

        const resultado = await unifiedFileProcessor.procesarArchivos(
            archivos,
            usuarioTest.organizationId || 'default-org',
            usuarioTest.id
        );

        const duracion = Date.now() - inicio;

        console.log('='.repeat(80));
        console.log('📊 RESULTADOS:\n');

        console.log(`✅ Sesiones creadas: ${resultado.sesionesCreadas}`);
        console.log(`✅ Archivos válidos: ${resultado.archivosValidos}`);
        console.log(`⚠️  Archivos con problemas: ${resultado.archivosConProblemas}`);
        console.log(`⏱️  Duración: ${duracion}ms\n`);

        console.log('📈 ESTADÍSTICAS:\n');
        console.log(`  GPS válidas: ${resultado.estadisticas.gpsValido}`);
        console.log(`  GPS sin señal: ${resultado.estadisticas.gpsSinSenal}`);
        console.log(`  GPS interpoladas: ${resultado.estadisticas.gpsInterpolado}`);
        console.log(`  ESTABILIDAD válidas: ${resultado.estadisticas.estabilidadValida}`);
        console.log(`  ROTATIVO válidas: ${resultado.estadisticas.rotativoValido}\n`);

        if (resultado.problemas.length > 0) {
            console.log(`⚠️  PROBLEMAS DETECTADOS (${resultado.problemas.length}):\n`);
            resultado.problemas.slice(0, 10).forEach(p => {
                console.log(`  [${p.gravedad}] ${p.tipo}: ${p.descripcion}`);
            });
            if (resultado.problemas.length > 10) {
                console.log(`  ... y ${resultado.problemas.length - 10} más`);
            }
            console.log();
        }

        // 7. VERIFICAR SESIONES CREADAS
        if (resultado.sessionIds.length > 0) {
            console.log('='.repeat(80));
            console.log('🔍 VERIFICANDO SESIONES CREADAS:\n');

            for (const sessionId of resultado.sessionIds) {
                // Obtener conteos separadamente
                const [gpsCount, estabilidadCount, rotativoCount] = await Promise.all([
                    prisma.gpsMeasurement.count({ where: { sessionId } }),
                    prisma.stabilityMeasurement.count({ where: { sessionId } }),
                    prisma.rotativoMeasurement.count({ where: { sessionId } })
                ]);

                const sesion = await prisma.session.findUnique({
                    where: { id: sessionId }
                });

                const vehiculo = await prisma.vehicle.findUnique({
                    where: { id: sesion?.vehicleId }
                });

                const calidad = await prisma.dataQualityMetrics.findUnique({
                    where: { sessionId }
                });

                if (sesion && vehiculo) {
                    console.log(`📋 Sesión: ${sesion.id}`);
                    console.log(`   Vehículo: ${vehiculo.name}`);
                    console.log(`   Inicio: ${sesion.startTime.toISOString()}`);
                    console.log(`   Fin: ${sesion.endTime?.toISOString() || 'N/A'}`);
                    console.log(`   GPS: ${gpsCount} mediciones`);
                    console.log(`   ESTABILIDAD: ${estabilidadCount} mediciones`);
                    console.log(`   ROTATIVO: ${rotativoCount} mediciones`);

                    if (calidad) {
                        console.log(`   Calidad GPS: ${calidad.porcentajeGPSValido.toFixed(2)}%`);
                    }

                    console.log();
                }
            }
        }

        console.log('='.repeat(80));
        console.log('✅ TEST COMPLETADO EXITOSAMENTE\n');

    } catch (error: any) {
        console.error('\n❌ ERROR EN TEST:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar test
testProcesadorUnificado();

