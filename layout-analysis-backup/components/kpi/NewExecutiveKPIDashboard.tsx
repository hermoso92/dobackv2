import {
    ChartBarIcon,
    ClockIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    MapIcon,
    PowerIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertSystemManager } from '../alerts/AlertSystemManager';
import GlobalFiltersBar from '../filters/GlobalFiltersBar';
import { AdvancedSpeedAnalysisMap } from '../maps/AdvancedSpeedAnalysisMap';
import { EnhancedHeatmapMap } from '../maps/EnhancedHeatmapMap';
import { ProcessingTrackingDashboard } from '../processing/ProcessingTrackingDashboard';
import { SessionsAndRoutesView } from '../sessions/SessionsAndRoutesView';
import { Button } from '../ui/Button';

// Componente de tarjeta KPI optimizado para TV Wall
const KPICard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    description?: string;
    onClick?: () => void;
    variant?: 'default' | 'critical' | 'warning' | 'success';
}> = ({ title, value, unit, icon, description, onClick, variant = 'default' }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'critical':
                return 'bg-red-50 border-red-200 hover:bg-red-100';
            case 'warning':
                return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
            case 'success':
                return 'bg-green-50 border-green-200 hover:bg-green-100';
            default:
                return 'bg-white border-slate-200 hover:bg-slate-50';
        }
    };

    return (
        <div
            className={`${getVariantStyles()} p-3 rounded-lg shadow-sm border transition-all cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                        {icon}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-600">{title}</p>
                        <p className="text-lg font-bold text-slate-900">
                            {value}
                            {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
                        </p>
                    </div>
                </div>
            </div>
            {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
    );
};

// Componente principal del dashboard TV Wall
export const NewExecutiveKPIDashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Estados para mapas
    const [heatmapData, setHeatmapData] = useState<any>({ points: [], routes: [], geofences: [] });
    const [speedViolations, setSpeedViolations] = useState<any[]>([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            // Simular carga de datos para TV Wall
            await new Promise(resolve => setTimeout(resolve, 1000));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos del heatmap (Puntos Negros)
    const fetchHeatmapData = useCallback(async () => {
        try {
            setMapLoading(true);
            setMapError(null);

            // Simular datos de puntos negros
            const mockHeatmapData = {
                points: [
                    {
                        id: '1',
                        lat: 40.4168,
                        lng: -3.7038,
                        intensity: 0.8,
                        timestamp: new Date().toISOString(),
                        vehicleId: 'DOBACK023',
                        vehicleName: 'DOBACK023',
                        eventType: 'CURVA_PELIGROSA',
                        severity: 'critical' as const,
                        speed: 65,
                        speedLimit: 50,
                        rotativo: true,
                        roadType: 'urban',
                        location: 'Madrid Centro'
                    },
                    {
                        id: '2',
                        lat: 40.4178,
                        lng: -3.7048,
                        intensity: 0.6,
                        timestamp: new Date().toISOString(),
                        vehicleId: 'DOBACK027',
                        vehicleName: 'DOBACK027',
                        eventType: 'FRENADA_BRUSCA',
                        severity: 'warning' as const,
                        speed: 45,
                        speedLimit: 50,
                        rotativo: false,
                        roadType: 'urban',
                        location: 'Madrid Centro'
                    }
                ],
                routes: [],
                geofences: []
            };

            setHeatmapData(mockHeatmapData);
        } catch (err) {
            setMapError(err instanceof Error ? err.message : 'Error cargando datos del heatmap');
            console.error('Error fetching heatmap data:', err);
        } finally {
            setMapLoading(false);
        }
    }, []);

    // Cargar datos de violaciones de velocidad
    const fetchSpeedViolations = useCallback(async () => {
        try {
            // Simular datos de violaciones de velocidad
            const mockSpeedViolations = [
                {
                    id: '1',
                    lat: 40.4168,
                    lng: -3.7038,
                    speed: 85,
                    speedLimit: 50,
                    timestamp: new Date().toISOString(),
                    vehicleId: 'DOBACK023',
                    vehicleName: 'DOBACK023',
                    violationType: 'grave' as const,
                    roadType: 'urban' as const,
                    rotativoOn: true,
                    location: 'Madrid Centro'
                }
            ];

            setSpeedViolations(mockSpeedViolations);
        } catch (err) {
            console.error('Error fetching speed violations:', err);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Cargar datos específicos según la pestaña activa
    useEffect(() => {
        if (activeTab === 1) {
            fetchHeatmapData();
        } else if (activeTab === 2) {
            fetchSpeedViolations();
        }
    }, [activeTab, fetchHeatmapData, fetchSpeedViolations]);

    // Renderizar contenido de Estados & Tiempos optimizado para TV Wall
    const renderEstadosTiempos = () => (
        <div className="h-full w-full bg-slate-50 p-2">
            {/* Grid de KPIs optimizado para TV Wall */}
            <div className="grid grid-cols-4 gap-2 h-full">
                {/* Primera fila - Métricas principales */}
                <KPICard
                    title="Horas de Conducción"
                    value="00:00"
                    icon={<ClockIcon className="h-4 w-4 text-blue-600" />}
                    description="Tiempo total de conducción en el período"
                />
                <KPICard
                    title="Kilómetros Recorridos"
                    value="0 km"
                    icon={<TruckIcon className="h-4 w-4 text-green-600" />}
                    description="Distancia total recorrida"
                />
                <KPICard
                    title="Tiempo en Parque"
                    value="00:00"
                    icon={<MapIcon className="h-4 w-4 text-purple-600" />}
                    description="Tiempo total en parque"
                />
                <KPICard
                    title="% Rotativo"
                    value="0%"
                    icon={<PowerIcon className="h-4 w-4 text-orange-600" />}
                    description="Porcentaje de tiempo con rotativo"
                />

                {/* Segunda fila - Estados operativos */}
                <KPICard
                    title="Tiempo Fuera Parque"
                    value="00:00"
                    icon={<TruckIcon className="h-4 w-4 text-orange-600" />}
                    description="Tiempo en servicio externo"
                />
                <KPICard
                    title="Tiempo en Taller"
                    value="00:00"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-red-600" />}
                    description="Tiempo en mantenimiento"
                />
                <KPICard
                    title="Tiempo Clave 2"
                    value="00:00"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-red-600" />}
                    description="Emergencias con rotativo"
                />
                <KPICard
                    title="Tiempo Clave 5"
                    value="00:00"
                    icon={<ClockIcon className="h-4 w-4 text-orange-600" />}
                    description="Servicios sin rotativo"
                />

                {/* Tercera fila - Incidencias */}
                <KPICard
                    title="Total Incidencias"
                    value="0"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-red-600" />}
                    description="Total de incidencias registradas"
                    variant="critical"
                />
                <KPICard
                    title="Incidencias Graves"
                    value="0"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-red-600" />}
                    description="Incidencias de alta severidad"
                    variant="critical"
                />
                <KPICard
                    title="Incidencias Moderadas"
                    value="0"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />}
                    description="Incidencias de severidad media"
                    variant="warning"
                />
                <KPICard
                    title="Incidencias Leves"
                    value="0"
                    icon={<ExclamationTriangleIcon className="h-4 w-4 text-green-600" />}
                    description="Incidencias de baja severidad"
                    variant="success"
                />

                {/* Cuarta fila - Excesos */}
                <KPICard
                    title="Excesos con Rotativo"
                    value="0"
                    icon={<ChartBarIcon className="h-4 w-4 text-blue-600" />}
                    description="Excesos de velocidad con rotativo"
                />
                <KPICard
                    title="Excesos sin Rotativo"
                    value="0"
                    icon={<ChartBarIcon className="h-4 w-4 text-blue-600" />}
                    description="Excesos de velocidad sin rotativo"
                />
                <KPICard
                    title="Velocidad Promedio"
                    value="0 km/h"
                    icon={<ChartBarIcon className="h-4 w-4 text-blue-600" />}
                    description="Velocidad promedio del período"
                />
                <KPICard
                    title="Velocidad Máxima"
                    value="0 km/h"
                    icon={<ChartBarIcon className="h-4 w-4 text-blue-600" />}
                    description="Velocidad máxima registrada"
                />
            </div>
        </div>
    );

    // Pestañas del dashboard
    const tabs = [
        { label: 'Estados & Tiempos', icon: <ClockIcon className="h-4 w-4" /> },
        { label: 'Puntos Negros', icon: <MapIcon className="h-4 w-4" /> },
        { label: 'Velocidad', icon: <ChartBarIcon className="h-4 w-4" /> },
        { label: 'Sesiones & Recorridos', icon: <TruckIcon className="h-4 w-4" /> },
        { label: 'Sistema de Alertas', icon: <ExclamationTriangleIcon className="h-4 w-4" /> },
        { label: 'Tracking de Procesamiento', icon: <CpuChipIcon className="h-4 w-4" /> }
    ];

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto" />
                    <p className="mt-4 text-red-600">Error: {error}</p>
                    <Button
                        onClick={fetchDashboardData}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                    >
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            {/* Filtros globales */}
            <div className="filters-container">
                <GlobalFiltersBar />
            </div>

            {/* Pestañas del dashboard */}
            <div className="tabs-container">
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2 h-full">
                    <div className="flex space-x-1">
                        {tabs.map((tab, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTab(index)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === index
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <ChartBarIcon className="h-4 w-4" />
                        EXPORTAR PDF
                    </Button>
                </div>
            </div>

            {/* Contenido del dashboard */}
            <div className="dashboard-content">
                {activeTab === 0 && renderEstadosTiempos()}
                {activeTab === 1 && (
                    <div className="h-full w-full bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Puntos Negros - Análisis de Estabilidad</h3>
                        <EnhancedHeatmapMap
                            data={heatmapData}
                            loading={mapLoading}
                            error={mapError || undefined}
                            onPointClick={(point) => {
                                console.log('Punto seleccionado:', point);
                            }}
                            height="calc(100vh - 200px)"
                            center={[40.4168, -3.7038]}
                            zoom={11}
                        />
                    </div>
                )}
                {activeTab === 2 && (
                    <div className="h-full w-full bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Análisis de Velocidad</h3>
                        <AdvancedSpeedAnalysisMap
                            violations={speedViolations}
                            loading={mapLoading}
                            error={mapError || undefined}
                            onViolationClick={(violation) => {
                                console.log('Violación seleccionada:', violation);
                            }}
                            height="calc(100vh - 200px)"
                            center={[40.4168, -3.7038]}
                            zoom={11}
                        />
                    </div>
                )}
                {activeTab === 3 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <SessionsAndRoutesView />
                    </div>
                )}
                {activeTab === 4 && (
                    <div className="h-full w-full bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Sistema de Alertas</h3>
                        <AlertSystemManager />
                    </div>
                )}
                {activeTab === 5 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tracking de Procesamiento de Archivos</h3>
                            <ProcessingTrackingDashboard
                                autoRefresh={true}
                                refreshInterval={30000}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};