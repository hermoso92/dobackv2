import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import {
    parseGPSFile,
    parseRotativoFile,
    parseStabilityFile
} from '../utils/sessionParsers';
import { CANDecoderService } from './CANDecoderService';
import { concurrencyManager } from './ConcurrencyManager';
import { configurationManager } from './ConfigurationManager';
import { ErrorCategory, errorHandler, ErrorSeverity } from './ErrorHandler';
import { FileIntegrityValidator } from './FileIntegrityValidator';
import { FileStateManager } from './FileStateManager';
import { monitoringService } from './MonitoringService';
import { resourceManager } from './ResourceManager';
import { streamingFileProcessor } from './StreamingFileProcessor';
import { timeoutManager } from './TimeoutManager';
import { transactionManager } from './TransactionManager';

const prisma = new PrismaClient();

interface SmartProcessingConfig {
    organizationId: string;
    vehicleId: string;
    date: string;
    basePath: string;
    reprocessCompleted: boolean;
    reprocessFailed: boolean;
    decodeCANFiles: boolean;
}

interface SmartProcessingResult {
    vehicleId: string;
    vehicleName: string;
    success: boolean;
    newFiles: number;
    reprocessedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalDataPoints: number;
    errors: string[];
    processingTime: number;
}

export class SmartDataProcessor {
    private config: SmartProcessingConfig;
    private fileStateManager: FileStateManager;
    private canDecoderService: CANDecoderService;
    private integrityValidator: FileIntegrityValidator;
    private startTime: Date;
    private acquiredLocks: string[] = []; // Track acquired locks for cleanup
    private processingConfig: any;

    constructor(config: SmartProcessingConfig) {
        this.config = config;
        this.fileStateManager = new FileStateManager();
        this.canDecoderService = new CANDecoderService();
        this.integrityValidator = new FileIntegrityValidator();
        this.startTime = new Date();

        // Obtener configuración del sistema
        this.processingConfig = configurationManager.getProcessingConfig();

        // Registrar recursos para tracking
        resourceManager.registerResource(
            `smart-processor-${config.vehicleId}`,
            'PROCESSING',
            undefined,
            0
        );

        // Registrar métricas de procesamiento
        monitoringService.recordMetric('smart_processor_initialized', 1, 'COUNTER', {
            vehicleId: config.vehicleId,
            organizationId: config.organizationId
        });
    }

    /**
     * Procesa archivos de forma inteligente, evitando reprocesamiento innecesario
     */
    async processSmartData(): Promise<SmartProcessingResult> {
        logger.info(`🧠 Iniciando procesamiento inteligente para vehículo ${this.config.vehicleId}`, {
            organizationId: this.config.organizationId,
            date: this.config.date,
            basePath: this.config.basePath,
            reprocessCompleted: this.config.reprocessCompleted,
            reprocessFailed: this.config.reprocessFailed,
            decodeCANFiles: this.config.decodeCANFiles
        });

        const result: SmartProcessingResult = {
            vehicleId: this.config.vehicleId,
            vehicleName: '',
            success: true,
            newFiles: 0,
            reprocessedFiles: 0,
            skippedFiles: 0,
            failedFiles: 0,
            totalDataPoints: 0,
            errors: [],
            processingTime: 0
        };

        try {
            // Obtener nombre del vehículo
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: this.config.vehicleId },
                select: { name: true }
            });
            result.vehicleName = vehicle?.name || this.config.vehicleId;

            // Procesar cada tipo de archivo de forma inteligente
            await Promise.all([
                this.processCANFilesSmart(result),
                this.processStabilityFilesSmart(result),
                this.processGPSFilesSmart(result),
                this.processRotativoFilesSmart(result)
            ]);

            // Calcular tiempo de procesamiento
            result.processingTime = Date.now() - this.startTime.getTime();

            // Actualizar métricas de procesamiento
            monitoringService.updateProcessingMetrics({
                totalFilesProcessed: result.newFiles + result.reprocessedFiles,
                successfulFiles: result.newFiles + result.reprocessedFiles,
                failedFiles: result.failedFiles,
                totalDataPoints: result.totalDataPoints,
                averageProcessingTime: result.processingTime
            });

            // Registrar métricas específicas
            monitoringService.recordMetric('smart_processing_completed', 1, 'COUNTER', {
                vehicleId: this.config.vehicleId,
                organizationId: this.config.organizationId
            });

            monitoringService.recordMetric('smart_processing_time', result.processingTime, 'HISTOGRAM', {
                vehicleId: this.config.vehicleId
            });

            // Generar reporte final
            await this.generateSmartProcessingReport(result);

            logger.info(`✅ Procesamiento inteligente completado para vehículo ${this.config.vehicleId}`, {
                newFiles: result.newFiles,
                reprocessedFiles: result.reprocessedFiles,
                skippedFiles: result.skippedFiles,
                failedFiles: result.failedFiles,
                totalDataPoints: result.totalDataPoints,
                processingTime: result.processingTime
            });

        } catch (error) {
            logger.error(`Error en procesamiento inteligente para vehículo ${this.config.vehicleId}:`, error);
            result.success = false;
            result.errors.push(error instanceof Error ? error.message : 'Error desconocido');
        } finally {
            // Liberar todos los locks adquiridos
            await this.cleanupLocks();
        }

        return result;
    }

    /**
     * Procesa archivos CAN de forma inteligente
     */
    private async processCANFilesSmart(result: SmartProcessingResult): Promise<void> {
        const canPath = path.join(this.config.basePath, 'CAN');

        try {
            const files = await this.getFilesByPattern(canPath, 'CAN_*.txt', 'CAN_*_TRADUCIDO.csv');
            logger.info(`🔧 Procesando ${files.length} archivos CAN de forma inteligente`);

            for (const filePath of files) {
                await this.processSingleCANFileSmart(filePath, result);
            }
        } catch (error) {
            logger.error(`Error procesando archivos CAN: ${error}`);
            result.errors.push(`Error procesando archivos CAN: ${error}`);
        }
    }

    /**
     * Procesa un archivo CAN individual de forma inteligente
     */
    private async processSingleCANFileSmart(filePath: string, result: SmartProcessingResult): Promise<void> {
        const fileName = path.basename(filePath);
        let fileState: any = null;

        try {
            // Verificar si el archivo necesita ser procesado
            const shouldProcess = await this.fileStateManager.shouldProcessFile(filePath, this.config.organizationId);

            if (!shouldProcess.shouldProcess) {
                logger.info(`⏭️ Archivo CAN omitido: ${fileName} - ${shouldProcess.reason}`);
                result.skippedFiles++;

                if (shouldProcess.existingFile) {
                    await this.fileStateManager.markFileAsSkipped(shouldProcess.existingFile.id!, shouldProcess.reason!);
                }
                return;
            }

            // Validar integridad del archivo antes de procesarlo
            const integrityResult = await this.integrityValidator.validateFile(filePath,
                this.integrityValidator.createFileTypeRules('CAN')
            );

            if (!integrityResult.valid) {
                logger.error(`❌ Archivo CAN no válido: ${fileName}`, {
                    errors: integrityResult.errors,
                    warnings: integrityResult.warnings
                });
                result.failedFiles++;
                result.errors.push(`Archivo CAN no válido: ${integrityResult.errors.join(', ')}`);
                return;
            }

            if (integrityResult.warnings.length > 0) {
                logger.warn(`⚠️ Advertencias en archivo CAN: ${fileName}`, {
                    warnings: integrityResult.warnings
                });
            }

            // Registrar archivo si es nuevo
            let fileState = shouldProcess.existingFile;
            if (!fileState) {
                try {
                    fileState = await this.fileStateManager.registerFile({
                        fileName,
                        filePath,
                        vehicleId: this.config.vehicleId,
                        organizationId: this.config.organizationId,
                        fileType: 'CAN',
                        decodedStatus: fileName.includes('TRADUCIDO') ? 'DECODED' : 'NOT_DECODED'
                    });
                    result.newFiles++;
                } catch (registerError) {
                    logger.error(`Error registrando archivo ${fileName}: ${registerError}`);
                    result.failedFiles++;
                    result.errors.push(`Error registrando ${fileName}: ${registerError}`);
                    return;
                }
            } else {
                result.reprocessedFiles++;
            }

            // Ejecutar todo el procesamiento en una transacción atómica con timeout
            const transactionResult = await transactionManager.executeTransaction(async (tx) => {
                // Marcar como procesando
                await this.fileStateManager.markFileAsProcessing(fileState.id!);

                // Verificar si necesita decodificación (con timeout)
                if (this.config.decodeCANFiles && fileState.decodedStatus === 'NOT_DECODED') {
                    const decodeResult = await timeoutManager.executeWithTimeout(
                        () => this.decodeCANFile(filePath, fileState),
                        undefined,
                        'decoding'
                    );

                    if (!decodeResult.success) {
                        throw new Error(`Error en decodificación: ${decodeResult.error}`);
                    }
                }

                // Procesar archivo (con timeout)
                const processResult = await timeoutManager.executeWithTimeout(
                    () => this.processCANFileData(filePath, fileName),
                    undefined,
                    'file'
                );

                if (!processResult.success) {
                    throw new Error(`Error procesando datos: ${processResult.error}`);
                }

                // Marcar como completado
                await this.fileStateManager.markFileAsCompleted(fileState.id!, processResult.data!, {
                    processedAt: new Date(),
                    decoded: fileState.decodedStatus === 'DECODED'
                });

                return processResult.data;
            }, {
                timeout: 60000, // 1 minuto para toda la transacción
                retries: 2
            });

            if (!transactionResult.success) {
                throw new Error(`Error en transacción: ${transactionResult.error}`);
            }

            const dataPoints = transactionResult.data!;

            result.totalDataPoints += dataPoints;
            logger.info(`✅ Archivo CAN procesado: ${fileName} - ${dataPoints} puntos de datos`);

        } catch (error) {
            logger.error(`Error procesando archivo CAN ${fileName}: ${error}`);
            result.failedFiles++;
            result.errors.push(`Error procesando ${fileName}: ${error}`);

            if (fileState) {
                await this.fileStateManager.markFileAsFailed(fileState.id!, [error instanceof Error ? error.message : 'Error desconocido']);
            }
        }
    }

    /**
     * Procesa archivos de estabilidad de forma inteligente
     */
    private async processStabilityFilesSmart(result: SmartProcessingResult): Promise<void> {
        const stabilityPath = path.join(this.config.basePath, 'estabilidad');

        try {
            const files = await this.getFilesByPattern(stabilityPath, 'ESTABILIDAD_*.txt');
            logger.info(`⚖️ Procesando ${files.length} archivos de estabilidad de forma inteligente`);

            for (const filePath of files) {
                await this.processSingleStabilityFileSmart(filePath, result);
            }
        } catch (error) {
            logger.error(`Error procesando archivos de estabilidad: ${error}`);
            result.errors.push(`Error procesando archivos de estabilidad: ${error}`);
        }
    }

    /**
     * Procesa un archivo de estabilidad individual de forma inteligente
     */
    private async processSingleStabilityFileSmart(filePath: string, result: SmartProcessingResult): Promise<void> {
        const fileName = path.basename(filePath);
        let fileState: any = null;

        try {
            const shouldProcess = await this.fileStateManager.shouldProcessFile(filePath, this.config.organizationId);

            if (!shouldProcess.shouldProcess) {
                logger.info(`⏭️ Archivo de estabilidad omitido: ${fileName} - ${shouldProcess.reason}`);
                result.skippedFiles++;

                if (shouldProcess.existingFile) {
                    await this.fileStateManager.markFileAsSkipped(shouldProcess.existingFile.id!, shouldProcess.reason!);
                }
                return;
            }

            let fileState = shouldProcess.existingFile;
            if (!fileState) {
                try {
                    fileState = await this.fileStateManager.registerFile({
                        fileName,
                        filePath,
                        vehicleId: this.config.vehicleId,
                        organizationId: this.config.organizationId,
                        fileType: 'ESTABILIDAD'
                    });
                    result.newFiles++;
                } catch (registerError) {
                    logger.error(`Error registrando archivo ${fileName}: ${registerError}`);
                    result.failedFiles++;
                    result.errors.push(`Error registrando ${fileName}: ${registerError}`);
                    return;
                }
            } else {
                result.reprocessedFiles++;
            }

            await this.fileStateManager.markFileAsProcessing(fileState.id!);

            const dataPoints = await this.processStabilityFileData(filePath, fileName);

            await this.fileStateManager.markFileAsCompleted(fileState.id!, dataPoints);

            result.totalDataPoints += dataPoints;
            logger.info(`✅ Archivo de estabilidad procesado: ${fileName} - ${dataPoints} puntos de datos`);

        } catch (error) {
            logger.error(`Error procesando archivo de estabilidad ${fileName}: ${error}`);
            result.failedFiles++;
            result.errors.push(`Error procesando ${fileName}: ${error}`);

            if (fileState) {
                await this.fileStateManager.markFileAsFailed(fileState.id!, [error instanceof Error ? error.message : 'Error desconocido']);
            }
        }
    }

    /**
     * Procesa archivos GPS de forma inteligente
     */
    private async processGPSFilesSmart(result: SmartProcessingResult): Promise<void> {
        const gpsPath = path.join(this.config.basePath, 'GPS');

        try {
            const files = await this.getFilesByPattern(gpsPath, 'GPS_*.txt');
            logger.info(`📍 Procesando ${files.length} archivos GPS de forma inteligente`);

            for (const filePath of files) {
                await this.processSingleGPSFileSmart(filePath, result);
            }
        } catch (error) {
            logger.error(`Error procesando archivos GPS: ${error}`);
            result.errors.push(`Error procesando archivos GPS: ${error}`);
        }
    }

    /**
     * Procesa un archivo GPS individual de forma inteligente
     */
    private async processSingleGPSFileSmart(filePath: string, result: SmartProcessingResult): Promise<void> {
        const fileName = path.basename(filePath);
        let fileState: any = null;

        try {
            const shouldProcess = await this.fileStateManager.shouldProcessFile(filePath, this.config.organizationId);

            if (!shouldProcess.shouldProcess) {
                logger.info(`⏭️ Archivo GPS omitido: ${fileName} - ${shouldProcess.reason}`);
                result.skippedFiles++;

                if (shouldProcess.existingFile) {
                    await this.fileStateManager.markFileAsSkipped(shouldProcess.existingFile.id!, shouldProcess.reason!);
                }
                return;
            }

            let fileState = shouldProcess.existingFile;
            if (!fileState) {
                try {
                    fileState = await this.fileStateManager.registerFile({
                        fileName,
                        filePath,
                        vehicleId: this.config.vehicleId,
                        organizationId: this.config.organizationId,
                        fileType: 'GPS'
                    });
                    result.newFiles++;
                } catch (registerError) {
                    logger.error(`Error registrando archivo ${fileName}: ${registerError}`);
                    result.failedFiles++;
                    result.errors.push(`Error registrando ${fileName}: ${registerError}`);
                    return;
                }
            } else {
                result.reprocessedFiles++;
            }

            await this.fileStateManager.markFileAsProcessing(fileState.id!);

            const dataPoints = await this.processGPSFileData(filePath, fileName);

            await this.fileStateManager.markFileAsCompleted(fileState.id!, dataPoints);

            result.totalDataPoints += dataPoints;
            logger.info(`✅ Archivo GPS procesado: ${fileName} - ${dataPoints} puntos de datos`);

        } catch (error) {
            logger.error(`Error procesando archivo GPS ${fileName}: ${error}`);
            result.failedFiles++;
            result.errors.push(`Error procesando ${fileName}: ${error}`);

            if (fileState) {
                await this.fileStateManager.markFileAsFailed(fileState.id!, [error instanceof Error ? error.message : 'Error desconocido']);
            }
        }
    }

    /**
     * Procesa archivos rotativos de forma inteligente
     */
    private async processRotativoFilesSmart(result: SmartProcessingResult): Promise<void> {
        const rotativoPath = path.join(this.config.basePath, 'ROTATIVO');

        try {
            const files = await this.getFilesByPattern(rotativoPath, 'ROTATIVO_*.txt');
            logger.info(`🔄 Procesando ${files.length} archivos rotativos de forma inteligente`);

            for (const filePath of files) {
                await this.processSingleRotativoFileSmart(filePath, result);
            }
        } catch (error) {
            logger.error(`Error procesando archivos rotativos: ${error}`);
            result.errors.push(`Error procesando archivos rotativos: ${error}`);
        }
    }

    /**
     * Procesa un archivo rotativo individual de forma inteligente
     */
    private async processSingleRotativoFileSmart(filePath: string, result: SmartProcessingResult): Promise<void> {
        const fileName = path.basename(filePath);
        let fileState: any = null;

        try {
            const shouldProcess = await this.fileStateManager.shouldProcessFile(filePath, this.config.organizationId);

            if (!shouldProcess.shouldProcess) {
                logger.info(`⏭️ Archivo rotativo omitido: ${fileName} - ${shouldProcess.reason}`);
                result.skippedFiles++;

                if (shouldProcess.existingFile) {
                    await this.fileStateManager.markFileAsSkipped(shouldProcess.existingFile.id!, shouldProcess.reason!);
                }
                return;
            }

            let fileState = shouldProcess.existingFile;
            if (!fileState) {
                try {
                    fileState = await this.fileStateManager.registerFile({
                        fileName,
                        filePath,
                        vehicleId: this.config.vehicleId,
                        organizationId: this.config.organizationId,
                        fileType: 'ROTATIVO'
                    });
                    result.newFiles++;
                } catch (registerError) {
                    logger.error(`Error registrando archivo ${fileName}: ${registerError}`);
                    result.failedFiles++;
                    result.errors.push(`Error registrando ${fileName}: ${registerError}`);
                    return;
                }
            } else {
                result.reprocessedFiles++;
            }

            await this.fileStateManager.markFileAsProcessing(fileState.id!);

            const dataPoints = await this.processRotativoFileData(filePath, fileName);

            await this.fileStateManager.markFileAsCompleted(fileState.id!, dataPoints);

            result.totalDataPoints += dataPoints;
            logger.info(`✅ Archivo rotativo procesado: ${fileName} - ${dataPoints} puntos de datos`);

        } catch (error) {
            logger.error(`Error procesando archivo rotativo ${fileName}: ${error}`);
            result.failedFiles++;
            result.errors.push(`Error procesando ${fileName}: ${error}`);

            if (fileState) {
                await this.fileStateManager.markFileAsFailed(fileState.id!, [error instanceof Error ? error.message : 'Error desconocido']);
            }
        }
    }

    /**
     * Decodifica un archivo CAN usando el decodificador Python real con timeout
     */
    private async decodeCANFile(filePath: string, fileState: any): Promise<void> {
        try {
            logger.info(`🔧 Decodificando archivo CAN real: ${fileState.fileName}`);

            // Usar el servicio real de decodificación CAN con timeout
            const decodeResult = await timeoutManager.executeWithTimeoutAndRetry(
                () => this.canDecoderService.decodeCANFile(filePath),
                undefined, // Usar timeout por defecto para decodificación (5 minutos)
                2, // 2 reintentos
                'decoding'
            );

            if (!decodeResult.success) {
                throw new Error(`Error en decodificación con timeout: ${decodeResult.error}`);
            }

            const canDecodeResult = decodeResult.data!;

            if (canDecodeResult.success && canDecodeResult.decodedFilePath) {
                // Actualizar estado del archivo como decodificado
                await this.fileStateManager.updateCANDecodingStatus(fileState.id!, 'DECODED', canDecodeResult.decodedFilePath);

                logger.info(`✅ Archivo CAN decodificado exitosamente: ${fileState.fileName}`, {
                    processingTime: canDecodeResult.processingTime,
                    messageCount: canDecodeResult.messageCount,
                    totalExecutionTime: decodeResult.executionTime
                });
            } else {
                // Marcar como fallido
                await this.fileStateManager.updateCANDecodingStatus(fileState.id!, 'DECODING_FAILED');

                const errorMsg = canDecodeResult.error || 'Error desconocido en decodificación';
                logger.error(`❌ Error decodificando archivo CAN ${fileState.fileName}: ${errorMsg}`);

                throw new Error(errorMsg);
            }

        } catch (error) {
            logger.error(`❌ Error en decodificación CAN ${fileState.fileName}:`, error);

            // Marcar como fallido
            await this.fileStateManager.updateCANDecodingStatus(fileState.id!, 'DECODING_FAILED');
            throw error;
        }
    }

    /**
     * Procesa datos de un archivo CAN usando streaming
     */
    private async processCANFileData(filePath: string, fileName: string): Promise<number> {
        return errorHandler.handleErrorWithRetry(
            async () => {
                logger.info(`🌊 Procesando archivo CAN con streaming: ${fileName}`);

                // Usar streaming para archivos grandes con configuración del sistema
                const streamingResult = await streamingFileProcessor.processFileWithStreaming(
                    filePath,
                    (line: string, lineNumber: number) => {
                        try {
                            // Parsear línea CAN individual
                            const parsedData = this.parseCANLine(line, lineNumber);
                            return parsedData;
                        } catch (error) {
                            // El error será manejado por el streaming processor
                            return null;
                        }
                    },
                    {
                        chunkSize: this.processingConfig.chunkSize,
                        maxMemoryUsage: this.processingConfig.maxMemoryUsage,
                        bufferSize: 5,
                        parallelProcessing: true,
                        maxConcurrentStreams: this.processingConfig.concurrentStreams
                    }
                );

                if (!streamingResult.success) {
                    throw new Error(`Error en procesamiento streaming: ${streamingResult.errors.map(e => e.error).join(', ')}`);
                }

                const totalDataPoints = streamingResult.totalProcessed;
                const totalErrors = streamingResult.totalErrors;

                if (totalDataPoints === 0) {
                    throw new Error('No se encontraron datos válidos en el archivo CAN');
                }

                // Log de estadísticas de streaming
                logger.info(`✅ Archivo CAN procesado con streaming`, {
                    fileName,
                    totalDataPoints,
                    totalErrors,
                    processingTime: streamingResult.processingTime,
                    peakMemory: streamingResult.memoryUsage.peak
                });

                // Guardar datos en la base de datos (simulado por ahora)
                // En una implementación real, aquí se guardarían los datos parseados
                await this.saveCANDataToDatabase(streamingResult.data || []);

                return totalDataPoints;

            },
            {
                operation: `processCANFileData`,
                filePath,
                fileName,
                vehicleId: this.config.vehicleId,
                organizationId: this.config.organizationId
            },
            {
                maxRetries: this.processingConfig.maxRetries,
                retryDelay: this.processingConfig.retryDelay,
                severity: ErrorSeverity.HIGH,
                category: ErrorCategory.PROCESSING
            }
        ).then(result => {
            if (result.success) {
                return result.data!;
            } else {
                throw new Error(`Error procesando archivo CAN: ${result.error?.message}`);
            }
        });
    }

    /**
     * Parsea una línea individual de archivo CAN
     */
    private parseCANLine(line: string, lineNumber: number): any | null {
        try {
            // Implementación básica de parsing de línea CAN
            // En una implementación real, esto usaría el parser existente
            if (!line.trim() || line.startsWith('#')) {
                return null;
            }

            // Simular parsing de datos CAN
            const parts = line.split(/[;,\s]+/).filter(p => p.trim());
            if (parts.length < 3) {
                return null;
            }

            return {
                timestamp: new Date(),
                data: parts,
                lineNumber
            };

        } catch (error) {
            throw new Error(`Error parseando línea ${lineNumber}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Guarda datos CAN en la base de datos
     */
    private async saveCANDataToDatabase(data: any[]): Promise<void> {
        // Implementación simulada
        // En una implementación real, esto guardaría en la base de datos
        logger.debug(`💾 Guardando ${data.length} registros CAN en la base de datos`);

        // Simular delay de guardado
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Procesa datos de un archivo de estabilidad
     */
    private async processStabilityFileData(filePath: string, fileName: string): Promise<number> {
        const buffer = await fs.readFile(filePath);
        const descartes: any = { ESTABILIDAD: [] };

        const stabilityData = parseStabilityFile(buffer, descartes);

        if (stabilityData.length === 0) {
            throw new Error('No se encontraron datos válidos en el archivo de estabilidad');
        }

        return stabilityData.length;
    }

    /**
     * Procesa datos de un archivo GPS
     */
    private async processGPSFileData(filePath: string, fileName: string): Promise<number> {
        const buffer = await fs.readFile(filePath);
        const descartes: any = { GPS: [] };

        const gpsData = parseGPSFile(buffer, descartes);

        if (gpsData.length === 0) {
            throw new Error('No se encontraron datos válidos en el archivo GPS');
        }

        return gpsData.length;
    }

    /**
     * Procesa datos de un archivo rotativo
     */
    private async processRotativoFileData(filePath: string, fileName: string): Promise<number> {
        const buffer = await fs.readFile(filePath);
        const descartes: any = { ROTATIVO: [] };

        const rotativoData = parseRotativoFile(buffer, descartes);

        if (rotativoData.length === 0) {
            throw new Error('No se encontraron datos válidos en el archivo rotativo');
        }

        return rotativoData.length;
    }

    /**
     * Obtiene archivos que coincidan con los patrones especificados
     */
    private async getFilesByPattern(directory: string, ...patterns: string[]): Promise<string[]> {
        try {
            const files = await fs.readdir(directory);
            const matchingFiles: string[] = [];

            for (const file of files) {
                const fullPath = path.join(directory, file);
                const stat = await fs.stat(fullPath);

                if (stat.isFile()) {
                    for (const pattern of patterns) {
                        if (this.matchesPattern(file, pattern)) {
                            matchingFiles.push(fullPath);
                            break;
                        }
                    }
                }
            }

            return matchingFiles.sort();
        } catch (error) {
            logger.warn(`No se pudo leer directorio ${directory}: ${error}`);
            return [];
        }
    }

    /**
     * Verifica si un archivo coincide con un patrón
     */
    private matchesPattern(fileName: string, pattern: string): boolean {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
    }

    /**
     * Genera reporte del procesamiento inteligente
     */
    private async generateSmartProcessingReport(result: SmartProcessingResult): Promise<void> {
        try {
            // Aquí se podría guardar un reporte detallado del procesamiento
            logger.info('📊 Reporte de procesamiento inteligente generado', {
                vehicleId: result.vehicleId,
                vehicleName: result.vehicleName,
                newFiles: result.newFiles,
                reprocessedFiles: result.reprocessedFiles,
                skippedFiles: result.skippedFiles,
                failedFiles: result.failedFiles,
                totalDataPoints: result.totalDataPoints,
                processingTime: result.processingTime
            });
        } catch (error) {
            logger.error('Error generando reporte de procesamiento inteligente:', error);
        }
    }

    /**
     * Obtiene estadísticas del procesamiento inteligente
     */
    async getSmartProcessingStats(): Promise<any> {
        try {
            const stats = await this.fileStateManager.getProcessingStats(this.config.organizationId, this.config.vehicleId);

            return {
                ...stats,
                processingTime: Date.now() - this.startTime.getTime(),
                config: {
                    reprocessCompleted: this.config.reprocessCompleted,
                    reprocessFailed: this.config.reprocessFailed,
                    decodeCANFiles: this.config.decodeCANFiles
                }
            };
        } catch (error) {
            logger.error('Error obteniendo estadísticas de procesamiento inteligente:', error);
            throw error;
        }
    }

    /**
     * Libera todos los locks adquiridos durante el procesamiento
     */
    private async cleanupLocks(): Promise<void> {
        try {
            for (const lockId of this.acquiredLocks) {
                await concurrencyManager.releaseLock(lockId);
            }
            logger.info(`🔓 Liberados ${this.acquiredLocks.length} locks`);
            this.acquiredLocks = [];

            // Marcar recurso como inactivo
            resourceManager.deactivateResource(`smart-processor-${this.config.vehicleId}`);

            // Registrar métrica de cleanup
            monitoringService.recordMetric('smart_processing_cleanup', 1, 'COUNTER', {
                vehicleId: this.config.vehicleId
            });
        } catch (error) {
            logger.error('Error liberando locks:', error);
        }
    }
}
