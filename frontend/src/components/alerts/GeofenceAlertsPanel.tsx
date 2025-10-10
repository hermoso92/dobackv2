/**
 * 🚨 PANEL DE ALERTAS DE GEOCERCAS - BOMBEROS MADRID
 * Componente para mostrar alertas de entrada/salida y permanencia en parques
 */

import {
    CheckCircle,
    Error,
    Notifications,
    Park,
    Refresh,
    Settings,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface GeofenceAlert {
    id: string;
    type: 'ENTRY' | 'EXIT' | 'LONG_STAY_OUTSIDE' | 'LONG_STAY_INSIDE';
    vehicleId: string;
    vehicleName: string;
    geofenceId: string;
    geofenceName: string;
    parkId?: string;
    parkName?: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

interface AlertConfig {
    longStayOutsideHours: number;
    longStayInsideHours: number;
    notifyOnEntry: boolean;
    notifyOnExit: boolean;
    notifyOnLongStay: boolean;
    enabled: boolean;
}

export const GeofenceAlertsPanel: React.FC = () => {
    const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<AlertConfig>({
        longStayOutsideHours: 4,
        longStayInsideHours: 8,
        notifyOnEntry: true,
        notifyOnExit: true,
        notifyOnLongStay: true,
        enabled: true
    });
    const [openConfig, setOpenConfig] = useState(false);

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<{ success: boolean; data: GeofenceAlert[] }>('/geofence-alerts');

            if (response.data && response.data.success) {
                setAlerts(response.data.data);
                logger.info(`Alertas cargadas: ${response.data.data.length}`);
            }
            setError(null);
        } catch (err) {
            logger.error('Error cargando alertas:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchConfig = useCallback(async () => {
        try {
            const response = await apiService.get<{ success: boolean; data: AlertConfig }>('/geofence-alerts/config');
            if (response.data && response.data.success) {
                setConfig(response.data.data);
            }
        } catch (err) {
            logger.error('Error cargando configuración:', err);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        fetchConfig();
    }, [fetchAlerts, fetchConfig]);

    const handleAcknowledge = async (alertId: string) => {
        try {
            await apiService.post(`/geofence-alerts/${alertId}/acknowledge`, {});
            logger.info('Alerta reconocida:', alertId);
            await fetchAlerts();
        } catch (err) {
            logger.error('Error reconociendo alerta:', err);
            alert('Error reconociendo alerta. Ver consola para detalles.');
        }
    };

    const handleCheckLongStay = async () => {
        try {
            await apiService.post('/geofence-alerts/check-long-stay', {});
            logger.info('Verificación de permanencia ejecutada');
            await fetchAlerts();
            alert('Verificación de permanencia ejecutada exitosamente');
        } catch (err) {
            logger.error('Error ejecutando verificación:', err);
            alert('Error ejecutando verificación. Ver consola para detalles.');
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'ENTRY': return <Park color="success" />;
            case 'EXIT': return <Error color="error" />;
            case 'LONG_STAY_OUTSIDE': return <Warning color="warning" />;
            case 'LONG_STAY_INSIDE': return <Warning color="info" />;
            default: return <Notifications />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    const getAlertTypeLabel = (type: string) => {
        switch (type) {
            case 'ENTRY': return 'Entrada';
            case 'EXIT': return 'Salida';
            case 'LONG_STAY_OUTSIDE': return 'Permanencia Fuera';
            case 'LONG_STAY_INSIDE': return 'Permanencia Dentro';
            default: return type;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    // Agrupar alertas por severidad
    const alertsBySeverity = {
        CRITICAL: alerts.filter(a => a.severity === 'CRITICAL'),
        HIGH: alerts.filter(a => a.severity === 'HIGH'),
        MEDIUM: alerts.filter(a => a.severity === 'MEDIUM'),
        LOW: alerts.filter(a => a.severity === 'LOW')
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Alertas de Geocercas
                </Typography>
                <Box display="flex" gap={1}>
                    <Tooltip title="Verificar Permanencia Larga">
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<Warning />}
                            onClick={handleCheckLongStay}
                        >
                            Verificar Permanencia
                        </Button>
                    </Tooltip>
                    <Tooltip title="Configuración">
                        <IconButton
                            color="primary"
                            onClick={() => setOpenConfig(true)}
                        >
                            <Settings />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchAlerts}
                    >
                        Actualizar
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Estadísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Alertas
                            </Typography>
                            <Typography variant="h4">
                                {alerts.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Críticas
                            </Typography>
                            <Typography variant="h4" color="error">
                                {alertsBySeverity.CRITICAL.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                No Reconocidas
                            </Typography>
                            <Typography variant="h4" color="warning">
                                {alerts.filter(a => !a.acknowledged).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Estado
                            </Typography>
                            <Chip
                                label={config.enabled ? 'Activo' : 'Inactivo'}
                                color={config.enabled ? 'success' : 'default'}
                                size="small"
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Lista de Alertas */}
            <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
                {alerts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="textSecondary" gutterBottom>
                            No hay alertas activas
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Las alertas aparecerán cuando los vehículos entren/salgan de parques
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {alerts.map((alert) => (
                            <ListItem
                                key={alert.id}
                                sx={{
                                    borderBottom: 1,
                                    borderColor: 'divider',
                                    bgcolor: alert.acknowledged ? 'action.hover' : 'inherit'
                                }}
                            >
                                <ListItemIcon>
                                    {getAlertIcon(alert.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle1">
                                                {alert.vehicleName}
                                            </Typography>
                                            <Chip
                                                label={getAlertTypeLabel(alert.type)}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                label={alert.severity}
                                                size="small"
                                                color={getSeverityColor(alert.severity) as any}
                                            />
                                            {alert.acknowledged && (
                                                <CheckCircle color="success" fontSize="small" />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">
                                                {alert.message}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(alert.timestamp).toLocaleString('es-ES')}
                                                {alert.parkName && ` • ${alert.parkName}`}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                {!alert.acknowledged && (
                                    <Tooltip title="Reconocer Alerta">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleAcknowledge(alert.id)}
                                        >
                                            <CheckCircle />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Dialog de Configuración */}
            <Dialog open={openConfig} onClose={() => setOpenConfig(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Configuración de Alertas</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.enabled}
                                            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                                        />
                                    }
                                    label="Sistema de Alertas Activo"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Horas para Permanencia Fuera"
                                    type="number"
                                    value={config.longStayOutsideHours}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        longStayOutsideHours: parseInt(e.target.value) || 4
                                    })}
                                    fullWidth
                                    helperText="Horas fuera del parque para generar alerta"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Horas para Permanencia Dentro"
                                    type="number"
                                    value={config.longStayInsideHours}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        longStayInsideHours: parseInt(e.target.value) || 8
                                    })}
                                    fullWidth
                                    helperText="Horas dentro del parque para generar alerta"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.notifyOnEntry}
                                            onChange={(e) => setConfig({ ...config, notifyOnEntry: e.target.checked })}
                                        />
                                    }
                                    label="Notificar Entradas al Parque"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.notifyOnExit}
                                            onChange={(e) => setConfig({ ...config, notifyOnExit: e.target.checked })}
                                        />
                                    }
                                    label="Notificar Salidas del Parque"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.notifyOnLongStay}
                                            onChange={(e) => setConfig({ ...config, notifyOnLongStay: e.target.checked })}
                                        />
                                    }
                                    label="Notificar Permanencia Prolongada"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfig(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            try {
                                await apiService.put('/geofence-alerts/config', config);
                                setOpenConfig(false);
                                alert('Configuración actualizada exitosamente');
                            } catch (err) {
                                logger.error('Error actualizando configuración:', err);
                                alert('Error actualizando configuración. Ver consola para detalles.');
                            }
                        }}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default GeofenceAlertsPanel;
