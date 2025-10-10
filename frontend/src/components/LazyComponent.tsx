import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import React, { ComponentType, Suspense, lazy } from 'react';

interface LazyComponentProps {
    fallback?: React.ReactNode;
    errorBoundary?: boolean;
    retryDelay?: number;
}

interface LazyComponentOptions {
    fallback?: React.ReactNode;
    errorBoundary?: boolean;
    retryDelay?: number;
    preload?: boolean;
}

// Componente de fallback por defecto
const DefaultFallback: React.FC = () => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            p: 3
        }}
    >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cargando componente...
        </Typography>
    </Box>
);

// Componente de error por defecto
const DefaultErrorFallback: React.FC<{ error?: Error; retry?: () => void }> = ({ error, retry }) => (
    <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
            Error cargando componente
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
            {error?.message || 'Error desconocido'}
        </Typography>
        {retry && (
            <button
                onClick={retry}
                style={{
                    padding: '8px 16px',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Reintentar
            </button>
        )}
    </Alert>
);

// Error Boundary para componentes lazy
class LazyErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error en componente lazy:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <DefaultErrorFallback error={this.state.error} />
            );
        }

        return this.props.children;
    }
}

// Función para crear un componente lazy optimizado
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: LazyComponentOptions = {}
) {
    const {
        fallback = <DefaultFallback />,
        errorBoundary = true,
        retryDelay = 1000,
        preload = false
    } = options;

    const LazyComponent = lazy(importFn);

    // Preload del componente si está habilitado
    if (preload) {
        importFn().catch(() => {
            // Ignorar errores de preload
        });
    }

    const OptimizedLazyComponent: React.FC<React.ComponentProps<T> & LazyComponentProps> = (props) => {
        const [retryKey, setRetryKey] = React.useState(0);

        const handleRetry = React.useCallback(() => {
            setTimeout(() => {
                setRetryKey(prev => prev + 1);
            }, retryDelay);
        }, [retryDelay]);

        const SuspenseWrapper = React.useCallback(({ children }: { children: React.ReactNode }) => (
            <Suspense fallback={fallback}>
                {children}
            </Suspense>
        ), [fallback]);

        const ComponentWrapper = React.useCallback(({ children }: { children: React.ReactNode }) => {
            if (errorBoundary) {
                return (
                    <LazyErrorBoundary fallback={<DefaultErrorFallback retry={handleRetry} />}>
                        {children}
                    </LazyErrorBoundary>
                );
            }
            return <>{children}</>;
        }, [errorBoundary, handleRetry]);

        const ComponentWithKey = React.useMemo(() => {
            return React.createElement(LazyComponent, { key: retryKey, ...props });
        }, [retryKey, props]);

        return (
            <ComponentWrapper>
                <SuspenseWrapper>
                    {ComponentWithKey}
                </SuspenseWrapper>
            </ComponentWrapper>
        );
    };

    return OptimizedLazyComponent;
}

// Componentes lazy optimizados para el sistema
export const OptimizedDashboard = createLazyComponent(
    () => import('../pages/UnifiedDashboard'),
    {
        fallback: <DefaultFallback />,
        preload: true // Preload del dashboard principal
    }
);

export const OptimizedTelemetry = createLazyComponent(
    () => import('../pages/UnifiedTelemetria'),
    {
        fallback: (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }
);

export const OptimizedEstabilidad = createLazyComponent(
    () => import('../pages/UnifiedEstabilidad'),
    {
        fallback: <DefaultFallback />
    }
);

export const OptimizedAI = createLazyComponent(
    () => import('../pages/UnifiedAI'),
    {
        fallback: (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Cargando módulo de IA...
                </Typography>
            </Box>
        )
    }
);

export const OptimizedReports = createLazyComponent(
    () => import('../pages/UnifiedReports'),
    {
        fallback: <DefaultFallback />
    }
);

export const OptimizedVehicles = createLazyComponent(
    () => import('../pages/UnifiedVehicles'),
    {
        fallback: <DefaultFallback />
    }
);

export const OptimizedGeofences = createLazyComponent(
    () => import('../pages/UnifiedGeofences'),
    {
        fallback: <DefaultFallback />
    }
);

// Hook para preload de componentes
export function usePreloadComponents() {
    const preloadComponent = React.useCallback((importFn: () => Promise<any>) => {
        importFn().catch(() => {
            // Ignorar errores de preload
        });
    }, []);

    const preloadDashboard = React.useCallback(() => {
        preloadComponent(() => import('../pages/UnifiedDashboard'));
    }, [preloadComponent]);

    const preloadTelemetry = React.useCallback(() => {
        preloadComponent(() => import('../pages/UnifiedTelemetria'));
    }, [preloadComponent]);

    const preloadAI = React.useCallback(() => {
        preloadComponent(() => import('../pages/UnifiedAI'));
    }, [preloadComponent]);

    return {
        preloadComponent,
        preloadDashboard,
        preloadTelemetry,
        preloadAI
    };
}

// Hook para lazy loading con retry
export function useLazyWithRetry<T>(
    importFn: () => Promise<T>,
    retryDelay = 1000
) {
    const [component, setComponent] = React.useState<T | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const module = await importFn();
            setComponent(module);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Error desconocido');
            setError(error);
            setRetryCount(prev => prev + 1);
        } finally {
            setLoading(false);
        }
    }, [importFn]);

    const retry = React.useCallback(() => {
        setTimeout(load, retryDelay);
    }, [load, retryDelay]);

    React.useEffect(() => {
        load();
    }, [load]);

    return {
        component,
        loading,
        error,
        retry,
        retryCount
    };
}
