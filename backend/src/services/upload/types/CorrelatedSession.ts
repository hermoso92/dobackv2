/**
 * 🔗 TIPOS: SESIÓN CORRELACIONADA
 * 
 * Define la estructura de una sesión correlacionada que agrupa
 * ESTABILIDAD + GPS + ROTATIVO del mismo período operativo.
 */

import { DetectedSession } from './DetectedSession';

export interface CorrelatedSession {
    /** Número de sesión correlacionada (secuencial por día) */
    sessionNumber: number;

    /** Timestamp de inicio (el más temprano de los 3 tipos) */
    startTime: Date;

    /** Timestamp de fin (el más tardío de los 3 tipos) */
    endTime: Date;

    /** Duración total en segundos */
    durationSeconds: number;

    /** Sesión de ESTABILIDAD correlacionada */
    estabilidad: DetectedSession | null;

    /** Sesión de GPS correlacionada */
    gps: DetectedSession | null;

    /** Sesión de ROTATIVO correlacionada */
    rotativo: DetectedSession | null;

    /** ¿La sesión es válida según los criterios? */
    isValid: boolean;

    /** Razón de invalidez (si aplica) */
    invalidReason?: string;

    /** Observaciones sobre la sesión */
    observations: string[];

    /** Estadísticas de correlación */
    correlationStats: {
        /** Diferencia de tiempo entre ESTABILIDAD y GPS (segundos) */
        estabilidadGpsDiff?: number;

        /** Diferencia de tiempo entre ESTABILIDAD y ROTATIVO (segundos) */
        estabilidadRotativoDiff?: number;

        /** Diferencia de tiempo entre GPS y ROTATIVO (segundos) */
        gpsRotativoDiff?: number;

        /** ¿GPS está presente? */
        hasGPS: boolean;

        /** ¿ESTABILIDAD está presente? */
        hasEstabilidad: boolean;

        /** ¿ROTATIVO está presente? */
        hasRotativo: boolean;
    };

    /** Métricas de calidad */
    qualityMetrics?: {
        /** Porcentaje de GPS válido */
        gpsValidPercent?: number;

        /** Puntos GPS interpolados */
        gpsInterpolatedCount?: number;

        /** Puntos GPS sin señal */
        gpsNoSignalCount?: number;

        /** Saltos GPS detectados */
        gpsJumpsCount?: number;
    };
}

/**
 * Resultado de correlación de sesiones
 */
export interface SessionCorrelationResult {
    /** Sesiones correlacionadas */
    correlatedSessions: CorrelatedSession[];

    /** Total de sesiones detectadas (antes de correlación) */
    totalDetected: {
        estabilidad: number;
        gps: number;
        rotativo: number;
    };

    /** Total de sesiones correlacionadas */
    totalCorrelated: number;

    /** Sesiones válidas */
    validSessions: number;

    /** Sesiones inválidas */
    invalidSessions: number;

    /** Sesiones sin GPS */
    sessionsWithoutGPS: number;

    /** Estadísticas de correlación */
    stats: {
        /** Diferencia promedio de timestamps (segundos) */
        avgTimeDiff: number;

        /** Máxima diferencia de timestamps (segundos) */
        maxTimeDiff: number;

        /** Mínima diferencia de timestamps (segundos) */
        minTimeDiff: number;
    };

    /** Errores durante correlación */
    errors: string[];

    /** Warnings */
    warnings: string[];
}

