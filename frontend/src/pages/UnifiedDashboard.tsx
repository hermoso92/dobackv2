import { Alert, Box, Tab, Tabs } from '@mui/material';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { DashboardErrorBoundary } from '../components/Dashboard/DashboardErrorBoundary';
import FilteredPageWrapper from '../components/filters/FilteredPageWrapper';
import { OptimizedLoadingSpinner } from '../components/ui/OptimizedLoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFilteredDashboardData } from '../hooks/useFilteredData';
import { useOptimizedDashboard } from '../hooks/useOptimizedDashboard';
import { usePermissions } from '../hooks/usePermissions';

// Lazy loading para componentes pesados
const ExecutiveDashboard = lazy(() => import('../components/dashboard/ExecutiveDashboard'));
const EstadosYTiemposTab = lazy(() => import('../components/dashboard/EstadosYTiemposTab'));
const BlackSpotsTab = lazy(() => import('../components/stability/BlackSpotsTab'));
const SpeedAnalysisTab = lazy(() => import('../components/speed/SpeedAnalysisTab'));

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
    const { isAuthenticated } = useAuth();
    const { isAdmin, isManager } = usePermissions();

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

    // Estados
    const [isVerifying, setIsVerifying] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

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

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
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

    // ✅ Determinar qué dashboard mostrar según el rol
    const showManagerDashboard = isManager() && !isAdmin();

    // Si es MANAGER (no ADMIN), mostrar dashboard con pestañas
    if (showManagerDashboard) {
        return (
            <FilteredPageWrapper>
                <DashboardErrorBoundary>
                    <Box>
                        {/* Pestañas para MANAGER */}
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            aria-label="dashboard tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                        >
                            <Tab label="Estados & Tiempos" />
                            <Tab label="Puntos Negros" />
                            <Tab label="Velocidad" />
                            <Tab label="Sesiones & Recorridos" />
                        </Tabs>

                        {/* Panel 1: Estados & Tiempos */}
                        <TabPanel value={activeTab} index={0}>
                            <Suspense fallback={<OptimizedLoadingSpinner message="Cargando estados..." variant="skeleton" />}>
                                <EstadosYTiemposTab />
                            </Suspense>
                        </TabPanel>

                        {/* Panel 2: Puntos Negros */}
                        <TabPanel value={activeTab} index={1}>
                            <Suspense fallback={<OptimizedLoadingSpinner message="Cargando puntos negros..." variant="skeleton" />}>
                                <BlackSpotsTab organizationId={''} />
                            </Suspense>
                        </TabPanel>

                        {/* Panel 3: Velocidad */}
                        <TabPanel value={activeTab} index={2}>
                            <Suspense fallback={<OptimizedLoadingSpinner message="Cargando análisis de velocidad..." variant="skeleton" />}>
                                <SpeedAnalysisTab organizationId={''} />
                            </Suspense>
                        </TabPanel>

                        {/* Panel 4: Sesiones & Recorridos */}
                        <TabPanel value={activeTab} index={3}>
                            <SessionsAndRoutesView onSessionDataChange={() => { }} />
                        </TabPanel>
                    </Box>
                </DashboardErrorBoundary>
            </FilteredPageWrapper>
        );
    }

    // ADMIN: Dashboard Ejecutivo completo
    return (
        <FilteredPageWrapper>
            <DashboardErrorBoundary>
                {/* Dashboard Ejecutivo - Pantalla Completa TV Wall */}
                <Suspense fallback={
                    <OptimizedLoadingSpinner
                        message="Cargando dashboard ejecutivo..."
                        variant="skeleton"
                    />
                }>
                    <ExecutiveDashboard />
                </Suspense>
            </DashboardErrorBoundary>
        </FilteredPageWrapper>
    );
};

export default UnifiedDashboard;