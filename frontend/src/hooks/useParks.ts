import { useCallback, useEffect, useState } from 'react';
import { getAllParks } from '../services/parks';

export function useParks(token: string) {
    const [parks, setParks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchParks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllParks(token);
            setParks(data);
        } catch (err: any) {
            setError(err.message || 'Error al obtener parques');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchParks();
    }, [token, fetchParks]);

    return { parks, loading, error, refetch: fetchParks };
} 