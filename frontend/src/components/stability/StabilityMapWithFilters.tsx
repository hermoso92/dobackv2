import {
    ArrowUpIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { StabilityEvent } from '../../api/kpi';
import { apiService } from '../../services/api';
import { CriticalPoint } from '../../types/deviceControl';
import { logger } from '../../utils/logger';
import UnifiedMapComponent from '../maps/UnifiedMapComponent';

interface StabilityMapWithFiltersProps {
    events?: StabilityEvent[]; // Hacer opcional para cargar desde backend
    onPointClick?: (point: any) => void;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
    parkId?: string;
}

const StabilityMapWithFilters: React.FC<StabilityMapWithFiltersProps> = ({
    events: propEvents,
    onPointClick,
    vehicleIds,
    startDate,
    endDate,
    parkId
}) => {
    // Estados de filtros
    const [severityFilter, setSeverityFilter] = useState<'all' | 'grave' | 'moderada' | 'leve'>('all');
    const [minFrequency, setMinFrequency] = useState<number>(1);
    const [selectedPoint, setSelectedPoint] = useState<CriticalPoint | null>(null);

    // Estados para datos del backend
    const [, setEvents] = useState<StabilityEvent[]>(propEvents || []);
    const [criticalPoints, setCriticalPoints] = useState<CriticalPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos del backend si no se proporcionan eventos
    useEffect(() => {
        if (!propEvents || propEvents.length === 0) {
            loadStabilityData();
        } else {
            setEvents(propEvents);
        }
    }, [propEvents, vehicleIds, startDate, endDate, parkId]);

    const loadStabilityData = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando datos de estabilidad desde backend');

            // Construir parámetros de consulta
            const params = new URLSearchParams();
            if (vehicleIds && vehicleIds.length > 0) {
                params.append('vehicleIds', vehicleIds.join(','));
            }
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (parkId) params.append('parkId', parkId);

            // Cargar eventos de estabilidad
            const eventsResponse = await apiService.get<{ success: boolean; data: { events: StabilityEvent[] } }>(
                `/api/stability-filters/events?${params.toString()}`
            );

            if (eventsResponse.success && eventsResponse.data) {
                const events = (eventsResponse.data as any).events || [];
                setEvents(events);
                logger.info(`Cargados ${events.length} eventos de estabilidad`);
            }

            // Cargar puntos críticos
            const criticalPointsResponse = await apiService.get<{ success: boolean; data: { criticalPoints: CriticalPoint[] } }>(
                `/api/stability-filters/critical-points?${params.toString()}`
            );

            if (criticalPointsResponse.success && criticalPointsResponse.data) {
                const criticalPoints = (criticalPointsResponse.data as any).criticalPoints || [];
                setCriticalPoints(criticalPoints);
                logger.info(`Cargados ${criticalPoints.length} puntos críticos`);
            }

        } catch (err) {
            logger.error('Error cargando datos de estabilidad:', err);
            setError('Error al cargar datos de estabilidad');
        } finally {
            setLoading(false);
        }
    };

    // Aplicar filtros
    const filteredPoints = useMemo(() => {
        return criticalPoints.filter((point) => {
            // Filtro de severidad
            if (severityFilter !== 'all' && point.severity !== severityFilter) {
                return false;
            }
            // Filtro de frecuencia mínima
            if (point.frequency < minFrequency) {
                return false;
            }
            return true;
        });
    }, [criticalPoints, severityFilter, minFrequency]);

    // Ordenar puntos críticos por frecuencia
    const rankedPoints = useMemo(() => {
        return [...filteredPoints].sort((a, b) => {
            // Primero por frecuencia
            if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency;
            }
            // Luego por severidad
            const severityOrder = { grave: 3, moderada: 2, leve: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }, [filteredPoints]);

    // Convertir puntos a formato del mapa
    const mapPoints = useMemo(() => {
        return filteredPoints.map((point) => ({
            id: point.id,
            lat: point.lat,
            lng: point.lng,
            type: 'alert' as const,
            title: `${point.location} (${point.frequency}x)`,
            description: `Ubicación: ${point.location}\nFrecuencia: ${point.frequency} eventos\nSeveridad: ${point.severity}\nÚltima ocurrencia: ${new Date(point.lastOccurrence).toLocaleString('es-ES')}\nVehículos: ${point.vehicleIds.length}`,
            timestamp: new Date(point.lastOccurrence)
        }));
    }, [filteredPoints]);

    const getSeverityColor = (severity: 'grave' | 'moderada' | 'leve') => {
        switch (severity) {
            case 'grave':
                return 'bg-red-500 text-white';
            case 'moderada':
                return 'bg-orange-500 text-white';
            case 'leve':
                return 'bg-yellow-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const handlePointClick = (point: CriticalPoint) => {
        setSelectedPoint(point);
        // Zoom al punto en el mapa
        if (onPointClick) {
            onPointClick({
                id: point.id,
                lat: point.lat,
                lng: point.lng,
                type: 'alert' as const,
                title: `${point.location} (${point.frequency}x)`,
                description: `Ubicación: ${point.location}\nFrecuencia: ${point.frequency} eventos\nSeveridad: ${point.severity}`,
                timestamp: new Date(point.lastOccurrence)
            });
        }
    };

    return (
        <div className="space-y-6">
            {loading && (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-slate-600">Cargando datos de estabilidad...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {!loading && !error && (
                <>
                    {/* Filtros */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-2 mb-4">
                            <FunnelIcon className="h-5 w-5 text-slate-600" />
                            <h3 className="text-lg font-semibold text-slate-800">Filtros de Análisis</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Filtro de severidad */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Gravedad
                                </label>
                                <div className="flex gap-2">
                                    {(['all', 'grave', 'moderada', 'leve'] as const).map((severity) => (
                                        <button
                                            key={severity}
                                            onClick={() => setSeverityFilter(severity)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${severityFilter === severity
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {severity === 'all' ? 'Todas' : severity.charAt(0).toUpperCase() + severity.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Filtro de frecuencia */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Frecuencia mínima: {minFrequency}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={minFrequency}
                                    onChange={(e) => setMinFrequency(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>1</span>
                                    <span>10+</span>
                                </div>
                            </div>
                        </div>

                        {/* Estadísticas de filtros */}
                        <div className="mt-4 flex gap-4 text-sm text-slate-600">
                            <div>
                                <span className="font-medium">Total de puntos:</span> {criticalPoints.length}
                            </div>
                            <div>
                                <span className="font-medium">Filtrados:</span> {filteredPoints.length}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Mapa de calor */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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
                            </div>
                            <div className="h-[600px] rounded-xl border border-slate-300 overflow-hidden">
                                <UnifiedMapComponent
                                    center={[40.5149, -3.7578]}
                                    zoom={12}
                                    height="100%"
                                    points={mapPoints}
                                    onPointClick={onPointClick}
                                    showControls={true}
                                />
                            </div>
                        </div>

                        {/* Ranking de puntos críticos */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPinIcon className="h-5 w-5 text-slate-600" />
                                <h3 className="text-lg font-semibold text-slate-800">Puntos Críticos</h3>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                {rankedPoints.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">
                                        <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No hay puntos que coincidan con los filtros</p>
                                    </div>
                                ) : (
                                    rankedPoints.map((point, index) => (
                                        <div
                                            key={point.id}
                                            onClick={() => handlePointClick(point)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedPoint?.id === point.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="flex-shrink-0 w-6 h-6 bg-slate-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(point.severity)}`}>
                                                            {point.severity}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-slate-600">
                                                            <ArrowUpIcon className="h-3 w-3" />
                                                            {point.frequency}x
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-800 truncate">{point.location}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {point.vehicleIds.length} vehículo{point.vehicleIds.length !== 1 ? 's' : ''}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Última: {new Date(point.lastOccurrence).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StabilityMapWithFilters;
