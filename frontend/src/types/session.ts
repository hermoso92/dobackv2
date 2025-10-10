export interface StabilitySession {
  id: string;
  vehicleId: string;
  date: string;
  duration: number;
  distance: string;
  maxSpeed: number;
  avgSpeed: number;
  dataPoints: number;
  status: string;
  summary: string;
  startTime?: string;
  endTime?: string;
  canData?: any[];
  gpsData?: any[];
  events?: any[];
}

export interface InterpolatedData {
  id: number;
  session_id: number;
  timestamp: string;
  roll: number;
  pitch: number;
  speed: number;
  latitude: number;
  longitude: number;
  altitude: number;
  metadata?: Record<string, any>;
}

export interface Event {
  id: number;
  session_id: number;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SessionWithDetails extends StabilitySession {
  interpolated_data: InterpolatedData[];
  events: Event[];
} 