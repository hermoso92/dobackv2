
export enum EventType {
    STABILITY = 'STABILITY',
    CAN = 'CAN',
    COMBINED = 'COMBINED'
}

export enum EventStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    ACKNOWLEDGED = 'ACKNOWLEDGED',
    RESOLVED = 'RESOLVED',
    TRIGGERED = 'TRIGGERED',
    EXPIRED = 'EXPIRED',
    ARCHIVED = 'ARCHIVED'
}

export enum EventSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export type EventTypeValue = `${EventType}`;
export type EventStatusValue = `${EventStatus}`;

export interface Event {
    id: string;
    name: string;
    description: string;
    status: EventStatus;
    type: EventType;
    estado: EventStatus;
    tipo: EventType;
    isPredefined: boolean;
    autoEvaluate?: boolean;
    conditions: any[];
    vehicles: string[];
    vehicle?: string;
    vehicleName?: string;
    data?: Record<string, unknown>;
    displayData?: Record<string, unknown>;
    organizationId?: string;
    timestamp?: string;
}

export interface EventFormData {
    name: string;
    description: string;
    estado: EventStatus;
    tipo: EventType;
    isPredefined: boolean;
    autoEvaluate: boolean;
    conditions: any[];
    vehicles: string[];
}

export interface EventCondition {
    id?: string;
    variable: string;
    operator: string;
    value: string;
    value2?: string;
    unit?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateEventDTO {
    name: string;
    description: string;
    estado: EventStatus;
    tipo: EventType;
    isPredefined: boolean;
    autoEvaluate: boolean;
    conditions: any[];
    vehicles: string[];
}

export interface UpdateEventDTO extends CreateEventDTO {
    id: string;
}

export interface EventFilters {
    status?: EventStatus;
    type?: EventType;
    vehicleId?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

export interface ApiResponseWithData<T> {
    success: boolean;
    message?: string;
    data: T;
} 