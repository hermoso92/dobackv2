import path from 'path';
import { AutomaticDataUploadService } from '../src/services/AutomaticDataUploadService';
import { logger } from '../src/utils/logger';

async function startAutomaticUpload() {
    try {
        logger.info('🚀 Iniciando servicio automático de subida de datos...');

        const service = new AutomaticDataUploadService();

        // Configurar el directorio base
        const basePath = path.join(process.cwd(), 'data', 'datosDoback');
        service.setBasePath(basePath);

        // Configurar manejadores de eventos
        service.on('started', () => {
            logger.info('✅ Servicio automático iniciado exitosamente');
        });

        service.on('stopped', () => {
            logger.info('🛑 Servicio automático detenido');
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

        service.on('error', (error) => {
            logger.error('❌ Error en servicio automático:', error);
        });

        // Iniciar el servicio
        await service.start();

        // Mantener el proceso activo
        process.on('SIGINT', async () => {
            logger.info('🛑 Recibida señal SIGINT, deteniendo servicio...');
            await service.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('🛑 Recibida señal SIGTERM, deteniendo servicio...');
            await service.stop();
            process.exit(0);
        });

        // Mostrar estadísticas cada 5 minutos
        setInterval(() => {
            const stats = service.getDetailedStats();
            logger.info('📊 Estadísticas del servicio automático:', {
                status: service.getStatus(),
                uptime: stats.uptime ? Math.round(stats.uptime / 1000 / 60) : 0,
                sessionsProcessed: stats.service.sessionsProcessed,
                filesProcessed: stats.service.filesProcessed,
                errors: stats.service.errors,
                averageSessionsPerHour: Math.round(stats.averageSessionsPerHour * 100) / 100,
                averageFilesPerHour: Math.round(stats.averageFilesPerHour * 100) / 100,
                errorRate: Math.round(stats.errorRate * 100) / 100
            });
        }, 5 * 60 * 1000); // 5 minutos

        logger.info('🎯 Servicio automático ejecutándose. Presiona Ctrl+C para detener.');

    } catch (error) {
        logger.error('💥 Error iniciando servicio automático:', error);
        process.exit(1);
    }
}

// Ejecutar el servicio
startAutomaticUpload().catch(console.error);