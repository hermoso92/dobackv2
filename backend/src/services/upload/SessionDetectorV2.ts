/**
 * 🔍 DETECTOR DE SESIONES V2
 * 
 * Usa los parsers robustos existentes y detecta sesiones por gaps temporales
 * en las mediciones parseadas.
 * 
 * IMPORTANTE: Los archivos tienen formatos complejos que ya son manejados
 * correctamente por RobustGPSParser, RobustStabilityParser y RobustRotativoParser.
 */

import { createLogger } from '../../utils/logger';
import { GPSParsingResult, parseGPSRobust } from '../parsers/RobustGPSParser';
import { parseRotativoRobust, RotativoParsingResult } from '../parsers/RobustRotativoParser';
import { EstabilidadParsingResult, parseEstabilidadRobust } from '../parsers/RobustStabilityParser';
import { OPERATIONAL_PERIOD_RULES } from './SessionCorrelationRules';
import { DetectedSession } from './types/DetectedSession';

const logger = createLogger('SessionDetectorV2');

export class SessionDetectorV2 {
    /**
     * Detecta sesiones en archivo ESTABILIDAD
     */
    static detectEstabilidadSessions(
        buffer: Buffer,
        baseDate: Date,
        fileName?: string
    ): DetectedSession[] {
        const result: EstabilidadParsingResult = parseEstabilidadRobust(buffer, baseDate);

        if (result.mediciones.length === 0) {
            logger.warn(`Archivo ESTABILIDAD sin mediciones válidas: ${fileName}`);
            return [];
        }

        return this.groupByGaps(
            result.mediciones.map(m => m.timestamp),
            'ESTABILIDAD',
            result.mediciones.length,
            fileName
        );
    }

    /**
     * Detecta sesiones en archivo GPS
     */
    static detectGPSSessions(
        buffer: Buffer,
        baseDate: Date,
        fileName?: string
    ): DetectedSession[] {
        const result: GPSParsingResult = parseGPSRobust(buffer, baseDate);

        if (result.puntos.length === 0) {
            logger.warn(`Archivo GPS sin puntos válidos: ${fileName}`);
            return [];
        }

        return this.groupByGaps(
            result.puntos.map(p => p.timestamp),
            'GPS',
            result.puntos.length,
            fileName
        );
    }

    /**
     * Detecta sesiones en archivo ROTATIVO
     */
    static detectRotativoSessions(
        buffer: Buffer,
        baseDate: Date,
        fileName?: string
    ): DetectedSession[] {
        const result: RotativoParsingResult = parseRotativoRobust(buffer, baseDate);

        if (result.mediciones.length === 0) {
            logger.warn(`Archivo ROTATIVO sin mediciones válidas: ${fileName}`);
            return [];
        }

        logger.info(`🔍 DEBUG ROTATIVO ${fileName}: ${result.mediciones.length} mediciones parseadas`);

        return this.groupByGaps(
            result.mediciones.map(m => m.timestamp),
            'ROTATIVO',
            result.mediciones.length,
            fileName
        );
    }

    /**
     * Agrupa timestamps por gaps temporales
     */
    private static groupByGaps(
        timestamps: Date[],
        fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO',
        totalMeasurements: number,
        fileName?: string
    ): DetectedSession[] {
        if (timestamps.length === 0) return [];

        // Ordenar timestamps
        timestamps.sort((a, b) => a.getTime() - b.getTime());

        const sessions: DetectedSession[] = [];
        let currentGroup: Date[] = [timestamps[0]];
        let sessionNumber = 1;

        for (let i = 1; i < timestamps.length; i++) {
            const prev = timestamps[i - 1];
            const current = timestamps[i];

            const gapSeconds = (current.getTime() - prev.getTime()) / 1000;

            // Gap mayor al umbral → nueva sesión
            if (gapSeconds > OPERATIONAL_PERIOD_RULES.gapThresholdSeconds) {
                // Guardar sesión actual
                if (currentGroup.length >= OPERATIONAL_PERIOD_RULES.minimumMeasurements) {
                    sessions.push({
                        sessionNumber,
                        fileType,
                        startTime: currentGroup[0],
                        endTime: currentGroup[currentGroup.length - 1],
                        durationSeconds: (currentGroup[currentGroup.length - 1].getTime() - currentGroup[0].getTime()) / 1000,
                        lineRange: { start: 0, end: 0 }, // No aplicable con parsers
                        measurementCount: currentGroup.length,
                        lines: [], // Los parsers manejan esto
                        metadata: { fileName }
                    });
                    sessionNumber++;
                }

                // Nueva sesión
                currentGroup = [current];
            } else {
                currentGroup.push(current);
            }
        }

        // Guardar última sesión
        if (currentGroup.length >= OPERATIONAL_PERIOD_RULES.minimumMeasurements) {
            sessions.push({
                sessionNumber,
                fileType,
                startTime: currentGroup[0],
                endTime: currentGroup[currentGroup.length - 1],
                durationSeconds: (currentGroup[currentGroup.length - 1].getTime() - currentGroup[0].getTime()) / 1000,
                lineRange: { start: 0, end: 0 },
                measurementCount: currentGroup.length,
                lines: [],
                metadata: { fileName }
            });
        }

        logger.info(`${fileType}: ${sessions.length} sesiones detectadas de ${totalMeasurements} mediciones`);

        return sessions;
    }
}

