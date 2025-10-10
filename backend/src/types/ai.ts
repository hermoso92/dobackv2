import { z } from 'zod';
import { RiskLevel } from './domain';
import { StabilityEvent, StabilityMetrics } from './stability';
import { TelemetryEvent } from './telemetry';

// AI Analysis Types
export interface AIAnalysisContext {
    vehicleId: number;
    sessionId: number;
    timeWindow: {
        start: Date;
        end: Date;
    };
    dataPoints: number;
    confidence: number;
}

export interface PatternDetection {
    type: 'behavior' | 'risk' | 'maintenance' | 'efficiency';
    pattern: string;
    confidence: number;
    occurrences: number;
    timeRanges: Array<{
        start: Date;
        end: Date;
    }>;
    relatedEvents: Array<StabilityEvent | TelemetryEvent>;
    metrics: Partial<StabilityMetrics>;
}

export interface RiskPrediction {
    type: string;
    probability: number;
    timeFrame: {
        start: Date;
        end: Date;
    };
    severity: RiskLevel;
    contributingFactors: Array<{
        factor: string;
        weight: number;
        evidence: string[];
    }>;
    confidence: number;
}

export interface AIRecommendation {
    type: 'training' | 'maintenance' | 'operational' | 'safety';
    priority: RiskLevel;
    title: string;
    description: string;
    actions: string[];
    impact: {
        safety: number;
        efficiency: number;
        cost: number;
    };
    evidence: Array<{
        type: string;
        description: string;
        confidence: number;
        data: Record<string, unknown>;
    }>;
}

// AI Model Configuration
export const aiModelConfigSchema = z.object({
    modelVersion: z.string(),
    parameters: z.record(z.union([z.number(), z.string(), z.boolean()])),
    thresholds: z.object({
        minConfidence: z.number().min(0).max(1),
        patternSignificance: z.number().min(0).max(1),
        riskThreshold: z.number().min(0).max(1)
    }),
    features: z.array(
        z.object({
            name: z.string(),
            weight: z.number(),
            enabled: z.boolean()
        })
    ),
    preprocessing: z.object({
        smoothing: z.boolean(),
        outlierRemoval: z.boolean(),
        normalization: z.string()
    })
});

export type AIModelConfig = z.infer<typeof aiModelConfigSchema>;

// AI Analysis Results
export interface AIAnalysisResult {
    context: AIAnalysisContext;
    patterns: PatternDetection[];
    predictions: RiskPrediction[];
    recommendations: AIRecommendation[];
    performance: {
        processingTime: number;
        modelAccuracy: number;
        dataQuality: number;
    };
}

// AI Service Interfaces
export interface PatternDetector {
    detectPatterns(events: Array<StabilityEvent | TelemetryEvent>): PatternDetection[];
    validatePattern(pattern: PatternDetection): boolean;
    updatePatternDatabase(patterns: PatternDetection[]): Promise<void>;
}

export interface RiskPredictor {
    predictRisks(
        events: Array<StabilityEvent | TelemetryEvent>,
        context: AIAnalysisContext
    ): RiskPrediction[];
    calculateConfidence(prediction: RiskPrediction): number;
    updateModel(newData: Array<StabilityEvent | TelemetryEvent>): Promise<void>;
}

export interface RecommendationEngine {
    generateRecommendations(
        patterns: PatternDetection[],
        predictions: RiskPrediction[]
    ): AIRecommendation[];
    prioritizeRecommendations(recommendations: AIRecommendation[]): AIRecommendation[];
    validateRecommendations(recommendations: AIRecommendation[]): boolean;
}

// Error Types
export interface AIError {
    code: string;
    message: string;
    component: 'PATTERN_DETECTION' | 'RISK_PREDICTION' | 'RECOMMENDATION';
    severity: RiskLevel;
    context?: AIAnalysisContext;
    modelState?: {
        version: string;
        lastUpdate: Date;
        performance: Record<string, number>;
    };
}
