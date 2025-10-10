import {
    BugReport as BugReportIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Collapse,
    IconButton,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface ConnectionDiagnosticProps {
    error?: any;
    onRetry?: () => void;
}

export const ConnectionDiagnostic: React.FC<ConnectionDiagnosticProps> = ({
    error,
    onRetry
}) => {
    const [expanded, setExpanded] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const handleRetry = async () => {
        setIsChecking(true);
        try {
            if (onRetry) {
                await onRetry();
            }
        } finally {
            setIsChecking(false);
        }
    };

    const checkBackendStatus = async () => {
        setIsChecking(true);
        try {
            const response = await fetch('http://localhost:9998/health', {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                alert('✅ Backend está funcionando correctamente');
            } else {
                alert(`❌ Backend respondió con error: ${response.status}`);
            }
        } catch (error: any) {
            alert(`❌ No se puede conectar al backend: ${error.message}`);
        } finally {
            setIsChecking(false);
        }
    };

    const getErrorType = () => {
        if (!error) return 'unknown';

        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
            return 'timeout';
        }

        if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
            return 'network';
        }

        if (error.response?.status >= 500) {
            return 'server';
        }

        return 'unknown';
    };

    const errorType = getErrorType();

    const getDiagnosticSteps = () => {
        switch (errorType) {
            case 'timeout':
                return [
                    'Verificar que el backend esté ejecutándose',
                    'Comprobar que el puerto 9998 esté disponible',
                    'Revisar la configuración de timeout',
                    'Verificar la carga del servidor'
                ];
            case 'network':
                return [
                    'Iniciar el backend: cd backend && npm run dev',
                    'Verificar que no haya otros servicios usando el puerto 9998',
                    'Comprobar la configuración de firewall',
                    'Verificar la URL del servidor'
                ];
            case 'server':
                return [
                    'Revisar los logs del backend',
                    'Verificar la configuración de la base de datos',
                    'Comprobar las dependencias del servidor',
                    'Reiniciar el servidor'
                ];
            default:
                return [
                    'Recargar la página',
                    'Verificar la conexión a internet',
                    'Contactar al soporte técnico'
                ];
        }
    };

    return (
        <Card sx={{ mt: 2, border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <BugReportIcon color="error" />
                        <Typography variant="h6" color="error">
                            Diagnóstico de Conexión
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setExpanded(!expanded)}
                        aria-expanded={expanded}
                        aria-label="mostrar más"
                    >
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Box>

                <Alert severity="error" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        Se ha detectado un problema de conexión con el servidor.
                    </Typography>
                </Alert>

                <Box display="flex" gap={2} mt={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={handleRetry}
                        disabled={isChecking}
                    >
                        {isChecking ? 'Verificando...' : 'Reintentar'}
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={checkBackendStatus}
                        disabled={isChecking}
                    >
                        Verificar Backend
                    </Button>
                </Box>

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box mt={2}>
                        <Typography variant="h6" gutterBottom>
                            Pasos de Diagnóstico:
                        </Typography>

                        <Box component="ol" sx={{ pl: 2 }}>
                            {getDiagnosticSteps().map((step, index) => (
                                <Typography key={index} component="li" variant="body2" sx={{ mb: 1 }}>
                                    {step}
                                </Typography>
                            ))}
                        </Box>

                        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            Información Técnica:
                        </Typography>

                        <Box component="pre" sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            overflow: 'auto'
                        }}>
                            {error ? JSON.stringify({
                                message: error.message,
                                code: error.code,
                                status: error.response?.status,
                                url: error.config?.url
                            }, null, 2) : 'No hay información de error disponible'}
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            💡 Si el problema persiste, contacta al administrador del sistema.
                        </Typography>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};
