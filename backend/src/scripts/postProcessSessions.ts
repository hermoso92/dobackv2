/**
 * POST-PROCESAMIENTO DE SESIONES
 * 
 * Script para ejecutar funcionalidades deshabilitadas durante el procesamiento automático:
 * 1. Detección de violaciones de velocidad (con optimizaciones)
 * 2. Cálculo de KPIs diarios
 * 3. Eventos de geocercas
 * 
 * Uso:
 *   npx ts-node backend/src/scripts/postProcessSessions.ts <reportId>
 *   npx ts-node backend/src/scripts/postProcessSessions.ts 64b32f59-92cf-4039-b7f7-da16d7d7384d
 */

import { PrismaClient } from '@prisma/client';
import { ProcessingLogger } from '../services/ProcessingLogger';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface PostProcessOptions {
    vehicleId?: string;
    startDate?: Date;
    endDate?: Date;
    enableSpeedViolations: boolean;
    enableKPIs: boolean;
    enableGeofences: boolean;
    batchSize: number;
    samplingRate: number; // Para velocidades: 1 = todos los puntos, 10 = 1 cada 10
}

async function postProcessSessions(options: PostProcessOptions) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const processingLogger = new ProcessingLogger(`postprocess_${timestamp}`);

    try {
        processingLogger.info('========================================');
        processingLogger.info('  POST-PROCESAMIENTO DE SESIONES');
        processingLogger.info('========================================');
        if (options.vehicleId) {
            processingLogger.info(`Vehículo: ${options.vehicleId}`);
        }
        if (options.startDate && options.endDate) {
            processingLogger.info(`Fecha inicio: ${options.startDate.toISOString().split('T')[0]}`);
            processingLogger.info(`Fecha fin: ${options.endDate.toISOString().split('T')[0]}`);
        }
        processingLogger.info(`Violaciones de velocidad: ${options.enableSpeedViolations ? 'SÍ' : 'NO'}`);
        processingLogger.info(`KPIs diarios: ${options.enableKPIs ? 'SÍ' : 'NO'}`);
        processingLogger.info(`Geocercas: ${options.enableGeofences ? 'SÍ' : 'NO'}`);
        processingLogger.info(`Tamaño de batch: ${options.batchSize}`);
        processingLogger.info(`Muestreo GPS: 1 cada ${options.samplingRate} puntos`);
        processingLogger.separator();

        // 1. Construir condiciones de búsqueda
        const whereConditions: any = {};

        if (options.vehicleId) {
            // Buscar el vehículo por identifier
            const vehicle = await prisma.vehicle.findFirst({
                where: { identifier: options.vehicleId },
                select: { id: true }
            });

            if (vehicle) {
                whereConditions.vehicleId = vehicle.id;
            } else {
                processingLogger.warning(`Vehículo ${options.vehicleId} no encontrado`);
            }
        }

        if (options.startDate && options.endDate) {
            whereConditions.startTime = {
                gte: options.startDate,
                lte: options.endDate,
            };
        }

        // 2. Obtener sesiones
        processingLogger.info('📦 Buscando sesiones...');
        const sessions = await prisma.session.findMany({
            where: whereConditions,
            select: {
                id: true,
                vehicleId: true,
                organizationId: true,
                startTime: true,
                endTime: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        });

        if (sessions.length === 0) {
            processingLogger.warning(`No se encontraron sesiones con los criterios especificados`);
            processingLogger.finalize({
                totalFiles: 0,
                totalSessions: 0,
                totalOmitted: 0,
                errors: 1,
                warnings: 1,
            });
            return;
        }

        processingLogger.success(`✅ Encontradas ${sessions.length} sesiones`);
        processingLogger.separator();

        let processedCount = 0;
        let errorCount = 0;
        let warningCount = 0;

        // 2. PROCESAR POR LOTES
        for (let i = 0; i < sessions.length; i += options.batchSize) {
            const batch = sessions.slice(i, i + options.batchSize);
            const batchNumber = Math.floor(i / options.batchSize) + 1;
            const totalBatches = Math.ceil(sessions.length / options.batchSize);

            processingLogger.separator(`BATCH ${batchNumber}/${totalBatches} (${batch.length} sesiones)`);

            // Procesar sesiones del batch en paralelo
            const batchPromises = batch.map(async (session) => {
                const sessionStart = Date.now();
                const sessionLog: string[] = [];

                try {
                    sessionLog.push(`\n🔄 Procesando sesión ${session.id.substring(0, 8)}...`);
                    sessionLog.push(`   Fecha: ${session.startTime.toISOString().split('T')[0]}`);

                    // 2.1. VIOLACIONES DE VELOCIDAD (con muestreo)
                    if (options.enableSpeedViolations) {
                        try {
                            sessionLog.push(`   🚗 Analizando violaciones de velocidad (muestreo: 1/${options.samplingRate})...`);

                            // Importar dinámicamente
                            const { RouteProcessorService } = await import('../services/geoprocessing/RouteProcessorService');
                            const routeProcessor = new RouteProcessorService();

                            // Procesar con muestreo
                            const result = await routeProcessor.processSession(session.id, options.samplingRate);

                            sessionLog.push(`   ✅ Violaciones: ${result.speedViolations || 0}`);
                            sessionLog.push(`   ✅ Distancia: ${result.distance.toFixed(2)}m`);
                            sessionLog.push(`   ✅ Confianza: ${(result.confidence * 100).toFixed(1)}%`);
                        } catch (error: any) {
                            sessionLog.push(`   ⚠️ Error en violaciones de velocidad: ${error.message}`);
                            warningCount++;
                        }
                    }

                    // 2.2. KPIs DIARIOS
                    if (options.enableKPIs) {
                        try {
                            sessionLog.push(`   📊 Calculando KPIs...`);

                            const { AdvancedKPICalculationService } = await import('../services/AdvancedKPICalculationService');
                            const kpiService = new AdvancedKPICalculationService();

                            const sessionDate = new Date(session.startTime);
                            await kpiService.calculateAndStoreDailyKPIs(
                                session.vehicleId,
                                sessionDate,
                                session.organizationId
                            );

                            sessionLog.push(`   ✅ KPIs calculados`);
                        } catch (error: any) {
                            sessionLog.push(`   ⚠️ Error en KPIs: ${error.message}`);
                            warningCount++;
                        }
                    }

                    // 2.3. EVENTOS DE GEOCERCAS
                    if (options.enableGeofences) {
                        try {
                            sessionLog.push(`   🗺️ Procesando geocercas...`);

                            const { GeofenceService } = await import('../services/GeofenceService');
                            const geofenceService = new GeofenceService();

                            const gpsPoints = await prisma.gpsMeasurement.findMany({
                                where: { sessionId: session.id },
                                orderBy: { timestamp: 'asc' },
                            });

                            if (gpsPoints.length > 0) {
                                await geofenceService.processGPSPoints(
                                    session.vehicleId,
                                    session.organizationId,
                                    gpsPoints
                                );
                                sessionLog.push(`   ✅ Geocercas procesadas (${gpsPoints.length} puntos GPS)`);
                            } else {
                                sessionLog.push(`   ℹ️ Sin puntos GPS para geocercas`);
                            }
                        } catch (error: any) {
                            sessionLog.push(`   ⚠️ Error en geocercas: ${error.message}`);
                            warningCount++;
                        }
                    }

                    const sessionDuration = ((Date.now() - sessionStart) / 1000).toFixed(2);
                    sessionLog.push(`   ⏱️ Duración: ${sessionDuration}s`);

                    processedCount++;
                    return { success: true, logs: sessionLog };
                } catch (error: any) {
                    sessionLog.push(`   ❌ ERROR: ${error.message}`);
                    errorCount++;
                    return { success: false, logs: sessionLog, error };
                }
            });

            // Esperar a que termine el batch
            const batchResults = await Promise.allSettled(batchPromises);

            // Loggear resultados del batch
            batchResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    result.value.logs.forEach((log) => processingLogger.info(log));
                } else {
                    processingLogger.error(`Error en batch: ${result.reason}`);
                }
            });

            // Mostrar progreso
            const progress = ((i + batch.length) / sessions.length * 100).toFixed(1);
            processingLogger.info(`\n📈 Progreso: ${i + batch.length}/${sessions.length} (${progress}%)`);
            processingLogger.info(`   ✅ Exitosas: ${processedCount}`);
            processingLogger.info(`   ❌ Errores: ${errorCount}`);
            processingLogger.info(`   ⚠️ Advertencias: ${warningCount}`);
        }

        // 3. RESUMEN FINAL
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const durationMinutes = (parseInt(duration) / 60).toFixed(2);

        processingLogger.separator('RESUMEN FINAL');
        processingLogger.info(`Total de sesiones: ${sessions.length}`);
        processingLogger.info(`Procesadas exitosamente: ${processedCount}`);
        processingLogger.info(`Errores: ${errorCount}`);
        processingLogger.info(`Advertencias: ${warningCount}`);
        processingLogger.info(`Duración: ${durationMinutes} minutos (${duration}s)`);
        processingLogger.info(`Velocidad: ${(sessions.length / parseInt(duration)).toFixed(2)} sesiones/segundo`);

        processingLogger.finalize({
            totalFiles: 0,
            totalSessions: sessions.length,
            totalOmitted: 0,
            errors: errorCount,
            warnings: warningCount,
        });

        if (errorCount === 0) {
            logger.info(`\n✅ POST-PROCESAMIENTO COMPLETADO EXITOSAMENTE`);
            logger.info(`📝 Log completo: ${processingLogger.getLogPath()}`);
        } else {
            logger.warn(`\n⚠️ POST-PROCESAMIENTO COMPLETADO CON ${errorCount} ERRORES`);
            logger.info(`📝 Log completo: ${processingLogger.getLogPath()}`);
        }
    } catch (error: any) {
        processingLogger.error('Error fatal en post-procesamiento', error);
        logger.error('❌ Error fatal:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// EJECUCIÓN DEL SCRIPT
const args = process.argv.slice(2);

if (args.length < 3) {
    console.error('❌ Error: Debes proporcionar vehículo, fecha inicio y fecha fin');
    console.error('Uso: npx ts-node backend/src/scripts/postProcessSessions.ts <vehicleId> <startDate> <endDate>');
    console.error('Ejemplo: npx ts-node backend/src/scripts/postProcessSessions.ts DOBACK028 2025-09-30 2025-11-02');
    process.exit(1);
}

const vehicleId = args[0];
const startDate = new Date(args[1]);
const endDate = new Date(args[2]);
endDate.setHours(23, 59, 59, 999); // Incluir todo el día final

// Validar fechas
if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('❌ Error: Fechas inválidas. Usa formato YYYY-MM-DD');
    console.error('Ejemplo: 2025-09-30');
    process.exit(1);
}

// Opciones de procesamiento (modificables)
const options: PostProcessOptions = {
    vehicleId,
    startDate,
    endDate,
    enableSpeedViolations: true,    // ✅ Habilitar violaciones de velocidad
    enableKPIs: true,                // ✅ Habilitar KPIs
    enableGeofences: true,           // ✅ Habilitar geocercas
    batchSize: 5,                    // Procesar 5 sesiones en paralelo
    samplingRate: 10,                // Muestreo GPS: 1 punto cada 10 (para velocidades)
};

logger.info('\n========================================');
logger.info('  🚀 INICIANDO POST-PROCESAMIENTO');
logger.info('========================================\n');

postProcessSessions(options)
    .then(() => {
        logger.info('\n✅ Script finalizado correctamente');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('❌ Error fatal en el script:', error);
        process.exit(1);
    });

