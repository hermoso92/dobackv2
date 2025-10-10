import { useEffect, useState } from 'react';
import { getEventClusters } from '../services/clustering';

export function useEventClusters(params: any, token: string) {
    const [clusters, setClusters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refetch = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getEventClusters(params, token);
            setClusters(data);
        } catch (err: any) {
            setError(err.message || 'Error al obtener clusters');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            refetch();
        }
    }, [params, token]);

    return { clusters, loading, error, refetch };
} 