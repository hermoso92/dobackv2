/**
 * 📋 VALIDADOR DE ARCHIVOS PARA UPLOAD
 * 
 * Módulo centralizado para validación de archivos antes de upload
 * Sigue los protocolos definidos en PROTOCOLOS_SISTEMA_UPLOAD.md
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import { logger } from './logger';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Patrón de nombre de archivo obligatorio
 * Formato: TIPO_DOBACK###_YYYYMMDD.txt
 */
export const FILE_NAME_PATTERN = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d{3})_(\d{8})\.txt$/i;

/**
 * Tipos de archivo permitidos
 */
export const ALLOWED_FILE_TYPES = ['ESTABILIDAD', 'GPS', 'ROTATIVO', 'CAN'] as const;
export type FileType = typeof ALLOWED_FILE_TYPES[number];

/**
 * Límites de archivo
 */
export const FILE_LIMITS = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100 MB
    MAX_FILES_PER_UPLOAD: 20,
    MIN_FILE_SIZE: 100, // 100 bytes mínimo
} as const;

// ============================================================================
// TIPOS
// ============================================================================

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export interface FileInfo {
    fileName: string;
    fileType: FileType;
    vehicleId: string; // Ej: "DOBACK001"
    vehicleNumber: string; // Ej: "001"
    date: string; // Ej: "20250101"
    dateFormatted: string; // Ej: "2025-01-01"
    size: number;
}

export interface FileGroupInfo {
    vehicleId: string;
    date: string;
    files: {
        estabilidad?: FileInfo;
        gps?: FileInfo;
        rotativo?: FileInfo;
        can?: FileInfo;
    };
    totalSize: number;
    fileCount: number;
}

// ============================================================================
// FUNCIONES DE VALIDACIÓN
// ============================================================================

/**
 * ✅ Valida el nombre de un archivo
 */
export function validateFileName(fileName: string): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Verificar que no esté vacío
    if (!fileName || fileName.trim() === '') {
        result.valid = false;
        result.errors.push('El nombre del archivo está vacío');
        return result;
    }

    // Verificar extensión .txt
    if (!fileName.toLowerCase().endsWith('.txt')) {
        result.valid = false;
        result.errors.push('El archivo debe tener extensión .txt');
    }

    // Verificar patrón completo
    const match = fileName.match(FILE_NAME_PATTERN);
    if (!match) {
        result.valid = false;
        result.errors.push(
            `El nombre no cumple el formato: TIPO_DOBACK###_YYYYMMDD.txt\n` +
            `Ejemplo: ESTABILIDAD_DOBACK001_20250101.txt`
        );
        return result;
    }

    // Validar tipo
    const tipo = match[1]?.toUpperCase();
    if (!tipo || !ALLOWED_FILE_TYPES.includes(tipo as FileType)) {
        result.valid = false;
        result.errors.push(
            `Tipo de archivo inválido: ${tipo || 'desconocido'}\n` +
            `Tipos permitidos: ${ALLOWED_FILE_TYPES.join(', ')}`
        );
    }

    // Validar número de vehículo
    const vehicleNum = match[2];
    if (!vehicleNum || vehicleNum.length !== 3 || !/^\d{3}$/.test(vehicleNum)) {
        result.valid = false;
        result.errors.push(
            `Número de vehículo inválido: ${vehicleNum || 'faltante'}\n` +
            `Debe ser 3 dígitos (ej: 001, 002, 123)`
        );
    }

    // Validar fecha
    const dateStr = match[3];
    if (!dateStr || !isValidDate(dateStr)) {
        result.valid = false;
        result.errors.push(
            `Fecha inválida: ${dateStr || 'faltante'}\n` +
            `Formato esperado: YYYYMMDD (ej: 20250101)`
        );
    }

    return result;
}

/**
 * ✅ Valida el tamaño de un archivo
 */
export function validateFileSize(size: number): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    if (size < FILE_LIMITS.MIN_FILE_SIZE) {
        result.valid = false;
        result.errors.push(
            `Archivo demasiado pequeño: ${formatBytes(size)}\n` +
            `Tamaño mínimo: ${formatBytes(FILE_LIMITS.MIN_FILE_SIZE)}`
        );
    }

    if (size > FILE_LIMITS.MAX_FILE_SIZE) {
        result.valid = false;
        result.errors.push(
            `Archivo demasiado grande: ${formatBytes(size)}\n` +
            `Tamaño máximo: ${formatBytes(FILE_LIMITS.MAX_FILE_SIZE)}`
        );
    }

    // Advertencia si el archivo es muy pequeño (probable problema)
    if (size < 1024 && result.valid) {
        result.warnings.push(
            `Archivo muy pequeño (${formatBytes(size)}), verifica que contenga datos válidos`
        );
    }

    return result;
}

/**
 * ✅ Valida un archivo completo (nombre + tamaño)
 */
export function validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Validar nombre
    const nameValidation = validateFileName(file.name);
    result.errors.push(...nameValidation.errors);
    result.warnings.push(...nameValidation.warnings);

    if (!nameValidation.valid) {
        result.valid = false;
    }

    // Validar tamaño
    const sizeValidation = validateFileSize(file.size);
    result.errors.push(...sizeValidation.errors);
    result.warnings.push(...sizeValidation.warnings);

    if (!sizeValidation.valid) {
        result.valid = false;
    }

    return result;
}

/**
 * ✅ Valida múltiples archivos
 */
export function validateFiles(files: File[]): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    // Verificar que hay archivos
    if (!files || files.length === 0) {
        result.valid = false;
        result.errors.push('No se seleccionaron archivos');
        return result;
    }

    // Verificar límite de archivos
    if (files.length > FILE_LIMITS.MAX_FILES_PER_UPLOAD) {
        result.valid = false;
        result.errors.push(
            `Demasiados archivos: ${files.length}\n` +
            `Máximo permitido: ${FILE_LIMITS.MAX_FILES_PER_UPLOAD} archivos por upload`
        );
        return result;
    }

    // Validar cada archivo individualmente
    const fileValidations = new Map<string, ValidationResult>();

    for (const file of files) {
        const validation = validateFile(file);
        fileValidations.set(file.name, validation);

        if (!validation.valid) {
            result.valid = false;
            result.errors.push(`❌ ${file.name}:`);
            result.errors.push(...validation.errors.map(e => `   ${e}`));
        }

        if (validation.warnings.length > 0) {
            result.warnings.push(`⚠️ ${file.name}:`);
            result.warnings.push(...validation.warnings.map(w => `   ${w}`));
        }
    }

    // Verificar archivos duplicados
    const duplicates = findDuplicateFiles(files);
    if (duplicates.length > 0) {
        result.valid = false;
        result.errors.push('Archivos duplicados encontrados:');
        duplicates.forEach(name => {
            result.errors.push(`   - ${name}`);
        });
    }

    // Advertencia si hay muchos archivos
    if (files.length > 10) {
        result.warnings.push(
            `Subiendo ${files.length} archivos. El procesamiento puede tardar varios minutos.`
        );
    }

    return result;
}

/**
 * ✅ Valida agrupación de archivos (mismo vehículo + fecha)
 */
export function validateFileGroups(files: File[]): ValidationResult {
    const result: ValidationResult = {
        valid: true,
        errors: [],
        warnings: []
    };

    const groups = groupFiles(files);

    // Verificar grupos incompletos (solo informativo)
    for (const [, group] of Object.entries(groups)) {
        const fileTypes = Object.keys(group.files);

        if (fileTypes.length === 1) {
            result.warnings.push(
                `Grupo incompleto: ${group.vehicleId} ${group.date} - ` +
                `Solo tiene ${fileTypes.join(', ').toUpperCase()}`
            );
        }

        // Verificar grupos muy grandes (posible problema)
        if (group.totalSize > 200 * 1024 * 1024) { // 200 MB
            result.warnings.push(
                `Grupo grande: ${group.vehicleId} ${group.date} - ` +
                `Tamaño total: ${formatBytes(group.totalSize)}`
            );
        }
    }

    return result;
}

// ============================================================================
// FUNCIONES DE EXTRACCIÓN DE INFORMACIÓN
// ============================================================================

/**
 * ✅ Extrae información de un archivo
 */
export function extractFileInfo(file: File): FileInfo | null {
    const match = file.name.match(FILE_NAME_PATTERN);

    if (!match || !match[1] || !match[2] || !match[3]) {
        logger.warn('No se pudo extraer info del archivo', { fileName: file.name });
        return null;
    }

    const tipo = match[1].toUpperCase() as FileType;
    const vehicleNum = match[2];
    const dateStr = match[3];

    return {
        fileName: file.name,
        fileType: tipo,
        vehicleId: `DOBACK${vehicleNum}`,
        vehicleNumber: vehicleNum,
        date: dateStr,
        dateFormatted: formatDate(dateStr),
        size: file.size
    };
}

/**
 * ✅ Agrupa archivos por vehículo y fecha
 */
export function groupFiles(files: File[]): Record<string, FileGroupInfo> {
    const groups: Record<string, FileGroupInfo> = {};

    for (const file of files) {
        const info = extractFileInfo(file);
        if (!info) continue;

        const groupKey = `${info.vehicleId}_${info.date}`;

        if (!groups[groupKey]) {
            groups[groupKey] = {
                vehicleId: info.vehicleId,
                date: info.date,
                files: {},
                totalSize: 0,
                fileCount: 0
            };
        }

        const fileTypeKey = info.fileType.toLowerCase() as 'estabilidad' | 'gps' | 'rotativo' | 'can';
        groups[groupKey].files[fileTypeKey] = info;
        groups[groupKey].totalSize += info.size;
        groups[groupKey].fileCount++;
    }

    return groups;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Valida si una fecha es válida (formato YYYYMMDD)
 */
function isValidDate(dateStr: string): boolean {
    if (!/^\d{8}$/.test(dateStr)) {
        return false;
    }

    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));

    // Validar rangos básicos
    if (year < 2020 || year > 2030) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Validar fecha real
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;
}

/**
 * Formatea una fecha YYYYMMDD a YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length < 8) {
        return dateStr;
    }
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
}

/**
 * Formatea bytes a formato legible
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Encuentra archivos duplicados
 */
function findDuplicateFiles(files: File[]): string[] {
    const names = files.map(f => f.name);
    const duplicates: string[] = [];
    const seen = new Set<string>();

    for (const name of names) {
        if (seen.has(name)) {
            duplicates.push(name);
        } else {
            seen.add(name);
        }
    }

    return duplicates;
}

// ============================================================================
// EXPORTACIÓN DE UTILIDADES
// ============================================================================

/**
 * ✅ Valida y prepara archivos para upload
 * 
 * Esta es la función principal que debe usarse antes de cualquier upload
 */
export function validateAndPrepareFiles(files: File[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    validFiles: File[];
    invalidFiles: File[];
    groups: Record<string, FileGroupInfo>;
    summary: {
        totalFiles: number;
        validFiles: number;
        invalidFiles: number;
        totalGroups: number;
        totalSize: number;
    };
} {
    // Validación básica
    const basicValidation = validateFiles(files);

    // Separar archivos válidos e inválidos
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    for (const file of files) {
        const validation = validateFile(file);
        if (validation.valid) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file);
        }
    }

    // Agrupar archivos válidos
    const groups = groupFiles(validFiles);

    // Validar grupos
    const groupValidation = validateFileGroups(validFiles);

    // Calcular tamaño total
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
        valid: basicValidation.valid,
        errors: [...basicValidation.errors, ...groupValidation.errors],
        warnings: [...basicValidation.warnings, ...groupValidation.warnings],
        validFiles,
        invalidFiles,
        groups,
        summary: {
            totalFiles: files.length,
            validFiles: validFiles.length,
            invalidFiles: invalidFiles.length,
            totalGroups: Object.keys(groups).length,
            totalSize
        }
    };
}

/**
 * ✅ Genera un resumen legible de la validación
 */
export function generateValidationSummary(
    validation: ReturnType<typeof validateAndPrepareFiles>
): string {
    const lines: string[] = [];

    lines.push('📋 RESUMEN DE VALIDACIÓN\n');
    lines.push(`Archivos totales: ${validation.summary.totalFiles}`);
    lines.push(`Archivos válidos: ${validation.summary.validFiles}`);
    lines.push(`Archivos inválidos: ${validation.summary.invalidFiles}`);
    lines.push(`Grupos detectados: ${validation.summary.totalGroups}`);
    lines.push(`Tamaño total: ${formatBytes(validation.summary.totalSize)}\n`);

    if (validation.errors.length > 0) {
        lines.push('❌ ERRORES:');
        validation.errors.forEach(err => lines.push(`  ${err}`));
        lines.push('');
    }

    if (validation.warnings.length > 0) {
        lines.push('⚠️ ADVERTENCIAS:');
        validation.warnings.forEach(warn => lines.push(`  ${warn}`));
        lines.push('');
    }

    if (Object.keys(validation.groups).length > 0) {
        lines.push('📦 GRUPOS DETECTADOS:');
        Object.values(validation.groups).forEach(group => {
            const fileTypes = Object.keys(group.files).map(t => t.toUpperCase()).join(', ');
            lines.push(`  ${group.vehicleId} ${group.date}: ${fileTypes} (${formatBytes(group.totalSize)})`);
        });
    }

    return lines.join('\n');
}

