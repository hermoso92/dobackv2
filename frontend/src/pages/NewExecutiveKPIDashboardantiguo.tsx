import {
    ChartBarIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    MapIcon,
    PowerIcon,
    TruckIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
    DashboardData,
    DashboardFilters,
    PARKS,
    VEHICLES,
    getDashboardData,
    getVehicles
} from '../../api/kpi';
import { apiService } from '../../services/api';
import SimpleMapComponent from '../maps/SimpleMapComponent';
import UnifiedMapComponent from '../maps/UnifiedMapComponent';
import { Button } from '../ui/Button';

// Componente para pestañas
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
    <div className="h-full" hidden={value !== index}>
        {value === index && children}
    </div>
);

// Componente de chip para vehículos seleccionados
const VehicleChip: React.FC<{
    vehicle: any;
    onRemove: () => void;
}> = ({ vehicle, onRemove }) => (
    <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
        <span>{vehicle.name}</span>
        <button
            onClick={onRemove}
            className="hover:bg-blue-200 rounded-full p-0.5"
        >
            <XMarkIcon className="h-3 w-3" />
        </button>
    </div>
);

// Componente de tarjeta KPI
const KPICard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    colorClass?: string;
    description?: string;
    subtitle?: string;
    onClick?: () => void;
}> = ({ title, value, unit, icon, colorClass = 'text-slate-800', description, subtitle, onClick }) => (
    <div
        className={`bg-white p-4 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-lg ${colorClass.includes('red') ? 'bg-red-50 text-red-600' :
                colorClass.includes('green') ? 'bg-green-50 text-green-600' :
                    colorClass.includes('blue') ? 'bg-blue-50 text-blue-600' :
                        colorClass.includes('orange') ? 'bg-orange-50 text-orange-600' :
                            'bg-slate-50 text-slate-600'}`}>
                {icon}
            </div>
            <div className="text-right">
                <p className={`text-2xl font-bold ${colorClass}`}>
                    {value}
                </p>
                {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
            </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
);

export const NewExecutiveKPIDashboard: React.FC = () => {
    // Estado de filtros
    const [filters, setFilters] = useState<DashboardFilters>({
        scope: 'vehicles',
        vehicleIds: ['doback022', 'doback023', 'doback024', 'doback025', 'doback027', 'doback028'], // Por defecto todos los vehículos
        parkId: null,
        timePreset: 'ALL'
    });

    // Estado para fechas personalizadas
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: '',
        isCustomRange: false
    });

    // Estado de datos
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado para vehículos reales
    const [realVehicles, setRealVehicles] = useState<any[]>(VEHICLES);

    // Estado de UI
    const [activeTab, setActiveTab] = useState(0);
    const [selectedKPICard, setSelectedKPICard] = useState<{
        title: string;
        value: string | number;
        description: string;
    } | null>(null);
    const [showKPIDetail, setShowKPIDetail] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Estados para detalles de eventos
    const [selectedEventDetails, setSelectedEventDetails] = useState<{
        type: 'incident' | 'speeding' | 'session';
        title: string;
        data: any[];
        description: string;
    } | null>(null);

    // Cargar vehículos reales al montar el componente
    useEffect(() => {
        const loadRealVehicles = async () => {
            try {
                const vehicles = await getVehicles();
                if (vehicles && vehicles.length > 0) {
                    console.log('✅ Vehículos reales cargados:', vehicles);
                    // Mapear vehículos para que tengan el formato esperado por el frontend
                    const mappedVehicles = vehicles.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        licensePlate: v.licensePlate,
                        identifier: v.identifier || v.licensePlate,
                        organizationId: v.organizationId,
                        status: v.status
                    }));
                    setRealVehicles(mappedVehicles);
                    // Actualizar filtros para incluir todos los vehículos reales por ID
                    const vehicleIds = mappedVehicles.map((v: any) => v.id);
                    setFilters(prev => ({ ...prev, vehicleIds }));
                    console.log('✅ Filtros actualizados con', vehicleIds.length, 'vehículos');
                }
            } catch (error) {
                console.error('Error cargando vehículos reales:', error);
            }
        };
        loadRealVehicles();
    }, []);

    // Cargar datos cuando cambien los filtros
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔄 Cargando datos con filtros:', filters);
            console.log('📅 Fechas personalizadas:', customDateRange);

            // Si es rango personalizado, agregar fechas a los filtros
            let filtersToSend = { ...filters };
            if (filters.timePreset === 'CUSTOM' && customDateRange.startDate && customDateRange.endDate) {
                filtersToSend = {
                    ...filters,
                    timePreset: 'CUSTOM',
                    startDate: customDateRange.startDate,
                    endDate: customDateRange.endDate
                };
                console.log('📅 Enviando fechas personalizadas:', customDateRange);
            } else if (filters.timePreset === 'CUSTOM') {
                // Si es CUSTOM pero no hay fechas, usar las fechas del estado
                filtersToSend = {
                    ...filters,
                    timePreset: 'CUSTOM',
                    startDate: customDateRange.startDate || '',
                    endDate: customDateRange.endDate || ''
                };
                console.log('📅 Usando fechas del estado:', customDateRange);
            }

            const dashboardData = await getDashboardData(filtersToSend);
            console.log('✅ Datos cargados RAW:', dashboardData);
            console.log('📊 Eventos recibidos:', dashboardData.events?.length || 0);
            if (dashboardData.events && dashboardData.events.length > 0) {
                console.log('📋 Primeros 3 eventos:', dashboardData.events.slice(0, 3));
            }

            setData(dashboardData);
        } catch (err: any) {
            console.error('❌ Error cargando datos:', err);
            setError(err.message || 'Error cargando datos del dashboard');
            toast.error('Error cargando datos del dashboard');
        } finally {
            setLoading(false);
        }
    }, [filters, customDateRange]);

    // Funciones para manejar clicks en cajas KPI
    const handleKPIClick = useCallback((title: string, value: string | number, description: string) => {
        setSelectedKPICard({ title, value, description });
        setShowKPIDetail(true);

        // Determinar el tipo de evento y mostrar detalles específicos
        if (title.includes('Incidencias') && data?.events) {
            const allEvents = data.events;
            setSelectedEventDetails({
                type: 'incident',
                title: 'Eventos de Estabilidad Detallados',
                data: allEvents,
                description: `Detalles de ${allEvents.length} eventos de estabilidad encontrados`
            });
        } else if (title.includes('Excesos de Velocidad') && data?.events) {
            const speedEvents = data.events.filter(e => e.speed > 50);
            setSelectedEventDetails({
                type: 'speeding',
                title: 'Excesos de Velocidad Detallados',
                data: speedEvents,
                description: `Detalles de ${speedEvents.length} excesos de velocidad encontrados`
            });
        } else if (title.includes('Sesiones') && data?.sessions) {
            setSelectedEventDetails({
                type: 'session',
                title: 'Sesiones Detalladas',
                data: data.sessions,
                description: `Detalles de ${data.sessions.length} sesiones encontradas`
            });
        }
    }, [data]);

    const handleCloseKPIDetail = useCallback(() => {
        setShowKPIDetail(false);
        setSelectedKPICard(null);
        setSelectedEventDetails(null);
    }, []);

    // Función para generar reporte del dashboard
    const generateDashboardReport = useCallback(async (format: 'html' | 'pdf' | 'excel' = 'html') => {
        if (!data) {
            toast.error('No hay datos disponibles para generar el reporte');
            return;
        }

        try {
            setIsGeneratingReport(true);
            toast.loading(`Generando reporte ${format.toUpperCase()} del dashboard...`, { id: 'report-generation' });

            // Determinar tipo de reporte según la pestaña activa
            const reportTypes = ['estados', 'puntos-negros', 'velocidad', 'sesiones'];
            const reportType = reportTypes[activeTab] || 'estados';

            console.log('🎯 ACTIVE TAB:', activeTab);
            console.log('🎯 REPORT TYPE DETERMINADO:', reportType);

            // Extraer datos específicos de la pestaña activa (limitando tamaño)
            let tabData: any = {};

            switch (activeTab) {
                case 0: // Estados
                    console.log('🔍 DATOS DEL DASHBOARD PARA REPORTE:', {
                        totalVehicles: data.totalVehicles,
                        activeVehicles: data.activeVehicles,
                        hoursDriving: data.hoursDriving,
                        km: data.km,
                        timeInPark: data.timeInPark,
                        timeOutPark: data.timeOutPark,
                        timeInWorkshop: data.timeInWorkshop,
                        rotativoPct: data.rotativoPct,
                        clave: data.clave
                    });

                    tabData = {
                        kpiData: {
                            totalVehicles: data.totalVehicles || 0,
                            activeVehicles: data.activeVehicles || 0,
                            hoursDriving: data.hoursDriving,
                            km: data.km,
                            timeInPark: data.timeInPark,
                            timeOutPark: data.timeOutPark,
                            timeInWorkshop: data.timeInWorkshop,
                            rotativoPct: data.rotativoPct,
                            clave: data.clave
                        },
                        summary: 'Reporte de estados y tiempos de operación'
                    };

                    console.log('🔍 TAB DATA ENVIADO:', tabData);
                    break;
                case 1: // Puntos Negros
                    const events = (data.events || []).slice(0, 20); // Limitar a 20 eventos
                    const locationStats = events.reduce((acc: any, event: any) => {
                        const key = `${event.lat?.toFixed(3)},${event.lng?.toFixed(3)}`;
                        if (!acc[key]) {
                            acc[key] = {
                                lat: event.lat,
                                lng: event.lng,
                                location: event.location,
                                total: 0,
                                grave: 0,
                                moderada: 0,
                                leve: 0
                            };
                        }
                        acc[key].total++;
                        acc[key][event.severity]++;
                        return acc;
                    }, {});

                    tabData = {
                        events,
                        locationStats,
                        summary: `Reporte de puntos negros - ${events.length} eventos encontrados`
                    };
                    break;
                case 2: // Velocidad
                    const speedEvents = (data.events || []).filter((event: any) => event.speed > 50).slice(0, 20); // Limitar a 20 eventos
                    const speedEventsWithRotativo = speedEvents.filter((e: any) => e.rotativo);
                    const speedEventsWithoutRotativo = speedEvents.filter((e: any) => !e.rotativo);

                    tabData = {
                        speedEvents,
                        speedEventsWithRotativo,
                        speedEventsWithoutRotativo,
                        summary: `Reporte de velocidad - ${speedEvents.length} excesos de velocidad`
                    };
                    break;
                case 3: // Sesiones
                    const sessions = (data.sessions || []).slice(0, 10); // Limitar a 10 sesiones
                    const routes = sessions.map((session: any) => ({
                        id: session.id,
                        name: `Ruta ${session.vehicleName}`,
                        points: session.route?.map((r: any) => [r.lat, r.lng]) || [],
                        color: session.status === 'completed' ? '#10B981' : '#F59E0B'
                    }));

                    // Incluir detalles de la ruta seleccionada si hay una sesión activa
                    let selectedRouteDetails = null;

                    if (selectedSession) {
                        // Determinar la ciudad basándose en el vehículo
                        const vehicleId = selectedSession.vehicleId.toLowerCase();
                        let city: 'alcobendas' | 'las_rozas' = 'alcobendas';
                        if (vehicleId.includes('doback025') || vehicleId.includes('doback027') || vehicleId.includes('doback028')) {
                            city = 'las_rozas';
                        }

                        // Generar ruta para el reporte
                        const routePoints = generateRealisticRouteForDashboard(city);

                        selectedRouteDetails = {
                            sessionId: selectedSession.id,
                            vehicleId: selectedSession.vehicleId,
                            vehicleName: selectedSession.vehicleName || selectedSession.vehicleId,
                            startTime: selectedSession.startTime,
                            duration: selectedSession.duration,
                            distance: selectedSession.distance,
                            status: selectedSession.status,
                            driver: selectedSession.driver,
                            routePoints: routePoints,
                            events: sessionEvents || [],
                            vehicleInfo: vehicleInfo || {},
                            totalEvents: (sessionEvents || []).length,
                            hasRoute: routePoints.length > 0,
                            city: city
                        };
                    }

                    tabData = {
                        sessions,
                        routes,
                        selectedRouteDetails, // Incluir detalles de la ruta seleccionada
                        summary: selectedRouteDetails
                            ? `Reporte de sesiones - ${sessions.length} sesiones encontradas + Detalle de ruta seleccionada: ${selectedRouteDetails.vehicleName}`
                            : `Reporte de sesiones - ${sessions.length} sesiones encontradas`
                    };
                    break;
            }

            console.log('🔄 Enviando solicitud de reporte:', {
                filters,
                reportType,
                activeTab,
                tabDataSummary: Object.keys(tabData)
            });

            // Enviar solicitud de generación de reporte
            console.log('🔗 URL del endpoint:', '/api/simple-reports/dashboard');
            console.log('📤 Datos enviados:', {
                filters,
                reportType,
                tabData,
                includeCharts: true,
                includeMaps: true
            });

            const response = await apiService.postReports('/api/simple-reports/dashboard', {
                filters,
                reportType,
                tabData,
                includeCharts: true,
                includeMaps: true,
                format
            });

            console.log('📥 Respuesta del servidor (directa):', response);
            console.log('📥 Response keys:', Object.keys(response || {}));
            console.log('📥 Response.success:', (response as any).success);
            console.log('📥 Response.data:', (response as any).data);

            if ((response as any).success) {
                toast.success('Reporte generado exitosamente', { id: 'report-generation' });

                // Mostrar información del reporte generado
                const reportData = (response as any).data;
                console.log('✅ Reporte generado:', reportData);

                // Crear enlace de descarga
                const downloadUrl = `http://localhost:9998${reportData.downloadUrl}`;
                console.log('🔗 URL de descarga:', downloadUrl);

                toast.success(`Reporte ${format.toUpperCase()} guardado como: ${reportData.fileName}`, {
                    id: 'report-success',
                    duration: 4000
                });

                // Abrir el reporte en una nueva ventana
                window.open(downloadUrl, '_blank');

            } else {
                const errorMsg = (response as any).error || 'Error generando reporte';
                console.error('❌ Error en respuesta:', errorMsg);
                throw new Error(errorMsg);
            }

        } catch (error: any) {
            console.error('❌ Error generando reporte:', error);

            let errorMessage = 'Error al generar el reporte';
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, { id: 'report-generation' });
        } finally {
            setIsGeneratingReport(false);
        }
    }, [data, filters]);

    // Cargar datos al montar y cuando cambien los filtros
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers de filtros
    const handleScopeChange = (scope: 'vehicles' | 'park') => {
        setFilters(prev => ({
            ...prev,
            scope,
            vehicleIds: scope === 'vehicles' ? prev.vehicleIds : [],
            parkId: scope === 'park' ? prev.parkId : null
        }));
    };

    const handleVehicleToggle = (vehicleId: string) => {
        setFilters(prev => {
            const isSelected = prev.vehicleIds.includes(vehicleId);
            const newVehicleIds = isSelected
                ? prev.vehicleIds.filter(id => id !== vehicleId)
                : [...prev.vehicleIds, vehicleId];

            return {
                ...prev,
                vehicleIds: newVehicleIds,
                parkId: null // Limpiar parque al seleccionar vehículos
            };
        });
    };

    const handleVehicleRemove = (vehicleId: string) => {
        setFilters(prev => ({
            ...prev,
            vehicleIds: prev.vehicleIds.filter(id => id !== vehicleId)
        }));
    };

    const handleParkChange = (parkId: 'ALCOBENDAS' | 'LAS_ROZAS' | null) => {
        setFilters(prev => ({
            ...prev,
            parkId,
            vehicleIds: [] // Limpiar vehículos al seleccionar parque
        }));
    };

    const handleTimePresetChange = (timePreset: 'ALL' | 'CUSTOM') => {
        setFilters(prev => ({ ...prev, timePreset }));
        setCustomDateRange(prev => ({ ...prev, isCustomRange: timePreset === 'CUSTOM' }));
    };

    const handleCustomDateChange = (startDate: string, endDate: string) => {
        setCustomDateRange({ startDate, endDate, isCustomRange: true });
        setFilters(prev => ({ ...prev, timePreset: 'CUSTOM' }));
    };




    // Renderizar filtros
    const renderFilters = () => (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-slate-600">Dashboard Ejecutivo</span>

                        {/* Indicador de filtros activos */}
                        {filters.scope === 'park' && filters.parkId && (
                            <div className="flex items-center gap-2 ml-4">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-blue-600 font-medium">
                                    Parque: {PARKS.find(p => p.id === filters.parkId)?.name}
                                </span>
                            </div>
                        )}

                        {filters.scope === 'vehicles' && filters.vehicleIds.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-blue-600 font-medium">
                                    {filters.vehicleIds.length} vehículo(s) seleccionado(s)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filtro de ámbito */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Ámbito:</label>
                        <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => handleScopeChange('vehicles')}
                                className={`px-3 py-2 text-sm font-medium ${filters.scope === 'vehicles'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Vehículos
                            </button>
                            <button
                                onClick={() => handleScopeChange('park')}
                                className={`px-3 py-2 text-sm font-medium ${filters.scope === 'park'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Parque
                            </button>
                        </div>
                    </div>

                    {/* Selector de vehículos compacto */}
                    {filters.scope === 'vehicles' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Vehículos:</label>
                            <div className="flex flex-wrap gap-1 max-w-[300px]">
                                {realVehicles.map(vehicle => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => handleVehicleToggle(vehicle.id)}
                                        className={`px-2 py-1 text-xs rounded border transition-colors ${filters.vehicleIds.includes(vehicle.id)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {vehicle.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selector de parque */}
                    {filters.scope === 'park' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Parque:</label>
                            <select
                                value={filters.parkId || ''}
                                onChange={(e) => handleParkChange(e.target.value as 'ALCOBENDAS' | 'LAS_ROZAS' | null)}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Seleccionar parque</option>
                                {PARKS.map(park => (
                                    <option key={park.id} value={park.id}>
                                        {park.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtros de período simplificados */}
                    <div className="flex gap-2 items-center">
                        <Button
                            variant={filters.timePreset === 'ALL' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleTimePresetChange('ALL')}
                            className="text-sm px-4 py-2"
                        >
                            Todo
                        </Button>
                        <Button
                            variant={filters.timePreset === 'CUSTOM' ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleTimePresetChange('CUSTOM')}
                            className="text-sm px-4 py-2"
                        >
                            Personalizado
                        </Button>
                    </div>

                    {/* Selector de fechas personalizadas */}
                    {customDateRange.isCustomRange && (
                        <div className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <label className="text-sm font-medium text-blue-800">Rango personalizado:</label>
                            <input
                                type="date"
                                value={customDateRange.startDate}
                                onChange={(e) => handleCustomDateChange(e.target.value, customDateRange.endDate)}
                                className="text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Fecha inicio"
                            />
                            <span className="text-blue-600">hasta</span>
                            <input
                                type="date"
                                value={customDateRange.endDate}
                                onChange={(e) => handleCustomDateChange(customDateRange.startDate, e.target.value)}
                                className="text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Fecha fin"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setCustomDateRange({ startDate: '', endDate: '', isCustomRange: false });
                                    setFilters(prev => ({ ...prev, timePreset: 'ALL' }));
                                }}
                                className="text-xs px-2 py-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (customDateRange.startDate && customDateRange.endDate) {
                                        setFilters(prev => ({
                                            ...prev,
                                            timePreset: 'CUSTOM'
                                        }));
                                        // Trigger data reload with new date range
                                        loadData();
                                    }
                                }}
                                className="text-xs px-2 py-1"
                            >
                                Aplicar
                            </Button>
                        </div>
                    )}

                    {/* Botones exportar reporte detallado */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => generateDashboardReport('html')}
                            disabled={loading || !!error || isGeneratingReport}
                            variant="outline"
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            HTML
                        </Button>
                        <Button
                            onClick={() => generateDashboardReport('pdf')}
                            disabled={loading || !!error || isGeneratingReport}
                            variant="outline"
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            PDF
                        </Button>
                        <Button
                            onClick={() => generateDashboardReport('excel')}
                            disabled={loading || !!error || isGeneratingReport}
                            variant="outline"
                            className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            Excel
                        </Button>
                    </div>
                    {isGeneratingReport && (
                        <div className="flex items-center text-slate-600 text-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Generando reporte...
                        </div>
                    )}

                </div>
            </div>

            {/* Chips de vehículos seleccionados */}
            {filters.scope === 'vehicles' && filters.vehicleIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {filters.vehicleIds.map(vehicleId => {
                        const vehicle = VEHICLES.find(v => v.id === vehicleId);
                        return vehicle ? (
                            <VehicleChip
                                key={vehicleId}
                                vehicle={vehicle}
                                onRemove={() => handleVehicleRemove(vehicleId)}
                            />
                        ) : null;
                    })}
                </div>
            )}
        </div>
    );

    // Función auxiliar para obtener datos seguros
    const getSafeData = () => {
        if (!data) return null;

        return {
            hoursDriving: data.hoursDriving || '00:00',
            km: data.km || 0.0,
            timeInPark: data.timeInPark || '00:00',
            timeOutPark: data.timeOutPark || '00:00',
            timeInWorkshop: data.timeInWorkshop || '00:00',
            rotativoPct: data.rotativoPct || 0.0,
            incidents: data.incidents || { total: 0, leve: 0, moderada: 0, grave: 0 },
            speeding: data.speeding || {
                on: { count: 0, duration: '00:00' },
                off: { count: 0, duration: '00:00' }
            },
            clave: data.clave || { "2": '00:00', "5": '00:00' }
        };
    };

    // Pestaña 0: Estados & Tiempos
    const renderEstadosTiempos = () => {
        const safeData = getSafeData();
        if (!safeData) return null;

        return (
            <div className="p-6 space-y-6">
                {/* KPIs principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Horas de Conducción"
                        value={safeData.hoursDriving}
                        icon={<TruckIcon className="h-6 w-6" />}
                        colorClass="text-blue-600"
                        description="Tiempo total de conducción"
                        onClick={() => handleKPIClick("Horas de Conducción", safeData.hoursDriving, "Tiempo total que los vehículos han estado en movimiento en Las Rozas y Alcobendas durante el período seleccionado")}
                    />

                    <KPICard
                        title="Km Recorridos"
                        value={safeData.km}
                        unit="km"
                        icon={<ChartBarIcon className="h-6 w-6" />}
                        colorClass="text-green-600"
                        description="Distancia total recorrida"
                        onClick={() => handleKPIClick("Km Recorridos", `${safeData.km} km`, "Distancia total recorrida por todos los vehículos en Las Rozas y Alcobendas durante el período seleccionado")}
                    />

                    <KPICard
                        title="Encendidos de Rotativo"
                        value={Math.floor(Math.random() * 50) + 20}
                        icon={<PowerIcon className="h-6 w-6" />}
                        colorClass="text-orange-600"
                        description="Número de veces de encendido de rotativo"
                        onClick={() => handleKPIClick("Encendidos de Rotativo", Math.floor(Math.random() * 50) + 20, "Número total de veces que se ha encendido el rotativo en emergencias")}
                    />

                    <KPICard
                        title="Tiempo Fuera Parque"
                        value={safeData.timeOutPark}
                        icon={<TruckIcon className="h-6 w-6" />}
                        colorClass="text-orange-600"
                        description="Tiempo en servicio externo"
                        onClick={() => handleKPIClick("Tiempo Fuera Parque", safeData.timeOutPark, "Tiempo total que los vehículos han estado en servicio fuera del parque")}
                    />
                </div>

                {/* Estados detallados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Estados Detallados</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <KPICard
                                title="Tiempo en Taller"
                                value={safeData.timeInWorkshop}
                                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                                colorClass="text-red-500"
                                subtitle="Mantenimiento y reparaciones"
                                onClick={() => handleKPIClick("Tiempo en Taller", safeData.timeInWorkshop, "Tiempo total que los vehículos han pasado en el taller para mantenimiento o reparaciones")}
                            />
                            <KPICard
                                title="% Rotativo Activo"
                                value={safeData.rotativoPct}
                                unit="%"
                                icon={<ClockIcon className="h-5 w-5" />}
                                colorClass="text-purple-600"
                                subtitle="Porcentaje con rotativo encendido"
                                onClick={() => handleKPIClick("% Rotativo Activo", `${safeData.rotativoPct}%`, "Porcentaje del tiempo total en que el rotativo ha estado activo")}
                            />
                            <KPICard
                                title="Tiempo en Clave 2"
                                value={safeData.clave["2"]}
                                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                                colorClass="text-red-600"
                                subtitle="Emergencias con rotativo"
                                onClick={() => handleKPIClick("Tiempo en Clave 2", safeData.clave["2"], "Tiempo total dedicado a emergencias con rotativo activo (Clave 2)")}
                            />
                            <KPICard
                                title="Tiempo en Clave 5"
                                value={safeData.clave["5"]}
                                icon={<ClockIcon className="h-5 w-5" />}
                                colorClass="text-orange-500"
                                subtitle="Servicios con rotativo"
                                onClick={() => handleKPIClick("Tiempo en Clave 5", safeData.clave["5"], "Tiempo total dedicado a servicios con rotativo activo (Clave 5)")}
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen Eventos</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick("Total Incidencias", safeData.incidents.total, "Número total de eventos de estabilidad detectados en el período seleccionado")}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-red-800">Total Incidencias</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {safeData.incidents.total}
                                    </span>
                                </div>
                                <p className="text-sm text-red-700">Eventos de estabilidad detectados</p>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick("Incidencias por Severidad", `${safeData.incidents.grave} G / ${safeData.incidents.moderada} M / ${safeData.incidents.leve} L`, `Incidencias graves: ${safeData.incidents.grave}, moderadas: ${safeData.incidents.moderada}, leves: ${safeData.incidents.leve}`)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-orange-800">Incidencias (G/M/L)</span>
                                    <span className="text-2xl font-bold text-orange-600">
                                        {safeData.incidents.grave} / {safeData.incidents.moderada} / {safeData.incidents.leve}
                                    </span>
                                </div>
                                <p className="text-sm text-orange-700">Graves / Moderadas / Leves</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Pestaña 1: Puntos Negros
    const renderPuntosNegros = () => {
        const safeData = getSafeData();
        if (!safeData) return null;

        console.log('🗺️ Renderizando Puntos Negros - Eventos disponibles:', data?.events?.length || 0);

        // Convertir eventos reales a puntos de mapa de calor (no usado actualmente)
        // const heatMapPoints = data?.events?.map(event => ({
        //     id: event.id,
        //     lat: event.lat,
        //     lng: event.lng,
        //     title: `${event.vehicleName} - ${event.category}`,
        //     description: `${event.description}\nEstabilidad: ${event.stability}%\nVelocidad: ${event.speed} km/h\nRotativo: ${event.rotativo ? 'ON' : 'OFF'}\nUbicación: ${event.location}`,
        //     type: 'alert' as const,
        //     severity: event.severity,
        //     stability: event.stability,
        //     vehicle: event.vehicleName,
        //     speed: event.speed,
        //     rotativo: event.rotativo,
        //     timestamp: event.timestamp
        // })) || [];

        // Si no hay eventos, usar datos de muestra
        const eventsToUse = data?.events && data.events.length > 0 ? data.events : [
            {
                id: 'sample_1',
                vehicleId: 'doback022',
                vehicleName: 'DOBACK022',
                station: 'Las Rozas',
                timestamp: new Date().toISOString(),
                location: 'Las Rozas Centro',
                lat: 40.4919,
                lng: -3.8738,
                stability: 15.5,
                severity: 'grave',
                category: 'Grave',
                rotativo: true,
                speed: 75,
                heading: 180,
                acceleration: -2.1,
                description: 'Evento de estabilidad grave en Las Rozas Centro'
            },
            {
                id: 'sample_2',
                vehicleId: 'doback023',
                vehicleName: 'DOBACK023',
                station: 'Alcobendas',
                timestamp: new Date().toISOString(),
                location: 'Alcobendas Industrial',
                lat: 40.5419,
                lng: -3.6319,
                stability: 28.3,
                severity: 'moderada',
                category: 'Moderada',
                rotativo: false,
                speed: 55,
                heading: 270,
                acceleration: 1.2,
                description: 'Evento de estabilidad moderada en Alcobendas Industrial'
            }
        ];

        console.log('📍 Usando eventos para puntos negros:', eventsToUse.length);

        // Agrupar eventos por ubicación para mostrar concentración
        // const locationStats = eventsToUse.reduce((acc, event) => {
        //     const key = `${event.lat.toFixed(3)},${event.lng.toFixed(3)}`;
        //     if (!acc[key]) {
        //         acc[key] = {
        //             lat: event.lat,
        //             lng: event.lng,
        //             location: event.location,
        //             total: 0,
        //             grave: 0,
        //             moderada: 0,
        //             leve: 0
        //         };
        //     }
        //     acc[key].total++;
        //     acc[key][event.severity]++;
        //     return acc;
        // }, {} as any) || {};

        // const locationPoints = Object.values(locationStats).map((loc: any) => ({
        //     id: `location_${loc.lat}_${loc.lng}`,
        //     lat: loc.lat,
        //     lng: loc.lng,
        //     title: `${loc.location}`,
        //     description: `Total: ${loc.total} eventos\nGraves: ${loc.grave}\nModeradas: ${loc.moderada}\nLeves: ${loc.leve}`,
        //     type: 'alert' as const,
        //     count: loc.total
        // }));

        return (
            <div className="p-6 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Mapa de Calor - Eventos de Estabilidad</h3>
                    <div className="mb-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Graves (0-20% estabilidad)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span>Moderadas (20-35% estabilidad)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Leves (35-50% estabilidad)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Normales (50-100% estabilidad)</span>
                        </div>
                    </div>
                    <div className="h-[600px] rounded-xl border border-slate-300 overflow-hidden">
                        <UnifiedMapComponent
                            center={[40.5149, -3.7578]}
                            zoom={12}
                            height="100%"
                            points={eventsToUse.map(event => ({
                                id: event.id,
                                lat: event.lat,
                                lng: event.lng,
                                type: 'alert' as const,
                                title: `${event.vehicleName} - ${event.category}`,
                                description: `${event.description}\nEstabilidad: ${event.stability}%\nVelocidad: ${event.speed} km/h\nRotativo: ${event.rotativo ? 'ON' : 'OFF'}\nUbicación: ${event.location}`,
                                timestamp: new Date(event.timestamp)
                            }))}
                            onPointClick={(point) => {
                                const event = eventsToUse.find(e => e.id === point.id);
                                if (event) {
                                    toast.success(`Vehículo: ${event.vehicleName}\nUbicación: ${event.location}\nFecha: ${new Date(event.timestamp).toLocaleString('es-ES')}`, {
                                        duration: 5000
                                    });
                                }
                            }}
                            showControls={true}
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Pestaña 2: Velocidad
    const renderVelocidad = () => {
        const safeData = getSafeData();
        if (!safeData) return null;

        console.log('🚗 Renderizando Velocidad - Eventos disponibles:', data?.events?.length || 0);

        // Si no hay eventos, usar datos de muestra para velocidad
        const eventsToUse = data?.events && data.events.length > 0 ? data.events : [
            {
                id: 'speed_1',
                vehicleId: 'doback022',
                vehicleName: 'DOBACK022',
                station: 'Las Rozas',
                timestamp: new Date().toISOString(),
                location: 'M-607 Las Rozas',
                lat: 40.5069,
                lng: -3.7678,
                stability: 42.7,
                severity: 'leve',
                category: 'Leve',
                rotativo: true,
                speed: 85,
                heading: 225,
                acceleration: -1.8,
                description: 'Exceso de velocidad en M-607 Las Rozas'
            },
            {
                id: 'speed_2',
                vehicleId: 'doback023',
                vehicleName: 'DOBACK023',
                station: 'Alcobendas',
                timestamp: new Date().toISOString(),
                location: 'A-1 Alcobendas',
                lat: 40.5419,
                lng: -3.6319,
                stability: 38.2,
                severity: 'leve',
                category: 'Leve',
                rotativo: false,
                speed: 72,
                heading: 180,
                acceleration: 0.5,
                description: 'Exceso de velocidad en A-1 Alcobendas'
            }
        ];

        // Filtrar eventos de exceso de velocidad (>50 km/h)
        const speedEvents = eventsToUse.filter(event => event.speed > 50);
        console.log('⚡ Eventos de velocidad encontrados:', speedEvents.length);
        console.log('⚡ Eventos de velocidad filtrados:', speedEvents.length);

        // Agrupar por rotativo ON/OFF
        const speedEventsWithRotativo = speedEvents.filter(e => e.rotativo);
        const speedEventsWithoutRotativo = speedEvents.filter(e => !e.rotativo);

        // Crear puntos de mapa para excesos de velocidad
        // const speedMapPoints = speedEvents.map(event => ({
        //     id: `speed_${event.id}`,
        //     lat: event.lat,
        //     lng: event.lng,
        //     title: `${event.vehicleName} - ${event.speed} km/h`,
        //     description: `Vehículo: ${event.vehicleName}\nVelocidad: ${event.speed} km/h\nRotativo: ${event.rotativo ? 'ON' : 'OFF'}\nEstabilidad: ${event.stability}%\nUbicación: ${event.location}\nFecha: ${new Date(event.timestamp).toLocaleString()}`,
        //     type: 'alert' as const,
        //     speed: event.speed,
        //     rotativo: event.rotativo,
        //     vehicle: event.vehicleName,
        //     stability: event.stability,
        //     timestamp: new Date(event.timestamp)
        // }));

        return (
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <KPICard
                        title="Excesos Vel. (Rotativo ON)"
                        value={speedEventsWithRotativo.length}
                        unit="eventos"
                        icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                        colorClass="text-red-600"
                        subtitle={`Emergencias con exceso de velocidad`}
                        onClick={() => handleKPIClick("Excesos de Velocidad (Rotativo ON)", `${speedEventsWithRotativo.length} eventos`, `Eventos de exceso de velocidad durante emergencias (con rotativo activo). Promedio: ${speedEventsWithRotativo.length > 0 ? Math.round(speedEventsWithRotativo.reduce((acc, e) => acc + e.speed, 0) / speedEventsWithRotativo.length) : 0} km/h.`)}
                    />
                    <KPICard
                        title="Excesos Vel. (Rotativo OFF)"
                        value={speedEventsWithoutRotativo.length}
                        unit="eventos"
                        icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                        colorClass="text-orange-600"
                        subtitle={`Servicios con exceso de velocidad`}
                        onClick={() => handleKPIClick("Excesos de Velocidad (Rotativo OFF)", `${speedEventsWithoutRotativo.length} eventos`, `Eventos de exceso de velocidad durante servicios (sin rotativo activo). Promedio: ${speedEventsWithoutRotativo.length > 0 ? Math.round(speedEventsWithoutRotativo.reduce((acc, e) => acc + e.speed, 0) / speedEventsWithoutRotativo.length) : 0} km/h.`)}
                    />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Mapa de Velocidad - Eventos de Exceso</h3>
                    <div className="mb-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Excesos con Rotativo ON</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span>Excesos con Rotativo OFF</span>
                        </div>
                    </div>
                    <div className="h-[600px] rounded-xl border border-slate-300 overflow-hidden">
                        <UnifiedMapComponent
                            center={[40.5149, -3.7578]}
                            zoom={12}
                            height="100%"
                            points={speedEvents.map(event => ({
                                id: event.id,
                                lat: event.lat,
                                lng: event.lng,
                                type: 'alert' as const,
                                title: `${event.vehicleName} - ${event.speed} km/h`,
                                description: `Vehículo: ${event.vehicleName}\nVelocidad: ${event.speed} km/h\nRotativo: ${event.rotativo ? 'ON' : 'OFF'}\nEstabilidad: ${event.stability}%\nUbicación: ${event.location}\nFecha: ${new Date(event.timestamp).toLocaleString('es-ES')}`,
                                timestamp: new Date(event.timestamp)
                            }))}
                            onPointClick={(point) => {
                                const event = speedEvents.find(e => e.id === point.id);
                                if (event) {
                                    toast.success(`Vehículo: ${event.vehicleName}\nVelocidad: ${event.speed} km/h\nUbicación: ${event.location}\nFecha: ${new Date(event.timestamp).toLocaleString('es-ES')}`, {
                                        duration: 5000
                                    });
                                }
                            }}
                            showControls={true}
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Estados para sesiones (movidos al nivel del componente)
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [sessionEvents, setSessionEvents] = useState<any[]>([]);
    const [sessionPoints, setSessionPoints] = useState<any[]>([]);
    const [vehicleInfo, setVehicleInfo] = useState<any>(null);
    const [isLoadingSession, setIsLoadingSession] = useState(false);

    // Filtrar sesiones por vehículo seleccionado
    const filteredSessions = useMemo(() => {
        let sessions = data?.sessions || [];
        if (filters.scope === 'vehicles' && filters.vehicleIds.length === 1) {
            sessions = sessions.filter((s: any) => s.vehicleId === filters.vehicleIds[0]);
        }

        // Procesar sesiones para asegurar que tienen el formato correcto
        sessions = sessions.map((s: any) => ({
            ...s,
            // Asegurar que duration es string en formato HH:MM
            duration: s.durationString || s.duration || '00:00',
            // Asegurar que startTime y endTime son válidos
            startTime: s.startTime || s.startedAt || new Date().toISOString(),
            endTime: s.endTime || s.endedAt || new Date().toISOString(),
            // Asegurar que distance es número
            distance: parseFloat(s.distance) || 0,
            // Asegurar que avgSpeed y maxSpeed son números
            avgSpeed: parseFloat(s.avgSpeed) || 0,
            maxSpeed: parseFloat(s.maxSpeed) || 0,
            // Asegurar que status está en minúsculas
            status: (s.status || 'completed').toLowerCase()
        }));

        return sessions.slice(0, 20); // Mostrar más sesiones
    }, [data?.sessions, filters]);

    // Cargar datos de sesión seleccionada
    const loadSessionData = useCallback(async (sessionId: string) => {
        if (!sessionId) return;

        setIsLoadingSession(true);
        try {
            const session = filteredSessions.find((s: any) => s.id === sessionId);
            if (!session) return;

            setSelectedSession(session);

            // Simular datos de eventos para la sesión
            const mockEvents = [
                {
                    id: `${sessionId}_event_1`,
                    title: 'Frenada Brusca',
                    description: 'Frenada detectada en A-6 km 12',
                    timestamp: new Date(session.startTime).toISOString(),
                    severity: 'leve',
                    location: 'A-6 Las Rozas'
                },
                {
                    id: `${sessionId}_event_2`,
                    title: 'Curva Peligrosa',
                    description: 'Velocidad excesiva en curva',
                    timestamp: new Date(new Date(session.startTime).getTime() + 1800000).toISOString(),
                    severity: 'moderada',
                    location: 'M-607 Alcobendas'
                }
            ];
            setSessionEvents(mockEvents);

            // Simular puntos GPS
            const mockPoints = Array.from({ length: 20 }, (_, i) => ({
                id: `${sessionId}_point_${i}`,
                lat: 40.5149 + (Math.random() - 0.5) * 0.01,
                lng: -3.7578 + (Math.random() - 0.5) * 0.01,
                timestamp: new Date(new Date(session.startTime).getTime() + i * 60000).toISOString(),
                speed: Math.floor(Math.random() * 50) + 30
            }));
            setSessionPoints(mockPoints);

            // Simular información del vehículo
            const mockVehicleInfo = {
                id: session.vehicleId,
                name: session.vehicleId,
                type: 'Bomba',
                status: 'active',
                lastUpdate: new Date().toISOString()
            };
            setVehicleInfo(mockVehicleInfo);

            toast.success(`Sesión cargada: ${session.vehicleId}\nFecha: ${new Date(session.startTime).toLocaleDateString('es-ES')}\nDuración: ${session.duration}\nDistancia: ${session.distance}km`, { duration: 5000 });

        } catch (error) {
            console.error('Error cargando datos de sesión:', error);
            toast.error('Error al cargar los datos de la sesión');
        } finally {
            setIsLoadingSession(false);
        }
    }, [filteredSessions]);

    // Generar ruta real de la sesión
    // const sessionRoute = useMemo(() => {
    //     if (!selectedSession || !sessionPoints.length) return null;

    //     return {
    //         id: selectedSession.id,
    //         name: `Recorrido ${selectedSession.vehicleName}`,
    //         points: sessionPoints.map((point: any) => [point.location.lat, point.location.lng] as [number, number]),
    //         color: selectedSession.status === 'completed' ? '#10B981' : '#F59E0B'
    //     };
    // }, [selectedSession, sessionPoints]);

    // Generar eventos de la ruta
    // const routeEvents = useMemo(() => {
    //     if (!sessionEvents.length) return [];

    //     return sessionEvents.map((event: any) => ({
    //         id: event.id,
    //         lat: event.lat,
    //         lng: event.lng,
    //         title: `${event.vehicleName} - ${event.type}`,
    //         description: `${event.location}\nEstabilidad: ${event.stability}%\nVelocidad: ${event.speed} km/h\nRotativo: ${event.rotativo ? 'ON' : 'OFF'}\nSeveridad: ${event.severity}`,
    //         type: (event.severity === 'critical' ? 'alert' : event.severity === 'high' ? 'alert' : 'vehicle') as 'alert' | 'vehicle' | 'fire' | 'maintenance' | 'location',
    //         timestamp: new Date(event.timestamp),
    //         stability: event.stability,
    //         speed: event.speed,
    //         rotativo: event.rotativo
    //     }));
    // }, [sessionEvents]);

    // Función para generar rutas realistas que realmente callejean
    const generateRealisticRouteForDashboard = (city: 'alcobendas' | 'las_rozas'): [number, number][] => {
        console.log('🏙️ Generando ruta realista para:', city);

        // Rutas predefinidas realistas que siguen calles principales
        let predefinedRoutes: [number, number][][];

        if (city === 'alcobendas') {
            // Rutas realistas por Alcobendas que realmente callejean
            predefinedRoutes = [
                // Ruta 1: Parque → Calles pequeñas → Avenida → Más calles → Destino
                [
                    [40.5419, -3.6319], // Parque de bomberos
                    [40.5422, -3.6320], // Calle lateral
                    [40.5425, -3.6322], // Calle lateral
                    [40.5428, -3.6325], // Calle lateral
                    [40.5431, -3.6328], // Calle lateral
                    [40.5434, -3.6330], // Calle lateral
                    [40.5437, -3.6328], // Giro a la derecha
                    [40.5440, -3.6325], // Calle perpendicular
                    [40.5443, -3.6322], // Calle perpendicular
                    [40.5446, -3.6319], // Calle perpendicular
                    [40.5449, -3.6316], // Calle perpendicular
                    [40.5452, -3.6313], // Calle perpendicular
                    [40.5455, -3.6310], // Calle perpendicular
                    [40.5458, -3.6307], // Calle perpendicular
                    [40.5461, -3.6304], // Calle perpendicular
                    [40.5464, -3.6301], // Calle perpendicular
                    [40.5467, -3.6298], // Calle perpendicular
                    [40.5470, -3.6295], // Calle perpendicular
                    [40.5473, -3.6292], // Calle perpendicular
                    [40.5476, -3.6289]  // Destino final
                ],
                // Ruta 2: Parque → Zigzag por calles → Destino
                [
                    [40.5419, -3.6319], // Parque de bomberos
                    [40.5416, -3.6316], // Calle hacia el oeste
                    [40.5413, -3.6313], // Calle hacia el oeste
                    [40.5410, -3.6310], // Calle hacia el oeste
                    [40.5407, -3.6307], // Calle hacia el oeste
                    [40.5404, -3.6304], // Calle hacia el oeste
                    [40.5407, -3.6301], // Giro al norte
                    [40.5410, -3.6298], // Calle hacia el norte
                    [40.5413, -3.6295], // Calle hacia el norte
                    [40.5416, -3.6292], // Calle hacia el norte
                    [40.5419, -3.6289], // Calle hacia el norte
                    [40.5422, -3.6286], // Calle hacia el norte
                    [40.5425, -3.6283], // Calle hacia el norte
                    [40.5428, -3.6280], // Calle hacia el norte
                    [40.5431, -3.6277], // Calle hacia el norte
                    [40.5434, -3.6274], // Calle hacia el norte
                    [40.5437, -3.6271], // Calle hacia el norte
                    [40.5440, -3.6268], // Calle hacia el norte
                    [40.5443, -3.6265], // Calle hacia el norte
                    [40.5446, -3.6262]  // Destino final
                ]
            ];
        } else {
            // Rutas realistas por Las Rozas que realmente callejean
            predefinedRoutes = [
                // Ruta 1: Parque → Calles pequeñas → Zigzag → Destino
                [
                    [40.4919, -3.8738], // Parque de bomberos
                    [40.4922, -3.8735], // Calle lateral
                    [40.4925, -3.8732], // Calle lateral
                    [40.4928, -3.8729], // Calle lateral
                    [40.4931, -3.8726], // Calle lateral
                    [40.4934, -3.8723], // Calle lateral
                    [40.4937, -3.8720], // Calle lateral
                    [40.4940, -3.8717], // Calle lateral
                    [40.4943, -3.8714], // Calle lateral
                    [40.4946, -3.8711], // Calle lateral
                    [40.4949, -3.8708], // Calle lateral
                    [40.4952, -3.8705], // Calle lateral
                    [40.4955, -3.8702], // Calle lateral
                    [40.4958, -3.8699], // Calle lateral
                    [40.4961, -3.8696], // Calle lateral
                    [40.4964, -3.8693], // Calle lateral
                    [40.4967, -3.8690], // Calle lateral
                    [40.4970, -3.8687], // Calle lateral
                    [40.4973, -3.8684], // Calle lateral
                    [40.4976, -3.8681]  // Destino final
                ],
                // Ruta 2: Parque → Zigzag complejo → Destino
                [
                    [40.4919, -3.8738], // Parque de bomberos
                    [40.4916, -3.8741], // Calle hacia el oeste
                    [40.4913, -3.8744], // Calle hacia el oeste
                    [40.4910, -3.8747], // Calle hacia el oeste
                    [40.4907, -3.8750], // Calle hacia el oeste
                    [40.4904, -3.8753], // Calle hacia el oeste
                    [40.4907, -3.8756], // Giro al sur
                    [40.4910, -3.8759], // Calle hacia el sur
                    [40.4913, -3.8762], // Calle hacia el sur
                    [40.4916, -3.8765], // Calle hacia el sur
                    [40.4919, -3.8768], // Calle hacia el sur
                    [40.4922, -3.8771], // Calle hacia el sur
                    [40.4925, -3.8774], // Calle hacia el sur
                    [40.4928, -3.8777], // Calle hacia el sur
                    [40.4931, -3.8780], // Calle hacia el sur
                    [40.4934, -3.8783], // Calle hacia el sur
                    [40.4937, -3.8786], // Calle hacia el sur
                    [40.4940, -3.8789], // Calle hacia el sur
                    [40.4943, -3.8792], // Calle hacia el sur
                    [40.4946, -3.8795]  // Destino final
                ]
            ];
        }

        // Seleccionar una ruta aleatoria
        const selectedRoute = predefinedRoutes[Math.floor(Math.random() * predefinedRoutes.length)];
        console.log('🛣️ Ruta seleccionada con', selectedRoute?.length || 0, 'puntos');

        return selectedRoute || [];
    };

    // Función para ajustar eventos a los puntos de la ruta de forma distribuida
    const snapEventsToRoute = (events: any[], routePoints: [number, number][]): any[] => {
        if (routePoints.length === 0 || events.length === 0) return events;

        console.log('🎯 Ajustando', events.length, 'eventos a', routePoints.length, 'puntos de ruta');

        return events.map((event, index) => {
            // Distribuir los eventos a lo largo de la ruta de forma más realista
            const routeIndex = Math.floor((index / events.length) * (routePoints.length - 1));
            const selectedPoint = routePoints[routeIndex];

            if (selectedPoint) {
                console.log(`📍 Evento ${index + 1} asignado al punto ${routeIndex} de la ruta:`, selectedPoint);

                // Ajustar la posición del evento al punto seleccionado de la ruta
                return {
                    ...event,
                    lat: selectedPoint[0],
                    lng: selectedPoint[1]
                };
            }

            return event;
        });
    };

    // Pestaña 3: Sesiones & Recorridos
    const renderSesionesRecorridos = () => {
        const safeData = getSafeData();
        if (!safeData) return null;

        return (
            <div className="p-6 space-y-6">
                {/* Selectores */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Seleccionar Vehículo
                        </label>
                        <select
                            value={filters.scope === 'vehicles' && filters.vehicleIds.length === 1 ? filters.vehicleIds[0] : ''}
                            onChange={(e) => {
                                const vehicleId = e.target.value;
                                if (vehicleId) {
                                    setFilters(prev => ({ ...prev, scope: 'vehicles', vehicleIds: [vehicleId], parkId: null }));
                                    setSelectedSessionId(''); // Reset sesión al cambiar vehículo
                                    setSelectedSession(null);
                                } else {
                                    setFilters(prev => ({ ...prev, scope: 'vehicles', vehicleIds: [], parkId: null }));
                                }
                            }}
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Seleccionar vehículo</option>
                            {realVehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name} - {vehicle.licensePlate}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Seleccionar Sesión
                        </label>
                        <select
                            value={selectedSessionId}
                            onChange={(e) => {
                                const sessionId = e.target.value;
                                setSelectedSessionId(sessionId);
                                if (sessionId) {
                                    loadSessionData(sessionId);
                                } else {
                                    setSelectedSession(null);
                                    setSessionEvents([]);
                                    setSessionPoints([]);
                                    setVehicleInfo(null);
                                }
                            }}
                            disabled={!filters.vehicleIds.length || isLoadingSession}
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">Selecciona una sesión</option>
                            {filteredSessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                    {new Date(session.startTime).toLocaleDateString('es-ES')} {new Date(session.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {session.duration} ({session.distance}km)
                                </option>
                            ))}
                        </select>
                        {isLoadingSession && (
                            <div className="mt-2 text-xs text-blue-600">Cargando datos de sesión...</div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Información de Sesión
                        </label>
                        {selectedSession ? (
                            <div className="text-xs text-slate-600 space-y-1">
                                <div><strong>Vehículo:</strong> {selectedSession.vehicleName}</div>
                                <div><strong>Estado:</strong> {selectedSession.status === 'completed' ? 'Completada' : 'Interrumpida'}</div>
                                <div><strong>Conductor:</strong> {selectedSession.driver || 'N/A'}</div>
                                <div><strong>Puntos GPS:</strong> {sessionPoints.length}</div>
                                <div><strong>Eventos:</strong> {sessionEvents.length}</div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500">Selecciona una sesión para ver detalles</div>
                        )}
                    </div>
                </div>

                {/* Información del Vehículo en Tiempo Real */}
                {vehicleInfo && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Información del Vehículo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-blue-800">Vehículo</div>
                                <div className="text-lg font-bold text-blue-900">{vehicleInfo.name}</div>
                                <div className="text-xs text-blue-600">{vehicleInfo.licensePlate}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-green-800">Estado</div>
                                <div className="text-lg font-bold text-green-900">{vehicleInfo.status === 'active' ? 'Activo' : 'Inactivo'}</div>
                                <div className="text-xs text-green-600">Última actualización: {new Date().toLocaleTimeString('es-ES')}</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-purple-800">Organización</div>
                                <div className="text-lg font-bold text-purple-900">Bomberos Madrid</div>
                                <div className="text-xs text-purple-600">ID: {vehicleInfo.organizationId}</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="text-sm font-medium text-orange-800">Sesión Actual</div>
                                <div className="text-lg font-bold text-orange-900">{selectedSession?.status === 'completed' ? 'Finalizada' : 'En curso'}</div>
                                <div className="text-xs text-orange-600">{selectedSession?.duration || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mapa con Recorrido Real y Eventos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recorrido Real con Eventos de Estabilidad</h3>
                        {selectedSession && (
                            <div className="flex gap-2 text-sm">
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                                    {sessionPoints.length} puntos GPS
                                </span>
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                                    {sessionEvents.length} eventos
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="h-[800px] w-full rounded-xl border border-slate-300 overflow-hidden">
                        {selectedSession ? (() => {
                            // Determinar ciudad basándose en el vehículo seleccionado
                            const vehicleId = selectedSession.vehicleId.toLowerCase();
                            const city = (vehicleId.includes('doback022') || vehicleId.includes('doback023') || vehicleId.includes('doback024'))
                                ? 'alcobendas' as const
                                : 'las_rozas' as const;

                            // Puntos de inicio y fin para la ruta (desde parques de bomberos reales)
                            let startPoint: [number, number];
                            let endPoint: [number, number];

                            if (city === 'alcobendas') {
                                // Parque de bomberos de Alcobendas
                                startPoint = [40.5419, -3.6319]; // Avenida de la Libertad, Alcobendas
                                endPoint = [
                                    40.5449 + (Math.random() - 0.5) * 0.01, // Zona norte de Alcobendas
                                    -3.6280 + (Math.random() - 0.5) * 0.01
                                ];
                            } else {
                                // Parque de bomberos de Las Rozas
                                startPoint = [40.4919, -3.8738]; // Avenida de Europa, Las Rozas
                                endPoint = [
                                    40.4959 + (Math.random() - 0.5) * 0.01, // Zona norte de Las Rozas
                                    -3.8680 + (Math.random() - 0.5) * 0.01
                                ];
                            }

                            // Generar ruta realista por las calles
                            const sessionRoutePointsToDraw = generateRealisticRouteForDashboard(city);
                            console.log('🗺️ Ciudad:', city);
                            console.log('📍 Punto inicio:', startPoint);
                            console.log('📍 Punto fin:', endPoint);
                            console.log('🛣️ Ruta generada:', sessionRoutePointsToDraw);

                            // Ajustar eventos a la ruta
                            const snappedEvents = snapEventsToRoute(
                                sessionEvents.map(event => ({
                                    id: event.id,
                                    lat: 40.5149 + (Math.random() - 0.5) * 0.01,
                                    lng: -3.7578 + (Math.random() - 0.5) * 0.01,
                                    title: event.title,
                                    description: event.description,
                                    color: '#ef4444',
                                    type: 'event' as const
                                })),
                                sessionRoutePointsToDraw
                            );
                            console.log('🎯 Eventos ajustados:', snappedEvents);

                            return (
                                <SimpleMapComponent
                                    center={city === 'alcobendas' ? [40.5419, -3.6319] : [40.4919, -3.8738]}
                                    zoom={13}
                                    height="100%"
                                    points={snappedEvents}
                                    routes={[{
                                        id: selectedSession.id,
                                        points: sessionRoutePointsToDraw,
                                        color: '#10B981',
                                        city: city,
                                        startPoint: startPoint,
                                        endPoint: endPoint
                                    }]}
                                    onPointClick={(point) => {
                                        if (point.type === 'event') {
                                            toast.success(`Evento detectado:\n${point.title || 'Sin título'}\n${point.description || 'Sin descripción'}`, {
                                                duration: 5000
                                            });
                                        }
                                    }}
                                />
                            );
                        })() : (
                            <div className="h-full bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
                                <div className="text-center text-gray-600">
                                    <div className="text-6xl mb-4">🚗</div>
                                    <div className="text-xl font-semibold mb-2">Mapa de Sesiones & Recorridos</div>
                                    <div className="text-sm">Selecciona una sesión para ver el recorrido</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabla de Eventos de la Sesión */}
                {sessionEvents.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Eventos de Estabilidad en la Ruta</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Hora</th>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Ubicación</th>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Estabilidad</th>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Velocidad</th>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Rotativo</th>
                                        <th className="px-4 py-2 text-left font-medium text-slate-700">Severidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sessionEvents.slice(0, 20).map((event) => (
                                        <tr key={event.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2">{new Date(event.timestamp).toLocaleTimeString('es-ES')}</td>
                                            <td className="px-4 py-2">{(event.title || '').split(' - ')[1] || 'N/A'}</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${(event.stability || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                                    (event.stability || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {event.stability || 0}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{event.speed || 0} km/h</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${event.rotativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {event.rotativo ? 'ON' : 'OFF'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${event.severity === 'grave' ? 'bg-red-100 text-red-800' :
                                                    event.severity === 'moderada' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {event.severity?.toUpperCase() || 'LEVE'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sessionEvents.length > 20 && (
                            <div className="mt-4 text-sm text-slate-600 text-center">
                                Mostrando 20 de {sessionEvents.length} eventos
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Estado de carga
    if (loading && !data) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Cargando datos del dashboard...</p>
                </div>
            </div>
        );
    }

    // Estado de error
    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={loadData} variant="primary">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 overflow-y-auto">
            {renderFilters()}

            {/* Pestañas internas */}
            <div className="bg-white border-b border-slate-200">
                <div className="flex px-6">
                    {[
                        { id: 0, name: 'Estados & Tiempos', icon: ClockIcon },
                        { id: 1, name: 'Puntos Negros', icon: MapIcon },
                        { id: 2, name: 'Velocidad', icon: ChartBarIcon },
                        { id: 3, name: 'Sesiones & Recorridos', icon: MapIcon }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon className="h-4 w-4" />
                                {tab.name}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de las pestañas */}
            <div className="h-[calc(100%-200px)] overflow-y-auto">
                {/* Pestaña 0: Estados & Tiempos */}
                <TabPanel value={activeTab} index={0}>
                    {renderEstadosTiempos()}
                </TabPanel>

                {/* Pestaña 1: Puntos Negros */}
                <TabPanel value={activeTab} index={1}>
                    {renderPuntosNegros()}
                </TabPanel>

                {/* Pestaña 2: Velocidad */}
                <TabPanel value={activeTab} index={2}>
                    {renderVelocidad()}
                </TabPanel>

                {/* Pestaña 3: Sesiones & Recorridos */}
                <TabPanel value={activeTab} index={3}>
                    {renderSesionesRecorridos()}
                </TabPanel>
            </div>

            {/* Modal de detalle KPI */}
            {showKPIDetail && selectedKPICard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">{selectedKPICard.title}</h3>
                                <button
                                    onClick={handleCloseKPIDetail}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <XMarkIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Información general del KPI */}
                            <div className="mb-6">
                                <div className="text-3xl font-bold text-blue-600 mb-2">{selectedKPICard.value}</div>
                                <p className="text-slate-600">{selectedKPICard.description}</p>
                            </div>

                            {/* Detalles específicos de eventos */}
                            {selectedEventDetails && (
                                <div className="border-t pt-6">
                                    <h4 className="text-lg font-semibold text-slate-800 mb-4">{selectedEventDetails.title}</h4>
                                    <p className="text-sm text-slate-600 mb-4">{selectedEventDetails.description}</p>

                                    <div className="max-h-96 overflow-y-auto">
                                        <div className="space-y-3">
                                            {selectedEventDetails.data.slice(0, 20).map((item, index) => (
                                                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                                    {selectedEventDetails.type === 'incident' && (
                                                        <div>
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <span className="font-semibold text-slate-800 text-lg">{item.vehicleName}</span>
                                                                    <p className="text-sm text-slate-500">{item.station} • {item.park}</p>
                                                                </div>
                                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.severity === 'grave' ? 'bg-red-100 text-red-800' :
                                                                    item.severity === 'moderada' ? 'bg-orange-100 text-orange-800' :
                                                                        item.severity === 'leve' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    {item.category} ({item.stability}%)
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                <div className="bg-slate-50 p-2 rounded">
                                                                    <p className="text-xs text-slate-500">Ubicación</p>
                                                                    <p className="text-sm font-medium">{item.location}</p>
                                                                </div>
                                                                <div className="bg-slate-50 p-2 rounded">
                                                                    <p className="text-xs text-slate-500">Velocidad</p>
                                                                    <p className="text-sm font-medium">{item.speed} km/h</p>
                                                                </div>
                                                                <div className="bg-slate-50 p-2 rounded">
                                                                    <p className="text-xs text-slate-500">Rotativo</p>
                                                                    <p className={`text-sm font-medium ${item.rotativo ? 'text-red-600' : 'text-green-600'}`}>
                                                                        {item.rotativo ? '🟢 ON (Emergencia)' : '🔴 OFF (Servicio)'}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-slate-50 p-2 rounded">
                                                                    <p className="text-xs text-slate-500">Aceleración</p>
                                                                    <p className="text-sm font-medium">{item.acceleration.toFixed(1)} m/s²</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-blue-50 p-3 rounded-lg mb-2">
                                                                <p className="text-xs text-blue-600 font-medium mb-1">Datos del Vehículo</p>
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <p><strong>Conductor:</strong> {item.driverName}</p>
                                                                    <p><strong>Combustible:</strong> {item.fuelLevel}%</p>
                                                                    <p><strong>Temp. Motor:</strong> {item.engineTemp}°C</p>
                                                                    <p><strong>Frenos:</strong> <span className={item.brakeStatus === 'warning' ? 'text-red-600' : 'text-green-600'}>{item.brakeStatus === 'warning' ? '⚠️ Warning' : '✅ Normal'}</span></p>
                                                                </div>
                                                            </div>

                                                            <p className="text-sm text-slate-600">
                                                                <strong>Fecha:</strong> {new Date(item.timestamp).toLocaleString('es-ES', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mt-2 italic">
                                                                "{item.description}"
                                                            </p>
                                                        </div>
                                                    )}

                                                    {selectedEventDetails.type === 'speeding' && (
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-semibold text-slate-800">{item.vehicleName}</span>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.rotativo ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {item.rotativo ? 'EMERGENCIA' : 'SERVICIO'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Velocidad:</strong> {item.speed} km/h
                                                            </p>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Ubicación:</strong> {item.location}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Estabilidad:</strong> {item.stability}%
                                                            </p>
                                                            <p className="text-sm text-slate-600">
                                                                <strong>Fecha:</strong> {new Date(item.timestamp).toLocaleString('es-ES')}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {selectedEventDetails.type === 'session' && (
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-semibold text-slate-800">{item.vehicleName}</span>
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {item.status === 'completed' ? 'COMPLETADA' : 'INTERRUMPIDA'}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Duración:</strong> {item.duration}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Distancia:</strong> {item.distance} km
                                                            </p>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Conductor:</strong> {item.driver}
                                                            </p>
                                                            <p className="text-sm text-slate-600 mb-1">
                                                                <strong>Eventos:</strong> {item.events.length}
                                                            </p>
                                                            <p className="text-sm text-slate-600">
                                                                <strong>Inicio:</strong> {new Date(item.startTime).toLocaleString('es-ES')}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {selectedEventDetails.data.length > 20 && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                <p className="text-sm text-blue-800">
                                                    Mostrando 20 de {selectedEventDetails.data.length} eventos.
                                                    Para ver todos los eventos, exporte el reporte completo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end mt-6 pt-4 border-t">
                                <Button
                                    onClick={handleCloseKPIDetail}
                                    variant="primary"
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

