import { useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface DashboardStats {
    totalVehicles: number;
    activeVehicles: number;
    totalAlerts: number;
    activeAlerts: number;
    recentEvents?: any[];
}

export const useDashboardStats = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastFetchRef = useRef<number>(0);
    const FETCH_COOLDOWN = 10000; // 10 segundos entre peticiones

    const fetchStats = async () => {
        // Evitar peticiones repetitivas
        const now = Date.now();
        if (now - lastFetchRef.current < FETCH_COOLDOWN) {
            logger.debug('Petición de dashboard stats cancelada por cooldown');
            return;
        }

        // Cancelar petición anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController();
        lastFetchRef.current = now;

        try {
            setLoading(true);
            setError(null);

            // Usar el endpoint único del backend en lugar de múltiples peticiones
            const response = await apiService.get<{ success: boolean; data: DashboardStats }>('/api/dashboard/stats', {
                signal: abortControllerRef.current.signal
            });

            if (response.success && response.data) {
                setStats(response.data);
                logger.info('Dashboard stats actualizados', response.data);
            } else {
                throw new Error('Error al cargar estadísticas del dashboard');
            }
        } catch (err: any) {
            // No mostrar error si fue cancelado (AbortError o CanceledError)
            if (err?.name === 'AbortError' || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
                logger.debug('Petición de dashboard stats cancelada');
                return;
            }

            const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
            setError(errorMessage);
            logger.error('Error al cargar estadísticas del dashboard:', err);
            setRetryCount(prev => prev + 1);
        } finally {
            // Siempre cambiar loading a false
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        // Configurar un intervalo más largo para actualizar los datos
        const intervalId = setInterval(() => {
            // Solo hacer fetch si no hay una petición en curso
            if (!abortControllerRef.current) {
                fetchStats();
            }
        }, 300000); // 5 minutos

        return () => {
            clearInterval(intervalId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        stats: {
            totalVehicles: stats?.totalVehicles ?? 0,
            activeVehicles: stats?.activeVehicles ?? 0,
            totalAlerts: stats?.totalAlerts ?? 0,
            activeAlerts: stats?.activeAlerts ?? 0
        },
        loading,
        error,
        refetch: fetchStats,
        retryCount
    };
}; 