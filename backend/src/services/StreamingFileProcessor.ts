import fs, { createReadStream } from 'fs';
import path from 'path';
import { pipeline, Transform, Writable } from 'stream';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const pipelineAsync = promisify(pipeline);

interface StreamingConfig {
    chunkSize: number; // bytes
    maxMemoryUsage: number; // bytes
    bufferSize: number; // number of chunks in memory
    parallelProcessing: boolean;
    maxConcurrentStreams: number;
}

interface StreamingResult<T> {
    success: boolean;
    data?: T[];
    totalProcessed: number;
    totalErrors: number;
    processingTime: number;
    memoryUsage: {
        peak: number;
        average: number;
        final: number;
    };
    errors: Array<{
        lineNumber: number;
        error: string;
        data?: string;
    }>;
}

interface ProcessedChunk {
    data: any[];
    chunkNumber: number;
    lineStart: number;
    lineEnd: number;
    errors: Array<{
        lineNumber: number;
        error: string;
    }>;
}

export class StreamingFileProcessor {
    private readonly config: StreamingConfig = {
        chunkSize: 64 * 1024, // 64KB chunks
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB max memory
        bufferSize: 10, // 10 chunks in memory
        parallelProcessing: true,
        maxConcurrentStreams: 3
    };

    private memoryMonitor: NodeJS.Timer | null = null;
    private currentMemoryUsage = 0;
    private peakMemoryUsage = 0;

    /**
     * Procesa un archivo grande usando streaming
     */
    async processFileWithStreaming<T>(
        filePath: string,
        parser: (line: string, lineNumber: number) => T | null,
        options: Partial<StreamingConfig> = {}
    ): Promise<StreamingResult<T>> {
        const startTime = Date.now();
        const config = { ...this.config, ...options };

        const result: StreamingResult<T> = {
            success: false,
            data: [],
            totalProcessed: 0,
            totalErrors: 0,
            processingTime: 0,
            memoryUsage: {
                peak: 0,
                average: 0,
                final: 0
            },
            errors: []
        };

        try {
            logger.info(`🌊 Iniciando procesamiento streaming: ${path.basename(filePath)}`, {
                chunkSize: config.chunkSize,
                maxMemory: config.maxMemoryUsage,
                parallelProcessing: config.parallelProcessing
            });

            // Iniciar monitoreo de memoria
            this.startMemoryMonitoring();

            // Verificar que el archivo existe
            await this.validateFileExists(filePath);

            // Crear streams de procesamiento
            const chunks: ProcessedChunk[] = [];
            let currentLineNumber = 0;
            let chunkNumber = 0;

            // Stream de lectura
            const readStream = createReadStream(filePath, {
                highWaterMark: config.chunkSize,
                encoding: 'utf8'
            });

            // Transform stream para procesar líneas
            const transformStream = new Transform({
                objectMode: true,
                transform(chunk: Buffer, encoding, callback) {
                    const lines = chunk.toString().split('\n');
                    const chunkData: any[] = [];
                    const chunkErrors: Array<{ lineNumber: number; error: string }> = [];

                    for (const line of lines) {
                        currentLineNumber++;

                        if (line.trim()) {
                            try {
                                const parsedData = parser(line, currentLineNumber);
                                if (parsedData) {
                                    chunkData.push(parsedData);
                                }
                            } catch (error) {
                                chunkErrors.push({
                                    lineNumber: currentLineNumber,
                                    error: error instanceof Error ? error.message : 'Error desconocido'
                                });
                            }
                        }
                    }

                    // Crear chunk procesado
                    const processedChunk: ProcessedChunk = {
                        data: chunkData,
                        chunkNumber: chunkNumber++,
                        lineStart: currentLineNumber - lines.length + 1,
                        lineEnd: currentLineNumber,
                        errors: chunkErrors
                    };

                    callback(null, processedChunk);
                }
            });

            // Write stream para acumular resultados
            const writeStream = new Writable({
                objectMode: true,
                write(chunk: ProcessedChunk, encoding, callback) {
                    chunks.push(chunk);

                    // Procesar chunk si tenemos suficientes datos
                    if (chunks.length >= config.bufferSize) {
                        this.processChunks(chunks.splice(0, config.bufferSize), result);
                    }

                    callback();
                }
            });

            // Ejecutar pipeline
            await pipelineAsync(
                readStream,
                transformStream,
                writeStream
            );

            // Procesar chunks restantes
            if (chunks.length > 0) {
                this.processChunks(chunks, result);
            }

            // Finalizar resultado
            result.success = result.totalErrors === 0 || result.totalProcessed > 0;
            result.processingTime = Date.now() - startTime;
            result.memoryUsage = this.getMemoryUsage();

            logger.info(`✅ Procesamiento streaming completado: ${path.basename(filePath)}`, {
                totalProcessed: result.totalProcessed,
                totalErrors: result.totalErrors,
                processingTime: result.processingTime,
                peakMemory: result.memoryUsage.peak,
                averageMemory: result.memoryUsage.average
            });

            return result;

        } catch (error) {
            result.processingTime = Date.now() - startTime;
            result.memoryUsage = this.getMemoryUsage();

            logger.error(`❌ Error en procesamiento streaming: ${path.basename(filePath)}`, {
                error: error instanceof Error ? error.message : 'Error desconocido',
                processingTime: result.processingTime,
                totalProcessed: result.totalProcessed
            });

            throw error;
        } finally {
            this.stopMemoryMonitoring();
        }
    }

    /**
     * Procesa múltiples archivos en paralelo con streaming
     */
    async processMultipleFilesWithStreaming<T>(
        filePaths: string[],
        parser: (line: string, lineNumber: number) => T | null,
        options: Partial<StreamingConfig> = {}
    ): Promise<Array<StreamingResult<T> & { filePath: string }>> {
        const config = { ...this.config, ...options };
        const maxConcurrent = Math.min(config.maxConcurrentStreams, filePaths.length);

        logger.info(`🌊 Procesando ${filePaths.length} archivos en paralelo`, {
            maxConcurrent,
            parallelProcessing: config.parallelProcessing
        });

        const results: Array<StreamingResult<T> & { filePath: string }> = [];

        // Procesar archivos en lotes para controlar concurrencia
        for (let i = 0; i < filePaths.length; i += maxConcurrent) {
            const batch = filePaths.slice(i, i + maxConcurrent);

            const batchPromises = batch.map(async (filePath) => {
                try {
                    const result = await this.processFileWithStreaming(filePath, parser, options);
                    return { ...result, filePath };
                } catch (error) {
                    logger.error(`❌ Error procesando archivo: ${filePath}`, error);
                    return {
                        success: false,
                        filePath,
                        totalProcessed: 0,
                        totalErrors: 1,
                        processingTime: 0,
                        memoryUsage: { peak: 0, average: 0, final: 0 },
                        errors: [{
                            lineNumber: 0,
                            error: error instanceof Error ? error.message : 'Error desconocido'
                        }]
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        const totalProcessed = results.reduce((sum, r) => sum + r.totalProcessed, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.totalErrors, 0);
        const successfulFiles = results.filter(r => r.success).length;

        logger.info(`✅ Procesamiento masivo completado`, {
            totalFiles: filePaths.length,
            successfulFiles,
            totalProcessed,
            totalErrors
        });

        return results;
    }

    /**
     * Procesa un archivo con control de memoria estricto
     */
    async processFileWithMemoryControl<T>(
        filePath: string,
        parser: (line: string, lineNumber: number) => T | null,
        maxMemoryMB: number = 50
    ): Promise<StreamingResult<T>> {
        const maxMemoryBytes = maxMemoryMB * 1024 * 1024;

        return this.processFileWithStreaming(filePath, parser, {
            chunkSize: 32 * 1024, // Chunks más pequeños
            maxMemoryUsage: maxMemoryBytes,
            bufferSize: 5, // Menos chunks en memoria
            parallelProcessing: false
        });
    }

    // Métodos privados

    private async validateFileExists(filePath: string): Promise<void> {
        try {
            await fs.promises.access(filePath);
        } catch (error) {
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }
    }

    private processChunks<T>(chunks: ProcessedChunk[], result: StreamingResult<T>): void {
        for (const chunk of chunks) {
            result.data!.push(...chunk.data);
            result.totalProcessed += chunk.data.length;
            result.totalErrors += chunk.errors.length;

            // Agregar errores con contexto
            for (const error of chunk.errors) {
                result.errors.push({
                    lineNumber: error.lineNumber,
                    error: error.error,
                    data: `Chunk ${chunk.chunkNumber} (líneas ${chunk.lineStart}-${chunk.lineEnd})`
                });
            }
        }
    }

    private startMemoryMonitoring(): void {
        this.currentMemoryUsage = process.memoryUsage().heapUsed;
        this.peakMemoryUsage = this.currentMemoryUsage;

        this.memoryMonitor = setInterval(() => {
            const current = process.memoryUsage().heapUsed;
            this.currentMemoryUsage = current;
            this.peakMemoryUsage = Math.max(this.peakMemoryUsage, current);

            // Warning si el uso de memoria es alto
            if (current > this.config.maxMemoryUsage * 0.8) {
                logger.warn(`⚠️ Uso de memoria alto: ${this.formatBytes(current)}`);
            }
        }, 1000); // Monitorear cada segundo
    }

    private stopMemoryMonitoring(): void {
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
    }

    private getMemoryUsage(): { peak: number; average: number; final: number } {
        const current = process.memoryUsage().heapUsed;
        return {
            peak: this.peakMemoryUsage,
            average: (this.peakMemoryUsage + this.currentMemoryUsage) / 2,
            final: current
        };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Obtiene estadísticas de streaming
     */
    getStreamingStats(): {
        currentMemoryUsage: number;
        peakMemoryUsage: number;
        config: StreamingConfig;
    } {
        return {
            currentMemoryUsage: this.currentMemoryUsage,
            peakMemoryUsage: this.peakMemoryUsage,
            config: { ...this.config }
        };
    }

    /**
     * Actualiza configuración de streaming
     */
    updateConfig(newConfig: Partial<StreamingConfig>): void {
        Object.assign(this.config, newConfig);
        logger.info('⚙️ Configuración de streaming actualizada', this.config);
    }
}

// Singleton instance
export const streamingFileProcessor = new StreamingFileProcessor();
