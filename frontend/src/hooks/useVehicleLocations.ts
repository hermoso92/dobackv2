import { useEffect, useState } from 'react';
import { ERROR_CONFIG, GEO_CONFIG } from '../config/constants';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface VehicleLocation {
    id: string;
    name: string;
    plate: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    lastUpdate: string;
}

interface ApiResponse {
    success: boolean;
    data: {
        id: string;
        name: string;
        plate: string;
        licensePlate?: string; // Added licensePlate to the interface
        location?: {
            latitude: number;
            longitude: number;
            speed: number;
            heading?: number;
            lastUpdate: string;
        };
    }[];
    message?: string;
}

export const useVehicleLocations = () => {
    const [locations, setLocations] = useState<VehicleLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const response = await apiService.get<ApiResponse>('/api/vehicles');

            if (response.success && Array.isArray(response.data)) {
                // Si no hay ubicaciones en la respuesta, usar ubicaciones por defecto en Córdoba
                const vehicleLocations = response.data.map(vehicle => {
                    // Si no hay ubicación, usar una ubicación por defecto en Córdoba
                    const defaultLocation = {
                        latitude: GEO_CONFIG.DEFAULT_CENTER.latitude + (Math.random() * GEO_CONFIG.DEFAULT_LOCATION_VARIATION * 2 - GEO_CONFIG.DEFAULT_LOCATION_VARIATION),
                        longitude: GEO_CONFIG.DEFAULT_CENTER.longitude + (Math.random() * GEO_CONFIG.DEFAULT_LOCATION_VARIATION * 2 - GEO_CONFIG.DEFAULT_LOCATION_VARIATION),
                        speed: 0,
                        lastUpdate: new Date().toISOString()
                    };

                    return {
                        id: vehicle.id,
                        name: vehicle.name,
                        plate: vehicle.licensePlate || vehicle.plate || ERROR_CONFIG.FALLBACKS.VEHICLE_PLATE,
                        latitude: vehicle.location?.latitude || defaultLocation.latitude,
                        longitude: vehicle.location?.longitude || defaultLocation.longitude,
                        speed: vehicle.location?.speed || defaultLocation.speed,
                        heading: vehicle.location?.heading,
                        lastUpdate: vehicle.location?.lastUpdate || defaultLocation.lastUpdate
                    };
                });

                logger.info('Ubicaciones de vehículos obtenidas', {
                    count: vehicleLocations.length,
                    vehicles: vehicleLocations.map(v => ({
                        id: v.id,
                        name: v.name,
                        plate: v.plate,
                        latitude: v.latitude,
                        longitude: v.longitude
                    }))
                });

                setLocations(vehicleLocations);
                setError(null);
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al obtener ubicaciones';
            logger.error('Error obteniendo ubicaciones de vehículos:', { error: err });
            setError(errorMessage);
            // Mostrar error al usuario
            logger.error('Error obteniendo ubicaciones:', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Realizamos una única carga inicial; las actualizaciones posteriores serán manuales
        fetchLocations();
        // Si en el futuro se desea reactivar el refresco automático, basta con volver a agregar un setInterval aquí
        return () => { /* sin intervalos */ };
    }, []);

    return { locations, loading, error, refetch: fetchLocations };
}; 