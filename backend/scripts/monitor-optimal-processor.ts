#!/usr/bin/env ts-node

import { initOptimalProcessor, processAllData, stopOptimalProcessor, getProcessorStats, isProcessorRunning } from './init-optimal-processor';
import { logger } from '../src/utils/logger';
import path from 'path';

async function monitorOptimalProcessor() {
    const basePath = process.argv[2] || path.join(__dirname, '../data/datosDoback/CMadrid');
    
    try {
        logger.info('📊 Iniciando monitoreo del procesador óptimo...');
        logger.info(`📁 Directorio: ${basePath}`);
        
        // Inicializar procesador
        await initOptimalProcessor();
        
        // Configurar monitoreo cada 30 segundos
        const monitorInterval = setInterval(async () => {
            if (isProcessorRunning()) {
                const stats = getProcessorStats();
                if (stats) {
                    logger.info('📈 Estadísticas en tiempo real:');
                    logger.info(`  - Sesiones procesadas: ${stats.sessionsProcessed}`);
                    logger.info(`  - Sesiones fallidas: ${stats.sessionsFailed}`);
                    logger.info(`  - Archivos procesados: ${stats.totalFilesProcessed}`);
                    logger.info(`  - Puntos GPS: ${stats.totalDataPoints.gps.toLocaleString()}`);
                    logger.info(`  - Puntos estabilidad: ${stats.totalDataPoints.stability.toLocaleString()}`);
                    logger.info(`  - Frames CAN: ${stats.totalDataPoints.can.toLocaleString()}`);
                    logger.info(`  - Puntos rotativo: ${stats.totalDataPoints.rotativo.toLocaleString()}`);
                    logger.info(`  - Tiempo: ${(stats.processingTime / 1000).toFixed(2)}s`);
                    
                    if (stats.errors.length > 0) {
                        logger.warn(`  - Errores: ${stats.errors.length}`);
                    }
                    logger.info('─'.repeat(50));
                }
            }
        }, 30000);
        
        // Iniciar procesamiento
        logger.info('🚀 Iniciando procesamiento...');
        const startTime = Date.now();
        
        await processAllData(basePath);
        
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        
        // Detener monitoreo
        clearInterval(monitorInterval);
        
        // Mostrar estadísticas finales
        const finalStats = getProcessorStats();
        if (finalStats) {
            logger.info('🎯 Estadísticas finales:');
            logger.info(`  - Tiempo total: ${totalTime.toFixed(2)}s`);
            logger.info(`  - Sesiones procesadas: ${finalStats.sessionsProcessed}`);
            logger.info(`  - Sesiones fallidas: ${finalStats.sessionsFailed}`);
            logger.info(`  - Archivos procesados: ${finalStats.totalFilesProcessed}`);
            logger.info(`  - Velocidad promedio: ${(finalStats.totalFilesProcessed / totalTime).toFixed(2)} archivos/seg`);
            logger.info(`  - Puntos totales procesados: ${(
                finalStats.totalDataPoints.gps + 
                finalStats.totalDataPoints.stability + 
                finalStats.totalDataPoints.can + 
                finalStats.totalDataPoints.rotativo
            ).toLocaleString()}`);
            
            if (finalStats.errors.length > 0) {
                logger.warn(`⚠️ Errores encontrados: ${finalStats.errors.length}`);
                finalStats.errors.slice(0, 10).forEach((error, index) => {
                    logger.warn(`  ${index + 1}. ${error}`);
                });
            }
        }
        
        logger.info('✅ Monitoreo completado');
        
    } catch (error) {
        logger.error('❌ Error en monitoreo:', error);
        throw error;
    } finally {
        await stopOptimalProcessor();
    }
}

// Manejo de señales para shutdown graceful
process.on('SIGINT', async () => {
    logger.info('🛑 Recibida señal SIGINT, deteniendo monitoreo...');
    await stopOptimalProcessor();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('🛑 Recibida señal SIGTERM, deteniendo monitoreo...');
    await stopOptimalProcessor();
    process.exit(0);
});

// Ejecutar si es llamado directamente
if (require.main === module) {
    monitorOptimalProcessor().catch((error) => {
        logger.error('❌ Error fatal en monitoreo:', error);
        process.exit(1);
    });
}

export { monitorOptimalProcessor };