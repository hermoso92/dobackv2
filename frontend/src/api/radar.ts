import { apiService } from '../services/api';
import { ApiResponse } from '../types/api';
import { logger } from '../utils/logger';

type RadarGeometry = {
    type: string;
    coordinates?: unknown;
    center?: { latitude: number; longitude: number };
    radius?: number;
};

export interface RadarGeofence {
    id: string;
    description?: string;
    geometry: RadarGeometry;
    [key: string]: unknown;
}

export const getGeofences = async (): Promise<RadarGeofence[]> => {
    try {
        const response: ApiResponse<RadarGeofence[]> = await apiService.get('/api/radar/geofences');
        if (!response.success) {
            throw new Error(response.error || 'No se pudieron obtener las geocercas');
        }
        const payload = response.data;
        if (Array.isArray((payload as any).geofences)) {
            return (payload as any).geofences as RadarGeofence[];
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    } catch (error) {
        logger.error('Error obteniendo geocercas de Radar', error);
        throw error instanceof Error ? error : new Error('No se pudieron obtener las geocercas');
    }
};

export const geocode = async <T = unknown>(query: string): Promise<T> => {
    try {
        const response: ApiResponse<T> = await apiService.post('/api/radar/geocode', { query });
        if (!response.success) {
            throw new Error(response.error || 'No se pudo geocodificar la direccion');
        }
        return response.data;
    } catch (error) {
        logger.error('Error geocodificando via Radar', error);
        throw error instanceof Error ? error : new Error('No se pudo geocodificar la direccion');
    }
};

