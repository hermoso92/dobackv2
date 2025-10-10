export interface Geofence {
    id: string;
    externalId?: string;
    name: string;
    description?: string;
    tag?: string;
    type: 'POLYGON' | 'CIRCLE' | 'RECTANGLE';
    mode: 'CAR' | 'FOOT' | 'BIKE' | 'ALL';
    enabled: boolean;
    live: boolean;
    geometry: any;
    geometryCenter?: {
        type: 'Point';
        coordinates: [number, number];
    };
    geometryRadius?: number;
    disallowedPrecedingTagSubstrings?: any;
    ip?: any;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface GeofenceEvent {
    id: string;
    geofenceId: string;
    vehicleId: string;
    organizationId: string;
    type: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE';
    status: 'ACTIVE' | 'PROCESSED' | 'ARCHIVED';
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    data?: any;
    processed: boolean;
    createdAt: string;
    updatedAt: string;
    geofence?: Geofence;
}

export interface GeofenceFormData {
    name: string;
    description?: string;
    tag?: string;
    type: 'POLYGON' | 'CIRCLE' | 'RECTANGLE';
    mode: 'CAR' | 'FOOT' | 'BIKE' | 'ALL';
    enabled: boolean;
    live: boolean;
    geometry: any;
    geometryCenter?: {
        type: 'Point';
        coordinates: [number, number];
    };
    geometryRadius?: number;
}

export interface GeofenceStats {
    totalGeofences: number;
    enabledGeofences: number;
    totalEvents: number;
    enterEvents: number;
    exitEvents: number;
    activeVehicles: number;
}
