import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface Session {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime: string | null;
    status: string;
    vehicle?: {
        name: string;
        licensePlate: string;
    };
}

export const useSession = (sessionId: string) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await apiService.get(`/api/sessions/${sessionId}`);
                setSession(response.data as Session);
            } catch (err) {
                setError('Error cargando la sesión');
                logger.error('Error fetching session:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [sessionId]);

    return { session, loading, error };
}; 