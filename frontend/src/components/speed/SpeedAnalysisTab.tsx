import {
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MapIcon
} from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CircleMarker,
    Tooltip as LeafletTooltip,
    MapContainer,
    Popup,
    TileLayer,
    useMap
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MAP_CONFIG, SPEED_ENDPOINTS } from '../../config/api';
import { getOrganizationId } from '../../config/organization';
import { usePDFExport } from '../../hooks/usePDFExport';
import { apiService } from '../../services/api';
import { EnhancedKPIData, EnhancedTabExportData } from '../../services/enhancedPDFExportService';
import { SpeedViolation, SpeedViolationRoadType } from '../../types/deviceControl';
import { logger } from '../../utils/logger';
import LocationDisplay from '../LocationDisplay';
import SpeedViolationPopup from '../SpeedViolationPopup';

interface SpeedAnalysisTabProps {
    organizationId: string;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
}

// Componente para actualizar el mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const SpeedAnalysisTab: React.FC<SpeedAnalysisTabProps> = ({
    organizationId,
    vehicleIds,
    startDate,
    endDate
}) => {
    const ROAD_TYPE_LABELS: Record<SpeedViolationRoadType, string> = {
        AUTOPISTA_AUTOVIA: 'Autovía',
        AUTOPISTA_URBANA: 'Autopista Urbana',
        CARRETERA_ARCEN_PAVIMENTADO: 'Carretera con arcén pavimentado',
        RESTO_VIAS_FUERA_POBLADO: 'Resto de vías fuera de poblado',
        CONVENCIONAL_SEPARACION_FISICA: 'Carretera convencional dividida',
        CONVENCIONAL_SIN_SEPARACION: 'Carretera convencional',
        VIA_SIN_PAVIMENTAR: 'Vía sin pavimentar'
    };

    const ROAD_TYPE_OPTIONS: Array<{ value: SpeedViolationRoadType; label: string }> = Object.entries(ROAD_TYPE_LABELS).map(
        ([value, label]) => ({ value: value as SpeedViolationRoadType, label })
    );

    type BackendSpeedViolation = Omit<SpeedViolation, 'violationType'> & {
        violationType: 'grave' | 'moderada' | 'leve' | 'correcto';
        roadType: SpeedViolationRoadType;
    };

    const normalizeBackendViolations = (data: BackendSpeedViolation[]): SpeedViolation[] => {
        return data
            .filter(violation =>
                violation.violationType === 'grave' ||
                violation.violationType === 'moderada' ||
                violation.violationType === 'leve'
            )
            .map(violation => ({
                ...violation,
                violationType: violation.violationType === 'moderada' ? 'moderado' : violation.violationType
            }));
    };

    // Estados de filtros
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'on' | 'off'>('all');
    const [violationFilter, setViolationFilter] = useState<'all' | 'grave' | 'moderado' | 'leve'>('all');
    const [roadTypeFilter, setRoadTypeFilter] = useState<'all' | SpeedViolationRoadType>('all');

    // Estados de datos
    const [violations, setViolations] = useState<SpeedViolation[]>([]);
    const [criticalZones, setCriticalZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados del mapa
    const [mapCenter, setMapCenter] = useState<[number, number]>([40.5149, -3.7578]);
    const [mapZoom, setMapZoom] = useState(12);
    const mapRef = useRef<L.Map | null>(null);

    // Estados para desglose de incidencias
    const [expandedCategory, setExpandedCategory] = useState<'grave' | 'moderado' | 'leve' | null>(null);
    const [showIncidentsModal, setShowIncidentsModal] = useState(false);

    // Hook para exportación PDF
    const { exportEnhancedTabToPDF, isExporting } = usePDFExport();

    // Cargar datos
    const loadData = useCallback(async () => {
        // ✅ Definir validOrgId FUERA del try para usarlo en catch
        const validOrgId = getOrganizationId(organizationId);
        
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando datos de velocidad', { organizationId: validOrgId });

            const violationFilterParam = violationFilter === 'moderado' ? 'moderada' : violationFilter;
            const params = new URLSearchParams({
                organizationId: validOrgId,
                rotativoOn: rotativoFilter,
                violationType: violationFilterParam
            });

            if (roadTypeFilter && roadTypeFilter !== 'all') {
                params.append('roadType', roadTypeFilter);
            }

            if (vehicleIds && vehicleIds.length > 0) {
                params.append('vehicleIds', vehicleIds.join(','));
            }
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            // Cargar violaciones
            const violationsResponse = await apiService.get<{ violations: BackendSpeedViolation[]; total: number; stats: any }>(
                `${SPEED_ENDPOINTS.VIOLATIONS}?${params.toString()}`
            );

            if (violationsResponse.success && violationsResponse.data) {
                const normalizedViolations = normalizeBackendViolations(violationsResponse.data.violations || []);
                setViolations(normalizedViolations);
            }

            // Cargar zonas críticas
            const zonesResponse = await apiService.get<{ ranking: any[]; total: number }>(
                `${SPEED_ENDPOINTS.CRITICAL_ZONES}?${params.toString()}`
            );

            if (zonesResponse.success && zonesResponse.data) {
                setCriticalZones(zonesResponse.data.ranking || []);
            }

            logger.info(`Datos de velocidad cargados: ${violationsResponse.data?.violations?.length || 0} violaciones`);

        } catch (err: any) {
            // ✅ Manejo de errores mejorado con mensaje detallado
            logger.error('Error cargando datos de velocidad:', {
                error: err.message,
                stack: err.stack,
                organizationId: validOrgId,
                filters: { rotativoFilter, violationFilter, roadTypeFilter }
            });
            
            const errorMessage = err.response?.data?.message ||  err.message || 'Error desconocido';
            setError(`Error al cargar datos de velocidad: ${errorMessage}. Verifique que haya sesiones procesadas con datos GPS válidos.`);
        } finally {
            setLoading(false);
        }
    }, [organizationId, vehicleIds, startDate, endDate, rotativoFilter, violationFilter, roadTypeFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Obtener color según tipo de violación
    const getViolationColor = (violationType: string): string => {
        switch (violationType) {
            case 'grave':
                return '#EF4444'; // Rojo
            case 'moderado':
                return '#F97316'; // Naranja
            case 'leve':
                return '#F59E0B'; // Amarillo
            default:
                return '#9CA3AF'; // Gris
        }
    };

    // Obtener texto del tipo de vía
    const getRoadTypeText = (roadType: string): string => {
        if (roadType && roadType in ROAD_TYPE_LABELS) {
            return ROAD_TYPE_LABELS[roadType as SpeedViolationRoadType];
        }
        return 'Tipo de vía no identificado';
    };

    // Manejar click en ranking
    const handleZoneClick = (zone: any) => {
        setMapCenter([zone.lat, zone.lng]);
        setMapZoom(15);
    };

    // Manejar click en categoría de incidencias
    const handleCategoryClick = (category: 'grave' | 'moderado' | 'leve') => {
        setExpandedCategory(category);
        setShowIncidentsModal(true);
    };

    // Cerrar modal de incidencias
    const handleCloseIncidentsModal = () => {
        setShowIncidentsModal(false);
        setExpandedCategory(null);
    };

    // Manejar click en incidencia específica
    const handleIncidentClick = (incident: SpeedViolation) => {
        if (incident.lat && incident.lng) {
            setMapCenter([incident.lat, incident.lng]);
            setMapZoom(16);
            handleCloseIncidentsModal();
        }
    };

    // Filtrar incidencias por categoría
    const getIncidentsByCategory = (category: 'grave' | 'moderado' | 'leve') => {
        return violations.filter(v => v.violationType === category);
    };

    // Exportar reporte detallado a PDF
    const handleExportPDF = useCallback(async () => {
        try {
            const graveViolations = violations.filter(v => v.violationType === 'grave');
            const moderadoViolations = violations.filter(v => v.violationType === 'moderado');
            const leveViolations = violations.filter(v => v.violationType === 'leve');
            const avgExcess = violations.length > 0
                ? violations.reduce((sum, v) => sum + (v.speed - v.speedLimit), 0) / violations.length
                : 0;

            const kpis: EnhancedKPIData[] = [
                {
                    title: 'Total Excesos Detectados',
                    value: violations.length,
                    category: violations.length > 20 ? 'danger' : 'success',
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
                    value: violations.filter(v => v.rotativoOn).length,
                    category: 'info',
                    description: 'Excesos ocurridos durante emergencias con rotativo encendido. Limites mas permisivos segun normativa de vehiculos prioritarios.'
                }
            ];

            const violationsData = violations.slice(0, 30).map(v => ({
                timestamp: new Date(v.timestamp).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                vehicleName: v.vehicleName || 'N/A',
                location: `${v.lat?.toFixed(4)}, ${v.lng?.toFixed(4)}`,
                speed: v.speed,
                speedLimit: v.speedLimit,
                excess: parseFloat((v.speed - v.speedLimit).toFixed(2)),
                violationType: v.violationType,
                rotativoOn: v.rotativoOn,
                roadType: v.roadType,
                coordinates: { lat: v.lat, lng: v.lng }
            }));

            const exportData: EnhancedTabExportData = {
                tabName: 'Análisis de Velocidad',
                tabIndex: 2,
                subtitle: 'Control de Excesos de Velocidad según Normativa DGT',
                description: 'Análisis detallado de excesos de velocidad detectados en la flota, clasificados según normativa DGT para vehículos de emergencia. Incluye límites diferenciados por tipo de vía y estado del rotativo.',
                kpis,
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
                        content: `Se detectaron ${violations.length} excesos de velocidad en el periodo analizado. ${graveViolations.length} fueron clasificados como graves (>20 km/h), ${moderadoViolations.length} como moderados y ${leveViolations.length} como leves. El exceso promedio fue de ${avgExcess.toFixed(2)} km/h. ${violations.filter(v => v.rotativoOn).length} excesos ocurrieron con rotativo encendido durante emergencias.`
                    }
                ]
            };

            await exportEnhancedTabToPDF(exportData);
            logger.info('PDF de velocidad exportado exitosamente');
        } catch (error) {
            logger.error('Error exportando PDF de velocidad', { error });
            alert('Error al exportar PDF. Por favor, inténtelo de nuevo.');
        }
    }, [violations, exportEnhancedTabToPDF]);

    // Estadísticas
    const stats = useMemo(() => {
        const total = violations.length;
        const grave = violations.filter(v => v.violationType === 'grave').length;
        const moderado = violations.filter(v => v.violationType === 'moderado').length;
        const leve = violations.filter(v => v.violationType === 'leve').length;
        const withRotativo = violations.filter(v => v.rotativoOn).length;
        const withoutRotativo = violations.filter(v => !v.rotativoOn).length;

        const avgExcess = violations
            .filter(v => v.violationType === 'grave' || v.violationType === 'moderado' || v.violationType === 'leve')
            .reduce((sum, v) => sum + (v.speed - v.speedLimit), 0) / (grave + moderado + leve || 1);

        return {
            total,
            grave,
            moderado,
            leve,
            withRotativo,
            withoutRotativo,
            avgExcess: Math.round(avgExcess * 10) / 10
        };
    }, [violations]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-slate-600">Cargando análisis de velocidad...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 text-red-700">
                    <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-lg">Error al cargar datos de velocidad</h3>
                        <p className="text-sm mt-1">{error}</p>
                        <button
                            onClick={loadData}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FunnelIcon className="h-5 w-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-800">Filtros de Análisis de Velocidad</h3>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting || violations.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        {isExporting ? 'Generando...' : 'Exportar Reporte Detallado'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro de rotativo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Rotativo
                        </label>
                        <div className="flex gap-2">
                            {(['all', 'on', 'off'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setRotativoFilter(filter)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex-1 ${rotativoFilter === filter
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {filter === 'all' ? 'Todos' : filter === 'on' ? 'ON' : 'OFF'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtro de tipo de violación */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Clasificación
                        </label>
                        <div className="flex gap-2">
                            {(['all', 'grave', 'moderado', 'leve'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setViolationFilter(filter)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex-1 ${violationFilter === filter
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtro de tipo de vía */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Tipo de Vía
                        </label>
                        <select
                            value={roadTypeFilter}
                            onChange={(e) => setRoadTypeFilter(e.target.value === 'all' ? 'all' : (e.target.value as SpeedViolationRoadType))}
                            className="w-full px-3 py-1 rounded-lg border border-slate-300 text-sm"
                        >
                            <option value="all">Todas</option>
                            {ROAD_TYPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Total</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                </div>

                <div
                    className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4 cursor-pointer hover:bg-red-100 hover:shadow-md transition-all"
                    onClick={() => stats.grave > 0 && handleCategoryClick('grave')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                            <div className="text-sm font-medium text-red-700">Graves</div>
                        </div>
                        {stats.grave > 0 && (
                            <div className="text-xs text-red-600">👁️</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.grave}</div>
                    <div className="text-xs text-red-500 mt-1">Exceso &gt;20 km/h</div>
                </div>

                <div
                    className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-4 cursor-pointer hover:bg-orange-100 hover:shadow-md transition-all"
                    onClick={() => stats.moderado > 0 && handleCategoryClick('moderado')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                            <div className="text-sm font-medium text-orange-700">Moderados</div>
                        </div>
                        {stats.moderado > 0 && (
                            <div className="text-xs text-orange-600">👁️</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{stats.moderado}</div>
                    <div className="text-xs text-orange-500 mt-1">Exceso 10-20 km/h</div>
                </div>

                <div
                    className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4 cursor-pointer hover:bg-yellow-100 hover:shadow-md transition-all"
                    onClick={() => stats.leve > 0 && handleCategoryClick('leve')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                            <div className="text-sm font-medium text-yellow-700">Leves</div>
                        </div>
                        {stats.leve > 0 && (
                            <div className="text-xs text-yellow-600">👁️</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.leve}</div>
                    <div className="text-xs text-yellow-500 mt-1">Exceso 1-10 km/h</div>
                </div>

                <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Con Rotativo</div>
                    <div className="text-2xl font-bold text-red-600">{stats.withRotativo}</div>
                    <div className="text-xs text-slate-500 mt-1">Emergencias</div>
                </div>

                <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Exceso Promedio</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.avgExcess}</div>
                    <div className="text-xs text-slate-500 mt-1">km/h</div>
                </div>
            </div>

            {/* Grid de mapa y ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mapa de calor con clustering */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MapIcon className="h-5 w-5 text-slate-600" />
                            <h3 className="text-lg font-semibold text-slate-800">
                                Mapa de Velocidad - Clasificación DGT
                            </h3>
                        </div>

                        <div className="mb-4 flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Graves (exceso &gt;20 km/h)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Leves (exceso 1-20 km/h)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span>Moderados</span>
                            </div>
                        </div>

                        <div className="h-[600px] rounded-xl border border-slate-300 overflow-hidden">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                className="h-full w-full"
                                style={{ height: '100%', width: '100%' }}
                                ref={mapRef}
                            >
                                <TileLayer
                                    url={`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${MAP_CONFIG.TOMTOM_KEY}`}
                                    attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                                />

                                <MapUpdater center={mapCenter} zoom={mapZoom} />

                                {/* Violaciones con clustering */}
                                <MarkerClusterGroup>
                                    {violations.map((violation, index) => (
                                        <CircleMarker
                                            key={`violation-${index}`}
                                            center={[violation.lat, violation.lng]}
                                            radius={8}
                                            pathOptions={{
                                                color: getViolationColor(violation.violationType),
                                                fillColor: getViolationColor(violation.violationType),
                                                fillOpacity: 0.7,
                                                weight: 2
                                            }}
                                        >
                                            <Popup maxWidth={400} className="speed-event-popup">
                                                <SpeedViolationPopup
                                                    violation={violation}
                                                    getRoadTypeText={getRoadTypeText}
                                                />
                                            </Popup>
                                            <LeafletTooltip>
                                                {violation.vehicleName} - {violation.speed} km/h
                                            </LeafletTooltip>
                                        </CircleMarker>
                                    ))}
                                </MarkerClusterGroup>
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Ranking de tramos con excesos */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            🏁 Ranking de Tramos con Excesos
                        </h3>

                        <div className="space-y-3">
                            {criticalZones.map((zone) => (
                                <div
                                    key={zone.rank}
                                    className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all"
                                    onClick={() => handleZoneClick(zone)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`text-2xl font-bold ${zone.rank === 1 ? 'text-yellow-500' :
                                            zone.rank === 2 ? 'text-slate-400' :
                                                zone.rank === 3 ? 'text-amber-600' :
                                                    'text-slate-600'
                                            }`}>
                                            {zone.rank}
                                        </div>

                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-800 mb-1">
                                                <LocationDisplay
                                                    lat={zone.lat}
                                                    lng={zone.lng}
                                                    fallbackText={zone.location}
                                                />
                                            </div>

                                            <div className="text-sm text-slate-600 space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Total violaciones:</span>
                                                    <span className="font-bold">{zone.totalViolations}</span>
                                                </div>

                                                <div className="flex justify-between">
                                                    <span>Exceso promedio:</span>
                                                    <span className="font-bold text-orange-600">{zone.avgExcess} km/h</span>
                                                </div>

                                                <div className="flex gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                                        🔴 {zone.grave}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                                        🟠 {zone.moderado || 0}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                                        🟡 {zone.leve}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Información DGT */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <div className="text-blue-600 text-xl">ℹ️</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">
                            Límites de Velocidad según DGT
                        </h4>
                        <div className="text-sm text-blue-800 space-y-1">
                            <div><strong>Urbana:</strong> 50 km/h (vehículos de emergencia), 20 km/h (dentro del parque)</div>
                            <div><strong>Interurbana:</strong> 90 km/h (sin rotativo), 120 km/h (con rotativo)</div>
                            <div><strong>Autopista:</strong> 120 km/h (sin rotativo), 140 km/h (con rotativo)</div>
                            <div className="mt-2"><strong>Clasificación:</strong></div>
                            <div>• Leve: Exceso de 1-20 km/h sobre el límite</div>
                            <div>• Grave: Exceso de más de 20 km/h sobre el límite</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de desglose de incidencias */}
            {showIncidentsModal && expandedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">
                                    Excesos {expandedCategory === 'grave' ? 'Graves' : expandedCategory === 'moderado' ? 'Moderados' : 'Leves'}
                                </h3>
                                <button
                                    onClick={handleCloseIncidentsModal}
                                    className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                                Haz clic en cualquier exceso para localizarlo en el mapa
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-3">
                                {getIncidentsByCategory(expandedCategory).map((incident, index) => (
                                    <div
                                        key={`incident-${index}`}
                                        className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all"
                                        onClick={() => handleIncidentClick(incident)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`text-2xl font-bold ${expandedCategory === 'grave' ? 'text-red-600' :
                                                expandedCategory === 'moderado' ? 'text-orange-600' :
                                                    'text-yellow-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800 mb-1">
                                                    <LocationDisplay
                                                        lat={incident.lat}
                                                        lng={incident.lng}
                                                        fallbackText="Ubicación desconocida"
                                                    />
                                                </div>
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Vehículo:</span>
                                                        <span className="font-bold">{incident.vehicleName || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Fecha/Hora:</span>
                                                        <span className="text-xs font-mono">
                                                            {new Date(incident.timestamp).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Velocidad:</span>
                                                        <span className="font-bold text-red-600">{incident.speed} km/h</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Límite:</span>
                                                        <span className="font-bold">{incident.speedLimit} km/h</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Exceso:</span>
                                                        <span className="font-bold text-orange-600">
                                                            +{(incident.speed - incident.speedLimit).toFixed(1)} km/h
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Tipo de vía:</span>
                                                        <span className="font-bold">{getRoadTypeText(incident.roadType)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Rotativo:</span>
                                                        <span className="font-bold">
                                                            {incident.rotativoOn ? '✅ ON' : '❌ OFF'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Coordenadas:</span>
                                                        <span className="text-xs font-mono">
                                                            {incident.lat?.toFixed(6)}, {incident.lng?.toFixed(6)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpeedAnalysisTab;

