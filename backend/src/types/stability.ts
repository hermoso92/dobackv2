import { z } from 'zod';
import { RiskLevel } from './domain';
import { EventSeverity, EventType } from './enums';

// Raw data from sensors
export interface RawStabilityData {
    timestamp: number;
    roll: number;
    pitch: number;
    yaw: number;
    acc_x: number;
    acc_y: number;
    acc_z: number;
    load_fl: number;
    load_fr: number;
    load_rl: number;
    load_rr: number;
    lat: number;
    lon: number;
    alt: number;
    vehicle_id: string;
    session_id: string;
}

// Stability Measurements
export interface StabilityMeasurements {
    id: string;
    timestamp: Date;
    sessionId: string;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    usciclo1: number;
    usciclo2: number;
    usciclo3: number;
    usciclo4: number;
    usciclo5?: number;
    si: number;
    accmag: number;
    microsds: number;
    k3?: number;
    timeantwifi: number;
    isDRSHigh?: boolean;
    isLTRCritical?: boolean;
    isLateralGForceHigh?: boolean;
    temperature?: number | null;
}

// Stability Metrics
export interface StabilityMetrics {
    ltr: number;
    ssf: number;
    drs: number;
    rsc: number;
    loadTransfer: number;
    rollAngle: number;
    pitchAngle: number;
    yawAngle: number;
    speed: number;
    lateralAcceleration: number;
    verticalAcceleration: number;
    longitudinalAcceleration: number;
}

// Stability Events
export interface StabilityEvent {
    id: string;
    timestamp: Date;
    type: EventType;
    severity: EventSeverity;
    message: string;
    sessionId: string;
    metrics: StabilityMetrics;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    vehicleId?: string;
}

// Zod Schemas for Validation
export const stabilityMetricsSchema = z.object({
    ltr: z.number().optional(),
    ssf: z.number().optional(),
    drs: z.number().optional(),
    rsc: z.number().optional(),
    rollAngle: z.number(),
    pitchAngle: z.number(),
    yawAngle: z.number(),
    speed: z.number(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    altitude: z.number().optional(),
    lateralAcceleration: z.number(),
    longitudinalAcceleration: z.number(),
    verticalAcceleration: z.number(),
    loadTransfer: z.number()
});

export const stabilityEventSchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    type: z.nativeEnum(EventType),
    severity: z.nativeEnum(EventSeverity),
    message: z.string(),
    vehicleId: z.string(),
    sessionId: z.string(),
    metrics: stabilityMetricsSchema,
    acknowledged: z.boolean(),
    acknowledgedBy: z.string().optional(),
    acknowledgedAt: z.date().optional(),
    resolved: z.boolean(),
    resolvedBy: z.string().optional(),
    resolvedAt: z.date().optional()
});

// Session Schema with Zod Validation
export const stabilitySessionSchema = z.object({
    id: z.string(),
    vehicleId: z.string(),
    type: z.string(),
    status: z.string(),
    startTime: z.date(),
    endTime: z.date().nullable(),
    metrics: stabilityMetricsSchema,
    events: z.array(stabilityEventSchema),
    measurements: z.array(
        z.object({
            timestamp: z.date(),
            metrics: stabilityMetricsSchema
        })
    )
});

export type StabilitySession = z.infer<typeof stabilitySessionSchema>;

// Analysis Types
export interface StabilityAnalysis {
    id: string;
    timestamp: Date;
    vehicleId: string;
    sessionId: string;
    metrics: StabilityMetrics;
    events: StabilityEvent[];
    alerts: StabilityAlert[];
    recommendations: string[];
    status: string;
}

// Processing Types
export interface StabilityProcessor {
    processRawData(data: RawStabilityData): StabilityMeasurements;
    calculateMetrics(measurements: StabilityMeasurements[]): StabilityMetrics;
    detectEvents(
        measurements: StabilityMeasurements[],
        metrics: StabilityMetrics
    ): StabilityEvent[];
    validateData(data: StabilityMeasurements): boolean;
}

// Error Types
export interface StabilityError {
    code: string;
    message: string;
    timestamp: Date;
    source: 'SENSOR' | 'PROCESSING' | 'ANALYSIS';
    severity: RiskLevel;
    measurements?: Partial<StabilityMeasurements>;
    context?: Record<string, unknown>;
}

// Threshold Types
export interface StabilityThresholds {
    ltr: {
        warning: number;
        critical: number;
    };
    ssf: {
        warning: number;
        critical: number;
    };
    drs: {
        warning: number;
        critical: number;
    };
    rsc: {
        warning: number;
        critical: number;
    };
    rollAngle: {
        warning: number;
        critical: number;
    };
    pitchAngle: {
        warning: number;
        critical: number;
    };
    lateralAcceleration: {
        warning: number;
        critical: number;
    };
    longitudinalAcceleration: {
        warning: number;
        critical: number;
    };
    verticalAcceleration: {
        warning: number;
        critical: number;
    };
    loadTransfer: {
        warning: number;
        critical: number;
    };
}

// Configuration Types
export interface StabilityConfig {
    thresholds: StabilityThresholds;
    samplingRate: number; // Hz
    filterSettings: {
        type: string;
        cutoffFrequency: number;
        order: number;
    };
}

// Response Types
export interface StabilityUploadResponse {
    sessionId: string;
    message: string;
    measurementsCount?: number;
    metrics?: StabilityMetrics;
}

// Report Types
export interface StabilityReport {
    id: string;
    vehicleId: string;
    sessionId: string;
    startTime: Date;
    endTime: Date;
    summary: {
        maxLTR: number;
        maxRollAngle: number;
        maxPitchAngle: number;
        maxLateralAcceleration: number;
        maxLongitudinalAcceleration: number;
        maxVerticalAcceleration: number;
        maxLoadTransfer: number;
        eventCount: {
            total: number;
            warning: number;
            critical: number;
        };
    };
    metrics: StabilityMetrics[];
    events: StabilityEvent[];
    recommendations: string[];
}

// Alert Types
export interface StabilityAlert {
    id: string;
    timestamp: Date;
    type: EventType;
    severity: EventSeverity;
    message: string;
    vehicleId: string;
    sessionId: string;
    metrics: StabilityMetrics;
    thresholds: Partial<StabilityThresholds>;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

// Validation Types
export interface StabilityValidation {
    isValid: boolean;
    errors: {
        field: string;
        message: string;
        value: any;
        constraint: any;
    }[];
    warnings: {
        field: string;
        message: string;
        value: any;
        threshold: any;
    }[];
}

// Audit Types
export interface StabilityAudit {
    id: string;
    timestamp: Date;
    vehicleId: string;
    sessionId?: string;
    action: string;
    component: string;
    data: any;
    userId: string;
    status: string;
}
