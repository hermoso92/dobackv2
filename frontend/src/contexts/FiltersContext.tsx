import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';
import { DEFAULT_FILTERS, DEFAULT_FILTER_PRESETS, FilterPreset, FilterState, GlobalFilters } from '../types/filters';
import { logger } from '../utils/logger';
import { useAuth } from './AuthContext';

interface FiltersContextType {
    filters: GlobalFilters;
    updateTrigger: number;
    filterVersion: number;
    presets: FilterPreset[];
    activePreset: string | null;
    isLoading: boolean;
    vehicles: any[];
    fireStations: any[];
    selectedFireStation: string;
    roadTypes: string[];
    hasActiveFilters: boolean;
    activeFiltersCount: number;
    updateFilters: (newFilters: Partial<GlobalFilters>) => void;
    applyPreset: (presetId: string) => void;
    resetFilters: () => void;
    createPreset: (name: string, filters: Partial<GlobalFilters>) => void;
    selectFireStation: (fireStationId: string) => void;
    getApiQuery: () => any;
}

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export const FiltersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [state, setState] = useState<FilterState>({
        filters: DEFAULT_FILTERS,
        presets: DEFAULT_FILTER_PRESETS,
        activePreset: null,
        isLoading: false
    });
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [filterVersion, setFilterVersion] = useState(0);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [allVehicles, setAllVehicles] = useState<any[]>([]);
    const [fireStations, setFireStations] = useState<any[]>([]);
    const [selectedFireStation, setSelectedFireStation] = useState<string>('');
    const [roadTypes, setRoadTypes] = useState<string[]>([]);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true }));

                // Cargar vehículos
                let vehicleList: any[] = [];
                try {
                    logger.info('Cargando vehículos desde /api/dashboard/vehicles');
                    const dashboardVehiclesResponse = await apiService.get('/api/dashboard/vehicles');

                    if (dashboardVehiclesResponse.success && Array.isArray(dashboardVehiclesResponse.data)) {
                        vehicleList = dashboardVehiclesResponse.data;
                        logger.info(`✅ ${vehicleList.length} vehículos cargados exitosamente`);
                    } else {
                        logger.warn('Respuesta inesperada de /api/dashboard/vehicles:', dashboardVehiclesResponse);
                    }
                } catch (error) {
                    logger.warn('Error al cargar desde /api/dashboard/vehicles, intentando /api/vehicles:', error);
                    try {
                        const vehiclesResponse = await apiService.get('/api/vehicles');
                        if (vehiclesResponse.success && Array.isArray(vehiclesResponse.data)) {
                            vehicleList = vehiclesResponse.data;
                            logger.info(`✅ ${vehicleList.length} vehículos cargados desde /api/vehicles`);
                        }
                    } catch (fallbackError) {
                        logger.error('Error al cargar vehículos desde ambos endpoints:', fallbackError);
                    }
                }

                // Asignar parkId si no existe (compatibilidad)
                const vehiclesWithPark = vehicleList.map((v: any) => {
                    if (v.parkId) return v;
                    const nombre = v.name?.toUpperCase() || '';
                    if (nombre.includes('ALCOBENDAS')) return { ...v, parkId: 'p002' };
                    if (nombre.includes('ROZAS')) return { ...v, parkId: 'p001' };
                    return v;
                });

                setVehicles(vehiclesWithPark);
                setAllVehicles(vehiclesWithPark);
                logger.info('Vehículos actualizados en el contexto:', vehiclesWithPark.length);

                // Cargar parques
                try {
                    const parksResponse = await apiService.get('/api/parks');
                    if (parksResponse.success && Array.isArray(parksResponse.data)) {
                        setFireStations(parksResponse.data);
                        logger.info(`✅ ${parksResponse.data.length} parques cargados`);
                    }
                } catch (error) {
                    logger.warn('Error al cargar parques, usando array vacío:', error);
                    setFireStations([]);
                }

                // Cargar tipos de vía
                try {
                    const roadTypesResponse = await apiService.get('/api/road-types');
                    if (roadTypesResponse.success && Array.isArray(roadTypesResponse.data)) {
                        setRoadTypes(roadTypesResponse.data.map((item: any) => item.id || item.name || item));
                    }
                } catch (error) {
                    logger.warn('Error al cargar tipos de vía, usando valores por defecto:', error);
                    setRoadTypes(['autopista', 'urbana', 'rural', 'túnel', 'especial']);
                }

            } catch (error) {
                logger.error('Error loading initial filter data:', error);
                // Asegurar que los arrays no queden undefined
                setVehicles([]);
                setAllVehicles([]);
                setFireStations([]);
                setRoadTypes(['autopista', 'urbana', 'rural', 'túnel', 'especial']);
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        // Solo cargar datos si la autenticación está completa y el usuario está autenticado
        if (!authLoading && isAuthenticated && user?.id && user?.organizationId) {
            logger.info('Usuario autenticado detectado, cargando datos de filtros...', {
                userId: user.id,
                organizationId: user.organizationId
            });
            // Pequeño delay para asegurar que el token está disponible
            const timeoutId = setTimeout(() => {
                loadInitialData();
            }, 100);

            return () => clearTimeout(timeoutId);
        } else if (!authLoading && !isAuthenticated) {
            logger.warn('Usuario no autenticado, no se cargarán datos de filtros');
        } else if (authLoading) {
            logger.info('Autenticación en progreso, esperando...');
        } else {
            logger.warn('Usuario no autenticado o datos incompletos', {
                user,
                isAuthenticated,
                authLoading,
                hasUserId: !!user?.id,
                hasOrgId: !!user?.organizationId
            });
        }
    }, [user?.id, user?.organizationId, isAuthenticated, authLoading]);

    const saveFilters = useCallback((filters: GlobalFilters) => {
        if (user?.id) {
            localStorage.setItem(`filters_${user.id}`, JSON.stringify(filters));
        }
    }, [user]);

    const updateFilters = useCallback((newFilters: Partial<GlobalFilters>) => {
        setState(prev => {
            const updatedFilters = { ...prev.filters, ...newFilters };

            setTimeout(() => saveFilters(updatedFilters), 300);

            return {
                ...prev,
                filters: updatedFilters,
                activePreset: null
            };
        });

        // ⭐ Incrementar trigger para forzar actualización
        setUpdateTrigger(prev => prev + 1);
        setFilterVersion(prev => prev + 1);
    }, [saveFilters]);

    const applyPreset = useCallback((presetId: string) => {
        const preset = state.presets.find(p => p.id === presetId);
        if (preset) {
            const updatedFilters = { ...DEFAULT_FILTERS, ...preset.filters };
            setState(prev => ({ ...prev, filters: updatedFilters, activePreset: presetId }));
            saveFilters(updatedFilters);
            setUpdateTrigger(prev => prev + 1);
            setFilterVersion(prev => prev + 1);
        }
    }, [state.presets, saveFilters]);

    const resetFilters = useCallback(() => {
        setState(prev => ({ ...prev, filters: DEFAULT_FILTERS, activePreset: 'today' }));
        saveFilters(DEFAULT_FILTERS);
        setUpdateTrigger(prev => prev + 1);
    }, [saveFilters]);

    const createPreset = useCallback((name: string, filters: Partial<GlobalFilters>) => {
        const newPreset: FilterPreset = {
            id: `custom_${Date.now()}`,
            name,
            filters: { ...filters }
        };
        setState(prev => ({ ...prev, presets: [...prev.presets, newPreset] }));
    }, []);

    const selectFireStation = useCallback((fireStationId: string) => {
        setSelectedFireStation(fireStationId);
        if (!fireStationId) {
            setVehicles(allVehicles);
        } else {
            const filtered = allVehicles.filter((vehicle: any) => vehicle.parkId === fireStationId);
            setVehicles(filtered);
        }
    }, [allVehicles]);

    const getApiQuery = useCallback(() => {
        const query: any = {};
        if (state.filters.vehicles.length > 0) query.vehicles = state.filters.vehicles.join(',');
        if (state.filters.dateRange.start) query.startDate = state.filters.dateRange.start;
        if (state.filters.dateRange.end) query.endDate = state.filters.dateRange.end;
        if (state.filters.rotativo !== 'all') query.rotativo = state.filters.rotativo;
        if (user?.organizationId) query.organizationId = user.organizationId;
        return query;
    }, [state.filters, user]);

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

    const value = useMemo(() => ({
        filters: state.filters,
        updateTrigger,
        filterVersion,
        presets: state.presets,
        activePreset: state.activePreset,
        isLoading: state.isLoading,
        vehicles,
        fireStations,
        selectedFireStation,
        roadTypes,
        hasActiveFilters,
        activeFiltersCount,
        updateFilters,
        applyPreset,
        resetFilters,
        createPreset,
        selectFireStation,
        getApiQuery
    }), [
        state.filters,
        updateTrigger,
        filterVersion,
        state.presets,
        state.activePreset,
        state.isLoading,
        vehicles,
        fireStations,
        selectedFireStation,
        roadTypes,
        hasActiveFilters,
        activeFiltersCount,
        updateFilters,
        applyPreset,
        resetFilters,
        createPreset,
        selectFireStation,
        getApiQuery
    ]);

    return (
        <FiltersContext.Provider value={value}>
            {children}
        </FiltersContext.Provider>
    );
};

export const useFiltersContext = () => {
    const context = useContext(FiltersContext);
    if (!context) {
        throw new Error('useFiltersContext debe usarse dentro de FiltersProvider');
    }
    return context;
};

