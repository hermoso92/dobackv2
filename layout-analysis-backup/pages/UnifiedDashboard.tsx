import { Alert, Box } from '@mui/material';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { DashboardErrorBoundary } from '../components/Dashboard/DashboardErrorBoundary';
import FilteredPageWrapper from '../components/filters/FilteredPageWrapper';
import { OptimizedLoadingSpinner } from '../components/ui/OptimizedLoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useFilteredDashboardData } from '../hooks/useFilteredData';
import { useOptimizedDashboard } from '../hooks/useOptimizedDashboard';

// Lazy loading para componentes pesados
const NewExecutiveKPIDashboard = lazy(() => import('../components/kpi/NewExecutiveKPIDashboard').then(module => ({ default: module.NewExecutiveKPIDashboard })));

const UnifiedDashboard: React.FC = () => {
    const { isAuthenticated } = useAuth();

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
                    <NewExecutiveKPIDashboard />
                </Suspense>
            </DashboardErrorBoundary>
        </FilteredPageWrapper>
    );
};

export default UnifiedDashboard;