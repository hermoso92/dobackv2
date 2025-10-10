import { UserRole } from './auth';
import { VehicleStatus, VehicleType } from './enums';

// Interfaz para la organización
export interface Organization {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para el usuario
export interface User {
    id: number;
    email: string;
    name: string;
    password: string;
    role: UserRole;
    organizationId: number;
    isEmailVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para el vehículo
export interface Vehicle {
    id: number;
    name: string;
    model: string;
    plateNumber: string;
    type: VehicleType;
    status: VehicleStatus;
    organizationId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la sesión
export interface Session {
    id: number;
    startTime: Date;
    endTime: Date | null;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    vehicleId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para el evento
export interface Event {
    id: number;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    vehicleId: number;
    organizationId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la telemetría
export interface Telemetry {
    id: number;
    latitude: number;
    longitude: number;
    speed: number;
    acceleration: number;
    temperature: number;
    batteryLevel: number;
    sessionId: number;
    vehicleId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la regla
export interface Rule {
    id: number;
    name: string;
    description: string;
    metric: 'ltr' | 'speed' | 'acceleration' | 'temperature' | 'batteryLevel';
    threshold: number;
    condition: '>' | '<' | '>=' | '<=' | '==' | '!=';
    action: string;
    organizationId: number;
    vehicleId: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la alarma
export interface Alarm {
    id: number;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
    ruleId: number;
    vehicleId: number;
    organizationId: number;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para la solicitud de mantenimiento
export interface MaintenanceRequest {
    id: number;
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scheduledDate: Date;
    completedDate: Date | null;
    vehicleId: number;
    organizationId: number;
    assignedTo: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// Interfaz para el registro de auditoría
export interface AuditLog {
    id: number;
    action: string;
    entity: string;
    entityId: number;
    userId: number;
    organizationId: number;
    details: any;
    createdAt: Date;
}

// Interfaz para la migración
export interface Migration {
    id: number;
    name: string;
    executedAt: Date;
}

// Interfaz para la respuesta de la base de datos
export interface DatabaseResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Interfaz para la paginación
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Interfaz para la respuesta paginada
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Interfaz para los filtros de búsqueda
export interface SearchFilters {
    [key: string]: any;
}

// Interfaz para las opciones de consulta
export interface QueryOptions {
    filters?: SearchFilters;
    pagination?: PaginationParams;
    include?: string[];
    select?: string[];
}

// Interfaz para el resultado de la consulta
export interface QueryResult<T> {
    data: T[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

// Interfaz para el error de la base de datos
export interface DatabaseError {
    code: string;
    message: string;
    details?: any;
}

// Interfaz para la transacción
export interface Transaction {
    commit(): Promise<void>;
    rollback(): Promise<void>;
}

// Interfaz para el cliente de la base de datos
export interface DatabaseClient {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<void>;
    beginTransaction(): Promise<Transaction>;
    commitTransaction(transaction: Transaction): Promise<void>;
    rollbackTransaction(transaction: Transaction): Promise<void>;
}
