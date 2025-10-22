/**
 * 🚒 HOOK PARA DASHBOARD DE EMERGENCIAS
 * Maneja el estado y lógica del dashboard de emergencias
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';

export interface GPSData {
    vehicleId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    accuracy: number;
    lastUpdate: Date;
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

export interface VehicleStatus {
    vehicleId: string;
    name: string;
    type: string;
    gpsData: GPSData | null;
    isActive: boolean;
    lastSeen: Date;
    emergencyStatus: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
}

export interface DashboardStats {
    total: number;
    online: number;
    emergency: number;
    available: number;
    offline: number;
    maintenance: number;
    isMonitoring: boolean;
    lastUpdate: string;
}

export interface DashboardState {
    vehicles: VehicleStatus[];
    stats: DashboardStats;
    loading: boolean;
    error: string | null;
    lastUpdate: Date;
}

export const useEmergencyDashboard = () => {
    const [state, setState] = useState<DashboardState>({
        vehicles: [],
        stats: {
            total: 0,
            online: 0,
            emergency: 0,
            available: 0,
            offline: 0,
            maintenance: 0,
            isMonitoring: false,
            lastUpdate: ''
        },
        loading: true,
        error: null,
        lastUpdate: new Date()
    });

    /**
     * Carga los datos del dashboard
     */
    const loadDashboardData = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Cargar vehículos y estadísticas en paralelo usando endpoints disponibles
            const [vehiclesResponse, statsResponse] = await Promise.all([
                api.get('/api/dashboard/vehicles'),
                api.get('/api/dashboard/stats')
            ]);

            if (vehiclesResponse.data.success && statsResponse.data.success) {
                setState(prev => ({
                    ...prev,
                    vehicles: vehiclesResponse.data.data || [],
                    stats: statsResponse.data.data || prev.stats,
                    loading: false,
                    lastUpdate: new Date()
                }));
            } else {
                throw new Error('Error en respuesta del servidor');
            }

        } catch (error) {
            logger.error('Error cargando dashboard:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }));
        }
    }, []);

    /**
     * Fuerza una actualización inmediata
     */
    const forceUpdate = useCallback(async () => {
        try {
            // Usar endpoint de dashboard disponible
            await api.post('/api/dashboard/refresh');
            await loadDashboardData();
        } catch (error) {
            logger.error('Error en actualización forzada:', error);
            setState(prev => ({
                ...prev,
                error: 'Error en actualización forzada'
            }));
        }
    }, [loadDashboardData]);

    /**
     * Obtiene un vehículo específico
     */
    const getVehicle = useCallback(async (vehicleId: string) => {
        try {
            const response = await api.get(`/api/vehicles/${vehicleId}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            logger.error('Error obteniendo vehículo:', error);
            return null;
        }
    }, []);

    /**
     * Obtiene vehículos en emergencia
     */
    const getEmergencyVehicles = useCallback(async () => {
        try {
            // Usar endpoint de eventos para obtener emergencias
            const response = await api.get('/api/events?type=EMERGENCY');
            if (response.data.success) {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            logger.error('Error obteniendo emergencias:', error);
            return [];
        }
    }, []);

    /**
     * Obtiene vehículos disponibles
     */
    const getAvailableVehicles = useCallback(async () => {
        try {
            // Usar endpoint de vehículos disponibles
            const response = await api.get('/api/vehicles?status=AVAILABLE');
            if (response.data.success) {
                return response.data.data || [];
            }
            return [];
        } catch (error) {
            logger.error('Error obteniendo vehículos disponibles:', error);
            return [];
        }
    }, []);

    /**
     * Obtiene el estado del servicio
     */
    const getServiceStatus = useCallback(async () => {
        try {
            // Usar endpoint de observabilidad para estado del servicio
            const response = await api.get('/api/observability/status');
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            logger.error('Error obteniendo estado del servicio:', error);
            return null;
        }
    }, []);

    /**
     * Inicia el monitoreo (solo admin)
     */
    const startMonitoring = useCallback(async () => {
        try {
            // Usar endpoint de observabilidad para iniciar monitoreo
            const response = await api.post('/api/observability/start-monitoring');
            if (response.data.success) {
                await loadDashboardData();
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error iniciando monitoreo:', error);
            return false;
        }
    }, [loadDashboardData]);

    /**
     * Detiene el monitoreo (solo admin)
     */
    const stopMonitoring = useCallback(async () => {
        try {
            // Usar endpoint de observabilidad para detener monitoreo
            const response = await api.post('/api/observability/stop-monitoring');
            if (response.data.success) {
                await loadDashboardData();
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error deteniendo monitoreo:', error);
            return false;
        }
    }, [loadDashboardData]);

    // Cargar datos al montar el componente
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Actualización automática cada 30 segundos
    useEffect(() => {
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, [loadDashboardData]);

    return {
        ...state,
        loadDashboardData,
        forceUpdate,
        getVehicle,
        getEmergencyVehicles,
        getAvailableVehicles,
        getServiceStatus,
        startMonitoring,
        stopMonitoring
    };
};
