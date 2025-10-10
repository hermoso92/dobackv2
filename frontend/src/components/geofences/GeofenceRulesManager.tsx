import {
    Add,
    Delete,
    Edit,
    Pause,
    PlayArrow,
    Visibility
} from '@mui/icons-material';
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
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface GeofenceRule {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    zoneId?: string;
    parkId?: string;
    conditions: GeofenceCondition[];
    actions: GeofenceAction[];
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

interface GeofenceCondition {
    type: 'TIME_WINDOW' | 'VEHICLE_TYPE' | 'SPEED_LIMIT' | 'DURATION' | 'FREQUENCY' | 'CUSTOM';
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'IN' | 'NOT_IN';
    field: string;
    value: any;
    secondaryValue?: any;
    metadata?: Record<string, any>;
}

interface GeofenceAction {
    type: 'NOTIFICATION' | 'ALERT' | 'LOG' | 'WEBHOOK' | 'EMAIL' | 'SMS' | 'CUSTOM';
    target: string;
    message: string;
    metadata?: Record<string, any>;
    delay?: number;
}

interface GeofenceRulesManagerProps {
    onRuleCreated?: (rule: GeofenceRule) => void;
    onRuleUpdated?: (rule: GeofenceRule) => void;
    onRuleDeleted?: (ruleId: string) => void;
}

export const GeofenceRulesManager: React.FC<GeofenceRulesManagerProps> = ({
    onRuleCreated,
    onRuleUpdated,
    onRuleDeleted
}) => {
    const { user } = useAuth();
    const [rules, setRules] = useState<GeofenceRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<GeofenceRule | null>(null);
    const [selectedRule, setSelectedRule] = useState<GeofenceRule | null>(null);

    // Estados para el formulario de regla
    const [ruleForm, setRuleForm] = useState({
        name: '',
        description: '',
        zoneId: '',
        parkId: '',
        priority: 1,
        isActive: true
    });

    const [conditions, setConditions] = useState<GeofenceCondition[]>([]);
    const [actions, setActions] = useState<GeofenceAction[]>([]);

    const loadRules = useCallback(async () => {
        if (!user?.organizationId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.get('/api/geofence-rules');
            if (response.success) {
                setRules(response.data as GeofenceRule[]);
                logger.info('Reglas de geocercas cargadas', { count: (response.data as GeofenceRule[]).length });
            } else {
                throw new Error((response as any).message || 'Error cargando reglas');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error cargando reglas de geocercas', { error: err });
        } finally {
            setLoading(false);
        }
    }, [user?.organizationId]);

    useEffect(() => {
        loadRules();
    }, [loadRules]);

    const handleCreateRule = async () => {
        if (!user?.organizationId) return;

        try {
            const response = await apiService.post('/api/geofence-rules', {
                ...ruleForm,
                conditions,
                actions,
                organizationId: user.organizationId
            });

            if (response.success) {
                const newRule = response.data as GeofenceRule;
                setRules(prev => [...prev, newRule]);
                setShowCreateDialog(false);
                resetForm();
                onRuleCreated?.(newRule);
                logger.info('Regla de geocerca creada', { ruleId: newRule.id });
            } else {
                throw new Error((response as any).message || 'Error creando regla');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error creando regla de geocerca', { error: err });
        }
    };

    const handleUpdateRule = async (ruleId: string) => {
        try {
            const response = await apiService.put(`/api/geofence-rules/${ruleId}`, {
                ...ruleForm,
                conditions,
                actions
            });

            if (response.success) {
                const updatedRule = response.data as GeofenceRule;
                setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
                setEditingRule(null);
                resetForm();
                onRuleUpdated?.(updatedRule);
                logger.info('Regla de geocerca actualizada', { ruleId });
            } else {
                throw new Error((response as any).message || 'Error actualizando regla');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error actualizando regla de geocerca', { error: err });
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta regla?')) return;

        try {
            const response = await apiService.delete(`/api/geofence-rules/${ruleId}`);
            if (response.success) {
                setRules(prev => prev.filter(rule => rule.id !== ruleId));
                onRuleDeleted?.(ruleId);
                logger.info('Regla de geocerca eliminada', { ruleId });
            } else {
                throw new Error(response.message || 'Error eliminando regla');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error eliminando regla de geocerca', { error: err });
        }
    };

    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
        try {
            const response = await apiService.put(`/api/geofence-rules/${ruleId}/toggle`, {
                isActive
            });

            if (response.success) {
                setRules(prev => prev.map(rule =>
                    rule.id === ruleId ? { ...rule, isActive } : rule
                ));
                logger.info('Estado de regla actualizado', { ruleId, isActive });
            } else {
                throw new Error(response.message || 'Error actualizando estado');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error actualizando estado de regla', { error: err });
        }
    };

    const resetForm = () => {
        setRuleForm({
            name: '',
            description: '',
            zoneId: '',
            parkId: '',
            priority: 1,
            isActive: true
        });
        setConditions([]);
        setActions([]);
    };

    const openEditDialog = (rule: GeofenceRule) => {
        setEditingRule(rule);
        setRuleForm({
            name: rule.name,
            description: rule.description || '',
            zoneId: rule.zoneId || '',
            parkId: rule.parkId || '',
            priority: rule.priority,
            isActive: rule.isActive
        });
        setConditions([...rule.conditions]);
        setActions([...rule.actions]);
        setShowCreateDialog(true);
    };

    const getConditionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'TIME_WINDOW': 'Ventana de Tiempo',
            'VEHICLE_TYPE': 'Tipo de Vehículo',
            'SPEED_LIMIT': 'Límite de Velocidad',
            'DURATION': 'Duración',
            'FREQUENCY': 'Frecuencia',
            'CUSTOM': 'Personalizada'
        };
        return labels[type] || type;
    };

    const getActionTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'NOTIFICATION': 'Notificación',
            'ALERT': 'Alerta',
            'LOG': 'Registro',
            'WEBHOOK': 'Webhook',
            'EMAIL': 'Email',
            'SMS': 'SMS',
            'CUSTOM': 'Personalizada'
        };
        return labels[type] || type;
    };

    const getOperatorLabel = (operator: string) => {
        const labels: Record<string, string> = {
            'EQUALS': 'Igual a',
            'NOT_EQUALS': 'No igual a',
            'GREATER_THAN': 'Mayor que',
            'LESS_THAN': 'Menor que',
            'BETWEEN': 'Entre',
            'IN': 'En',
            'NOT_IN': 'No en'
        };
        return labels[operator] || operator;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Gestión de Reglas de Geocercas
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowCreateDialog(true)}
                    disabled={loading}
                >
                    Nueva Regla
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Lista de Reglas */}
            <Card>
                <CardContent>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Prioridad</TableCell>
                                    <TableCell>Condiciones</TableCell>
                                    <TableCell>Acciones</TableCell>
                                    <TableCell>Última Actualización</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {rule.name}
                                                </Typography>
                                                {rule.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {rule.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={rule.isActive ? <PlayArrow /> : <Pause />}
                                                label={rule.isActive ? 'Activa' : 'Inactiva'}
                                                color={rule.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.priority}
                                                color={rule.priority > 5 ? 'error' : rule.priority > 3 ? 'warning' : 'primary'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {rule.conditions.length} condición(es)
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {rule.actions.length} acción(es)
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption">
                                                {new Date(rule.updatedAt).toLocaleDateString('es-ES')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setSelectedRule(rule)}
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openEditDialog(rule)}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={rule.isActive ? 'Desactivar' : 'Activar'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleRule(rule.id, !rule.isActive)}
                                                    >
                                                        {rule.isActive ? <Pause /> : <PlayArrow />}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {rules.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary">
                                No hay reglas de geocercas configuradas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Crea tu primera regla para comenzar
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para crear/editar regla */}
            <Dialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editingRule ? 'Editar Regla de Geocerca' : 'Nueva Regla de Geocerca'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nombre de la Regla"
                                value={ruleForm.name}
                                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prioridad"
                                type="number"
                                value={ruleForm.priority}
                                onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                                inputProps={{ min: 1, max: 10 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                multiline
                                rows={2}
                                value={ruleForm.description}
                                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Zona</InputLabel>
                                <Select
                                    value={ruleForm.zoneId}
                                    onChange={(e) => setRuleForm(prev => ({ ...prev, zoneId: e.target.value }))}
                                    label="Zona"
                                >
                                    <MenuItem value="">Todas las zonas</MenuItem>
                                    {/* Aquí se cargarían las zonas disponibles */}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Parque</InputLabel>
                                <Select
                                    value={ruleForm.parkId}
                                    onChange={(e) => setRuleForm(prev => ({ ...prev, parkId: e.target.value }))}
                                    label="Parque"
                                >
                                    <MenuItem value="">Todos los parques</MenuItem>
                                    {/* Aquí se cargarían los parques disponibles */}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Switch
                                    checked={ruleForm.isActive}
                                    onChange={(e) => setRuleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                />
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                    Regla activa
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* TODO: Agregar formularios para condiciones y acciones */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Funcionalidad de configuración de condiciones y acciones en desarrollo.
                        Por ahora se pueden crear reglas básicas.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={editingRule ? () => handleUpdateRule(editingRule.id) : handleCreateRule}
                        disabled={!ruleForm.name}
                    >
                        {editingRule ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para ver detalles de regla */}
            {selectedRule && (
                <Dialog
                    open={!!selectedRule}
                    onClose={() => setSelectedRule(null)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Detalles de la Regla: {selectedRule.name}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedRule.description || 'Sin descripción'}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Condiciones ({selectedRule.conditions.length})
                                </Typography>
                                {selectedRule.conditions.map((condition, index) => (
                                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                                        <CardContent sx={{ py: 1 }}>
                                            <Typography variant="body2">
                                                <strong>{getConditionTypeLabel(condition.type)}</strong>: {condition.field} {getOperatorLabel(condition.operator)} {condition.value}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Acciones ({selectedRule.actions.length})
                                </Typography>
                                {selectedRule.actions.map((action, index) => (
                                    <Card key={index} variant="outlined" sx={{ mb: 1 }}>
                                        <CardContent sx={{ py: 1 }}>
                                            <Typography variant="body2">
                                                <strong>{getActionTypeLabel(action.type)}</strong>: {action.message}
                                            </Typography>
                                            {action.delay && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Delay: {action.delay}ms
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSelectedRule(null)}>
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};
