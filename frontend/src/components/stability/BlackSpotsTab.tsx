import {
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
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface BlackSpotsTabProps {
    organizationId: string;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
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
    endDate
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

            if (rankingResponse.success && rankingResponse.data) {
                const rootRank: any = rankingResponse as any;
                const dataRank: any = (rootRank.data && rootRank.data.data) ? rootRank.data.data : rankingResponse.data;
                setRanking(Array.isArray(dataRank?.ranking) ? dataRank.ranking : []);
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
                <div className="flex items-center gap-2 mb-4">
                    <FunnelIcon className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-800">Filtros de Análisis</h3>
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

                <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4">
                    <div className="text-sm font-medium text-red-700 mb-1">Graves</div>
                    <div className="text-2xl font-bold text-red-600">{stats.graveCount}</div>
                </div>

                <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-4">
                    <div className="text-sm font-medium text-orange-700 mb-1">Moderadas</div>
                    <div className="text-2xl font-bold text-orange-600">{stats.moderadaCount}</div>
                </div>

                <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
                    <div className="text-sm font-medium text-yellow-700 mb-1">Leves</div>
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
                                            <Popup maxWidth={350} className="custom-popup">
                                                <div className="p-3">
                                                    {/* Encabezado con ubicación */}
                                                    <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg px-4 py-2 mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            <div className="font-bold text-base">{cluster.location}</div>
                                                        </div>
                                                    </div>

                                                    {/* Estadísticas principales */}
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                                            <div className="text-xs text-slate-600 mb-1">Total Eventos</div>
                                                            <div className="text-xl font-bold text-slate-800">{cluster.frequency}</div>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                                                            <div className="text-xs text-slate-600 mb-1">Vehículos</div>
                                                            <div className="text-xl font-bold text-slate-800">{cluster.vehicleIds?.length || 0}</div>
                                                        </div>
                                                    </div>

                                                    {/* Severidades con badges coloreados */}
                                                    <div className="space-y-2 mb-3">
                                                        <div className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                                                            <span className="text-sm font-medium text-red-700">🔴 Graves</span>
                                                            <span className="text-sm font-bold text-red-900">{cluster.severity_counts?.grave || 0}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2 border border-orange-200">
                                                            <span className="text-sm font-medium text-orange-700">🟠 Moderadas</span>
                                                            <span className="text-sm font-bold text-orange-900">{cluster.severity_counts?.moderada || 0}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-200">
                                                            <span className="text-sm font-medium text-yellow-700">🟡 Leves</span>
                                                            <span className="text-sm font-bold text-yellow-900">{cluster.severity_counts?.leve || 0}</span>
                                                        </div>
                                                    </div>

                                                    {/* Vehículos involucrados */}
                                                    {cluster.events && cluster.events.length > 0 && (
                                                        <div className="mb-3">
                                                            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Vehículos Involucrados
                                                            </div>
                                                            <div className="max-h-24 overflow-y-auto space-y-1">
                                                                {[...new Set(cluster.events.map((e: any) => e.vehicleName || e.vehicleId))].map((vehicleName: any, idx: number) => (
                                                                    <div key={idx} className="bg-blue-50 rounded px-2 py-1 text-xs font-medium text-blue-800 border border-blue-200">
                                                                        🚒 {vehicleName}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Última ocurrencia */}
                                                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                        <div className="text-xs text-slate-600 mb-1">📅 Última Ocurrencia</div>
                                                        <div className="text-sm font-semibold text-slate-800">
                                                            {cluster.lastOccurrence ? new Date(cluster.lastOccurrence).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
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
                                                {zone.location}
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
        </div>
    );
};

export default BlackSpotsTab;

