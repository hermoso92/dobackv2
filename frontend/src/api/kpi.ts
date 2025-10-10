import { apiService } from '../services/api';
import { ApiResponse } from '../types/api';

export interface KpiDashboardResponse {
    totalGeofenceEvents: number;
    enterEvents?: number;
    exitEvents?: number;
    [key: string]: unknown;
}

export interface HeatmapPoint {
    lat: number;
    lng: number;
    severity: number;
    count?: number;
    speed?: number;
}

export interface SpeedingEvent {
    id: string;
    vehicleId: string;
    vehicle?: string;
    sessionId?: string;
    occurredAt: string;
    speed: number;
    limit: number;
    location?: { lat: number; lng: number };
}

// Nuevas interfaces para el dashboard ejecutivo
export interface ExecutiveDashboardData {
    period: 'day' | 'week' | 'month';
    lastUpdate: string;
    organizationId: string;

    // Tiempos operativos
    timeInPark: number;
    timeOutOfPark: number;
    timeInParkWithRotary: number;
    timeInWorkshopWithRotary: number;
    timeInEnclave5: number;
    timeInEnclave2: number;
    timeOutOfParkWithRotary: number;

    // Estados operativos
    vehiclesInPark: number;
    vehiclesOutOfPark: number;
    vehiclesWithRotaryOn: number;
    vehiclesWithRotaryOff: number;
    vehiclesInWorkshop: number;

    // Eventos e incidencias
    totalEvents: number;
    criticalEvents: number;
    severeEvents: number;
    lightEvents: number;

    // Excesos y cumplimiento
    timeExcesses: number;
    speedExcesses: number;
    complianceRate: number;

    // Métricas de estabilidad
    ltrScore: number;
    ssfScore: number;
    drsScore: number;

    // Metadatos
    totalVehicles: number;
    activeVehicles: number;
    totalSessions: number;
}

export interface DashboardComparison {
    [period: string]: {
        timeInPark: number;
        timeOutOfPark: number;
        totalEvents: number;
        complianceRate: number;
    };
}

const handleResponse = async <T>(promise: Promise<ApiResponse<T>>): Promise<T> => {
    const response = await promise;
    if (!response.success) {
        throw new Error(response.error || 'Error procesando respuesta KPI');
    }
    return response.data;
};

// APIs existentes
export const getDashboardKpis = () =>
    handleResponse<KpiDashboardResponse>(apiService.get('/api/kpis/summary'));

export const getHeatmapData = () =>
    handleResponse<HeatmapPoint[]>(apiService.get('/api/kpi/heatmap'));

export const getSpeedingEvents = () =>
    handleResponse<SpeedingEvent[]>(apiService.get('/api/kpi/speeding'));

// Nuevas APIs para el dashboard ejecutivo
export const getExecutiveDashboard = (params?: {
    period?: 'day' | 'week' | 'month';
    vehicle_id?: string;
}) => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id);

    const url = `/api/kpis/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return handleResponse<ExecutiveDashboardData>(apiService.get(url));
};

export const compareDashboardPeriods = (periods: string[], vehicle_id?: string) => {
    return handleResponse<DashboardComparison>(
        apiService.post('/api/kpis/compare', {
            periods,
            vehicle_id
        })
    );
};

// Interfaces para eventos de estabilidad
export interface StabilityEvent {
    id: string;
    vehicleId: string;
    vehicleName: string;
    station: string;
    park: 'LAS_ROZAS' | 'ALCOBENDAS';
    timestamp: string;
    location: string;
    lat: number;
    lng: number;
    stability: number;           // % de estabilidad (0-100)
    severity: 'leve' | 'moderada' | 'grave' | 'normal';
    category: 'Leve' | 'Moderada' | 'Grave' | 'Normal';
    rotativo: boolean;
    speed: number;               // km/h
    heading: number;             // grados
    acceleration: number;        // m/s²
    description: string;
    sessionId: string;
    driverName: string;
    fuelLevel: number;
    engineTemp: number;
    brakeStatus: 'normal' | 'warning';
}

// Interface para sesiones
export interface Session {
    id: string;
    vehicleId: string;
    vehicleName: string;
    startTime: string;
    endTime: string;
    duration: string;
    distance: number;
    status: 'completed' | 'interrupted';
    route: Array<{
        lat: number;
        lng: number;
        timestamp: string;
    }>;
    events: StabilityEvent[];
    driver: string;
    fuelConsumed: number;
    maxSpeed: number;
    avgSpeed: number;
}

// Nuevas interfaces según contrato especificado
export interface DashboardData {
    hoursDriving: string;        // HH:mm
    km: number;                  // número con 1 decimal
    timeInPark: string;          // HH:mm
    timeOutPark: string;         // HH:mm
    timeInWorkshop: string;      // HH:mm
    rotativoPct: number;         // % con 1 decimal
    incidents: {
        total: number;           // entero
        leve: number;            // entero
        moderada: number;        // entero
        grave: number;           // entero
    };
    speeding: {
        on: {
            count: number;       // N
            duration: string;    // HH:mm
        };
        off: {
            count: number;       // N
            duration: string;    // HH:mm
        };
    };
    clave: {
        "2": string;             // HH:mm
        "5": string;             // HH:mm
    };
    events?: StabilityEvent[];   // Eventos detallados para mapas
    sessions?: Session[];        // Sesiones para la pestaña de Sesiones & Recorridos
    totalVehicles?: number;      // Total de vehículos
    activeVehicles?: number;     // Vehículos activos
}

// Filtros del dashboard
export interface DashboardFilters {
    scope: 'vehicles' | 'park';
    vehicleIds: string[];
    parkId: 'ALCOBENDAS' | 'LAS_ROZAS' | null;
    timePreset: 'DAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM';
    startDate?: string;
    endDate?: string;
}

// Parques disponibles
export const PARKS = [
    { id: 'ALCOBENDAS', name: 'Alcobendas' },
    { id: 'LAS_ROZAS', name: 'Las Rozas' }
] as const;

// Vehículos disponibles - Parque Las Rozas y Alcobendas
export const VEHICLES = [
    {
        id: 'doback022',
        name: 'ESCALA ROZAS 4780KWM',
        licensePlate: '4780KWM',
        station: 'Las Rozas',
        location: { lat: 40.4919, lng: -3.8738 }
    },
    {
        id: 'doback023',
        name: 'FORESTAL ROZAS 3377JNJ',
        licensePlate: '3377JNJ',
        station: 'Alcobendas',
        location: { lat: 40.5299, lng: -3.6459 }
    },
    {
        id: 'doback024',
        name: 'BRP ALCOBENDAS 0696MXZ',
        licensePlate: '0696MXZ',
        station: 'Alcobendas Industrial',
        location: { lat: 40.5419, lng: -3.6319 }
    },
    {
        id: 'doback025',
        name: 'FORESTAL ALCOBENDAS 8093GIB',
        licensePlate: '8093GIB',
        station: 'Las Rozas Residencial',
        location: { lat: 40.4769, lng: -3.8898 }
    },
    {
        id: 'doback027',
        name: 'ESCALA ALCOBENDAS 5925MMH',
        licensePlate: '5925MMH',
        station: 'Las Rozas M-607',
        location: { lat: 40.5069, lng: -3.7678 }
    },
    {
        id: 'doback028',
        name: 'RP ROZAS 7343JST',
        licensePlate: '7343JST',
        station: 'Centro Operativo',
        location: { lat: 40.5149, lng: -3.7578 }
    }
] as const;

// Función para obtener vehículos desde el backend
export const getVehicles = async (organizationId?: string) => {
    try {
        const params = new URLSearchParams();
        if (organizationId) {
            params.append('organizationId', organizationId);
        }
        params.append('active', 'true');

        const response = await apiService.get(`/api/vehicles?${params.toString()}`);
        if (response.success) {
            return response.data || VEHICLES; // Fallback a mock si falla
        }
        return VEHICLES; // Fallback
    } catch (error) {
        console.error('Error obteniendo vehículos:', error);
        return VEHICLES; // Fallback
    }
};

// Nueva API según contrato especificado
export const getDashboardData = (filters: DashboardFilters) => {
    const queryParams = new URLSearchParams();
    queryParams.append('scope', filters.scope);
    queryParams.append('timePreset', filters.timePreset);

    if (filters.scope === 'vehicles') {
        queryParams.append('vehicleIds', filters.vehicleIds.join(','));
        console.log('🚗 Enviando filtros de vehículos:', filters.vehicleIds);
    } else if (filters.scope === 'park' && filters.parkId) {
        queryParams.append('parkId', filters.parkId);
        console.log('🏢 Enviando filtros de parque:', filters.parkId);
    }

    const url = `/api/kpis/summary?${queryParams.toString()}`;
    console.log('📡 URL de la petición:', url);
    console.log('📋 Parámetros enviados:', queryParams.toString());

    return handleResponse<DashboardData>(apiService.get(url));
};