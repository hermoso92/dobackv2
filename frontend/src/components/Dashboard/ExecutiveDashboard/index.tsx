import { ChartBarIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { getOrganizationId } from '../../../config/organization';
import { useAuth } from '../../../hooks/useAuth';
import { useGlobalFilters } from '../../../hooks/useGlobalFilters';
import { logger } from '../../../utils/logger';
import { useRouteExportFunction } from '../../sessions/SessionsAndRoutesView';
import { Button } from '../../ui/Button';
import { useDashboardExport } from './hooks/useDashboardExport';
import { useDashboardMaps } from './hooks/useDashboardMaps';
import { useDashboardParks } from './hooks/useDashboardParks';
import { SessionData } from './types';

// Lazy load de tabs
import OperationalKeysTab from '../../operations/OperationalKeysTab';
import { SessionsAndRoutesView } from '../../sessions/SessionsAndRoutesView';
import SpeedAnalysisTab from '../../speed/SpeedAnalysisTab';
import BlackSpotsTab from '../../stability/BlackSpotsTab';
import KPIsTab from './tabs/KPIsTab';

/**
 * Dashboard Ejecutivo Refactorizado
 * Orquesta los 5 tabs principales del dashboard
 */
export const ExecutiveDashboard: React.FC = () => {
    const { user } = useAuth();
    const { filters } = useGlobalFilters();
    const exportRouteFunction = useRouteExportFunction();

    // Estados locales
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSessionData, setSelectedSessionData] = useState<SessionData | null>(null);

    // Hooks personalizados
    const { heatmapData, speedViolations, blackSpotsData, reload: reloadMaps } = useDashboardMaps();
    const { parksKPIs, reload: reloadParks } = useDashboardParks();
    const { exportTab, exporting, error: exportError } = useDashboardExport();

    /**
     * Carga inicial del dashboard
     */
    useEffect(() => {
        let mounted = true;

        const initialize = async () => {
            try {
                if (!mounted) return;

                setLoading(true);
                setError(null);

                // Simular carga inicial
                await new Promise(resolve => setTimeout(resolve, 500));

                logger.info('Dashboard ejecutivo inicializado');
            } catch (err) {
                if (mounted) {
                    const errorMessage = err instanceof Error ? err.message : 'Error inicializando dashboard';
                    setError(errorMessage);
                    logger.error('Error inicializando dashboard', { error: err });
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initialize();

        return () => {
            mounted = false;
        };
    }, []);

    /**
     * Maneja la exportación según el tab activo
     */
    const handleExport = useCallback(async () => {
        try {
            if (activeTab === 4 && selectedSessionData) {
                // Exportar recorrido (tab 4)
                exportRouteFunction(selectedSessionData.session, selectedSessionData.routeData);
            } else {
                // Exportar tab actual
                await exportTab(activeTab, {
                    heatmapData,
                    speedViolations,
                    blackSpotsData,
                    parksKPIs
                });
            }
        } catch (err) {
            logger.error('Error exportando', { error: err });
        }
    }, [activeTab, selectedSessionData, exportTab, exportRouteFunction, heatmapData, speedViolations, blackSpotsData, parksKPIs]);

    /**
     * Recarga datos del tab activo
     */
    const handleRefresh = useCallback(() => {
        logger.info('Recargando datos del dashboard');
        reloadMaps();
        reloadParks();
    }, [reloadMaps, reloadParks]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600">
                    <p className="font-semibold">Error cargando dashboard</p>
                    <p className="text-sm mt-2">{error}</p>
                    <Button onClick={handleRefresh} variant="primary" className="mt-4">
                        Reintentar
                    </Button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 0, name: 'Panel General', icon: ChartBarIcon },
        { id: 1, name: 'Puntos Negros', icon: ChartBarIcon },
        { id: 2, name: 'Velocidad', icon: ChartBarIcon },
        { id: 3, name: 'Claves Operacionales', icon: ChartBarIcon },
        { id: 4, name: 'Sesiones y Rutas', icon: ChartBarIcon }
    ];

    return (
        <div className="h-full flex flex-col bg-slate-100">
            {/* Header con tabs y botón exportar */}
            <div className="bg-white border-b border-slate-200 px-4 py-2">
                <div className="flex items-center justify-between">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    {/* Botón exportar */}
                    <Button
                        onClick={handleExport}
                        variant="primary"
                        size="sm"
                        disabled={exporting}
                        className="flex items-center gap-2"
                    >
                        <ChartBarIcon className="h-4 w-4" />
                        {exporting ? 'GENERANDO...' :
                            activeTab === 4 ? 'EXPORTAR RECORRIDO' : 'EXPORTAR PDF'}
                    </Button>
                </div>

                {exportError && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded">
                        {exportError}
                    </div>
                )}
            </div>

            {/* Contenido de tabs */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 0 && <KPIsTab />}

                {activeTab === 1 && (
                    <div className="h-full w-full bg-white overflow-auto">
                        <BlackSpotsTab
                            organizationId={getOrganizationId(user?.organizationId)}
                            vehicleIds={filters.vehicles && filters.vehicles.length > 0 ? filters.vehicles : undefined}
                            startDate={filters.dateRange?.start}
                            endDate={filters.dateRange?.end}
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
            </div>
        </div>
    );
};

export default ExecutiveDashboard;

