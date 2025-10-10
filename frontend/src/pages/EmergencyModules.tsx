import {
    LocalFireDepartment
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Paper,
    Typography
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmergencyModulesStatus } from '../components/emergency/EmergencyModulesStatus';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const EmergencyModules: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    React.useEffect(() => {
        logger.info('Página de módulos de emergencia accedida');
    }, []);

    return (
        <ErrorBoundary>
            <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Header */}
                <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <LocalFireDepartment sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h4" component="h1" gutterBottom>
                                Módulos de Emergencia - Bomberos Madrid
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Estado y configuración de los sistemas de emergencia
                            </Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Estado de módulos */}
                <EmergencyModulesStatus
                    autoRefresh={true}
                    refreshInterval={30000}
                />

                {/* Información adicional */}
                <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Sistema de Emergencias Operativo
                    </Typography>
                    <Typography variant="body2">
                        Los módulos de emergencia han sido activados exitosamente en el backend.
                        El sistema está preparado para gestionar situaciones de emergencia
                        con monitoreo en tiempo real, alertas automáticas y notificaciones push.
                    </Typography>
                </Alert>
            </Box>
        </ErrorBoundary>
    );
};

export default EmergencyModules;
