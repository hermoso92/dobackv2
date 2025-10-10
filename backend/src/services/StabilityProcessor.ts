import { StabilityMeasurements, StabilityMetrics } from '../types/stability';
import { logger } from '../utils/logger';

export class StabilityProcessor {
    private readonly GRAVITY = 9.81; // m/s²
    private readonly TRACK_WIDTH = 1.8; // m
    private readonly CG_HEIGHT = 0.6; // m

    constructor() {}

    public processMeasurements(measurements: StabilityMeasurements[]): StabilityMetrics {
        if (!measurements || measurements.length === 0) {
            return {
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                rollAngle: 0,
                pitchAngle: 0,
                yawAngle: 0,
                speed: 0,
                lateralAcceleration: 0,
                longitudinalAcceleration: 0,
                verticalAcceleration: 0,
                loadTransfer: 0
            };
        }

        try {
            const measurement = measurements[measurements.length - 1];
            const ltr = this.calculateLTR(measurement);
            const ssf = this.calculateSSF(measurement);
            const drs = this.calculateDRS(measurement);
            const rsc = this.calculateRSC(measurement);
            const loadTransfer = this.calculateLoadTransfer(measurement);

            // Calcular ángulos y aceleraciones
            const rollAngle = measurement.roll;
            const pitchAngle = measurement.pitch;
            const yawAngle = measurement.yaw;

            // Normalizar aceleraciones a g's
            const lateralAcceleration = measurement.ay / this.GRAVITY;
            const longitudinalAcceleration = measurement.ax / this.GRAVITY;
            const verticalAcceleration = (measurement.az - this.GRAVITY) / this.GRAVITY;

            return {
                ltr,
                ssf,
                drs,
                rsc,
                rollAngle,
                pitchAngle,
                yawAngle,
                speed: 0,
                lateralAcceleration,
                longitudinalAcceleration,
                verticalAcceleration,
                loadTransfer
            };
        } catch (error) {
            logger.error('Error processing stability measurements', { error });
            return {
                ltr: 0,
                ssf: 0,
                drs: 0,
                rsc: 0,
                rollAngle: 0,
                pitchAngle: 0,
                yawAngle: 0,
                speed: 0,
                lateralAcceleration: 0,
                longitudinalAcceleration: 0,
                verticalAcceleration: 0,
                loadTransfer: 0
            };
        }
    }

    public calculateLTR(measurement: StabilityMeasurements): number {
        const rightSide = measurement.usciclo1 + measurement.usciclo2;
        const leftSide = measurement.usciclo3 + measurement.usciclo4;
        const totalLoad = rightSide + leftSide;

        if (totalLoad === 0) return 0;

        return Math.abs((rightSide - leftSide) / totalLoad);
    }

    public calculateSSF(measurement: StabilityMeasurements): number {
        return this.TRACK_WIDTH / (2 * this.CG_HEIGHT);
    }

    public calculateDRS(measurement: StabilityMeasurements): number {
        const lateralAcceleration = measurement.ay / this.GRAVITY;
        const rollAngle = measurement.roll;
        const ssf = this.calculateSSF(measurement);

        return 1.0 - Math.abs(lateralAcceleration / (ssf * this.GRAVITY));
    }

    public calculateRSC(measurement: StabilityMeasurements): number {
        const lateralAcceleration = measurement.ay / this.GRAVITY;
        const rollAngle = measurement.roll;
        const ssf = this.calculateSSF(measurement);
        const ltr = this.calculateLTR(measurement);

        return ssf * (1.0 - Math.abs(ltr));
    }

    public calculateLoadTransfer(measurement: StabilityMeasurements): number {
        const rightSide = measurement.usciclo1 + measurement.usciclo2;
        const leftSide = measurement.usciclo3 + measurement.usciclo4;
        const totalLoad = rightSide + leftSide;

        if (totalLoad === 0) return 0;

        return Math.abs((rightSide - leftSide) / totalLoad);
    }

    private calculateRolloverThreshold(measurement: StabilityMeasurements): number {
        const ssf = this.calculateSSF(measurement);
        const lateralAccFactor = Math.abs(measurement.ay) / this.GRAVITY;

        // El umbral de vuelco es aproximadamente igual al SSF
        const threshold = ssf;

        // Factor de seguridad basado en la aceleración lateral actual
        const safetyFactor = 1 - lateralAccFactor / threshold;

        return Math.max(0, Math.min(1, safetyFactor));
    }

    private calculateStabilityIndex(measurement: StabilityMeasurements): number {
        const drs = this.calculateDRS(measurement);
        const rsc = this.calculateRSC(measurement);
        const rolloverThreshold = this.calculateRolloverThreshold(measurement);

        // Pesos para cada componente
        const weights = {
            drs: 0.4,
            rsc: 0.4,
            rolloverThreshold: 0.2
        };

        // Índice de estabilidad ponderado
        return (
            weights.drs * drs +
            weights.rsc * (rsc / 2) +
            weights.rolloverThreshold * rolloverThreshold
        );
    }

    private calculateRolloverRisk(measurement: StabilityMeasurements): number {
        const stabilityIndex = this.calculateStabilityIndex(measurement);
        const ltr = this.calculateLTR(measurement);
        const rollAngleFactor = Math.abs(measurement.roll) / 45; // Normalizar a 45 grados

        // Factores de riesgo
        const riskFactors = {
            stabilityIndex: 1 - stabilityIndex,
            ltr: ltr,
            rollAngle: rollAngleFactor
        };

        // Pesos para cada factor de riesgo
        const weights = {
            stabilityIndex: 0.5,
            ltr: 0.3,
            rollAngle: 0.2
        };

        // Riesgo de vuelco ponderado
        return (
            weights.stabilityIndex * riskFactors.stabilityIndex +
            weights.ltr * riskFactors.ltr +
            weights.rollAngle * riskFactors.rollAngle
        );
    }

    private calculateCriticalityLevel(measurement: StabilityMeasurements): number {
        const rolloverRisk = this.calculateRolloverRisk(measurement);
        const stabilityIndex = this.calculateStabilityIndex(measurement);
        const ltr = this.calculateLTR(measurement);

        // Umbrales de criticidad
        const thresholds = {
            high: 0.8,
            medium: 0.6,
            low: 0.4
        };

        if (rolloverRisk > thresholds.high || stabilityIndex < 0.2 || ltr > 0.8) {
            return 1; // Crítico
        } else if (rolloverRisk > thresholds.medium || stabilityIndex < 0.4 || ltr > 0.6) {
            return 0.66; // Alto
        } else if (rolloverRisk > thresholds.low || stabilityIndex < 0.6 || ltr > 0.4) {
            return 0.33; // Medio
        } else {
            return 0; // Bajo
        }
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100;
    }
}
