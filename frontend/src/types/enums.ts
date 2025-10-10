export enum EventType {
    VEHICLE = 'VEHICLE',
    SYSTEM = 'SYSTEM',
    USER = 'USER',
    MAINTENANCE = 'MAINTENANCE'
}

export enum EventSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

export enum VehicleStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    MAINTENANCE = 'MAINTENANCE'
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    VIEWER = 'VIEWER'
}

export enum SessionStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
    ERROR = 'ERROR',
    CANCELLED = 'CANCELLED'
}

export enum AlertStatus {
    NEW = 'NEW',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED'
}

export enum MaintenanceType {
    PREVENTIVE = 'PREVENTIVE',
    CORRECTIVE = 'CORRECTIVE',
    PREDICTIVE = 'PREDICTIVE'
}

export enum StabilityRisk {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
} 