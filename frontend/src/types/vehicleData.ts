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
  type: 'CAN' | 'ESTABILIDAD' | 'GPS';
  timestamp: string;
  vehicleId: string;
  sessionId: number;
  sequence: number;
}

export interface StabilityData {
  timestamp: string;
  acceleration: Vector3D;
  gyroscope: Vector3D;
  isLateralGForceHigh?: boolean;
  isLTRCritical?: boolean;
  isDRSHigh?: boolean;
}

export interface CANData {
  timestamp: string;
  engineRPM: number;
  vehicleSpeed: number;
  engineLoad: number;
  engineTemp: number;
  alarms?: {
    type: string;
    value: number;
    threshold: number;
    message: string;
  }[];
}

export interface GPSData {
  timestamp: string;
  position: GeoPosition;
  speed: number;
  satellites: number;
  hdop: number;
  adjustedPosition?: [number, number]; // Para coordenadas ajustadas a Madrid
  isCriticalEvent?: boolean;
}

export interface VehicleSession {
  header: SessionHeader;
  data: StabilityData[] | CANData[] | GPSData[];
}

/**
 * Interfaz para una alerta del análisis de IA
 */
export interface AIAlert {
  id: number;
  title: string;
  level: string;
  recommendation: string;
}

/**
 * Interfaz para las métricas de estabilidad de un vehículo
 */
export interface StabilityMetrics {
  ltr: number;
  ssf: number;
  drs: number;
  roll: number;
  pitch: number;
  lateralAcceleration: number;
  longitudinalAcceleration: number;
  speed: number;
  confidenceScore: number;
}

/**
 * Interfaz para la respuesta de datos de un vehículo
 */
export interface VehicleDataResponse {
  id: string;
  date: string;
  stabilityScore: number;
  riskLevel: string;
  metrics: StabilityMetrics;
  patterns: string[];
  alerts: AIAlert[];
  recommendations: string[];
}

export interface DataPoint {
  timestamp: string;
  value: number;
}

export interface ChartData {
  label: string;
  data: DataPoint[];
  color?: string;
}

export interface CANAlarmRule {
  pid: string;
  description: string;
  condition: 'equals' | 'greater' | 'less';
  value: number;
  message: string;
}

export interface SessionComparison {
  sessionA: VehicleSession;
  sessionB: VehicleSession;
  differences: {
    metric: string;
    valueA: number;
    valueB: number;
    difference: number;
    percentChange: number;
  }[];
} 