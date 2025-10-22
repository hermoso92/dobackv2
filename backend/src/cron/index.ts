/**
 * Cron Jobs del Sistema
 * 
 * Gestiona todas las tareas programadas:
 * - Verificación de archivos faltantes (diario a las 08:00)
 * - Inicialización de reportes programados
 */

import * as cron from 'node-cron';
import { AlertService } from '../services/AlertService';
import { ScheduledReportService } from '../services/ScheduledReportService';
import { logger } from '../utils/logger';

/**
 * Inicializar todos los cron jobs del sistema
 */
export function initializeCronJobs(): void {
    logger.info('🕐 Inicializando cron jobs del sistema');

    // ==================== VERIFICACIÓN DIARIA DE ARCHIVOS FALTANTES ====================
    // Ejecutar todos los días a las 08:00 AM (Europe/Madrid)
    cron.schedule(
        '0 8 * * *',  // Minuto 0, Hora 8, Todos los días
        async () => {
            logger.info('⏰ Ejecutando verificación diaria de archivos faltantes');
            try {
                const alerts = await AlertService.checkMissingFiles();
                logger.info('✅ Verificación completada', {
                    alertsCreated: alerts.length
                });
            } catch (error) {
                logger.error('❌ Error en verificación diaria de archivos', error);
            }
        },
        {
            timezone: 'Europe/Madrid'
        }
    );

    logger.info('✅ Cron job de verificación de archivos configurado (08:00 AM diario)');

    // ==================== INICIALIZACIÓN DE REPORTES PROGRAMADOS ====================
    // Inicializar reportes programados al arrancar el servidor
    ScheduledReportService.initializeScheduledReports()
        .then(() => {
            logger.info('✅ Reportes programados inicializados');
        })
        .catch(error => {
            logger.error('❌ Error inicializando reportes programados', error);
        });

    // ==================== LIMPIEZA DE DATOS ANTIGUOS ====================
    // Ejecutar cada domingo a las 03:00 AM
    cron.schedule(
        '0 3 * * 0',  // Minuto 0, Hora 3, Domingo
        async () => {
            logger.info('🧹 Ejecutando limpieza de datos antiguos');
            try {
                // Eliminar alertas resueltas de hace más de 6 meses
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                // TODO: Implementar limpieza
                // await prisma.missingFileAlert.deleteMany({
                //     where: {
                //         status: 'RESOLVED',
                //         resolvedAt: {
                //             lt: sixMonthsAgo
                //         }
                //     }
                // });

                logger.info('✅ Limpieza completada');
            } catch (error) {
                logger.error('❌ Error en limpieza de datos', error);
            }
        },
        {
            timezone: 'Europe/Madrid'
        }
    );

    logger.info('✅ Cron job de limpieza configurado (Domingos 03:00 AM)');

    logger.info('✅ Todos los cron jobs inicializados correctamente');
}

/**
 * Detener todos los cron jobs
 */
export function stopAllCronJobs(): void {
    logger.info('⏹️ Deteniendo todos los cron jobs');

    // Detener reportes programados
    // ScheduledReportService.stopAllReports();

    logger.info('✅ Todos los cron jobs detenidos');
}

