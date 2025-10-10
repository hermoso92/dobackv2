import { DashboardData, EventData, StabilityData, TelemetryData, VehicleData } from '../types/data';
import { Vehicle } from '../types/vehicle';
import { logger } from '../utils/logger';
import { apiService } from './api';
interface DashboardStats {
    vehicleCount: number;
    sessionCount: number;
    telemetryCount: number;
    alarmCount: number;
    lastUpdated: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export class DataService {
    private static instance: DataService;
    private readonly baseURL: string;

    private constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:9998';
    }

    public static getInstance(): DataService {
        if (!DataService.instance) {
            DataService.instance = new DataService();
        }
        return DataService.instance;
    }

    public async getDashboardStats(): Promise<DashboardStats> {
        try {
            logger.info('Cargando datos del dashboard');
            const response = await apiService.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');

            if (!response.data?.success) {
                throw new Error('No se recibieron estadísticas del servidor');
            }

            if (!response.data?.data) {
                throw new Error('Formato de respuesta inválido');
            }

            logger.info('Datos del dashboard cargados exitosamente', { stats: response.data.data });
            return response.data.data;
        } catch (error) {
            logger.error('Error cargando datos del dashboard:', error);
            throw error;
        }
    }

    public async loadTelemetryData(vehicleId: string, startTime: number, endTime: number): Promise<TelemetryData[]> {
        try {
            logger.info('Cargando datos de telemetría', { vehicleId, startTime, endTime });
            const response = await apiService.get<ApiResponse<TelemetryData[]>>(`/api/telemetry/${vehicleId}`, {
                params: { startTime, endTime }
            });

            if (!response.data?.success) {
                throw new Error('No se recibieron datos de telemetría');
            }

            if (!response.data?.data) {
                throw new Error('Formato de respuesta inválido');
            }

            logger.info('Datos de telemetría cargados exitosamente', {
                vehicleId,
                dataCount: response.data.data.length
            });
            return response.data.data;
        } catch (error) {
            logger.error('Error cargando datos de telemetría', { error, vehicleId });
            throw error;
        }
    }

    public async loadVehicleData(): Promise<VehicleData[]> {
        try {
            logger.info('Cargando datos de vehículos');
            const response = await apiService.get<ApiResponse<VehicleData[]>>('/api/vehicles');

            if (!response.data?.success) {
                throw new Error('No se recibieron datos de vehículos');
            }

            if (!response.data?.data) {
                throw new Error('Formato de respuesta inválido');
            }

            logger.info('Datos de vehículos cargados exitosamente', {
                dataCount: response.data.data.length
            });
            return response.data.data;
        } catch (error) {
            logger.error('Error cargando datos de vehículos', { error });
            throw error;
        }
    }

    public async hasRealData(type: string): Promise<boolean> {
        try {
            const response = await apiService.get<ApiResponse<boolean>>(`/api/data/${type}/has-real-data`);
            return response.data?.success && response.data?.data === true;
        } catch (error) {
            logger.error(`Error verificando datos reales para ${type}:`, error);
            return false;
        }
    }

    // Métodos para Estabilidad
    public async saveStabilityData(vehicleId: string, data: StabilityData[]): Promise<void> {
        try {
            logger.info('Guardando datos de estabilidad', { vehicleId, dataCount: data.length });
            await apiService.post(`/api/stability/${vehicleId}`, { data });
            logger.info('Datos de estabilidad guardados exitosamente', { vehicleId });
        } catch (error) {
            logger.error('Error guardando datos de estabilidad', { error, vehicleId });
            throw error;
        }
    }

    public async loadStabilityData(vehicleId: string, startTime: number, endTime: number): Promise<StabilityData[]> {
        try {
            logger.info('Cargando datos de estabilidad', { vehicleId, startTime, endTime });
            const response = await apiService.get<StabilityData[]>(`/api/stability/${vehicleId}`, {
                params: { startTime, endTime }
            });
            logger.info('Datos de estabilidad cargados exitosamente', {
                vehicleId,
                dataCount: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('Error cargando datos de estabilidad', { error, vehicleId });
            throw error;
        }
    }

    // Métodos para Vehículos
    public async saveVehicleData(data: VehicleData[]): Promise<void> {
        try {
            logger.info('Guardando datos de vehículos', { dataCount: data.length });
            await apiService.post('/api/vehicles', { data });
            logger.info('Datos de vehículos guardados exitosamente');
        } catch (error) {
            logger.error('Error guardando datos de vehículos', { error });
            throw error;
        }
    }

    // Métodos para Eventos
    public async saveEventData(data: EventData[]): Promise<void> {
        try {
            logger.info('Guardando datos de eventos', { dataCount: data.length });
            await apiService.post('/api/events', { data });
            logger.info('Datos de eventos guardados exitosamente');
        } catch (error) {
            logger.error('Error guardando datos de eventos', { error });
            throw error;
        }
    }

    public async loadEventData(): Promise<EventData[]> {
        try {
            logger.info('Cargando datos de eventos');
            const response = await apiService.get<EventData[]>('/api/events');
            logger.info('Datos de eventos cargados exitosamente', {
                dataCount: response.data.length
            });
            return response.data;
        } catch (error) {
            logger.error('Error cargando datos de eventos', { error });
            throw error;
        }
    }

    // Métodos para Dashboard
    public async saveDashboardData(data: DashboardData): Promise<void> {
        try {
            logger.info('Guardando datos del dashboard');
            await apiService.post('/api/dashboard', data);
            logger.info('Datos del dashboard guardados exitosamente');
        } catch (error) {
            logger.error('Error guardando datos del dashboard', { error });
            throw error;
        }
    }

    public async getMockVehicles(): Promise<Vehicle[]> {
        return [
            {
                id: 1,
                name: 'Vehículo de Prueba 1',
                model: 'Modelo A',
                brand: 'Marca X',
                type: 'TRUCK',
                status: 'ACTIVE'
            },
            {
                id: 2,
                name: 'Vehículo de Prueba 2',
                model: 'Modelo B',
                brand: 'Marca Y',
                type: 'VAN',
                status: 'ACTIVE'
            }
        ];
    }

    public async getMockDashboardStats(): Promise<DashboardData> {
        return {
            vehiclesCount: 2,
            activeAlerts: 5,
            criticalEvents: 1,
            stabilityScore: 85,
            recentEvents: [
                {
                    id: 'evt_001',
                    timestamp: new Date().toISOString(),
                    type: 'VEHICLE',
                    severity: 'WARNING',
                    message: 'Ángulo de inclinación elevado',
                    vehicleId: 'VH001',
                    acknowledged: false,
                    resolved: false
                }
            ],
            processedData: {
                stabilitySessions: 10,
                canData: '50 GB',
                gpsRoutes: 5,
                totalTime: '24h'
            }
        };
    }
}

export const dataService = DataService.getInstance(); 