import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { useDashboardStats } from './useDashboardStats';
import { useEmergencyDashboard } from './useEmergencyDashboard';

interface OptimizedDashboardState {
    // Estados de carga
    isInitializing: boolean;
    isReady: boolean;

    // Datos del dashboard
    stats: any;
    emergencyStats: any;
    vehicles: any[];

    // Estados de error
    errors: {
        stats?: string | null;
        emergency?: string | null;
    };

    // Funciones de control
    refreshData: () => Promise<void>;
    forceRefresh: () => Promise<void>;
}

interface DashboardConfig {
    enableAutoRefresh?: boolean;
    refreshInterval?: number;
    enableOptimisticUpdates?: boolean;
    maxRetries?: number;
}

const DEFAULT_CONFIG: Required<DashboardConfig> = {
    enableAutoRefresh: true,
    refreshInterval: 30000, // 30 segundos
    enableOptimisticUpdates: true,
    maxRetries: 3
};

/**
 * Hook optimizado para el dashboard que maneja:
 * - Carga inicial inteligente
 * - Memoización de datos
 * - Gestión de errores
 * - Auto-refresh configurable
 * - Estados de carga optimizados
 */
export const useOptimizedDashboard = (config: DashboardConfig = {}): OptimizedDashboardState => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { isAuthenticated } = useAuth();

    // Estados locales
    const [isInitializing, setIsInitializing] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [errors, setErrors] = useState<{ stats?: string | null; emergency?: string | null }>({});
    const [retryCount, setRetryCount] = useState(0);

    // Referencias para control de timers y abort controllers
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastRefreshRef = useRef<number>(0);

    // Hooks existentes
    const {
        stats,
        loading: statsLoading,
        error: statsError
    } = useDashboardStats();

    const {
        vehicles,
        emergencyVehicles,
        availableVehicles,
        stats: emergencyStats,
        loading: emergencyLoading,
        error: emergencyError,
        loadDashboardData
    } = useEmergencyDashboard();

    // Memoizar datos combinados para evitar recálculos innecesarios
    const combinedData = useMemo(() => ({
        stats: stats || {
            totalVehicles: 0,
            activeVehicles: 0,
            totalAlerts: 0,
            activeAlerts: 0
        },
        emergencyStats: emergencyStats || {
            total: 0,
            available: 0,
            onEmergency: 0,
            maintenance: 0,
            offline: 0
        },
        vehicles: vehicles || []
    }), [stats, emergencyStats, vehicles]);

    // Función para limpiar timers y abort controllers
    const cleanup = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    // Función para refrescar datos
    const refreshData = useCallback(async (force = false) => {
        // Evitar múltiples refrescos simultáneos
        const now = Date.now();
        if (!force && now - lastRefreshRef.current < 5000) {
            logger.debug('Refresh cancelado por cooldown');
            return;
        }

        lastRefreshRef.current = now;

        try {
            // Cancelar petición anterior si existe
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Crear nuevo AbortController
            abortControllerRef.current = new AbortController();

            logger.info('Iniciando refresh de datos del dashboard', { force });

            // Cargar datos de emergencia (que también refresca stats)
            await loadDashboardData();

            // Resetear errores en caso de éxito
            setErrors({});
            setRetryCount(0);

            logger.info('Refresh de datos completado exitosamente');

        } catch (error: any) {
            // No mostrar error si fue cancelado
            if (error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
                logger.debug('Refresh cancelado');
                return;
            }

            logger.error('Error en refresh de datos:', error);

            // Actualizar errores específicos
            setErrors(prev => ({
                ...prev,
                stats: statsError || null,
                emergency: emergencyError || null
            }));

            // Incrementar contador de reintentos
            setRetryCount(prev => prev + 1);
        }
    }, [loadDashboardData, statsError, emergencyError]);

    // Función para forzar refresh
    const forceRefresh = useCallback(async () => {
        await refreshData(true);
    }, [refreshData]);

    // Inicialización del dashboard
    useEffect(() => {
        if (!isAuthenticated) {
            setIsInitializing(false);
            setIsReady(false);
            return;
        }

        const initializeDashboard = async () => {
            setIsInitializing(true);
            setErrors({});

            try {
                await refreshData(true);
                setIsReady(true);
                logger.info('Dashboard inicializado exitosamente');
            } catch (error) {
                logger.error('Error inicializando dashboard:', error);
                setIsReady(false);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeDashboard();
    }, [isAuthenticated, refreshData]);

    // Auto-refresh configurable
    useEffect(() => {
        if (!finalConfig.enableAutoRefresh || !isReady) {
            return;
        }

        const scheduleNextRefresh = () => {
            cleanup();
            refreshTimerRef.current = setTimeout(async () => {
                await refreshData();
                scheduleNextRefresh();
            }, finalConfig.refreshInterval);
        };

        scheduleNextRefresh();

        return cleanup;
    }, [finalConfig.enableAutoRefresh, finalConfig.refreshInterval, isReady, refreshData, cleanup]);

    // Limpieza al desmontar
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // Memoizar estado del dashboard
    const dashboardState = useMemo<OptimizedDashboardState>(() => ({
        isInitializing,
        isReady,
        stats: combinedData.stats,
        emergencyStats: combinedData.emergencyStats,
        vehicles: combinedData.vehicles,
        errors,
        refreshData: () => refreshData(false),
        forceRefresh
    }), [
        isInitializing,
        isReady,
        combinedData,
        errors,
        refreshData,
        forceRefresh
    ]);

    return dashboardState;
};

/**
 * Hook para datos de emergencia optimizados
 */
export const useOptimizedEmergencyData = () => {
    const { emergencyStats, vehicles } = useOptimizedDashboard();

    return useMemo(() => ({
        emergencyStatus: {
            total: emergencyStats?.total || 0,
            available: emergencyStats?.available || 0,
            onEmergency: emergencyStats?.onEmergency || 0,
            maintenance: emergencyStats?.maintenance || 0,
            offline: emergencyStats?.offline || 0
        },
        vehicles: vehicles || [],
        hasData: vehicles.length > 0
    }), [emergencyStats, vehicles]);
};

/**
 * Hook para estadísticas del sistema optimizadas
 */
export const useOptimizedSystemStats = () => {
    const { stats } = useOptimizedDashboard();

    return useMemo(() => ({
        totalVehicles: stats?.totalVehicles || 0,
        activeVehicles: stats?.activeVehicles || 0,
        totalAlerts: stats?.totalAlerts || 0,
        activeAlerts: stats?.activeAlerts || 0,
        hasData: (stats?.totalVehicles || 0) > 0
    }), [stats]);
};
