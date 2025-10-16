// Interfaces para el control de dispositivos y subida de archivos

export interface DeviceFileStatus {
    vehicleId: string;
    vehicleName: string;
    lastUploadDate: string | null;
    filesStatus: {
        estabilidad: boolean;
        can: boolean;
        gps: boolean;
        rotativo: boolean;
    };
    missingFiles: string[];
    isDisconnected: boolean; // Sin archivos por más de 24h
    connectionStatus: 'connected' | 'partial' | 'disconnected';
}

export interface DeviceControlData {
    totalVehicles: number;
    connectedVehicles: number;
    partialVehicles: number;
    disconnectedVehicles: number;
    devices: DeviceFileStatus[];
}

export interface FileUploadRecord {
    id: string;
    vehicleId: string;
    fileName: string;
    fileType: 'estabilidad' | 'can' | 'gps' | 'rotativo';
    uploadDate: string;
    sessionCount: number;
    measurementCount: number;
}

// Interfaces para filtros de gravedad en Estabilidad
export interface SeverityFilter {
    severity: 'leve' | 'moderada' | 'grave' | 'all';
    minFrequency: number;
}

export interface CriticalPoint {
    id: string;
    lat: number;
    lng: number;
    location: string;
    severity: 'leve' | 'moderada' | 'grave';
    frequency: number;
    lastOccurrence: string;
    vehicleIds: string[];
}

// Interfaces para límites DGT
export interface DGTVehicleCategory {
    id: string;
    name: string;
    type: 'ligero' | 'pesado' | 'autobus' | 'camion';
    speedLimits: {
        urban: number;
        interurban: number;
        highway: number;
    };
}

export interface SpeedViolation {
    id: string;
    vehicleId: string;
    vehicleName: string;
    timestamp: string;
    lat: number;
    lng: number;
    speed: number;
    speedLimit: number;
    violationType: 'grave' | 'moderado' | 'leve';
    rotativoOn: boolean;
    inPark: boolean;
    roadType: 'urban' | 'interurban' | 'highway';
}
