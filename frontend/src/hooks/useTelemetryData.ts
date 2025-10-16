import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TelemetryAPI } from '../api/telemetry-v2';
import {
    TelemetryFilters,
    TelemetrySessionParams
} from '../types/telemetry';

// Hook para gestionar datos de telemetría
export const useTelemetryData = (sessionId?: string) => {
    const queryClient = useQueryClient();

    // Query para sesiones
    const useSessions = (params: TelemetrySessionParams = {}) => {
        // Permitir cargar sesiones sin vehicleId específico para mostrar todas las sesiones
        return useQuery({
            queryKey: ['telemetry', 'sessions', params],
            queryFn: async () => {
                return await TelemetryAPI.getSessions(params);
            },
            enabled: true, // Siempre habilitado para cargar todas las sesiones
            staleTime: 5 * 60 * 1000, // 5 minutos
            retry: 2
        });
    };

    // Query para puntos de sesión
    const useSessionPoints = (sessionId: string, downsample: '5s' | '10s' | '100m' = '10s') => {
        return useQuery({
            queryKey: ['telemetry', 'points', sessionId, downsample],
            queryFn: () => TelemetryAPI.getSessionPoints(sessionId, { downsample }),
            enabled: !!sessionId && sessionId.trim() !== '', // Solo ejecutar si hay sessionId válido
            staleTime: 2 * 60 * 1000, // 2 minutos
            retry: 2
        });
    };

    // Query para eventos
    const useEvents = (filters: TelemetryFilters = {}) => {
        return useQuery({
            queryKey: ['telemetry', 'events', filters],
            queryFn: () => TelemetryAPI.getEvents(filters),
            enabled: !!filters.vehicleId && filters.vehicleId.trim() !== '', // Solo ejecutar si hay vehicleId válido
            staleTime: 1 * 60 * 1000, // 1 minuto
            retry: 2
        });
    };

    // Query para geocercas
    const useGeofences = () => {
        return useQuery({
            queryKey: ['telemetry', 'geofences'],
            queryFn: () => TelemetryAPI.getGeofences(),
            staleTime: 10 * 60 * 1000, // 10 minutos
            retry: 2
        });
    };

    return {
        useSessions,
        useSessionPoints,
        useEvents,
        useGeofences
    };
};