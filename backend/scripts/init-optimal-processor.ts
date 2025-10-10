import { OptimalDataProcessor } from '../src/services/OptimalDataProcessor';
import { logger } from '../src/utils/logger';

let optimalProcessor: OptimalDataProcessor | null = null;

/**
 * Inicializa el procesador óptimo
 */
export async function initOptimalProcessor(): Promise<void> {
    try {
        logger.info('🚀 Inicializando procesador óptimo de datos...');

        optimalProcessor = new OptimalDataProcessor();

        // Configurar manejadores de señales para shutdown graceful
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);

        logger.info('✅ Procesador óptimo inicializado correctamente');

    } catch (error) {
        logger.error('❌ Error inicializando procesador óptimo:', error);
        throw error;
    }
}

/**
 * Procesa todos los datos de un directorio
 */
export async function processAllData(basePath: string): Promise<void> {
    if (!optimalProcessor) {
        throw new Error('Procesador óptimo no inicializado');
    }

    try {
        logger.info(`📊 Iniciando procesamiento masivo en: ${basePath}`);

        const stats = await optimalProcessor.processAllData(basePath);

        logger.info('📈 Estadísticas del procesamiento:');
        logger.info(`  - Sesiones procesadas: ${stats.sessionsProcessed}`);
        logger.info(`  - Sesiones fallidas: ${stats.sessionsFailed}`);
        logger.info(`  - Archivos procesados: ${stats.totalFilesProcessed}`);
        logger.info(`  - Puntos GPS: ${stats.totalDataPoints.gps}`);
        logger.info(`  - Puntos estabilidad: ${stats.totalDataPoints.stability}`);
        logger.info(`  - Frames CAN: ${stats.totalDataPoints.can}`);
        logger.info(`  - Puntos rotativo: ${stats.totalDataPoints.rotativo}`);
        logger.info(`  - Tiempo total: ${stats.processingTime}ms`);

        if (stats.errors.length > 0) {
            logger.warn(`⚠️ Errores encontrados: ${stats.errors.length}`);
            stats.errors.forEach((error, index) => {
                logger.warn(`  ${index + 1}. ${error}`);
            });
        }

    } catch (error) {
        logger.error('❌ Error en procesamiento masivo:', error);
        throw error;
    }
}

/**
 * Obtiene estadísticas del procesador
 */
export function getProcessorStats() {
    if (!optimalProcessor) {
        return null;
    }
    return optimalProcessor.getStats();
}

/**
 * Detiene el procesador óptimo
 */
export async function stopOptimalProcessor(): Promise<void> {
    if (optimalProcessor) {
        logger.info('🛑 Deteniendo procesador óptimo...');
        await optimalProcessor.stop();
        optimalProcessor = null;
        logger.info('✅ Procesador óptimo detenido');
    }
}

/**
 * Shutdown graceful
 */
async function gracefulShutdown(signal: string): Promise<void> {
    logger.info(`🛑 Recibida señal ${signal}, deteniendo procesador óptimo...`);
    await stopOptimalProcessor();
    process.exit(0);
}

/**
 * Verifica si el procesador está corriendo
 */
export function isProcessorRunning(): boolean {
    return optimalProcessor !== null;
}