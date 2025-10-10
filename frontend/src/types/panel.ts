// Tipos para el módulo Panel & KPIs

export interface KPIData {
    vehiclesActive: number;
    km: number;
    timeInYard: number;
    timeOutYard: number;
    timeInWorkshop: number;
    speeding: {
        count: number;
        topVehicles: Array<{
            vehicleId: string;
            vehicleName: string;
            count: number;
        }>;
    };
    incidentsBySeverity: {
        LOW: number;
        MEDIUM: number;
        HIGH: number;
        CRITICAL: number;
    };
    geofence: {
        entries: number;
        exits: number;
        violations: number;
    };
}

export interface HeatmapData {
    type: 'speeding' | 'critical' | 'violations';
    points: Array<{
        lat: number;
        lng: number;
        intensity: number;
        timestamp: string;
        vehicleId: string;
        eventType?: string;
    }>;
}

export interface Alert {
    id: string;
    timestamp: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    vehicleId: string;
    vehicleName: string;
    message: string;
    location?: {
        lat: number;
        lng: number;
    };
    metadata?: any;
}

export interface RealtimeEvent {
    id: string;
    timestamp: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    vehicleId: string;
    vehicleName: string;
    location: {
        lat: number;
        lng: number;
    };
    data: any;
}

export interface PanelFilters {
    from?: string;
    to?: string;
    vehicleId?: string;
    organizationId?: string;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    eventType?: string;
}

export interface DrillDownParams {
    module: 'telemetry' | 'stability';
    filters: {
        from: string;
        to: string;
        vehicleId?: string;
        eventType?: string;
        severity?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Tipos para estadísticas detalladas
export interface VehicleStats {
    vehicleId: string;
    vehicleName: string;
    totalKm: number;
    totalTime: number;
    avgSpeed: number;
    maxSpeed: number;
    incidentsCount: number;
    lastUpdate: string;
}

export interface TimeStats {
    inYard: number;      // minutos
    outYard: number;     // minutos
    inWorkshop: number;  // minutos
    total: number;       // minutos
}

export interface SpeedStats {
    totalViolations: number;
    avgViolationSpeed: number;
    maxViolationSpeed: number;
    topViolationZones: Array<{
        lat: number;
        lng: number;
        count: number;
        avgSpeed: number;
    }>;
}

export interface GeofenceStats {
    totalEntries: number;
    totalExits: number;
    totalViolations: number;
    mostActiveGeofences: Array<{
        geofenceId: string;
        geofenceName: string;
        entries: number;
        exits: number;
        violations: number;
    }>;
}
