import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Alert, Box, Button, Typography } from '@mui/material';
import React from 'react';
import { logger } from '../utils/logger';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class EventDetailsErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error('EventDetailsErrorBoundary capturó un error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback;
                return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
            }

            return (
                <Box sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'error.main'
                }}>
                    <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" color="error" gutterBottom>
                        Error al cargar detalles de eventos
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                        <Typography variant="body2">
                            <strong>Error:</strong> {this.state.error?.message || 'Error desconocido'}
                        </Typography>
                        {this.state.error?.stack && (
                            <details style={{ marginTop: '8px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '12px' }}>
                                    Ver detalles técnicos
                                </summary>
                                <pre style={{
                                    fontSize: '10px',
                                    marginTop: '8px',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                    background: '#f5f5f5',
                                    padding: '8px',
                                    borderRadius: '4px'
                                }}>
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </Alert>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={this.handleRetry}
                    >
                        Reintentar
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default EventDetailsErrorBoundary;
