import {
    DocumentArrowDownIcon,
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
import { HOTSPOT_ENDPOINTS, MAP_CONFIG } from '../../config/api';
import { usePDFExport } from '../../hooks/usePDFExport';
import { apiService } from '../../services/api';
import { EnhancedKPIData, EnhancedTabExportData } from '../../services/enhancedPDFExportService';
import { logger } from '../../utils/logger';
import ClusterPopup from '../ClusterPopup';
import EventDetailsErrorBoundary from '../EventDetailsErrorBoundary';
import EventDetailsModal from '../EventDetailsModal';
import LocationDisplay from '../LocationDisplay';

interface BlackSpotsTabProps {
    organizationId: string;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
    onDataLoaded?: (data: { clusters: any[]; ranking: any[] }) => void; // Callback para compartir datos
}

// Componente para actualizar el mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        // Verificar que las coordenadas son válidas antes de actualizar
        if (center && center[0] !== undefined && center[1] !== undefined) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const BlackSpotsTab: React.FC<BlackSpotsTabProps> = ({
    organizationId,
    vehicleIds,
    startDate,
    endDate,
    onDataLoaded
}) => {
    // Estados de filtros
    const [severityFilter, setSeverityFilter] = useState<'all' | 'grave' | 'moderada' | 'leve'>('all');
    const [minFrequency, setMinFrequency] = useState(2); // default más estricto
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'on' | 'off'>('all');
    const [clusterRadius, setClusterRadius] = useState(30); // default más amplio
    const [individualMode, setIndividualMode] = useState<boolean>(false); // modo eventos individuales (sin clustering)

    // Estados de datos
    const [clusters, setClusters] = useState<any[]>([]);
    const [ranking, setRanking] = useState<any[]>([]);
    const [apiTotals, setApiTotals] = useState<{ totalEvents: number; totalClusters: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados del mapa
    const [mapCenter, setMapCenter] = useState<[number, number]>([40.5149, -3.7578]);
    const [mapZoom, setMapZoom] = useState(12);
    const mapRef = useRef<L.Map | null>(null);

    // Estados para modal de detalles
    const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
    const [showEventDetails, setShowEventDetails] = useState(false);

    // Estados para desglose de incidencias
    const [expandedCategory, setExpandedCategory] = useState<'grave' | 'moderada' | 'leve' | null>(null);
    const [showIncidentsModal, setShowIncidentsModal] = useState(false);

    // Hook para exportación PDF
    const { exportEnhancedTabToPDF, isExporting } = usePDFExport();

    // Cargar datos
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando puntos negros', {
                organizationId,
                vehicleIds,
                startDate,
                endDate,
                severityFilter,
                minFrequency,
                rotativoFilter,
                clusterRadius,
                individualMode
            });

            const params = new URLSearchParams({
                organizationId,
                severity: severityFilter,
                minFrequency: minFrequency.toString(),
                rotativoOn: rotativoFilter,
                clusterRadius: clusterRadius.toString()
            });
            params.append('mode', individualMode ? 'single' : 'cluster');

            if (vehicleIds && vehicleIds.length > 0) {
                params.append('vehicleIds', vehicleIds.join(','));
            }
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            logger.info(`URL completa: ${HOTSPOT_ENDPOINTS.CRITICAL_POINTS}?${params.toString()}`);

            // Cargar clusters
            const clustersResponse = await apiService.get<{ clusters: any[]; total_events?: number; totalClusters?: number; totalEvents?: number }>(
                `${HOTSPOT_ENDPOINTS.CRITICAL_POINTS}?${params.toString()}`
            );

            if (clustersResponse.success && clustersResponse.data) {
                // Soportar respuestas en dos formatos:
                // 1) { success, data: { clusters, total_events, totalClusters } }
                // 2) { success, data: { clusters, ... } } ya tipado como T
                const root: any = clustersResponse as any;
                const dataAny: any = (root.data && root.data.data) ? root.data.data : clustersResponse.data;

                const list = Array.isArray(dataAny?.clusters) ? dataAny.clusters : [];
                setClusters(list);

                const te = typeof dataAny?.total_events === 'number'
                    ? dataAny.total_events
                    : (typeof dataAny?.totalEvents === 'number' ? dataAny.totalEvents : undefined);
                const tc = typeof dataAny?.totalClusters === 'number' ? dataAny.totalClusters : undefined;

                if (typeof te === 'number' || typeof tc === 'number') {
                    setApiTotals({
                        totalEvents: te ?? list.reduce((sum: number, c: any) => sum + (c.frequency || 0), 0),
                        totalClusters: tc ?? list.length
                    });
                } else {
                    setApiTotals(null);
                }
            }

            // Cargar ranking
            const rankingResponse = await apiService.get<{ ranking: any[]; total: number }>(
                `${HOTSPOT_ENDPOINTS.RANKING}?${params.toString()}`
            );

            let rankingData: any[] = [];
            if (rankingResponse.success && rankingResponse.data) {
                const rootRank: any = rankingResponse as any;
                const dataRank: any = (rootRank.data && rootRank.data.data) ? rootRank.data.data : rankingResponse.data;
                rankingData = Array.isArray(dataRank?.ranking) ? dataRank.ranking : [];
                setRanking(rankingData);
            }

            // Compartir datos con el componente padre para exportación
            if (onDataLoaded) {
                onDataLoaded({
                    clusters: clustersResponse.data?.clusters || [],
                    ranking: rankingData
                });
            }

            logger.info(`Puntos negros cargados: ${clustersResponse.data?.clusters?.length || 0} clusters`);

        } catch (err) {
            logger.error('Error cargando puntos negros:', err);
            setError('Error al cargar datos de puntos negros');
        } finally {
            setLoading(false);
        }
    }, [organizationId, vehicleIds, startDate, endDate, severityFilter, minFrequency, rotativoFilter, clusterRadius, individualMode]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Obtener color según severidad
    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'grave':
                return '#EF4444'; // Rojo
            case 'moderada':
                return '#F59E0B'; // Naranja
            case 'leve':
                return '#FBBF24'; // Amarillo
            default:
                return '#9CA3AF'; // Gris
        }
    };

    // Manejar click en ranking
    const handleRankingClick = (location: any) => {
        setMapCenter([location.lat, location.lng]);
        setMapZoom(15);
    };

    // Manejar mostrar detalles de eventos
    const handleShowEventDetails = (cluster: any) => {
        setSelectedCluster(cluster);
        setShowEventDetails(true);
    };

    // Cerrar modal de detalles
    const handleCloseEventDetails = () => {
        setShowEventDetails(false);
        setSelectedCluster(null);
    };

    // Manejar click en categoría de incidencias
    const handleCategoryClick = (category: 'grave' | 'moderada' | 'leve') => {
        setExpandedCategory(category);
        setShowIncidentsModal(true);
    };

    // Cerrar modal de incidencias
    const handleCloseIncidentsModal = () => {
        setShowIncidentsModal(false);
        setExpandedCategory(null);
    };

    // Manejar click en incidencia específica
    const handleIncidentClick = (incident: any) => {
        if (incident.lat && incident.lng) {
            setMapCenter([incident.lat, incident.lng]);
            setMapZoom(16);
            handleCloseIncidentsModal();
        }
    };

    // Filtrar incidencias por categoría
    const getIncidentsByCategory = (category: 'grave' | 'moderada' | 'leve') => {
        return clusters.filter(c => c.dominantSeverity === category);
    };

    // Exportar reporte detallado a PDF
    const handleExportPDF = useCallback(async () => {
        try {
            const totalEvents = ranking.reduce((sum, spot) => sum + (spot.totalEvents || 0), 0);
            const graveSpots = ranking.filter(spot => spot.grave > 0).length;

            const kpis: EnhancedKPIData[] = [
                {
                    title: 'Zonas Criticas Identificadas',
                    value: ranking.length,
                    category: ranking.length > 10 ? 'warning' : 'success',
                    description: 'Numero total de zonas identificadas como puntos negros. Areas con alta concentracion de eventos de inestabilidad que requieren atencion especial.'
                },
                {
                    title: 'Total de Eventos Registrados',
                    value: totalEvents,
                    category: totalEvents > 100 ? 'danger' : 'success',
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
                    value: ranking.length > 0 ? (totalEvents / ranking.length).toFixed(1) : 0,
                    category: 'info',
                    description: 'Promedio de eventos por zona critica. Indica la concentracion de incidencias en cada punto identificado.'
                }
            ];

            const blackSpotsDetails = ranking.slice(0, 15).map(spot => ({
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

            const exportData: EnhancedTabExportData = {
                tabName: 'Puntos Negros - Zonas Críticas',
                tabIndex: 1,
                subtitle: 'Análisis de Concentración de Incidencias',
                description: 'Identificación y análisis de zonas con alta concentración de eventos de inestabilidad. Estos puntos negros representan áreas de riesgo que requieren atención especial para prevención de accidentes.',
                kpis,
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
                        content: `Se identificaron ${ranking.length} zonas criticas con ${totalEvents} eventos totales. ${graveSpots} zonas presentan eventos de alta severidad. La zona con mayor frecuencia registro ${ranking[0]?.totalEvents || 0} eventos, indicando un patron recurrente que requiere investigacion y posibles medidas correctivas.`
                    }
                ]
            };

            await exportEnhancedTabToPDF(exportData);
            logger.info('PDF de puntos negros exportado exitosamente');
        } catch (error) {
            logger.error('Error exportando PDF de puntos negros', { error });
            alert('Error al exportar PDF. Por favor, inténtelo de nuevo.');
        }
    }, [ranking, exportEnhancedTabToPDF]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalClusters = apiTotals?.totalClusters ?? clusters.length;
        const totalEvents = apiTotals?.totalEvents ?? clusters.reduce((sum, c) => sum + c.frequency, 0);
        const graveCount = clusters.filter(c => c.dominantSeverity === 'grave').length;
        const moderadaCount = clusters.filter(c => c.dominantSeverity === 'moderada').length;
        const leveCount = clusters.filter(c => c.dominantSeverity === 'leve').length;

        return {
            totalClusters,
            totalEvents,
            graveCount,
            moderadaCount,
            leveCount
        };
    }, [clusters, apiTotals]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-slate-600">Cargando análisis de puntos negros...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                    <span>{error}</span>
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
                        <h3 className="text-lg font-semibold text-slate-800">Filtros de Análisis</h3>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting || ranking.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        {isExporting ? 'Generando...' : 'Exportar Reporte Detallado'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Filtro de severidad */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Gravedad
                        </label>
                        <div className="flex gap-2">
                            {(['all', 'grave', 'moderada', 'leve'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setSeverityFilter(filter)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex-1 ${severityFilter === filter
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {filter === 'all' ? 'Todos' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

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

                    {/* Frecuencia mínima */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Frecuencia Mínima: {minFrequency}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={minFrequency}
                            onChange={(e) => setMinFrequency(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Radio de cluster */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Radio Cluster: {clusterRadius}m
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="50"
                            step="5"
                            value={clusterRadius}
                            onChange={(e) => setClusterRadius(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Modo eventos individuales */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Modo de visualización
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIndividualMode(false)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${!individualMode ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Agrupar (clusters)
                            </button>
                            <button
                                onClick={() => setIndividualMode(true)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${individualMode ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                Eventos individuales
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Total Clusters</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalClusters}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Total Eventos</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalEvents}</div>
                </div>

                <div
                    className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4 cursor-pointer hover:bg-red-100 hover:shadow-md transition-all"
                    onClick={() => stats.graveCount > 0 && handleCategoryClick('grave')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-red-700">Graves</div>
                        {stats.graveCount > 0 && (
                            <div className="text-xs text-red-600">👁️ Ver detalles</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.graveCount}</div>
                </div>

                <div
                    className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-4 cursor-pointer hover:bg-orange-100 hover:shadow-md transition-all"
                    onClick={() => stats.moderadaCount > 0 && handleCategoryClick('moderada')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-orange-700">Moderadas</div>
                        {stats.moderadaCount > 0 && (
                            <div className="text-xs text-orange-600">👁️ Ver detalles</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{stats.moderadaCount}</div>
                </div>

                <div
                    className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4 cursor-pointer hover:bg-yellow-100 hover:shadow-md transition-all"
                    onClick={() => stats.leveCount > 0 && handleCategoryClick('leve')}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-yellow-700">Leves</div>
                        {stats.leveCount > 0 && (
                            <div className="text-xs text-yellow-600">👁️ Ver detalles</div>
                        )}
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.leveCount}</div>
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
                                Mapa de Calor - Puntos Negros
                            </h3>
                        </div>

                        <div className="mb-4 flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Graves</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span>Moderadas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Leves</span>
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

                                {/* Clusters con MarkerClusterGroup */}
                                <MarkerClusterGroup>
                                    {clusters.filter(cluster => cluster.lat && cluster.lng).map((cluster, index) => (
                                        <CircleMarker
                                            key={`cluster-${index}`}
                                            center={[cluster.lat, cluster.lng]}
                                            radius={Math.max(8, Math.min(cluster.frequency * 2, 30))}
                                            pathOptions={{
                                                color: getSeverityColor(cluster.dominantSeverity),
                                                fillColor: getSeverityColor(cluster.dominantSeverity),
                                                fillOpacity: 0.7,
                                                weight: 2
                                            }}
                                        >
                                            <Popup maxWidth={400} className="custom-popup">
                                                <ClusterPopup
                                                    cluster={cluster}
                                                    onShowDetails={handleShowEventDetails}
                                                />
                                            </Popup>
                                            <LeafletTooltip>
                                                {cluster.location} - {cluster.frequency} eventos
                                            </LeafletTooltip>
                                        </CircleMarker>
                                    ))}
                                </MarkerClusterGroup>
                            </MapContainer>
                        </div>
                    </div>
                </div>

                {/* Ranking de zonas críticas */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            🏆 Ranking de Zonas Críticas
                        </h3>

                        <div className="space-y-3">
                            {ranking.map((zone, idx) => (
                                <div
                                    key={`zone-${zone.rank || idx}`}
                                    className="border border-slate-200 rounded-lg p-4 cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all"
                                    onClick={() => handleRankingClick(zone)}
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
                                                    <span>Total eventos:</span>
                                                    <span className="font-bold">{zone.totalEvents}</span>
                                                </div>

                                                <div className="flex gap-2 mt-2">
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                                        🔴 {zone.grave}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                                        🟠 {zone.moderada}
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

            {/* Modal de desglose de incidencias */}
            {showIncidentsModal && expandedCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">
                                    Incidencias {expandedCategory === 'grave' ? 'Graves' : expandedCategory === 'moderada' ? 'Moderadas' : 'Leves'}
                                </h3>
                                <button
                                    onClick={handleCloseIncidentsModal}
                                    className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="text-sm text-slate-600 mt-2">
                                Haz clic en cualquier incidencia para localizarla en el mapa
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
                                                expandedCategory === 'moderada' ? 'text-orange-600' :
                                                    'text-yellow-600'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800 mb-1">
                                                    <LocationDisplay
                                                        lat={incident.lat}
                                                        lng={incident.lng}
                                                        fallbackText={incident.location || 'Ubicación desconocida'}
                                                    />
                                                </div>
                                                <div className="text-sm text-slate-600 space-y-1">
                                                    <div className="flex justify-between">
                                                        <span>Frecuencia:</span>
                                                        <span className="font-bold">{incident.frequency} eventos</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Coordenadas:</span>
                                                        <span className="text-xs font-mono">
                                                            {incident.lat?.toFixed(6)}, {incident.lng?.toFixed(6)}
                                                        </span>
                                                    </div>
                                                    {incident.rotativo_on !== undefined && (
                                                        <div className="flex justify-between">
                                                            <span>Rotativo:</span>
                                                            <span className="font-bold">
                                                                {incident.rotativo_on ? '✅ ON' : '❌ OFF'}
                                                            </span>
                                                        </div>
                                                    )}
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

            {/* Modal de detalles de eventos */}
            {selectedCluster && (
                <EventDetailsErrorBoundary>
                    <EventDetailsModal
                        open={showEventDetails}
                        onClose={handleCloseEventDetails}
                        events={selectedCluster.events || []}
                        location={selectedCluster.location}
                        coordinates={{ lat: selectedCluster.lat, lng: selectedCluster.lng }}
                    />
                </EventDetailsErrorBoundary>
            )}
        </div>
    );
};

export default BlackSpotsTab;

