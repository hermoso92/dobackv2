import { PrismaClient } from '@prisma/client';
import path from 'path';
import { DailyProcessingService } from '../src/services/DailyProcessingService';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

let dailyProcessingService: DailyProcessingService | null = null;

/**
 * Inicializa el servicio de procesamiento diario para todas las organizaciones
 */
export async function initDailyProcessingService(): Promise<void> {
    try {
        logger.info('🚀 Iniciando servicio de procesamiento diario automático');

        // Obtener todas las organizaciones activas
        const organizations = await prisma.organization.findMany({
            where: {
                // Agregar filtro de organizaciones activas si existe
            }
        });

        if (organizations.length === 0) {
            logger.warn('No se encontraron organizaciones para configurar procesamiento diario');
            return;
        }

        logger.info(`📋 Configurando procesamiento diario para ${organizations.length} organizaciones`);

        // Por ahora, configuramos solo para CMadrid (organización principal)
        // En el futuro se puede expandir para múltiples organizaciones
        const mainOrganization = organizations.find(org =>
            org.name.toLowerCase().includes('madrid') ||
            org.name.toLowerCase().includes('cmadrid')
        );

        if (!mainOrganization) {
            logger.warn('No se encontró la organización principal (CMadrid)');
            return;
        }

        // Configurar servicio de procesamiento diario
        const config = {
            baseDataPath: path.join(process.cwd(), 'backend/data/datosDoback/CMadrid'),
            organizationId: mainOrganization.id,
            scheduleTime: '0 2 * * *', // 2:00 AM todos los días
            enabled: true
        };

        dailyProcessingService = new DailyProcessingService(config);
        dailyProcessingService.start();

        logger.info('✅ Servicio de procesamiento diario iniciado correctamente', {
            organizationId: mainOrganization.id,
            organizationName: mainOrganization.name,
            schedule: config.scheduleTime,
            basePath: config.baseDataPath
        });

    } catch (error) {
        logger.error('Error iniciando servicio de procesamiento diario:', error);
        throw error;
    }
}

/**
 * Detiene el servicio de procesamiento diario
 */
export async function stopDailyProcessingService(): Promise<void> {
    try {
        if (dailyProcessingService) {
            dailyProcessingService.stop();
            dailyProcessingService = null;
            logger.info('🛑 Servicio de procesamiento diario detenido');
        }
    } catch (error) {
        logger.error('Error deteniendo servicio de procesamiento diario:', error);
    }
}

/**
 * Obtiene el estado del servicio de procesamiento diario
 */
export function getDailyProcessingServiceStatus(): {
    isRunning: boolean;
    service: DailyProcessingService | null;
} {
    return {
        isRunning: dailyProcessingService?.getStatus().isRunning || false,
        service: dailyProcessingService
    };
}

/**
 * Ejecuta procesamiento manual para una fecha específica
 */
export async function runManualDailyProcessing(targetDate?: string): Promise<any> {
    if (!dailyProcessingService) {
        throw new Error('Servicio de procesamiento diario no está inicializado');
    }

    const date = targetDate || new Date().toISOString().split('T')[0].replace(/-/g, '');
    return await dailyProcessingService.processSpecificDate(date);
}

/**
 * Obtiene los reportes de procesamiento recientes
 */
export async function getRecentProcessingReports(limit: number = 10): Promise<any[]> {
    if (!dailyProcessingService) {
        throw new Error('Servicio de procesamiento diario no está inicializado');
    }

    return await dailyProcessingService.getRecentReports(limit);
}
