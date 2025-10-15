import {
    ChartBarIcon,
    ClockIcon,
    CpuChipIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    MapIcon,
    PowerIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { getOrganizationId } from '../../config/organization';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { useKPIs } from '../../hooks/useKPIs';
import { usePDFExport } from '../../hooks/usePDFExport';
import { apiService } from '../../services/api';
import { TabExportData } from '../../services/pdfExportService';
import { logger } from '../../utils/logger';
import { AlertSystemManager } from '../alerts/AlertSystemManager';
import DiagnosticPanel from '../DiagnosticPanel';
import GlobalFiltersBar from '../filters/GlobalFiltersBar';
import OperationalKeysTab from '../operations/OperationalKeysTab';
import DeviceMonitoringPanel from '../panel/DeviceMonitoringPanel';
import { ProcessingTrackingDashboard } from '../processing/ProcessingTrackingDashboard';
import { DashboardReportsTab } from '../reports/DashboardReportsTab';
import { SessionsAndRoutesView } from '../sessions/SessionsAndRoutesView';
import SpeedAnalysisTab from '../speed/SpeedAnalysisTab';
import BlackSpotsTab from '../stability/BlackSpotsTab';
import { Button } from '../ui/Button';

// Componente de tarjeta KPI (estilo original)
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
        className={`bg-white p-3 rounded-lg border border-slate-200 hover:shadow-lg transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${colorClass.includes('red') ? 'bg-red-50 text-red-600' :
                colorClass.includes('green') ? 'bg-green-50 text-green-600' :
                    colorClass.includes('blue') ? 'bg-blue-50 text-blue-600' :
                        colorClass.includes('orange') ? 'bg-orange-50 text-orange-600' :
                            'bg-slate-50 text-slate-600'}`}>
                {icon}
            </div>
            <div className="text-right">
                <p className={`text-xl font-bold ${colorClass}`}>
                    {value}
                </p>
                {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
            </div>
        </div>
        <h3 className="text-xs font-semibold text-slate-700">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
);

// Componente principal del dashboard TV Wall
export const NewExecutiveKPIDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Estados para mapas (mantenidos para exportación PDF)
    const [heatmapData, setHeatmapData] = useState<any>({ points: [], routes: [], geofences: [] });
    const [speedViolations, setSpeedViolations] = useState<any[]>([]);

    // Estados para KPIs de Parques
    const [parksKPIs, setParksKPIs] = useState<any>({
        vehiclesInParks: 0,
        vehiclesOutOfParks: 0,
        averageTimeOutside: 0,
        parkEntriesToday: 0,
        parkExitsToday: 0,
        parksData: []
    });
    // const [mapLoading, setMapLoading] = useState(false);
    // const [mapError, setMapError] = useState<string | null>(null);

    // Hook de exportación de PDF
    const { exportTabToPDF, isExporting, captureElement } = usePDFExport();

    // Hook de filtros globales
    const { filters, updateTrigger } = useGlobalFilters();

    // Hook de KPIs reales
    const {
        getStateDuration,
        states,
        activity,
        stability,
        quality // AÑADIDO: Índice de estabilidad
    } = useKPIs();

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            // Cargar KPIs de Parques (DESACTIVADO - endpoints no existen en backend-final.js)
            // await fetchParksKPIs();

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

    // Función para cargar KPIs de Parques
    const fetchParksKPIs = useCallback(async () => {
        try {
            const [parksResponse, vehiclesResponse, geofenceEventsResponse] = await Promise.all([
                apiService.get<{ success: boolean; data: any[] }>('/api/parks'),
                apiService.get<{ success: boolean; data: any[] }>('/api/vehicles'),
                apiService.get<{ success: boolean; data: any[] }>('/api/geofences/events?today=true')
            ]);

            if (parksResponse.data?.success && vehiclesResponse.data?.success && geofenceEventsResponse.data?.success) {
                const parks = parksResponse.data.data;
                const vehicles = vehiclesResponse.data.data;
                const geofenceEvents = geofenceEventsResponse.data.data || [];

                // Calcular KPIs
                const vehiclesInParks = vehicles.filter(v => v.parkId).length;
                const vehiclesOutOfParks = vehicles.filter(v => !v.parkId).length;

                // Calcular eventos de entrada/salida de hoy
                const today = new Date().toISOString().split('T')[0];
                const todayEvents = geofenceEvents.filter(event =>
                    event.timestamp.startsWith(today)
                );

                const parkEntriesToday = todayEvents.filter(event => event.event_type === 'ENTER').length;
                const parkExitsToday = todayEvents.filter(event => event.event_type === 'EXIT').length;

                // Calcular tiempo promedio fuera del parque (simulado)
                const averageTimeOutside = 2.5; // horas

                // Datos por parque
                const parksData = parks.map(park => {
                    const parkVehicles = vehicles.filter(v => v.parkId === park.id);
                    const parkEvents = todayEvents.filter(event =>
                        event.geofence?.name?.includes(park.name)
                    );

                    return {
                        id: park.id,
                        name: park.name,
                        vehiclesCount: parkVehicles.length,
                        entriesToday: parkEvents.filter(e => e.event_type === 'ENTER').length,
                        exitsToday: parkEvents.filter(e => e.event_type === 'EXIT').length
                    };
                });

                setParksKPIs({
                    vehiclesInParks,
                    vehiclesOutOfParks,
                    averageTimeOutside,
                    parkEntriesToday,
                    parkExitsToday,
                    parksData
                });

                logger.info('KPIs de Parques cargados:', {
                    vehiclesInParks,
                    vehiclesOutOfParks,
                    parkEntriesToday,
                    parkExitsToday
                });
            }
        } catch (err) {
            logger.error('Error cargando KPIs de Parques:', err);
        }
    }, []);

    // Cargar datos del heatmap (Puntos Negros) desde API real
    const fetchHeatmapData = useCallback(async () => {
        try {
            const orgId = getOrganizationId(user?.organizationId);
            const params = new URLSearchParams();
            if (orgId) params.append('organizationId', orgId);
            if (filters.vehicles && filters.vehicles.length > 0) {
                params.append('vehicleIds', filters.vehicles.join(','));
            }
            if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
            if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);
            params.append('severity', 'all');
            params.append('rotativoOn', 'all');
            params.append('clusterRadius', '20');
            params.append('minFrequency', '1');

            const response = await apiService.get<{ success: boolean; data: { clusters: any[] } }>(
                `/api/hotspots/critical-points?${params.toString()}`
            );

            if (response.data && response.data.success && response.data.data?.clusters) {
                const clusters = response.data.data.clusters;

                // Aplanar eventos de clusters a puntos del heatmap
                const points: any[] = [];
                clusters.forEach((cluster: any) => {
                    (cluster.events || []).forEach((event: any, idx: number) => {
                        const sev = event.severity || 'leve';
                        const intensity = sev === 'grave' ? 0.9 : sev === 'moderada' ? 0.6 : 0.3;
                        points.push({
                            id: `${cluster.id}-${idx}`,
                            lat: event.lat,
                            lng: event.lng,
                            intensity,
                            timestamp: event.timestamp,
                            vehicleId: event.vehicleId,
                            vehicleName: event.vehicleName || event.vehicleId,
                            eventType: event.eventType,
                            severity: sev,
                            speed: event.speed || 0,
                            speedLimit: event.speedLimit || 0,
                            rotativo: event.rotativo || false,
                            roadType: event.roadType || 'urban',
                            location: event.location || `${event.lat?.toFixed(4)}, ${event.lng?.toFixed(4)}`
                        });
                    });
                });

                setHeatmapData({ points, routes: [], geofences: [] });
            } else {
                setHeatmapData({ points: [], routes: [], geofences: [] });
            }
        } catch (err) {
            console.error('Error fetching heatmap data:', err);
            setHeatmapData({ points: [], routes: [], geofences: [] });
        }
    }, [user?.organizationId, filters.vehicles, filters.dateRange?.start, filters.dateRange?.end]);

    // Cargar datos de violaciones de velocidad desde API real
    const fetchSpeedViolations = useCallback(async () => {
        try {
            const orgId = getOrganizationId(user?.organizationId);
            const params = new URLSearchParams();
            if (orgId) params.append('organizationId', orgId);
            if (filters.vehicles && filters.vehicles.length > 0) {
                params.append('vehicleIds', filters.vehicles.join(','));
            }
            if (filters.dateRange?.start) params.append('startDate', filters.dateRange.start);
            if (filters.dateRange?.end) params.append('endDate', filters.dateRange.end);
            params.append('rotativoOn', 'all');
            params.append('violationType', 'all');
            params.append('inPark', 'all');
            params.append('minSpeed', '0');

            const response = await apiService.get<{ success: boolean; data: { violations: any[] } }>(
                `/api/speed/violations?${params.toString()}`
            );

            if (response.data && response.data.success && response.data.data?.violations) {
                const violations = response.data.data.violations.map((v: any) => ({
                    id: v.id,
                    lat: v.lat,
                    lng: v.lng,
                    speed: v.speed,
                    speedLimit: v.speedLimit,
                    timestamp: v.timestamp,
                    vehicleId: v.vehicleId,
                    vehicleName: v.vehicleName || v.vehicleId,
                    violationType: v.violationType,
                    roadType: v.roadType,
                    rotativoOn: v.rotativoOn,
                    location: `${(v.lat ?? 0).toFixed(4)}, ${(v.lng ?? 0).toFixed(4)}`
                }));

                setSpeedViolations(violations);
            } else {
                setSpeedViolations([]);
            }
        } catch (err) {
            console.error('Error fetching speed violations:', err);
            setSpeedViolations([]);
        }
    }, [user?.organizationId, filters.vehicles, filters.dateRange?.start, filters.dateRange?.end]);

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

    // Función para exportar la pestaña actual a PDF
    const handleExportPDF = useCallback(async () => {
        try {
            logger.info('Iniciando exportación de PDF', { activeTab, filters });

            // Preparar filtros aplicados para incluir en el PDF
            const appliedFilters = {
                vehicles: filters.vehicles && filters.vehicles.length > 0
                    ? `${filters.vehicles.length} vehículo(s) seleccionado(s)`
                    : 'Todos los vehículos',
                dateRange: filters.dateRange && filters.dateRange.start
                    ? `${filters.dateRange.start} a ${filters.dateRange.end || 'Hoy'}`
                    : 'Todo el período',
                rotativo: filters.rotativo !== 'all'
                    ? `Rotativo: ${filters.rotativo.toUpperCase()}`
                    : 'Rotativo: Todos',
                severity: filters.severity && filters.severity.length < 3
                    ? `Severidad: ${filters.severity.join(', ')}`
                    : 'Severidad: Todas'
            };

            // Preparar datos según la pestaña activa
            let exportData: TabExportData;

            switch (activeTab) {
                case 0: // Estados & Tiempos
                    exportData = {
                        tabName: 'Estados & Tiempos',
                        tabIndex: 0,
                        appliedFilters,
                        kpis: [
                            { title: 'Horas de Conducción', value: '00:00', subtitle: 'Tiempo total de conducción en el período' },
                            { title: 'Kilómetros Recorridos', value: '0 km', subtitle: 'Distancia total recorrida' },
                            { title: 'Tiempo en Parque', value: '00:00', subtitle: 'Tiempo total en parque' },
                            { title: '% Rotativo', value: '0%', subtitle: 'Porcentaje de tiempo con rotativo' },
                            { title: 'Tiempo Fuera Parque', value: '00:00', subtitle: 'Tiempo en servicio externo' },
                            { title: 'Tiempo en Taller', value: '00:00', subtitle: 'Tiempo en mantenimiento' },
                            { title: 'Tiempo Clave 2', value: '00:00', subtitle: 'Emergencias con rotativo' },
                            { title: 'Tiempo Clave 5', value: '00:00', subtitle: 'Servicios sin rotativo' },
                            { title: 'Total Incidencias', value: '0', subtitle: 'Total de incidencias registradas' },
                            { title: 'Incidencias Graves', value: '0', subtitle: 'Incidencias de alta severidad' },
                            { title: 'Incidencias Moderadas', value: '0', subtitle: 'Incidencias de severidad media' },
                            { title: 'Incidencias Leves', value: '0', subtitle: 'Incidencias de baja severidad' },
                            { title: 'Excesos con Rotativo', value: '0', subtitle: 'Excesos de velocidad con rotativo' },
                            { title: 'Excesos sin Rotativo', value: '0', subtitle: 'Excesos de velocidad sin rotativo' },
                            { title: 'Velocidad Promedio', value: '0 km/h', subtitle: 'Velocidad promedio del período' },
                            { title: 'Velocidad Máxima', value: '0 km/h', subtitle: 'Velocidad máxima registrada' }
                        ]
                    };
                    break;

                case 1: // Puntos Negros
                    const heatmapImage = await captureElement('heatmap-container');
                    exportData = {
                        tabName: 'Puntos Negros - Mapa de Calor',
                        tabIndex: 1,
                        appliedFilters,
                        kpis: [
                            { title: 'Eventos Graves', value: heatmapData.points.filter((p: any) => p.severity === 'critical').length, subtitle: '0-20% estabilidad' },
                            { title: 'Eventos Moderados', value: heatmapData.points.filter((p: any) => p.severity === 'severe').length, subtitle: '20-35% estabilidad' },
                            { title: 'Eventos Leves', value: heatmapData.points.filter((p: any) => p.severity === 'light').length, subtitle: '35-50% estabilidad' },
                            { title: 'Total de Puntos', value: heatmapData.points.length, subtitle: 'Total de eventos registrados' }
                        ],
                        mapData: {
                            type: 'heatmap',
                            center: [40.5149, -3.7578],
                            zoom: 12,
                            points: heatmapData.points,
                            image: heatmapImage || undefined
                        }
                    };
                    break;

                case 2: // Velocidad
                    const speedMapImage = await captureElement('speed-map-container');
                    exportData = {
                        tabName: 'Análisis de Velocidad',
                        tabIndex: 2,
                        appliedFilters,
                        kpis: [
                            {
                                title: 'Excesos Vel. (Rotativo ON)',
                                value: speedViolations.filter((v: any) => v.rotativo).length,
                                unit: 'eventos',
                                subtitle: 'Emergencias con exceso de velocidad'
                            },
                            {
                                title: 'Excesos Vel. (Rotativo OFF)',
                                value: speedViolations.filter((v: any) => !v.rotativo).length,
                                unit: 'eventos',
                                subtitle: 'Servicios con exceso de velocidad'
                            },
                            { title: 'Total Excesos', value: speedViolations.length, unit: 'eventos', subtitle: 'Total de excesos registrados' }
                        ],
                        mapData: {
                            type: 'speed',
                            center: [40.5149, -3.7578],
                            zoom: 12,
                            points: speedViolations,
                            image: speedMapImage || undefined
                        }
                    };
                    break;

                case 3: // Sesiones & Recorridos
                    exportData = {
                        tabName: 'Sesiones & Recorridos',
                        tabIndex: 3,
                        kpis: [
                            { title: 'Total Sesiones', value: '0', subtitle: 'Sesiones registradas en el período' },
                            { title: 'Sesiones Completas', value: '0', subtitle: 'Sesiones con datos completos' },
                            { title: 'Km Totales', value: '0 km', subtitle: 'Distancia total recorrida' }
                        ]
                    };
                    break;

                case 4: // Sistema de Alertas
                    exportData = {
                        tabName: 'Sistema de Alertas',
                        tabIndex: 4,
                        kpis: [
                            { title: 'Alertas Activas', value: '0', subtitle: 'Alertas sin resolver' },
                            { title: 'Alertas Resueltas', value: '0', subtitle: 'Alertas cerradas' },
                            { title: 'Alertas Críticas', value: '0', subtitle: 'Alertas de alta prioridad' }
                        ]
                    };
                    break;

                case 5: // Tracking de Procesamiento
                    exportData = {
                        tabName: 'Tracking de Procesamiento',
                        tabIndex: 5,
                        kpis: [
                            { title: 'Archivos Procesados', value: '0', subtitle: 'Total de archivos procesados' },
                            { title: 'Archivos Pendientes', value: '0', subtitle: 'Archivos en cola' },
                            { title: 'Archivos con Error', value: '0', subtitle: 'Archivos fallidos' }
                        ]
                    };
                    break;

                case 6: // Reportes
                    exportData = {
                        tabName: 'Reportes Generados',
                        tabIndex: 6,
                        kpis: [
                            { title: 'Reportes Totales', value: '0', subtitle: 'Total de reportes generados' },
                            { title: 'Reportes Disponibles', value: '0', subtitle: 'Reportes listos para descargar' },
                            { title: 'Reportes Generando', value: '0', subtitle: 'Reportes en proceso' }
                        ]
                    };
                    break;

                case 7: // Alertas de Geocercas
                    exportData = {
                        tabName: 'Alertas de Geocercas',
                        tabIndex: 7,
                        kpis: [
                            { title: 'Vehículos en Parques', value: parksKPIs.vehiclesInParks, subtitle: 'Vehículos actualmente en parques' },
                            { title: 'Vehículos Fuera', value: parksKPIs.vehiclesOutOfParks, subtitle: 'Vehículos fuera de parques' },
                            { title: 'Entradas Hoy', value: parksKPIs.parkEntriesToday, subtitle: 'Entradas a parques hoy' },
                            { title: 'Salidas Hoy', value: parksKPIs.parkExitsToday, subtitle: 'Salidas de parques hoy' }
                        ]
                    };
                    break;

                default:
                    return;
            }

            // Exportar a PDF
            await exportTabToPDF(exportData);

            logger.info('PDF exportado exitosamente', { tabName: exportData.tabName });
        } catch (error) {
            logger.error('Error exportando PDF', { error });
            alert('Error al exportar PDF. Por favor, inténtelo de nuevo.');
        }
    }, [activeTab, heatmapData, speedViolations, exportTabToPDF, captureElement, filters]);

    // Renderizar contenido de Estados & Tiempos
    const renderEstadosTiempos = () => {
        // Calcular velocidad promedio
        // CORREGIDO: Validar que driving_hours sea razonable para evitar velocidades imposibles
        const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
            ? Math.round(activity.km_total / activity.driving_hours)
            : 0;

        return (
            <div className="h-full w-full bg-white p-6" id="estados-tiempos-content">
                {/* Grid de KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3" id="estados-tiempos-kpis">
                    {/* Primera fila - Métricas principales */}
                    <KPICard
                        title="Horas de Conducción"
                        value={activity?.driving_hours_formatted || '00:00:00'}
                        icon={<ClockIcon className="h-5 w-5" />}
                        colorClass="text-blue-600"
                        subtitle="Tiempo total de conducción en el período"
                    />
                    <KPICard
                        title="Kilómetros Recorridos"
                        value={`${activity?.km_total || 0} km`}
                        icon={<TruckIcon className="h-5 w-5" />}
                        colorClass="text-green-600"
                        subtitle="Distancia total recorrida"
                    />
                    <KPICard
                        title="Tiempo en Parque"
                        value={getStateDuration(1)}
                        icon={<MapIcon className="h-5 w-5" />}
                        colorClass="text-slate-600"
                        subtitle="Tiempo total en parque (Clave 1)"
                    />
                    <KPICard
                        title="% Rotativo"
                        value={`${activity?.rotativo_on_percentage || 0}%`}
                        icon={<PowerIcon className="h-5 w-5" />}
                        colorClass="text-orange-600"
                        subtitle="Porcentaje de tiempo con rotativo"
                    />

                    {/* AÑADIDO: Índice de Estabilidad */}
                    <KPICard
                        title="Índice de Estabilidad (SI)"
                        value={`${(((quality?.indice_promedio || 0)) * 100).toFixed(1)}%`}
                        icon={<ChartBarIcon className="h-5 w-5" />}
                        colorClass={
                            (quality?.indice_promedio || 0) >= 0.90 ? "text-green-600" :
                                (quality?.indice_promedio || 0) >= 0.88 ? "text-yellow-600" :
                                    "text-red-600"
                        }
                        subtitle={`${quality?.calificacion || 'N/A'} ${quality?.estrellas || ''}`}
                    />

                    {/* Segunda fila - Estados operativos */}
                    <KPICard
                        title="Tiempo Fuera Parque"
                        value={states?.time_outside_formatted || '00:00:00'}
                        icon={<TruckIcon className="h-5 w-5" />}
                        colorClass="text-orange-600"
                        subtitle="Tiempo en servicio externo (2+3+4+5)"
                    />
                    <KPICard
                        title="Tiempo en Taller"
                        value={getStateDuration(0)}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-red-600"
                        subtitle="Tiempo en mantenimiento (Clave 0)"
                    />
                    <KPICard
                        title="Tiempo Clave 2"
                        value={getStateDuration(2)}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-red-600"
                        subtitle="Emergencias con rotativo"
                    />
                    <KPICard
                        title="Tiempo Clave 5"
                        value={getStateDuration(5)}
                        icon={<ClockIcon className="h-5 w-5" />}
                        colorClass="text-orange-600"
                        subtitle="Regreso al parque sin rotativo"
                    />

                    {/* Tercera fila - Incidencias */}
                    <KPICard
                        title="Total Incidencias"
                        value={stability?.total_incidents || 0}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-red-600"
                        subtitle="Total de incidencias registradas"
                    />
                    <KPICard
                        title="Incidencias Graves"
                        value={stability?.critical || 0}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-red-600"
                        subtitle="Incidencias de alta severidad"
                    />
                    <KPICard
                        title="Incidencias Moderadas"
                        value={stability?.moderate || 0}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-orange-600"
                        subtitle="Incidencias de severidad media"
                    />
                    <KPICard
                        title="Incidencias Leves"
                        value={stability?.light || 0}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-green-600"
                        subtitle="Incidencias de baja severidad"
                    />

                    {/* Cuarta fila - Velocidad y estados */}
                    <KPICard
                        title="Tiempo Clave 3"
                        value={getStateDuration(3)}
                        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                        colorClass="text-orange-600"
                        subtitle="En siniestro (parado >1min)"
                    />
                    <KPICard
                        title="Velocidad Promedio"
                        value={`${avgSpeed} km/h`}
                        icon={<ChartBarIcon className="h-5 w-5" />}
                        colorClass="text-blue-600"
                        subtitle="Velocidad promedio del período"
                    />
                    <KPICard
                        title="Tiempo Clave 4"
                        value={getStateDuration(4)}
                        icon={<ClockIcon className="h-5 w-5" />}
                        colorClass="text-blue-600"
                        subtitle="Fin de actuación / retirada"
                    />
                </div>

                {/* AÑADIDO: Tabla de eventos por tipo */}
                {stability?.por_tipo && Object.keys(stability.por_tipo).length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Detalle de Eventos por Tipo</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Tipo de Evento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                            Frecuencia
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {Object.entries(stability.por_tipo)
                                        .sort(([, a], [, b]) => (b as number) - (a as number))
                                        .map(([tipo, cantidad]) => (
                                            <tr key={tipo}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {tipo.replace(/_/g, ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {cantidad as number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(cantidad as number) > 10 ? 'bg-red-100 text-red-800' :
                                                        (cantidad as number) > 5 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {(cantidad as number) > 10 ? 'Alta' : (cantidad as number) > 5 ? 'Media' : 'Baja'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Panel de Monitoreo de Dispositivos */}
                <div className="mt-6">
                    <DeviceMonitoringPanel
                        organizationId={getOrganizationId(user?.organizationId)}
                        onDeviceClick={(device) => {
                            logger.info(`Dispositivo seleccionado: ${device.vehicleId}`);
                        }}
                    />
                </div>
            </div>
        );
    };

    // Pestañas del dashboard
    const tabs = [
        { label: 'Estados & Tiempos', icon: <ClockIcon className="h-5 w-5" /> },
        { label: 'Puntos Negros', icon: <MapIcon className="h-5 w-5" /> },
        { label: 'Velocidad', icon: <ChartBarIcon className="h-5 w-5" /> },
        { label: 'Claves Operacionales', icon: <KeyIcon className="h-5 w-5" /> }, // ✅ NUEVO
        { label: 'Sesiones & Recorridos', icon: <TruckIcon className="h-5 w-5" /> },
        { label: 'Sistema de Alertas', icon: <ExclamationTriangleIcon className="h-5 w-5" /> },
        { label: 'Tracking de Procesamiento', icon: <CpuChipIcon className="h-5 w-5" /> },
        { label: 'Reportes', icon: <DocumentTextIcon className="h-5 w-5" /> }
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
            <div className="filters-container" style={{
                backgroundColor: 'transparent',
                boxShadow: 'none',
                padding: '24px 40px 0 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px'
            }}>
                <GlobalFiltersBar />
            </div>

            {/* Pestañas del dashboard */}
            <div className="tabs-container">
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-3 py-1 h-full">
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-1">
                            {tabs.map((tab, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveTab(index)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === index
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Panel de Diagnóstico (solo ADMIN) */}
                        <DiagnosticPanel />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-xs px-2 py-1"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        <ChartBarIcon className="h-3 w-3" />
                        {isExporting ? 'GENERANDO...' : 'EXPORTAR PDF'}
                    </Button>
                </div>
            </div>

            {/* Contenido del dashboard */}
            <div className="dashboard-content h-[calc(100vh-200px)]">
                {activeTab === 0 && renderEstadosTiempos()}
                {activeTab === 1 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <BlackSpotsTab
                            organizationId={getOrganizationId(user?.organizationId)}
                            vehicleIds={filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles : undefined}
                            startDate={filters.dateRange?.start}
                            endDate={filters.dateRange?.end}
                        />
                    </div>
                )}
                {activeTab === 2 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <SpeedAnalysisTab
                            organizationId={getOrganizationId(user?.organizationId)}
                            vehicleIds={filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles : undefined}
                            startDate={filters.dateRange?.start}
                            endDate={filters.dateRange?.end}
                        />
                    </div>
                )}
                {activeTab === 3 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <OperationalKeysTab
                            organizationId={getOrganizationId(user?.organizationId)}
                            vehicleIds={filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles : undefined}
                            startDate={filters.dateRange?.start}
                            endDate={filters.dateRange?.end}
                        />
                    </div>
                )}
                {activeTab === 4 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <SessionsAndRoutesView />
                    </div>
                )}
                {activeTab === 5 && (
                    <div className="h-full w-full bg-white p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Sistema de Alertas</h3>
                        <AlertSystemManager />
                    </div>
                )}
                {activeTab === 6 && (
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
                {activeTab === 7 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <DashboardReportsTab />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewExecutiveKPIDashboard;