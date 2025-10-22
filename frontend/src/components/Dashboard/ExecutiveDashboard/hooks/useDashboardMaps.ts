import { useCallback, useEffect, useState } from 'react';
import { useGlobalFilters } from '../../../../hooks/useGlobalFilters';
import { apiService } from '../../../../services/api';
import { logger } from '../../../../utils/logger';
import { BlackSpotsData, HeatmapData, SpeedViolation } from '../types';

/**
 * Hook personalizado para gestionar datos de mapas del dashboard
 */
export const useDashboardMaps = () => {
    const { filters } = useGlobalFilters();

    const [heatmapData, setHeatmapData] = useState<HeatmapData>({
        points: [],
        routes: [],
        geofences: []
    });

    const [speedViolations, setSpeedViolations] = useState<SpeedViolation[]>([]);

    const [blackSpotsData, setBlackSpotsData] = useState<BlackSpotsData>({
        clusters: [],
        ranking: []
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Carga datos de mapa de calor
     */
    const loadHeatmapData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Implementar endpoint /api/maps/heatmap cuando esté disponible
            const response = await apiService.get<{ success: boolean; data: HeatmapData }>(
                '/api/maps/heatmap',
                { params: filters }
            );

            if (response.data?.success) {
                setHeatmapData(response.data.data);
                logger.info('Heatmap data cargado', { points: response.data.data.points.length });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando heatmap';
            setError(errorMessage);
            logger.error('Error cargando heatmap data', { error: err });

            // Datos vacíos en caso de error
            setHeatmapData({ points: [], routes: [], geofences: [] });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * Carga violaciones de velocidad
     */
    const loadSpeedViolations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Implementar endpoint /api/speed/violations cuando esté disponible
            const response = await apiService.get<{ success: boolean; data: SpeedViolation[] }>(
                '/api/speed/violations',
                { params: filters }
            );

            if (response.data?.success) {
                setSpeedViolations(response.data.data);
                logger.info('Speed violations cargadas', { count: response.data.data.length });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando violaciones';
            setError(errorMessage);
            logger.error('Error cargando speed violations', { error: err });

            // Array vacío en caso de error
            setSpeedViolations([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * Carga datos de puntos negros
     */
    const loadBlackSpotsData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Implementar endpoint /api/stability/black-spots cuando esté disponible
            const response = await apiService.get<{ success: boolean; data: BlackSpotsData }>(
                '/api/stability/black-spots',
                { params: filters }
            );

            if (response.data?.success) {
                setBlackSpotsData(response.data.data);
                logger.info('Black spots data cargado', { clusters: response.data.data.clusters.length });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error cargando puntos negros';
            setError(errorMessage);
            logger.error('Error cargando black spots data', { error: err });

            // Datos vacíos en caso de error
            setBlackSpotsData({ clusters: [], ranking: [] });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * Carga todos los datos de mapas
     */
    const loadAllMapsData = useCallback(async () => {
        await Promise.all([
            loadHeatmapData(),
            loadSpeedViolations(),
            loadBlackSpotsData()
        ]);
    }, [loadHeatmapData, loadSpeedViolations, loadBlackSpotsData]);

    /**
     * Efecto para cargar datos cuando cambian los filtros
     */
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            if (mounted) {
                await loadAllMapsData();
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [loadAllMapsData]);

    return {
        heatmapData,
        speedViolations,
        blackSpotsData,
        loading,
        error,
        reload: loadAllMapsData
    };
};

