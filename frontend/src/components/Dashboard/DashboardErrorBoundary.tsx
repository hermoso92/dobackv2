import { Alert, Box, Button, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

/**
 * Error Boundary optimizado para el dashboard
 * Maneja errores de forma elegante y proporciona información útil
 */
export class DashboardErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Actualizar el state para mostrar la UI de fallback
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log del error para debugging
        logger.error('Dashboard Error Boundary capturó un error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });

        this.setState({
            error,
            errorInfo
        });

        // Llamar callback personalizado si existe
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Renderizar UI de fallback personalizada
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Box sx={{ p: 3 }}>
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={this.handleRetry}
                                >
                                    Reintentar
                                </Button>
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={this.handleReload}
                                >
                                    Recargar
                                </Button>
                            </Box>
                        }
                    >
                        <Typography variant="h6" gutterBottom>
                            Error en el Dashboard
                        </Typography>
                        <Typography variant="body2">
                            Ha ocurrido un error inesperado. Puede intentar recargar la página o contactar al administrador.
                        </Typography>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                                    {this.state.error.message}
                                </Typography>
                            </Box>
                        )}
                    </Alert>
                </Box>
            );
        }

        return this.props.children;
    }
}
