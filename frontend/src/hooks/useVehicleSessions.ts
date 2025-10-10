import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface Session {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime: string | null;
    status: string;
    gpsData: {
        timestamp: string;
        latitude: number;
        longitude: number;
        altitude: number;
        speed: number;
        heading: number;
        satellites: number;
        accuracy: number;
    }[];
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface PaginationParams {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
}

export const useVehicleSessions = (vehicleId: string | undefined) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const fetchSessions = useCallback(async (params: PaginationParams = {}) => {
        if (!vehicleId) {
            setSessions([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.status) queryParams.append('status', params.status);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);

            const response = await apiService.get<ApiResponse<Session[]>>(
                `/api/telemetry/${vehicleId}/sessions?${queryParams}`
            );

            logger.info('Sesiones obtenidas:', response);

            if (response.success) {
                // Si data es un número, significa que no hay sesiones reales
                if (typeof response.data === 'number') {
                    logger.warn('Backend devolvió número en lugar de array de sesiones:', response.data);
                    setSessions([]);
                    setPagination({
                        page: 1,
                        limit: 20,
                        total: response.data,
                        totalPages: Math.ceil(response.data / 20)
                    });
                } else if (Array.isArray(response.data)) {
                    setSessions(response.data);
                    if ('pagination' in response && response.pagination) {
                        setPagination(response.pagination as {
                            page: number;
                            limit: number;
                            total: number;
                            totalPages: number;
                        });
                    }
                } else {
                    throw new Error('Formato de respuesta inválido: data no es array ni número');
                }
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (err) {
            logger.error('Error obteniendo sesiones:', err);
            setError(err instanceof Error ? err : new Error('Error al obtener las sesiones'));
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const refreshSessions = useCallback(() => {
        fetchSessions();
    }, [fetchSessions]);

    const loadMoreSessions = useCallback(() => {
        if (pagination.page < pagination.totalPages) {
            fetchSessions({ page: pagination.page + 1, limit: pagination.limit });
        }
    }, [fetchSessions, pagination]);

    return {
        sessions,
        loading,
        error,
        pagination,
        refreshSessions,
        loadMoreSessions,
        fetchSessions
    };
}; 