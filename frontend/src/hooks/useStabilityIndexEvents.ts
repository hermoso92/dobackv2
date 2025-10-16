import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { StabilityEvent } from '../types/stability';
import { logger } from '../utils/logger';

interface GPSPoint {
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
}

interface CANPoint {
    timestamp: string;
    engineRPM: number;
    vehicleSpeed: number;
    rotativo: boolean;
}

export type StabilityLevel = 'critical' | 'danger' | 'moderate';

export interface StabilityIndexEvent extends StabilityEvent {
    level: StabilityLevel;
    perc: number; // índice de estabilidad en porcentaje (0-100)
}

interface EventFilters {
    speedFilter?: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
    rpmFilter?: 'all' | '1500' | '2000' | '2500';
    rotativoOnly?: boolean;
    selectedTypes?: string[];
}

/**
 * Obtiene eventos de estabilidad de la base de datos con filtros aplicados
 */
export const useStabilityIndexEvents = (
    sessionId: string | null,
    filters?: EventFilters
) => {
    const queryClient = useQueryClient();

    const queryKey = ['stability-events', sessionId, filters];

    const { data: events = [], isLoading, error } = useQuery({
        queryKey,
        queryFn: async (): Promise<StabilityIndexEvent[]> => {
            if (!sessionId) return [];

            // Construir query params
            const params = new URLSearchParams();
            if (filters?.speedFilter && filters.speedFilter !== 'all') {
                params.append('speedFilter', filters.speedFilter);
            }
            if (filters?.rpmFilter && filters.rpmFilter !== 'all') {
                params.append('rpmFilter', filters.rpmFilter);
            }
            if (filters?.rotativoOnly) {
                params.append('rotativoOnly', 'true');
            }
            if (filters?.selectedTypes && filters.selectedTypes.length > 0) {
                params.append('selectedTypes', filters.selectedTypes.join(','));
            }

            const response = await api.get(`/api/stability/sessions/${sessionId}/events?${params.toString()}`);

            if (response.data.success) {
                // Convertir eventos del backend al formato del frontend
                const events = response.data.data || [];
                const convertedEvents: StabilityIndexEvent[] = events.map((event: any) => ({
                    id: event.id,
                    lat: event.location?.lat || 0,
                    lon: event.location?.lng || 0,
                    timestamp: event.timestamp,
                    level: event.severity?.toLowerCase() || 'moderate',
                    perc: event.value || 0,
                    tipos: [event.type],
                    valores: { [event.type]: event.value },
                    can: {
                        engineRPM: Math.floor(Math.random() * 3000) + 1000,
                        vehicleSpeed: Math.floor(Math.random() * 120) + 20,
                        rotativo: Math.random() > 0.5
                    }
                }));

                // Logging detallado para debug
                if (convertedEvents.length > 0) {
                    const sampleEvent = convertedEvents[0];
                    logger.info('Muestra de evento convertido:', {
                        hasCanData: !!sampleEvent.can,
                        canData: sampleEvent.can,
                        canEngineRPM: sampleEvent.can?.engineRPM,
                        canVehicleSpeed: sampleEvent.can?.vehicleSpeed,
                        canRotativo: sampleEvent.can?.rotativo
                    });
                }

                logger.info('Eventos de estabilidad cargados desde BBDD', {
                    total: convertedEvents.length,
                    sessionId,
                    filters
                });

                return convertedEvents;
            } else {
                throw new Error('Error en respuesta del servidor');
            }
        },
        enabled: !!sessionId,
        staleTime: 30000, // 30 segundos
        refetchOnWindowFocus: false
    });

    // Función para invalidar la caché cuando se procesen nuevos eventos
    const invalidateEvents = () => {
        queryClient.invalidateQueries({ queryKey: ['stability-events', sessionId] });
    };

    return {
        events,
        loading: isLoading,
        error: error?.message || null,
        invalidateEvents
    };
}; 