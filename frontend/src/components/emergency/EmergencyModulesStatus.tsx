import {
    CheckCircle,
    Error,
    LocalFireDepartment,
    Notifications,
    Report,
    Security,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface ModuleStatus {
    name: string;
    endpoint: string;
    status: 'active' | 'inactive' | 'error';
    lastCheck: Date;
    responseTime?: number;
    description: string;
    icon: React.ReactNode;
}

interface EmergencyModulesStatusProps {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const EmergencyModulesStatus: React.FC<EmergencyModulesStatusProps> = ({
    autoRefresh = true,
    refreshInterval = 30000
}) => {
    const { user } = useAuth();
    const [modules, setModules] = useState<ModuleStatus[]>([
        {
            name: 'Dashboard de Emergencias',
            endpoint: '/api/emergencies/status',
            status: 'inactive',
            lastCheck: new Date(),
            description: 'Sistema de gestión de emergencias en tiempo real',
            icon: <LocalFireDepartment />
        },
        {
            name: 'Alertas Inteligentes',
            endpoint: '/api/intelligent-alerts/status',
            status: 'inactive',
            lastCheck: new Date(),
            description: 'Sistema de alertas automáticas para bomberos',
            icon: <Security />
        },
        {
            name: 'Reportes de Emergencias',
            endpoint: '/api/emergency-reports/status',
            status: 'inactive',
            lastCheck: new Date(),
            description: 'Generación de reportes de emergencias',
            icon: <Report />
        },
        {
            name: 'Notificaciones Push',
            endpoint: '/api/push-notifications/status',
            status: 'inactive',
            lastCheck: new Date(),
            description: 'Sistema de notificaciones en tiempo real',
            icon: <Notifications />
        }
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkModuleStatus = useCallback(async (module: ModuleStatus): Promise<ModuleStatus> => {
        const startTime = Date.now();

        try {
            // Intentar hacer una petición simple al endpoint
            const response = await apiService.get(module.endpoint);
            const responseTime = Date.now() - startTime;

            return {
                ...module,
                status: response.success ? 'active' : 'error',
                lastCheck: new Date(),
                responseTime
            };
        } catch (err) {
            const responseTime = Date.now() - startTime;

            // Si el endpoint no existe, consideramos el módulo como inactivo pero no error
            if ((err as any)?.response?.status === 404) {
                return {
                    ...module,
                    status: 'inactive',
                    lastCheck: new Date(),
                    responseTime
                };
            }

            return {
                ...module,
                status: 'error',
                lastCheck: new Date(),
                responseTime
            };
        }
    }, []);

    const checkAllModules = useCallback(async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        setError(null);

        try {
            const updatedModules = await Promise.all(
                modules.map(module => checkModuleStatus(module))
            );

            setModules(updatedModules);

            const activeCount = updatedModules.filter(m => m.status === 'active').length;
            const totalCount = updatedModules.length;

            logger.info('Estado de modulos de emergencia verificado', {
                active: activeCount,
                total: totalCount,
                userId: user?.id
            });

        } catch (err) {
            const errorMessage = (err as Error)?.message || 'Error verificando modulos';
            setError(errorMessage);
            logger.error('Error verificando estado de modulos', { error: err });
        } finally {
            setLoading(false);
        }
    }, [modules, checkModuleStatus, user]);

    useEffect(() => {
        checkAllModules();
    }, []);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(checkAllModules, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, checkAllModules]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle color="success" />;
            case 'inactive': return <Warning color="warning" />;
            case 'error': return <Error color="error" />;
            default: return <Warning />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'inactive': return 'Inactivo';
            case 'error': return 'Error';
            default: return 'Desconocido';
        }
    };

    const activeModules = modules.filter(m => m.status === 'active').length;
    const totalModules = modules.length;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Estado de Módulos de Emergencia
                </Typography>
                <Chip
                    label={`${activeModules}/${totalModules} Activos`}
                    color={activeModules === totalModules ? 'success' : 'warning'}
                    icon={activeModules === totalModules ? <CheckCircle /> : <Warning />}
                />
            </Box>

            {loading && (
                <LinearProgress sx={{ mb: 2 }} />
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    Error verificando estado de módulos: {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {modules.map((module, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {module.icon}
                                    <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                                        {module.name}
                                    </Typography>
                                    <Chip
                                        label={getStatusLabel(module.status)}
                                        color={getStatusColor(module.status) as any}
                                        size="small"
                                        icon={getStatusIcon(module.status)}
                                    />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {module.description}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Última verificación: {module.lastCheck.toLocaleTimeString()}
                                    </Typography>
                                    {module.responseTime && (
                                        <Typography variant="caption" color="text.secondary">
                                            {module.responseTime}ms
                                        </Typography>
                                    )}
                                </Box>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Endpoint: {module.endpoint}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Información del Sistema
                </Typography>
                <Typography variant="body2">
                    Los módulos de emergencia están diseñados específicamente para Bomberos Madrid.
                    Cada módulo proporciona funcionalidades críticas para la gestión de emergencias:
                    • <strong>Dashboard de Emergencias:</strong> Monitoreo en tiempo real de vehículos y situaciones
                    • <strong>Alertas Inteligentes:</strong> Sistema de alertas automáticas basado en IA
                    • <strong>Reportes de Emergencias:</strong> Generación automática de reportes post-emergencia
                    • <strong>Notificaciones Push:</strong> Sistema de comunicación en tiempo real
                </Typography>
            </Alert>
        </Box>
    );
};
