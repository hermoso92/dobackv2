// Enums
export enum OrganizationType {
    EMERGENCY = 'emergency',
    LOGISTICS = 'logistics',
    TRANSPORT = 'transport',
    PUBLIC = 'public'
}

export enum VehicleStatus {
    ACTIVE = 'active',
    MAINTENANCE = 'maintenance',
    INACTIVE = 'inactive'
}

export enum SessionType {
    TRAINING = 'training',
    EMERGENCY = 'emergency',
    ROUTINE = 'routine',
    TEST = 'test'
}

export enum EventType {
    STABILITY = 'stability',
    TELEMETRY = 'telemetry',
    SYSTEM = 'system',
    ALERT = 'alert'
}

export enum EventSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

export enum EventStatus {
    ACTIVE = 'active',
    ACKNOWLEDGED = 'acknowledged',
    RESOLVED = 'resolved'
}

// Interfaces
export interface Organization {
    id: string;
    name: string;
    type: OrganizationType;
    status: 'active' | 'inactive';
    settings: {
        alertThresholds: {
            stabilityWarning: number;
            stabilityDanger: number;
            telemetryWarning: number;
            telemetryDanger: number;
        };
        reportingFrequency: string;
        dataRetentionDays: number;
        aiEnabled: boolean;
        allowedModules: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Vehicle {
    id: string;
    organizationId: string;
    name: string;
    type: string;
    model: string;
    plate: string;
    vin: string;
    year: number;
    status: VehicleStatus;
    configuration: {
        stabilityThresholds: {
            rollThreshold: number;
            pitchThreshold: number;
            yawThreshold: number;
            lateralAccThreshold: number;
            verticalAccThreshold: number;
            stabilityIndexThreshold: number;
        };
        telemetryThresholds: {
            maxSpeed: number;
            maxAcceleration: number;
            maxBraking: number;
            maxRPM: number;
            maxEngineTemp: number;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Session {
    id: string;
    vehicleId: string;
    type: SessionType;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    distance?: number;
    averageSpeed?: number;
    maxSpeed?: number;
    eventCount: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    weatherConditions?: {
        temperature: number;
        humidity: number;
        precipitation: number;
        windSpeed: number;
        visibility: number;
        roadCondition: string;
    };
    operatorId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StabilityMeasurements {
    id: string;
    sessionId: string;
    vehicleId: string;
    timestamp: Date;
    roll: number;
    pitch: number;
    yaw: number;
    lateralAcc: number;
    verticalAcc: number;
    longitudinalAcc: number;
    loadDistribution: {
        frontLeft: number;
        frontRight: number;
        rearLeft: number;
        rearRight: number;
    };
    trackWidth: number;  // Ancho de vía del vehículo en metros
    cgHeight: number;    // Altura del centro de gravedad en metros
}

export interface StabilityMetrics {
    ltr: number;
    ssf: number;
    drs: number;
    rsc: number;
    rollAngle: number;
    pitchAngle: number;
    lateralAcceleration: number;
    verticalAcceleration: number;
    longitudinalAcceleration: number;
    loadTransfer: number;
}

export interface Event {
    id: string;
    type: EventType;
    severity: EventSeverity;
    message: string;
    timestamp: Date;
    status: EventStatus;
    acknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: Date | null;
    context?: {
        metrics?: {
            ltr?: number;
            ssf?: number;
            drs?: number;
            rsc?: number;
            rollAngle?: number;
            pitchAngle?: number;
            lateralAcceleration?: number;
            verticalAcceleration?: number;
            longitudinalAcceleration?: number;
            loadTransfer?: number;
        };
    };
}

export interface User {
    id: string;
    organizationId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    status: 'active' | 'inactive' | 'pending';
    lastLogin?: Date;
    preferences?: {
        language: string;
        timezone: string;
        notifications: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface Maintenance {
    id: string;
    vehicleId: string;
    type: string;
    description: string;
    scheduledDate: Date;
    completedDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    cost?: number;
    notes?: string;
    technician?: string;
    parts?: {
        name: string;
        quantity: number;
        cost: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface EmailVerificationToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface PasswordResetToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface StabilityAnalysisResult {
    metrics: StabilityMetrics;
    events: Event[];
} 