import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface FileState {
    id?: string;
    fileName: string;
    filePath: string;
    fileHash: string;
    fileSize: number;
    vehicleId: string;
    organizationId: string;
    fileType: 'CAN' | 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
    decodedStatus?: 'NOT_DECODED' | 'DECODED' | 'DECODING_FAILED';
    dataPointsCount?: number;
    lastProcessedAt?: Date;
    processingErrors?: string[];
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

interface ProcessingStats {
    totalFiles: number;
    pendingFiles: number;
    processingFiles: number;
    completedFiles: number;
    failedFiles: number;
    skippedFiles: number;
    totalDataPoints: number;
}

export class FileStateManager {
    /**
     * Registra o actualiza el estado de un archivo
     */
    async registerFile(fileInfo: {
        fileName: string;
        filePath: string;
        vehicleId: string;
        organizationId: string;
        fileType: 'CAN' | 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
        decodedStatus?: 'NOT_DECODED' | 'DECODED' | 'DECODING_FAILED';
    }): Promise<FileState> {
        try {
            // Calcular hash del archivo
            const fileHash = await this.calculateFileHash(fileInfo.filePath);
            const fileStats = await fs.stat(fileInfo.filePath);

            // Verificar si el archivo ya existe
            const existingFile = await this.findFileByHash(fileHash, fileInfo.organizationId);

            if (existingFile) {
                // Actualizar archivo existente
                const updatedFile = await prisma.fileState.update({
                    where: { id: existingFile.id },
                    data: {
                        fileName: fileInfo.fileName,
                        filePath: fileInfo.filePath,
                        fileSize: fileStats.size,
                        decodedStatus: fileInfo.decodedStatus,
                        updatedAt: new Date()
                    }
                });

                logger.info(`📁 Archivo actualizado: ${fileInfo.fileName}`, {
                    fileHash: fileHash.substring(0, 8) + '...',
                    status: updatedFile.processingStatus
                });

                return updatedFile;
            } else {
                // Crear nuevo registro
                const newFile = await prisma.fileState.create({
                    data: {
                        fileName: fileInfo.fileName,
                        filePath: fileInfo.filePath,
                        fileHash: fileHash,
                        fileSize: fileStats.size,
                        vehicleId: fileInfo.vehicleId,
                        organizationId: fileInfo.organizationId,
                        fileType: fileInfo.fileType,
                        processingStatus: 'PENDING',
                        decodedStatus: fileInfo.decodedStatus || 'NOT_DECODED',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });

                logger.info(`📁 Archivo registrado: ${fileInfo.fileName}`, {
                    fileHash: fileHash.substring(0, 8) + '...',
                    type: fileInfo.fileType
                });

                return newFile;
            }
        } catch (error) {
            logger.error(`Error registrando archivo ${fileInfo.fileName}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene archivos pendientes de procesamiento
     */
    async getPendingFiles(organizationId: string, vehicleId?: string): Promise<FileState[]> {
        try {
            const whereClause: any = {
                organizationId: organizationId,
                processingStatus: 'PENDING'
            };

            if (vehicleId) {
                whereClause.vehicleId = vehicleId;
            }

            const pendingFiles = await prisma.fileState.findMany({
                where: whereClause,
                orderBy: [
                    { fileType: 'asc' },
                    { fileName: 'asc' }
                ]
            });

            logger.info(`📋 Archivos pendientes encontrados: ${pendingFiles.length}`, {
                organizationId,
                vehicleId,
                byType: pendingFiles.reduce((acc, file) => {
                    acc[file.fileType] = (acc[file.fileType] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            });

            return pendingFiles;
        } catch (error) {
            logger.error('Error obteniendo archivos pendientes:', error);
            throw error;
        }
    }

    /**
     * Obtiene archivos CAN que necesitan decodificación
     */
    async getCANFilesNeedingDecoding(organizationId: string, vehicleId?: string): Promise<FileState[]> {
        try {
            const whereClause: any = {
                organizationId: organizationId,
                fileType: 'CAN',
                decodedStatus: 'NOT_DECODED',
                processingStatus: { not: 'FAILED' }
            };

            if (vehicleId) {
                whereClause.vehicleId = vehicleId;
            }

            const canFiles = await prisma.fileState.findMany({
                where: whereClause,
                orderBy: { fileName: 'asc' }
            });

            logger.info(`🔧 Archivos CAN que necesitan decodificación: ${canFiles.length}`, {
                organizationId,
                vehicleId
            });

            return canFiles;
        } catch (error) {
            logger.error('Error obteniendo archivos CAN para decodificación:', error);
            throw error;
        }
    }

    /**
     * Marca un archivo como en procesamiento
     */
    async markFileAsProcessing(fileId: string): Promise<void> {
        try {
            await prisma.fileState.update({
                where: { id: fileId },
                data: {
                    processingStatus: 'PROCESSING',
                    updatedAt: new Date()
                }
            });

            logger.debug(`🔄 Archivo marcado como procesando: ${fileId}`);
        } catch (error) {
            logger.error(`Error marcando archivo como procesando ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Marca un archivo como completado
     */
    async markFileAsCompleted(fileId: string, dataPointsCount: number, metadata?: any): Promise<void> {
        try {
            await prisma.fileState.update({
                where: { id: fileId },
                data: {
                    processingStatus: 'COMPLETED',
                    dataPointsCount: dataPointsCount,
                    lastProcessedAt: new Date(),
                    metadata: metadata,
                    updatedAt: new Date()
                }
            });

            logger.info(`✅ Archivo marcado como completado: ${fileId}`, {
                dataPoints: dataPointsCount
            });
        } catch (error) {
            logger.error(`Error marcando archivo como completado ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Marca un archivo como fallido
     */
    async markFileAsFailed(fileId: string, errors: string[]): Promise<void> {
        try {
            await prisma.fileState.update({
                where: { id: fileId },
                data: {
                    processingStatus: 'FAILED',
                    processingErrors: errors,
                    updatedAt: new Date()
                }
            });

            logger.warn(`❌ Archivo marcado como fallido: ${fileId}`, {
                errors: errors
            });
        } catch (error) {
            logger.error(`Error marcando archivo como fallido ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Marca un archivo como omitido (ya procesado)
     */
    async markFileAsSkipped(fileId: string, reason: string): Promise<void> {
        try {
            await prisma.fileState.update({
                where: { id: fileId },
                data: {
                    processingStatus: 'SKIPPED',
                    processingErrors: [reason],
                    updatedAt: new Date()
                }
            });

            logger.info(`⏭️ Archivo omitido: ${fileId}`, {
                reason: reason
            });
        } catch (error) {
            logger.error(`Error marcando archivo como omitido ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de decodificación de un archivo CAN
     */
    async updateCANDecodingStatus(fileId: string, status: 'DECODED' | 'DECODING_FAILED', decodedFilePath?: string): Promise<void> {
        try {
            const updateData: any = {
                decodedStatus: status,
                updatedAt: new Date()
            };

            if (decodedFilePath && status === 'DECODED') {
                updateData.metadata = {
                    decodedFilePath: decodedFilePath,
                    decodedAt: new Date()
                };
            }

            await prisma.fileState.update({
                where: { id: fileId },
                data: updateData
            });

            logger.info(`🔧 Estado de decodificación actualizado: ${fileId}`, {
                status: status
            });
        } catch (error) {
            logger.error(`Error actualizando estado de decodificación ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de procesamiento
     */
    async getProcessingStats(organizationId: string, vehicleId?: string): Promise<ProcessingStats> {
        try {
            const whereClause: any = {
                organizationId: organizationId
            };

            if (vehicleId) {
                whereClause.vehicleId = vehicleId;
            }

            const [totalFiles, pendingFiles, processingFiles, completedFiles, failedFiles, skippedFiles, totalDataPoints] = await prisma.$transaction([
                prisma.fileState.count({ where: whereClause }),
                prisma.fileState.count({ where: { ...whereClause, processingStatus: 'PENDING' } }),
                prisma.fileState.count({ where: { ...whereClause, processingStatus: 'PROCESSING' } }),
                prisma.fileState.count({ where: { ...whereClause, processingStatus: 'COMPLETED' } }),
                prisma.fileState.count({ where: { ...whereClause, processingStatus: 'FAILED' } }),
                prisma.fileState.count({ where: { ...whereClause, processingStatus: 'SKIPPED' } }),
                prisma.fileState.aggregate({
                    where: { ...whereClause, processingStatus: 'COMPLETED' },
                    _sum: { dataPointsCount: true }
                })
            ]);

            return {
                totalFiles,
                pendingFiles,
                processingFiles,
                completedFiles,
                failedFiles,
                skippedFiles,
                totalDataPoints: totalDataPoints._sum.dataPointsCount || 0
            };
        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento:', error);
            throw error;
        }
    }

    /**
     * Limpia archivos antiguos (más de 90 días)
     */
    async cleanOldFiles(): Promise<number> {
        try {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const deletedFiles = await prisma.fileState.deleteMany({
                where: {
                    createdAt: {
                        lt: ninetyDaysAgo
                    },
                    processingStatus: {
                        in: ['COMPLETED', 'SKIPPED', 'FAILED']
                    }
                }
            });

            logger.info(`🧹 Archivos antiguos limpiados: ${deletedFiles.count}`, {
                olderThan: ninetyDaysAgo.toISOString()
            });

            return deletedFiles.count;
        } catch (error) {
            logger.error('Error limpiando archivos antiguos:', error);
            throw error;
        }
    }

    /**
     * Verifica si un archivo necesita ser procesado
     */
    async shouldProcessFile(filePath: string, organizationId: string): Promise<{
        shouldProcess: boolean;
        reason?: string;
        existingFile?: FileState;
    }> {
        try {
            // Verificar si el archivo existe físicamente
            try {
                await fs.access(filePath);
            } catch {
                return {
                    shouldProcess: false,
                    reason: 'Archivo no existe físicamente'
                };
            }

            // Calcular hash del archivo
            const fileHash = await this.calculateFileHash(filePath);

            // Buscar archivo existente
            const existingFile = await this.findFileByHash(fileHash, organizationId);

            if (!existingFile) {
                return {
                    shouldProcess: true,
                    reason: 'Archivo nuevo, no registrado anteriormente'
                };
            }

            // Verificar estado del archivo
            switch (existingFile.processingStatus) {
                case 'COMPLETED':
                    return {
                        shouldProcess: false,
                        reason: 'Archivo ya procesado exitosamente',
                        existingFile
                    };
                case 'PROCESSING':
                    return {
                        shouldProcess: false,
                        reason: 'Archivo actualmente en procesamiento',
                        existingFile
                    };
                case 'FAILED':
                    return {
                        shouldProcess: true,
                        reason: 'Archivo falló anteriormente, reintentando',
                        existingFile
                    };
                case 'PENDING':
                    return {
                        shouldProcess: true,
                        reason: 'Archivo pendiente de procesamiento',
                        existingFile
                    };
                case 'SKIPPED':
                    return {
                        shouldProcess: false,
                        reason: 'Archivo omitido por configuración',
                        existingFile
                    };
                default:
                    return {
                        shouldProcess: true,
                        reason: 'Estado desconocido, procesando',
                        existingFile
                    };
            }
        } catch (error) {
            logger.error(`Error verificando si archivo debe procesarse ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Calcula el hash SHA256 de un archivo
     */
    private async calculateFileHash(filePath: string): Promise<string> {
        try {
            const fileBuffer = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(fileBuffer).digest('hex');
        } catch (error) {
            logger.error(`Error calculando hash del archivo ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Busca un archivo por su hash
     */
    private async findFileByHash(fileHash: string, organizationId: string): Promise<FileState | null> {
        try {
            const file = await prisma.fileState.findFirst({
                where: {
                    fileHash: fileHash,
                    organizationId: organizationId
                }
            });

            return file;
        } catch (error) {
            logger.error(`Error buscando archivo por hash ${fileHash}:`, error);
            throw error;
        }
    }

    /**
     * Obtiene archivos por criterios específicos
     */
    async getFilesByCriteria(criteria: {
        organizationId: string;
        vehicleId?: string;
        fileType?: 'CAN' | 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
        processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
        decodedStatus?: 'NOT_DECODED' | 'DECODED' | 'DECODING_FAILED';
        limit?: number;
    }): Promise<FileState[]> {
        try {
            const whereClause: any = {
                organizationId: criteria.organizationId
            };

            if (criteria.vehicleId) whereClause.vehicleId = criteria.vehicleId;
            if (criteria.fileType) whereClause.fileType = criteria.fileType;
            if (criteria.processingStatus) whereClause.processingStatus = criteria.processingStatus;
            if (criteria.decodedStatus) whereClause.decodedStatus = criteria.decodedStatus;

            const files = await prisma.fileState.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take: criteria.limit || 100
            });

            return files;
        } catch (error) {
            logger.error('Error obteniendo archivos por criterios:', error);
            throw error;
        }
    }
}
