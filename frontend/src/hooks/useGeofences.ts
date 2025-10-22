import { useCallback, useEffect, useState } from 'react';
import { Geofence, GeofenceEvent, GeofenceFormData, GeofenceStats } from '../types/geofence';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9998';

export const useGeofences = () => {
    const { token } = useAuth();
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchGeofences = useCallback(async () => {
        if (!token) {
            logger.info('🚫 No hay token de autenticación');
            return;
        }

        logger.info('🔄 Iniciando fetch de geocercas...');
        setLoading(true);
        setError(null);

        try {
            logger.info('📡 Haciendo request a:', `${API_BASE_URL}/api/geofences`);
            logger.info('🔑 Token:', token.substring(0, 20) + '...');

            const response = await fetch(`${API_BASE_URL}/api/geofences`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            logger.info('📊 Response status:', response.status);
            logger.info('📊 Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('❌ Error response:', errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            logger.info('✅ Data recibida:', data);
            logger.info('📋 Geocercas encontradas:', data.data?.length || 0);

            setGeofences(data.data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('❌ Error fetching geofences:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const createGeofence = useCallback(async (geofenceData: GeofenceFormData): Promise<Geofence> => {
        if (!token) throw new Error('No hay token de autenticación');

        const response = await fetch(`${API_BASE_URL}/api/geofences`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geofenceData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }, [token]);

    const updateGeofence = useCallback(async (id: string, geofenceData: Partial<GeofenceFormData>): Promise<Geofence> => {
        if (!token) throw new Error('No hay token de autenticación');

        const response = await fetch(`${API_BASE_URL}/api/geofences/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geofenceData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }, [token]);

    const deleteGeofence = useCallback(async (id: string): Promise<void> => {
        if (!token) throw new Error('No hay token de autenticación');

        const response = await fetch(`${API_BASE_URL}/api/geofences/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    }, [token]);

    const importFromRadar = useCallback(async (radarData: any): Promise<Geofence> => {
        if (!token) throw new Error('No hay token de autenticación');

        const response = await fetch(`${API_BASE_URL}/api/geofences/import-radar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(radarData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data;
    }, [token]);

    useEffect(() => {
        fetchGeofences();
    }, [fetchGeofences]);

    return {
        geofences,
        loading,
        error,
        fetchGeofences,
        createGeofence,
        updateGeofence,
        deleteGeofence,
        importFromRadar,
    };
};

export const useGeofenceEvents = (vehicleId?: string, from?: Date, to?: Date) => {
    const { token } = useAuth();
    const [events, setEvents] = useState<GeofenceEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        if (!token || !vehicleId) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (from) params.append('from', from.toISOString());
            if (to) params.append('to', to.toISOString());

            const response = await fetch(`${API_BASE_URL}/api/geofences/events/${vehicleId}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setEvents(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            logger.error('Error fetching geofence events:', err);
        } finally {
            setLoading(false);
        }
    }, [token, vehicleId, from, to]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    return {
        events,
        loading,
        error,
        fetchEvents,
    };
};

export const useGeofenceStats = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<GeofenceStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            // Por ahora calculamos las estadísticas desde los datos existentes
            // En el futuro se puede crear un endpoint específico para estadísticas
            const response = await fetch(`${API_BASE_URL}/api/geofences`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const geofences = data.data || [];

            const statsData: GeofenceStats = {
                totalGeofences: geofences.length,
                enabledGeofences: geofences.filter((g: Geofence) => g.enabled).length,
                totalEvents: 0, // Se calcularía desde eventos
                enterEvents: 0, // Se calcularía desde eventos
                exitEvents: 0, // Se calcularía desde eventos
                activeVehicles: 0, // Se calcularía desde estados de vehículos
            };

            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            logger.error('Error fetching geofence stats:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        loading,
        error,
        fetchStats,
    };
};
