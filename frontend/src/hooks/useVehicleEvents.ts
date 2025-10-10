import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { StabilityEvent } from '../types/stability';
import { logger } from '../utils/logger';

/**
 * Hook para obtener eventos de una sesión específica
 * NOTA: Este hook ahora obtiene eventos por sesión, no por vehículo
 */
export const useVehicleEvents = (vehicleId: string | null, sessionId: string | null) => {
    const [events, setEvents] = useState<StabilityEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            // Solo obtener eventos si hay una sesión seleccionada
            if (!sessionId) {
                setEvents([]);
                return;
            }

            setLoading(true);
            try {
                // Usar el endpoint correcto que filtra por sesión
                const query = `/api/stability/events/${sessionId}`;
                const response = await apiService.get<any>(query);

                let eventsArr: any[] = [];

                if (response.data.success && Array.isArray(response.data.events)) {
                    eventsArr = response.data.events;
                } else if (Array.isArray(response.data)) {
                    eventsArr = response.data;
                }

                logger.info('Eventos de sesión cargados', {
                    sessionId,
                    vehicleId,
                    eventCount: eventsArr.length
                });

                // Mapear eventos al formato esperado
                const mapped: StabilityEvent[] = eventsArr.map(ev => ({
                    id: ev.id || `${ev.timestamp}-${ev.lat}-${ev.lon}`,
                    lat: ev.lat ?? ev.latitude ?? 0,
                    lon: ev.lon ?? ev.longitude ?? 0,
                    timestamp: ev.timestamp || ev.triggeredAt,
                    tipos: ev.tipos || [ev.type || 'unknown'],
                    valores: ev.valores || { value: ev.value ?? 0 },
                    can: ev.can || undefined,
                    level: ev.level,
                    perc: ev.perc
                }));

                setEvents(mapped);
            } catch (err) {
                logger.error('Error cargando eventos de sesión', {
                    error: err,
                    sessionId,
                    vehicleId
                });
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [sessionId]); // Solo depender de sessionId, no de vehicleId

    return { events, loading };
}; 