import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface CANDecodeResult {
    success: boolean;
    decodedFilePath?: string;
    error?: string;
    processingTime?: number;
    messageCount?: number;
}

export class CANDecoderService {
    private readonly decoderPath: string;
    private readonly maxProcessingTime: number; // 5 minutos máximo

    constructor() {
        this.decoderPath = path.join(process.cwd(), 'backend/data/DECODIFICADOR CAN/decodificador_can_unificado.py');
        this.maxProcessingTime = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Decodifica un archivo CAN usando el decodificador Python real
     */
    async decodeCANFile(originalFilePath: string): Promise<CANDecodeResult> {
        const startTime = Date.now();
        
        try {
            logger.info(`🔧 Iniciando decodificación CAN real: ${path.basename(originalFilePath)}`);

            // Verificar que el archivo original existe
            await fs.access(originalFilePath);
            
            // Verificar que el decodificador existe
            await fs.access(this.decoderPath);

            // Verificar si ya existe archivo decodificado
            const decodedFilePath = originalFilePath.replace('.txt', '_TRADUCIDO.csv');
            try {
                await fs.access(decodedFilePath);
                logger.info(`⏭️ Archivo CAN ya decodificado: ${path.basename(decodedFilePath)}`);
                
                // Verificar que el archivo decodificado no esté vacío
                const stats = await fs.stat(decodedFilePath);
                if (stats.size === 0) {
                    logger.warn(`⚠️ Archivo decodificado vacío, reprocesando: ${path.basename(decodedFilePath)}`);
                    await fs.unlink(decodedFilePath); // Eliminar archivo vacío
                } else {
                    return {
                        success: true,
                        decodedFilePath,
                        processingTime: Date.now() - startTime,
                        messageCount: await this.countMessagesInFile(decodedFilePath)
                    };
                }
            } catch {
                // Archivo decodificado no existe, continuar con decodificación
            }

            // Ejecutar decodificador Python
            const result = await this.executePythonDecoder(originalFilePath, decodedFilePath);
            
            if (result.success) {
                // Verificar que el archivo decodificado se creó y no está vacío
                await fs.access(decodedFilePath);
                const stats = await fs.stat(decodedFilePath);
                
                if (stats.size === 0) {
                    throw new Error('Archivo decodificado generado está vacío');
                }

                const messageCount = await this.countMessagesInFile(decodedFilePath);
                
                logger.info(`✅ Decodificación CAN exitosa: ${path.basename(decodedFilePath)} - ${messageCount} mensajes`);
                
                return {
                    success: true,
                    decodedFilePath,
                    processingTime: Date.now() - startTime,
                    messageCount
                };
            } else {
                throw new Error(result.error || 'Error desconocido en decodificación');
            }

        } catch (error) {
            const processingTime = Date.now() - startTime;
            logger.error(`❌ Error en decodificación CAN ${path.basename(originalFilePath)}:`, error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
                processingTime
            };
        }
    }

    /**
     * Ejecuta el decodificador Python con timeout y manejo de errores
     */
    private async executePythonDecoder(originalFilePath: string, decodedFilePath: string): Promise<CANDecodeResult> {
        return new Promise((resolve) => {
            const pythonProcess = spawn('python', [this.decoderPath, originalFilePath], {
                cwd: path.dirname(this.decoderPath),
                timeout: this.maxProcessingTime
            });

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout?.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', async (code) => {
                try {
                    if (code === 0) {
                        // Verificar que el archivo decodificado se creó
                        await fs.access(decodedFilePath);
                        resolve({ success: true });
                    } else {
                        logger.error(`Decodificador Python falló con código ${code}: ${errorOutput}`);
                        resolve({ 
                            success: false, 
                            error: `Decodificador falló: ${errorOutput || 'Error desconocido'}` 
                        });
                    }
                } catch (error) {
                    resolve({ 
                        success: false, 
                        error: `Archivo decodificado no encontrado: ${error}` 
                    });
                }
            });

            pythonProcess.on('error', (error) => {
                logger.error(`Error ejecutando decodificador Python:`, error);
                resolve({ 
                    success: false, 
                    error: `Error ejecutando decodificador: ${error.message}` 
                });
            });

            // Timeout manual como respaldo
            setTimeout(() => {
                if (!pythonProcess.killed) {
                    pythonProcess.kill('SIGTERM');
                    resolve({ 
                        success: false, 
                        error: `Timeout: decodificación tardó más de ${this.maxProcessingTime / 1000} segundos` 
                    });
                }
            }, this.maxProcessingTime);
        });
    }

    /**
     * Cuenta el número de mensajes en un archivo CSV decodificado
     */
    private async countMessagesInFile(filePath: string): Promise<number> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            
            // Restar 1 por la línea de header
            return Math.max(0, lines.length - 1);
        } catch (error) {
            logger.warn(`Error contando mensajes en ${filePath}:`, error);
            return 0;
        }
    }

    /**
     * Verifica si un archivo CAN necesita decodificación
     */
    async needsDecoding(filePath: string): Promise<boolean> {
        try {
            // Si el archivo ya tiene "_TRADUCIDO" en el nombre, no necesita decodificación
            if (path.basename(filePath).includes('_TRADUCIDO')) {
                return false;
            }

            // Si ya existe el archivo decodificado y no está vacío, no necesita decodificación
            const decodedPath = filePath.replace('.txt', '_TRADUCIDO.csv');
            try {
                const stats = await fs.stat(decodedPath);
                return stats.size === 0; // Solo necesita decodificación si está vacío
            } catch {
                return true; // No existe archivo decodificado
            }
        } catch (error) {
            logger.warn(`Error verificando necesidad de decodificación ${filePath}:`, error);
            return true; // En caso de error, asumir que necesita decodificación
        }
    }

    /**
     * Valida la integridad de un archivo CAN antes de decodificar
     */
    async validateCANFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
        try {
            // Verificar que el archivo existe
            await fs.access(filePath);

            // Verificar que no esté vacío
            const stats = await fs.stat(filePath);
            if (stats.size === 0) {
                return { valid: false, error: 'Archivo vacío' };
            }

            // Verificar que no sea demasiado grande (límite de 100MB)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (stats.size > maxSize) {
                return { valid: false, error: `Archivo demasiado grande: ${(stats.size / 1024 / 1024).toFixed(2)}MB` };
            }

            // Leer primeras líneas para verificar formato
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').slice(0, 5); // Primeras 5 líneas

            // Verificar que tiene contenido
            if (lines.length === 0) {
                return { valid: false, error: 'Archivo sin contenido' };
            }

            // Verificar que las líneas tienen formato esperado (contienen números y separadores)
            const hasValidFormat = lines.some(line => 
                line.includes(';') || line.includes(',') || /\d/.test(line)
            );

            if (!hasValidFormat) {
                return { valid: false, error: 'Formato de archivo no reconocido' };
            }

            return { valid: true };

        } catch (error) {
            return { 
                valid: false, 
                error: `Error validando archivo: ${error instanceof Error ? error.message : 'Error desconocido'}` 
            };
        }
    }

    /**
     * Obtiene información del archivo decodificado
     */
    async getDecodedFileInfo(decodedFilePath: string): Promise<{
        exists: boolean;
        size: number;
        messageCount: number;
        lastModified: Date;
    }> {
        try {
            const stats = await fs.stat(decodedFilePath);
            const messageCount = await this.countMessagesInFile(decodedFilePath);
            
            return {
                exists: true,
                size: stats.size,
                messageCount,
                lastModified: stats.mtime
            };
        } catch (error) {
            return {
                exists: false,
                size: 0,
                messageCount: 0,
                lastModified: new Date(0)
            };
        }
    }
}
