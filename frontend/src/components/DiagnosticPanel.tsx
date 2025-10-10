import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface DiagnosticData {
    geofences: {
        total: number;
        active: number;
        byType: {
            parques: number;
            talleres: number;
            otros: number;
        };
    };
    events: {
        total: number;
        withGPS: number;
        withoutGPS: number;
        percentageWithGPS: number;
    };
    sessions: {
        total: number;
        withRotativo: number;
        withoutRotativo: number;
        percentageWithRotativo: number;
    };
    preferences: {
        lastLoaded: string;
        timezone: string;
    };
    roadTypes: {
        catalogAvailable: boolean;
        eventsWithoutRoadType: number;
    };
}

export const DiagnosticPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DiagnosticData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !data) {
            loadDiagnosticData();
        }
    }, [isOpen]);

    const loadDiagnosticData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar datos de diagnóstico desde el backend
            const response = await apiService.get<{ success: boolean; data: DiagnosticData }>('/api/diagnostics/dashboard');

            if (response.success && response.data) {
                setData(response.data);
            } else {
                throw new Error('Error al cargar datos de diagnóstico');
            }
        } catch (err) {
            logger.error('Error cargando diagnóstico:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: 'ok' | 'warning' | 'error') => {
        switch (status) {
            case 'ok':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
            case 'error':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
    };

    const getGeofenceStatus = (): 'ok' | 'warning' | 'error' => {
        if (!data) return 'warning';
        if (data.geofences.active === 0) return 'error';
        if (data.geofences.active < 5) return 'warning';
        return 'ok';
    };

    const getGPSStatus = (): 'ok' | 'warning' | 'error' => {
        if (!data) return 'warning';
        if (data.events.percentageWithGPS >= 95) return 'ok';
        if (data.events.percentageWithGPS >= 80) return 'warning';
        return 'error';
    };

    const getRotativoStatus = (): 'ok' | 'warning' | 'error' => {
        if (!data) return 'warning';
        if (data.sessions.percentageWithRotativo >= 95) return 'ok';
        if (data.sessions.percentageWithRotativo >= 80) return 'warning';
        return 'error';
    };

    const getRoadTypeStatus = (): 'ok' | 'warning' | 'error' => {
        if (!data) return 'warning';
        if (!data.roadTypes.catalogAvailable) return 'error';
        if (data.roadTypes.eventsWithoutRoadType > 100) return 'warning';
        return 'ok';
    };

    return (
        <div className="relative">
            {/* Botón de toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                aria-label="Toggle Diagnostic Panel"
            >
                <InformationCircleIcon className="h-4 w-4" />
                <span>⚙️ Diagnóstico</span>
                {isOpen ? (
                    <span className="text-xs">▲</span>
                ) : (
                    <span className="text-xs">▼</span>
                )}
            </button>

            {/* Panel colapsable */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Panel de Diagnóstico del Dashboard
                        </h3>

                        {loading && (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 text-red-700 text-sm">
                                    <XCircleIcon className="h-5 w-5" />
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {data && !loading && (
                            <div className="space-y-3">
                                {/* Geocercas */}
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(getGeofenceStatus())}
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 text-sm">
                                                Geocercas cargadas
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                {data.geofences.active} activas de {data.geofences.total} totales
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                Parques: {data.geofences.byType.parques} | Talleres: {data.geofences.byType.talleres}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Eventos sin GPS */}
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(getGPSStatus())}
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 text-sm">
                                                Eventos sin GPS
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                {data.events.withoutGPS} de {data.events.total} ({(100 - data.events.percentageWithGPS).toFixed(1)}% sin geolocalizar)
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {data.events.percentageWithGPS.toFixed(1)}% de eventos tienen coordenadas GPS
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sesiones sin rotativo */}
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(getRotativoStatus())}
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 text-sm">
                                                Sesiones sin rotativo
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                {data.sessions.withoutRotativo} de {data.sessions.total} ({(100 - data.sessions.percentageWithRotativo).toFixed(1)}%)
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {data.sessions.percentageWithRotativo.toFixed(1)}% de sesiones tienen datos de rotativo
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Catálogo de velocidad */}
                                <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        {getStatusIcon(getRoadTypeStatus())}
                                        <div className="flex-1">
                                            <div className="font-medium text-slate-800 text-sm">
                                                Catálogo de velocidad
                                            </div>
                                            <div className="text-xs text-slate-600 mt-1">
                                                {data.roadTypes.catalogAvailable ? '✅ Disponible' : '❌ No disponible'}
                                            </div>
                                            {data.roadTypes.eventsWithoutRoadType > 0 && (
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {data.roadTypes.eventsWithoutRoadType} eventos sin tipo de vía
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Información del sistema */}
                                <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                                        <div className="flex-1">
                                            <div className="font-medium text-blue-800 text-sm">
                                                Configuración del sistema
                                            </div>
                                            <div className="text-xs text-blue-700 mt-1">
                                                Última carga de preferencias: {data.preferences.lastLoaded}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">
                                                Zona horaria: {data.preferences.timezone}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botón de recargar */}
                                <button
                                    onClick={loadDiagnosticData}
                                    disabled={loading}
                                    className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    {loading ? 'Recargando...' : '🔄 Recargar Diagnóstico'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosticPanel;

