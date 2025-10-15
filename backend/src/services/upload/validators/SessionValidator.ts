/**
 * ✅ VALIDADOR: SESIÓN COMPLETA
 * 
 * Valida que una sesión correlacionada cumple con todos los criterios
 * definidos en las reglas de correlación.
 */

import { createLogger } from '../../../utils/logger';
import { SESSION_VALIDITY_CRITERIA } from '../SessionCorrelationRules';
import { CorrelatedSession } from '../types/CorrelatedSession';

const logger = createLogger('SessionValidator');

export class SessionValidator {
    /**
     * Valida una sesión correlacionada completa
     */
    static validate(session: CorrelatedSession): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Validar tipos requeridos MÍNIMOS
        // NOTA: SessionValidator valida la estructura básica.
        // La configuración del usuario (GPS obligatorio, etc.) se aplica después.

        if (!session.estabilidad) {
            errors.push('Falta archivo ESTABILIDAD (requerido)');
        }

        if (!session.rotativo) {
            errors.push('Falta archivo ROTATIVO (requerido)');
        }

        // GPS es opcional a nivel de SessionValidator
        // La configuración del usuario decide si es obligatorio
        if (!session.gps) {
            warnings.push('GPS no disponible');
        }

        // 2. Validar duración mínima
        if (session.durationSeconds < SESSION_VALIDITY_CRITERIA.minimumDurationSeconds) {
            errors.push(`Duración insuficiente: ${session.durationSeconds}s < ${SESSION_VALIDITY_CRITERIA.minimumDurationSeconds}s`);
        }

        // 3. Validar timestamps
        if (isNaN(session.startTime.getTime())) {
            errors.push('Timestamp de inicio inválido');
        }

        if (isNaN(session.endTime.getTime())) {
            errors.push('Timestamp de fin inválido');
        }

        if (session.startTime >= session.endTime) {
            errors.push('Timestamp de inicio debe ser anterior al de fin');
        }

        // 4. Validar estadísticas de correlación
        const stats = session.correlationStats;

        if (stats.estabilidadGpsDiff !== undefined && stats.estabilidadGpsDiff > 120) {
            warnings.push(`Diferencia ESTABILIDAD-GPS excede 120s: ${stats.estabilidadGpsDiff}s`);
        }

        if (stats.estabilidadRotativoDiff !== undefined && stats.estabilidadRotativoDiff > 120) {
            warnings.push(`Diferencia ESTABILIDAD-ROTATIVO excede 120s: ${stats.estabilidadRotativoDiff}s`);
        }

        // 5. Validar calidad de GPS (si existe)
        if (session.gps && session.qualityMetrics) {
            const gpsJumps = session.qualityMetrics.gpsJumpsCount || 0;
            if (gpsJumps > 10) {
                warnings.push(`GPS con ${gpsJumps} saltos detectados (puede ser inestable)`);
            }

            const gpsValidPercent = session.qualityMetrics.gpsValidPercent || 0;
            if (gpsValidPercent < 50) {
                warnings.push(`Solo ${gpsValidPercent.toFixed(1)}% de GPS válido`);
            }
        }

        const isValid = errors.length === 0;

        if (!isValid) {
            logger.warn(`Sesión ${session.sessionNumber} inválida: ${errors.join(', ')}`);
        }

        if (warnings.length > 0) {
            logger.info(`Sesión ${session.sessionNumber} warnings: ${warnings.join(', ')}`);
        }

        return { isValid, errors, warnings };
    }

    /**
     * Valida un batch de sesiones y retorna solo las válidas
     */
    static validateBatch(sessions: CorrelatedSession[]): {
        validSessions: CorrelatedSession[];
        invalidSessions: CorrelatedSession[];
        totalWarnings: number;
    } {
        const validSessions: CorrelatedSession[] = [];
        const invalidSessions: CorrelatedSession[] = [];
        let totalWarnings = 0;

        for (const session of sessions) {
            const result = this.validate(session);

            if (result.isValid) {
                validSessions.push(session);
            } else {
                invalidSessions.push(session);
            }

            totalWarnings += result.warnings.length;
        }

        logger.info(`Validación batch: ${validSessions.length} válidas, ${invalidSessions.length} inválidas, ${totalWarnings} warnings`);

        return { validSessions, invalidSessions, totalWarnings };
    }
}

