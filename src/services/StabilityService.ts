import { logger } from '../utils/logger';
import { EventService } from './EventService';
import { StabilityProcessor } from './StabilityProcessor';

export interface StabilityData {
    vehicleId: string;
    sessionId: string;
    measurements: any[];
}

export interface StabilityResult {
    success: boolean;
    error?: string;
    data?: any;
}

export class StabilityService {
    constructor(
        private readonly processor: StabilityProcessor,
        private readonly eventService: EventService
    ) {}

    async processStabilityData(data: StabilityData): Promise<StabilityResult> {
        try {
            const result = await this.processor.processMeasurements(data.measurements);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            logger.error('Error processing stability data:', error);
            return {
                success: false,
                error: 'Error processing stability data'
            };
        }
    }

    async validateStabilityData(data: StabilityData): Promise<StabilityResult> {
        try {
            // TODO: Implementar validación real de datos
            return { success: true };
        } catch (error) {
            logger.error('Error validating stability data:', error);
            return {
                success: false,
                error: 'Invalid stability data'
            };
        }
    }
} 