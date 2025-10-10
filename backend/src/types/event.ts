import {
    EventConditionOperator,
    EventConditionType,
    EventLogicOperator,
    EventStatus,
    EventType,
    Vehicle
} from '@prisma/client';

export enum EventSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface EventoVariableVisible {
    id: string;
    eventoId: string;
    nombre: string;
    orden: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventCondition {
    id: string;
    eventId: string;
    type: EventConditionType;
    variable: string;
    operator: EventConditionOperator;
    value: number;
    value2: number | null;
    unit: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface EjecucionEvento {
    id: string;
    eventId: string;
    vehicleId: string;
    sessionId: string | null;
    triggeredAt: Date;
    data: any;
    displayData: any;
    location: any | null;
    status: EventStatus;
    createdAt: Date;
    updatedAt: Date;
    event: GestorDeEvento;
    actions: AccionDisparada[];
}

export interface AccionDisparada {
    id: string;
    ejecucionId: string;
    tipoAccion: string;
    resultado: string;
    ejecutadoEn: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface GestorDeEvento {
    id: string;
    name: string;
    description: string | null;
    type: EventType;
    severity: EventSeverity;
    status: EventStatus;
    isPredefined: boolean;
    logicOperator: EventLogicOperator;
    timeWindowStart: Date | null;
    timeWindowEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdById: string;
    version: string;
    conditions: EventCondition[];
    variablesVisibles: EventoVariableVisible[];
    vehicles: any[]; // TODO: Define proper vehicle type
    executions: EjecucionEvento[];
}

export interface CreateEventTypeDTO {
    name: string;
    description: string;
    type: EventType;
    severity: EventSeverity;
    isPredefined?: boolean;
    logicOperator: EventLogicOperator;
    timeWindowStart?: Date;
    timeWindowEnd?: Date;
    createdById: string;
}

export interface UpdateEventTypeDTO {
    name?: string;
    description?: string;
    type?: EventType;
    severity?: EventSeverity;
    status?: EventStatus;
    isPredefined?: boolean;
    logicOperator?: EventLogicOperator;
    timeWindowStart?: Date;
    timeWindowEnd?: Date;
}

export interface CreateEventConditionDTO {
    eventId: string;
    type: EventConditionType;
    variable: string;
    operator: EventConditionOperator;
    value: number;
    value2?: number;
    unit?: string;
}

export interface UpdateEventConditionDTO {
    type?: EventConditionType;
    variable?: string;
    operator?: EventConditionOperator;
    value?: number;
    value2?: number;
    unit?: string;
}

export interface CreateEventExecutionDTO {
    eventId: string;
    vehicleId: string;
    sessionId?: string;
    data: any;
    displayData: any;
    location?: any;
}

export interface UpdateEventExecutionDTO {
    status?: EventStatus;
    data?: any;
    displayData?: any;
    location?: any;
}

export interface CreateEventActionDTO {
    ejecucionId: string;
    tipoAccion: string;
    resultado: string;
}

export interface EventFilters {
    status?: EventStatus;
    type?: EventType;
    vehicleId?: string;
    organizationId?: string;
}

export interface Event {
    id: string;
    type: EventType;
    status: EventStatus;
    organizationId: string;
    data: Record<string, unknown>;
    displayData: Record<string, unknown>;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
    vehicles: EventVehicle[];
}

export interface EventVehicle {
    id: string;
    eventId: string;
    vehicleId: string;
    createdAt: Date;
    updatedAt: Date;
    vehicle: Vehicle;
}

export interface CreateEventDTO {
    name: string;
    description: string;
    type: EventType;
    status: EventStatus;
    isPredefined: boolean;
    conditions: {
        variable: string;
        operator: string;
        value: string;
        value2?: string;
        unit?: string;
        type?: EventConditionType;
    }[];
    vehicles: string[];
    organizationId: string;
    createdById: string;
}

export interface UpdateEventDTO {
    name: string;
    description: string;
    type: EventType;
    status: EventStatus;
    isPredefined: boolean;
    conditions: {
        variable: string;
        operator: string;
        value: string;
        value2?: string;
        unit?: string;
        type?: EventConditionType;
    }[];
    vehicles: string[];
    organizationId: string;
}

export interface EventWithDetails {
    id: string;
    name: string;
    description: string;
    type: EventType;
    status: EventStatus;
    isPredefined: boolean;
    conditions: EventCondition[];
    vehicles: string[];
    vehicleNames: string[];
    estado: EventStatus;
    tipo: EventType;
}
