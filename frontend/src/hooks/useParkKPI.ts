import { useCallback, useEffect, useState } from 'react';
import { getParkKPI } from '../services/kpi';

export function useParkKPI(parkId: string, token: string, date?: string) {
    const [kpi, setKpi] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchKPI = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getParkKPI(parkId, token, date);
            setKpi(data);
        } catch (err: any) {
            setError(err.message || 'Error al obtener KPIs');
        } finally {
            setLoading(false);
        }
    }, [parkId, token, date]);

    useEffect(() => {
        if (parkId && token) fetchKPI();
    }, [parkId, token, date, fetchKPI]);

    return { kpi, loading, error, refetch: fetchKPI };
} 