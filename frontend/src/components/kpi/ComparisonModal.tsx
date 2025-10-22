import { ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { DashboardComparison } from '../../api/kpi';
import { logger } from '../../utils/logger';

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPeriod: string;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
    isOpen,
    onClose,
    selectedPeriod
}) => {
    const [comparisonData, setComparisonData] = useState<DashboardComparison | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadComparisonData();
        }
    }, [isOpen, selectedPeriod]);

    const loadComparisonData = async () => {
        try {
            setLoading(true);
            // Usar datos mock temporalmente mientras solucionamos el backend
            const mockData: DashboardComparison = {
                day: {
                    timeInPark: 156.5,
                    timeOutOfPark: 43.2,
                    totalEvents: 47,
                    complianceRate: 94.2
                },
                week: {
                    timeInPark: 1200.8,
                    timeOutOfPark: 320.5,
                    totalEvents: 312,
                    complianceRate: 92.1
                },
                month: {
                    timeInPark: 4800.2,
                    timeOutOfPark: 1280.3,
                    totalEvents: 1247,
                    complianceRate: 89.7
                }
            };

            setComparisonData(mockData);

            // Intentar cargar datos reales del backend (comentado temporalmente)
            // const periods = ['day', 'week', 'month'];
            // const data = await compareDashboardPeriods(periods);
            // setComparisonData(data);
        } catch (error) {
            toast.error('Error cargando datos de comparativa');
            logger.error('Error loading comparison data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <ChartBarIcon className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-slate-800">
                            Comparativa de Períodos
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-slate-600">Cargando comparativa...</span>
                        </div>
                    ) : comparisonData ? (
                        <div className="space-y-6">
                            {/* Resumen ejecutivo */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-slate-800 mb-3">
                                    Resumen Ejecutivo
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {Object.keys(comparisonData).length}
                                        </div>
                                        <div className="text-sm text-slate-600">Períodos comparados</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Math.round(
                                                Object.values(comparisonData).reduce((acc, period) =>
                                                    acc + period.complianceRate, 0
                                                ) / Object.keys(comparisonData).length
                                            )}%
                                        </div>
                                        <div className="text-sm text-slate-600">Cumplimiento promedio</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {Math.round(
                                                Object.values(comparisonData).reduce((acc, period) =>
                                                    acc + period.totalEvents, 0
                                                ) / Object.keys(comparisonData).length
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-600">Eventos promedio</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de comparativa */}
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                                                Período
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                Tiempo en Parque (h)
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                Tiempo Fuera (h)
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                Total Eventos
                                            </th>
                                            <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                                                Cumplimiento (%)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(comparisonData).map(([period, data]) => (
                                            <tr
                                                key={period}
                                                className={`border-t border-slate-200 ${period === selectedPeriod ? 'bg-blue-50' : 'hover:bg-slate-50'
                                                    }`}
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                                    {period === 'day' ? 'Hoy' :
                                                        period === 'week' ? 'Esta semana' :
                                                            'Este mes'}
                                                    {period === selectedPeriod && (
                                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                            Actual
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-slate-600">
                                                    {data.timeInPark.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-slate-600">
                                                    {data.timeOutOfPark.toFixed(1)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-slate-600">
                                                    {data.totalEvents}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${data.complianceRate >= 95 ? 'bg-green-100 text-green-800' :
                                                        data.complianceRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {data.complianceRate.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Gráfico de tendencias */}
                            <div className="bg-white border border-slate-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                                    Tendencias por Período
                                </h3>
                                <div className="space-y-4">
                                    {/* Barra de cumplimiento */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">
                                                Tasa de Cumplimiento
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                {Math.round(
                                                    Object.values(comparisonData).reduce((acc, period) =>
                                                        acc + period.complianceRate, 0
                                                    ) / Object.keys(comparisonData).length
                                                )}% promedio
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(comparisonData).map(([period, data]) => (
                                                <div key={period} className="flex items-center gap-3">
                                                    <div className="w-20 text-sm text-slate-600">
                                                        {period === 'day' ? 'Hoy' :
                                                            period === 'week' ? 'Semana' : 'Mes'}
                                                    </div>
                                                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${data.complianceRate >= 95 ? 'bg-green-500' :
                                                                data.complianceRate >= 90 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                            style={{ width: `${data.complianceRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <div className="w-12 text-sm text-slate-600 text-right">
                                                        {data.complianceRate.toFixed(1)}%
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Barra de eventos */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-slate-700">
                                                Total de Eventos
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                {Math.round(
                                                    Object.values(comparisonData).reduce((acc, period) =>
                                                        acc + period.totalEvents, 0
                                                    ) / Object.keys(comparisonData).length
                                                )} promedio
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(comparisonData).map(([period, data]) => {
                                                const maxEvents = Math.max(...Object.values(comparisonData).map(p => p.totalEvents));
                                                return (
                                                    <div key={period} className="flex items-center gap-3">
                                                        <div className="w-20 text-sm text-slate-600">
                                                            {period === 'day' ? 'Hoy' :
                                                                period === 'week' ? 'Semana' : 'Mes'}
                                                        </div>
                                                        <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                            <div
                                                                className="h-2 rounded-full bg-blue-500"
                                                                style={{ width: `${(data.totalEvents / maxEvents) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <div className="w-12 text-sm text-slate-600 text-right">
                                                            {data.totalEvents}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <ChartBarIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600">No hay datos de comparativa disponibles</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
