import { apiService } from '../services/api';
import { logger } from '../utils/logger';

export interface TelemetryPoint {
    lat: number;
    lng: number;
    recorded_at: string;
    severity: number;
    speed: number | null;
    accuracy?: number | null;
}

export interface TelemetryVehicle {
    id: string;
    name: string;
    licensePlate: string;
    status: string;
    parkId?: string | null;
}

export interface TelemetrySessionSummary {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime: string | null;
    status: string;
    type: string;
    vehicle?: {
        name: string;
        licensePlate: string | null;
    } | null;
}

export interface TelemetryOrganizationInfo {
    vehicles: TelemetryVehicle[];
    parks: Array<{ id: string; name: string; location: unknown }>;
    zones: Array<{ id: string; name: string; type: string; geometry: unknown; parkId: string | null }>;
}

export const fetchOrganizationInfo = async (): Promise<TelemetryOrganizationInfo> => {
    const response = await apiService.get<TelemetryOrganizationInfo>('/api/telemetry/organization-info');

    if (!response.success) {
        throw new Error(response.error || 'No se pudo obtener la informacion de telemetria');
    }

    return response.data;
};

export const fetchSessions = async (vehicleId?: string, limit?: number): Promise<TelemetrySessionSummary[]> => {
    const response = await apiService.get<TelemetrySessionSummary[]>('/api/telemetry/sessions', {
        params: {
            vehicleId,
            limit
        }
    });

    if (!response.success) {
        throw new Error(response.error || 'No se pudieron obtener las sesiones');
    }

    return response.data;
};

export const fetchSessionGps = async (sessionId: string): Promise<TelemetryPoint[]> => {
    try {
        const response = await apiService.get<TelemetryPoint[]>(`/api/telemetry/sessions/${sessionId}/gps`);

        if (!response.success) {
            throw new Error(response.error || 'No se pudieron obtener los puntos GPS');
        }

        return response.data;
    } catch (error) {
        logger.error('Error obteniendo GPS de sesion', { error, sessionId });
        throw error instanceof Error ? error : new Error('No se pudo obtener la telemetria de la sesion');
    }
};

