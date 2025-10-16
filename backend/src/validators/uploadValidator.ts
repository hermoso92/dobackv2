/**
 * 📋 VALIDADOR DE ARCHIVOS BACKEND
 * 
 * Validación centralizada en el backend para archivos Doback
 * Complementa la validación del frontend con verificaciones adicionales
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('UploadValidator');

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Patrón de nombre de archivo (case insensitive)
 */
export const FILE_NAME_PATTERN = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d{3})_(\d{8})\.txt$/i;

/**
 * Tipos de archivo permitidos
 */
export const ALLOWED_FILE_TYPES = ['ESTABILIDAD', 'GPS', 'ROTATIVO', 'CAN'] as const;
export type FileType = typeof ALLOWED_FILE_TYPES[number];

/**
 * Límites
 */
export const LIMITS = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
    MAX_FILES_PER_UPLOAD: 20,
    MIN_FILE_SIZE: 100,
    MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * Patrones de cabecera esperados por tipo de archivo
 */
export const EXPECTED_HEADERS: Record<string, RegExp> = {
    ESTABILIDAD: /ESTABILIDAD;/i,
    GPS: /GPS;/i,
    ROTATIVO: /ROTATIVO;/i,
    CAN: /CAN;/i,
};

// ============================================================================
// TIPOS
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
}

export interface ParsedFileName {
    original: string;
    type: FileType;
    vehicleId: string; // "DOBACK001"
    vehicleNumber: string; // "001"
    date: string; // "20250101"
    dateObject: Date;
}

// ============================================================================
// VALIDACIÓN DE NOMBRE DE ARCHIVO
// ============================================================================

/**
 * ✅ Parsea el nombre del archivo extrayendo toda la información
 */
export function parseFileName(fileName: string): ParsedFileName | null {
    const match = fileName.match(FILE_NAME_PATTERN);

    if (!match) {
        logger.warn('Formato de archivo inválido', { fileName });
        return null;
    }

    const [, tipo, vehicleNum, dateStr] = match;

    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    return {
        original: fileName,
        type: tipo.toUpperCase() as FileType,
        vehicleId: `DOBACK${vehicleNum}`,
        vehicleNumber: vehicleNum,
        date: dateStr,
        dateObject: new Date(year, month - 1, day),
    };
}

/**
 * ✅ Valida el nombre del archivo
 */
export function validateFileName(fileName: string): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
    };

    // Verificar vacío
    if (!fileName || fileName.trim() === '') {
        result.valid = false;
        result.errors.push({
            field: 'fileName',
            message: 'El nombre del archivo está vacío',
            code: 'EMPTY_FILENAME',
        });
        return result;
    }

    // Verificar longitud
    if (fileName.length > LIMITS.MAX_FILENAME_LENGTH) {
        result.valid = false;
        result.errors.push({
            field: 'fileName',
            message: `Nombre de archivo demasiado largo (${fileName.length} caracteres)`,
            code: 'FILENAME_TOO_LONG',
        });
    }

    // Verificar extensión
    if (!fileName.toLowerCase().endsWith('.txt')) {
        result.valid = false;
        result.errors.push({
            field: 'fileName',
            message: 'El archivo debe tener extensión .txt',
            code: 'INVALID_EXTENSION',
        });
    }

    // Verificar patrón completo
    const parsed = parseFileName(fileName);
    if (!parsed) {
        result.valid = false;
        result.errors.push({
            field: 'fileName',
            message: 'El nombre no cumple el formato: TIPO_DOBACK###_YYYYMMDD.txt',
            code: 'INVALID_FORMAT',
        });
        return result;
    }

    // Verificar fecha válida
    if (isNaN(parsed.dateObject.getTime())) {
        result.valid = false;
        result.errors.push({
            field: 'date',
            message: `Fecha inválida: ${parsed.date}`,
            code: 'INVALID_DATE',
        });
    }

    // Advertencia si la fecha es muy antigua o futura
    const now = new Date();
    const yearsDiff = (now.getFullYear() - parsed.dateObject.getFullYear());

    if (yearsDiff > 5) {
        result.warnings.push(`Fecha muy antigua: ${parsed.dateObject.toISOString()}`);
    }

    if (parsed.dateObject > now) {
        result.warnings.push(`Fecha futura: ${parsed.dateObject.toISOString()}`);
    }

    return result;
}

// ============================================================================
// VALIDACIÓN DE CONTENIDO
// ============================================================================

/**
 * ✅ Valida el contenido del archivo (cabecera y estructura básica)
 */
export function validateFileContent(
    fileName: string,
    content: string | Buffer
): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
    };

    // Convertir a string si es Buffer
    const contentStr = typeof content === 'string' ? content : content.toString('utf8');

    // Verificar que no esté vacío
    if (!contentStr || contentStr.trim() === '') {
        result.valid = false;
        result.errors.push({
            field: 'content',
            message: 'El archivo está vacío',
            code: 'EMPTY_FILE',
        });
        return result;
    }

    // Parsear nombre para obtener tipo
    const parsed = parseFileName(fileName);
    if (!parsed) {
        result.valid = false;
        result.errors.push({
            field: 'fileName',
            message: 'No se pudo determinar el tipo de archivo',
            code: 'UNKNOWN_TYPE',
        });
        return result;
    }

    // Verificar cabecera según tipo
    const lines = contentStr.split('\n');

    if (lines.length < 2) {
        result.valid = false;
        result.errors.push({
            field: 'content',
            message: 'El archivo no tiene suficientes líneas (mínimo 2)',
            code: 'INSUFFICIENT_LINES',
        });
        return result;
    }

    // Verificar primera línea (cabecera metadatos)
    const firstLine = lines[0].trim();
    const expectedHeader = EXPECTED_HEADERS[parsed.type];

    if (expectedHeader && !expectedHeader.test(firstLine)) {
        result.valid = false;
        result.errors.push({
            field: 'header',
            message: `Cabecera inválida para tipo ${parsed.type}. Esperado: ${expectedHeader}`,
            code: 'INVALID_HEADER',
        });
    }

    // Verificar segunda línea (cabecera de columnas)
    const secondLine = lines[1].trim();
    if (secondLine === '') {
        result.valid = false;
        result.errors.push({
            field: 'header',
            message: 'Falta la línea de cabecera de columnas',
            code: 'MISSING_COLUMN_HEADER',
        });
    }

    // Advertencia si hay muy pocas mediciones
    const dataLines = lines.slice(2).filter(l => l.trim() !== '');
    if (dataLines.length < 10) {
        result.warnings.push(`Archivo con muy pocas mediciones: ${dataLines.length} líneas`);
    }

    // Validar encoding UTF-8
    try {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const encoded = encoder.encode(contentStr.substring(0, 1000)); // Verificar primeros 1000 chars
        decoder.decode(encoded);
    } catch (error) {
        result.errors.push({
            field: 'encoding',
            message: 'El archivo no está en formato UTF-8 válido',
            code: 'INVALID_ENCODING',
        });
        result.valid = false;
    }

    return result;
}

// ============================================================================
// VALIDACIÓN DE TAMAÑO
// ============================================================================

/**
 * ✅ Valida el tamaño del archivo
 */
export function validateFileSize(size: number): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
    };

    if (size < LIMITS.MIN_FILE_SIZE) {
        result.valid = false;
        result.errors.push({
            field: 'size',
            message: `Archivo demasiado pequeño: ${size} bytes (mínimo: ${LIMITS.MIN_FILE_SIZE} bytes)`,
            code: 'FILE_TOO_SMALL',
        });
    }

    if (size > LIMITS.MAX_FILE_SIZE) {
        result.valid = false;
        result.errors.push({
            field: 'size',
            message: `Archivo demasiado grande: ${size} bytes (máximo: ${LIMITS.MAX_FILE_SIZE} bytes)`,
            code: 'FILE_TOO_LARGE',
        });
    }

    // Advertencia para archivos muy grandes
    if (size > 50 * 1024 * 1024 && result.valid) {
        result.warnings.push(`Archivo grande (${Math.round(size / 1024 / 1024)} MB), el procesamiento puede tardar`);
    }

    return result;
}

// ============================================================================
// VALIDACIÓN DE MÚLTIPLES ARCHIVOS
// ============================================================================

/**
 * ✅ Valida un conjunto de archivos
 */
export function validateMultipleFiles(
    files: Array<{ originalname: string; size: number; buffer?: Buffer }>
): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
    };

    // Verificar que hay archivos
    if (!files || files.length === 0) {
        result.valid = false;
        result.errors.push({
            field: 'files',
            message: 'No se proporcionaron archivos',
            code: 'NO_FILES',
        });
        return result;
    }

    // Verificar límite de archivos
    if (files.length > LIMITS.MAX_FILES_PER_UPLOAD) {
        result.valid = false;
        result.errors.push({
            field: 'files',
            message: `Demasiados archivos: ${files.length} (máximo: ${LIMITS.MAX_FILES_PER_UPLOAD})`,
            code: 'TOO_MANY_FILES',
        });
        return result;
    }

    // Validar cada archivo
    const fileNames = new Set<string>();
    let totalSize = 0;

    for (const file of files) {
        // Verificar duplicados
        if (fileNames.has(file.originalname)) {
            result.valid = false;
            result.errors.push({
                field: 'files',
                message: `Archivo duplicado: ${file.originalname}`,
                code: 'DUPLICATE_FILE',
            });
            continue;
        }
        fileNames.add(file.originalname);

        // Validar nombre
        const nameValidation = validateFileName(file.originalname);
        if (!nameValidation.valid) {
            result.valid = false;
            nameValidation.errors.forEach(err => {
                result.errors.push({
                    ...err,
                    field: `files.${file.originalname}.${err.field}`,
                });
            });
        }
        result.warnings.push(...nameValidation.warnings);

        // Validar tamaño
        const sizeValidation = validateFileSize(file.size);
        if (!sizeValidation.valid) {
            result.valid = false;
            sizeValidation.errors.forEach(err => {
                result.errors.push({
                    ...err,
                    field: `files.${file.originalname}.${err.field}`,
                });
            });
        }
        result.warnings.push(...sizeValidation.warnings);

        // Validar contenido si está disponible
        if (file.buffer) {
            const contentValidation = validateFileContent(file.originalname, file.buffer);
            if (!contentValidation.valid) {
                result.valid = false;
                contentValidation.errors.forEach(err => {
                    result.errors.push({
                        ...err,
                        field: `files.${file.originalname}.${err.field}`,
                    });
                });
            }
            result.warnings.push(...contentValidation.warnings);
        }

        totalSize += file.size;
    }

    // Advertencia si el tamaño total es muy grande
    if (totalSize > 200 * 1024 * 1024) {
        result.warnings.push(
            `Tamaño total grande: ${Math.round(totalSize / 1024 / 1024)} MB, el procesamiento puede tardar varios minutos`
        );
    }

    return result;
}

// ============================================================================
// VALIDACIÓN DE AUTENTICACIÓN
// ============================================================================

/**
 * ✅ Valida que el request tiene autenticación válida
 */
export function validateAuthentication(
    userId?: string,
    organizationId?: string
): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: [],
    };

    if (!userId || userId.trim() === '') {
        result.valid = false;
        result.errors.push({
            field: 'userId',
            message: 'Usuario no autenticado',
            code: 'MISSING_USER_ID',
        });
    }

    if (!organizationId || organizationId.trim() === '') {
        result.valid = false;
        result.errors.push({
            field: 'organizationId',
            message: 'Organización no identificada',
            code: 'MISSING_ORGANIZATION_ID',
        });
    }

    return result;
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE VALIDACIÓN
// ============================================================================

/**
 * ✅ Función principal que ejecuta todas las validaciones necesarias
 * 
 * Esta es la función que debe llamarse en el endpoint de upload
 */
export function validateUploadRequest(params: {
    files: Array<{ originalname: string; size: number; buffer?: Buffer }>;
    userId?: string;
    organizationId?: string;
}): {
    valid: boolean;
    errors: ValidationError[];
    warnings: string[];
    summary: {
        totalFiles: number;
        totalSize: number;
        validFiles: number;
        invalidFiles: number;
    };
} {
    const allErrors: ValidationError[] = [];
    const allWarnings: string[] = [];
    let valid = true;

    // 1. Validar autenticación
    const authValidation = validateAuthentication(params.userId, params.organizationId);
    if (!authValidation.valid) {
        valid = false;
        allErrors.push(...authValidation.errors);
    }
    allWarnings.push(...authValidation.warnings);

    // 2. Validar archivos
    const filesValidation = validateMultipleFiles(params.files);
    if (!filesValidation.valid) {
        valid = false;
        allErrors.push(...filesValidation.errors);
    }
    allWarnings.push(...filesValidation.warnings);

    // 3. Calcular resumen
    const totalSize = params.files.reduce((sum, f) => sum + f.size, 0);
    const validFiles = params.files.filter(f => {
        const nameValid = validateFileName(f.originalname).valid;
        const sizeValid = validateFileSize(f.size).valid;
        return nameValid && sizeValid;
    }).length;

    const summary = {
        totalFiles: params.files.length,
        totalSize,
        validFiles,
        invalidFiles: params.files.length - validFiles,
    };

    // Log del resultado
    if (valid) {
        logger.info('Validación exitosa', summary);
    } else {
        logger.warn('Validación fallida', { errors: allErrors, summary });
    }

    return {
        valid,
        errors: allErrors,
        warnings: allWarnings,
        summary,
    };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * ✅ Formatea errores de validación para respuesta HTTP
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
        return '';
    }

    return errors
        .map(err => `${err.field}: ${err.message}`)
        .join('\n');
}

/**
 * ✅ Genera un resumen legible de validación
 */
export function generateValidationSummary(
    result: ReturnType<typeof validateUploadRequest>
): string {
    const lines: string[] = [];

    lines.push('📋 VALIDACIÓN DE UPLOAD');
    lines.push(`Estado: ${result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    lines.push(`Archivos totales: ${result.summary.totalFiles}`);
    lines.push(`Archivos válidos: ${result.summary.validFiles}`);
    lines.push(`Archivos inválidos: ${result.summary.invalidFiles}`);
    lines.push(`Tamaño total: ${Math.round(result.summary.totalSize / 1024 / 1024)} MB`);

    if (result.errors.length > 0) {
        lines.push('\n❌ ERRORES:');
        result.errors.forEach(err => {
            lines.push(`  [${err.code}] ${err.field}: ${err.message}`);
        });
    }

    if (result.warnings.length > 0) {
        lines.push('\n⚠️ ADVERTENCIAS:');
        result.warnings.forEach(warn => {
            lines.push(`  ${warn}`);
        });
    }

    return lines.join('\n');
}

