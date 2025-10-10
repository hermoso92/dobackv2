import { useCallback, useEffect, useState } from 'react';
import { getAllZones } from '../services/zones';

export function useZones(token: string) {
    const [zones, setZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchZones = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllZones(token);
            setZones(data);
        } catch (err: any) {
            setError(err.message || 'Error al obtener zonas');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchZones();
    }, [token, fetchZones]);

    return { zones, loading, error, refetch: fetchZones };
} 