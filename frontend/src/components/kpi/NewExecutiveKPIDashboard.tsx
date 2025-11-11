import {
    BookOpenIcon,
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
import { EnhancedKPIData, EnhancedTabExportData } from '../../services/enhancedPDFExportService';
import { TabExportData } from '../../services/pdfExportService';
import { logger } from '../../utils/logger';
import { AlertSystemManager } from '../alerts/AlertSystemManager';
import DiagnosticPanel from '../DiagnosticPanel';
import GlobalFiltersBar from '../filters/GlobalFiltersBar';
import OperationalKeysTab from '../operations/OperationalKeysTab';
import DeviceMonitoringPanel from '../panel/DeviceMonitoringPanel';
import { ProcessingTrackingDashboard } from '../processing/ProcessingTrackingDashboard';
import { DashboardReportsTab } from '../reports/DashboardReportsTab';
import { SessionsAndRoutesView, useRouteExportFunction } from '../sessions/SessionsAndRoutesView';
import SpeedAnalysisTab from '../speed/SpeedAnalysisTab';
import BlackSpotsTab from '../stability/BlackSpotsTab';
import { Button } from '../ui/Button';
import { KPIDocumentationTab } from './KPIDocumentationTab';

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
    const [blackSpotsData, setBlackSpotsData] = useState<any>({ clusters: [], ranking: [] });

    // Estado para datos de sesión seleccionada
    const [selectedSessionData, setSelectedSessionData] = useState<{
        session: any;
        routeData: any;
    } | null>(null);

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
    const { exportTabToPDF, isExporting, captureElement, exportEnhancedTabToPDF, captureElementEnhanced } = usePDFExport();

    // Hook de exportación de recorridos
    const exportRouteFunction = useRouteExportFunction();

    // Hook de filtros globales
    const { filters, updateTrigger, updateFilters } = useGlobalFilters();

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
            logger.error('Error fetching dashboard data:', err);
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
            logger.error('Error fetching heatmap data:', err);
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
            logger.error('Error fetching speed violations:', err);
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
                            { title: 'Eventos Graves', value: heatmapData.points.filter((p: any) => p.severity === 'grave').length, subtitle: '0-20% estabilidad' },
                            { title: 'Eventos Moderados', value: heatmapData.points.filter((p: any) => p.severity === 'moderada').length, subtitle: '20-35% estabilidad' },
                            { title: 'Eventos Leves', value: heatmapData.points.filter((p: any) => p.severity === 'leve').length, subtitle: '35-50% estabilidad' },
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

    // Función MEJORADA para exportar la pestaña actual a PDF con diseño profesional
    const handleExportEnhancedPDF = useCallback(async () => {
        try {
            logger.info('Iniciando exportación de PDF mejorado', { activeTab, filters });

            let exportData: EnhancedTabExportData | null = null;

            switch (activeTab) {
                case 0: // Estados & Tiempos - CON EXPLICACIONES DETALLADAS
                    const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
                        ? Math.round(activity.km_total / activity.driving_hours)
                        : 0;

                    const kpisEstados: EnhancedKPIData[] = [
                        {
                            title: 'Horas de Conduccion',
                            value: activity?.driving_hours_formatted || '00:00:00',
                            category: 'info',
                            description: 'Tiempo total que los vehiculos han estado en movimiento durante el periodo seleccionado. Incluye tiempo en emergencias y servicios regulares.'
                        },
                        {
                            title: 'Kilometros Recorridos',
                            value: activity?.km_total || 0,
                            unit: 'km',
                            category: 'success',
                            description: 'Distancia total recorrida por la flota. Calculada a partir de coordenadas GPS con filtrado de anomalias. Incluye todos los trayectos registrados.'
                        },
                        {
                            title: 'Tiempo en Parque (Clave 1)',
                            value: getStateDuration(1),
                            category: 'info',
                            description: 'Tiempo que los vehiculos permanecieron dentro del parque de bomberos. Indica disponibilidad para respuesta inmediata.'
                        },
                        {
                            title: 'Porcentaje Rotativo Activo',
                            value: activity?.rotativo_on_percentage || 0,
                            unit: '%',
                            category: activity && activity.rotativo_on_percentage > 30 ? 'warning' : 'success',
                            description: 'Porcentaje de tiempo que el rotativo estuvo encendido. Indica la proporcion de tiempo en emergencias reales vs servicios regulares.'
                        },
                        {
                            title: 'Tiempo Fuera Parque (Clave 3)',
                            value: getStateDuration(3),
                            category: 'info',
                            description: 'Tiempo en servicio externo fuera del parque. Incluye emergencias, servicios y otros desplazamientos oficiales.'
                        },
                        {
                            title: 'Tiempo en Taller (Clave 0)',
                            value: getStateDuration(0),
                            category: 'warning',
                            description: 'Tiempo total en mantenimiento preventivo o correctivo. Vehiculos no disponibles para servicio.'
                        },
                        {
                            title: 'Emergencias Rotativo (Clave 2)',
                            value: getStateDuration(2),
                            category: 'danger',
                            description: 'Emergencias con rotativo encendido. Situaciones prioritarias que requieren respuesta inmediata con senalizacion activa.'
                        },
                        {
                            title: 'Servicios sin Rotativo (Clave 5)',
                            value: getStateDuration(5),
                            category: 'info',
                            description: 'Servicios programados sin rotativo. Incluye inspecciones, traslados programados y actividades no urgentes.'
                        },
                        {
                            title: 'Total Incidencias de Estabilidad',
                            value: stability?.total_incidents || 0,
                            category: (stability?.total_incidents || 0) > 50 ? 'danger' : 'success',
                            description: 'Total de eventos de inestabilidad detectados. Incluye aceleraciones bruscas, frenazos y giros cerrados que afectan la estabilidad.'
                        },
                        {
                            title: 'Incidencias Graves (0-20%)',
                            value: stability?.critical || 0,
                            category: 'danger',
                            description: 'Eventos con indice de estabilidad 0-20%. Requieren atencion inmediata: revisar condiciones del vehiculo y formacion del conductor.'
                        },
                        {
                            title: 'Incidencias Moderadas (20-35%)',
                            value: stability?.moderate || 0,
                            category: 'warning',
                            description: 'Eventos con indice 20-35%. Situaciones de riesgo medio que deben monitorearse para evitar escalada a gravedad.'
                        },
                        {
                            title: 'Incidencias Leves (35-50%)',
                            value: stability?.light || 0,
                            category: 'success',
                            description: 'Eventos con indice 35-50%. Situaciones menores que forman parte de la conduccion normal en emergencias.'
                        },
                        {
                            title: 'Velocidad Promedio de Flota',
                            value: avgSpeed,
                            unit: 'km/h',
                            category: avgSpeed > 80 ? 'warning' : 'success',
                            description: 'Velocidad media de la flota calculada sobre el tiempo en movimiento. Valor esperado: 40-70 km/h segun tipo de servicio.'
                        }
                    ];

                    exportData = {
                        tabName: 'Estados & Tiempos',
                        tabIndex: 0,
                        subtitle: 'Análisis Operativo de la Flota',
                        description: 'Este reporte presenta un análisis detallado de los estados operacionales y métricas de tiempo de la flota de vehículos de emergencia, incluyendo tiempos de conducción, kilómetros recorridos y distribución por claves operacionales.',
                        kpis: kpisEstados,
                        sections: [
                            {
                                title: 'Interpretacion de Claves Operacionales',
                                type: 'list',
                                content: [
                                    'Clave 1 - En Parque: Vehiculo en base, disponible para respuesta inmediata',
                                    'Clave 2 - Emergencia con Rotativo: Respuesta prioritaria con senalizacion activa',
                                    'Clave 3 - En Siniestro: Intervencion con vehículo parado y rotativo activo',
                                    'Clave 0 - Taller: Mantenimiento preventivo o correctivo, no disponible',
                                    'Clave 5 - Regreso al Parque: Servicios o traslados sin rotativo'
                                ]
                            },
                            {
                                title: 'Analisis de Disponibilidad',
                                type: 'text',
                                content: `La flota ha registrado ${activity?.driving_hours_formatted || '00:00'} horas de conduccion con ${activity?.km_total || 0} km recorridos. El ${activity?.rotativo_on_percentage || 0}% del tiempo operativo fue en emergencias con rotativo activo. Se detectaron ${stability?.total_incidents || 0} eventos de inestabilidad, de los cuales ${stability?.critical || 0} fueron clasificados como graves y requieren seguimiento.`
                            }
                        ],
                        filters: {
                            vehicle: filters.vehicles && filters.vehicles.length > 0
                                ? `${filters.vehicles.length} vehículo(s)`
                                : 'Todos los vehículos',
                            dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                                start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                                end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                            } : undefined
                        }
                    };
                    break;

                case 2: // Velocidad - MEJORADO CON TABLA DE EVENTOS
                    const graveViolations = speedViolations.filter((v: any) => v.violationType === 'grave');
                    const moderadoViolations = speedViolations.filter((v: any) => v.violationType === 'moderado');
                    const leveViolations = speedViolations.filter((v: any) => v.violationType === 'leve');
                    const avgExcess = speedViolations.length > 0
                        ? speedViolations.reduce((sum: number, v: any) => sum + (v.speed - v.speedLimit), 0) / speedViolations.length
                        : 0;

                    const kpisVelocidad: EnhancedKPIData[] = [
                        {
                            title: 'Total Excesos Detectados',
                            value: speedViolations.length,
                            category: speedViolations.length > 20 ? 'danger' : 'success',
                            description: 'Total de excesos de velocidad detectados durante el periodo. Incluye todas las clasificaciones segun normativa DGT para vehiculos de emergencia.'
                        },
                        {
                            title: 'Excesos Graves (>20 km/h)',
                            value: graveViolations.length,
                            category: 'danger',
                            description: 'Excesos superiores a 20 km/h sobre el limite permitido. Requieren revision inmediata y pueden indicar necesidad de formacion adicional.'
                        },
                        {
                            title: 'Excesos Moderados (10-20 km/h)',
                            value: moderadoViolations.length,
                            category: 'warning',
                            description: 'Excesos entre 10-20 km/h. Situaciones de riesgo medio que deben monitorearse para evitar recurrencia.'
                        },
                        {
                            title: 'Excesos Leves (1-10 km/h)',
                            value: leveViolations.length,
                            category: 'success',
                            description: 'Excesos de 1-10 km/h. Variaciones menores que pueden considerarse normales en contexto de emergencias.'
                        },
                        {
                            title: 'Exceso Promedio',
                            value: avgExcess.toFixed(2),
                            unit: 'km/h',
                            category: avgExcess > 15 ? 'warning' : 'success',
                            description: 'Promedio de exceso de velocidad en todas las violaciones. Indica el nivel general de cumplimiento de limites.'
                        },
                        {
                            title: 'Excesos con Rotativo Encendido',
                            value: speedViolations.filter((v: any) => v.rotativoOn).length,
                            category: 'info',
                            description: 'Excesos ocurridos durante emergencias con rotativo encendido. Limites mas permisivos segun normativa de vehiculos prioritarios.'
                        }
                    ];

                    // Preparar datos de violaciones para la tabla (ampliado a 30 para más detalle)
                    const violationsData = speedViolations.slice(0, 30).map((v: any) => ({
                        timestamp: new Date(v.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        vehicleName: v.vehicleName || 'N/A',
                        location: v.location || `${v.lat?.toFixed(4)}, ${v.lng?.toFixed(4)}`,
                        speed: v.speed,
                        speedLimit: v.speedLimit,
                        excess: parseFloat((v.speed - v.speedLimit).toFixed(2)),
                        violationType: v.violationType,
                        rotativoOn: v.rotativoOn,
                        roadType: v.roadType,
                        coordinates: { lat: v.lat, lng: v.lng }
                    }));

                    exportData = {
                        tabName: 'Análisis de Velocidad',
                        tabIndex: 2,
                        subtitle: 'Control de Excesos de Velocidad según Normativa DGT',
                        description: 'Análisis detallado de excesos de velocidad detectados en la flota, clasificados según normativa DGT para vehículos de emergencia. Incluye límites diferenciados por tipo de vía y estado del rotativo.',
                        kpis: kpisVelocidad,
                        speedViolations: violationsData,
                        sections: [
                            {
                                title: 'Limites de Velocidad Aplicados',
                                type: 'list',
                                content: [
                                    'VIA URBANA: 50 km/h (normal) | 80 km/h (emergencia con rotativo)',
                                    'VIA INTERURBANA: 90 km/h (normal) | 120 km/h (emergencia con rotativo)',
                                    'AUTOPISTA: 120 km/h (normal) | 140 km/h (emergencia con rotativo)',
                                    'DENTRO DEL PARQUE: 20 km/h (limite fijo para todos los vehiculos)'
                                ]
                            },
                            {
                                title: 'Clasificacion de Severidad',
                                type: 'list',
                                content: [
                                    'GRAVE: Exceso superior a 20 km/h - Requiere accion inmediata',
                                    'MODERADO: Exceso entre 10-20 km/h - Requiere monitoreo',
                                    'LEVE: Exceso entre 1-10 km/h - Variacion aceptable'
                                ]
                            },
                            {
                                title: 'Analisis de Resultados',
                                type: 'text',
                                content: `Se detectaron ${speedViolations.length} excesos de velocidad en el periodo analizado. ${graveViolations.length} fueron clasificados como graves (>20 km/h), ${moderadoViolations.length} como moderados y ${leveViolations.length} como leves. El exceso promedio fue de ${avgExcess.toFixed(2)} km/h. ${speedViolations.filter((v: any) => v.rotativoOn).length} excesos ocurrieron con rotativo encendido durante emergencias.`
                            }
                        ],
                        filters: {
                            vehicle: filters.vehicles && filters.vehicles.length > 0
                                ? `${filters.vehicles.length} vehículo(s)`
                                : 'Todos los vehículos',
                            dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                                start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                                end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                            } : undefined
                        }
                    };
                    break;

                case 1: // Puntos Negros - MEJORADO CON RANKING DETALLADO
                    const ranking = blackSpotsData.ranking || [];
                    const totalBlackSpotsEvents = ranking.reduce((sum: number, spot: any) => sum + (spot.totalEvents || 0), 0);
                    const graveSpots = ranking.filter((spot: any) => spot.grave > 0).length;

                    const kpisPuntosNegros: EnhancedKPIData[] = [
                        {
                            title: 'Zonas Criticas Identificadas',
                            value: ranking.length,
                            category: ranking.length > 10 ? 'warning' : 'success',
                            description: 'Numero total de zonas identificadas como puntos negros. Areas con alta concentracion de eventos de inestabilidad que requieren atencion especial.'
                        },
                        {
                            title: 'Total de Eventos Registrados',
                            value: totalBlackSpotsEvents,
                            category: totalBlackSpotsEvents > 100 ? 'danger' : 'success',
                            description: 'Suma total de eventos de inestabilidad registrados en todas las zonas criticas. Indica el nivel general de riesgo en la red viaria.'
                        },
                        {
                            title: 'Zonas con Eventos Graves',
                            value: graveSpots,
                            category: 'danger',
                            description: 'Zonas que registraron al menos un evento de alta severidad. Requieren medidas correctivas urgentes o restricciones operativas.'
                        },
                        {
                            title: 'Promedio Eventos por Zona',
                            value: ranking.length > 0 ? (totalBlackSpotsEvents / ranking.length).toFixed(1) : 0,
                            category: 'info',
                            description: 'Promedio de eventos por zona critica. Indica la concentracion de incidencias en cada punto identificado.'
                        }
                    ];

                    // Preparar datos del ranking para el PDF
                    const blackSpotsDetails = ranking.slice(0, 10).map((spot: any) => ({
                        rank: spot.rank,
                        location: spot.location || `${spot.lat?.toFixed(4)}, ${spot.lng?.toFixed(4)}`,
                        totalEvents: spot.totalEvents,
                        grave: spot.grave || 0,
                        moderada: spot.moderada || 0,
                        leve: spot.leve || 0,
                        frequency: spot.totalEvents,
                        dominantSeverity: spot.dominantSeverity || 'leve',
                        coordinates: { lat: spot.lat, lng: spot.lng }
                    }));

                    exportData = {
                        tabName: 'Puntos Negros - Zonas Críticas',
                        tabIndex: 1,
                        subtitle: 'Análisis de Concentración de Incidencias',
                        description: 'Identificación y análisis de zonas con alta concentración de eventos de inestabilidad. Estos puntos negros representan áreas de riesgo que requieren atención especial para prevención de accidentes.',
                        kpis: kpisPuntosNegros,
                        blackSpots: blackSpotsDetails,
                        sections: [
                            {
                                title: 'Metodologia de Deteccion',
                                type: 'text',
                                content: 'Los puntos negros se identifican agrupando eventos de inestabilidad por proximidad geografica (clustering). Se consideran zonas criticas aquellas con frecuencia minima de 2 eventos y se clasifican segun la severidad dominante de los incidentes registrados.'
                            },
                            {
                                title: 'Criterios de Clasificacion',
                                type: 'list',
                                content: [
                                    'SEVERIDAD GRAVE: Indice de estabilidad 0-20% - Riesgo alto',
                                    'SEVERIDAD MODERADA: Indice 20-35% - Riesgo medio',
                                    'SEVERIDAD LEVE: Indice 35-50% - Riesgo bajo'
                                ]
                            },
                            {
                                title: 'Analisis de Patrones Detectados',
                                type: 'text',
                                content: `Se identificaron ${ranking.length} zonas criticas con ${totalBlackSpotsEvents} eventos totales. ${graveSpots} zonas presentan eventos de alta severidad. La zona con mayor frecuencia registro ${ranking[0]?.totalEvents || 0} eventos, indicando un patron recurrente que requiere investigacion y posibles medidas correctivas.`
                            }
                        ],
                        filters: {
                            vehicle: filters.vehicles && filters.vehicles.length > 0
                                ? `${filters.vehicles.length} vehículo(s)`
                                : 'Todos los vehículos',
                            dateRange: filters.dateRange?.start && filters.dateRange?.end ? {
                                start: new Date(filters.dateRange.start).toLocaleDateString('es-ES'),
                                end: new Date(filters.dateRange.end).toLocaleDateString('es-ES')
                            } : undefined
                        }
                    };
                    break;

                default:
                    return; // Usar método antiguo para otras pestañas
            }

            if (exportData) {
                await exportEnhancedTabToPDF(exportData);
                logger.info('PDF mejorado exportado exitosamente', { tabName: exportData.tabName });
            }

        } catch (error) {
            logger.error('Error exportando PDF mejorado', { error });
            alert('Error al exportar PDF mejorado. Por favor, inténtelo de nuevo.');
        }
    }, [activeTab, activity, stability, getStateDuration, exportEnhancedTabToPDF, captureElementEnhanced, filters, speedViolations, blackSpotsData]);

    // Renderizar contenido de Estados & Tiempos
    const renderEstadosTiempos = () => {
        // Calcular velocidad promedio
        // CORREGIDO: Validar que driving_hours sea razonable para evitar velocidades imposibles
        const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
            ? Math.round(activity.km_total / activity.driving_hours)
            : 0;

        return (
            <div className="h-full w-full bg-white p-2 overflow-hidden" id="estados-tiempos-content">
                <div className="grid grid-cols-3 gap-3 h-full" id="estados-tiempos-kpis">
                    {/* COLUMNA 1: MÉTRICAS GENERALES */}
                    <div className="bg-slate-50/50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <ChartBarIcon className="h-4 w-4" />
                            Métricas Generales
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <KPICard
                                title="Horas de Conducción"
                                value={activity?.driving_hours_formatted || '00:00:00'}
                                icon={<ClockIcon className="h-5 w-5" />}
                                colorClass="text-blue-600"
                                subtitle="Tiempo total de conducción"
                            />
                            <KPICard
                                title="Kilómetros Recorridos"
                                value={`${activity?.km_total || 0} km`}
                                icon={<TruckIcon className="h-5 w-5" />}
                                colorClass="text-green-600"
                                subtitle="Distancia total recorrida"
                            />
                            <KPICard
                                title="Velocidad Promedio"
                                value={`${avgSpeed} km/h`}
                                icon={<ChartBarIcon className="h-5 w-5" />}
                                colorClass="text-blue-600"
                                subtitle="Velocidad media de la flota"
                            />
                            <KPICard
                                title="% Rotativo Activo"
                                value={`${activity?.rotativo_on_percentage || 0}%`}
                                icon={<PowerIcon className="h-5 w-5" />}
                                colorClass="text-orange-600"
                                subtitle="Tiempo con rotativo encendido"
                            />
                            <KPICard
                                title="Índice de Estabilidad"
                                value={`${(((quality?.indice_promedio || 0)) * 100).toFixed(1)}%`}
                                icon={<ChartBarIcon className="h-5 w-5" />}
                                colorClass={
                                    (quality?.indice_promedio || 0) >= 0.90 ? "text-green-600" :
                                        (quality?.indice_promedio || 0) >= 0.88 ? "text-yellow-600" :
                                            "text-red-600"
                                }
                                subtitle={`${quality?.calificacion || 'N/A'} ${quality?.estrellas || ''}`}
                            />
                        </div>
                    </div>

                    {/* COLUMNA 2: CLAVES OPERACIONALES */}
                    <div className="bg-slate-50/50 rounded-lg p-3 border-l-4 border-orange-500 shadow-sm">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <KeyIcon className="h-4 w-4" />
                            Claves Operacionales
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <KPICard
                                title="Clave 0 (Taller)"
                                value={getStateDuration(0)}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-red-600"
                                subtitle="Mantenimiento"
                            />
                            <KPICard
                                title="Clave 1 (Parque)"
                                value={getStateDuration(1)}
                                icon={<MapIcon className="h-5 w-5" />}
                                colorClass="text-slate-600"
                                subtitle="En base, disponible"
                            />
                            <KPICard
                                title="Clave 2 (Emergencia)"
                                value={getStateDuration(2)}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-red-600"
                                subtitle="Con rotativo activo"
                            />
                            <KPICard
                                title="Clave 3 (Siniestro)"
                                value={getStateDuration(3)}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-orange-600"
                                subtitle="En siniestro (parado >1min)"
                            />
                            <KPICard
                                title="Clave 5 (Regreso al Parque)"
                                value={getStateDuration(5)}
                                icon={<ClockIcon className="h-5 w-5" />}
                                colorClass="text-orange-600"
                                subtitle="Regreso sin rotativo"
                            />
                            <KPICard
                                title="Tiempo Fuera Parque"
                                value={states?.time_outside_formatted || '00:00:00'}
                                icon={<TruckIcon className="h-5 w-5" />}
                                colorClass="text-orange-600"
                                subtitle="Total en servicio externo"
                            />
                        </div>
                    </div>

                    {/* COLUMNA 3: INCIDENCIAS */}
                    <div className="bg-slate-50/50 rounded-lg p-3 border-l-4 border-red-500 shadow-sm">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            Incidencias de Estabilidad
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            <KPICard
                                title="Total Incidencias"
                                value={stability?.total_incidents || 0}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-slate-600"
                                subtitle="Total eventos registrados"
                            />
                            <KPICard
                                title="Graves (0-20%)"
                                value={stability?.critical || 0}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-red-600"
                                subtitle="Alta severidad"
                            />
                            <KPICard
                                title="Moderadas (20-35%)"
                                value={stability?.moderate || 0}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-orange-600"
                                subtitle="Severidad media"
                            />
                            <KPICard
                                title="Leves (35-50%)"
                                value={stability?.light || 0}
                                icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                                colorClass="text-green-600"
                                subtitle="Baja severidad"
                            />
                        </div>
                    </div>
                </div>

                {/* AÑADIDO: Tabla de eventos por tipo - Ordenada por tipo alfabéticamente */}
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
                                        .sort(([tipoA], [tipoB]) => tipoA.localeCompare(tipoB))
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
        { label: 'Reportes', icon: <DocumentTextIcon className="h-5 w-5" /> },
        { label: 'Documentación KPIs', icon: <BookOpenIcon className="h-5 w-5" /> }
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
                padding: '12px 20px 0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
            }}>
                <GlobalFiltersBar />
            </div>

            {/* Pestañas del dashboard con filtros unificados */}
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

                    {/* Filtros de fecha unificados en la misma fila */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                const today = new Date();
                                updateFilters({
                                    dateRange: {
                                        start: today.toISOString().split('T')[0] || '',
                                        end: today.toISOString().split('T')[0] || ''
                                    }
                                });
                            }}
                            className="px-2 py-1 text-xs font-bold rounded border border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        >
                            HOY
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date();
                                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                updateFilters({
                                    dateRange: {
                                        start: weekAgo.toISOString().split('T')[0] || '',
                                        end: today.toISOString().split('T')[0] || ''
                                    }
                                });
                            }}
                            className="px-2 py-1 text-xs font-bold rounded border border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                            ESTA SEMANA
                        </button>
                        <button
                            onClick={() => {
                                const today = new Date();
                                const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                                updateFilters({
                                    dateRange: {
                                        start: monthAgo.toISOString().split('T')[0] || '',
                                        end: today.toISOString().split('T')[0] || ''
                                    }
                                });
                            }}
                            className="px-2 py-1 text-xs font-bold rounded border border-sky-300 bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                        >
                            ESTE MES
                        </button>
                        <button
                            onClick={() => {
                                updateFilters({
                                    dateRange: {
                                        start: '',
                                        end: ''
                                    },
                                    vehicles: [],
                                    severity: []
                                });
                            }}
                            className="px-2 py-1 text-xs font-bold rounded border border-green-300 bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                            TODO
                        </button>

                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs px-2 py-1 ml-2"
                            onClick={activeTab === 0 || activeTab === 2 || activeTab === 1 ? handleExportEnhancedPDF :
                                activeTab === 4 ? () => {
                                    if (selectedSessionData?.session && selectedSessionData?.routeData) {
                                        exportRouteFunction(selectedSessionData.session, selectedSessionData.routeData);
                                    } else {
                                        logger.warn('No hay sesión seleccionada para exportar');
                                    }
                                } : handleExportPDF}
                            disabled={isExporting}
                        >
                            <ChartBarIcon className="h-3 w-3" />
                            {isExporting ? 'GENERANDO...' :
                                (activeTab === 0 || activeTab === 2 || activeTab === 1) ? 'EXPORTAR REPORTE DETALLADO' :
                                    activeTab === 4 ? 'EXPORTAR RECORRIDO' : 'EXPORTAR PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Contenido del dashboard */}
            <div className="dashboard-content h-[calc(100vh-140px)]">
                {activeTab === 0 && renderEstadosTiempos()}
                {activeTab === 1 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <BlackSpotsTab
                            organizationId={getOrganizationId(user?.organizationId)}
                            vehicleIds={filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles : undefined}
                            startDate={filters.dateRange?.start}
                            endDate={filters.dateRange?.end}
                            onDataLoaded={(data) => setBlackSpotsData(data)}
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
                        <SessionsAndRoutesView
                            onSessionDataChange={(session, routeData) => {
                                setSelectedSessionData({ session, routeData });
                            }}
                        />
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
                {activeTab === 8 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <KPIDocumentationTab />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewExecutiveKPIDashboard;