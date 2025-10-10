import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { DEFAULT_FILTERS, DEFAULT_FILTER_PRESETS, FilterPreset, FilterState, GlobalFilters } from '../types/filters';
import { logger } from '../utils/logger';

export const useGlobalFilters = () => {
    const { user } = useAuth();
    const [state, setState] = useState<FilterState>({
        filters: DEFAULT_FILTERS,
        presets: DEFAULT_FILTER_PRESETS,
        activePreset: null,
        isLoading: false
    });

    // Cargar vehículos disponibles
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [roadTypes, setRoadTypes] = useState<string[]>([]);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true }));

                // Cargar vehículos
                const vehiclesResponse = await apiService.get('/api/vehicles');
                if (vehiclesResponse.success) {
                    setVehicles(Array.isArray(vehiclesResponse.data) ? vehiclesResponse.data : []);
                }

                // Cargar tipos de vía (si existe endpoint)
                try {
                    const roadTypesResponse = await apiService.get('/road-types');
                    if (roadTypesResponse.success && Array.isArray(roadTypesResponse.data)) {
                        // Extraer solo los nombres de los tipos de carretera
                        setRoadTypes(roadTypesResponse.data.map((item: any) => item.id || item.name || item));
                    }
                } catch (error) {
                    // Si no existe el endpoint, usar tipos por defecto
                    setRoadTypes(['autopista', 'urbana', 'rural', 'túnel', 'especial']);
                }

                // Cargar filtros guardados del usuario
                const savedFilters = localStorage.getItem(`filters_${user?.id}`);
                if (savedFilters) {
                    try {
                        const parsed = JSON.parse(savedFilters);
                        setState(prev => ({
                            ...prev,
                            filters: { ...DEFAULT_FILTERS, ...parsed }
                        }));
                    } catch (error) {
                        logger.warn('Error parsing saved filters:', error);
                    }
                }

            } catch (error) {
                logger.error('Error loading initial filter data:', error);
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        if (user) {
            loadInitialData();
        }
    }, [user]);

    // Guardar filtros en localStorage
    const saveFilters = useCallback((filters: GlobalFilters) => {
        if (user?.id) {
            localStorage.setItem(`filters_${user.id}`, JSON.stringify(filters));
        }
    }, [user]);

    // Actualizar filtros
    const updateFilters = useCallback((newFilters: Partial<GlobalFilters>) => {
        const updatedFilters = { ...state.filters, ...newFilters };

        setState(prev => ({
            ...prev,
            filters: updatedFilters,
            activePreset: null // Limpiar preset activo al cambiar filtros manualmente
        }));

        // Guardar en localStorage con debounce
        setTimeout(() => saveFilters(updatedFilters), 300);
    }, [state.filters, saveFilters]);

    // Aplicar preset
    const applyPreset = useCallback((presetId: string) => {
        const preset = state.presets.find(p => p.id === presetId);
        if (preset) {
            const updatedFilters = { ...DEFAULT_FILTERS, ...preset.filters };

            setState(prev => ({
                ...prev,
                filters: updatedFilters,
                activePreset: presetId
            }));

            saveFilters(updatedFilters);
        }
    }, [state.presets, saveFilters]);

    // Resetear filtros
    const resetFilters = useCallback(() => {
        setState(prev => ({
            ...prev,
            filters: DEFAULT_FILTERS,
            activePreset: 'today' // Aplicar preset por defecto
        }));

        saveFilters(DEFAULT_FILTERS);
    }, [saveFilters]);

    // Crear nuevo preset
    const createPreset = useCallback((name: string, filters: Partial<GlobalFilters>) => {
        const newPreset: FilterPreset = {
            id: `custom_${Date.now()}`,
            name,
            filters: { ...filters }
        };

        setState(prev => ({
            ...prev,
            presets: [...prev.presets, newPreset]
        }));

        // Guardar presets en localStorage
        const savedPresets = localStorage.getItem(`presets_${user?.id}`) || '[]';
        const presets = JSON.parse(savedPresets);
        presets.push(newPreset);
        localStorage.setItem(`presets_${user?.id}`, JSON.stringify(presets));
    }, [user]);

    // Obtener query string para API
    const getApiQuery = useCallback(() => {
        const query: any = {};

        // Vehículos
        if (state.filters.vehicles.length > 0) {
            query.vehicles = state.filters.vehicles.join(',');
        }

        // Rango de fechas
        if (state.filters.dateRange.start) {
            query.startDate = state.filters.dateRange.start;
        }
        if (state.filters.dateRange.end) {
            query.endDate = state.filters.dateRange.end;
        }

        // Rotativo
        if (state.filters.rotativo !== 'all') {
            query.rotativo = state.filters.rotativo;
        }

        // Clave
        if (state.filters.clave.length > 0 && state.filters.clave.length < 4) {
            query.clave = state.filters.clave.join(',');
        }

        // Severidad
        if (state.filters.severity.length > 0 && state.filters.severity.length < 3) {
            query.severity = state.filters.severity.join(',');
        }

        // Tipo de vía
        if (state.filters.roadType.length > 0) {
            query.roadType = state.filters.roadType.join(',');
        }

        // Tipo de sesión
        if (state.filters.sessionType && state.filters.sessionType !== 'all') {
            query.sessionType = state.filters.sessionType;
        }

        // Organización (usar del contexto de auth si está disponible)
        if (user?.organizationId) {
            query.organizationId = user.organizationId;
        }

        return query;
    }, [state.filters, user]);

    // Verificar si hay filtros activos
    const hasActiveFilters = useMemo(() => {
        return (
            state.filters.vehicles.length > 0 ||
            state.filters.rotativo !== 'all' ||
            state.filters.clave.length < 4 ||
            state.filters.severity.length < 3 ||
            state.filters.roadType.length > 0 ||
            state.filters.sessionType !== 'all'
        );
    }, [state.filters]);

    // Contar filtros activos
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (state.filters.vehicles.length > 0) count++;
        if (state.filters.rotativo !== 'all') count++;
        if (state.filters.clave.length < 4) count++;
        if (state.filters.severity.length < 3) count++;
        if (state.filters.roadType.length > 0) count++;
        if (state.filters.sessionType !== 'all') count++;
        return count;
    }, [state.filters]);

    return {
        // Estado
        filters: state.filters,
        presets: state.presets,
        activePreset: state.activePreset,
        isLoading: state.isLoading,
        vehicles,
        roadTypes,
        hasActiveFilters,
        activeFiltersCount,

        // Acciones
        updateFilters,
        applyPreset,
        resetFilters,
        createPreset,
        getApiQuery
    };
};
