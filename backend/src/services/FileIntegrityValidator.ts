import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface FileIntegrityResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    fileInfo: {
        size: number;
        hash: string;
        lastModified: Date;
        format: string;
    };
}

interface ValidationRules {
    maxFileSize: number; // bytes
    minFileSize: number; // bytes
    allowedExtensions: string[];
    maxAge: number; // days
    checkFormat: boolean;
    checkEncoding: boolean;
}

export class FileIntegrityValidator {
    private readonly defaultRules: ValidationRules = {
        maxFileSize: 100 * 1024 * 1024, // 100MB
        minFileSize: 1024, // 1KB
        allowedExtensions: ['.txt', '.csv'],
        maxAge: 365, // 1 año
        checkFormat: true,
        checkEncoding: true
    };

    /**
     * Valida la integridad de un archivo
     */
    async validateFile(filePath: string, customRules?: Partial<ValidationRules>): Promise<FileIntegrityResult> {
        const rules = { ...this.defaultRules, ...customRules };
        const result: FileIntegrityResult = {
            valid: true,
            errors: [],
            warnings: [],
            fileInfo: {
                size: 0,
                hash: '',
                lastModified: new Date(),
                format: 'unknown'
            }
        };

        try {
            logger.info(`🔍 Validando integridad de archivo: ${path.basename(filePath)}`);

            // 1. Verificar que el archivo existe
            await this.validateFileExists(filePath, result);

            // 2. Verificar extensión
            await this.validateFileExtension(filePath, rules.allowedExtensions, result);

            // 3. Obtener información básica del archivo
            const stats = await fs.stat(filePath);
            result.fileInfo.size = stats.size;
            result.fileInfo.lastModified = stats.mtime;

            // 4. Validar tamaño
            await this.validateFileSize(result.fileInfo.size, rules.minFileSize, rules.maxFileSize, result);

            // 5. Validar antigüedad
            await this.validateFileAge(result.fileInfo.lastModified, rules.maxAge, result);

            // 6. Calcular hash
            result.fileInfo.hash = await this.calculateFileHash(filePath);

            // 7. Validar formato (si está habilitado)
            if (rules.checkFormat) {
                await this.validateFileFormat(filePath, result);
            }

            // 8. Validar encoding (si está habilitado)
            if (rules.checkEncoding) {
                await this.validateFileEncoding(filePath, result);
            }

            // 9. Validaciones específicas por tipo de archivo
            await this.validateFileTypeSpecific(filePath, result);

            // Determinar validez final
            result.valid = result.errors.length === 0;

            logger.info(`✅ Validación de integridad completada: ${path.basename(filePath)}`, {
                valid: result.valid,
                errors: result.errors.length,
                warnings: result.warnings.length,
                size: result.fileInfo.size,
                hash: result.fileInfo.hash.substring(0, 8) + '...'
            });

            return result;

        } catch (error) {
            logger.error(`❌ Error validando integridad de archivo ${filePath}:`, error);
            result.valid = false;
            result.errors.push(`Error de validación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            return result;
        }
    }

    /**
     * Valida múltiples archivos en paralelo
     */
    async validateFiles(filePaths: string[], customRules?: Partial<ValidationRules>): Promise<FileIntegrityResult[]> {
        logger.info(`🔍 Validando integridad de ${filePaths.length} archivos`);

        const validationPromises = filePaths.map(filePath =>
            this.validateFile(filePath, customRules)
        );

        const results = await Promise.all(validationPromises);

        const validCount = results.filter(r => r.valid).length;
        const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
        const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);

        logger.info(`✅ Validación masiva completada`, {
            totalFiles: filePaths.length,
            validFiles: validCount,
            invalidFiles: filePaths.length - validCount,
            totalErrors: errorCount,
            totalWarnings: warningCount
        });

        return results;
    }

    // Métodos de validación privados

    private async validateFileExists(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            await fs.access(filePath);
        } catch (error) {
            result.valid = false;
            result.errors.push('Archivo no existe o no es accesible');
        }
    }

    private async validateFileExtension(filePath: string, allowedExtensions: string[], result: FileIntegrityResult): Promise<void> {
        const ext = path.extname(filePath).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            result.valid = false;
            result.errors.push(`Extensión no permitida: ${ext}. Extensiones válidas: ${allowedExtensions.join(', ')}`);
        }
    }

    private async validateFileSize(size: number, minSize: number, maxSize: number, result: FileIntegrityResult): Promise<void> {
        if (size < minSize) {
            result.valid = false;
            result.errors.push(`Archivo demasiado pequeño: ${this.formatBytes(size)}. Mínimo: ${this.formatBytes(minSize)}`);
        }

        if (size > maxSize) {
            result.valid = false;
            result.errors.push(`Archivo demasiado grande: ${this.formatBytes(size)}. Máximo: ${this.formatBytes(maxSize)}`);
        }

        // Warning para archivos grandes
        if (size > maxSize * 0.8) {
            result.warnings.push(`Archivo grande: ${this.formatBytes(size)}. Puede afectar el rendimiento`);
        }
    }

    private async validateFileAge(lastModified: Date, maxAgeDays: number, result: FileIntegrityResult): Promise<void> {
        const ageInDays = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

        if (ageInDays > maxAgeDays) {
            result.warnings.push(`Archivo antiguo: ${Math.round(ageInDays)} días. Máximo recomendado: ${maxAgeDays} días`);
        }
    }

    private async validateFileFormat(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const fileName = path.basename(filePath);

            // Detectar formato por nombre de archivo
            if (fileName.includes('GPS')) {
                result.fileInfo.format = 'GPS';
                await this.validateGPSFormat(filePath, result);
            } else if (fileName.includes('CAN')) {
                result.fileInfo.format = 'CAN';
                await this.validateCANFormat(filePath, result);
            } else if (fileName.includes('ESTABILIDAD')) {
                result.fileInfo.format = 'ESTABILIDAD';
                await this.validateStabilityFormat(filePath, result);
            } else if (fileName.includes('ROTATIVO')) {
                result.fileInfo.format = 'ROTATIVO';
                await this.validateRotativoFormat(filePath, result);
            } else {
                result.fileInfo.format = 'UNKNOWN';
                result.warnings.push('Formato de archivo no reconocido');
            }

        } catch (error) {
            result.errors.push(`Error validando formato: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateGPSFormat(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').slice(0, 5); // Primeras 5 líneas

            // Verificar que contiene datos GPS básicos
            const hasGPSData = lines.some(line =>
                line.includes(',') &&
                (line.includes('latitud') || line.includes('longitud') || /\d+\.\d+/.test(line))
            );

            if (!hasGPSData) {
                result.errors.push('Archivo GPS no contiene datos válidos de coordenadas');
            }

            // Verificar formato de timestamp
            const hasTimestamp = lines.some(line =>
                /\d{4}-\d{2}-\d{2}/.test(line) || /\d{2}:\d{2}:\d{2}/.test(line)
            );

            if (!hasTimestamp) {
                result.warnings.push('Archivo GPS no contiene timestamps reconocibles');
            }

        } catch (error) {
            result.errors.push(`Error validando formato GPS: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateCANFormat(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').slice(0, 10); // Primeras 10 líneas

            // Verificar que contiene datos CAN básicos
            const hasCANData = lines.some(line =>
                line.length > 10 &&
                (line.includes(';') || line.includes(',')) &&
                /\d/.test(line)
            );

            if (!hasCANData) {
                result.errors.push('Archivo CAN no contiene datos válidos');
            }

            // Verificar que no esté vacío
            if (content.trim().length === 0) {
                result.errors.push('Archivo CAN está vacío');
            }

        } catch (error) {
            result.errors.push(`Error validando formato CAN: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateStabilityFormat(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').slice(0, 5);

            // Verificar que contiene datos de estabilidad
            const hasStabilityData = lines.some(line =>
                line.includes(';') &&
                (line.includes('ax') || line.includes('ay') || line.includes('az'))
            );

            if (!hasStabilityData) {
                result.warnings.push('Archivo de estabilidad puede no contener datos válidos');
            }

        } catch (error) {
            result.errors.push(`Error validando formato de estabilidad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateRotativoFormat(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').slice(0, 5);

            // Verificar que contiene datos rotativo
            const hasRotativoData = lines.some(line =>
                line.includes(';') &&
                (line.includes('Estado') || /\d/.test(line))
            );

            if (!hasRotativoData) {
                result.warnings.push('Archivo rotativo puede no contener datos válidos');
            }

        } catch (error) {
            result.errors.push(`Error validando formato rotativo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateFileEncoding(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            // Intentar leer el archivo con diferentes encodings
            const buffer = await fs.readFile(filePath);

            // Verificar que no hay caracteres nulos
            if (buffer.includes(0)) {
                result.warnings.push('Archivo contiene caracteres nulos');
            }

            // Verificar encoding UTF-8
            try {
                buffer.toString('utf-8');
            } catch (error) {
                result.warnings.push('Archivo puede no estar en encoding UTF-8');
            }

        } catch (error) {
            result.errors.push(`Error validando encoding: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async validateFileTypeSpecific(filePath: string, result: FileIntegrityResult): Promise<void> {
        const fileName = path.basename(filePath);

        // Validaciones específicas por tipo
        if (fileName.includes('TRADUCIDO')) {
            // Archivo CAN decodificado
            await this.validateDecodedCANFile(filePath, result);
        }

        // Verificar que no sea un archivo temporal
        if (fileName.startsWith('.') || fileName.startsWith('~')) {
            result.warnings.push('Archivo parece ser temporal o oculto');
        }
    }

    private async validateDecodedCANFile(filePath: string, result: FileIntegrityResult): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');

            // Verificar que tiene header
            if (lines.length < 2) {
                result.errors.push('Archivo CAN decodificado parece estar vacío o incompleto');
                return;
            }

            // Verificar que tiene datos
            const dataLines = lines.filter(line => line.trim() && !line.startsWith('#'));
            if (dataLines.length < 2) {
                result.warnings.push('Archivo CAN decodificado tiene pocos datos');
            }

        } catch (error) {
            result.errors.push(`Error validando archivo CAN decodificado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    private async calculateFileHash(filePath: string): Promise<string> {
        try {
            const hash = crypto.createHash('sha256');
            const buffer = await fs.readFile(filePath);
            hash.update(buffer);
            return hash.digest('hex');
        } catch (error) {
            logger.warn(`Error calculando hash de ${filePath}:`, error);
            return 'error';
        }
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Obtiene reglas de validación por defecto
     */
    getDefaultRules(): ValidationRules {
        return { ...this.defaultRules };
    }

    /**
     * Crea reglas personalizadas para tipos específicos de archivo
     */
    createFileTypeRules(fileType: 'GPS' | 'CAN' | 'ESTABILIDAD' | 'ROTATIVO'): ValidationRules {
        const baseRules = this.getDefaultRules();

        switch (fileType) {
            case 'GPS':
                return {
                    ...baseRules,
                    maxFileSize: 50 * 1024 * 1024, // 50MB para GPS
                    minFileSize: 512 // 512 bytes mínimo para GPS
                };
            case 'CAN':
                return {
                    ...baseRules,
                    maxFileSize: 200 * 1024 * 1024, // 200MB para CAN
                    minFileSize: 1024 // 1KB mínimo para CAN
                };
            case 'ESTABILIDAD':
                return {
                    ...baseRules,
                    maxFileSize: 100 * 1024 * 1024, // 100MB para estabilidad
                    minFileSize: 2048 // 2KB mínimo para estabilidad
                };
            case 'ROTATIVO':
                return {
                    ...baseRules,
                    maxFileSize: 10 * 1024 * 1024, // 10MB para rotativo
                    minFileSize: 256 // 256 bytes mínimo para rotativo
                };
            default:
                return baseRules;
        }
    }
}
