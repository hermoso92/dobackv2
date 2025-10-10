import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PanelAPI } from '../api/panel';
import { DrillDownParams, PanelFilters } from '../types/panel';

// Hook para gestionar datos del Panel & KPIs
export const usePanelData = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Query para KPIs
    const useKPIs = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'kpis', filters],
            queryFn: () => PanelAPI.getKPIs(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
            refetchInterval: 10 * 60 * 1000, // 10 minutos
        });
    };

    // Query para heatmap
    const useHeatmap = (
        type: 'speeding' | 'critical' | 'violations',
        filters: PanelFilters = {}
    ) => {
        return useQuery({
            queryKey: ['panel', 'heatmap', type, filters],
            queryFn: () => PanelAPI.getHeatmapData(type, filters),
            staleTime: 2 * 60 * 1000, // 2 minutos
            refetchInterval: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para alertas
    const useAlerts = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'alerts', filters],
            queryFn: () => PanelAPI.getAlerts(filters),
            staleTime: 1 * 60 * 1000, // 1 minuto
            refetchInterval: 2 * 60 * 1000, // 2 minutos
        });
    };

    // Query para eventos en tiempo real
    const useRealtimeEvents = (limit: number = 50) => {
        return useQuery({
            queryKey: ['panel', 'realtime', limit],
            queryFn: () => PanelAPI.getRealtimeEvents(limit),
            staleTime: 30 * 1000, // 30 segundos
            refetchInterval: 30 * 1000, // 30 segundos
        });
    };

    // Query para estadísticas de vehículos
    const useVehicleStats = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'vehicles', 'stats', filters],
            queryFn: () => PanelAPI.getVehicleStats(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para estadísticas de tiempo
    const useTimeStats = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'time', 'stats', filters],
            queryFn: () => PanelAPI.getTimeStats(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para estadísticas de velocidad
    const useSpeedStats = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'speed', 'stats', filters],
            queryFn: () => PanelAPI.getSpeedStats(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para estadísticas de geocercas
    const useGeofenceStats = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'geofence', 'stats', filters],
            queryFn: () => PanelAPI.getGeofenceStats(filters),
            staleTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Query para resumen ejecutivo
    const useExecutiveSummary = (filters: PanelFilters = {}) => {
        return useQuery({
            queryKey: ['panel', 'executive-summary', filters],
            queryFn: () => PanelAPI.getExecutiveSummary(filters),
            staleTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    // Mutation para marcar alerta como leída
    const useMarkAlertAsRead = () => {
        return useMutation({
            mutationFn: (alertId: string) => PanelAPI.markAlertAsRead(alertId),
            onSuccess: () => {
                // Invalidar queries de alertas
                queryClient.invalidateQueries({ queryKey: ['panel', 'alerts'] });
            },
        });
    };

    // Función para drill-down a Telemetría
    const drillDownToTelemetry = (params: DrillDownParams) => {
        const searchParams = new URLSearchParams();

        if (params.filters.from) searchParams.set('from', params.filters.from);
        if (params.filters.to) searchParams.set('to', params.filters.to);
        if (params.filters.vehicleId) searchParams.set('vehicleId', params.filters.vehicleId);
        if (params.filters.eventType) searchParams.set('eventType', params.filters.eventType);
        if (params.filters.severity) searchParams.set('severity', params.filters.severity);

        const queryString = searchParams.toString();
        const url = params.module === 'telemetry'
            ? `/telemetria-v2${queryString ? `?${queryString}` : ''}`
            : `/estabilidad${queryString ? `?${queryString}` : ''}`;

        navigate(url);
    };

    // Función para drill-down a Estabilidad
    const drillDownToStability = (params: DrillDownParams) => {
        const searchParams = new URLSearchParams();

        if (params.filters.from) searchParams.set('from', params.filters.from);
        if (params.filters.to) searchParams.set('to', params.filters.to);
        if (params.filters.vehicleId) searchParams.set('vehicleId', params.filters.vehicleId);

        const queryString = searchParams.toString();
        const url = `/estabilidad${queryString ? `?${queryString}` : ''}`;

        navigate(url);
    };

    // Función para refrescar todos los datos
    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['panel'] });
    };

    return {
        // Queries
        useKPIs,
        useHeatmap,
        useAlerts,
        useRealtimeEvents,
        useVehicleStats,
        useTimeStats,
        useSpeedStats,
        useGeofenceStats,
        useExecutiveSummary,

        // Mutations
        useMarkAlertAsRead,

        // Actions
        drillDownToTelemetry,
        drillDownToStability,
        refreshAll,
    };
};
