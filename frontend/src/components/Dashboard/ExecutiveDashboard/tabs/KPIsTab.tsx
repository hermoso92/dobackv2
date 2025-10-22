import {
    ChartBarIcon,
    ClockIcon,
    CpuChipIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    MapIcon,
    PowerIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { useKPIs } from '../../../../hooks/useKPIs';
import { KPICard } from '../components/KPICard';

/**
 * Tab principal de KPIs ejecutivos
 * Muestra métricas generales, claves operacionales e incidencias
 */
export const KPIsTab: React.FC = () => {
    const {
        getStateDuration,
        states,
        activity,
        stability,
        quality
    } = useKPIs();

    // Calcular velocidad promedio
    const avgSpeed = activity?.km_total && activity?.driving_hours && activity.driving_hours > 0.1
        ? Math.round(activity.km_total / activity.driving_hours)
        : 0;

    return (
        <div className="h-full w-full bg-white p-2 overflow-auto" id="kpis-tab-content">
            <div className="grid grid-cols-3 gap-3 mb-6" id="kpis-main-grid">
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
                            title="Clave 4 (Retirada)"
                            value={getStateDuration(4)}
                            icon={<ClockIcon className="h-5 w-5" />}
                            colorClass="text-blue-600"
                            subtitle="Fin de actuación"
                        />
                        <KPICard
                            title="Clave 5 (Sin Rotativo)"
                            value={getStateDuration(5)}
                            icon={<ClockIcon className="h-5 w-5" />}
                            colorClass="text-orange-600"
                            subtitle="Servicios programados"
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

            {/* Tabla de eventos por tipo */}
            {stability?.por_tipo && Object.keys(stability.por_tipo).length > 0 && (
                <div className="mt-6 px-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CpuChipIcon className="h-5 w-5" />
                        Detalle de Eventos por Tipo
                    </h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
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
                                        <tr key={tipo} className="hover:bg-slate-50">
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
        </div>
    );
};

export default KPIsTab;

