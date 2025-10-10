import { BaseEntity, RiskLevel, Status } from './common';
// Core Domain Types
export interface Organization extends BaseEntity {
    name: string;
    type: 'emergency' | 'logistics' | 'transport' | 'public';
    status: Status;
    settings: OrganizationSettings;
}

export interface Fleet extends BaseEntity {
    name: string;
    organizationId: number;
    type: 'emergency' | 'logistics' | 'transport';
    status: Status;
    settings: FleetSettings;
}

export interface OperationalSession extends BaseEntity {
    vehicleId: number;
    sessionType: 'training' | 'emergency' | 'routine' | 'test';
    startTime: string;
    endTime: string;
    duration: number;
    distance: number;
    averageSpeed: number;
    maxSpeed: number;
    eventCount: number;
    riskLevel: RiskLevel;
    weatherConditions: WeatherConditions;
    terrainType: string;
    operatorId: number;
}

// Settings & Configuration
export interface OrganizationSettings {
    alertThresholds: AlertThresholds;
    reportingFrequency: 'realtime' | 'hourly' | 'daily';
    dataRetentionDays: number;
    aiEnabled: boolean;
    allowedModules: string[];
}

export interface FleetSettings {
    defaultStabilityThresholds: StabilityThresholds;
    defaultTelemetryThresholds: TelemetryThresholds;
    autoVehicleCreation: boolean;
    requireOperatorId: boolean;
}

export interface StabilityThresholds {
    rollThreshold: number;
    pitchThreshold: number;
    yawThreshold: number;
    lateralAccelerationThreshold: number;
    verticalAccelerationThreshold: number;
    stabilityIndexThreshold: number;
}

export interface TelemetryThresholds {
    maxSpeed: number;
    maxAcceleration: number;
    maxBraking: number;
    maxRPM: number;
    maxEngineTemp: number;
    fuelEfficiencyThreshold: number;
}

export interface AlertThresholds {
    stabilityWarningThreshold: number;
    stabilityDangerThreshold: number;
    telemetryWarningThreshold: number;
    telemetryDangerThreshold: number;
}

// Environmental Conditions
export interface WeatherConditions {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    precipitation: number;
    visibility: number;
    timestamp: string;
}

// Analysis Results
export interface OperationalAnalysis extends BaseEntity {
    sessionId: number;
    stabilityScore: number;
    telemetryScore: number;
    riskAssessment: RiskAssessment;
    aiRecommendations: AiRecommendation[];
    events: OperationalEvent[];
}

export interface RiskAssessment {
    overallRisk: RiskLevel;
    stabilityRisk: RiskLevel;
    drivingBehaviorRisk: RiskLevel;
    environmentalRisk: RiskLevel;
    factors: string[];
}

export interface AiRecommendation {
    type: 'training' | 'maintenance' | 'operational' | 'safety';
    priority: 'low' | 'medium' | 'high';
    description: string;
    suggestedActions: string[];
    confidence: number;
}

export interface OperationalEvent {
    timestamp: string;
    type: 'stability' | 'telemetry' | 'safety' | 'maintenance';
    severity: RiskLevel;
    description: string;
    location: GeoLocation;
    data: Record<string, number>;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    timestamp?: string;
}

export interface Vehicle {
    id: string;
    name: string;
    type: 'car' | 'truck' | 'bus' | 'motorcycle';
    status: 'active' | 'inactive' | 'maintenance';
    lastUpdate: string;
    metrics: {
        stabilityScore: number;
        alerts: number;
        distance: number;
    };
}

export interface Event {
    id: string;
    timestamp: string;
    type: string;
    severity: string;
    message: string;
    vehicleId: string;
    acknowledged: boolean;
    resolved: boolean;
}

export interface Dashboard {
    vehiclesCount: number;
    activeAlerts: number;
    criticalEvents: number;
    stabilityScore: number;
    recentEvents: Event[];
    processedData: {
        stabilitySessions: number;
        canData: string;
        gpsRoutes: number;
        totalTime: string;
    };
} 