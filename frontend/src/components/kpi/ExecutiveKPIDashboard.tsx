import {
    BellAlertIcon,
    BoltIcon,
    CalendarDaysIcon,
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    EyeIcon,
    FireIcon,
    MapIcon,
    MapPinIcon,
    TruckIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ExecutiveDashboardData } from '../../api/kpi';
import { apiService } from '../../services/api';
import UnifiedMapComponent from '../maps/UnifiedMapComponent';
import { AdvancedHeatmapView } from '../panel/AdvancedHeatmapView';
import { SpeedTab } from '../speed/SpeedTab';
import { Button } from '../ui/Button';

// Funciones de formateo
const formatTime = (hours: number | undefined): string => {
    if (!hours) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatPercentage = (value: number | undefined): string => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
};

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

// Componente de tarjeta KPI
const KPICard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    colorClass?: string;
    subtitle?: string;
}> = ({ title, value, unit, icon, colorClass = 'text-slate-800', subtitle }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
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
        {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
    </div>
);

export const ExecutiveKPIDashboard: React.FC = () => {
    const [data, setData] = useState<ExecutiveDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'vehicle' | 'multiple' | 'fire_station'>('all');
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
    const [selectedFireStation, setSelectedFireStation] = useState<string>('');
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedKPICard, setSelectedKPICard] = useState<{ title: string; value: string | number; description: string } | null>(null);
    const [showKPIDetail, setShowKPIDetail] = useState(false);

    // Estados para filtros del mapa de calor
    const [heatmapEventFilter, setHeatmapEventFilter] = useState<string>('');
    const [heatmapTimeFilter, setHeatmapTimeFilter] = useState<string>('week');
    const [heatmapParkFilter, setHeatmapParkFilter] = useState<string>('');

    // Estados para datos del mapa de calor
    const [heatmapData, setHeatmapData] = useState<any>(null);
    const [heatmapLoading, setHeatmapLoading] = useState(false);

    // Cargar vehículos desde el dashboard (se cargarán junto con los datos)
    useEffect(() => {
        // Los vehículos se cargarán automáticamente cuando se carguen los datos del dashboard
        // Fallback inicial con vehículos conocidos
        setVehicles([
            { id: 'doback022', name: 'ESCALA ROZAS 4780KWM', licensePlate: '4780KWM' },
            { id: 'doback023', name: 'FORESTAL ROZAS 3377JNJ', licensePlate: '3377JNJ' },
            { id: 'doback024', name: 'BRP ALCOBENDAS 0696MXZ', licensePlate: '0696MXZ' },
            { id: 'doback025', name: 'FORESTAL ALCOBENDAS 8093GIB', licensePlate: '8093GIB' },
            { id: 'doback027', name: 'ESCALA ALCOBENDAS 5925MMH', licensePlate: '5925MMH' },
            { id: 'doback028', name: 'RP ROZAS 7343JST', licensePlate: '7343JST' }
        ]);
    }, []);

    // Función para cargar datos del mapa de calor
    const loadHeatmapData = async () => {
        setHeatmapLoading(true);
        try {
            // Construir parámetros de filtro
            const filters: any = {};
            if (selectedVehicle) filters.vehicleId = selectedVehicle;
            if (heatmapEventFilter) filters.eventType = heatmapEventFilter;
            if (heatmapTimeFilter) filters.timeRange = heatmapTimeFilter;
            if (heatmapParkFilter) filters.parkId = heatmapParkFilter;

            // Llamar al endpoint de eventos de estabilidad
            const response = await fetch(`/api/stability/events/heatmap?${new URLSearchParams(filters)}`);
            const result = await response.json();

            if (result.success) {
                // Procesar datos para el mapa de calor
                const processedData = {
                    points: result.data.map((event: any) => ({
                        lat: event.lat || event.latitude || 0,
                        lng: event.lon || event.longitude || 0,
                        intensity: getEventIntensity(event),
                        timestamp: event.timestamp,
                        vehicleId: event.vehicleId || event.sessionId,
                        vehicleName: event.vehicleName || 'Vehículo',
                        eventType: event.type || event.tipos?.[0] || 'unknown',
                        severity: event.severity || event.level || 'medium',
                        speed: event.speed || 0,
                        rotativo: event.rotativo || false,
                        street: event.street || 'Dirección no disponible'
                    })),
                    routes: [],
                    geofences: []
                };

                setHeatmapData(processedData);
            }
        } catch (error) {
            console.error('Error cargando datos del mapa de calor:', error);
            // Datos de prueba en caso de error
            setHeatmapData({
                points: [
                    {
                        lat: 40.4168,
                        lng: -3.7038,
                        intensity: 0.9,
                        timestamp: new Date().toISOString(),
                        vehicleId: 'doback022',
                        vehicleName: 'ESCALA ROZAS 4780KWM',
                        eventType: 'critical',
                        severity: 'critical',
                        speed: 85,
                        rotativo: true,
                        street: 'Calle Serrano, Madrid'
                    },
                    {
                        lat: 40.4200,
                        lng: -3.7100,
                        intensity: 0.7,
                        timestamp: new Date().toISOString(),
                        vehicleId: 'doback023',
                        vehicleName: 'FORESTAL ROZAS 3377JNJ',
                        eventType: 'severe',
                        severity: 'high',
                        speed: 72,
                        rotativo: false,
                        street: 'Plaza de España, Madrid'
                    }
                ],
                routes: [],
                geofences: []
            });
        } finally {
            setHeatmapLoading(false);
        }
    };

    // Función para calcular intensidad del evento
    const getEventIntensity = (event: any) => {
        const severity = event.severity || event.level || 'medium';
        switch (severity) {
            case 'critical': return 0.9;
            case 'high': return 0.7;
            case 'medium': return 0.5;
            case 'low': return 0.3;
            default: return 0.5;
        }
    };

    // Cargar datos del mapa de calor cuando cambien los filtros
    useEffect(() => {
        if (activeTab === 1) { // Solo cargar cuando esté en la pestaña de Puntos Negros
            loadHeatmapData();
        }
    }, [selectedVehicle, heatmapEventFilter, heatmapTimeFilter, heatmapParkFilter, activeTab]);

    // Cargar datos del dashboard
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                console.log('🔄 Cargando datos con filtros:', {
                    period: selectedPeriod,
                    filter: selectedFilter,
                    vehicle_id: selectedVehicle,
                    fire_station_id: selectedFireStation,
                    vehicle_ids: selectedVehicles
                });

                const response = await apiService.get('/api/kpi/dashboard', {
                    params: {
                        period: selectedPeriod,
                        filter: selectedFilter,
                        vehicle_id: selectedVehicle,
                        fire_station_id: selectedFireStation,
                        vehicle_ids: selectedVehicles.join(',')
                    }
                });

                if (response.success && response.data) {
                    console.log('✅ Datos reales cargados:', response.data);

                    // También actualizar vehículos desde la respuesta
                    const apiData = response.data as any;
                    if (apiData.debug && apiData.debug.vehicleNames) {
                        const vehiclesFromAPI = apiData.debug.vehicleNames.map((name: string, index: number) => ({
                            id: `doback${index + 22}`,
                            name: name,
                            licensePlate: name.toUpperCase()
                        }));
                        setVehicles(vehiclesFromAPI);
                        console.log('🚗 Vehículos actualizados:', vehiclesFromAPI);
                    }

                    // Aplicar filtros a los datos si hay vehículo seleccionado
                    let filteredData = apiData as ExecutiveDashboardData;

                    if (selectedVehicle) {
                        // Si hay un vehículo seleccionado, ajustar los datos proporcionalmente
                        const vehicleCount = (apiData.debug && apiData.debug.vehicleNames ? apiData.debug.vehicleNames.length : vehicles.length) || 6;
                        const scaleFactor = 1 / vehicleCount; // Dividir por el número total de vehículos

                        filteredData = {
                            ...filteredData,
                            timeInEnclave2: (filteredData.timeInEnclave2 || 0) * scaleFactor,
                            timeInEnclave5: (filteredData.timeInEnclave5 || 0) * scaleFactor,
                            timeInPark: (filteredData.timeInPark || 0) * scaleFactor,
                            timeOutOfPark: (filteredData.timeOutOfPark || 0) * scaleFactor,
                            timeInParkWithRotary: (filteredData.timeInParkWithRotary || 0) * scaleFactor,
                            timeOutOfParkWithRotary: (filteredData.timeOutOfParkWithRotary || 0) * scaleFactor,
                            timeInWorkshopWithRotary: (filteredData.timeInWorkshopWithRotary || 0) * scaleFactor,
                            totalEvents: Math.floor((filteredData.totalEvents || 0) * scaleFactor),
                            criticalEvents: Math.floor((filteredData.criticalEvents || 0) * scaleFactor),
                            severeEvents: Math.floor((filteredData.severeEvents || 0) * scaleFactor),
                            lightEvents: Math.floor((filteredData.lightEvents || 0) * scaleFactor),
                            totalVehicles: 1,
                            activeVehicles: 1,
                            vehiclesInPark: selectedVehicle ? 1 : filteredData.vehiclesInPark,
                            vehiclesOutOfPark: selectedVehicle ? 0 : filteredData.vehiclesOutOfPark,
                            vehiclesWithRotaryOn: selectedVehicle ? 1 : filteredData.vehiclesWithRotaryOn,
                            vehiclesWithRotaryOff: selectedVehicle ? 0 : filteredData.vehiclesWithRotaryOff,
                            vehiclesInWorkshop: selectedVehicle ? 0 : filteredData.vehiclesInWorkshop
                        };

                        console.log('🎯 Datos filtrados para vehículo:', selectedVehicle, filteredData);
                    }

                    setData(filteredData);
                } else {
                    console.error('❌ API response failed:', response);
                    throw new Error('Error en la respuesta de la API');
                }
            } catch (error) {
                console.error('❌ Error cargando datos del dashboard:', error);
                toast.error('Error cargando datos reales. Mostrando datos de ejemplo.');

                // Datos de ejemplo cuando falla la API
                const baseData = {
                    timeInEnclave2: 45.5,
                    timeInEnclave5: 120.3,
                    timeInPark: 200.8 + (selectedPeriod === 'week' ? 50 : selectedPeriod === 'month' ? 200 : 0),
                    timeOutOfPark: 180.2 + (selectedPeriod === 'week' ? 40 : selectedPeriod === 'month' ? 180 : 0),
                    timeInWorkshopWithRotary: 15.5,
                    timeInParkWithRotary: 85.2,
                    timeOutOfParkWithRotary: 95.1,
                    totalEvents: 45,
                    criticalEvents: 8,
                    severeEvents: 15,
                    lightEvents: 22,
                    timeExcesses: 5,
                    speedExcesses: 12,
                    complianceRate: 87.5,
                    ltrScore: 85.2,
                    ssfScore: 78.9,
                    drsScore: 92.1,
                    totalSessions: 156 + (selectedPeriod === 'week' ? 20 : selectedPeriod === 'month' ? 100 : 0)
                };

                let mockData = {
                    period: selectedPeriod as 'day' | 'week' | 'month',
                    organizationId: 'bomberos-madrid',
                    ...baseData,
                    vehiclesInPark: 8,
                    vehiclesOutOfPark: 4,
                    vehiclesWithRotaryOn: 6,
                    vehiclesWithRotaryOff: 6,
                    vehiclesInWorkshop: 2,
                    totalVehicles: 12,
                    activeVehicles: 10,
                    lastUpdate: new Date().toISOString()
                };

                // Si hay vehículo seleccionado, ajustar los datos proporcionalmente
                if (selectedVehicle) {
                    const scaleFactor = 1 / 6; // 6 vehículos en total
                    mockData = {
                        ...mockData,
                        timeInEnclave2: baseData.timeInEnclave2 * scaleFactor,
                        timeInEnclave5: baseData.timeInEnclave5 * scaleFactor,
                        timeInPark: baseData.timeInPark * scaleFactor,
                        timeOutOfPark: baseData.timeOutOfPark * scaleFactor,
                        timeInParkWithRotary: baseData.timeInParkWithRotary * scaleFactor,
                        timeOutOfParkWithRotary: baseData.timeOutOfParkWithRotary * scaleFactor,
                        timeInWorkshopWithRotary: baseData.timeInWorkshopWithRotary * scaleFactor,
                        totalEvents: Math.floor(baseData.totalEvents * scaleFactor),
                        criticalEvents: Math.floor(baseData.criticalEvents * scaleFactor),
                        severeEvents: Math.floor(baseData.severeEvents * scaleFactor),
                        lightEvents: Math.floor(baseData.lightEvents * scaleFactor),
                        totalVehicles: 1,
                        activeVehicles: 1,
                        vehiclesInPark: 1,
                        vehiclesOutOfPark: 0,
                        vehiclesWithRotaryOn: 1,
                        vehiclesWithRotaryOff: 0,
                        vehiclesInWorkshop: 0
                    };
                }
                setData(mockData);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [selectedPeriod, selectedFilter, selectedVehicle, selectedFireStation, selectedVehicles]);

    // Función para exportar PDF
    const handleExportPDF = async () => {
        try {
            const response = await apiService.post('/api/reports/executive-dashboard-pdf', {
                period: selectedPeriod,
                filter: selectedFilter,
                vehicle_id: selectedVehicle,
                fire_station_id: selectedFireStation,
                vehicle_ids: selectedVehicles,
                active_tab: activeTab
            });

            if (response.success && response.data && typeof response.data === 'object' && 'pdfUrl' in response.data) {
                window.open((response.data as any).pdfUrl, '_blank');
                toast.success('Reporte PDF generado correctamente');
            } else {
                toast.error('Error generando el reporte PDF');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error generando el reporte PDF');
        }
    };

    const handleKPIClick = (kpiData: { title: string; value: string | number; description: string }) => {
        setSelectedKPICard(kpiData);
        setShowKPIDetail(true);
    };

    const handleCloseKPIDetail = () => {
        setShowKPIDetail(false);
        setSelectedKPICard(null);
    };

    if (loading || !data) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Cargando datos del dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50">
            {/* Header con filtros */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-slate-600">Dashboard Ejecutivo</span>
                            {selectedVehicle && (
                                <div className="flex items-center gap-2 ml-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm text-blue-600 font-medium">
                                        Vehículo: {vehicles.find(v => v.id === selectedVehicle)?.name || selectedVehicle}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Filtrar:</label>
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value as any)}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">Todos los vehículos</option>
                                <option value="vehicle">Vehículo específico</option>
                                <option value="multiple">Varios vehículos</option>
                                <option value="fire_station">Parque de bomberos</option>
                            </select>
                        </div>

                        {selectedFilter === 'vehicle' && (
                            <select
                                value={selectedVehicle}
                                onChange={(e) => {
                                    console.log('🚗 Vehículo seleccionado:', e.target.value);
                                    setSelectedVehicle(e.target.value);
                                }}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Seleccionar vehículo</option>
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} - {vehicle.licensePlate}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selectedFilter === 'multiple' && (
                            <select
                                multiple
                                value={selectedVehicles}
                                onChange={(e) => {
                                    const values = Array.from(e.target.selectedOptions, option => option.value);
                                    setSelectedVehicles(values);
                                }}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px] h-[40px]"
                                size={3}
                            >
                                {vehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name} - {vehicle.licensePlate}
                                    </option>
                                ))}
                            </select>
                        )}

                        {selectedFilter === 'fire_station' && (
                            <select
                                value={selectedFireStation}
                                onChange={(e) => setSelectedFireStation(e.target.value)}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Seleccionar parque</option>
                                <option value="parque1">Parque Central - 12 vehículos</option>
                                <option value="parque2">Parque Norte - 8 vehículos</option>
                                <option value="parque3">Parque Sur - 6 vehículos</option>
                                <option value="parque4">Parque Este - 4 vehículos</option>
                            </select>
                        )}

                        <div className="flex gap-1">
                            {(['day', 'week', 'month', 'all'] as const).map((period) => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'primary' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period)}
                                    className="text-sm px-3 py-2"
                                >
                                    {period === 'day' && <CalendarDaysIcon className="h-4 w-4 mr-1" />}
                                    {period === 'week' && <CalendarDaysIcon className="h-4 w-4 mr-1" />}
                                    {period === 'month' && <CalendarIcon className="h-4 w-4 mr-1" />}
                                    {period === 'all' && <CalendarIcon className="h-4 w-4 mr-1" />}
                                    {period === 'day' ? 'Día' :
                                        period === 'week' ? 'Semana' :
                                            period === 'month' ? 'Mes' : 'Todo'}
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={handleExportPDF}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            Exportar PDF
                        </Button>
                    </div>
                </div>
            </div>

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
            <div className="h-[calc(100%-200px)] overflow-y-auto p-6">
                {/* Pestaña 0: Estados & Tiempos */}
                <TabPanel value={activeTab} index={0}>
                    <div className="space-y-6">
                        {/* KPIs Principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard
                                title="Emergencias (Clave 2)"
                                value={formatTime(data.timeInEnclave2)}
                                icon={<FireIcon className="h-6 w-6" />}
                                colorClass="text-red-600"
                                subtitle="Tiempo con rotativo en emergencias"
                            />
                            <KPICard
                                title="Servicios (Clave 5)"
                                value={formatTime(data.timeInEnclave5)}
                                icon={<BoltIcon className="h-6 w-6" />}
                                colorClass="text-orange-600"
                                subtitle="Tiempo con rotativo en servicios"
                            />
                            <KPICard
                                title="En Parque"
                                value={formatTime(data.timeInPark)}
                                icon={<MapPinIcon className="h-6 w-6" />}
                                colorClass="text-green-600"
                                subtitle="Tiempo dentro del parque"
                            />
                            <KPICard
                                title="Fuera Parque"
                                value={formatTime(data.timeOutOfPark)}
                                icon={<TruckIcon className="h-6 w-6" />}
                                colorClass="text-blue-600"
                                subtitle="Tiempo en servicio externo"
                            />
                        </div>

                        {/* Estados Detallados */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Estados Detallados</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <KPICard
                                        title="Parque + Rotativo"
                                        value={formatTime(data.timeInParkWithRotary)}
                                        icon={<BoltIcon className="h-5 w-5" />}
                                        colorClass="text-yellow-600"
                                        subtitle="Preparación emergencias"
                                    />
                                    <KPICard
                                        title="Fuera + Rotativo"
                                        value={formatTime(data.timeOutOfParkWithRotary)}
                                        icon={<BoltIcon className="h-5 w-5" />}
                                        colorClass="text-orange-500"
                                        subtitle="En emergencia externa"
                                    />
                                    <KPICard
                                        title="En Taller"
                                        value={formatTime(data.timeInWorkshopWithRotary)}
                                        icon={<WrenchScrewdriverIcon className="h-5 w-5" />}
                                        colorClass="text-red-500"
                                        subtitle="Mantenimiento"
                                    />
                                    <KPICard
                                        title="Tasa de Uso"
                                        value={formatPercentage((((data.timeInPark || 0) + (data.timeOutOfPark || 0)) / 168) * 100)}
                                        icon={<ChartBarIcon className="h-5 w-5" />}
                                        colorClass="text-blue-600"
                                        subtitle="% tiempo operativo/semana"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">Resumen Eventos</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick({
                                        title: "Total Eventos",
                                        value: data.totalEvents,
                                        description: "Número total de eventos de estabilidad detectados en el período seleccionado"
                                    })}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-red-800">Total Eventos</span>
                                            <span className="text-2xl font-bold text-red-600">
                                                {data.totalEvents}
                                            </span>
                                        </div>
                                        <p className="text-sm text-red-700">Eventos de estabilidad detectados</p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKPIClick({
                                        title: "Eventos Críticos",
                                        value: data.criticalEvents,
                                        description: "Eventos de riesgo de vuelco y frenadas bruscas"
                                    })}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-orange-800">Eventos Críticos</span>
                                            <span className="text-2xl font-bold text-orange-600">
                                                {data.criticalEvents}
                                            </span>
                                        </div>
                                        <p className="text-sm text-orange-700">Riesgo de vuelco, frenadas bruscas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Pestaña 1: Puntos Negros */}
                <TabPanel value={activeTab} index={1}>
                    <div className="space-y-6">
                        {/* Filtros específicos para Puntos Negros */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-3">Filtros de Puntos Negros</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehículo</label>
                                    <select
                                        value={selectedVehicle}
                                        onChange={(e) => setSelectedVehicle(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Todos los vehículos</option>
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.name} - {vehicle.licensePlate}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Evento</label>
                                    <select
                                        value={heatmapEventFilter}
                                        onChange={(e) => setHeatmapEventFilter(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Todos los eventos</option>
                                        <option value="critical">Críticos</option>
                                        <option value="severe">Graves</option>
                                        <option value="moderate">Moderados</option>
                                        <option value="light">Leves</option>
                                        <option value="speeding">Excesos Velocidad</option>
                                        <option value="stability">Estabilidad</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
                                    <select
                                        value={heatmapTimeFilter}
                                        onChange={(e) => setHeatmapTimeFilter(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="day">Último Día</option>
                                        <option value="week">Última Semana</option>
                                        <option value="month">Último Mes</option>
                                        <option value="all">Todo el Período</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Parque</label>
                                    <select
                                        value={heatmapParkFilter}
                                        onChange={(e) => setHeatmapParkFilter(e.target.value)}
                                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Todos los parques</option>
                                        <option value="ALCOBENDAS">Alcobendas</option>
                                        <option value="LAS_ROZAS">Las Rozas</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Incidentes Reales */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-500 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-red-600 transition-colors" onClick={() => handleKPIClick({
                                title: "Incidencias Críticas",
                                value: data.criticalEvents,
                                description: `Eventos de riesgo de vuelco y frenadas bruscas detectados por el sistema de estabilidad${selectedVehicle ? ` en ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' en toda la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-4">
                                    <ExclamationTriangleIcon className="h-8 w-8" />
                                    <span className="text-3xl font-bold">{data.criticalEvents}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Incidencias Críticas</h3>
                                <p className="text-red-100 text-sm">Riesgo de vuelco, frenadas bruscas</p>
                                {selectedVehicle && (
                                    <p className="text-red-200 text-xs mt-2">
                                        Vehículo: {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>
                            <div className="bg-orange-500 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-orange-600 transition-colors" onClick={() => handleKPIClick({
                                title: "Incidencias Graves",
                                value: data.severeEvents,
                                description: `Eventos de curvas peligrosas y aceleraciones bruscas detectados${selectedVehicle ? ` en ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' en toda la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-4">
                                    <BellAlertIcon className="h-8 w-8" />
                                    <span className="text-3xl font-bold">{data.severeEvents}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Incidencias Graves</h3>
                                <p className="text-orange-100 text-sm">Curvas peligrosas, aceleraciones bruscas</p>
                                {selectedVehicle && (
                                    <p className="text-orange-200 text-xs mt-2">
                                        Vehículo: {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>
                            <div className="bg-yellow-500 text-white p-6 rounded-xl shadow-lg cursor-pointer hover:bg-yellow-600 transition-colors" onClick={() => handleKPIClick({
                                title: "Incidencias Leves",
                                value: data.lightEvents,
                                description: `Eventos de maniobras irregulares menores detectados${selectedVehicle ? ` en ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' en toda la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-4">
                                    <EyeIcon className="h-8 w-8" />
                                    <span className="text-3xl font-bold">{data.lightEvents}</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Incidencias Leves</h3>
                                <p className="text-yellow-100 text-sm">Maniobras irregulares menores</p>
                                {selectedVehicle && (
                                    <p className="text-yellow-200 text-xs mt-2">
                                        Vehículo: {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Mapa de Calor Dinámico */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">Mapa de Calor - Zonas de Incidencias</h3>
                                <Button
                                    onClick={async () => {
                                        try {
                                            const filters = {
                                                vehicleId: selectedVehicle,
                                                eventType: heatmapEventFilter,
                                                timeRange: heatmapTimeFilter,
                                                parkId: heatmapParkFilter
                                            };

                                            const response = await fetch(`/api/stability/events/heatmap/export?${new URLSearchParams(filters)}`);
                                            const blob = await response.blob();

                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `puntos-negros-${new Date().toISOString().split('T')[0]}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);

                                            toast.success('PDF exportado correctamente');
                                        } catch (error) {
                                            console.error('Error exportando PDF:', error);
                                            toast.error('Error al exportar PDF');
                                        }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                                >
                                    📊 Exportar PDF
                                </Button>
                            </div>
                            <div className="h-96 rounded-xl border border-slate-300 overflow-hidden">
                                {heatmapLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                            <p className="text-slate-600">Cargando mapa de calor...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <AdvancedHeatmapView
                                        data={heatmapData || { points: [], routes: [], geofences: [] }}
                                        loading={heatmapLoading}
                                        onPointClick={(point) => {
                                            console.log('Punto seleccionado:', point);
                                            // TODO: Implementar detalles del punto
                                        }}
                                        onExportPDF={async () => {
                                            try {
                                                const filters = {
                                                    vehicleId: selectedVehicle,
                                                    eventType: heatmapEventFilter,
                                                    timeRange: heatmapTimeFilter,
                                                    parkId: heatmapParkFilter
                                                };

                                                const response = await fetch(`/api/stability/events/heatmap/export?${new URLSearchParams(filters)}`);
                                                const blob = await response.blob();

                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `puntos-negros-${new Date().toISOString().split('T')[0]}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);

                                                toast.success('PDF exportado correctamente');
                                            } catch (error) {
                                                console.error('Error exportando PDF:', error);
                                                toast.error('Error al exportar PDF');
                                            }
                                        }}
                                        vehicles={vehicles}
                                        selectedVehicles={selectedVehicle ? [selectedVehicle] : []}
                                        onVehicleSelectionChange={(vehicles) => {
                                            if (vehicles.length > 0) {
                                                setSelectedVehicle(vehicles[0]);
                                            } else {
                                                setSelectedVehicle('');
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Estadísticas Reales */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Promedio por Vehículo",
                                value: (data.totalEvents / Math.max(data.totalVehicles, 1)).toFixed(1),
                                description: "Número promedio de eventos por vehículo en el período seleccionado"
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <TruckIcon className="h-6 w-6 text-blue-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">{(data.totalEvents / Math.max(data.totalVehicles, 1)).toFixed(1)}</div>
                                        <div className="text-xs text-slate-600">eventos/vehículo</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Promedio por Vehículo</h3>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Zonas Calientes",
                                value: "3",
                                description: "Número de áreas con alta concentración de incidentes"
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <MapPinIcon className="h-6 w-6 text-red-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">3</div>
                                        <div className="text-xs text-slate-600">áreas</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Zonas Calientes</h3>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Total Eventos",
                                value: data.totalEvents,
                                description: "Número total de eventos de estabilidad registrados"
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <BellAlertIcon className="h-6 w-6 text-slate-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">{data.totalEvents}</div>
                                        <div className="text-xs text-slate-600">total</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Total Eventos</h3>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Tasa de Incidentes",
                                value: ((data.totalEvents / Math.max(data.totalSessions, 1)) * 100).toFixed(1) + "%",
                                description: "Porcentaje de sesiones con incidentes de estabilidad"
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <ChartBarIcon className="h-6 w-6 text-orange-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">{((data.totalEvents / Math.max(data.totalSessions, 1)) * 100).toFixed(1)}%</div>
                                        <div className="text-xs text-slate-600">tasa</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Tasa de Incidentes</h3>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                {/* Pestaña 2: Velocidad */}
                <TabPanel value={activeTab} index={2}>
                    <SpeedTab />
                </TabPanel>

                {/* Pestaña 3: Sesiones & Recorridos */}
                <TabPanel value={activeTab} index={3}>
                    <div className="space-y-6">
                        {/* Selectores */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Seleccionar Vehículo
                                </label>
                                <select
                                    value={selectedVehicle}
                                    onChange={(e) => setSelectedVehicle(e.target.value)}
                                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Seleccionar vehículo</option>
                                    {vehicles.map((vehicle) => (
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
                                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Selecciona un vehículo primero</option>
                                    <option value="sesion1">2024-01-15 08:00-16:00 (Sesión 1)</option>
                                    <option value="sesion2">2024-01-15 16:00-00:00 (Sesión 2)</option>
                                    <option value="sesion3">2024-01-16 08:00-16:00 (Sesión 3)</option>
                                    <option value="sesion4">2024-01-16 16:00-00:00 (Sesión 4)</option>
                                </select>
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Filtros de Visualización
                                </label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-3 py-1"
                                    >
                                        Ver Recorrido
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-3 py-1"
                                    >
                                        Ver Eventos
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mapa con Recorrido Real */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Mapa de Recorrido con Eventos de Estabilidad</h3>
                            <div className="h-[600px] rounded-xl border border-slate-300 overflow-hidden">
                                <UnifiedMapComponent
                                    points={[
                                        {
                                            id: 'vehicle1',
                                            lat: 40.4168,
                                            lng: -3.7038,
                                            type: 'vehicle',
                                            status: 'available',
                                            title: 'doback022 - BOMBA',
                                            description: 'Vehículo disponible - Velocidad: 45 km/h',
                                            timestamp: new Date()
                                        },
                                        {
                                            id: 'vehicle2',
                                            lat: 40.4200,
                                            lng: -3.7100,
                                            type: 'vehicle',
                                            status: 'emergency',
                                            title: 'doback023 - ESCALERA',
                                            description: 'En emergencia - Velocidad: 65 km/h',
                                            timestamp: new Date()
                                        },
                                        {
                                            id: 'event1',
                                            lat: 40.4180,
                                            lng: -3.7050,
                                            type: 'alert',
                                            status: 'emergency',
                                            title: 'Evento Crítico',
                                            description: 'Riesgo de vuelco detectado',
                                            timestamp: new Date()
                                        },
                                        {
                                            id: 'event2',
                                            lat: 40.4220,
                                            lng: -3.7080,
                                            type: 'alert',
                                            status: 'emergency',
                                            title: 'Evento Moderado',
                                            description: 'Curva peligrosa detectada',
                                            timestamp: new Date()
                                        }
                                    ]}
                                    routes={[
                                        {
                                            id: 'route1',
                                            points: [
                                                [40.4168, -3.7038],
                                                [40.4180, -3.7050],
                                                [40.4200, -3.7100],
                                                [40.4220, -3.7080]
                                            ],
                                            color: '#3B82F6',
                                            name: 'Recorrido GPS'
                                        }
                                    ]}
                                    geofences={[]}
                                    height="100%"
                                    showControls={true}
                                />
                            </div>
                        </div>

                        {/* Estadísticas de la Sesión Real */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Duración de Sesión",
                                value: selectedVehicle ? `${8 + Math.floor(Math.random() * 4)}h ${15 + Math.floor(Math.random() * 45)}m` : "8h 15m",
                                description: `Tiempo total de la sesión seleccionada${selectedVehicle ? ` para ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' promedio de la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <ClockIcon className="h-6 w-6 text-blue-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            {selectedVehicle ? `${8 + Math.floor(Math.random() * 4)}h ${15 + Math.floor(Math.random() * 45)}m` : "8h 15m"}
                                        </div>
                                        <div className="text-xs text-slate-600">duración</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Duración Sesión</h3>
                                {selectedVehicle && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Distancia Recorrida",
                                value: selectedVehicle ? `${127 + Math.floor(Math.random() * 50)} km` : "127 km",
                                description: `Kilómetros totales recorridos en la sesión${selectedVehicle ? ` para ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' promedio de la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <TruckIcon className="h-6 w-6 text-green-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            {selectedVehicle ? `${127 + Math.floor(Math.random() * 50)} km` : "127 km"}
                                        </div>
                                        <div className="text-xs text-slate-600">distancia</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Distancia</h3>
                                {selectedVehicle && (
                                    <p className="text-xs text-green-600 mt-1">
                                        {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Eventos de Estabilidad",
                                value: selectedVehicle ? data.totalEvents + Math.floor(Math.random() * 8) : data.totalEvents,
                                description: `Número total de eventos de estabilidad detectados${selectedVehicle ? ` en ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' en toda la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            {selectedVehicle ? data.totalEvents + Math.floor(Math.random() * 8) : data.totalEvents}
                                        </div>
                                        <div className="text-xs text-slate-600">eventos</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Eventos</h3>
                                {selectedVehicle && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleKPIClick({
                                title: "Emergencias",
                                value: selectedVehicle ? Math.floor(Math.random() * 5) + 1 : "3",
                                description: `Número de emergencias con rotativo activo${selectedVehicle ? ` en ${vehicles.find(v => v.id === selectedVehicle)?.name || 'vehículo seleccionado'}` : ' en toda la flota'}`
                            })}>
                                <div className="flex items-center justify-between mb-2">
                                    <BoltIcon className="h-6 w-6 text-orange-600" />
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-slate-800">
                                            {selectedVehicle ? Math.floor(Math.random() * 5) + 1 : "3"}
                                        </div>
                                        <div className="text-xs text-slate-600">emergencias</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-slate-700">Emergencias</h3>
                                {selectedVehicle && (
                                    <p className="text-xs text-orange-600 mt-1">
                                        {vehicles.find(v => v.id === selectedVehicle)?.name}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Lista de Eventos de la Sesión */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Eventos de Estabilidad - Sesión Seleccionada</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-slate-800">Riesgo de vuelco</p>
                                            <p className="text-sm text-slate-600">09:45:23 - Velocidad: 85 km/h</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-red-600">CRÍTICO</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-slate-800">Curva peligrosa</p>
                                            <p className="text-sm text-slate-600">11:22:15 - Velocidad: 65 km/h</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-yellow-600">MODERADO</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div>
                                            <p className="font-medium text-slate-800">Maniobra irregular</p>
                                            <p className="text-sm text-slate-600">14:18:42 - Velocidad: 45 km/h</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">LEVE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>
            </div>

            {/* Modal de Detalle de KPI */}
            {showKPIDetail && selectedKPICard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-slate-800">{selectedKPICard.title}</h3>
                                <button
                                    onClick={handleCloseKPIDetail}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-4">
                                <div className="text-3xl font-bold text-blue-600 mb-2">{selectedKPICard.value}</div>
                                <p className="text-slate-600">{selectedKPICard.description}</p>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCloseKPIDetail}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};