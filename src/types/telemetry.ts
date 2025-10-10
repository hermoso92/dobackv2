export interface CANData {
    timestamp: Date;
    vehicleId: string;
    sessionId: string;
    speed: number;
    inclination: number;
    load: number;
    temperature: number;
}

export interface GPSData {
    timestamp: Date;
    vehicleId: string;
    sessionId: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    hdop: number;
}

export interface TelemetryMetrics {
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
    averageAltitude: number;
    maxAltitude: number;
    minAltitude: number;
    averageInclination: number;
    maxInclination: number;
    averageTemperature: number;
    maxTemperature: number;
    averageLoad: number;
    maxLoad: number;
}

export interface TelemetrySession {
    id: string;
    vehicleId: string;
    startTime: Date;
    endTime: Date;
    canData: CANData[];
    gpsData: GPSData[];
    metrics: TelemetryMetrics;
}

export interface TelemetryResult {
    success: boolean;
    data?: TelemetrySession;
    error?: string;
} 