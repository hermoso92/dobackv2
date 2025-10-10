#!/usr/bin/env ts-node

import { initOptimalProcessor, processAllData, stopOptimalProcessor, getProcessorStats } from './init-optimal-processor';
import { logger } from '../src/utils/logger';
import path from 'path';
import fs from 'fs';

async function testOptimalProcessor() {
    const basePath = path.join(__dirname, '../data/datosDoback/CMadrid');
    
    try {
        logger.info('🧪 Iniciando prueba del procesador óptimo...');
        
        // Verificar que el directorio existe
        if (!fs.existsSync(basePath)) {
            logger.error(`❌ Directorio no encontrado: ${basePath}`);
            process.exit(1);
        }
        
        // Listar archivos disponibles para análisis
        logger.info('📁 Analizando archivos disponibles...');
        const vehicleDirs = fs.readdirSync(basePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        logger.info(`🚗 Vehículos encontrados: ${vehicleDirs.join(', ')}`);
        
        // Contar archivos por tipo
        let totalFiles = 0;
        const fileTypes = { GPS: 0, CAN: 0, ESTABILIDAD: 0, ROTATIVO: 0 };
        
        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(basePath, vehicleDir);
            for (const dataType of ['GPS', 'CAN', 'estabilidad', 'rotativo']) {
                const typePath = path.join(vehiclePath, dataType);
                if (fs.existsSync(typePath)) {
                    const files = fs.readdirSync(typePath)
                        .filter(file => file.endsWith('.txt'));
                    
                    const typeKey = dataType.toUpperCase() as keyof typeof fileTypes;
                    fileTypes[typeKey] += files.length;
                    totalFiles += files.length;
                }
            }
        }
        
        logger.info('📊 Resumen de archivos:');
        logger.info(`  - GPS: ${fileTypes.GPS} archivos`);
        logger.info(`  - CAN: ${fileTypes.CAN} archivos`);
        logger.info(`  - ESTABILIDAD: ${fileTypes.ESTABILIDAD} archivos`);
        logger.info(`  - ROTATIVO: ${fileTypes.ROTATIVO} archivos`);
        logger.info(`  - Total: ${totalFiles} archivos`);
        
        if (totalFiles === 0) {
            logger.warn('⚠️ No se encontraron archivos para procesar');
            return;
        }
        
        // Inicializar procesador
        logger.info('🚀 Inicializando procesador óptimo...');
        await initOptimalProcessor();
        
        // Procesar datos
        logger.info('📊 Iniciando procesamiento...');
        const startTime = Date.now();
        
        await processAllData(basePath);
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        // Mostrar estadísticas
        const stats = getProcessorStats();
        if (stats) {
            logger.info('📈 Estadísticas finales:');
            logger.info(`  - Sesiones procesadas: ${stats.sessionsProcessed}`);
            logger.info(`  - Sesiones fallidas: ${stats.sessionsFailed}`);
            logger.info(`  - Archivos procesados: ${stats.totalFilesProcessed}`);
            logger.info(`  - Puntos GPS: ${stats.totalDataPoints.gps.toLocaleString()}`);
            logger.info(`  - Puntos estabilidad: ${stats.totalDataPoints.stability.toLocaleString()}`);
            logger.info(`  - Frames CAN: ${stats.totalDataPoints.can.toLocaleString()}`);
            logger.info(`  - Puntos rotativo: ${stats.totalDataPoints.rotativo.toLocaleString()}`);
            logger.info(`  - Tiempo total: ${(processingTime / 1000).toFixed(2)}s`);
            logger.info(`  - Velocidad: ${(stats.totalFilesProcessed / (processingTime / 1000)).toFixed(2)} archivos/seg`);
            
            if (stats.errors.length > 0) {
                logger.warn(`⚠️ Errores encontrados: ${stats.errors.length}`);
                stats.errors.slice(0, 5).forEach((error, index) => {
                    logger.warn(`  ${index + 1}. ${error}`);
                });
                if (stats.errors.length > 5) {
                    logger.warn(`  ... y ${stats.errors.length - 5} errores más`);
                }
            }
        }
        
        logger.info('✅ Prueba del procesador óptimo completada');
        
    } catch (error) {
        logger.error('❌ Error en prueba del procesador óptimo:', error);
        throw error;
    } finally {
        // Detener procesador
        await stopOptimalProcessor();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    testOptimalProcessor().catch((error) => {
        logger.error('❌ Error fatal en prueba:', error);
        process.exit(1);
    });
}

export { testOptimalProcessor };