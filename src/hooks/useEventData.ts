import { useCallback, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { EventData } from '../types/data';

interface UseEventDataResult {
    events: EventData[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useEventData(): UseEventDataResult {
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const dataService = DataService.getInstance();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Intentar cargar datos reales
            const hasRealData = await dataService.hasRealData('events');

            if (hasRealData) {
                const realData = await dataService.loadEventData();
                setEvents(realData);
            } else {
                // Datos simulados por defecto
                setEvents(Array.from({ length: 10 }, (_, i) => ({
                    id: `evt_${i + 1}`.padStart(6, '0'),
                    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
                    type: 'VEHICLE',
                    severity: i % 3 === 0 ? 'CRITICAL' :
                        i % 2 === 0 ? 'WARNING' :
                            'INFO',
                    message: i % 3 === 0 ? 'LTR crítico detectado' :
                        i % 2 === 0 ? 'Ángulo de inclinación elevado' :
                            'Condiciones normales',
                    vehicleId: `VH${(i % 5 + 1).toString().padStart(3, '0')}`,
                    acknowledged: i > 5,
                    resolved: i > 7
                })));
            }
        } catch (error) {
            setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { events, loading, error, refresh: loadData };
} 