/**
 * 🔗 CORRELACIONADOR TEMPORAL
 * 
 * Correlaciona sesiones de diferentes tipos (ESTABILIDAD, GPS, ROTATIVO)
 * basándose en proximidad temporal de sus timestamps de inicio.
 * 
 * REGLA: Dos sesiones se correlacionan si |inicio₁ - inicio₂| ≤ 120 segundos
 */

import { createLogger } from '../../utils/logger';
import { CORRELATION_TIME_THRESHOLD_SECONDS, END_TIME_STRATEGY, START_TIME_STRATEGY } from './SessionCorrelationRules';
import { CorrelatedSession, SessionCorrelationResult } from './types/CorrelatedSession';
import { DetectedSession } from './types/DetectedSession';

const logger = createLogger('TemporalCorrelator');

export class TemporalCorrelator {
    /**
     * Correlaciona sesiones de diferentes tipos
     * 
     * ✅ NUEVA VERSIÓN: Fusiona fragmentos GPS que caen dentro de sesión ESTABILIDAD
     * 
     * @param estabilidadSessions Sesiones detectadas en archivo ESTABILIDAD
     * @param gpsSessions Sesiones detectadas en archivo GPS
     * @param rotativoSessions Sesiones detectadas en archivo ROTATIVO
     * @returns Resultado de correlación con sesiones agrupadas
     */
    static correlateSessions(
        estabilidadSessions: DetectedSession[],
        gpsSessions: DetectedSession[],
        rotativoSessions: DetectedSession[]
    ): SessionCorrelationResult {
        logger.info(`Correlacionando: EST=${estabilidadSessions.length}, GPS=${gpsSessions.length}, ROT=${rotativoSessions.length}`);

        const correlatedSessions: CorrelatedSession[] = [];
        const usedGPS = new Set<number>();
        const usedRotativo = new Set<number>();

        const errors: string[] = [];
        const warnings: string[] = [];

        // Usar ESTABILIDAD como base de referencia (es la más confiable según análisis)
        for (let i = 0; i < estabilidadSessions.length; i++) {
            const estSession = estabilidadSessions[i];

            // ✅ NUEVA LÓGICA: Buscar TODOS los fragmentos GPS dentro del rango ESTABILIDAD
            const gpsFragmentos: DetectedSession[] = [];

            for (let j = 0; j < gpsSessions.length; j++) {
                if (usedGPS.has(j)) continue;

                const gpsSession = gpsSessions[j];

                // ✅ GPS está dentro si:
                // - Su inicio está dentro del rango ESTABILIDAD (con tolerancia de 5min antes/después)
                // - O su fin está dentro del rango ESTABILIDAD
                // - O cubre completamente el rango ESTABILIDAD
                const gpsStart = gpsSession.startTime.getTime();
                const gpsEnd = gpsSession.endTime.getTime();
                const estStart = estSession.startTime.getTime() - (300 * 1000); // -5 min tolerancia
                const estEnd = estSession.endTime.getTime() + (300 * 1000); // +5 min tolerancia

                const gpsInsideEst =
                    (gpsStart >= estStart && gpsStart <= estEnd) ||  // GPS inicia dentro
                    (gpsEnd >= estStart && gpsEnd <= estEnd) ||      // GPS termina dentro
                    (gpsStart <= estStart && gpsEnd >= estEnd);      // GPS cubre todo

                if (gpsInsideEst) {
                    gpsFragmentos.push(gpsSession);
                    usedGPS.add(j);
                }
            }

            // Fusionar fragmentos GPS en una sola sesión virtual
            let gpsSession: DetectedSession | null = null;
            let bestGPSDiff = Infinity;

            if (gpsFragmentos.length > 0) {
                // Crear sesión GPS fusionada
                const allGPSTimestamps = gpsFragmentos.flatMap(f => [f.startTime, f.endTime]);
                const gpsStartTime = new Date(Math.min(...allGPSTimestamps.map(t => t.getTime())));
                const gpsEndTime = new Date(Math.max(...allGPSTimestamps.map(t => t.getTime())));
                const totalGPSMeasurements = gpsFragmentos.reduce((sum, f) => sum + f.measurementCount, 0);

                gpsSession = {
                    sessionNumber: gpsFragmentos[0].sessionNumber,
                    fileType: 'GPS',
                    startTime: gpsStartTime,
                    endTime: gpsEndTime,
                    durationSeconds: (gpsEndTime.getTime() - gpsStartTime.getTime()) / 1000,
                    lineRange: gpsFragmentos[0].lineRange,
                    measurementCount: totalGPSMeasurements,
                    lines: [],
                    metadata: {
                        ...gpsFragmentos[0].metadata,
                        fusionedFragments: gpsFragmentos.length // ✅ Marcar que es fusión
                    }
                };

                bestGPSDiff = Math.abs(
                    (gpsSession.startTime.getTime() - estSession.startTime.getTime()) / 1000
                );

                if (gpsFragmentos.length > 1) {
                    logger.info(`   🔗 GPS fragmentado: ${gpsFragmentos.length} fragmentos fusionados para sesión ${i + 1}`);
                }
            }

            // ✅ NUEVA LÓGICA: Buscar TODOS los fragmentos ROTATIVO dentro del rango ESTABILIDAD
            const rotativoFragmentos: DetectedSession[] = [];

            for (let k = 0; k < rotativoSessions.length; k++) {
                if (usedRotativo.has(k)) continue;

                const rotSession = rotativoSessions[k];

                // ROTATIVO está dentro si cae en el rango ESTABILIDAD (con tolerancia)
                const rotStart = rotSession.startTime.getTime();
                const rotEnd = rotSession.endTime.getTime();
                const estStart = estSession.startTime.getTime() - (300 * 1000);
                const estEnd = estSession.endTime.getTime() + (300 * 1000);

                const rotInsideEst =
                    (rotStart >= estStart && rotStart <= estEnd) ||
                    (rotEnd >= estStart && rotEnd <= estEnd) ||
                    (rotStart <= estStart && rotEnd >= estEnd);

                if (rotInsideEst) {
                    rotativoFragmentos.push(rotSession);
                    usedRotativo.add(k);
                }
            }

            // Fusionar fragmentos ROTATIVO
            let rotativoSession: DetectedSession | null = null;
            let bestRotativoDiff = Infinity;

            if (rotativoFragmentos.length > 0) {
                const allRotTimestamps = rotativoFragmentos.flatMap(f => [f.startTime, f.endTime]);
                const rotStartTime = new Date(Math.min(...allRotTimestamps.map(t => t.getTime())));
                const rotEndTime = new Date(Math.max(...allRotTimestamps.map(t => t.getTime())));
                const totalRotMeasurements = rotativoFragmentos.reduce((sum, f) => sum + f.measurementCount, 0);

                rotativoSession = {
                    sessionNumber: rotativoFragmentos[0].sessionNumber,
                    fileType: 'ROTATIVO',
                    startTime: rotStartTime,
                    endTime: rotEndTime,
                    durationSeconds: (rotEndTime.getTime() - rotStartTime.getTime()) / 1000,
                    lineRange: rotativoFragmentos[0].lineRange,
                    measurementCount: totalRotMeasurements,
                    lines: [],
                    metadata: {
                        ...rotativoFragmentos[0].metadata,
                        fusionedFragments: rotativoFragmentos.length
                    }
                };

                bestRotativoDiff = Math.abs(
                    (rotativoSession.startTime.getTime() - estSession.startTime.getTime()) / 1000
                );

                if (rotativoFragmentos.length > 1) {
                    logger.info(`   🔗 ROTATIVO fragmentado: ${rotativoFragmentos.length} fragmentos fusionados para sesión ${i + 1}`);
                }
            }

            // Crear sesión correlacionada
            const correlated = this.createCorrelatedSession(
                estSession,
                gpsSession,
                rotativoSession,
                i + 1, // sessionNumber (1-indexed)
                bestGPSDiff,
                bestRotativoDiff
            );

            correlatedSessions.push(correlated);

            // Warnings
            if (!gpsSession) {
                warnings.push(`Sesión ${i + 1}: Sin GPS correlacionado`);
            }

            if (!rotativoSession) {
                warnings.push(`Sesión ${i + 1}: Sin ROTATIVO correlacionado`);
            }
        }

        // Procesar GPSs no correlacionados (si hay)
        for (let j = 0; j < gpsSessions.length; j++) {
            if (usedGPS.has(j)) continue;

            const gpsSession = gpsSessions[j];

            // Buscar ROTATIVO para este GPS
            let rotativoSession: DetectedSession | null = null;
            let bestRotativoDiff = Infinity;
            let bestRotativoIndex = -1;

            for (let k = 0; k < rotativoSessions.length; k++) {
                if (usedRotativo.has(k)) continue;

                const timeDiff = Math.abs(
                    (rotativoSessions[k].startTime.getTime() - gpsSession.startTime.getTime()) / 1000
                );

                if (timeDiff <= CORRELATION_TIME_THRESHOLD_SECONDS && timeDiff < bestRotativoDiff) {
                    bestRotativoDiff = timeDiff;
                    bestRotativoIndex = k;
                }
            }

            if (bestRotativoIndex >= 0) {
                rotativoSession = rotativoSessions[bestRotativoIndex];
                usedRotativo.add(bestRotativoIndex);
            }

            const correlated = this.createCorrelatedSession(
                null,
                gpsSession,
                rotativoSession,
                correlatedSessions.length + 1,
                0,
                bestRotativoDiff
            );

            correlatedSessions.push(correlated);
            warnings.push(`Sesión ${correlated.sessionNumber}: GPS sin ESTABILIDAD correlacionada`);
        }

        // Procesar ROTATIVOs no correlacionados (si hay)
        for (let k = 0; k < rotativoSessions.length; k++) {
            if (usedRotativo.has(k)) continue;

            const rotativoSession = rotativoSessions[k];

            const correlated = this.createCorrelatedSession(
                null,
                null,
                rotativoSession,
                correlatedSessions.length + 1,
                0,
                0
            );

            correlatedSessions.push(correlated);
            warnings.push(`Sesión ${correlated.sessionNumber}: ROTATIVO sin ESTABILIDAD ni GPS correlacionados`);
        }

        // Calcular estadísticas
        const timeDiffs: number[] = [];
        correlatedSessions.forEach(s => {
            if (s.correlationStats.estabilidadGpsDiff !== undefined) {
                timeDiffs.push(s.correlationStats.estabilidadGpsDiff);
            }
            if (s.correlationStats.estabilidadRotativoDiff !== undefined) {
                timeDiffs.push(s.correlationStats.estabilidadRotativoDiff);
            }
        });

        const avgTimeDiff = timeDiffs.length > 0
            ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
            : 0;
        const maxTimeDiff = timeDiffs.length > 0 ? Math.max(...timeDiffs) : 0;
        const minTimeDiff = timeDiffs.length > 0 ? Math.min(...timeDiffs) : 0;

        const validSessions = correlatedSessions.filter(s => s.isValid).length;
        const sessionsWithoutGPS = correlatedSessions.filter(s => !s.gps).length;

        logger.info(`✅ Correlación completa: ${correlatedSessions.length} sesiones (${validSessions} válidas, ${sessionsWithoutGPS} sin GPS)`);

        return {
            correlatedSessions,
            totalDetected: {
                estabilidad: estabilidadSessions.length,
                gps: gpsSessions.length,
                rotativo: rotativoSessions.length
            },
            totalCorrelated: correlatedSessions.length,
            validSessions,
            invalidSessions: correlatedSessions.length - validSessions,
            sessionsWithoutGPS,
            stats: {
                avgTimeDiff,
                maxTimeDiff,
                minTimeDiff
            },
            errors,
            warnings
        };
    }

    /**
     * Crea una sesión correlacionada a partir de sesiones detectadas
     */
    private static createCorrelatedSession(
        estabilidad: DetectedSession | null,
        gps: DetectedSession | null,
        rotativo: DetectedSession | null,
        sessionNumber: number,
        estGpsDiff: number,
        estRotDiff: number
    ): CorrelatedSession {
        // Calcular startTime (el más temprano)
        const timestamps = [
            estabilidad?.startTime,
            gps?.startTime,
            rotativo?.startTime
        ].filter(Boolean) as Date[];

        const startTime = START_TIME_STRATEGY === 'EARLIEST'
            ? new Date(Math.min(...timestamps.map(t => t.getTime())))
            : timestamps[0];

        // Calcular endTime (el más tardío)
        const endTimestamps = [
            estabilidad?.endTime,
            gps?.endTime,
            rotativo?.endTime
        ].filter(Boolean) as Date[];

        const endTime = END_TIME_STRATEGY === 'LATEST'
            ? new Date(Math.max(...endTimestamps.map(t => t.getTime())))
            : endTimestamps[0];

        const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

        // Validar sesión
        const hasEstabilidad = !!estabilidad;
        const hasGPS = !!gps;
        const hasRotativo = !!rotativo;

        let isValid = hasEstabilidad && hasRotativo; // Mínimo requerido
        let invalidReason: string | undefined;
        const observations: string[] = [];

        if (!hasGPS) {
            observations.push('sin gps');
        }

        if (!hasEstabilidad) {
            isValid = false;
            invalidReason = 'Falta ESTABILIDAD (requerido)';
        }

        if (!hasRotativo) {
            isValid = false;
            invalidReason = 'Falta ROTATIVO (requerido)';
        }

        if (durationSeconds <= 0) {
            isValid = false;
            invalidReason = 'Duración inválida (≤ 0s)';
        }

        return {
            sessionNumber,
            startTime,
            endTime,
            durationSeconds,
            estabilidad,
            gps,
            rotativo,
            isValid,
            invalidReason,
            observations,
            correlationStats: {
                estabilidadGpsDiff: estGpsDiff !== Infinity ? estGpsDiff : undefined,
                estabilidadRotativoDiff: estRotDiff !== Infinity ? estRotDiff : undefined,
                gpsRotativoDiff: gps && rotativo
                    ? Math.abs((gps.startTime.getTime() - rotativo.startTime.getTime()) / 1000)
                    : undefined,
                hasGPS,
                hasEstabilidad,
                hasRotativo
            }
        };
    }
}

