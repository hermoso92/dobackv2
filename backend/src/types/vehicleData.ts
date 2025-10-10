export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface GeoPosition {
    latitude: number;
    longitude: number;
    altitude: number;
}

export interface SessionHeader {
    type: string;
    timestamp: Date;
    vehicleId: string;
    sessionNumber: string;
    flags: string;
    fileName: string;
    vehicleName: string;
}

export interface VehicleSession<T = StabilityData | CANData | GPSData> {
    header: SessionHeader;
    data: T[];
}

export interface StabilityData {
    timestamp: Date;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    timeantwifi: number;
    usciclo1: number;
    usciclo2: number;
    usciclo3: number;
    usciclo4: number;
    usciclo5: number;
    si: number;
    accmag: number;
    microsds: number;
    isLateralGForceHigh: boolean;
    isLTRCritical: boolean;
    isDRSHigh: boolean;
}

export interface CANData {
    timestamp: Date;
    engineRpm: number;
    vehicleSpeed: number;
    engineLoad: number;
    engineTemp: number;
    alarms: string[];
}

export interface GPSData {
    timestamp: Date;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    quality: number;
    satellites: number;
    alarms: string[];
}

export interface VehicleDataResponse {
    stability?: StabilityData[];
    can?: CANData[];
    gps?: GPSData[];
    error?: string;
}
