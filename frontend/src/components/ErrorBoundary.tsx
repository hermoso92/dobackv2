import { Alert, Box, Button, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ignorar errores específicos que no afectan la funcionalidad
    const errorMessage = error.message || '';

    // Lista de errores que deben ser ignorados
    const ignoredErrors = [
      'triggerSyncToReact',
      'reading \'messages\'',
      'Cannot read properties of undefined (reading \'messages\')'
    ];

    // Si el error está en la lista de ignorados, no hacer nada
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
      return;
    }

    logger.error('Error Boundary capturó un error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Algo salió mal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="caption" component="pre" sx={{
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem'
                }}>
                  {this.state.error.stack}
                </Typography>
              </Box>
            )}
            <Button
              variant="contained"
              onClick={this.handleReset}
              sx={{ mt: 2 }}
            >
              Intentar de nuevo
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Exportación por defecto
export default ErrorBoundary;

// Exportación nombrada para compatibilidad
export { ErrorBoundary };

