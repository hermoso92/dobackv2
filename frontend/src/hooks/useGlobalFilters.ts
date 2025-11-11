import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFiltersContext } from '../contexts/FiltersContext';
import { apiService } from '../services/api';
import { DEFAULT_FILTERS, DEFAULT_FILTER_PRESETS, FilterPreset, FilterState, GlobalFilters } from '../types/filters';
import { logger } from '../utils/logger';

export const useGlobalFilters = () => {
    // ⭐ USAR CONTEXT SI ESTÁ DISPONIBLE
    try {
        const contextValue = useFiltersContext();
        if (contextValue) {
            return contextValue;
        }
    } catch (error) {
        // Si no hay context, continuar con la lógica original
    }

    // LÓGICA ORIGINAL (fallback)
    const { user } = useAuth();
    const [state, setState] = useState<FilterState>({
        filters: DEFAULT_FILTERS,
        presets: DEFAULT_FILTER_PRESETS,
        activePreset: null,
        isLoading: false
    });
    const [filterVersion, setFilterVersion] = useState(0);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    // Cargar vehículos y parques disponibles
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [allVehicles, setAllVehicles] = useState<any[]>([]); // Todos los vehículos sin filtrar
    const [fireStations, setFireStations] = useState<any[]>([]);
    const [selectedFireStation, setSelectedFireStation] = useState<string>('');
    const [roadTypes, setRoadTypes] = useState<string[]>([]);

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true }));

                // Cargar vehículos - intentar desde dashboard/vehicles primero
                let vehicleList: any[] = [];
                try {
                    const dashboardVehiclesResponse = await apiService.get('/api/dashboard/vehicles');
                    if (dashboardVehiclesResponse.success) {
                        vehicleList = Array.isArray(dashboardVehiclesResponse.data) ? dashboardVehiclesResponse.data : [];
                        logger.info('✅ Vehículos cargados desde /api/dashboard/vehicles:', vehicleList.length);
                    }
                } catch (error) {
                    logger.warn('No se pudieron cargar desde dashboard/vehicles, intentando /api/vehicles');
                }

                // Fallback a /api/vehicles si no hay datos
                if (vehicleList.length === 0) {
                    const vehiclesResponse = await apiService.get('/api/vehicles');
                    if (vehiclesResponse.success) {
                        vehicleList = Array.isArray(vehiclesResponse.data) ? vehiclesResponse.data : [];
                        logger.info('✅ Vehículos cargados desde /api/vehicles:', vehicleList.length);
                    }
                }

                // WORKAROUND: Asignar parkId basándose en el nombre del vehículo si no viene del backend
                const vehiclesWithPark = vehicleList.map((v: any) => {
                    // Si ya tiene parkId, usarlo
                    if (v.parkId) return v;

                    // Si no, asignar basándose en el nombre del vehículo
                    const nombre = v.name?.toUpperCase() || '';
                    if (nombre.includes('ALCOBENDAS')) {
                        return { ...v, parkId: 'p002' };
                    } else if (nombre.includes('ROZAS')) {
                        return { ...v, parkId: 'p001' };
                    }
                    return v;
                });

                logger.info('Ejemplo de vehículo COMPLETO:', JSON.stringify(vehiclesWithPark[0], null, 2));
                logger.info('parkId del primer vehículo:', vehiclesWithPark[0]?.parkId);
                logger.info('Todos los parkIds:', vehiclesWithPark.map((v: any) => ({ name: v.name, parkId: v.parkId })));
                logger.info('🔍 DEBUG: Vehículos disponibles:', vehiclesWithPark.map((v: any) => ({ id: v.id, name: v.name, parkId: v.parkId })));

                setVehicles(vehiclesWithPark);
                setAllVehicles(vehiclesWithPark); // Guardar todos los vehículos

                // Cargar parques
                try {
                    const parksResponse = await apiService.get('/api/parks');
                    if (parksResponse.success && Array.isArray(parksResponse.data)) {
                        logger.info('Parques cargados:', parksResponse.data);
                        setFireStations(parksResponse.data);
                    } else {
                        logger.warn('No se pudieron cargar parques - respuesta inesperada');
                        setFireStations([]);
                    }
                } catch (error) {
                    logger.error('Error cargando parques:', error);
                    setFireStations([]);
                }

                // Cargar tipos de vía (si existe endpoint)
                try {
                    const roadTypesResponse = await apiService.get('/api/road-types');
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
        logger.info('🔧 UPDATE FILTERS LLAMADO CON:', newFilters);

        setState(prev => {
            // Crear SIEMPRE un nuevo objeto con propiedades completamente nuevas
            const updatedFilters = {
                ...prev.filters,
                ...newFilters,
                // Agregar timestamp para garantizar objeto único
                _timestamp: Date.now()
            };

            logger.info('🔧 ESTADO ANTERIOR:', JSON.stringify({
                dateStart: prev.filters.dateRange?.start,
                dateEnd: prev.filters.dateRange?.end,
                vehicles: prev.filters.vehicles
            }));
            logger.info('🔧 ESTADO NUEVO:', JSON.stringify({
                dateStart: updatedFilters.dateRange?.start,
                dateEnd: updatedFilters.dateRange?.end,
                vehicles: updatedFilters.vehicles,
                timestamp: updatedFilters._timestamp
            }));

            // Guardar en localStorage con debounce
            setTimeout(() => saveFilters(updatedFilters), 300);

            return {
                ...prev,
                filters: updatedFilters,
                activePreset: null
            };
        });

        // Incrementar versión para forzar actualización
        setFilterVersion(prev => {
            const newVersion = prev + 1;
            logger.info('📌 INCREMENTANDO FILTER VERSION:', prev, '->', newVersion);
            return newVersion;
        });

        // ⭐ SOLUCIÓN DEFINITIVA: Incrementar trigger para forzar useEffect en otros hooks
        setUpdateTrigger(prev => {
            const newTrigger = prev + 1;
            logger.info('🚀 INCREMENTANDO UPDATE TRIGGER:', prev, '->', newTrigger);
            return newTrigger;
        });
    }, [saveFilters]);

    // Aplicar preset
    const applyPreset = useCallback((presetId: string) => {
        const preset = state.presets.find(p => p.id === presetId);
        if (preset) {
            const updatedFilters = {
                ...DEFAULT_FILTERS,
                ...preset.filters,
                _timestamp: Date.now()
            };

            setState(prev => ({
                ...prev,
                filters: updatedFilters,
                activePreset: presetId
            }));

            saveFilters(updatedFilters);

            // Incrementar versión y trigger
            setFilterVersion(prev => prev + 1);
            setUpdateTrigger(prev => prev + 1);
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

        // Incrementar trigger
        setUpdateTrigger(prev => prev + 1);
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

    // Filtrar vehículos por parque de bomberos
    const selectFireStation = useCallback((fireStationId: string) => {
        setSelectedFireStation(fireStationId);

        if (!fireStationId) {
            // Si no hay parque seleccionado, mostrar todos
            setVehicles(allVehicles);
            logger.info('Mostrando todos los vehículos:', allVehicles.length);
        } else {
            // Log de debug para ver los datos
            logger.info('Filtrando por parque:', fireStationId);
            logger.info('Total de vehículos disponibles:', allVehicles.length);
            logger.info('Ejemplo de vehículo (parkId):', allVehicles[0]?.parkId);
            logger.info('IDs de parkId en vehículos:', allVehicles.map((v: any) => v.parkId));

            // Filtrar vehículos por parque usando parkId
            const filtered = allVehicles.filter((vehicle: any) => {
                // Comparar directamente el parkId del vehículo con el ID del parque seleccionado
                return vehicle.parkId === fireStationId;
            });
            logger.info(`Vehículos filtrados por parque ${fireStationId}:`, filtered.length);
            logger.info('Vehículos filtrados:', filtered);
            setVehicles(filtered);
        }
    }, [allVehicles, fireStations]);

    // Obtener query string para API
    const getApiQuery = useCallback(() => {
        const query: any = {};

        // Vehículos
        if (state.filters.vehicles.length > 0) {
            // Compatibilidad hacia atrás para endpoints antiguos
            query.vehicles = state.filters.vehicles.join(',');
            // Convención del backend actual: vehicleIds[]
            query['vehicleIds[]'] = state.filters.vehicles;
        }

        // Rango de fechas (respetar exactamente lo seleccionado por el usuario)
        const normalizedRange = (() => {
            const { dateRange } = state.filters;
            if (!dateRange) {
                return { start: undefined, end: undefined };
            }

            const start = dateRange.start || (dateRange as any).startDate || (dateRange as any).from;
            const end = dateRange.end || (dateRange as any).endDate || (dateRange as any).to;

            return { start, end };
        })();

        if (normalizedRange.start) {
            query.startDate = normalizedRange.start;
            query.from = normalizedRange.start;
        }
        if (normalizedRange.end) {
            query.endDate = normalizedRange.end;
            query.to = normalizedRange.end;
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

    // Memoizar filters para garantizar nueva referencia cuando cambie
    // Crear siempre un nuevo objeto para forzar actualización de dependencias
    // IMPORTANTE: Incluir filterVersion para garantizar nueva referencia
    const memoizedFilters = useMemo(() => {
        const filtersObj = {
            ...state.filters,
            __version: filterVersion,
            __updated: Date.now()
        };
        logger.info('🔄 MEMO FILTERS RECALCULADO con version:', filterVersion);
        return filtersObj;
    }, [state.filters, filterVersion]);

    return {
        // Estado
        filters: memoizedFilters,
        filterVersion,
        updateTrigger,
        presets: state.presets,
        activePreset: state.activePreset,
        isLoading: state.isLoading,
        vehicles,
        fireStations,
        selectedFireStation,
        roadTypes,
        hasActiveFilters,
        activeFiltersCount,

        // Acciones
        updateFilters,
        applyPreset,
        resetFilters,
        createPreset,
        selectFireStation,
        getApiQuery
    };
};
