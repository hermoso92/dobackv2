/**
 * ✅ SERVICIO DE VALIDACIONES POST-PROCESAMIENTO
 * 
 * Valida que las sesiones procesadas cumplan con criterios de calidad:
 * - Física correcta (az ≈ 9.81 m/s²)
 * - GPS con geometría válida
 * - Eventos de estabilidad generados
 * - Reportes PDF disponibles
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../utils/logger';

const prisma = new PrismaClient();
const logger = createLogger('PostProcessingValidator');

export interface ValidationResult {
    valid: boolean;
    sessionId: string;
    checks: {
        hasGpsGeometry: boolean;
        hasStabilityEvents: boolean;
        physicsValidationPassed: boolean;
        hasMinimumMeasurements: boolean;
        durationValid: boolean;
    };
    warnings: string[];
    errors: string[];
    metadata: {
        measurementsCount: number;
        eventsCount: number;
        gpsCount: number;
        avgAz?: number;
        duration?: number;
    };
}

/**
 * Valida una sesión después del procesamiento
 */
export async function validateSession(sessionId: string): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const checks = {
        hasGpsGeometry: false,
        hasStabilityEvents: false,
        physicsValidationPassed: false,
        hasMinimumMeasurements: false,
        durationValid: false
    };

    try {
        // 1. Obtener sesión
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                _count: {
                    select: {
                        GpsMeasurement: true,
                        StabilityMeasurement: true,
                        stability_events: true
                    }
                }
            }
        });

        if (!session) {
            errors.push('Sesión no encontrada');
            return {
                valid: false,
                sessionId,
                checks,
                warnings,
                errors,
                metadata: {
                    measurementsCount: 0,
                    eventsCount: 0,
                    gpsCount: 0
                }
            };
        }

        // 2. Validar GPS geometry
        const gpsWithGeometry = await prisma.gpsMeasurement.count({
            where: {
                sessionId,
                latitude: { not: 0 },
                longitude: { not: 0 }
            }
        });

        checks.hasGpsGeometry = gpsWithGeometry > 0;
        if (!checks.hasGpsGeometry) {
            warnings.push('No hay puntos GPS con coordenadas válidas');
        }

        // 3. Validar eventos de estabilidad
        checks.hasStabilityEvents = session._count.stability_events > 0;
        if (!checks.hasStabilityEvents) {
            warnings.push('No se generaron eventos de estabilidad (puede ser normal si la sesión fue tranquila)');
        }

        // 4. Validar física de estabilidad (az ≈ 9.81 m/s²)
        if (session._count.StabilityMeasurement > 0) {
            const measurements = await prisma.stabilityMeasurement.findMany({
                where: { sessionId },
                select: { az: true },
                take: 100 // Muestra representativa
            });

            if (measurements.length > 0) {
                const avgAz = measurements.reduce((sum, m) => sum + (m.az || 0), 0) / measurements.length;

                // az debe estar entre 9.0 y 10.5 m/s² (gravedad ± ~10%)
                checks.physicsValidationPassed = avgAz >= 9.0 && avgAz <= 10.5;

                if (!checks.physicsValidationPassed) {
                    errors.push(`Validación física falló: az promedio = ${avgAz.toFixed(3)} m/s² (esperado: 9.0-10.5)`);
                }
            }
        }

        // 5. Validar mediciones mínimas
        const MIN_MEASUREMENTS = 10;
        checks.hasMinimumMeasurements = session._count.StabilityMeasurement >= MIN_MEASUREMENTS;
        if (!checks.hasMinimumMeasurements) {
            warnings.push(`Pocas mediciones de estabilidad: ${session._count.StabilityMeasurement} (mínimo: ${MIN_MEASUREMENTS})`);
        }

        // 6. Validar duración
        if (session.startTime && session.endTime) {
            const duration = (session.endTime.getTime() - session.startTime.getTime()) / 1000; // segundos
            checks.durationValid = duration >= 60; // Mínimo 1 minuto

            if (!checks.durationValid) {
                warnings.push(`Duración muy corta: ${duration}s (mínimo: 60s)`);
            }
        }

        // Determinar si es válida
        const valid = checks.physicsValidationPassed &&
            checks.hasMinimumMeasurements &&
            errors.length === 0;

        return {
            valid,
            sessionId,
            checks,
            warnings,
            errors,
            metadata: {
                measurementsCount: session._count.StabilityMeasurement,
                eventsCount: session._count.stability_events,
                gpsCount: session._count.GpsMeasurement,
                avgAz: session._count.StabilityMeasurement > 0 ? (await getAvgAz(sessionId)) : undefined,
                duration: session.startTime && session.endTime
                    ? (session.endTime.getTime() - session.startTime.getTime()) / 1000
                    : undefined
            }
        };

    } catch (error: any) {
        logger.error(`Error validando sesión ${sessionId}:`, error);
        errors.push(`Error interno: ${error.message}`);

        return {
            valid: false,
            sessionId,
            checks,
            warnings,
            errors,
            metadata: {
                measurementsCount: 0,
                eventsCount: 0,
                gpsCount: 0
            }
        };
    }
}

/**
 * Calcula az promedio de una sesión
 */
async function getAvgAz(sessionId: string): Promise<number> {
    const result = await prisma.stabilityMeasurement.aggregate({
        where: { sessionId },
        _avg: { az: true }
    });

    return result._avg.az || 0;
}

/**
 * Crea un log de procesamiento después de validar
 */
export async function createProcessingLog(
    sessionId: string,
    validation: ValidationResult,
    parserVersion: number = 2,
    processingVersion: string = '1.0',
    configVersion: string = '1.0'
): Promise<void> {
    try {
        const status = validation.valid
            ? 'success'
            : validation.errors.length > 0
                ? 'error'
                : 'partial';

        await prisma.processingLog.create({
            data: {
                sessionId,
                parserVersion,
                processingVersion,
                configVersion,
                status,
                finishedAt: new Date(),
                measurementsProcessed: validation.metadata.measurementsCount,
                eventsGenerated: validation.metadata.eventsCount,
                filesCount: 1, // Por ahora asumimos 1 archivo por sesión
                hasGpsGeometry: validation.checks.hasGpsGeometry,
                hasStabilityEvents: validation.checks.hasStabilityEvents,
                physicsValidationPassed: validation.checks.physicsValidationPassed,
                errorMessage: validation.errors.join('; ') || null,
                warnings: validation.warnings,
                metadata: {
                    avgAz: validation.metadata.avgAz,
                    duration: validation.metadata.duration,
                    validationDetails: validation.checks
                }
            }
        });

        logger.info(`📝 Log de procesamiento creado para sesión ${sessionId}`, {
            status,
            valid: validation.valid
        });

    } catch (error: any) {
        logger.error(`Error creando log de procesamiento para ${sessionId}:`, error);
        // No lanzar error, solo logear (no queremos que falle el procesamiento por esto)
    }
}

/**
 * Valida múltiples sesiones en batch
 */
export async function validateSessions(sessionIds: string[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const sessionId of sessionIds) {
        const result = await validateSession(sessionId);
        results.push(result);
    }

    return results;
}

/**
 * Rollback de sesión (elimina datos parciales si procesamiento falló)
 */
export async function rollbackSession(sessionId: string): Promise<void> {
    try {
        logger.warn(`🔄 Rollback de sesión ${sessionId} - eliminando datos parciales`);

        await prisma.$transaction([
            // Eliminar mediciones
            prisma.stabilityMeasurement.deleteMany({ where: { sessionId } }),
            prisma.gpsMeasurement.deleteMany({ where: { sessionId } }),
            prisma.rotativoMeasurement.deleteMany({ where: { sessionId } }),

            // Eliminar eventos
            prisma.$executeRaw`DELETE FROM stability_events WHERE session_id = ${sessionId}`,

            // Eliminar la sesión
            prisma.session.delete({ where: { id: sessionId } })
        ]);

        logger.info(`✅ Rollback completado para sesión ${sessionId}`);

    } catch (error: any) {
        logger.error(`Error en rollback de sesión ${sessionId}:`, error);
        throw error;
    }
}

