export enum EventType {
    STABILITY = 'STABILITY',
    CAN = 'CAN',
    GPS = 'GPS',
    COMBINED = 'COMBINED',
    SYSTEM = 'SYSTEM',
    MAINTENANCE = 'MAINTENANCE',
    CUSTOM = 'CUSTOM'
}

export enum EventSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
    ERROR = 'ERROR'
}

export enum EventStatus {
    ACTIVE = 'ACTIVE',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED',
    EXPIRED = 'EXPIRED',
    ARCHIVED = 'ARCHIVED'
}

export enum RiskLevel {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    NONE = 'NONE'
}

export interface Event {
    id: string;
    type: EventType;
    severity: EventSeverity;
    status: EventStatus;
    vehicleId: string;
    organizationId: string;
    timestamp: Date;
    data: Record<string, unknown>;
    displayData: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventData {
    type: EventType;
    severity: EventSeverity;
    vehicleId: string;
    organizationId: string;
    timestamp: Date;
    data: Record<string, unknown>;
    displayData: Record<string, unknown>;
}

export interface EventFilters {
    startDate?: Date;
    endDate?: Date;
    type?: EventType;
    severity?: EventSeverity;
    vehicleId?: string;
    organizationId?: string;
}

// ✅ Roles del sistema - UNIFICADOS
export enum UserRole {
    ADMIN = 'ADMIN',      // Acceso total al sistema
    MANAGER = 'MANAGER',  // Admin de parque/organización específica
    OPERATOR = 'OPERATOR',// Usuario operativo (futuro)
    VIEWER = 'VIEWER'     // Solo lectura (futuro)
}

export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Session {
    id: number;
    vehicleId: number;
    date: Date;
    status: string;
    data?: string;
    metrics?: string;
    events?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;  // ✅ Usar enum consistente
    status: string;
    organizationId: string;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Vehicle {
    id: string;
    name: string;
    model: string;
    licensePlate: string;
    identifier: string;
    brand?: string;
    type: 'TRUCK' | 'VAN' | 'CAR' | 'BUS' | 'MOTORCYCLE' | 'OTHER';
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'REPAIR';
    organizationId: string;
    userId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Organization {
    id: number;
    name: string;
    apiKey: string;
    createdAt: Date;
    updatedAt: Date;
}
