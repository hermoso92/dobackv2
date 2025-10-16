/**
 * 📊 TIPOS: RESULTADO DE PROCESAMIENTO
 * 
 * Define la estructura del resultado final del procesamiento de archivos.
 */

export interface ProcessingResult {
    /** Archivos procesados */
    filesProcessed: number;

    /** Sesiones creadas en BD */
    sesionesCreadas: number;

    /** Sesiones omitidas (duplicadas) */
    sesionesOmitidas: number;

    /** IDs de las sesiones creadas */
    sessionIds: string[];

    /** ✅ NUEVO: Detalles por sesión con archivos fuente */
    sessionDetails: SessionDetail[];

    /** Estadísticas de datos procesados */
    estadisticas: {
        /** GPS válido */
        gpsValido: number;

        /** GPS interpolado */
        gpsInterpolado: number;

        /** GPS sin señal */
        gpsSinSenal: number;

        /** Estabilidad válida */
        estabilidadValida: number;

        /** Rotativo válido */
        rotativoValido: number;

        /** Total de mediciones guardadas */
        totalMediciones: number;
    };

    /** Detalles por vehículo */
    vehicleDetails?: {
        vehicleId: string;
        vehicleIdentifier: string;
        sessionsCreated: number;
    }[];

    /** Archivos con problemas */
    problemas: {
        archivo: string;
        error: string;
    }[];

    /** Warnings */
    warnings: string[];

    /** Tiempo de procesamiento (ms) */
    processingTimeMs?: number;
}

/**
 * Información detallada de un archivo individual
 */
export interface FileDetail {
    /** Nombre del archivo */
    fileName: string;

    /** Número de sesión detectada en el archivo */
    sessionNumber: number;

    /** Hora de inicio en el archivo */
    startTime: string;

    /** Hora de fin en el archivo */
    endTime: string;

    /** Duración en segundos */
    durationSeconds: number;

    /** Duración formateada (HH:MM:SS) */
    durationFormatted: string;

    /** Número de mediciones en el archivo */
    measurements: number;
}

/**
 * Detalle de una sesión individual con información completa
 */
export interface SessionDetail {
    sessionNumber: number;
    sessionId: string;
    startTime: string;
    endTime: string;

    /** ✅ NUEVO: Duración total en segundos */
    durationSeconds: number;

    /** ✅ NUEVO: Duración formateada (HH:MM:SS) */
    durationFormatted: string;

    measurements: number;
    status: 'CREADA' | 'OMITIDA';
    reason: string;

    /** ✅ NUEVO: Detalles por archivo con horarios y duraciones */
    estabilidad?: FileDetail;
    gps?: FileDetail;
    rotativo?: FileDetail;

    /** @deprecated Usar estabilidad.fileName, gps.fileName, rotativo.fileName */
    archivos: {
        estabilidad: string | null;
        gps: string | null;
        rotativo: string | null;
    };
}

/**
 * Detalle de procesamiento por archivo
 */
export interface FileProcessingDetail {
    fileName: string;
    fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO';
    fileSize: number;
    totalLines: number;
    sessionsDetected: number;
    sessionsCreated: number;
    sessionsSkipped: number;
    sessionDetails: SessionDetail[]; // ✅ Añadido
    measurements: number;
    errors: string[];
    warnings: string[];
    date?: string;
    statistics?: {
        gpsValido?: number;
        gpsInterpolado?: number;
        gpsSinSenal?: number;
        estabilidadValida?: number;
        rotativoValido?: number;
    };
}

/**
 * Resultado de procesamiento por vehículo
 */
export interface VehicleProcessingResult {
    vehicle: string;
    savedSessions: number;
    skippedSessions: number;
    filesProcessed: number;
    files: FileProcessingDetail[];
    errors: string[];
}

