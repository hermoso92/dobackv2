import {
    ChartBarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { StabilityEvent } from '../../api/kpi';
import {
    getViolationColor
} from '../../config/dgtVehicleCategories';
import { apiService } from '../../services/api';
import { SpeedViolation } from '../../types/deviceControl';
import { logger } from '../../utils/logger';
import UnifiedMapComponent from '../maps/UnifiedMapComponent';

interface VelocityMapWithDGTFiltersProps {
    events?: StabilityEvent[]; // Hacer opcional para cargar desde backend
    onPointClick?: (point: any) => void;
    vehicleIds?: string[];
    startDate?: string;
    endDate?: string;
    parkId?: string;
}

const VelocityMapWithDGTFilters: React.FC<VelocityMapWithDGTFiltersProps> = ({
    events: propEvents,
    onPointClick,
    vehicleIds,
    startDate,
    endDate,
    parkId
}) => {
    // Estados de filtros
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'on' | 'off'>('all');
    const [parkFilter, setParkFilter] = useState<'all' | 'in' | 'out'>('all');
    const [violationFilter, setViolationFilter] = useState<'all' | 'grave' | 'leve' | 'correcto'>('all');

    // Estados para datos del backend
    const [, setEvents] = useState<StabilityEvent[]>(propEvents || []);
    const [speedViolations, setSpeedViolations] = useState<SpeedViolation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos del backend si no se proporcionan eventos
    useEffect(() => {
        if (!propEvents || propEvents.length === 0) {
            loadSpeedData();
        } else {
            setEvents(propEvents);
        }
    }, [propEvents, vehicleIds, startDate, endDate, parkId]);

    const loadSpeedData = async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando datos de velocidad desde backend');

            // Construir parámetros de consulta
            const params = new URLSearchParams();
            if (vehicleIds && vehicleIds.length > 0) {
                params.append('vehicleIds', vehicleIds.join(','));
            }
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (parkId) params.append('parkId', parkId);

            // Cargar violaciones de velocidad
            const response = await apiService.get<{ success: boolean; data: { violations: SpeedViolation[] } }>(
                `/api/speed/violations?${params.toString()}`
            );

            if (response.success && response.data) {
                const violations = (response.data as any).violations || [];
                setSpeedViolations(violations);
                logger.info(`Cargadas ${violations.length} violaciones de velocidad`);
            }

        } catch (err) {
            logger.error('Error cargando datos de velocidad:', err);
            setError('Error al cargar datos de velocidad');
        } finally {
            setLoading(false);
        }
    };

    // Aplicar filtros
    const filteredViolations = useMemo(() => {
        return speedViolations.filter((violation) => {
            // Filtro de rotativo
            if (rotativoFilter === 'on' && !violation.rotativoOn) return false;
            if (rotativoFilter === 'off' && violation.rotativoOn) return false;

            // Filtro de parque
            if (parkFilter === 'in' && !violation.inPark) return false;
            if (parkFilter === 'out' && violation.inPark) return false;

            // Filtro de tipo de violación
            if (violationFilter !== 'all' && violation.violationType !== violationFilter) return false;

            return true;
        });
    }, [speedViolations, rotativoFilter, parkFilter, violationFilter]);

    // Estadísticas
    const stats = useMemo(() => {
        const total = filteredViolations.length;
        const graves = filteredViolations.filter(v => v.violationType === 'grave').length;
        const leves = filteredViolations.filter(v => v.violationType === 'leve').length;
        const correctos = filteredViolations.filter(v => v.violationType === 'correcto').length;

        const withRotativo = filteredViolations.filter(v => v.rotativoOn).length;
        const withoutRotativo = filteredViolations.filter(v => !v.rotativoOn).length;

        const avgSpeedExcess = filteredViolations
            .filter(v => v.violationType !== 'correcto')
            .reduce((sum, v) => sum + (v.speed - v.speedLimit), 0) /
            (filteredViolations.length - correctos || 1);

        return {
            total,
            graves,
            leves,
            correctos,
            withRotativo,
            withoutRotativo,
            avgSpeedExcess: Math.round(avgSpeedExcess * 10) / 10
        };
    }, [filteredViolations]);

    // Convertir violaciones a puntos del mapa
    const mapPoints = useMemo(() => {
        return filteredViolations.map((violation) => ({
            id: violation.id,
            lat: violation.lat,
            lng: violation.lng,
            type: 'alert' as const,
            title: `${violation.vehicleName} - ${violation.speed} km/h`,
            description: `Vehículo: ${violation.vehicleName}\nVelocidad: ${violation.speed} km/h\nLímite: ${violation.speedLimit} km/h\nExceso: ${(violation.speed - violation.speedLimit).toFixed(2)} km/h\nRotativo: ${violation.rotativoOn ? 'ON' : 'OFF'}\nZona: ${violation.inPark ? 'Dentro del parque' : 'Fuera del parque'}\nTipo de vía: ${violation.roadType}\nClasificación: ${violation.violationType}\nFecha: ${new Date(violation.timestamp).toLocaleString('es-ES')}`,
            timestamp: new Date(violation.timestamp),
            color: getViolationColor(violation.violationType)
        }));
    }, [filteredViolations]);

    return (
        <div className="space-y-6">
            {loading && (
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-slate-600">Cargando datos de velocidad...</span>
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
                            <h3 className="text-lg font-semibold text-slate-800">Filtros de Análisis de Velocidad</h3>
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

                            {/* Filtro de parque */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Ubicación
                                </label>
                                <div className="flex gap-2">
                                    {(['all', 'in', 'out'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setParkFilter(filter)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex-1 ${parkFilter === filter
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {filter === 'all' ? 'Todos' : filter === 'in' ? 'En Parque' : 'Fuera'}
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
                                    {(['all', 'grave', 'leve', 'correcto'] as const).map((filter) => (
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
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ChartBarIcon className="h-5 w-5 text-slate-600" />
                                <span className="text-sm font-medium text-slate-700">Total</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                        </div>

                        <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                                <span className="text-sm font-medium text-red-700">Graves</span>
                            </div>
                            <div className="text-2xl font-bold text-red-600">{stats.graves}</div>
                            <div className="text-xs text-red-500 mt-1">Exceso &gt;20 km/h</div>
                        </div>

                        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-700">Leves</span>
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">{stats.leves}</div>
                            <div className="text-xs text-yellow-500 mt-1">Exceso 1-20 km/h</div>
                        </div>

                        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">Correctos</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{stats.correctos}</div>
                            <div className="text-xs text-blue-500 mt-1">Dentro del límite</div>
                        </div>
                    </div>

                    {/* Estadísticas adicionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Por Estado del Rotativo</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Rotativo ON (Emergencias):</span>
                                    <span className="text-sm font-bold text-red-600">{stats.withRotativo}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-600">Rotativo OFF (Servicios):</span>
                                    <span className="text-sm font-bold text-orange-600">{stats.withoutRotativo}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Promedio de Exceso</h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800">{stats.avgSpeedExcess}</span>
                                <span className="text-sm text-slate-500">km/h</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Promedio de exceso de velocidad en violaciones</p>
                        </div>
                    </div>

                    {/* Mapa */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Mapa de Velocidad - Eventos Clasificados</h3>
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
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Correctos (dentro del límite)</span>
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
                </>
            )}
        </div>
    );
};

export default VelocityMapWithDGTFilters;
