import { StabilityMeasurements, StabilityMetrics } from '../types/domain';
import { logger } from '../utils/logger';

export class StabilityProcessor {
    /**
     * Procesa las mediciones de estabilidad y calcula las métricas
     */
    public async processMeasurements(measurements: StabilityMeasurements[]): Promise<StabilityMetrics> {
        try {
            // Validar mediciones
            this.validateMeasurements(measurements);

            // Calcular métricas
            const ltr = this.calculateLTR(measurements);
            const ssf = this.calculateSSF(measurements);
            const drs = this.calculateDRS(measurements);
            const rsc = this.calculateRSC(measurements);
            const rollAngle = this.calculateRollAngle(measurements);
            const pitchAngle = this.calculatePitchAngle(measurements);
            const lateralAcceleration = this.calculateLateralAcceleration(measurements);
            const verticalAcceleration = this.calculateVerticalAcceleration(measurements);
            const longitudinalAcceleration = this.calculateLongitudinalAcceleration(measurements);
            const loadTransfer = this.calculateLoadTransfer(measurements);

            return {
                ltr,
                ssf,
                drs,
                rsc,
                rollAngle,
                pitchAngle,
                lateralAcceleration,
                verticalAcceleration,
                longitudinalAcceleration,
                loadTransfer
            };
        } catch (error) {
            logger.error('Error processing stability measurements', { error });
            throw error;
        }
    }

    /**
     * Valida las mediciones
     */
    private validateMeasurements(measurements: StabilityMeasurements[]): void {
        if (!measurements || measurements.length === 0) {
            throw new Error('No measurements provided');
        }

        measurements.forEach(measurement => {
            this.validateLoadDistribution(measurement.loadDistribution);
            this.validateAccelerations(measurement);
            this.validateAngles(measurement);
        });
    }

    /**
     * Valida la distribución de carga
     */
    private validateLoadDistribution(loadDistribution: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number }): void {
        const { frontLeft, frontRight, rearLeft, rearRight } = loadDistribution;
        const sum = frontLeft + frontRight + rearLeft + rearRight;

        if (sum !== 1) {
            throw new Error('Load distribution values must sum to 1');
        }

        if (frontLeft < 0 || frontRight < 0 || rearLeft < 0 || rearRight < 0) {
            throw new Error('Load distribution values must be non-negative');
        }
    }

    /**
     * Valida las aceleraciones
     */
    private validateAccelerations(measurement: StabilityMeasurements): void {
        const { lateralAcc, verticalAcc, longitudinalAcc } = measurement;

        if (isNaN(lateralAcc) || isNaN(verticalAcc) || isNaN(longitudinalAcc)) {
            throw new Error('Invalid acceleration values');
        }
    }

    /**
     * Valida los ángulos
     */
    private validateAngles(measurement: StabilityMeasurements): void {
        const { roll, pitch, yaw } = measurement;

        if (isNaN(roll) || isNaN(pitch) || isNaN(yaw)) {
            throw new Error('Invalid angle values');
        }
    }

    /**
     * Calcula el Load Transfer Ratio (LTR)
     */
    private calculateLTR(measurements: StabilityMeasurements[]): number {
        const lastMeasurement = measurements[measurements.length - 1];
        const { frontLeft, frontRight, rearLeft, rearRight } = lastMeasurement.loadDistribution;

        return Math.abs((frontRight + rearRight - frontLeft - rearLeft) / (frontLeft + frontRight + rearLeft + rearRight));
    }

    /**
     * Calcula el Static Stability Factor (SSF)
     */
    private calculateSSF(measurements: StabilityMeasurements[]): number {
        const lastMeasurement = measurements[measurements.length - 1];
        return lastMeasurement.trackWidth / (2 * lastMeasurement.cgHeight);
    }

    /**
     * Calcula el Dynamic Rollover Stability (DRS)
     */
    private calculateDRS(measurements: StabilityMeasurements[]): number {
        const lastMeasurement = measurements[measurements.length - 1];
        const ssf = this.calculateSSF([lastMeasurement]);
        const ltr = this.calculateLTR([lastMeasurement]);

        return ssf * (1 - ltr);
    }

    /**
     * Calcula el Roll Stability Control (RSC)
     */
    private calculateRSC(measurements: StabilityMeasurements[]): number {
        const lastMeasurement = measurements[measurements.length - 1];
        const drs = this.calculateDRS([lastMeasurement]);
        const rollAngle = Math.abs(lastMeasurement.roll);

        return drs * Math.cos(rollAngle * Math.PI / 180);
    }

    /**
     * Calcula el ángulo de roll
     */
    private calculateRollAngle(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].roll;
    }

    /**
     * Calcula el ángulo de pitch
     */
    private calculatePitchAngle(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].pitch;
    }

    /**
     * Calcula el ángulo de yaw
     */
    private calculateYawAngle(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].yaw;
    }

    /**
     * Calcula la aceleración lateral
     */
    private calculateLateralAcceleration(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].lateralAcc;
    }

    /**
     * Calcula la aceleración vertical
     */
    private calculateVerticalAcceleration(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].verticalAcc;
    }

    /**
     * Calcula la aceleración longitudinal
     */
    private calculateLongitudinalAcceleration(measurements: StabilityMeasurements[]): number {
        return measurements[measurements.length - 1].longitudinalAcc;
    }

    /**
     * Calcula la transferencia de carga
     */
    private calculateLoadTransfer(measurements: StabilityMeasurements[]): number {
        const lastMeasurement = measurements[measurements.length - 1];
        const { frontLeft, frontRight, rearLeft, rearRight } = lastMeasurement.loadDistribution;

        return Math.max(
            Math.abs(frontRight - frontLeft),
            Math.abs(rearRight - rearLeft),
            Math.abs((frontRight + rearRight) - (frontLeft + rearLeft))
        );
    }
} 