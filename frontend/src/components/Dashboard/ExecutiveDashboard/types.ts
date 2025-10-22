/**
 * Tipos e interfaces para el Dashboard Ejecutivo
 */

export interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

export interface RouteData {
    id: string;
    path: [number, number][];
    color: string;
}

export interface GeofenceData {
    id: string;
    name: string;
    geometry: GeoJSON.Geometry;
}

export interface HeatmapData {
    points: HeatmapPoint[];
    routes: RouteData[];
    geofences: GeofenceData[];
}

export interface BlackSpotCluster {
    lat: number;
    lng: number;
    radius: number;
    count: number;
    severity: 'CRITICO' | 'GRAVE' | 'MODERADO';
}

export interface BlackSpotRanking {
    position: number;
    location: string;
    events: number;
}

export interface BlackSpotsData {
    clusters: BlackSpotCluster[];
    ranking: BlackSpotRanking[];
}

export interface SpeedViolation {
    id: string;
    timestamp: Date;
    location: {
        lat: number;
        lng: number;
    };
    speed: number;
    speedLimit: number;
    excess: number;
}

export interface SessionData {
    session: Record<string, unknown>; // TODO: tipar correctamente cuando se refactorice SessionsAndRoutesView
    routeData: Record<string, unknown>;
}

export interface ParkData {
    id: string;
    name: string;
    vehiclesCount: number;
    entriesToday: number;
    exitsToday: number;
}

export interface ParksKPIs {
    vehiclesInParks: number;
    vehiclesOutOfParks: number;
    averageTimeOutside: number;
    parkEntriesToday: number;
    parkExitsToday: number;
    parksData: ParkData[];
}

