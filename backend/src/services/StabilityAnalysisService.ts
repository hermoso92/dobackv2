import { randomUUID } from 'crypto';
import { EventSeverity, EventType } from '../types/enums';
import {
import { logger } from '../utils/logger';
    StabilityEvent,
    StabilityMeasurements,
    StabilityMetrics,
    StabilityProcessor,
    StabilitySession
} from '../types/stability';
import { detectRolloverCause } from '../utils/rolloverCause';
import { EventService } from './EventService';
import { NotificationService } from './NotificationService';

export interface AnalysisResult {
    metrics: StabilityMetrics;
    events: StabilityEvent[];
}

export class StabilityAnalysisService {
    constructor(
        private readonly processor: StabilityProcessor,
        private readonly eventService: EventService,
        private readonly notificationService: NotificationService
    ) {}

    /**
     * Analiza las mediciones de estabilidad y genera eventos si es necesario
     */
    public async analyzeData(measurements: StabilityMeasurements[]): Promise<AnalysisResult> {
        if (!measurements || measurements.length === 0) {
            return {
                metrics: this.getDefaultMetrics(),
                events: []
            };
        }

        const metrics = this.calculateMetrics(measurements);
        const events = this.detectEvents(measurements, metrics);

        return { metrics, events };
    }

    private getDefaultMetrics(): StabilityMetrics {
        return {
            ltr: 0,
            ssf: 0,
            drs: 0,
            rsc: 0,
            loadTransfer: 0,
            rollAngle: 0,
            pitchAngle: 0,
            yawAngle: 0,
            speed: 0,
            lateralAcceleration: 0,
            verticalAcceleration: 0,
            longitudinalAcceleration: 0
        };
    }

    private calculateMetrics(measurements: StabilityMeasurements[]): StabilityMetrics {
        const lastMeasurement = measurements[measurements.length - 1];

        return {
            ltr: this.calculateLTR(lastMeasurement),
            ssf: this.calculateSSF(lastMeasurement),
            drs: this.calculateDRS(lastMeasurement),
            rsc: this.calculateRSC(lastMeasurement),
            loadTransfer: this.calculateLoadTransfer(lastMeasurement),
            rollAngle: lastMeasurement.roll,
            pitchAngle: lastMeasurement.pitch,
            yawAngle: lastMeasurement.yaw,
            speed: 0,
            lateralAcceleration: lastMeasurement.ay,
            verticalAcceleration: lastMeasurement.az,
            longitudinalAcceleration: lastMeasurement.ax
        };
    }

    private detectEvents(
        measurements: StabilityMeasurements[],
        metrics: StabilityMetrics
    ): StabilityEvent[] {
        const events: StabilityEvent[] = [];
        const last = measurements[measurements.length - 1];
        const prev = measurements.length > 1 ? measurements[measurements.length - 2] : undefined;
        const cause = detectRolloverCause(last, prev);

        if (metrics.ltr > 0.8 || metrics.ssf < 1.0 || metrics.drs < 0.9) {
            events.push({
                id: randomUUID(),
                timestamp: new Date(),
                type: EventType.STABILITY,
                severity: EventSeverity.CRITICAL,
                message: `Critical rollover risk detected – ${cause}`,
                sessionId: measurements[0].sessionId,
                metrics,
                acknowledged: false,
                resolved: false
            });
        } else if (metrics.ltr > 0.6 || metrics.ssf < 1.2 || metrics.drs < 1.0) {
            events.push({
                id: randomUUID(),
                timestamp: new Date(),
                type: EventType.STABILITY,
                severity: EventSeverity.WARNING,
                message: `High load transfer detected – ${cause}`,
                sessionId: measurements[0].sessionId,
                metrics,
                acknowledged: false,
                resolved: false
            });
        }

        return events;
    }

    private calculateLTR(measurement: StabilityMeasurements): number {
        const rightSide = measurement.usciclo1 + measurement.usciclo2;
        const leftSide = measurement.usciclo3 + measurement.usciclo4;
        const totalLoad = rightSide + leftSide;
        return Math.abs((rightSide - leftSide) / totalLoad);
    }

    private calculateSSF(measurement: StabilityMeasurements): number {
        const trackWidth = 1.8; // metros
        const cgHeight = 0.6; // metros
        return trackWidth / (2 * cgHeight);
    }

    private calculateDRS(measurement: StabilityMeasurements): number {
        return 1.0 - Math.abs(this.calculateLTR(measurement));
    }

    private calculateRSC(measurement: StabilityMeasurements): number {
        return this.calculateSSF(measurement) * this.calculateDRS(measurement);
    }

    private calculateLoadTransfer(measurement: StabilityMeasurements): number {
        const rightSide = measurement.usciclo1 + measurement.usciclo2;
        const leftSide = measurement.usciclo3 + measurement.usciclo4;
        const totalLoad = rightSide + leftSide;
        return Math.abs((rightSide - leftSide) / totalLoad);
    }

    public parseStabilityFile(content: string): StabilityMeasurements[] {
        if (!content || typeof content !== 'string') {
            throw new Error('Invalid file content');
        }

        const lines = content.split('\n');
        const measurements: StabilityMeasurements[] = [];
        let currentSessionId = '';
        let startTime: Date | null = null;
        let lastTime: Date | null = null;
        let measurementCount = 0;

        const parseDateTime = (dateTimeStr: string): Date => {
            // Formato esperado: "DD/MM/YYYY HH:mm:ssAM" o "HH:mm:ssAM"
            if (dateTimeStr.includes('/')) {
                // Formato completo con fecha
                const [datePart, timePart] = dateTimeStr.split(' ');
                const [day, month, year] = datePart.split('/').map(Number);
                const [time, period] = timePart.split(/(?=[AP]M)/);
                const [hours, minutes, seconds] = time.split(':').map(Number);

                let hour = hours;
                if (period === 'PM' && hours !== 12) {
                    hour += 12;
                } else if (period === 'AM' && hours === 12) {
                    hour = 0;
                }

                const date = new Date(year, month - 1, day, hour, minutes, seconds);
                if (isNaN(date.getTime())) {
                    throw new Error(`Invalid date: ${dateTimeStr}`);
                }
                return date;
            } else {
                // Solo hora
                const [time, period] = dateTimeStr.split(/(?=[AP]M)/);
                const [hours, minutes, seconds] = time.split(':').map(Number);

                let hour = hours;
                if (period === 'PM' && hours !== 12) {
                    hour += 12;
                } else if (period === 'AM' && hours === 12) {
                    hour = 0;
                }

                // Usar la fecha del startTime pero con la nueva hora
                if (!startTime) {
                    throw new Error('No start time available for time-only format');
                }

                const date = new Date(startTime);
                date.setHours(hour, minutes, seconds);
                return date;
            }
        };

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Ignorar líneas vacías
            if (trimmedLine === '') continue;

            // Procesar líneas de tiempo
            if (/^\d{2}:\d{2}:\d{2}[AP]M$/.test(trimmedLine)) {
                try {
                    lastTime = parseDateTime(trimmedLine);
                    logger.info('Nueva marca de tiempo:', lastTime);
                    continue;
                } catch (error) {
                    logger.warn('Error parsing time line:', error);
                    continue;
                }
            }

            if (trimmedLine.startsWith('ESTABILIDAD;')) {
                // Parse header line
                const parts = trimmedLine.split(';').filter((part) => part.trim() !== '');
                if (parts.length < 4) {
                    throw new Error('Invalid header format: missing required fields');
                }

                const [_, timestamp, vehicleId, sessionNumber] = parts;

                // Validate vehicle ID
                if (!vehicleId || vehicleId.trim() === '') {
                    throw new Error('Invalid vehicle ID in header');
                }

                try {
                    startTime = parseDateTime(timestamp);
                    lastTime = startTime;
                    logger.info('Tiempo de inicio:', startTime);
                    // Generar sessionId usando la fecha del archivo
                    const dateStr = startTime.toISOString().split('T')[0].replace(/-/g, '');
                    currentSessionId = `${vehicleId}_${sessionNumber}_${dateStr}`;
                } catch (error) {
                    throw new Error('Invalid timestamp in header');
                }

                continue;
            }

            // Skip header line with column names
            if (trimmedLine.includes('ax; ay; az;')) continue;

            // Parse data line
            const parts = trimmedLine.split(';').map((part) => part.trim());

            // Verificar que tenemos todos los campos necesarios
            if (parts.length < 19) {
                logger.info('Línea inválida:', trimmedLine);
                logger.info('Número de campos:', parts.length);
                logger.info('Campos:', parts);
                continue;
            }

            const [
                ax,
                ay,
                az,
                gx,
                gy,
                gz,
                roll,
                pitch,
                yaw,
                timeantwifi,
                usciclo1,
                usciclo2,
                usciclo3,
                usciclo4,
                usciclo5,
                si,
                accmag,
                microsds,
                k3
            ] = parts;

            // Validate numeric values and provide defaults
            const numericValues = [
                ax,
                ay,
                az,
                gx,
                gy,
                gz,
                roll,
                pitch,
                yaw,
                usciclo1,
                usciclo2,
                usciclo3,
                usciclo4,
                usciclo5,
                si,
                accmag,
                microsds,
                k3,
                timeantwifi
            ];
            let hasInvalidValues = false;
            for (const value of numericValues) {
                if (isNaN(parseFloat(value))) {
                    logger.info('Valor no numérico encontrado:', value);
                    logger.info('Línea completa:', trimmedLine);
                    hasInvalidValues = true;
                    break;
                }
            }

            if (hasInvalidValues) continue;

            // Usar el último tiempo conocido para el timestamp
            // Si no hay último tiempo conocido, usar el tiempo de inicio
            const measurementTime = lastTime || startTime;
            if (!measurementTime) {
                logger.warn('No hay tiempo disponible para la medición');
                continue;
            }

            // Crear una copia del timestamp para evitar referencias compartidas
            const timestamp = new Date(measurementTime);

            measurements.push({
                id: randomUUID(),
                timestamp,
                sessionId: currentSessionId,
                ax: parseFloat(ax) || 0,
                ay: parseFloat(ay) || 0,
                az: parseFloat(az) || 0,
                gx: parseFloat(gx) || 0,
                gy: parseFloat(gy) || 0,
                gz: parseFloat(gz) || 0,
                roll: parseFloat(roll) || 0,
                pitch: parseFloat(pitch) || 0,
                yaw: parseFloat(yaw) || 0,
                usciclo1: parseFloat(usciclo1) || 0,
                usciclo2: parseFloat(usciclo2) || 0,
                usciclo3: parseFloat(usciclo3) || 0,
                usciclo4: parseFloat(usciclo4) || 0,
                usciclo5: parseFloat(usciclo5) || 0,
                si: parseFloat(si) || 0,
                accmag: parseFloat(accmag) || 0,
                microsds: parseFloat(microsds) || 0,
                k3: parseFloat(k3) || 0,
                timeantwifi: parseFloat(timeantwifi) || 0
            });

            measurementCount++;
            if (measurementCount % 100 === 0) {
                logger.info(`Procesadas ${measurementCount} mediciones`);
            }
        }

        logger.info(`Total de mediciones procesadas: ${measurementCount}`);
        logger.info(
            `Duración total: ${
                measurements.length > 0
                    ? (measurements[measurements.length - 1].timestamp.getTime() -
                          measurements[0].timestamp.getTime()) /
                      1000 /
                      60
                    : 0
            } minutos`
        );

        if (measurements.length === 0) {
            throw new Error('No valid measurements found in file');
        }

        return measurements;
    }

    public async createOrUpdateSession(params: {
        vehicleId: string;
        sessionId?: string;
        metrics: StabilityMetrics;
        events: StabilityEvent[];
        measurements: StabilityMeasurements[];
    }): Promise<StabilitySession> {
        // Usar el sessionId proporcionado o generar uno nuevo
        const sessionId = params.sessionId || randomUUID();

        // Asegurarnos de que todos los eventos tengan el vehicleId
        const eventsWithVehicleId = params.events.map((event) => ({
            ...event,
            vehicleId: params.vehicleId
        }));

        return {
            id: sessionId,
            vehicleId: params.vehicleId,
            type: 'ROUTINE',
            status: 'ACTIVE',
            startTime: new Date(),
            endTime: null,
            metrics: params.metrics,
            events: eventsWithVehicleId,
            measurements: params.measurements.map((m) => ({
                timestamp: m.timestamp,
                metrics: {
                    ltr: this.calculateLTR(m),
                    ssf: this.calculateSSF(m),
                    drs: this.calculateDRS(m),
                    rsc: this.calculateRSC(m),
                    loadTransfer: this.calculateLoadTransfer(m),
                    rollAngle: m.roll,
                    pitchAngle: m.pitch,
                    yawAngle: m.yaw,
                    speed: 0,
                    lateralAcceleration: m.ay,
                    verticalAcceleration: m.az,
                    longitudinalAcceleration: m.ax
                }
            }))
        };
    }
}
