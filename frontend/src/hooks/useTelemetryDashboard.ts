import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { useOrganization } from '../services/organizationService';
import { logger } from '../utils/logger';

interface TelemetryKpi {
    id: string;
    vehicleId: string;
    organizationId: string;
    date: string;
    tiempoEnParque: number;
    tiempoEnTaller: number;
    tiempoFueraParque: number;
    tiempoEnZonaSensible: number;
    eventosCriticos: number;
    eventosPeligrosos: number;
    eventosModerados: number;
    eventosLeves: number;
    tiempoExcediendoVelocidad: number;
    maxVelocidadAlcanzada: number;
    velocidadPromedio: number;
    totalPuntosGPS: number;
    totalTiempo: number;
    distanciaRecorrida: number;
    tiempoEnMovimiento: number;
    tiempoDetenido: number;
}

interface TelemetrySessionSummary {
    id: string;
    startTime: string;
    endTime: string | null;
    vehicleId: string;
    vehicleName?: string | null;
    licensePlate?: string | null;
    sequence?: number | null;
    sessionNumber?: number | null;
}

interface TelemetryMapPoint {
    lat: number;
    lng: number;
    recordedAt: string;
    speed?: number | null;
    severity?: number | null;
}

interface TelemetryZone {
    id: string;
    name: string;
    type: string;
    geometry: any;
    parkId?: string | null;
}

interface TelemetryPark {
    id: string;
    name: string;
}

interface TelemetryVehicle {
    id: string;
    name: string;
    plate?: string;
    licensePlate?: string;
    identifier?: string;
    status?: string;
    type?: string;
}

interface DashboardFilters {
    dateFrom: string;
    dateTo: string;
    vehicleId?: string;
    parkId?: string;
}

interface KpiSummary {
    vehiclesConDatos: number;
    minutosTotales: number;
    eventosCriticos: number;
    distanciaTotal: number;
    tiempoFueraParque: number;
}

const toIsoDate = (date: Date) => date.toISOString().split('T')[0];

const createDefaultFilters = (): DashboardFilters => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    return {
        dateFrom: toIsoDate(start),
        dateTo: toIsoDate(end)
    };
};

export const useTelemetryDashboard = () => {
    const { getOrganizationId } = useOrganization();

    const [filters, setFilters] = useState<DashboardFilters>(createDefaultFilters);
    const [vehicles, setVehicles] = useState<TelemetryVehicle[]>([]);
    const [kpis, setKpis] = useState<TelemetryKpi[]>([]);
    const [parks, setParks] = useState<TelemetryPark[]>([]);
    const [zones, setZones] = useState<TelemetryZone[]>([]);
    const [sessions, setSessions] = useState<TelemetrySessionSummary[]>([]);
    const [mapPoints, setMapPoints] = useState<TelemetryMapPoint[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
    const [loadingMap, setLoadingMap] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

    const loadMapPoints = useCallback(async (sessionId: string) => {
        setLoadingMap(true);
        try {
            const response = await apiService.get<TelemetryMapPoint[]>(`/api/telemetry/${sessionId}/gps`);
            if (response.success) {
                const points = (response.data ?? []).map((point: any) => ({
                    lat: point.lat ?? point.latitude,
                    lng: point.lng ?? point.longitude,
                    recordedAt: point.recorded_at ?? point.timestamp ?? new Date().toISOString(),
                    speed: point.speed ?? null,
                    severity: point.severity ?? null
                }));
                setMapPoints(points);
            } else {
                setMapPoints([]);
                setError('No se pudieron cargar los puntos de la sesión seleccionada');
            }
        } catch (err: any) {
            logger.error('Error cargando puntos GPS de la sesión', err);
            setError(err?.message ?? 'Error al cargar datos de la sesión');
            setMapPoints([]);
        } finally {
            setLoadingMap(false);
        }
    }, []);

    const loadSessions = useCallback(async (vehicleId: string) => {
        setLoadingSessions(true);
        try {
            const response = await apiService.get<TelemetrySessionSummary[]>('/api/telemetry/sessions/recent', {
                vehicleId,
                limit: 50
            });

            if (response.success) {
                setSessions(response.data ?? []);
            } else {
                setSessions([]);
                setError('No se pudieron cargar las sesiones recientes');
            }
        } catch (err: any) {
            logger.error('Error cargando sesiones de telemetría', err);
            setSessions([]);
            setError(err?.message ?? 'Error al cargar sesiones');
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    const loadBaseData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const organizationId = await getOrganizationId();

            const [vehiclesResponse, kpiResponse, organizationResponse] = await Promise.all([
                apiService.get<TelemetryVehicle[]>('/api/dashboard/vehicles'),
                apiService.post<TelemetryKpi[]>('/api/telemetry/kpis', {
                    organizationId,
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    vehicleIds: filters.vehicleId ? [filters.vehicleId] : [],
                    parkIds: filters.parkId ? [filters.parkId] : []
                }),
                apiService.get<{ organizationId: string; vehicles: TelemetryVehicle[]; parks: TelemetryPark[]; zones: TelemetryZone[] }>(
                    '/api/telemetry/organization-info',
                    { organizationId }
                )
            ]);

            if (vehiclesResponse.success) {
                setVehicles(vehiclesResponse.data ?? []);
            } else {
                setVehicles([]);
            }

            if (kpiResponse.success) {
                setKpis(kpiResponse.data ?? []);
            } else {
                setKpis([]);
            }

            if (organizationResponse.success && organizationResponse.data) {
                const payload = organizationResponse.data;
                setParks(payload.parks ?? []);
                setZones(payload.zones ?? []);
            } else {
                setParks([]);
                setZones([]);
            }
        } catch (err: any) {
            logger.error('Error cargando datos base del dashboard de telemetría', err);
            setError(err?.message ?? 'Error al cargar datos de telemetría');
        } finally {
            setLoading(false);
        }
    }, [filters.dateFrom, filters.dateTo, filters.vehicleId, filters.parkId, getOrganizationId]);

    useEffect(() => {
        void loadBaseData();
    }, [loadBaseData]);

    const selectVehicle = useCallback(async (vehicleId: string | null) => {
        setSelectedVehicleId(vehicleId);
        setSelectedSessionId(null);
        setMapPoints([]);
        setSessions([]);

        setFilters((prev) => ({
            ...prev,
            vehicleId: vehicleId ?? undefined
        }));

        if (vehicleId) {
            await loadSessions(vehicleId);
        }
    }, [loadSessions]);

    const selectSession = useCallback(async (sessionId: string | null) => {
        setSelectedSessionId(sessionId);
        setMapPoints([]);

        if (sessionId) {
            await loadMapPoints(sessionId);
        }
    }, [loadMapPoints]);

    const setDateRange = useCallback((dateFrom: string, dateTo: string) => {
        setFilters((prev) => ({
            ...prev,
            dateFrom,
            dateTo
        }));
    }, []);

    const setParkFilter = useCallback((parkId: string | null) => {
        setFilters((prev) => ({
            ...prev,
            parkId: parkId ?? undefined
        }));
    }, []);

    const refresh = useCallback(async () => {
        await loadBaseData();
        if (selectedVehicleId) {
            await loadSessions(selectedVehicleId);
        }
        if (selectedSessionId) {
            await loadMapPoints(selectedSessionId);
        }
    }, [loadBaseData, loadSessions, loadMapPoints, selectedVehicleId, selectedSessionId]);

    const kpiSummary = useMemo<KpiSummary>(() => {
        if (!kpis.length) {
            return {
                vehiclesConDatos: 0,
                minutosTotales: 0,
                eventosCriticos: 0,
                distanciaTotal: 0,
                tiempoFueraParque: 0
            };
        }

        const vehiclesSet = new Set(kpis.map((kpi) => kpi.vehicleId));
        return {
            vehiclesConDatos: vehiclesSet.size,
            minutosTotales: kpis.reduce((acc, item) => acc + item.totalTiempo, 0),
            eventosCriticos: kpis.reduce((acc, item) => acc + item.eventosCriticos, 0),
            distanciaTotal: kpis.reduce((acc, item) => acc + item.distanciaRecorrida, 0),
            tiempoFueraParque: kpis.reduce((acc, item) => acc + item.tiempoFueraParque, 0)
        };
    }, [kpis]);

    return {
        loading,
        error,
        filters,
        setDateRange,
        setParkFilter,
        vehicles,
        kpis,
        kpiSummary,
        parks,
        zones,
        sessions,
        mapPoints,
        loadingSessions,
        loadingMap,
        selectedVehicleId,
        selectedSessionId,
        selectVehicle,
        selectSession,
        refresh
    };
};
