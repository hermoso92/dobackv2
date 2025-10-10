#!/usr/bin/env ts-node

import path from 'path';
import { logger } from '../src/utils/logger';
import { initOptimalProcessor, processAllData, stopOptimalProcessor } from './init-optimal-processor';

async function main() {
    const basePath = process.argv[2] || path.join(__dirname, '../data/datosDoback/CMadrid');

    try {
        logger.info('🚀 Iniciando procesamiento masivo de datos...');
        logger.info(`📁 Directorio base: ${basePath}`);

        // Inicializar procesador
        await initOptimalProcessor();

        // Procesar todos los datos
        await processAllData(basePath);

        logger.info('✅ Procesamiento masivo completado exitosamente');

    } catch (error) {
        logger.error('❌ Error en procesamiento masivo:', error);
        process.exit(1);
    } finally {
        // Detener procesador
        await stopOptimalProcessor();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch((error) => {
        logger.error('❌ Error fatal:', error);
        process.exit(1);
    });
}

export { main };

