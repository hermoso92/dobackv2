import { Request, Response } from 'express';
import { z } from 'zod';
import { StabilityMeasurementRepository } from '../repositories/StabilityMeasurementRepository';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';
import { logger } from '../utils/logger';

// Esquema de validación para las mediciones de estabilidad
const stabilityMeasurementSchema = z.object({
    timestamp: z.string().transform((str) => new Date(str)),
    roll: z.number(),
    pitch: z.number(),
    yaw: z.number(),
    lateralAcc: z.number(),
    verticalAcc: z.number(),
    longitudinalAcc: z.number(),
    loadDistribution: z.object({
        frontLeft: z.number(),
        frontRight: z.number(),
        rearLeft: z.number(),
        rearRight: z.number()
    }),
    location: z
        .object({
            latitude: z.number(),
            longitude: z.number(),
            altitude: z.number().optional()
        })
        .optional(),
    vehicleId: z.string().optional(),
    sessionId: z.string().optional()
});

export class StabilityAnalysisController {
    constructor(
        private readonly stabilityAnalysisService: StabilityAnalysisService,
        private readonly measurementRepository: StabilityMeasurementRepository
    ) {}

    /**
     * Analiza datos de estabilidad
     */
    public async analyzeStabilityData(req: Request, res: Response): Promise<void> {
        try {
            const measurements = stabilityMeasurementSchema
                .array()
                .parse(req.body)
                .map((m) => ({
                    ...m,
                    id: crypto.randomUUID()
                }));

            // Guardar las mediciones
            await this.measurementRepository.saveBatch(measurements);

            // Analizar las mediciones
            const metrics = await this.stabilityAnalysisService.analyzeStabilityData(measurements);

            res.json({
                success: true,
                data: metrics
            });
        } catch (error) {
            logger.error('Error analyzing stability data', { error });
            res.status(400).json({
                success: false,
                error: 'Invalid request data'
            });
        }
    }

    /**
     * Obtiene un reporte de estabilidad
     */
    public async getStabilityReport(req: Request, res: Response): Promise<void> {
        try {
            const { startTime, endTime, vehicleId } = z
                .object({
                    startTime: z.string().transform((str) => new Date(str)),
                    endTime: z.string().transform((str) => new Date(str)),
                    vehicleId: z.string().optional()
                })
                .parse(req.query);

            // Obtener las mediciones
            const measurements = vehicleId
                ? await this.measurementRepository.findByVehicleAndTimeRange(
                      vehicleId,
                      startTime,
                      endTime
                  )
                : await this.measurementRepository.findByTimeRange(startTime, endTime);

            // Analizar las mediciones
            const metrics = await this.stabilityAnalysisService.analyzeStabilityData(measurements);

            res.json({
                success: true,
                data: {
                    metrics,
                    measurements
                }
            });
        } catch (error) {
            logger.error('Error getting stability report', { error });
            res.status(400).json({
                success: false,
                error: 'Invalid request data'
            });
        }
    }

    /**
     * Obtiene métricas de estabilidad
     */
    public async getStabilityMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { vehicleId, sessionId } = z
                .object({
                    vehicleId: z.string().optional(),
                    sessionId: z.string().optional()
                })
                .parse(req.query);

            // Obtener las mediciones
            const measurements = sessionId
                ? await this.measurementRepository.findBySessionId(sessionId)
                : vehicleId
                ? await this.measurementRepository.findByVehicleId(vehicleId)
                : [];

            // Analizar las mediciones
            const metrics = await this.stabilityAnalysisService.analyzeStabilityData(measurements);

            res.json({
                success: true,
                data: metrics
            });
        } catch (error) {
            logger.error('Error getting stability metrics', { error });
            res.status(400).json({
                success: false,
                error: 'Invalid request data'
            });
        }
    }
}
