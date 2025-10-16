/**
 * 🔍 DETECTOR DE SESIONES
 * 
 * Detecta sesiones individuales dentro de un archivo basándose en gaps temporales.
 * 
 * REGLA: Si entre dos mediciones hay más de 5 minutos (300s) de diferencia,
 * se considera que son de sesiones diferentes.
 */

import { createLogger } from '../../utils/logger';
import { OPERATIONAL_PERIOD_RULES } from './SessionCorrelationRules';
import { DetectedSession, SessionDetectionResult } from './types/DetectedSession';

const logger = createLogger('SessionDetector');

interface TimestampedLine {
    lineNumber: number;
    timestamp: Date;
    content: string;
}

export class SessionDetector {
    /**
     * Detecta sesiones en un archivo
     */
    static detectSessions(
        fileContent: string,
        fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO',
        fileName?: string
    ): SessionDetectionResult {
        const lines = fileContent.split('\n');
        const timestampedLines: TimestampedLine[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Extraer líneas con timestamps válidos
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue; // Ignorar vacías y comentarios

            const timestamp = this.extractTimestamp(line, fileType);
            if (timestamp) {
                timestampedLines.push({
                    lineNumber: i + 1,
                    timestamp,
                    content: line
                });
            }
        }

        if (timestampedLines.length === 0) {
            errors.push('No se encontraron líneas con timestamp válido');
            return {
                sessions: [],
                fileType,
                totalLines: lines.length,
                validLines: 0,
                ignoredLines: lines.length,
                errors,
                warnings
            };
        }

        // 2. Ordenar por timestamp
        timestampedLines.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // 3. Detectar gaps y crear sesiones
        const sessions: DetectedSession[] = [];
        let currentSession: TimestampedLine[] = [timestampedLines[0]];
        let sessionNumber = 1;

        for (let i = 1; i < timestampedLines.length; i++) {
            const prev = timestampedLines[i - 1];
            const current = timestampedLines[i];

            const gapSeconds = (current.timestamp.getTime() - prev.timestamp.getTime()) / 1000;

            // Si el gap es mayor al umbral, es una nueva sesión
            if (gapSeconds > OPERATIONAL_PERIOD_RULES.gapThresholdSeconds) {
                // Guardar sesión actual
                if (currentSession.length >= OPERATIONAL_PERIOD_RULES.minimumMeasurements) {
                    sessions.push(this.createDetectedSession(
                        currentSession,
                        fileType,
                        sessionNumber,
                        fileName
                    ));
                    sessionNumber++;
                } else {
                    warnings.push(`Sesión con solo ${currentSession.length} mediciones ignorada (mínimo: ${OPERATIONAL_PERIOD_RULES.minimumMeasurements})`);
                }

                // Iniciar nueva sesión
                currentSession = [current];
            } else {
                currentSession.push(current);
            }
        }

        // Guardar última sesión
        if (currentSession.length >= OPERATIONAL_PERIOD_RULES.minimumMeasurements) {
            sessions.push(this.createDetectedSession(
                currentSession,
                fileType,
                sessionNumber,
                fileName
            ));
        }

        logger.info(`${fileType}: ${sessions.length} sesiones detectadas de ${timestampedLines.length} mediciones`);

        return {
            sessions,
            fileType,
            totalLines: lines.length,
            validLines: timestampedLines.length,
            ignoredLines: lines.length - timestampedLines.length,
            errors,
            warnings
        };
    }

    /**
     * Crea un objeto DetectedSession a partir de líneas agrupadas
     */
    private static createDetectedSession(
        lines: TimestampedLine[],
        fileType: 'ESTABILIDAD' | 'GPS' | 'ROTATIVO',
        sessionNumber: number,
        fileName?: string
    ): DetectedSession {
        const startTime = lines[0].timestamp;
        const endTime = lines[lines.length - 1].timestamp;
        const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

        return {
            sessionNumber,
            fileType,
            startTime,
            endTime,
            durationSeconds,
            lineRange: {
                start: lines[0].lineNumber,
                end: lines[lines.length - 1].lineNumber
            },
            measurementCount: lines.length,
            lines: lines.map(l => l.content),
            metadata: {
                fileName
            }
        };
    }

    /**
     * Extrae timestamp de una línea según el tipo de archivo
     */
    private static extractTimestamp(line: string, fileType: string): Date | null {
        try {
            switch (fileType) {
                case 'GPS':
                    return this.extractGPSTimestamp(line);
                case 'ESTABILIDAD':
                    return this.extractEstabilidadTimestamp(line);
                case 'ROTATIVO':
                    return this.extractRotativoTimestamp(line);
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }

    /**
     * Extrae timestamp de línea GPS
     * Formato real: Hora Raspberry-09:33:37,30/09/2025,Hora GPS-07:33:38,...
     */
    private static extractGPSTimestamp(line: string): Date | null {
        // Buscar líneas que empiezan con "Hora Raspberry-"
        if (!line.startsWith('Hora Raspberry-')) return null;

        const parts = line.split(',');
        if (parts.length < 2) return null;

        // Hora Raspberry está en parts[0]: "Hora Raspberry-09:33:37"
        const horaRaspberry = parts[0].split('-')[1];
        // Fecha está en parts[1]: "30/09/2025"
        const fecha = parts[1].trim();

        if (!horaRaspberry || !fecha) return null;

        const [day, month, year] = fecha.split('/').map(Number);
        const [hours, minutes, seconds] = horaRaspberry.split(':').map(Number);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }

        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    /**
     * Extrae timestamp de línea ESTABILIDAD
     * Formato real: ESTABILIDAD;30/09/2025 09:33:44;DOBACK024;Sesión:1;
     */
    private static extractEstabilidadTimestamp(line: string): Date | null {
        const parts = line.split(';');
        if (parts.length < 2) return null;

        // El timestamp está en parts[1] con formato "DD/MM/YYYY HH:MM:SS"
        const timestampFull = parts[1].trim();
        const [datePart, timePart] = timestampFull.split(' ');

        if (!datePart || !timePart) return null;

        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }

        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    /**
     * Extrae timestamp de línea ROTATIVO
     * Formato real: 30/09/2025-09:33:37;0
     */
    private static extractRotativoTimestamp(line: string): Date | null {
        const parts = line.split(';');
        if (parts.length < 1) return null;

        // El timestamp está en parts[0] con formato "DD/MM/YYYY-HH:MM:SS"
        const timestampFull = parts[0].trim();
        const [datePart, timePart] = timestampFull.split('-');

        if (!datePart || !timePart) return null;

        const [day, month, year] = datePart.split('/').map(Number);
        const [hours, minutes, seconds] = timePart.split(':').map(Number);

        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }

        return new Date(year, month - 1, day, hours, minutes, seconds);
    }
}

