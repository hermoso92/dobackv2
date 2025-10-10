import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

interface RecoveryStrategy {
    name: string;
    description: string;
    applicableTo: string[]; // tipos de archivo
    successRate: number; // porcentaje esperado de éxito
}

interface RecoveryResult {
    success: boolean;
    recoveredData: any[];
    recoveredLines: number;
    totalLines: number;
    recoveryRate: number;
    strategy: string;
    errors: string[];
    warnings: string[];
    processingTime: number;
}

interface FileAnalysis {
    fileType: 'CAN' | 'GPS' | 'ESTABILIDAD' | 'ROTATIVO' | 'UNKNOWN';
    corruptionType: 'HEADER' | 'BODY' | 'FOOTER' | 'MIXED' | 'ENCODING' | 'UNKNOWN';
    corruptionLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recoverableSections: number[];
    totalSections: number;
    estimatedRecoveryRate: number;
}

export class PartialRecoveryService {
    private readonly recoveryStrategies: RecoveryStrategy[] = [
        {
            name: 'HEADER_RECOVERY',
            description: 'Recupera datos ignorando headers corruptos',
            applicableTo: ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'],
            successRate: 85
        },
        {
            name: 'SECTION_BY_SECTION',
            description: 'Procesa archivo sección por sección, saltando partes corruptas',
            applicableTo: ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'],
            successRate: 70
        },
        {
            name: 'PATTERN_MATCHING',
            description: 'Usa patrones conocidos para identificar datos válidos',
            applicableTo: ['CAN', 'GPS'],
            successRate: 60
        },
        {
            name: 'ENCODING_RECOVERY',
            description: 'Intenta diferentes encodings para recuperar datos',
            applicableTo: ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'],
            successRate: 40
        },
        {
            name: 'LAST_RESORT',
            description: 'Extrae cualquier dato que parezca válido',
            applicableTo: ['CAN', 'GPS', 'ESTABILIDAD', 'ROTATIVO'],
            successRate: 20
        }
    ];

    /**
     * Analiza un archivo corrupto para determinar el tipo de corrupción
     */
    async analyzeCorruptedFile(filePath: string): Promise<FileAnalysis> {
        const startTime = Date.now();

        try {
            logger.info(`🔍 Analizando archivo corrupto: ${path.basename(filePath)}`);

            // Leer archivo con diferentes encodings
            const content = await this.readFileWithMultipleEncodings(filePath);

            // Determinar tipo de archivo
            const fileType = this.detectFileType(filePath, content);

            // Analizar corrupción
            const corruptionAnalysis = this.analyzeCorruption(content, fileType);

            // Calcular tasa de recuperación estimada
            const estimatedRecoveryRate = this.calculateRecoveryRate(corruptionAnalysis, fileType);

            const analysis: FileAnalysis = {
                fileType,
                corruptionType: corruptionAnalysis.type,
                corruptionLevel: corruptionAnalysis.level,
                recoverableSections: corruptionAnalysis.recoverableSections,
                totalSections: corruptionAnalysis.totalSections,
                estimatedRecoveryRate
            };

            const processingTime = Date.now() - startTime;

            logger.info(`✅ Análisis completado: ${path.basename(filePath)}`, {
                fileType,
                corruptionType: analysis.corruptionType,
                corruptionLevel: analysis.corruptionLevel,
                estimatedRecoveryRate: `${estimatedRecoveryRate.toFixed(1)}%`,
                processingTime
            });

            return analysis;

        } catch (error) {
            logger.error(`❌ Error analizando archivo corrupto: ${path.basename(filePath)}`, error);
            throw error;
        }
    }

    /**
     * Recupera datos de un archivo corrupto usando múltiples estrategias
     */
    async recoverCorruptedFile(
        filePath: string,
        analysis: FileAnalysis,
        strategies: string[] = []
    ): Promise<RecoveryResult> {
        const startTime = Date.now();

        try {
            logger.info(`🔄 Iniciando recuperación parcial: ${path.basename(filePath)}`, {
                corruptionType: analysis.corruptionType,
                corruptionLevel: analysis.corruptionLevel,
                estimatedRecoveryRate: analysis.estimatedRecoveryRate
            });

            // Determinar estrategias a usar
            const applicableStrategies = strategies.length > 0 ?
                strategies :
                this.getApplicableStrategies(analysis);

            let bestResult: RecoveryResult | null = null;

            // Probar cada estrategia
            for (const strategyName of applicableStrategies) {
                try {
                    const result = await this.applyRecoveryStrategy(filePath, analysis, strategyName);

                    if (!bestResult || result.recoveryRate > bestResult.recoveryRate) {
                        bestResult = result;
                    }

                    logger.info(`📊 Estrategia ${strategyName}: ${result.recoveryRate.toFixed(1)}% de recuperación`, {
                        recoveredLines: result.recoveredLines,
                        totalLines: result.totalLines,
                        errors: result.errors.length,
                        warnings: result.warnings.length
                    });

                } catch (error) {
                    logger.warn(`⚠️ Estrategia ${strategyName} falló:`, error);
                }
            }

            if (!bestResult) {
                throw new Error('Todas las estrategias de recuperación fallaron');
            }

            const processingTime = Date.now() - startTime;
            bestResult.processingTime = processingTime;

            logger.info(`✅ Recuperación parcial completada: ${path.basename(filePath)}`, {
                strategy: bestResult.strategy,
                recoveryRate: `${bestResult.recoveryRate.toFixed(1)}%`,
                recoveredLines: bestResult.recoveredLines,
                totalLines: bestResult.totalLines,
                processingTime
            });

            return bestResult;

        } catch (error) {
            logger.error(`❌ Error en recuperación parcial: ${path.basename(filePath)}`, error);

            return {
                success: false,
                recoveredData: [],
                recoveredLines: 0,
                totalLines: 0,
                recoveryRate: 0,
                strategy: 'FAILED',
                errors: [error instanceof Error ? error.message : 'Error desconocido'],
                warnings: [],
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * Aplica una estrategia de recuperación específica
     */
    private async applyRecoveryStrategy(
        filePath: string,
        analysis: FileAnalysis,
        strategyName: string
    ): Promise<RecoveryResult> {
        const strategy = this.recoveryStrategies.find(s => s.name === strategyName);
        if (!strategy) {
            throw new Error(`Estrategia no encontrada: ${strategyName}`);
        }

        logger.debug(`🔧 Aplicando estrategia: ${strategy.name}`);

        switch (strategy.name) {
            case 'HEADER_RECOVERY':
                return await this.headerRecoveryStrategy(filePath, analysis);

            case 'SECTION_BY_SECTION':
                return await this.sectionBySectionStrategy(filePath, analysis);

            case 'PATTERN_MATCHING':
                return await this.patternMatchingStrategy(filePath, analysis);

            case 'ENCODING_RECOVERY':
                return await this.encodingRecoveryStrategy(filePath, analysis);

            case 'LAST_RESORT':
                return await this.lastResortStrategy(filePath, analysis);

            default:
                throw new Error(`Estrategia no implementada: ${strategyName}`);
        }
    }

    /**
     * Estrategia: Recuperación de header
     */
    private async headerRecoveryStrategy(filePath: string, analysis: FileAnalysis): Promise<RecoveryResult> {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const recoveredData: any[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        let recoveredLines = 0;
        let skipHeader = true;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) continue;

            try {
                // Saltar header corrupto
                if (skipHeader && this.isHeaderLine(line, analysis.fileType)) {
                    warnings.push(`Header corrupto saltado en línea ${i + 1}`);
                    continue;
                }

                skipHeader = false;

                // Intentar parsear línea
                const parsedData = this.parseLine(line, analysis.fileType);
                if (parsedData) {
                    recoveredData.push(parsedData);
                    recoveredLines++;
                }

            } catch (error) {
                errors.push(`Error en línea ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }

        return {
            success: recoveredLines > 0,
            recoveredData,
            recoveredLines,
            totalLines: lines.length,
            recoveryRate: (recoveredLines / lines.length) * 100,
            strategy: 'HEADER_RECOVERY',
            errors,
            warnings,
            processingTime: 0 // Se calculará después
        };
    }

    /**
     * Estrategia: Sección por sección
     */
    private async sectionBySectionStrategy(filePath: string, analysis: FileAnalysis): Promise<RecoveryResult> {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const recoveredData: any[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        let recoveredLines = 0;
        const sectionSize = Math.max(10, Math.floor(lines.length / 20)); // Mínimo 10 líneas por sección

        for (let sectionStart = 0; sectionStart < lines.length; sectionStart += sectionSize) {
            const sectionEnd = Math.min(sectionStart + sectionSize, lines.length);
            const sectionLines = lines.slice(sectionStart, sectionEnd);

            let sectionRecovered = 0;
            let sectionErrors = 0;

            for (const line of sectionLines) {
                if (!line.trim()) continue;

                try {
                    const parsedData = this.parseLine(line, analysis.fileType);
                    if (parsedData) {
                        recoveredData.push(parsedData);
                        sectionRecovered++;
                    }
                } catch (error) {
                    sectionErrors++;
                }
            }

            // Si la sección tiene más del 50% de errores, marcarla como corrupta
            if (sectionErrors > sectionLines.length * 0.5) {
                warnings.push(`Sección ${Math.floor(sectionStart / sectionSize) + 1} marcada como corrupta`);
            } else {
                recoveredLines += sectionRecovered;
            }
        }

        return {
            success: recoveredLines > 0,
            recoveredData,
            recoveredLines,
            totalLines: lines.length,
            recoveryRate: (recoveredLines / lines.length) * 100,
            strategy: 'SECTION_BY_SECTION',
            errors,
            warnings,
            processingTime: 0
        };
    }

    /**
     * Estrategia: Coincidencia de patrones
     */
    private async patternMatchingStrategy(filePath: string, analysis: FileAnalysis): Promise<RecoveryResult> {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const recoveredData: any[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        let recoveredLines = 0;
        const patterns = this.getPatternsForFileType(analysis.fileType);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            try {
                // Buscar patrones conocidos
                for (const pattern of patterns) {
                    if (pattern.test(line)) {
                        const parsedData = this.parseLine(line, analysis.fileType);
                        if (parsedData) {
                            recoveredData.push(parsedData);
                            recoveredLines++;
                            break;
                        }
                    }
                }
            } catch (error) {
                errors.push(`Error en línea ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        }

        return {
            success: recoveredLines > 0,
            recoveredData,
            recoveredLines,
            totalLines: lines.length,
            recoveryRate: (recoveredLines / lines.length) * 100,
            strategy: 'PATTERN_MATCHING',
            errors,
            warnings,
            processingTime: 0
        };
    }

    /**
     * Estrategia: Recuperación de encoding
     */
    private async encodingRecoveryStrategy(filePath: string, analysis: FileAnalysis): Promise<RecoveryResult> {
        const encodings = ['utf-8', 'latin1', 'ascii', 'utf-16'];
        let bestResult: RecoveryResult | null = null;

        for (const encoding of encodings) {
            try {
                const content = await fs.readFile(filePath, encoding);
                const lines = content.split('\n');
                const recoveredData: any[] = [];
                const errors: string[] = [];
                const warnings: string[] = [];

                let recoveredLines = 0;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    try {
                        const parsedData = this.parseLine(line, analysis.fileType);
                        if (parsedData) {
                            recoveredData.push(parsedData);
                            recoveredLines++;
                        }
                    } catch (error) {
                        errors.push(`Error en línea ${i + 1} con encoding ${encoding}`);
                    }
                }

                const result: RecoveryResult = {
                    success: recoveredLines > 0,
                    recoveredData,
                    recoveredLines,
                    totalLines: lines.length,
                    recoveryRate: (recoveredLines / lines.length) * 100,
                    strategy: `ENCODING_RECOVERY_${encoding.toUpperCase()}`,
                    errors,
                    warnings: [...warnings, `Encoding probado: ${encoding}`],
                    processingTime: 0
                };

                if (!bestResult || result.recoveryRate > bestResult.recoveryRate) {
                    bestResult = result;
                }

            } catch (error) {
                logger.debug(`Encoding ${encoding} falló:`, error);
            }
        }

        if (!bestResult) {
            throw new Error('Todos los encodings fallaron');
        }

        return bestResult;
    }

    /**
     * Estrategia: Último recurso
     */
    private async lastResortStrategy(filePath: string, analysis: FileAnalysis): Promise<RecoveryResult> {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        const recoveredData: any[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        let recoveredLines = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.length < 5) continue; // Líneas muy cortas probablemente no son datos

            try {
                // Extraer cualquier dato que parezca válido
                const extractedData = this.extractAnyValidData(line, analysis.fileType);
                if (extractedData) {
                    recoveredData.push(extractedData);
                    recoveredLines++;
                }
            } catch (error) {
                // En último recurso, ignoramos errores individuales
            }
        }

        warnings.push('Estrategia de último recurso aplicada - calidad de datos puede ser baja');

        return {
            success: recoveredLines > 0,
            recoveredData,
            recoveredLines,
            totalLines: lines.length,
            recoveryRate: (recoveredLines / lines.length) * 100,
            strategy: 'LAST_RESORT',
            errors,
            warnings,
            processingTime: 0
        };
    }

    // Métodos auxiliares

    private async readFileWithMultipleEncodings(filePath: string): Promise<string> {
        const encodings = ['utf-8', 'latin1', 'ascii'];

        for (const encoding of encodings) {
            try {
                const content = await fs.readFile(filePath, encoding);
                if (content.length > 0) {
                    return content;
                }
            } catch (error) {
                // Continuar con el siguiente encoding
            }
        }

        throw new Error('No se pudo leer el archivo con ningún encoding');
    }

    private detectFileType(filePath: string, content: string): FileAnalysis['fileType'] {
        const fileName = path.basename(filePath).toUpperCase();

        if (fileName.includes('CAN')) return 'CAN';
        if (fileName.includes('GPS')) return 'GPS';
        if (fileName.includes('ESTABILIDAD')) return 'ESTABILIDAD';
        if (fileName.includes('ROTATIVO')) return 'ROTATIVO';

        // Intentar detectar por contenido
        if (content.includes('CAN') || content.includes('ID:')) return 'CAN';
        if (content.includes('latitud') || content.includes('longitud')) return 'GPS';
        if (content.includes('ax') || content.includes('ay') || content.includes('az')) return 'ESTABILIDAD';
        if (content.includes('Estado') || content.includes('Rotativo')) return 'ROTATIVO';

        return 'UNKNOWN';
    }

    private analyzeCorruption(content: string, fileType: FileAnalysis['fileType']): {
        type: FileAnalysis['corruptionType'];
        level: FileAnalysis['corruptionLevel'];
        recoverableSections: number[];
        totalSections: number;
    } {
        const lines = content.split('\n');
        const totalLines = lines.length;
        let corruptLines = 0;
        const recoverableSections: number[] = [];

        const sectionSize = Math.max(10, Math.floor(totalLines / 20));

        for (let i = 0; i < totalLines; i += sectionSize) {
            const sectionEnd = Math.min(i + sectionSize, totalLines);
            const sectionLines = lines.slice(i, sectionEnd);
            let sectionCorruptLines = 0;

            for (const line of sectionLines) {
                if (!this.isValidLine(line, fileType)) {
                    sectionCorruptLines++;
                    corruptLines++;
                }
            }

            // Si la sección tiene menos del 50% de líneas corruptas, es recuperable
            if (sectionCorruptLines < sectionLines.length * 0.5) {
                recoverableSections.push(Math.floor(i / sectionSize));
            }
        }

        const corruptionRate = (corruptLines / totalLines) * 100;

        let type: FileAnalysis['corruptionType'] = 'UNKNOWN';
        let level: FileAnalysis['corruptionLevel'] = 'LOW';

        // Determinar tipo de corrupción
        if (corruptionRate < 10) {
            type = 'HEADER';
            level = 'LOW';
        } else if (corruptionRate < 30) {
            type = 'BODY';
            level = 'MEDIUM';
        } else if (corruptionRate < 60) {
            type = 'MIXED';
            level = 'HIGH';
        } else {
            type = 'ENCODING';
            level = 'CRITICAL';
        }

        return {
            type,
            level,
            recoverableSections,
            totalSections: Math.ceil(totalLines / sectionSize)
        };
    }

    private calculateRecoveryRate(analysis: any, fileType: FileAnalysis['fileType']): number {
        const baseRate = analysis.recoverableSections.length / analysis.totalSections;
        const fileTypeMultiplier = this.getFileTypeRecoveryMultiplier(fileType);
        const corruptionMultiplier = this.getCorruptionLevelMultiplier(analysis.level);

        return Math.min(95, baseRate * fileTypeMultiplier * corruptionMultiplier * 100);
    }

    private getFileTypeRecoveryMultiplier(fileType: FileAnalysis['fileType']): number {
        switch (fileType) {
            case 'CAN': return 0.8;
            case 'GPS': return 0.9;
            case 'ESTABILIDAD': return 0.7;
            case 'ROTATIVO': return 0.6;
            default: return 0.5;
        }
    }

    private getCorruptionLevelMultiplier(level: FileAnalysis['corruptionLevel']): number {
        switch (level) {
            case 'LOW': return 1.0;
            case 'MEDIUM': return 0.8;
            case 'HIGH': return 0.6;
            case 'CRITICAL': return 0.4;
            default: return 0.5;
        }
    }

    private getApplicableStrategies(analysis: FileAnalysis): string[] {
        return this.recoveryStrategies
            .filter(strategy => strategy.applicableTo.includes(analysis.fileType))
            .map(strategy => strategy.name);
    }

    private isHeaderLine(line: string, fileType: FileAnalysis['fileType']): boolean {
        const upperLine = line.toUpperCase();
        return upperLine.includes('TIPO') ||
            upperLine.includes('FECHA') ||
            upperLine.includes('VEHICULO') ||
            upperLine.includes('HEADER') ||
            upperLine.startsWith('#');
    }

    private parseLine(line: string, fileType: FileAnalysis['fileType']): any | null {
        // Implementación básica de parsing por tipo
        switch (fileType) {
            case 'CAN':
                return this.parseCANLine(line);
            case 'GPS':
                return this.parseGPSLine(line);
            case 'ESTABILIDAD':
                return this.parseStabilityLine(line);
            case 'ROTATIVO':
                return this.parseRotativoLine(line);
            default:
                return this.parseGenericLine(line);
        }
    }

    private parseCANLine(line: string): any | null {
        const parts = line.split(/[;,\s]+/).filter(p => p.trim());
        if (parts.length >= 3) {
            return {
                timestamp: new Date(),
                id: parts[0],
                data: parts.slice(1),
                type: 'CAN'
            };
        }
        return null;
    }

    private parseGPSLine(line: string): any | null {
        if (line.includes(',') && (line.includes('lat') || line.includes('lon'))) {
            return {
                timestamp: new Date(),
                data: line.split(','),
                type: 'GPS'
            };
        }
        return null;
    }

    private parseStabilityLine(line: string): any | null {
        if (line.includes(';') && (line.includes('ax') || line.includes('ay'))) {
            return {
                timestamp: new Date(),
                data: line.split(';'),
                type: 'ESTABILIDAD'
            };
        }
        return null;
    }

    private parseRotativoLine(line: string): any | null {
        if (line.includes(';') && line.includes('Estado')) {
            return {
                timestamp: new Date(),
                data: line.split(';'),
                type: 'ROTATIVO'
            };
        }
        return null;
    }

    private parseGenericLine(line: string): any | null {
        if (line.length > 10 && line.includes(';')) {
            return {
                timestamp: new Date(),
                data: line.split(';'),
                type: 'GENERIC'
            };
        }
        return null;
    }

    private isValidLine(line: string, fileType: FileAnalysis['fileType']): boolean {
        if (!line.trim() || line.length < 3) return false;

        try {
            const parsed = this.parseLine(line, fileType);
            return parsed !== null;
        } catch (error) {
            return false;
        }
    }

    private getPatternsForFileType(fileType: FileAnalysis['fileType']): RegExp[] {
        switch (fileType) {
            case 'CAN':
                return [
                    /^\d{2}:\d{2}:\d{2}\.\d{3}/, // timestamp
                    /ID:\s*\w+/i, // ID pattern
                    /^\w+\s+\w+\s+\w+/ // basic CAN format
                ];
            case 'GPS':
                return [
                    /\d+\.\d+,\s*\d+\.\d+/, // lat,lon
                    /latitud|longitud/i, // GPS keywords
                    /\d{4}-\d{2}-\d{2}/ // date format
                ];
            case 'ESTABILIDAD':
                return [
                    /ax|ay|az/i, // acceleration axes
                    /\d+\.\d+;\d+\.\d+;\d+\.\d+/, // acceleration values
                    /estabilidad/i
                ];
            case 'ROTATIVO':
                return [
                    /Estado/i,
                    /Rotativo/i,
                    /\d+;\d+;\d+/
                ];
            default:
                return [/.*/]; // Match anything
        }
    }

    private extractAnyValidData(line: string, fileType: FileAnalysis['fileType']): any | null {
        // Extraer cualquier dato que parezca válido
        const numbers = line.match(/\d+\.?\d*/g);
        const words = line.match(/[a-zA-Z]+/g);

        if (numbers && numbers.length >= 2) {
            return {
                timestamp: new Date(),
                numbers,
                words,
                type: fileType,
                raw: line
            };
        }

        return null;
    }
}

// Singleton instance
export const partialRecoveryService = new PartialRecoveryService();
