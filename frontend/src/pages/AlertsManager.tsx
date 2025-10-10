import {
    Add as AddIcon,
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    LocationOn as LocationIcon,
    Notifications as NotificationsIcon,
    Schedule as ScheduleIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    Speed as SpeedIcon,
    TrendingDown as TrendingDownIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Switch,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert as OperationsAlert, operationsService } from '../services/operations';
import { logger } from '../utils/logger';

// Interfaces
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface AlertRule {
    id: string;
    name: string;
    description: string;
    type: 'speed' | 'geofence' | 'stability' | 'maintenance' | 'emergency' | 'custom';
    condition: {
        operator: 'greater_than' | 'less_than' | 'equals' | 'contains' | 'between';
        value: number | string;
        field: string;
        threshold?: number;
    };
    action: {
        type: 'notification' | 'email' | 'sms' | 'webhook' | 'dashboard';
        recipients: string[];
        message: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
    };
    isActive: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    vehicleTypes: string[];
    departments: string[];
    createdAt: string;
    updatedAt: string;
    triggerCount: number;
    lastTriggered?: string;
}

interface AlertEvent {
    id: string;
    ruleId: string;
    ruleName: string;
    vehicleId: string;
    vehicleName: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
    acknowledgedBy?: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    data: Record<string, any>;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`alerts-tabpanel-${index}`}
            aria-labelledby={`alerts-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const AlertsManager: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    // Estados principales
    const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
    const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
    const [realAlerts, setRealAlerts] = useState<OperationsAlert[]>([]);
    const [alertStats, setAlertStats] = useState<any>(null);

    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para formularios
    const [showRuleDialog, setShowRuleDialog] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [severityFilter, setSeverityFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Datos simulados para Bomberos Madrid
    const mockAlertRules: AlertRule[] = [
        {
            id: '1',
            name: 'Exceso de Velocidad en Zona Urbana',
            description: 'Alerta cuando un vehículo supera los 50 km/h en zona urbana',
            type: 'speed',
            condition: {
                operator: 'greater_than',
                value: 50,
                field: 'speed',
                threshold: 50
            },
            action: {
                type: 'notification',
                recipients: ['supervisor@bomberosmadrid.es'],
                message: 'Vehículo {vehicleName} ha superado el límite de velocidad en zona urbana',
                priority: 'high'
            },
            isActive: true,
            frequency: 'immediate',
            vehicleTypes: ['BOMBA', 'ESCALERA', 'URGENCIA'],
            departments: ['Central', 'Distrito Norte', 'Distrito Sur'],
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-12-20T15:30:00Z',
            triggerCount: 23,
            lastTriggered: '2024-12-20T14:30:00Z'
        },
        {
            id: '2',
            name: 'Entrada en Zona de Alto Riesgo',
            description: 'Alerta inmediata cuando un vehículo entra en zona de alto riesgo',
            type: 'geofence',
            condition: {
                operator: 'equals',
                value: 'entry',
                field: 'geofence_event'
            },
            action: {
                type: 'notification',
                recipients: ['comandante@bomberosmadrid.es', 'supervisor@bomberosmadrid.es'],
                message: 'Vehículo {vehicleName} ha entrado en zona de alto riesgo: {geofence_name}',
                priority: 'critical'
            },
            isActive: true,
            frequency: 'immediate',
            vehicleTypes: ['BOMBA', 'ESCALERA'],
            departments: ['Central', 'Distrito Norte', 'Distrito Sur'],
            createdAt: '2024-02-20T14:30:00Z',
            updatedAt: '2024-12-18T09:15:00Z',
            triggerCount: 8,
            lastTriggered: '2024-12-19T16:45:00Z'
        },
        {
            id: '3',
            name: 'Bajo Nivel de Estabilidad',
            description: 'Alerta cuando el LTR de un vehículo está por debajo del umbral crítico',
            type: 'stability',
            condition: {
                operator: 'less_than',
                value: 6.0,
                field: 'ltr_score'
            },
            action: {
                type: 'notification',
                recipients: ['mantenimiento@bomberosmadrid.es'],
                message: 'Vehículo {vehicleName} presenta estabilidad crítica (LTR: {ltr_score})',
                priority: 'high'
            },
            isActive: true,
            frequency: 'immediate',
            vehicleTypes: ['BOMBA', 'ESCALERA', 'URGENCIA'],
            departments: ['Central', 'Distrito Norte', 'Distrito Sur'],
            createdAt: '2024-03-10T09:20:00Z',
            updatedAt: '2024-12-19T16:45:00Z',
            triggerCount: 5,
            lastTriggered: '2024-12-18T11:20:00Z'
        },
        {
            id: '4',
            name: 'Mantenimiento Programado',
            description: 'Recordatorio de mantenimiento preventivo',
            type: 'maintenance',
            condition: {
                operator: 'equals',
                value: 'due',
                field: 'maintenance_status'
            },
            action: {
                type: 'email',
                recipients: ['mantenimiento@bomberosmadrid.es'],
                message: 'Vehículo {vehicleName} requiere mantenimiento preventivo',
                priority: 'medium'
            },
            isActive: true,
            frequency: 'daily',
            vehicleTypes: ['BOMBA', 'ESCALERA', 'URGENCIA', 'MANTENIMIENTO'],
            departments: ['Central', 'Distrito Norte', 'Distrito Sur'],
            createdAt: '2024-04-01T08:00:00Z',
            updatedAt: '2024-12-15T10:30:00Z',
            triggerCount: 12,
            lastTriggered: '2024-12-20T08:00:00Z'
        }
    ];

    const mockAlertEvents: AlertEvent[] = [
        {
            id: '1',
            ruleId: '1',
            ruleName: 'Exceso de Velocidad en Zona Urbana',
            vehicleId: 'DOBACK027',
            vehicleName: 'Bomba Escalera 027',
            alertType: 'speed',
            severity: 'high',
            message: 'Vehículo Bomba Escalera 027 ha superado el límite de velocidad en zona urbana',
            timestamp: '2024-12-20T14:30:00Z',
            status: 'active',
            data: { speed: 65, limit: 50, location: 'Calle Alcalá, Madrid' }
        },
        {
            id: '2',
            ruleId: '2',
            ruleName: 'Entrada en Zona de Alto Riesgo',
            vehicleId: 'DOBACK015',
            vehicleName: 'Escalera Automática 015',
            alertType: 'geofence',
            severity: 'critical',
            message: 'Vehículo Escalera Automática 015 ha entrado en zona de alto riesgo: Chamartín',
            timestamp: '2024-12-20T13:45:00Z',
            status: 'acknowledged',
            acknowledgedBy: 'Carlos Rodríguez',
            acknowledgedAt: '2024-12-20T13:50:00Z',
            data: { geofence: 'Chamartín', event: 'entry', coordinates: [40.4600, -3.6750] }
        },
        {
            id: '3',
            ruleId: '3',
            ruleName: 'Bajo Nivel de Estabilidad',
            vehicleId: 'DOBACK042',
            vehicleName: 'Unidad de Urgencia 042',
            alertType: 'stability',
            severity: 'high',
            message: 'Vehículo Unidad de Urgencia 042 presenta estabilidad crítica (LTR: 5.2)',
            timestamp: '2024-12-20T12:15:00Z',
            status: 'resolved',
            acknowledgedBy: 'María González',
            acknowledgedAt: '2024-12-20T12:20:00Z',
            resolvedAt: '2024-12-20T12:45:00Z',
            data: { ltr_score: 5.2, threshold: 6.0, session_id: 'session_123' }
        }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            logger.info('[AlertsManager] Cargando datos reales de alertas');

            // Cargar alertas reales del backend
            const alertsResponse = await operationsService.getAlerts({
                limit: 100,
                offset: 0
            });

            logger.info('[AlertsManager] Alertas reales cargadas:', {
                count: alertsResponse.alerts.length,
                stats: alertsResponse.stats
            });

            // Mapear alertas del backend al formato del componente
            const mappedAlerts: AlertEvent[] = alertsResponse.alerts.map(alert => ({
                id: alert.id,
                ruleId: alert.ruleId,
                ruleName: alert.ruleName,
                vehicleId: alert.vehicleId,
                vehicleName: alert.vehicleName,
                alertType: alert.alertType,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp,
                status: alert.status,
                data: alert.data
            }));

            setRealAlerts(alertsResponse.alerts);
            setAlertEvents(mappedAlerts);
            setAlertStats(alertsResponse.stats);

            // Mantener reglas mock por ahora (se pueden crear dinámicamente después)
            setAlertRules(mockAlertRules);

            logger.info('[AlertsManager] Datos cargados correctamente');
        } catch (error) {
            logger.error('[AlertsManager] Error cargando datos de alertas:', error);
            setError('Error al cargar los datos de alertas');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar reglas de alerta
    const filteredAlertRules = useMemo(() => {
        let filtered = alertRules;

        if (searchTerm) {
            filtered = filtered.filter(rule =>
                rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(rule => rule.type === typeFilter);
        }

        return filtered;
    }, [alertRules, searchTerm, typeFilter]);

    // Filtrar eventos de alerta
    const filteredAlertEvents = useMemo(() => {
        let filtered = alertEvents;

        if (severityFilter !== 'ALL') {
            filtered = filtered.filter(event => event.severity === severityFilter);
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }

        return filtered;
    }, [alertEvents, severityFilter, statusFilter]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCreateRule = () => {
        setEditingRule(null);
        setShowRuleDialog(true);
    };

    const handleEditRule = (rule: AlertRule) => {
        setEditingRule(rule);
        setShowRuleDialog(true);
    };

    const handleDeleteRule = async (ruleId: string) => {
        try {
            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 500));
            setAlertRules(prev => prev.filter(r => r.id !== ruleId));
            setSuccess('Regla de alerta eliminada correctamente');
        } catch (error) {
            logger.error('Error eliminando regla de alerta:', error);
            setError('Error al eliminar la regla de alerta');
        }
    };

    const handleToggleRule = async (ruleId: string) => {
        try {
            // Simular toggle
            await new Promise(resolve => setTimeout(resolve, 300));
            setAlertRules(prev => prev.map(r =>
                r.id === ruleId ? { ...r, isActive: !r.isActive } : r
            ));
            setSuccess('Estado de la regla actualizado');
        } catch (error) {
            logger.error('Error actualizando regla:', error);
            setError('Error al actualizar la regla');
        }
    };

    const handleAcknowledgeAlert = async (alertId: string) => {
        try {
            // Simular reconocimiento
            await new Promise(resolve => setTimeout(resolve, 300));
            setAlertEvents(prev => prev.map(event =>
                event.id === alertId
                    ? {
                        ...event,
                        status: 'acknowledged' as const,
                        acknowledgedBy: 'Usuario Actual',
                        acknowledgedAt: new Date().toISOString()
                    }
                    : event
            ));
            setSuccess('Alerta reconocida correctamente');
        } catch (error) {
            logger.error('Error reconociendo alerta:', error);
            setError('Error al reconocer la alerta');
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            // Simular resolución
            await new Promise(resolve => setTimeout(resolve, 300));
            setAlertEvents(prev => prev.map(event =>
                event.id === alertId
                    ? {
                        ...event,
                        status: 'resolved' as const,
                        resolvedAt: new Date().toISOString()
                    }
                    : event
            ));
            setSuccess('Alerta resuelta correctamente');
        } catch (error) {
            logger.error('Error resolviendo alerta:', error);
            setError('Error al resolver la alerta');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'speed': return <SpeedIcon />;
            case 'geofence': return <LocationIcon />;
            case 'stability': return <TrendingDownIcon />;
            case 'maintenance': return <ScheduleIcon />;
            case 'emergency': return <WarningIcon />;
            default: return <InfoIcon />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'default';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'error';
            case 'acknowledged': return 'warning';
            case 'resolved': return 'success';
            case 'dismissed': return 'default';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Activa';
            case 'acknowledged': return 'Reconocida';
            case 'resolved': return 'Resuelta';
            case 'dismissed': return 'Descartada';
            default: return status;
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 2, fontSize: 40 }} />
                    Gestión de Alertas Inteligentes - Bomberos Madrid
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Configura y gestiona reglas de alerta automáticas para monitoreo de vehículos
                </Typography>
            </Box>

            {/* Estadísticas rápidas - Usando datos reales del backend */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <SettingsIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Reglas Activas
                                    </Typography>
                                    <Typography variant="h5">
                                        {alertRules.filter(r => r.isActive).length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <WarningIcon sx={{ color: 'error.main', fontSize: 32 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Alertas Activas (Reales)
                                    </Typography>
                                    <Typography variant="h5">
                                        {alertStats?.active || alertEvents.filter(e => e.status === 'active').length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <ErrorIcon sx={{ color: 'warning.main', fontSize: 32 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Críticas (Datos Reales)
                                    </Typography>
                                    <Typography variant="h5">
                                        {alertStats?.critical || alertEvents.filter(e => e.severity === 'critical').length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Última Semana
                                    </Typography>
                                    <Typography variant="h5">
                                        {alertStats?.total || alertEvents.length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper elevation={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="alerts tabs">
                        <Tab
                            icon={<SettingsIcon />}
                            label="Reglas de Alerta"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<WarningIcon />}
                            label="Eventos de Alerta"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<NotificationsIcon />}
                            label="Configuración"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Pestaña: Reglas de Alerta */}
                <TabPanel value={activeTab} index={0}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Reglas de Alerta Configuradas
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                size="small"
                                placeholder="Buscar reglas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                                sx={{ minWidth: 200 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={typeFilter}
                                    label="Tipo"
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="speed">Velocidad</MenuItem>
                                    <MenuItem value="geofence">Geofence</MenuItem>
                                    <MenuItem value="stability">Estabilidad</MenuItem>
                                    <MenuItem value="maintenance">Mantenimiento</MenuItem>
                                    <MenuItem value="emergency">Emergencia</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateRule}
                            >
                                Nueva Regla
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Regla</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Prioridad</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Frecuencia</TableCell>
                                    <TableCell>Triggers</TableCell>
                                    <TableCell>Último Trigger</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAlertRules.map((rule) => (
                                    <TableRow key={rule.id} hover>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Box sx={{ color: 'primary.main' }}>
                                                    {getTypeIcon(rule.type)}
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {rule.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {rule.description}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.type.toUpperCase()}
                                                size="small"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.action.priority.toUpperCase()}
                                                size="small"
                                                color={getSeverityColor(rule.action.priority)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Switch
                                                    checked={rule.isActive}
                                                    onChange={() => handleToggleRule(rule.id)}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={rule.isActive ? 'Activa' : 'Inactiva'}
                                                    size="small"
                                                    color={rule.isActive ? 'success' : 'default'}
                                                />
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={rule.frequency.toUpperCase()}
                                                size="small"
                                                color="info"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {rule.triggerCount}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {rule.lastTriggered ? formatDate(rule.lastTriggered) : 'Nunca'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditRule(rule)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredAlertRules.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        labelRowsPerPage="Filas por página:"
                    />
                </TabPanel>

                {/* Pestaña: Eventos de Alerta */}
                <TabPanel value={activeTab} index={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Eventos de Alerta Recientes
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Severidad</InputLabel>
                                <Select
                                    value={severityFilter}
                                    label="Severidad"
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todas</MenuItem>
                                    <MenuItem value="critical">Crítica</MenuItem>
                                    <MenuItem value="high">Alta</MenuItem>
                                    <MenuItem value="medium">Media</MenuItem>
                                    <MenuItem value="low">Baja</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Estado"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="active">Activas</MenuItem>
                                    <MenuItem value="acknowledged">Reconocidas</MenuItem>
                                    <MenuItem value="resolved">Resueltas</MenuItem>
                                    <MenuItem value="dismissed">Descartadas</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell>Regla</TableCell>
                                    <TableCell>Severidad</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Mensaje</TableCell>
                                    <TableCell>Fecha/Hora</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAlertEvents.map((event) => (
                                    <TableRow key={event.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {event.vehicleName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {event.vehicleId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {event.ruleName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.severity.toUpperCase()}
                                                size="small"
                                                color={getSeverityColor(event.severity)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusText(event.status)}
                                                size="small"
                                                color={getStatusColor(event.status)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                                {event.message}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{formatDate(event.timestamp)}</TableCell>
                                        <TableCell align="center">
                                            {event.status === 'active' && (
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <Tooltip title="Reconocer">
                                                        <IconButton
                                                            size="small"
                                                            color="warning"
                                                            onClick={() => handleAcknowledgeAlert(event.id)}
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Resolver">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleResolveAlert(event.id)}
                                                        >
                                                            <CheckIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            )}
                                            {event.status === 'acknowledged' && (
                                                <Tooltip title="Resolver">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handleResolveAlert(event.id)}
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Pestaña: Configuración */}
                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Configuración del Sistema de Alertas
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Configuración General
                                    </Typography>
                                    <Stack spacing={2}>
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Sistema de alertas activo"
                                        />
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Notificaciones por email"
                                        />
                                        <FormControlLabel
                                            control={<Switch />}
                                            label="Notificaciones por SMS"
                                        />
                                        <FormControlLabel
                                            control={<Switch defaultChecked />}
                                            label="Alertas en dashboard"
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Configuración de Notificaciones
                                    </Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Email de notificaciones"
                                            defaultValue="alertas@bomberosmadrid.es"
                                            fullWidth
                                        />
                                        <TextField
                                            label="Teléfono de emergencias"
                                            defaultValue="+34 91 123 4567"
                                            fullWidth
                                        />
                                        <TextField
                                            label="Webhook URL"
                                            placeholder="https://api.bomberosmadrid.es/webhook"
                                            fullWidth
                                        />
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Snackbars para notificaciones */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AlertsManager;
