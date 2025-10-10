export interface TelemetryData {
    timestamp: number;
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
    angular_x: number;
    angular_y: number;
    angular_z: number;
    speed: number;
    lateral_acc: number;
    roll_angle: number;
    pitch_angle: number;
}

export interface StabilityData {
    timestamp: number;
    ltr: number;
    angle: number;
    roll: number;
    pitch: number;
    lateralAcceleration: number;
    gyro_x: number;
    gyro_y: number;
    gyro_z: number;
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
    speed: number;
}

export interface VehicleData {
    id: string;
    name: string;
    type: string;
    status: string;
    lastUpdate: string;
    metrics: {
        stabilityScore: number;
        alerts: number;
        distance: number;
    };
}

export interface EventData {
    id: string;
    timestamp: string;
    type: string;
    severity: string;
    message: string;
    vehicleId: string;
    acknowledged: boolean;
    resolved: boolean;
}

export interface DashboardData {
    vehiclesCount: number;
    activeAlerts: number;
    criticalEvents: number;
    stabilityScore: number;
    recentEvents: EventData[];
    processedData: {
        stabilitySessions: number;
        canData: string;
        gpsRoutes: number;
        totalTime: string;
    };
} 