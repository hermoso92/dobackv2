export type VehicleType = 'car' | 'truck' | 'van' | 'bus' | 'motorcycle' | 'other';
export type VehicleStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'REPAIR';

export interface Organization {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  model: string;
  brand: string;
  type: VehicleType;
  status: string;
  organization?: Organization;
  organizationId?: string;
}

export interface VehicleStats {
  totalSessions: number;
  sessionsWithEvents: number;
  totalDistance: number;
  totalDuration: number;
  averageSpeed: number;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  activeAlarms: number;
  waterPressure: number;
  foamConcentration: number;
}

export interface VehicleWithStats extends Vehicle {
  stats: VehicleStats;
  stabilitySessions?: any[];
  canGpsSessions?: any[];
  events?: any[];
  alarms?: any[];
  maintenanceRequests?: any[];
}

export interface VehicleLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lastUpdate: string;
  plate?: string;
  status?: string;
} 