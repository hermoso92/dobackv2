#!/usr/bin/env ts-node

import { logger } from '../src/utils/logger';

async function runAll() {
    try {
        logger.info('🚀 Iniciando sistema óptimo paso a paso...');

        // Paso 1: Prueba simple
        logger.info('📋 Paso 1: Prueba de conexión y configuración...');
        const { testSimple } = await import('./test-simple');
        await testSimple();

        // Paso 2: Procesamiento simple
        logger.info('📋 Paso 2: Procesamiento de datos...');
        const { processSimple } = await import('./process-simple');
        await processSimple();

        logger.info('✅ Sistema óptimo ejecutado exitosamente');

    } catch (error) {
        logger.error('❌ Error ejecutando sistema óptimo:', error);
        throw error;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runAll().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { runAll };
