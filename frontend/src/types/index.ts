import type {
  AlertStatus,
  AlertType,
  Severity,
  Status,
  ThemeMode
} from './common';
// Export all common types except those that are redefined in domain
export type {
  AlertStatus,
  AlertType, ApiResponse, BaseEntity, ChartData, ChartDataset, Notification, PaginatedResponse, RiskLevel, Severity, Status, ThemeMode, UserRole
} from './common';

// Export domain types
export * from './domain';

// Export feature-specific types
export * from './data';
export * from './stability';
export * from './telemetry';
export * from './user';
export * from './vehicle';

// Context Types
export interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

// Query Types
export interface QueryConfig<TData = unknown> {
  queryKey: string[];
  queryFn: () => Promise<TData>;
  options?: {
    enabled?: boolean;
    retry?: boolean | number;
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    refetchOnReconnect?: boolean;
    suspense?: boolean;
  };
}

// Mutation Types
export interface MutationConfig<TData = unknown, TError = unknown, TVariables = void> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: TError, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void | Promise<void>;
}

// Vehicle related types
export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  type: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleWithStats extends Vehicle {
  stats: {
    totalAlerts: number;
    lastStabilityIndex: number;
    averageStabilityIndex: number;
  };
}

// Telemetry related types
export interface TelemetryData {
  timestamp: string;
  speed: number;
  rpm: number;
  temperature: number;
  fuel: number;
  battery: number;
  oil_pressure: number;
  brake_pad: number;
  tire_pressure: number;
  roll_angle: number;
  pitch_angle: number;
  vehicleId: number;
}

// Stability related types
export interface StabilityData {
  id: number;
  vehicleId: number;
  timestamp: string;
  roll: number;
  pitch: number;
  yaw: number;
  lateralAcceleration: number;
  longitudinalAcceleration: number;
  verticalAcceleration: number;
  stabilityIndex: number;
  status: 'stable' | 'unstable' | 'critical';
  createdAt: string;
  updatedAt: string;
}

// Alert related types
export interface Alert {
  id: number;
  vehicleId: number;
  type: AlertType;
  severity: Severity;
  message: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
}

// Event related types
export interface Event {
  id: number;
  type: string;
  description: string;
  severity: Severity;
  timestamp: string;
  status: AlertStatus;
  vehicleId: number;
}

// Alarm related types
export interface Alarm {
  id: number;
  name: string;
  type: string;
  condition: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  enabled: boolean;
  severity: Severity;
  notifyEmail: boolean;
  notifySMS: boolean;
}

// Theme related types
export interface ThemeState {
  mode: ThemeMode;
}

// Form related types
export interface VehicleForm {
  name: string;
  model: string;
  year: number;
  licensePlate: string;
}
