/**
 * Definiciones de tipos para el sistema de monitoreo de estabilidad
 */

// Datos de telemetría de sensores
export interface TelemetryData {
  // Identificación y tiempo
  id?: string;
  timestamp: number;
  
  // Acelerómetro (g)
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  
  // Giroscopio (grados/s)
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  
  // Ángulos (grados)
  angular_x: number; // roll
  angular_y: number; // pitch
  angular_z: number; // yaw
  
  // Datos procesados
  speed: number;          // km/h
  lateral_acc: number;    // g
  roll_angle: number;     // grados
  pitch_angle: number;    // grados
  
  // Metadatos opcionales
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

// Configuración del vehículo
export interface VehicleConfig {
  id?: string;
  name?: string;
  track_width: number;   // m - Ancho de vía
  cg_height: number;     // m - Altura del centro de gravedad
  wheelbase: number;     // m - Distancia entre ejes
  mass: number;          // kg - Masa
  max_speed: number;     // km/h - Velocidad máxima
  vehicle_type?: 'car' | 'truck' | 'bus' | 'motorcycle';
}

// Métricas de estabilidad
export interface StabilityMetrics {
  ltr: number;           // Lateral Transfer Ratio (-1 a 1)
  ssf: number;           // Static Stability Factor (típicamente 0.5 a 2.0)
  drs: number;           // Dynamic Rollover Stability (0 a 1)
  dangerLevel: number;   // Nivel de peligrosidad (0 a 1)
  timestamp?: number;    // Tiempo del cálculo
}

// Información de peligrosidad
export interface DangerInfo {
  dangerLevel: number;   // 0 a 1
  level: 'safe' | 'warning' | 'danger' | 'critical';
  color: string;         // Color CSS
  description: string;
  ltrValue: number;
  ssfValue: number;
  drsValue: number;
  timestamp?: number;
}

// Información de tendencia
export interface TrendInfo {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  direction?: 'up' | 'down' | 'none';
}

// Información estadística
export interface StatisticsInfo {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
}

// Datos procesados para gráficas
export interface ProcessedTelemetryPoint {
  timestamp: number;
  timeFormatted: string;
  ltr: number;
  ssf: number;
  drs: number;
  dangerLevel: number;
}

// Alarma
export interface Alarm {
  id: string;
  type: 'LTR' | 'SSF' | 'DRS' | 'ROLL' | 'LATERAL_ACC' | 'SYSTEM';
  level: 'warning' | 'danger' | 'critical';
  value: number;
  threshold: number;
  description: string;
  timestamp: number;
  acknowledged?: boolean;
}

// Evento crítico
export interface CriticalEvent {
  id: string;
  type: string;
  level: 'warning' | 'danger' | 'critical';
  description: string;
  timestamp: number;
  duration?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  telemetry?: TelemetryData;
  stability?: StabilityMetrics;
}

// Opciones para componentes de visualización
export interface VisualizationOptions {
  timeWindow: number;        // segundos
  samplingRate: number;      // Hz
  decimationFactor?: number; // Factor de reducción de datos
  showDetails?: boolean;     // Mostrar detalles adicionales
}

// Props para componentes de estabilidad
export interface StabilityProps {
  telemetryData: TelemetryData[];
  vehicleConfig: VehicleConfig;
  options?: VisualizationOptions;
} 