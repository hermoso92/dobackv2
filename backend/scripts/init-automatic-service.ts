import path from 'path';
import { AutomaticDataUploadService } from '../src/services/AutomaticDataUploadService';
import { logger } from '../src/utils/logger';

let automaticService: AutomaticDataUploadService | null = null;

export function getAutomaticService(): AutomaticDataUploadService | null {
    return automaticService;
}

export async function initAutomaticService(): Promise<void> {
    try {
        if (automaticService) {
            logger.warn('⚠️ El servicio automático ya está inicializado');
            return;
        }

        logger.info('🚀 Inicializando servicio automático de subida de datos...');

        automaticService = new AutomaticDataUploadService();

        // Configurar el directorio base
        const basePath = path.join(process.cwd(), 'data', 'datosDoback');
        automaticService.setBasePath(basePath);

        // Configurar manejadores de eventos
        automaticService.on('started', () => {
            logger.info('✅ Servicio automático iniciado exitosamente');
        });

        automaticService.on('stopped', () => {
            logger.info('🛑 Servicio automático detenido');
        });

        automaticService.on('sessionProcessed', (data) => {
            logger.info(`✅ Sesión procesada: ${data.group.vehicleId}_${data.group.date}`, {
                sessionId: data.result.sessionId,
                filesProcessed: data.result.filesProcessed,
                dataInserted: data.result.dataInserted,
                kpisCalculated: data.result.kpisCalculated
            });
        });

        automaticService.on('sessionError', (data) => {
            logger.error(`❌ Error en sesión: ${data.group.vehicleId}_${data.group.date}`, data.error);
        });

        automaticService.on('error', (error) => {
            logger.error('❌ Error en servicio automático:', error);
        });

        // Iniciar el servicio
        await automaticService.start();

        logger.info('🎯 Servicio automático inicializado y ejecutándose');

    } catch (error) {
        logger.error('💥 Error inicializando servicio automático:', error);
        throw error;
    }
}

export async function stopAutomaticService(): Promise<void> {
    try {
        if (!automaticService) {
            logger.warn('⚠️ El servicio automático no está inicializado');
            return;
        }

        logger.info('🛑 Deteniendo servicio automático...');

        await automaticService.stop();
        automaticService = null;

        logger.info('✅ Servicio automático detenido exitosamente');

    } catch (error) {
        logger.error('💥 Error deteniendo servicio automático:', error);
        throw error;
    }
}

export function isAutomaticServiceRunning(): boolean {
    return automaticService !== null && automaticService.getStatus() === 'running';
}

export function getAutomaticServiceStats() {
    if (!automaticService) {
        return null;
    }

    return automaticService.getDetailedStats();
}