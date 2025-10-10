import fs from 'fs';
import path from 'path';
import { AutomaticDataUploadService } from '../src/services/AutomaticDataUploadService';
import { logger } from '../src/utils/logger';

async function testAutomaticUpload() {
    try {
        logger.info('🧪 Iniciando prueba del servicio automático...');

        const service = new AutomaticDataUploadService();

        // Configurar el directorio base
        const basePath = path.join(process.cwd(), 'data', 'datosDoback');
        service.setBasePath(basePath);

        // Verificar que el directorio existe
        if (!fs.existsSync(basePath)) {
            logger.error(`❌ Directorio base no encontrado: ${basePath}`);
            return;
        }

        logger.info(`📁 Directorio base configurado: ${basePath}`);

        // Configurar manejadores de eventos
        service.on('started', () => {
            logger.info('✅ Servicio iniciado exitosamente');
        });

        service.on('sessionProcessed', (data) => {
            logger.info(`✅ Sesión procesada: ${data.group.vehicleId}_${data.group.date}`, {
                sessionId: data.result.sessionId,
                filesProcessed: data.result.filesProcessed,
                dataInserted: data.result.dataInserted,
                kpisCalculated: data.result.kpisCalculated
            });
        });

        service.on('sessionError', (data) => {
            logger.error(`❌ Error en sesión: ${data.group.vehicleId}_${data.group.date}`, data.error);
        });

        // Iniciar el servicio
        await service.start();

        // Esperar un poco para que procese archivos
        logger.info('⏳ Esperando 30 segundos para procesamiento...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Obtener estadísticas
        const stats = service.getDetailedStats();
        logger.info('📊 Estadísticas finales:', {
            status: service.getStatus(),
            uptime: stats.uptime ? Math.round(stats.uptime / 1000) : 0,
            sessionsProcessed: stats.service.sessionsProcessed,
            filesProcessed: stats.service.filesProcessed,
            errors: stats.service.errors,
            averageSessionsPerHour: Math.round(stats.averageSessionsPerHour * 100) / 100,
            averageFilesPerHour: Math.round(stats.averageFilesPerHour * 100) / 100,
            errorRate: Math.round(stats.errorRate * 100) / 100
        });

        // Detener el servicio
        await service.stop();

        logger.info('✅ Prueba completada exitosamente');

    } catch (error) {
        logger.error('💥 Error en la prueba:', error);
    }
}

// Ejecutar la prueba
testAutomaticUpload().catch(console.error);