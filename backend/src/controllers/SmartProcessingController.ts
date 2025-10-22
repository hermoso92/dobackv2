
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import path from 'path';
import { FileStateManager } from '../services/FileStateManager';
import { SmartDataProcessor } from '../services/SmartDataProcessor';
import { TokenPayload } from '../types/auth';
import { logger } from '../utils/logger';



interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export class SmartProcessingController {
    /**
     * Procesa archivos de forma inteligente para un vehículo específico
     */
    async processVehicleSmart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            logger.info('🧠 Iniciando procesamiento inteligente de datos de vehículo', {
                body: req.body,
                user: req.user
            });

            const {
                vehicleId,
                date,
                basePath,
                reprocessCompleted = false,
                reprocessFailed = true,
                decodeCANFiles = true
            } = req.body;

            if (!vehicleId) {
                logger.warn('Intento de procesamiento inteligente sin vehicleId');
                res.status(400).json({ error: 'Falta vehicleId' });
                return;
            }

            if (!req.user?.organizationId) {
                logger.warn('Intento de procesamiento inteligente sin organizationId');
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: req.user.organizationId
                }
            });

            if (!vehicle) {
                logger.warn('Vehículo no encontrado o no autorizado', { vehicleId });
                res.status(404).json({ error: 'Vehículo no encontrado o no autorizado' });
                return;
            }

            // Determinar la ruta base de los archivos
            const finalBasePath = basePath || path.join(
                process.cwd(),
                'backend/data/datosDoback/CMadrid',
                vehicleId
            );

            // Verificar que la ruta existe
            try {
                await require('fs/promises').access(finalBasePath);
            } catch (error) {
                logger.error(`Ruta de datos no encontrada: ${finalBasePath}`);
                res.status(404).json({ error: 'Ruta de datos no encontrada' });
                return;
            }

            const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');

            // Crear procesador inteligente
            const processor = new SmartDataProcessor({
                organizationId: req.user.organizationId,
                vehicleId: vehicle.id,
                date: targetDate,
                basePath: finalBasePath,
                reprocessCompleted,
                reprocessFailed,
                decodeCANFiles
            });

            // Procesar archivos de forma inteligente
            const result = await processor.processSmartData();

            logger.info('🎉 Procesamiento inteligente completado exitosamente', {
                vehicleId: vehicle.name,
                result
            });

            res.status(200).json({
                success: true,
                message: 'Procesamiento inteligente completado',
                data: {
                    vehicle: {
                        id: vehicle.id,
                        name: vehicle.name
                    },
                    processing: result,
                    date: targetDate,
                    config: {
                        reprocessCompleted,
                        reprocessFailed,
                        decodeCANFiles
                    }
                }
            });

        } catch (error) {
            logger.error('Error en procesamiento inteligente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Procesa archivos de forma inteligente para todos los vehículos
     */
    async processAllVehiclesSmart(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            logger.info('🧠 Iniciando procesamiento inteligente de todos los vehículos', {
                user: req.user
            });

            if (!req.user?.organizationId) {
                logger.warn('Intento de procesamiento inteligente sin organizationId');
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const {
                date,
                basePath,
                reprocessCompleted = false,
                reprocessFailed = true,
                decodeCANFiles = true
            } = req.body;

            // Obtener todos los vehículos de la organización
            const vehicles = await prisma.vehicle.findMany({
                where: {
                    organizationId: req.user.organizationId,
                    active: true
                }
            });

            if (vehicles.length === 0) {
                logger.warn('No se encontraron vehículos activos');
                res.status(404).json({ error: 'No se encontraron vehículos activos' });
                return;
            }

            const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
            const baseDataPath = basePath || path.join(process.cwd(), 'backend/data/datosDoback/CMadrid');

            const results = [];
            const errors = [];

            // Procesar cada vehículo de forma inteligente
            for (const vehicle of vehicles) {
                try {
                    logger.info(`🧠 Procesando vehículo ${vehicle.name} (${vehicle.id}) de forma inteligente`);

                    const vehiclePath = path.join(baseDataPath, vehicle.id);

                    // Verificar que la ruta del vehículo existe
                    try {
                        await require('fs/promises').access(vehiclePath);
                    } catch (error) {
                        logger.warn(`Ruta de datos no encontrada para vehículo ${vehicle.id}: ${vehiclePath}`);
                        errors.push({
                            vehicleId: vehicle.id,
                            vehicleName: vehicle.name,
                            error: 'Ruta de datos no encontrada'
                        });
                        continue;
                    }

                    const processor = new SmartDataProcessor({
                        organizationId: req.user.organizationId,
                        vehicleId: vehicle.id,
                        date: targetDate,
                        basePath: vehiclePath,
                        reprocessCompleted,
                        reprocessFailed,
                        decodeCANFiles
                    });

                    const result = await processor.processSmartData();
                    results.push(result);

                    logger.info(`✅ Vehículo ${vehicle.name} procesado exitosamente de forma inteligente`);

                } catch (error) {
                    logger.error(`Error procesando vehículo ${vehicle.name} de forma inteligente:`, error);
                    errors.push({
                        vehicleId: vehicle.id,
                        vehicleName: vehicle.name,
                        error: error instanceof Error ? error.message : 'Error desconocido'
                    });
                }
            }

            // Calcular estadísticas totales
            const totalStats = results.reduce((acc, result) => ({
                newFiles: acc.newFiles + result.newFiles,
                reprocessedFiles: acc.reprocessedFiles + result.reprocessedFiles,
                skippedFiles: acc.skippedFiles + result.skippedFiles,
                failedFiles: acc.failedFiles + result.failedFiles,
                totalDataPoints: acc.totalDataPoints + result.totalDataPoints,
                totalProcessingTime: acc.totalProcessingTime + result.processingTime
            }), {
                newFiles: 0,
                reprocessedFiles: 0,
                skippedFiles: 0,
                failedFiles: 0,
                totalDataPoints: 0,
                totalProcessingTime: 0
            });

            logger.info('🎉 Procesamiento inteligente masivo completado', {
                totalVehicles: vehicles.length,
                successful: results.length,
                failed: errors.length,
                totalStats
            });

            res.status(200).json({
                success: true,
                message: 'Procesamiento inteligente masivo completado',
                data: {
                    summary: {
                        totalVehicles: vehicles.length,
                        successful: results.length,
                        failed: errors.length,
                        ...totalStats
                    },
                    results,
                    errors,
                    date: targetDate,
                    config: {
                        reprocessCompleted,
                        reprocessFailed,
                        decodeCANFiles
                    }
                }
            });

        } catch (error) {
            logger.error('Error en procesamiento inteligente masivo:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene el estado de archivos de un vehículo
     */
    async getVehicleFileStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { vehicleId } = req.params;

            if (!vehicleId) {
                res.status(400).json({ error: 'Falta vehicleId' });
                return;
            }

            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Verificar que el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findFirst({
                where: {
                    id: vehicleId,
                    organizationId: req.user.organizationId
                }
            });

            if (!vehicle) {
                res.status(404).json({ error: 'Vehículo no encontrado o no autorizado' });
                return;
            }

            const fileStateManager = new FileStateManager();
            const stats = await fileStateManager.getProcessingStats(req.user.organizationId, vehicleId);

            // Obtener archivos recientes
            const recentFiles = await fileStateManager.getFilesByCriteria({
                organizationId: req.user.organizationId,
                vehicleId: vehicleId,
                limit: 20
            });

            res.status(200).json({
                success: true,
                data: {
                    vehicle: {
                        id: vehicle.id,
                        name: vehicle.name
                    },
                    statistics: stats,
                    recentFiles: recentFiles.map(file => ({
                        id: file.id,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        processingStatus: file.processingStatus,
                        decodedStatus: file.decodedStatus,
                        dataPointsCount: file.dataPointsCount,
                        lastProcessedAt: file.lastProcessedAt,
                        createdAt: file.createdAt,
                        fileSize: file.fileSize
                    }))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estado de archivos:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene archivos pendientes de procesamiento
     */
    async getPendingFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { vehicleId } = req.query;

            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const fileStateManager = new FileStateManager();
            const pendingFiles = await fileStateManager.getPendingFiles(
                req.user.organizationId,
                vehicleId as string
            );

            // Agrupar por tipo de archivo
            const filesByType = pendingFiles.reduce((acc, file) => {
                if (!acc[file.fileType]) {
                    acc[file.fileType] = [];
                }
                acc[file.fileType].push({
                    id: file.id,
                    fileName: file.fileName,
                    filePath: file.filePath,
                    fileSize: file.fileSize,
                    decodedStatus: file.decodedStatus,
                    createdAt: file.createdAt
                });
                return acc;
            }, {} as Record<string, any[]>);

            res.status(200).json({
                success: true,
                data: {
                    totalPendingFiles: pendingFiles.length,
                    filesByType,
                    pendingFiles: pendingFiles.map(file => ({
                        id: file.id,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        fileSize: file.fileSize,
                        decodedStatus: file.decodedStatus,
                        createdAt: file.createdAt
                    }))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo archivos pendientes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene archivos CAN que necesitan decodificación
     */
    async getCANFilesNeedingDecoding(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { vehicleId } = req.query;

            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const fileStateManager = new FileStateManager();
            const canFiles = await fileStateManager.getCANFilesNeedingDecoding(
                req.user.organizationId,
                vehicleId as string
            );

            res.status(200).json({
                success: true,
                data: {
                    totalCANFiles: canFiles.length,
                    canFiles: canFiles.map(file => ({
                        id: file.id,
                        fileName: file.fileName,
                        filePath: file.filePath,
                        fileSize: file.fileSize,
                        vehicleId: file.vehicleId,
                        createdAt: file.createdAt
                    }))
                }
            });

        } catch (error) {
            logger.error('Error obteniendo archivos CAN para decodificación:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Obtiene estadísticas generales de procesamiento inteligente
     */
    async getSmartProcessingStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            const fileStateManager = new FileStateManager();
            const stats = await fileStateManager.getProcessingStats(req.user.organizationId);

            // Obtener estadísticas por tipo de archivo
            const statsByType = await Promise.all([
                fileStateManager.getFilesByCriteria({
                    organizationId: req.user.organizationId,
                    fileType: 'CAN'
                }),
                fileStateManager.getFilesByCriteria({
                    organizationId: req.user.organizationId,
                    fileType: 'ESTABILIDAD'
                }),
                fileStateManager.getFilesByCriteria({
                    organizationId: req.user.organizationId,
                    fileType: 'GPS'
                }),
                fileStateManager.getFilesByCriteria({
                    organizationId: req.user.organizationId,
                    fileType: 'ROTATIVO'
                })
            ]);

            const [canFiles, stabilityFiles, gpsFiles, rotativoFiles] = statsByType;

            res.status(200).json({
                success: true,
                data: {
                    summary: stats,
                    breakdown: {
                        CAN: {
                            total: canFiles.length,
                            pending: canFiles.filter(f => f.processingStatus === 'PENDING').length,
                            completed: canFiles.filter(f => f.processingStatus === 'COMPLETED').length,
                            failed: canFiles.filter(f => f.processingStatus === 'FAILED').length,
                            needsDecoding: canFiles.filter(f => f.decodedStatus === 'NOT_DECODED').length
                        },
                        ESTABILIDAD: {
                            total: stabilityFiles.length,
                            pending: stabilityFiles.filter(f => f.processingStatus === 'PENDING').length,
                            completed: stabilityFiles.filter(f => f.processingStatus === 'COMPLETED').length,
                            failed: stabilityFiles.filter(f => f.processingStatus === 'FAILED').length
                        },
                        GPS: {
                            total: gpsFiles.length,
                            pending: gpsFiles.filter(f => f.processingStatus === 'PENDING').length,
                            completed: gpsFiles.filter(f => f.processingStatus === 'COMPLETED').length,
                            failed: gpsFiles.filter(f => f.processingStatus === 'FAILED').length
                        },
                        ROTATIVO: {
                            total: rotativoFiles.length,
                            pending: rotativoFiles.filter(f => f.processingStatus === 'PENDING').length,
                            completed: rotativoFiles.filter(f => f.processingStatus === 'COMPLETED').length,
                            failed: rotativoFiles.filter(f => f.processingStatus === 'FAILED').length
                        }
                    }
                }
            });

        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento inteligente:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Limpia archivos antiguos del sistema
     */
    async cleanOldFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user?.organizationId) {
                res.status(400).json({ error: 'Usuario no tiene organización asignada' });
                return;
            }

            // Solo administradores pueden limpiar archivos
            if (req.user.role !== 'ADMIN') {
                res.status(403).json({ error: 'Solo administradores pueden limpiar archivos antiguos' });
                return;
            }

            const fileStateManager = new FileStateManager();
            const deletedCount = await fileStateManager.cleanOldFiles();

            logger.info(`🧹 Limpieza de archivos antiguos completada: ${deletedCount} archivos eliminados`);

            res.status(200).json({
                success: true,
                message: 'Limpieza de archivos antiguos completada',
                data: {
                    deletedFiles: deletedCount
                }
            });

        } catch (error) {
            logger.error('Error limpiando archivos antiguos:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
