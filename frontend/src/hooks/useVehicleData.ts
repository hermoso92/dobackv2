import { useEffect, useRef, useState } from 'react';
import { apiService } from '../services/api';
import { Vehicle } from '../types/vehicle';
import { logger } from '../utils/logger';

interface VehicleStats {
    totalSessions: number;
    totalDistance: number;
    averageSpeed: number;
    stabilityScore: number;
    lastUpdated: string;
}

interface UseVehicleDataResult {
    vehicles: Vehicle[];
    loading: boolean;
    error: Error | null;
}

interface ApiResponse {
    success: boolean;
    data: Vehicle[];
    message?: string;
}

export const useVehicleData = (): UseVehicleDataResult => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastFetchRef = useRef<number>(0);
    const FETCH_COOLDOWN = 5000; // 5 segundos entre peticiones

    useEffect(() => {
        const fetchVehicles = async () => {
            // Evitar peticiones repetitivas
            const now = Date.now();
            if (now - lastFetchRef.current < FETCH_COOLDOWN) {
                logger.debug('Petición de vehículos cancelada por cooldown');
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

                const response = await apiService.get<ApiResponse>('/api/vehicles', {
                    signal: abortControllerRef.current.signal
                });

                if (response.success && Array.isArray(response.data)) {
                    setVehicles(response.data);
                    logger.info('Vehículos obtenidos exitosamente', { count: response.data.length });
                } else {
                    throw new Error(response.message || 'Error al obtener los vehículos');
                }
            } catch (err) {
                // No mostrar error si fue cancelado
                if (err instanceof Error && err.name === 'AbortError') {
                    logger.debug('Petición de vehículos cancelada');
                    return;
                }

                logger.error('Error fetching vehicles:', err);
                setError(err instanceof Error ? err : new Error('Error desconocido'));
                setVehicles([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();

        // Cleanup al desmontar
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return { vehicles, loading, error };
};

interface UseVehicleStatsReturn {
    stats: VehicleStats | null;
    loading: boolean;
    error: Error | null;
    refreshStats: () => Promise<void>;
}

export const useVehicleStats = (vehicleId: string): UseVehicleStatsReturn => {
    const [stats, setStats] = useState<VehicleStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastFetchRef = useRef<number>(0);
    const FETCH_COOLDOWN = 10000; // 10 segundos entre peticiones

    const fetchStats = async () => {
        // Evitar peticiones repetitivas
        const now = Date.now();
        if (now - lastFetchRef.current < FETCH_COOLDOWN) {
            logger.debug('Petición de estadísticas cancelada por cooldown');
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

            const response = await apiService.get<{ success: boolean; data: VehicleStats }>(`/api/vehicles/${vehicleId}/stats`, {
                signal: abortControllerRef.current.signal
            });

            if (response.data?.success && response.data?.data) {
                setStats(response.data.data);
                logger.info('Estadísticas del vehículo obtenidas exitosamente', { vehicleId });
            } else {
                throw new Error('La respuesta de la API no tiene el formato esperado');
            }
        } catch (err) {
            // No mostrar error si fue cancelado
            if (err instanceof Error && err.name === 'AbortError') {
                logger.debug('Petición de estadísticas cancelada');
                return;
            }

            const error = err instanceof Error ? err : new Error('Error desconocido');
            logger.error(`Error obteniendo estadísticas del vehículo ${vehicleId}:`, error);
            setError(error);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vehicleId) {
            fetchStats();

            // Configurar actualización periódica con intervalo más largo
            const intervalId = setInterval(fetchStats, 300000); // Actualizar cada 5 minutos

            return () => {
                clearInterval(intervalId);
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            };
        }
    }, [vehicleId]);

    return {
        stats,
        loading,
        error,
        refreshStats: fetchStats
    };
};

interface VehicleWithStats extends Vehicle {
    stats: VehicleStats;
}

interface UseVehicleWithStatsReturn {
    vehicle: Vehicle | null;
    stats: VehicleStats | null;
    loading: boolean;
    error: Error | null;
    refreshData: () => Promise<void>;
}

export const useVehicleWithStats = (vehicleId: string): UseVehicleWithStatsReturn => {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [stats, setStats] = useState<VehicleStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastFetchRef = useRef<number>(0);
    const FETCH_COOLDOWN = 10000; // 10 segundos entre peticiones

    const fetchData = async () => {
        // Evitar peticiones repetitivas
        const now = Date.now();
        if (now - lastFetchRef.current < FETCH_COOLDOWN) {
            logger.debug('Petición de datos del vehículo cancelada por cooldown');
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

            const response = await apiService.get<VehicleWithStats>(`/api/vehicles/${vehicleId}`, {
                signal: abortControllerRef.current.signal
            });

            logger.info('Datos del vehículo obtenidos exitosamente', { vehicleId });
            setVehicle(response.data);
            setStats(response.data.stats);
        } catch (err) {
            // No mostrar error si fue cancelado
            if (err instanceof Error && err.name === 'AbortError') {
                logger.debug('Petición de datos del vehículo cancelada');
                return;
            }

            const error = err instanceof Error ? err : new Error('Error desconocido');
            logger.error(`Error obteniendo datos del vehículo ${vehicleId}:`, error);
            setError(error);
            setVehicle(null);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (vehicleId) {
            fetchData();

            // Configurar actualización periódica con intervalo más largo
            const intervalId = setInterval(fetchData, 300000); // Actualizar cada 5 minutos

            return () => {
                clearInterval(intervalId);
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            };
        }
    }, [vehicleId]);

    return {
        vehicle,
        stats,
        loading,
        error,
        refreshData: fetchData
    };
}; 