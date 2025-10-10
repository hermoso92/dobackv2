import { Event } from './event';

export interface RawStabilityData {
    timestamp: string;
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
    lat?: number;
    lon?: number;
    alt?: number;
    vehicle_id: string;
    session_id: string;
}

export interface StabilityMeasurement {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    timeantwifi: number;
    usciclo1: number;
    usciclo2: number;
    usciclo3: number;
    usciclo4: number;
    si: number;
    accmag: number;
    microsds: number;
    sessionId: string;
    lat?: number;
    lon?: number;
    alt?: number;
    speed?: number;
}

export interface StabilityMetrics {
    ltr: number;
    rollAngle: number;
    stabilityIndex: number;
}

export interface StabilityEvent {
    type: import('./event').EventType;
    timestamp: Date;
    severity: 'critical' | 'warning';
}

export interface StabilityAnalysisResult {
    metrics: StabilityMetrics;
    events: Event[];
}

export interface StabilityThresholds {
    rollThreshold: number;
    pitchThreshold: number;
    yawThreshold: number;
    lateralAccThreshold: number;
    verticalAccThreshold: number;
    stabilityIndexThreshold: number;
}

export interface LoadDistribution {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
}

export interface Location {
    latitude: number;
    longitude: number;
    altitude?: number;
}

export interface StabilityRecommendation {
    type: 'immediate' | 'preventive';
    priority: 'low' | 'medium' | 'high';
    message: string;
    action: string;
}

export interface StabilityReport {
    sessionId: string;
    vehicleId: string;
    startTime: string;
    endTime: string;
    duration: number;
    distance: number;
    averageSpeed: number;
    maxSpeed: number;
    metrics: {
        ltr: {
            average: number;
            max: number;
            min: number;
            critical: number;
            warning: number;
        };
        rollAngle: {
            average: number;
            max: number;
            min: number;
            critical: number;
            warning: number;
        };
        lateralAcceleration: {
            average: number;
            max: number;
            min: number;
            critical: number;
            warning: number;
        };
    };
    events: StabilityEvent[];
    recommendations: StabilityRecommendation[];
    summary: {
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        criticalEvents: number;
        warningEvents: number;
        stabilityScore: number;
    };
}

export interface StabilityAlertConfig {
    ltrThreshold: number;
    rollAngleThreshold: number;
    lateralAccThreshold: number;
    notificationChannels: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    recipients: {
        email: string[];
        phone: string[];
        deviceTokens: string[];
    };
}

export interface StabilityAlert {
    type: 'stability';
    severity: 'warning' | 'critical';
    message: string;
    timestamp: string;
    vehicleId: string;
    sessionId: string;
    metrics: {
        ltr?: number;
        rollAngle?: number;
        lateralAcceleration?: number;
    };
    location?: Location;
    recommendations: string[];
}

export interface StabilitySession {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime?: string;
    status: 'active' | 'completed' | 'error';
    measurements: number;
    events: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    metrics?: {
        ltr: number;
        rollAngle: number;
        lateralAcceleration: number;
    };
}

export interface StabilityFilter {
    startDate?: string;
    endDate?: string;
    vehicleId?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    eventType?: 'warning' | 'critical';
    metric?: 'ltr' | 'rollAngle' | 'lateralAcceleration';
    threshold?: number;
}

export interface StabilityExport {
    format: 'csv' | 'json' | 'pdf';
    data: {
        measurements: boolean;
        events: boolean;
        recommendations: boolean;
    };
    filter?: StabilityFilter;
}

export interface StabilityVisualization {
    type: 'line' | 'bar' | 'scatter' | '3d';
    metrics: string[];
    timeRange: 'session' | 'hour' | 'day' | 'week' | 'month';
    aggregation: 'none' | 'average' | 'max' | 'min';
    filter?: StabilityFilter;
} 