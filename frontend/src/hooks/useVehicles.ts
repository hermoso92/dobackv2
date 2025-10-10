import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';

export interface Vehicle {
    id: string;
    name: string;
    plate?: string;
    latitude?: number;
    longitude?: number;
    lastUpdate?: string;
    organizationId?: string;
}

export const useVehicles = () => {
    return useQuery({
        queryKey: ['vehicles'],
        queryFn: async (): Promise<Vehicle[]> => {
            try {
                logger.info('Obteniendo lista de vehículos');
                const response = await api.get('/api/vehicles');

                if (response.data && Array.isArray(response.data)) {
                    logger.info(`Vehículos obtenidos: ${response.data.length}`);
                    return response.data;
                }

                logger.warn('Respuesta de vehículos vacía o inválida');
                return [];
            } catch (error: any) {
                logger.error('Error obteniendo vehículos:', error);
                throw error;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    });
};

export const useVehicleById = (vehicleId: string | null) => {
    return useQuery({
        queryKey: ['vehicle', vehicleId],
        queryFn: async (): Promise<Vehicle | null> => {
            if (!vehicleId) return null;

            try {
                logger.info(`Obteniendo vehículo ${vehicleId}`);
                const response = await api.get(`/api/vehicles/${vehicleId}`);

                if (response.data) {
                    logger.info(`Vehículo obtenido: ${response.data.name}`);
                    return response.data;
                }

                return null;
            } catch (error: any) {
                logger.error(`Error obteniendo vehículo ${vehicleId}:`, error);
                throw error;
            }
        },
        enabled: !!vehicleId,
        staleTime: 5 * 60 * 1000,
        retry: 3
    });
};