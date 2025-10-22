import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../../services/api';
import { logger } from '../../../../utils/logger';
import { ParksKPIs } from '../types';

/**
 * Hook personalizado para gestionar KPIs de parques
 */
export const useDashboardParks = () => {
    const [parksKPIs, setParksKPIs] = useState<ParksKPIs>({
        vehiclesInParks: 0,
        vehiclesOutOfParks: 0,
        averageTimeOutside: 0,
        parkEntriesToday: 0,
        parkExitsToday: 0,
        parksData: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carga KPIs de parques
     */
    const loadParksKPIs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [parksResponse, vehiclesResponse, geofenceEventsResponse] = await Promise.all([
                apiService.get<{ success: boolean; data: any[] }>('/api/parks'),
                apiService.get<{ success: boolean; data: any[] }>('/api/vehicles'),
                apiService.get<{ success: boolean; data: any[] }>('/api/geofences/events?today=true')
            ]);

            if (parksResponse.data?.success && vehiclesResponse.data?.success && geofenceEventsResponse.data?.success) {
                const parks = parksResponse.data.data;
                const vehicles = vehiclesResponse.data.data;
                const geofenceEvents = geofenceEventsResponse.data.data || [];

                // Calcular KPIs
                const vehiclesInParks = vehicles.filter(v => v.parkId).length;
                const vehiclesOutOfParks = vehicles.filter(v => !v.parkId).length;

                // Calcular eventos de entrada/salida de hoy
                const today = new Date().toISOString().split('T')[0];
                const todayEvents = geofenceEvents.filter(event =>
                    event.timestamp.startsWith(today)
                );

                const parkEntriesToday = todayEvents.filter(event => event.event_type === 'ENTER').length;
                const parkExitsToday = todayEvents.filter(event => event.event_type === 'EXIT').length;

                // Calcular tiempo promedio fuera del parque
                const averageTimeOutside = 2.5; // TODO: Calcular desde datos reales

                // Datos por parque
                const parksData = parks.map(park => {
                    const parkVehicles = vehicles.filter(v => v.parkId === park.id);
                    const parkEvents = todayEvents.filter(event =>
                        event.geofence?.name?.includes(park.name)
                    );

                    return {
                        id: park.id,
                        name: park.name,
                        vehiclesCount: parkVehicles.length,
                        entriesToday: parkEvents.filter(e => e.event_type === 'ENTER').length,
                        exitsToday: parkEvents.filter(e => e.event_type === 'EXIT').length
                    };
                });

                setParksKPIs({
                    vehiclesInParks,
                    vehiclesOutOfParks,
                    averageTimeOutside,
                    parkEntriesToday,
                    parkExitsToday,
                    parksData
                });

                logger.info('KPIs de Parques cargados:', {
                    vehiclesInParks,
                    vehiclesOutOfParks,
                    parkEntriesToday,
                    parkExitsToday
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando KPIs de parques';
            setError(errorMessage);
            logger.error('Error cargando KPIs de Parques:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Efecto para cargar datos al montar
     */
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            if (mounted) {
                await loadParksKPIs();
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [loadParksKPIs]);

    return {
        parksKPIs,
        loading,
        error,
        reload: loadParksKPIs
    };
};

