import fs from 'fs';
import path from 'path';
import { AutomaticDataUploadService } from '../src/services/AutomaticDataUploadService';
import { logger } from '../src/utils/logger';

async function testCompleteAutomaticSystem() {
    try {
        logger.info('🧪 Iniciando prueba completa del sistema automático...');

        // 1. Verificar estructura de directorios
        logger.info('📁 Verificando estructura de directorios...');
        const basePath = path.join(process.cwd(), 'data', 'datosDoback');

        if (!fs.existsSync(basePath)) {
            logger.error(`❌ Directorio base no encontrado: ${basePath}`);
            return;
        }

        const cmadridPath = path.join(basePath, 'CMadrid');
        if (!fs.existsSync(cmadridPath)) {
            logger.error(`❌ Directorio CMadrid no encontrado: ${cmadridPath}`);
            return;
        }

        logger.info('✅ Estructura de directorios verificada');

        // 2. Contar archivos disponibles
        logger.info('📊 Contando archivos disponibles...');
        const vehicleDirs = fs.readdirSync(cmadridPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('doback'))
            .map(dirent => dirent.name);

        let totalFiles = 0;
        const filesByType: Record<string, number> = {};

        for (const vehicleDir of vehicleDirs) {
            const vehiclePath = path.join(cmadridPath, vehicleDir);
            const typeDirs = ['CAN', 'GPS', 'estabilidad', 'ROTATIVO'];

            for (const typeDir of typeDirs) {
                const typePath = path.join(vehiclePath, typeDir);

                if (fs.existsSync(typePath)) {
                    const files = fs.readdirSync(typePath);
                    const validFiles = files.filter(file => file.endsWith('.txt'));

                    totalFiles += validFiles.length;
                    filesByType[typeDir] = (filesByType[typeDir] || 0) + validFiles.length;

                    logger.info(`  📂 ${vehicleDir}/${typeDir}: ${validFiles.length} archivos`);
                }
            }
        }

        logger.info(`📊 Total de archivos: ${totalFiles}`, filesByType);

        // 3. Iniciar servicio automático
        logger.info('🚀 Iniciando servicio automático...');
        const service = new AutomaticDataUploadService();
        service.setBasePath(basePath);

        // Configurar manejadores de eventos
        service.on('started', () => {
            logger.info('✅ Servicio automático iniciado');
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

        // 4. Esperar procesamiento
        logger.info('⏳ Esperando procesamiento de archivos...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minuto

        // 5. Obtener estadísticas
        const stats = service.getDetailedStats();
        logger.info('📊 Estadísticas del procesamiento:', {
            status: service.getStatus(),
            uptime: stats.uptime ? Math.round(stats.uptime / 1000) : 0,
            sessionsProcessed: stats.service.sessionsProcessed,
            filesProcessed: stats.service.filesProcessed,
            errors: stats.service.errors,
            averageSessionsPerHour: Math.round(stats.averageSessionsPerHour * 100) / 100,
            averageFilesPerHour: Math.round(stats.averageFilesPerHour * 100) / 100,
            errorRate: Math.round(stats.errorRate * 100) / 100
        });

        // 6. Verificar archivos pendientes
        const pendingFiles = service.getPendingFiles();
        const errorFiles = service.getErrorFiles();

        logger.info(`📋 Archivos pendientes: ${pendingFiles}`);
        logger.info(`❌ Archivos con errores: ${errorFiles}`);

        // 7. Detener el servicio
        await service.stop();

        // 8. Resumen final
        logger.info('🎉 Prueba completada exitosamente');
        logger.info('📊 Resumen final:', {
            archivosDisponibles: totalFiles,
            sesionesProcesadas: stats.service.sessionsProcessed,
            archivosProcesados: stats.service.filesProcessed,
            errores: stats.service.errors,
            archivosPendientes: pendingFiles,
            archivosConErrores: errorFiles
        });

    } catch (error) {
        logger.error('💥 Error en la prueba completa:', error);
    }
}

// Ejecutar la prueba
testCompleteAutomaticSystem().catch(console.error);