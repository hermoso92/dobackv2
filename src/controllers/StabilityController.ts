import { PrismaClient } from '@prisma/client';
import * as csv from 'csv-parse';
import { Request } from 'express';
import * as fs from 'fs';
import type { File as MulterFile } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { StabilityAnalysisService } from '../services/StabilityAnalysisService';
import { EventSeverity, EventType } from '../types/event';
import { StabilityAnalysisResult, StabilityMeasurement } from '../types/stability';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// Define types for params and file
interface SessionRequestParams {
    sessionId: string;
}

interface MulterRequest extends Request {
    file?: MulterFile;
}

export class StabilityController {
    private prisma: PrismaClient;

    constructor(
        private readonly analysisService: StabilityAnalysisService
    ) {
        this.prisma = new PrismaClient();
    }

    /**
     * Uploads and processes stability data
     */
    public async uploadData(req: MulterRequest & { params: SessionRequestParams }, res: Response): Promise<void> {
        try {
            const { sessionId } = req.params;
            const file = req.file;

            if (!file) {
                throw ApiError.badRequest('No file uploaded');
            }

            // Process file and get measurements
            const measurements = await this.processFile(file);

            // Save measurements to database
            await this.prisma.stabilityMeasurement.createMany({
                data: measurements.map(m => ({
                    ...m,
                    sessionId
                }))
            });

            // Analyze data
            const result = await this.analysisService.analyzeStabilityData(measurements);

            res.status(201).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error uploading stability data', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Gets stability metrics for a session
     */
    public async getMetrics(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = (req as any).params;
            const measurements = await this.prisma.stabilityMeasurement.findMany({
                where: { sessionId }
            });
            const result = await this.analysisService.analyzeStabilityData(measurements);
            res.status(200).json({
                success: true,
                data: result.metrics
            });
        } catch (error) {
            logger.error('Error getting stability metrics', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Gets stability events for a session
     */
    public async getEvents(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = (req as any).params;
            const measurements = await this.prisma.stabilityMeasurement.findMany({
                where: { sessionId }
            });
            const result = await this.analysisService.analyzeStabilityData(measurements);
            res.status(200).json({
                success: true,
                data: result.events
            });
        } catch (error) {
            logger.error('Error getting stability events', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Generates complete analysis for a session
     */
    public async generateAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = (req as any).params;
            const measurements = await this.prisma.stabilityMeasurement.findMany({
                where: { sessionId }
            });
            const result = await this.analysisService.analyzeStabilityData(measurements);
            res.status(200).json({
                success: true,
                data: {
                    metrics: result.metrics,
                    events: result.events,
                    recommendations: this.generateRecommendations(result)
                }
            });
        } catch (error) {
            logger.error('Error generating stability analysis', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Analyzes stability data directly
     */
    public async analyzeData(req: MulterRequest, res: Response): Promise<void> {
        try {
            const sessionId = uuidv4();
            const file = req.file;

            if (!file) {
                throw ApiError.badRequest('No file uploaded');
            }

            // Process file
            const measurements = await this.processFile(file);

            // Save measurements with new sessionId
            await this.prisma.stabilityMeasurement.createMany({
                data: measurements.map(m => ({
                    ...m,
                    sessionId
                }))
            });

            // Analyze data
            const result = await this.analysisService.analyzeStabilityData(measurements);

            // Calculate confidence metrics
            const confidence = this.calculateConfidence(result);

            res.status(200).json({
                success: true,
                data: {
                    sessionId,
                    metrics: {
                        LTR: {
                            min: measurements.length > 0 ? Math.min(...measurements.map((m: any) => this.calculateLTR(m))) : 0,
                            max: measurements.length > 0 ? Math.max(...measurements.map((m: any) => this.calculateLTR(m))) : 0,
                            confidence: confidence.ltr
                        },
                        SSF: {
                            value: result.metrics.stabilityIndex,
                            confidence: confidence.ssf
                        },
                        DRS: {
                            value: measurements.length > 0 ? this.calculateDRS(measurements) : 0,
                            confidence: confidence.drs
                        }
                    },
                    events: result.events.map(event => ({
                        type: this.mapEventType(event.type),
                        timestamp: event.timestamp,
                        severity: event.severity === EventSeverity.CRITICAL ? 'critical' : 'warning'
                    })),
                    status: 'completed'
                }
            });
        } catch (error) {
            logger.error('Error analyzing stability data', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Exports stability data in CSV format
     */
    public async exportCSV(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = (req as any).params;
            const measurements = await this.prisma.stabilityMeasurement.findMany({
                where: { sessionId }
            });
            const csvData = this.generateCSV(measurements);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=stability-${sessionId}.csv`);
            res.status(200).send(csvData);
        } catch (error) {
            logger.error('Error exporting stability data to CSV', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * Exports stability data in JSON format
     */
    public async exportJSON(req: Request, res: Response): Promise<void> {
        try {
            const { sessionId } = (req as any).params;
            const measurements = await this.prisma.stabilityMeasurement.findMany({
                where: { sessionId }
            });
            const result = await this.analysisService.analyzeStabilityData(measurements);
            res.status(200).json({
                success: true,
                data: {
                    measurements,
                    analysis: result
                }
            });
        } catch (error) {
            logger.error('Error exporting stability data to JSON', { error });
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    private generateRecommendations(result: StabilityAnalysisResult): any[] {
        const recommendations = [];

        // Recommendations based on metrics
        if (result.metrics.ltr > 0.8) {
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                message: 'Reduce speed and perform smooth maneuvers',
                action: 'Adjust speed and driving style'
            });
        }

        if (result.metrics.rollAngle > 15) {
            recommendations.push({
                type: 'preventive',
                priority: 'medium',
                message: 'Review load distribution',
                action: 'Optimize load distribution in the vehicle'
            });
        }

        return recommendations;
    }

    private generateCSV(measurements: StabilityMeasurement[]): string {
        const headers = [
            'timestamp',
            'roll',
            'pitch',
            'yaw',
            'lateral_acc',
            'vertical_acc',
            'longitudinal_acc',
            'load_fl',
            'load_fr',
            'load_rl',
            'load_rr',
            'lat',
            'lon',
            'alt',
            'speed'
        ].join(',');

        const rows = measurements.map(m => [
            m.timestamp,
            m.roll,
            m.pitch,
            m.yaw,
            m.ax,
            m.ay,
            m.az,
            m.usciclo1,
            m.usciclo2,
            m.usciclo3,
            m.usciclo4,
            m.lat || '',
            m.lon || '',
            m.alt || '',
            m.speed || ''
        ].join(','));

        return [headers, ...rows].join('\n');
    }

    private calculateLTR(measurement: StabilityMeasurement): number {
        const { usciclo1, usciclo2, usciclo3, usciclo4 } = measurement;
        const totalLoad = usciclo1 + usciclo2 + usciclo3 + usciclo4;
        const leftLoad = usciclo1 + usciclo3;
        const rightLoad = usciclo2 + usciclo4;
        return totalLoad !== 0 ? Math.abs(leftLoad - rightLoad) / totalLoad : 0;
    }

    private calculateDRS(measurements: StabilityMeasurement[]): number {
        const lateralAccelerations = measurements.map(m => m.ay);
        if (lateralAccelerations.length === 0) return 0;
        const maxLateralAcc = Math.max(...lateralAccelerations.map(Math.abs));
        const avgLateralAcc = lateralAccelerations.reduce((a, b) => a + Math.abs(b), 0) / lateralAccelerations.length;
        return avgLateralAcc !== 0 ? maxLateralAcc / avgLateralAcc : 0;
    }

    private calculateConfidence(result: StabilityAnalysisResult): { ltr: number; ssf: number; drs: number } {
        const dataConsistency = this.calculateDataConsistency(result);
        const signalQuality = this.calculateSignalQuality(result);

        return {
            ltr: (dataConsistency + signalQuality) / 2,
            ssf: dataConsistency * 0.7 + signalQuality * 0.3,
            drs: signalQuality * 0.8 + dataConsistency * 0.2
        };
    }

    private calculateDataConsistency(result: StabilityAnalysisResult): number {
        // Implementation depends on specific requirements
        return 0.9;
    }

    private calculateSignalQuality(result: StabilityAnalysisResult): number {
        // Implementation depends on specific requirements
        return 0.85;
    }

    private mapEventType(type: EventType): string {
        switch (type) {
            case EventType.STABILITY:
                return 'Stability Event';
            case EventType.SESSION:
                return 'Session Event';
            case EventType.VEHICLE:
                return 'Vehicle Event';
            case EventType.SYSTEM:
                return 'System Event';
            default:
                return 'Unknown Event';
        }
    }

    private async processFile(file: MulterFile): Promise<StabilityMeasurement[]> {
        return new Promise((resolve, reject) => {
            const measurements: StabilityMeasurement[] = [];
            const parser = csv.parse({
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
            parser.on('readable', () => {
                let record;
                while ((record = parser.read()) !== null) {
                    measurements.push({
                        timestamp: new Date(record.timestamp),
                        ax: parseFloat(record.ax),
                        ay: parseFloat(record.ay),
                        az: parseFloat(record.az),
                        gx: parseFloat(record.gx),
                        gy: parseFloat(record.gy),
                        gz: parseFloat(record.gz),
                        roll: parseFloat(record.roll),
                        pitch: parseFloat(record.pitch),
                        yaw: parseFloat(record.yaw),
                        timeantwifi: parseFloat(record.timeantwifi),
                        usciclo1: parseFloat(record.usciclo1),
                        usciclo2: parseFloat(record.usciclo2),
                        usciclo3: parseFloat(record.usciclo3),
                        usciclo4: parseFloat(record.usciclo4),
                        si: parseFloat(record.si),
                        accmag: parseFloat(record.accmag),
                        microsds: parseFloat(record.microsds),
                        sessionId: '',
                        lat: record.lat ? parseFloat(record.lat) : undefined,
                        lon: record.lon ? parseFloat(record.lon) : undefined,
                        alt: record.alt ? parseFloat(record.alt) : undefined,
                        speed: record.speed ? parseFloat(record.speed) : undefined
                    });
                }
            });
            parser.on('error', (error: unknown) => {
                reject(error);
            });
            parser.on('end', () => {
                resolve(measurements);
            });
            fs.createReadStream(file.path)
                .pipe(parser)
                .on('error', (error: unknown) => {
                    reject(error);
                });
        });
    }
} 