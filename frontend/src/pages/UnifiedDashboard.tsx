import { Alert, Box, Tab, Tabs } from '@mui/material';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardErrorBoundary } from '../components/Dashboard/DashboardErrorBoundary';
import FilteredPageWrapper from '../components/filters/FilteredPageWrapper';
import { OptimizedLoadingSpinner } from '../components/ui/OptimizedLoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalFilters } from '../hooks/useGlobalFilters';
import { useFilteredDashboardData } from '../hooks/useFilteredData';
import { useOptimizedDashboard } from '../hooks/useOptimizedDashboard';
import { usePermissions } from '../hooks/usePermissions';

// Lazy loading para componentes pesados
const ExecutiveDashboard = lazy(() => import('../components/Dashboard/ExecutiveDashboard'));
const EstadosYTiemposTab = lazy(() => import('../components/Dashboard/EstadosYTiemposTab'));
const BlackSpotsTab = lazy(() => import('../components/stability/BlackSpotsTab'));
const SpeedAnalysisTab = lazy(() => import('../components/speed/SpeedAnalysisTab'));
const KPIsTab = lazy(() => import('../components/Dashboard/ExecutiveDashboard/tabs/KPIsTab'));
const KPIDocumentationTab = lazy(() =>
    import('../components/kpi/KPIDocumentationTab').then(module => ({ default: module.KPIDocumentationTab }))
);

// Import directo de SessionsAndRoutesView (no lazy por named export)
import { SessionsAndRoutesView } from '../components/sessions/SessionsAndRoutesView';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`dashboard-tabpanel-${index}`}
            aria-labelledby={`dashboard-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const UnifiedDashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();  // ✅ Añadido user
    const { isAdmin, isManager } = usePermissions();
    const [searchParams, setSearchParams] = useSearchParams();
    const { filters } = useGlobalFilters();

    const selectedVehicleIds = filters.vehicles && filters.vehicles.length > 0
        ? filters.vehicles
        : undefined;
    const startDate = filters.dateRange?.start;
    const endDate = filters.dateRange?.end;

    // Usar hooks optimizados - SIN AUTO REFRESH
    const {
        isInitializing,
        isReady
    } = useOptimizedDashboard({
        enableAutoRefresh: false,
        refreshInterval: 0,
        enableOptimisticUpdates: false
    });

    // Usar datos filtrados del dashboard
    const {
        error: dashboardError
    } = useFilteredDashboardData();

    // ✅ Leer el parámetro tab de la URL para MANAGER
    const tabFromUrl = searchParams.get('tab');
    const initialTab = tabFromUrl ? parseInt(tabFromUrl, 10) : 0;

    // Estados
    const [isVerifying, setIsVerifying] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(initialTab);

    // Verificación de autenticación optimizada
    useEffect(() => {
        if (!isAuthenticated) {
            setAuthError('No autorizado');
            setIsVerifying(false);
            return;
        }

        const timer = setTimeout(() => {
            setIsVerifying(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, [isAuthenticated]);

    // ✅ Actualizar tab activa cuando cambie el parámetro URL
    useEffect(() => {
        if (tabFromUrl !== null) {
            const tabIndex = parseInt(tabFromUrl, 10);
            if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 5) {
                setActiveTab(tabIndex);
            }
        }
    }, [tabFromUrl]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        // ✅ Actualizar URL para MANAGER
        if (isManager) {
            setSearchParams({ tab: newValue.toString() });
        }
    };


    // Estados de carga optimizados
    if (isVerifying || isInitializing) {
        return (
            <OptimizedLoadingSpinner
                message="Inicializando dashboard..."
                variant="spinner"
            />
        );
    }

    if (authError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    {authError}
                </Alert>
            </Box>
        );
    }

    if (!isReady) {
        return (
            <OptimizedLoadingSpinner
                message="Cargando datos del dashboard..."
                variant="skeleton"
            />
        );
    }

    // Mostrar error del dashboard si existe
    if (dashboardError) {
        return (
            <FilteredPageWrapper>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">
                        Error cargando datos del dashboard: {dashboardError instanceof Error ? dashboardError.message : String(dashboardError)}
                    </Alert>
                </Box>
            </FilteredPageWrapper>
        );
    }

    // ✅ TODOS los usuarios (ADMIN y MANAGER) ven el dashboard con pestañas
    return (
        <FilteredPageWrapper>
            <DashboardErrorBoundary>
                <Box>
                    {/* Pestañas solo para ADMIN (MANAGER las tiene en el menú superior) */}
                    {!isManager && (
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        aria-label="dashboard tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                        <Tab label="KPIs Ejecutivos" />
                        <Tab label="Estados & Tiempos" />
                        <Tab label="Puntos Negros" />
                        <Tab label="Velocidad" />
                        <Tab label="Sesiones & Recorridos" />
                        <Tab label="Documentación KPIs" />
                    </Tabs>
                    )}

                    {/* Panel 1: KPIs Ejecutivos (interfaz tipo Grafana) */}
                    <TabPanel value={activeTab} index={0}>
                        <Suspense fallback={<OptimizedLoadingSpinner message="Cargando KPIs..." variant="skeleton" />}>
                            <KPIsTab />
                        </Suspense>
                    </TabPanel>

                    {/* Panel 2: Estados & Tiempos (gráficos) */}
                    <TabPanel value={activeTab} index={1}>
                        <Suspense fallback={<OptimizedLoadingSpinner message="Cargando estados..." variant="skeleton" />}>
                            <EstadosYTiemposTab />
                        </Suspense>
                    </TabPanel>

                    {/* Panel 3: Puntos Negros */}
                    <TabPanel value={activeTab} index={2}>
                        <Suspense fallback={<OptimizedLoadingSpinner message="Cargando puntos negros..." variant="skeleton" />}>
                            <BlackSpotsTab 
                                organizationId={user?.organizationId || ''}
                                vehicleIds={selectedVehicleIds}
                                startDate={startDate}
                                endDate={endDate}
                            />
                        </Suspense>
                    </TabPanel>

                    {/* Panel 4: Velocidad */}
                    <TabPanel value={activeTab} index={3}>
                        <Suspense fallback={<OptimizedLoadingSpinner message="Cargando análisis de velocidad..." variant="skeleton" />}>
                            <SpeedAnalysisTab 
                                organizationId={user?.organizationId || ''}
                                vehicleIds={selectedVehicleIds}
                                startDate={startDate}
                                endDate={endDate}
                            />
                        </Suspense>
                    </TabPanel>

                    {/* Panel 5: Sesiones & Recorridos */}
                    <TabPanel value={activeTab} index={4}>
                        <SessionsAndRoutesView onSessionDataChange={() => { }} />
                    </TabPanel>

                    {/* Panel 6: Documentación KPIs */}
                    <TabPanel value={activeTab} index={5}>
                        <Suspense fallback={<OptimizedLoadingSpinner message="Cargando documentación de KPIs..." variant="skeleton" />}>
                            <KPIDocumentationTab />
                        </Suspense>
                    </TabPanel>
                </Box>
            </DashboardErrorBoundary>
        </FilteredPageWrapper>
    );
};

export default UnifiedDashboard;