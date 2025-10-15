/**
 * 🔍 TIPOS: SESIÓN DETECTADA
 * 
 * Define la estructura de una sesión detectada en un archivo individual
 * antes de correlacionar con otros tipos de archivos.
 */

export interface DetectedSession {
    /** Número de sesión dentro del archivo (1-indexed) */
    sessionNumber: number;

    /** Tipo de archivo donde se detectó */
    fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';

    /** Timestamp de inicio de la sesión */
    startTime: Date;

    /** Timestamp de fin de la sesión */
    endTime: Date;

    /** Duración en segundos */
    durationSeconds: number;

    /** Rango de líneas en el archivo original */
    lineRange: {
        start: number;
        end: number;
    };

    /** Número de mediciones en esta sesión */
    measurementCount: number;

    /** Contenido de las líneas de esta sesión */
    lines: string[];

    /** Metadata adicional */
    metadata?: {
        /** Fecha del archivo (YYYYMMDD) */
        fileDate?: string;

        /** Nombre del archivo origen */
        fileName?: string;

        /** Gaps detectados dentro de la sesión (en segundos) */
        internalGaps?: number[];
    };
}

/**
 * Resultado de detección de sesiones en un archivo
 */
export interface SessionDetectionResult {
    /** Sesiones detectadas */
    sessions: DetectedSession[];

    /** Tipo de archivo analizado */
    fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';

    /** Total de líneas procesadas */
    totalLines: number;

    /** Líneas con timestamp válido */
    validLines: number;

    /** Líneas ignoradas (sin timestamp o inválidas) */
    ignoredLines: number;

    /** Errores encontrados */
    errors: string[];

    /** Warnings */
    warnings: string[];
}

