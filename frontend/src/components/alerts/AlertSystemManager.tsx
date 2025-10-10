import {
    BellIcon,
    CheckCircleIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

interface AlertRule {
    id: string;
    name: string;
    description: string;
    type: 'speed' | 'stability' | 'geofence' | 'emergency';
    condition: string;
    threshold: number;
    enabled: boolean;
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    created_at: string;
    updated_at: string;
}

interface Alert {
    id: string;
    rule_id: string;
    rule_name: string;
    vehicle_id: string;
    vehicle_name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    acknowledged: boolean;
    acknowledged_by?: string;
    acknowledged_at?: string;
}

export const AlertSystemManager: React.FC = () => {
    const { user } = useAuth();
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados para el diálogo de configuración
    const [configDialogOpen, setConfigDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [newRule, setNewRule] = useState<Partial<AlertRule>>({
        name: '',
        description: '',
        type: 'speed',
        condition: 'greater_than',
        threshold: 50,
        enabled: true,
        notifications: {
            email: true,
            sms: false,
            push: true
        }
    });

    // Cargar reglas de alerta
    const loadAlertRules = useCallback(async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/alerts/rules?organizationId=${user.organizationId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAlertRules(data.data || []);
                }
            }
        } catch (error) {
            console.warn('Error cargando reglas de alerta, usando datos mock:', error);

            // Datos mock para Bomberos Madrid
            const mockRules: AlertRule[] = [
                {
                    id: 'rule-1',
                    name: 'Exceso de Velocidad en Emergencia',
                    description: 'Alerta cuando un vehículo supera 60 km/h con rotativo encendido',
                    type: 'speed',
                    condition: 'greater_than',
                    threshold: 60,
                    enabled: true,
                    notifications: { email: true, sms: true, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'rule-2',
                    name: 'Estabilidad Crítica',
                    description: 'Alerta cuando la estabilidad del vehículo es menor al 30%',
                    type: 'stability',
                    condition: 'less_than',
                    threshold: 30,
                    enabled: true,
                    notifications: { email: true, sms: false, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'rule-3',
                    name: 'Salida de Geocerca',
                    description: 'Alerta cuando un vehículo sale de su zona asignada',
                    type: 'geofence',
                    condition: 'exit',
                    threshold: 0,
                    enabled: true,
                    notifications: { email: false, sms: true, push: true },
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            setAlertRules(mockRules);
        } finally {
            setLoading(false);
        }
    }, [user?.organizationId]);

    // Cargar alertas activas
    const loadAlerts = useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/alerts/active?organizationId=${user.organizationId}&limit=50`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAlerts(data.data || []);
                }
            }
        } catch (error) {
            console.warn('Error cargando alertas, usando datos mock:', error);

            // Datos mock para alertas
            const mockAlerts: Alert[] = [
                {
                    id: 'alert-1',
                    rule_id: 'rule-1',
                    rule_name: 'Exceso de Velocidad en Emergencia',
                    vehicle_id: 'DOBACK001',
                    vehicle_name: 'Bomba Escalera 1',
                    severity: 'high',
                    message: 'Vehículo DOBACK001 superó 65 km/h con rotativo encendido en M-30',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    acknowledged: false
                },
                {
                    id: 'alert-2',
                    rule_id: 'rule-2',
                    rule_name: 'Estabilidad Crítica',
                    vehicle_id: 'DOBACK002',
                    vehicle_name: 'Bomba Escalera 2',
                    severity: 'critical',
                    message: 'Estabilidad crítica detectada en DOBACK002 (25%)',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    acknowledged: false
                },
                {
                    id: 'alert-3',
                    rule_id: 'rule-3',
                    rule_name: 'Salida de Geocerca',
                    vehicle_id: 'DOBACK003',
                    vehicle_name: 'Ambulancia 1',
                    severity: 'medium',
                    message: 'DOBACK003 salió de su zona asignada',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    acknowledged: true,
                    acknowledged_by: 'Operador 1',
                    acknowledged_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
                }
            ];
            setAlerts(mockAlerts);
        }
    }, [user?.organizationId]);

    useEffect(() => {
        loadAlertRules();
        loadAlerts();
    }, [loadAlertRules, loadAlerts]);

    // Crear nueva regla
    const createRule = useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch('/api/alerts/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newRule,
                    organizationId: user.organizationId
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadAlertRules();
                    setConfigDialogOpen(false);
                    setNewRule({
                        name: '',
                        description: '',
                        type: 'speed',
                        condition: 'greater_than',
                        threshold: 50,
                        enabled: true,
                        notifications: {
                            email: true,
                            sms: false,
                            push: true
                        }
                    });
                    logger.info('Nueva regla de alerta creada', { ruleName: newRule.name, userId: user?.id });
                }
            }
        } catch (error) {
            console.error('Error creando regla:', error);
            setError('Error al crear la regla de alerta');
        }
    }, [newRule, user?.organizationId, user?.id, loadAlertRules]);

    // Actualizar regla
    const updateRule = useCallback(async (ruleId: string, updates: Partial<AlertRule>) => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/alerts/rules/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadAlertRules();
                    logger.info('Regla de alerta actualizada', { ruleId, userId: user?.id });
                }
            }
        } catch (error) {
            console.error('Error actualizando regla:', error);
            setError('Error al actualizar la regla de alerta');
        }
    }, [user?.organizationId, user?.id, loadAlertRules]);

    // Eliminar regla
    const deleteRule = useCallback(async (ruleId: string) => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/alerts/rules/${ruleId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadAlertRules();
                    logger.info('Regla de alerta eliminada', { ruleId, userId: user?.id });
                }
            }
        } catch (error) {
            console.error('Error eliminando regla:', error);
            setError('Error al eliminar la regla de alerta');
        }
    }, [user?.organizationId, user?.id, loadAlertRules]);

    // Reconocer alerta
    const acknowledgeAlert = useCallback(async (alertId: string) => {
        if (!user?.organizationId) return;

        try {
            const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acknowledged_by: user?.name || 'Usuario'
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    loadAlerts();
                    logger.info('Alerta reconocida', { alertId, userId: user?.id });
                }
            }
        } catch (error) {
            console.error('Error reconociendo alerta:', error);
            setError('Error al reconocer la alerta');
        }
    }, [user?.organizationId, user?.id, user?.name, loadAlerts]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'default';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <XCircleIcon className="h-5 w-5" />;
            case 'high': return <ExclamationTriangleIcon className="h-5 w-5" />;
            case 'medium': return <BellIcon className="h-5 w-5" />;
            case 'low': return <CheckCircleIcon className="h-5 w-5" />;
            default: return <BellIcon className="h-5 w-5" />;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Sistema de Alertas
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PlusIcon className="h-5 w-5" />}
                    onClick={() => {
                        setEditingRule(null);
                        setConfigDialogOpen(true);
                    }}
                >
                    Nueva Regla
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Estadísticas */}
                <Grid item xs={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom>
                                                Alertas Activas
                                            </Typography>
                                            <Typography variant="h4">
                                                {alerts.filter(a => !a.acknowledged).length}
                                            </Typography>
                                        </Box>
                                        <BellIcon className="h-8 w-8 text-red-500" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom>
                                                Reglas Configuradas
                                            </Typography>
                                            <Typography variant="h4">
                                                {alertRules.length}
                                            </Typography>
                                        </Box>
                                        <Cog6ToothIcon className="h-8 w-8 text-blue-500" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom>
                                                Alertas Críticas
                                            </Typography>
                                            <Typography variant="h4">
                                                {alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length}
                                            </Typography>
                                        </Box>
                                        <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom>
                                                Reconocidas Hoy
                                            </Typography>
                                            <Typography variant="h4">
                                                {alerts.filter(a => a.acknowledged &&
                                                    new Date(a.acknowledged_at || '').toDateString() === new Date().toDateString()
                                                ).length}
                                            </Typography>
                                        </Box>
                                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Alertas Activas */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Alertas Activas ({alerts.filter(a => !a.acknowledged).length})
                            </Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Severidad</TableCell>
                                            <TableCell>Vehículo</TableCell>
                                            <TableCell>Regla</TableCell>
                                            <TableCell>Mensaje</TableCell>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {alerts.filter(a => !a.acknowledged).map((alert) => (
                                            <TableRow key={alert.id} hover>
                                                <TableCell>
                                                    <Chip
                                                        icon={getSeverityIcon(alert.severity)}
                                                        label={alert.severity.toUpperCase()}
                                                        size="small"
                                                        color={getSeverityColor(alert.severity) as any}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {alert.vehicle_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {alert.vehicle_id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {alert.rule_name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {alert.message}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption">
                                                        {new Date(alert.timestamp).toLocaleString('es-ES')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => acknowledgeAlert(alert.id)}
                                                    >
                                                        Reconocer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Reglas de Alerta */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Reglas de Alerta ({alertRules.length})
                            </Typography>
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {alertRules.map((rule) => (
                                    <Box key={rule.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                            <Typography variant="subtitle2" fontWeight="medium">
                                                {rule.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setEditingRule(rule);
                                                        setConfigDialogOpen(true);
                                                    }}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => deleteRule(rule.id)}
                                                    color="error"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {rule.description}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Chip
                                                label={rule.type.toUpperCase()}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={rule.enabled}
                                                        onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                                                        size="small"
                                                    />
                                                }
                                                label="Activa"
                                                labelPlacement="start"
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Diálogo de Configuración */}
            <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingRule ? 'Editar Regla de Alerta' : 'Nueva Regla de Alerta'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre de la Regla"
                                value={editingRule?.name || newRule.name}
                                onChange={(e) => {
                                    if (editingRule) {
                                        setEditingRule({ ...editingRule, name: e.target.value });
                                    } else {
                                        setNewRule({ ...newRule, name: e.target.value });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo de Alerta</InputLabel>
                                <Select
                                    value={editingRule?.type || newRule.type}
                                    onChange={(e) => {
                                        if (editingRule) {
                                            setEditingRule({ ...editingRule, type: e.target.value as any });
                                        } else {
                                            setNewRule({ ...newRule, type: e.target.value as any });
                                        }
                                    }}
                                    label="Tipo de Alerta"
                                >
                                    <MenuItem value="speed">Velocidad</MenuItem>
                                    <MenuItem value="stability">Estabilidad</MenuItem>
                                    <MenuItem value="geofence">Geocerca</MenuItem>
                                    <MenuItem value="emergency">Emergencia</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                multiline
                                rows={3}
                                value={editingRule?.description || newRule.description}
                                onChange={(e) => {
                                    if (editingRule) {
                                        setEditingRule({ ...editingRule, description: e.target.value });
                                    } else {
                                        setNewRule({ ...newRule, description: e.target.value });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Condición</InputLabel>
                                <Select
                                    value={editingRule?.condition || newRule.condition}
                                    onChange={(e) => {
                                        if (editingRule) {
                                            setEditingRule({ ...editingRule, condition: e.target.value });
                                        } else {
                                            setNewRule({ ...newRule, condition: e.target.value });
                                        }
                                    }}
                                    label="Condición"
                                >
                                    <MenuItem value="greater_than">Mayor que</MenuItem>
                                    <MenuItem value="less_than">Menor que</MenuItem>
                                    <MenuItem value="equals">Igual a</MenuItem>
                                    <MenuItem value="exit">Salir de zona</MenuItem>
                                    <MenuItem value="enter">Entrar a zona</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Umbral"
                                type="number"
                                value={editingRule?.threshold || newRule.threshold}
                                onChange={(e) => {
                                    if (editingRule) {
                                        setEditingRule({ ...editingRule, threshold: Number(e.target.value) });
                                    } else {
                                        setNewRule({ ...newRule, threshold: Number(e.target.value) });
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                Notificaciones
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editingRule?.notifications.email || newRule.notifications?.email}
                                                onChange={(e) => {
                                                    if (editingRule) {
                                                        setEditingRule({
                                                            ...editingRule,
                                                            notifications: { ...editingRule.notifications, email: e.target.checked }
                                                        });
                                                    } else {
                                                        setNewRule({
                                                            ...newRule,
                                                            notifications: { ...newRule.notifications!, email: e.target.checked }
                                                        });
                                                    }
                                                }}
                                            />
                                        }
                                        label="Email"
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editingRule?.notifications.sms || newRule.notifications?.sms}
                                                onChange={(e) => {
                                                    if (editingRule) {
                                                        setEditingRule({
                                                            ...editingRule,
                                                            notifications: { ...editingRule.notifications, sms: e.target.checked }
                                                        });
                                                    } else {
                                                        setNewRule({
                                                            ...newRule,
                                                            notifications: { ...newRule.notifications!, sms: e.target.checked }
                                                        });
                                                    }
                                                }}
                                            />
                                        }
                                        label="SMS"
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={editingRule?.notifications.push || newRule.notifications?.push}
                                                onChange={(e) => {
                                                    if (editingRule) {
                                                        setEditingRule({
                                                            ...editingRule,
                                                            notifications: { ...editingRule.notifications, push: e.target.checked }
                                                        });
                                                    } else {
                                                        setNewRule({
                                                            ...newRule,
                                                            notifications: { ...newRule.notifications!, push: e.target.checked }
                                                        });
                                                    }
                                                }}
                                            />
                                        }
                                        label="Push"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfigDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            if (editingRule) {
                                updateRule(editingRule.id, editingRule);
                                setConfigDialogOpen(false);
                                setEditingRule(null);
                            } else {
                                createRule();
                            }
                        }}
                    >
                        {editingRule ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};