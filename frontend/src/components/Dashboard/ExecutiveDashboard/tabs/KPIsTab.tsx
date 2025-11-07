import {
    ChartBarIcon,
    ClockIcon,
    DocumentArrowDownIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { usePDFExport } from '../../../../hooks/usePDFExport';
import { useKPIs } from '../../../../hooks/useKPIs';
import { EventDetail } from '../../../../services/kpiService';
import { logger } from '../../../../utils/logger';
import { normalizeStabilityMetrics } from '../../../../utils/normalizeKPIs';
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

    // ✅ Normalizar métricas de estabilidad
    const stabilityNormalized = normalizeStabilityMetrics(stability);

    // ✅ Logging temporal para debugging
    useEffect(() => {
        logger.info('🔍 DEBUG KPIs recibidos en KPIsTab:', {
            stability_raw: stability,
            stability_normalized: stabilityNormalized,
            critical: stability?.critical,
            moderate: stability?.moderate,
            light: stability?.light,
            total_incidents: stability?.total_incidents,
            eventos_detallados: stability?.eventos_detallados,
            por_tipo: stability?.por_tipo
        });
    }, [stability, stabilityNormalized]);

    // Estado para modal de eventos detallados
    const [selectedSeverity, setSelectedSeverity] = useState<'critical' | 'moderate' | 'light' | null>(null);
    const [showEventsModal, setShowEventsModal] = useState(false);

    // Hook para exportación PDF
    const { exportEnhancedTabToPDF, isExporting } = usePDFExport();

    // Usar velocidad promedio del backend (ya calculada correctamente)
    const avgSpeed = (activity as any)?.average_speed || 0;

    // Función para manejar clic en incidencias
    const handleIncidentClick = (severity: 'critical' | 'moderate' | 'light') => {
        setSelectedSeverity(severity);
        setShowEventsModal(true);
    };

    // Obtener eventos según severidad seleccionada
    const getSelectedEvents = (): EventDetail[] => {
        if (!selectedSeverity || !stabilityNormalized.eventos_detallados) return [];
        return stabilityNormalized.eventos_detallados[selectedSeverity] || [];
    };

    return (
        <div className="h-full w-full bg-white p-4 overflow-auto" id="kpis-tab-content">
            {/* Botón Exportar PDF */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => exportEnhancedTabToPDF(
                        'kpis-tab-content',
                        'Reporte_KPIs_Ejecutivos',
                        {
                            title: 'KPIs Ejecutivos - Dashboard Bomberos',
                            subtitle: `Generado: ${new Date().toLocaleString('es-ES')}`,
                            kpis: {
                                horasConduccion: activity?.driving_hours_formatted || '00:00:00',
                                kmRecorridos: activity?.total_km?.toFixed(1) || '0',
                                velocidadPromedio: avgSpeed.toFixed(1),
                                tiempoRotativo: getStateDuration('EMERGENCIA', 'formatted'),
                                incidenciasTotales: stabilityNormalized.total_incidents,
                                graves: stabilityNormalized.critical,
                                moderadas: stabilityNormalized.moderate,
                                leves: stabilityNormalized.light
                            }
                        }
                    )}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    {isExporting ? 'Generando PDF...' : 'Exportar Reporte PDF'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4" id="kpis-main-grid">
                {/* COLUMNA 1: MÉTRICAS GENERALES */}
                <div className="bg-slate-50/50 rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5" />
                        Métricas Generales
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
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
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <KeyIcon className="h-5 w-5" />
                        Claves Operacionales
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <KPICard
                            title="Clave 0 (Taller)"
                            value={getStateDuration(0)}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            colorClass="text-red-600"
                            subtitle="Mantenimiento"
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
                            title="Clave 5 (Regreso sin Rotativo)"
                            value={getStateDuration(5)}
                            icon={<ClockIcon className="h-5 w-5" />}
                            colorClass="text-green-600"
                            subtitle="Vuelta al parque"
                        />
                    </div>
                </div>

                {/* COLUMNA 3: INCIDENCIAS */}
                <div className="bg-slate-50/50 rounded-lg p-3 border-l-4 border-red-500 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5" />
                        Incidencias de Estabilidad
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <KPICard
                            title="Total Incidencias"
                            value={stabilityNormalized.total_incidents}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            colorClass="text-slate-600"
                            subtitle="Total eventos registrados"
                        />
                        <KPICard
                            title="Graves (SI < 0.20)"
                            value={stabilityNormalized.critical}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            colorClass="text-red-600"
                            subtitle="Alta severidad (clic para ver)"
                            onClick={() => handleIncidentClick('critical')}
                        />
                        <KPICard
                            title="Moderadas (0.20-0.35)"
                            value={stabilityNormalized.moderate}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            colorClass="text-orange-600"
                            subtitle="Severidad media (clic para ver)"
                            onClick={() => handleIncidentClick('moderate')}
                        />
                        <KPICard
                            title="Leves (0.35-0.50)"
                            value={stabilityNormalized.light}
                            icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                            colorClass="text-green-600"
                            subtitle="Baja severidad (clic para ver)"
                            onClick={() => handleIncidentClick('light')}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de eventos detallados */}
            {showEventsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowEventsModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-6 w-6" />
                                Eventos {selectedSeverity === 'critical' ? 'Críticos' : selectedSeverity === 'moderate' ? 'Moderados' : 'Leves'}
                                ({getSelectedEvents().length})
                            </h3>
                            <button
                                onClick={() => setShowEventsModal(false)}
                                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {getSelectedEvents().length > 0 ? (
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Vehículo
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Fecha Sesión
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Tipo de Evento
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Índice SI
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Hora Evento
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {getSelectedEvents().map((evento, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">
                                                    {evento.vehicle_identifier}
                                                    {evento.vehicle_name && (
                                                        <span className="text-xs text-slate-500 block">{evento.vehicle_name}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                                    {evento.session_date ? new Date(evento.session_date).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {evento.tipo || 'Sin tipo'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className={`px-2 py-1 rounded font-semibold ${evento.si < 0.20 ? 'bg-red-100 text-red-800' :
                                                        evento.si < 0.35 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {evento.si.toFixed(3)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                                    {evento.timestamp ? new Date(evento.timestamp).toLocaleTimeString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    }) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    No hay eventos para mostrar
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KPIsTab;

