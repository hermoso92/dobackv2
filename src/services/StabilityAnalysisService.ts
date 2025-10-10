import { Event, EventSeverity, EventStatus, EventType } from '../types/event';
import { StabilityAnalysisResult, StabilityMeasurement, StabilityMetrics } from '../types/stability';
import { logger } from '../utils/logger';

export class StabilityAnalysisService {
    /**
     * Analyzes stability data and returns metrics and events
     */
    public async analyzeStabilityData(measurements: StabilityMeasurement[]): Promise<StabilityAnalysisResult> {
        try {
            if (!measurements || measurements.length === 0) {
                throw new Error('No measurements provided');
            }

            const metrics = this.calculateMetrics(measurements);
            const events = this.detectEvents(measurements, metrics);

            return {
                metrics,
                events
            };
        } catch (error) {
            logger.error('Error analyzing stability data', { error, measurements });
            throw error;
        }
    }

    private calculateMetrics(measurements: StabilityMeasurement[]): StabilityMetrics {
        // Calculate basic metrics
        const ltr = this.calculateLTR(measurements);
        const rollAngle = this.calculateRollAngle(measurements);
        const stabilityIndex = this.calculateStabilityIndex(measurements);

        return {
            ltr,
            rollAngle,
            stabilityIndex
        };
    }

    private calculateLTR(measurements: StabilityMeasurement[]): number {
        const ltrValues = measurements.map(m => {
            const { usciclo1, usciclo2, usciclo3, usciclo4 } = m;
            const totalLoad = usciclo1 + usciclo2 + usciclo3 + usciclo4;
            const leftLoad = usciclo1 + usciclo3;
            const rightLoad = usciclo2 + usciclo4;

            return Math.abs(leftLoad - rightLoad) / totalLoad;
        });

        return Math.max(...ltrValues);
    }

    private calculateRollAngle(measurements: StabilityMeasurement[]): number {
        const rollAngles = measurements.map(m => Math.abs(m.roll));
        return Math.max(...rollAngles);
    }

    private calculateStabilityIndex(measurements: StabilityMeasurement[]): number {
        const lateralAccelerations = measurements.map(m => m.ay);
        const maxLateralAcc = Math.max(...lateralAccelerations.map(Math.abs));
        const avgLateralAcc = lateralAccelerations.reduce((a, b) => a + Math.abs(b), 0) / lateralAccelerations.length;

        return maxLateralAcc / avgLateralAcc;
    }

    private detectEvents(measurements: StabilityMeasurement[], metrics: StabilityMetrics): Event[] {
        const events: Event[] = [];

        // Detect critical events
        if (metrics.ltr > 0.8) {
            events.push({
                id: crypto.randomUUID(),
                type: EventType.STABILITY,
                severity: EventSeverity.CRITICAL,
                status: EventStatus.ACTIVE,
                message: 'High load transfer detected',
                timestamp: new Date().toISOString(),
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
                context: { metrics }
            });
        }

        // Detect warning events
        if (metrics.rollAngle > 15) {
            events.push({
                id: crypto.randomUUID(),
                type: EventType.STABILITY,
                severity: EventSeverity.WARNING,
                status: EventStatus.ACTIVE,
                message: 'High roll angle detected',
                timestamp: new Date().toISOString(),
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
                context: { metrics }
            });
        }

        // Add info events for significant changes
        const significantChanges = this.detectSignificantChanges(measurements);
        significantChanges.forEach(change => {
            events.push({
                id: crypto.randomUUID(),
                type: EventType.STABILITY,
                severity: EventSeverity.INFO,
                status: EventStatus.ACTIVE,
                message: 'Significant stability change detected',
                timestamp: change.timestamp.toISOString(),
                acknowledged: false,
                acknowledgedBy: null,
                acknowledgedAt: null,
                context: { metrics }
            });
        });

        return events;
    }

    private detectSignificantChanges(measurements: StabilityMeasurement[]): { timestamp: Date }[] {
        const changes: { timestamp: Date }[] = [];
        const threshold = 0.5; // Threshold for significant changes

        for (let i = 1; i < measurements.length; i++) {
            const prev = measurements[i - 1];
            const curr = measurements[i];

            const rollChange = Math.abs(curr.roll - prev.roll);
            const pitchChange = Math.abs(curr.pitch - prev.pitch);
            const yawChange = Math.abs(curr.yaw - prev.yaw);

            if (rollChange > threshold || pitchChange > threshold || yawChange > threshold) {
                changes.push({
                    timestamp: curr.timestamp
                });
            }
        }

        return changes;
    }
} 