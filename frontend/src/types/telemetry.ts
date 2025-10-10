// Tipos únicos para Telemetría según especificación

// Alias para compatibilidad con código existente
export type TelemetryData = TelemetrySession;
export type TelemetryDataPoint = {
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    accuracy: number;
    rpm: number;
    temperature: number;
    pressure: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    roadCondition: string;
    vehicleLoad: number;
    tirePressure: number;
    brakeTemperature: number;
    fuelLevel: number;
    engineTemperature: number;
    transmissionTemperature: number;
    differentialTemperature: number;
    suspensionPosition: number;
    steeringAngle: number;
    throttlePosition: number;
    brakePosition: number;
    clutchPosition: number;
    gearPosition: number;
};

export type TelemetryEvent = {
    id: string;
    sessionId: string;
    vehicleId: string;
    timestamp: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    latitude: number;
    longitude: number;
    description?: string;
    metadata?: Record<string, any>;
};

export type TelemetryMetrics = {
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    totalTime: number;
    eventsCount: number;
    criticalEventsCount: number;
    efficiency: number;
    fuelConsumption: number;
    emissions: number;
};

// Interfaces principales
export interface TelemetrySession {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    distance?: number;
    pointsCount: number;
    eventsCount: number;
    status: 'ACTIVE' | 'COMPLETED' | 'ERROR';
    metadata?: Record<string, any>;
}

export interface Vehicle {
    id: string;
    name: string;
    plate: string;
    type: string;
    status: 'ACTIVE' | 'INACTIVE';
    organizationId: string;
    metadata?: Record<string, any>;
}

export interface Event {
    id: string;
    sessionId: string;
    vehicleId: string;
    timestamp: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    latitude: number;
    longitude: number;
    description?: string;
    metadata?: Record<string, any>;
}

export interface MapPoint {
    id: string;
    sessionId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    altitude?: number;
    accuracy?: number;
    metadata?: Record<string, any>;
}

export interface Alarm {
    id: string;
    vehicleId: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    timestamp: string;
    acknowledged: boolean;
    metadata?: Record<string, any>;
}

// Función de validación
export function validateTelemetrySession(session: any): session is TelemetrySession {
    return (
        session &&
        typeof session.id === 'string' &&
        typeof session.vehicleId === 'string' &&
        typeof session.startTime === 'string' &&
        typeof session.pointsCount === 'number' &&
        typeof session.eventsCount === 'number' &&
        ['ACTIVE', 'COMPLETED', 'ERROR'].includes(session.status)
    );
}

export interface TelemetrySessionDTO {
    id: string;
    orgId: string;
    vehicleId: string;
    startedAt: string;
    endedAt?: string;
    pointsCount: number;
    bbox: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
    summary: {
        km: number;
        avgSpeed?: number;
        maxSpeed?: number;
        eventsBySeverity: {
            LOW: number;
            MEDIUM: number;
            HIGH: number;
            CRITICAL: number;
        };
    };
}

export interface TelemetryPointDTO {
    ts: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
    can?: Record<string, unknown>;
}

export interface GeofenceDTO {
    id: string;
    orgId: string;
    name: string;
    provider: 'RADAR' | 'LOCAL';
    type: 'POLYGON' | 'CIRCLE';
    geometry: {
        type: 'Polygon' | 'Circle';
        coordinates?: [number, number][][];
        center?: { latitude: number; longitude: number };
        radius?: number;
    };
    tags?: string[];
    version: number;
}

export interface EventDTO {
    id: string;
    orgId: string;
    ts: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sessionId?: string;
    vehicleId: string;
    lat: number;
    lng: number;
    meta?: Record<string, unknown>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Tipos para filtros y parámetros
export interface TelemetryFilters {
    from?: string;
    to?: string;
    vehicleId?: string;
    sessionId?: string;
    severity?: string;
    geofenceId?: string;
    type?: string;
}

export interface TelemetrySessionParams {
    from?: string;
    to?: string;
    vehicleId?: string;
    page?: number;
    limit?: number;
}

export interface TelemetryPointsParams {
    downsample?: '5s' | '10s' | '100m';
}

// Tipos para replay
export interface ReplayState {
    isPlaying: boolean;
    currentIndex: number;
    speed: 1 | 5 | 10;
    totalPoints: number;
}

// Tipos para heatmap
export interface HeatmapLayer {
    id: string;
    name: string;
    enabled: boolean;
    color: string;
    radius: number;
}

// Tipos para export
export interface ExportOptions {
    format: 'CSV' | 'PDF';
    includePoints: boolean;
    includeEvents: boolean;
    includeHeatmap: boolean;
    dateRange: {
        from: string;
        to: string;
    };
}