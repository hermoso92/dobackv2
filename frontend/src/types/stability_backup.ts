import { BaseEntity } from './common';
import { WeatherConditions } from './domain';
// Type definitions
export type StabilityEventType = 'LTR' | 'ROLL_ANGLE' | 'LATERAL_ACCELERATION';
export type StabilityEventSeverity = 'warning' | 'critical';
export type StabilitySessionStatus = 'active' | 'completed' | 'error';
export type StabilityRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type StabilitySessionType = 'training' | 'monitoring' | 'test';
export type VariableGroupType = 'stability' | 'gyro' | 'acceleration' | 'speed';

// Backend DTOs
export interface StabilitySessionDTO extends BaseEntity {
    vehicle_id: number;
    session_type: StabilitySessionType;
    start_time: string;
    end_time: string;
    stability_index: number;
    risk_level: string;
    roll_data: number[];
    pitch_data: number[];
    yaw_data: number[];
    lateral_acceleration: number[];
    vertical_acceleration: number[];
    longitudinal_acceleration: number[];
    speed_data: number[];
    load_data: number[];
    terrain_type: string;
    weather_conditions: WeatherConditions;
    events: StabilityEventDTO[];
}

export interface StabilityEventDTO {
    event_type: string;
    severity: string;
    value: number;
    timestamp: string;
    description: string;
}

export interface StabilityThresholdDTO extends BaseEntity {
    vehicle_id: number;
    roll_threshold: number;
    pitch_threshold: number;
    yaw_threshold: number;
    lateral_acc_threshold: number;
    vertical_acc_threshold: number;
    longitudinal_acc_threshold: number;
    stability_index_threshold: number;
}

// Frontend Interfaces
export interface StabilitySession {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime: string;
    gpsData: GPSPoint[];
    events: StabilityEvent[];
    metrics: {
        distance: number;
        duration: number;
        maxSpeed: number;
        avgSpeed: number;
    };
}

export interface StabilityEvent {
    lat: number;
    lon: number;
    timestamp: string;
    tipos: string[];
    valores: Record<string, number>;
}

export interface StabilityDataPoint {
    timestamp: string;
    time: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    si: number;
    accmag: number;
}

export interface StabilityThreshold extends BaseEntity {
    vehicleId: string;
    rollThreshold: number;
    pitchThreshold: number;
    yawThreshold: number;
    lateralAccThreshold: number;
    verticalAccThreshold: number;
    longitudinalAccThreshold: number;
    stabilityIndexThreshold: number;
}

export interface StabilityMetrics {
    ltr: number;
    rollAngle: number;
    lateralAcceleration: number;
    speed?: number;
    timestamp: string;
}

export interface StabilityUploadResponse {
    sessionId: string;
    message: string;
}

export interface TelemetryData {
    id?: string;
    timestamp: number;
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
    angular_x: number;
    angular_y: number;
    angular_z: number;
    speed: number;
    lateral_acc: number;
    roll_angle: number;
    pitch_angle: number;
    location?: {
        latitude: number;
        longitude: number;
        altitude?: number;
    };
}

export interface VehicleConfig {
    id?: string;
    name?: string;
    track_width: number;
    cg_height: number;
    wheelbase: number;
    mass: number;
    max_speed: number;
    vehicle_type?: 'car' | 'truck' | 'bus' | 'motorcycle';
}

export interface DangerInfo {
    dangerLevel: number;
    level: 'safe' | 'warning' | 'danger' | 'critical';
    color: string;
    description: string;
    ltrValue: number;
    ssfValue: number;
    timestamp?: number;
}

export interface TrendInfo {
    trend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    direction?: 'up' | 'down' | 'none';
}

export interface StatisticsInfo {
    min: number;
    max: number;
    avg: number;
    median: number;
    stdDev: number;
}

export interface ProcessedTelemetryPoint {
    timestamp: number;
    timeFormatted: string;
    ltr: number;
    ssf: number;
    drs: number;
    dangerLevel: number;
}

export interface Alarm {
    id: string;
    type: 'LTR' | 'SSF' | 'DRS' | 'ROLL' | 'LATERAL_ACC' | 'SYSTEM';
    level: 'warning' | 'danger' | 'critical';
    value: number;
    threshold: number;
    description: string;
    timestamp: number;
    acknowledged?: boolean;
}

export interface CriticalEvent {
    id: string;
    type: string;
    level: 'warning' | 'danger' | 'critical';
    description: string;
    timestamp: number;
    duration?: number;
    location?: {
        latitude: number;
        longitude: number;
    };
    telemetry?: TelemetryData;
    stability?: StabilityMetrics;
}

export interface VisualizationOptions {
    timeWindow: number;
    samplingRate: number;
    decimationFactor?: number;
    showDetails?: boolean;
}

export interface StabilityProps {
    telemetryData: TelemetryData[];
    vehicleConfig: VehicleConfig;
    options?: VisualizationOptions;
}

export interface VariableGroup {
    title: string;
    variables: Variable[];
}

export interface Variable {
    key: keyof StabilityDataPoint;
    label: string;
    unit?: string;
    group: string;
}

export interface StabilityConfig {
    pointsPerMinute: number;
    thresholds: {
        ltr: { warning: number; critical: number };
        rollAngle: { warning: number; critical: number };
        lateralAcceleration: { warning: number; critical: number };
    };
}

// Constants
export const STABILITY_CONFIG: StabilityConfig = {
    pointsPerMinute: 60,
    thresholds: {
        ltr: { warning: 0.6, critical: 0.8 },
        rollAngle: { warning: 5, critical: 10 },
        lateralAcceleration: { warning: 0.3, critical: 0.5 }
    }
};

export const initialSelectedVariables = ['ltr', 'rollAngle', 'lateralAcceleration'] as const;

export const variableGroups: Record<VariableGroupType, readonly string[]> = {
    stability: ['ltr', 'rollAngle', 'lateralAcceleration'] as const,
    gyro: ['gyroX', 'gyroY', 'gyroZ'] as const,
    acceleration: ['accelX', 'accelY', 'accelZ'] as const,
    speed: ['speed'] as const
};

// Transformation Functions
export const mapSessionDTOToSession = (dto: StabilitySessionDTO): StabilitySession => ({
    id: dto.id,
    startTime: dto.start_time,
    endTime: dto.end_time,
    vehicleId: dto.vehicle_id.toString(),
    gpsData: [],
    events: [],
    metrics: {
        distance: 0,
        duration: 0,
        maxSpeed: 0,
        avgSpeed: 0
    }
});

export const mapEventDTOToEvent = (dto: StabilityEventDTO): StabilityEvent => ({
    lat: 0,
    lon: 0,
    timestamp: '',
    tipos: [],
    valores: {}
});

export const mapThresholdDTOToThreshold = (dto: StabilityThresholdDTO): StabilityThreshold => ({
    id: dto.id.toString(),
    vehicleId: dto.vehicle_id.toString(),
    rollThreshold: dto.roll_threshold,
    pitchThreshold: dto.pitch_threshold,
    yawThreshold: dto.yaw_threshold,
    lateralAccThreshold: dto.lateral_acc_threshold,
    verticalAccThreshold: dto.vertical_acc_threshold,
    longitudinalAccThreshold: dto.longitudinal_acc_threshold,
    stabilityIndexThreshold: dto.stability_index_threshold,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
});

export interface DatabaseStabilityData {
    timestamp: string;
    time: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    si: number;
    accmag: number;
    timeantwifi: number;
    usciclo1: number;
    usciclo2: number;
    usciclo3: number;
    usciclo4: number;
    usciclo5: number;
    usciclo6: number;
    usciclo7: number;
    microsds: number;
}

export interface GPSPoint {
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    altitude?: number;
    accuracy?: number;
} 