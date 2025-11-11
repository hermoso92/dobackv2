// Tipos únicos para Telemetría según especificación
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
    route?: {
        distanceMeters: number | null;
        durationSeconds: number | null;
        confidence: number | null;
        source?: 'google' | 'osrm' | 'raw';
        persistedViolations?: number;
        google?: {
            polyline?: string;
            travelAdvisories?: string[];
            routeLabels?: string[];
            warnings?: string[];
        } | null;
        osrm?: {
            geometry?: any;
        } | null;
    };
    summary: {
        km: number;
        avgSpeed?: number;
        maxSpeed?: number;
        durationMinutes?: number;
        source?: 'google' | 'osrm' | 'raw';
        violationsCount?: number;
        eventsBySeverity: {
            LOW: number;
            MEDIUM: number;
            HIGH: number;
            CRITICAL: number;
        };
    };
}

export interface SpeedViolationDTO {
    id: string;
    orgId: string;
    sessionId: string;
    vehicleId: string;
    timestamp: string;
    lat: number;
    lon: number;
    snappedLat?: number;
    snappedLon?: number;
    speed: number;
    speedLimit: number;
    excess: number;
    violationType: string;
    roadType: string;
    source: string;
    confidence: string;
    placeId?: string;
    metadata?: Record<string, unknown> | null;
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