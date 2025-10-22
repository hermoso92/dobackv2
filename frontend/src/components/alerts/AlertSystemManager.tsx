/**
 * AlertSystemManager - Gestor de Alertas para MANAGER
 * 
 * Funcionalidades:
 * - Dashboard de alertas pendientes
 * - Lista de vehículos con archivos faltantes
 * - Resolución/Ignorar alertas
 * - Estadísticas
 * - Historial
 */

import {
    CheckCircle as CheckIcon,
    Close as CloseIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Badge,
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
    Grid,
    List,
    ListItem,
    ListItemText,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`alert-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

interface MissingFileAlert {
    id: string;
    vehicleId: string;
    date: string;
    missingFiles: string[];
    uploadedFiles: string[];
    status: string;
    severity: string;
    Vehicle: {
        name: string;
        identifier: string;
        licensePlate: string;
    };
    createdAt: string;
    resolvedAt?: string;
    ResolvedByUser?: {
        name: string;
    };
    resolutionNotes?: string;
}

const AlertSystemManager: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<MissingFileAlert[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedAlert, setSelectedAlert] = useState<MissingFileAlert | null>(null);
    const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const filterStatus = 'pending';

    useEffect(() => {
        fetchData();
    }, [filterStatus]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const statusFilter = filterStatus === 'pending' ? ['PENDING', 'NOTIFIED'] : filterStatus;

            const [alertsResponse, statsResponse] = await Promise.all([
                apiService.get('/api/alerts', {
                    params: { status: statusFilter }
                }),
                apiService.get('/api/alerts/stats')
            ]);

            if (alertsResponse.success) {
                setAlerts(alertsResponse.data as MissingFileAlert[]);
            }

            if (statsResponse.success) {
                setStats(statsResponse.data as any);
            }
        } catch (error) {
            logger.error('Error cargando alertas', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedAlert) return;

        try {
            const response = await apiService.post(`/api/alerts/${selectedAlert.id}/resolve`, {
                notes: resolutionNotes
            });

            if (response.success) {
                setResolveDialogOpen(false);
                setSelectedAlert(null);
                setResolutionNotes('');
                fetchData();
            }
        } catch (error) {
            logger.error('Error resolviendo alerta', error);
        }
    };

    const handleIgnore = async (alertId: string) => {
        try {
            const response = await apiService.post(`/api/alerts/${alertId}/ignore`);

            if (response.success) {
                fetchData();
            }
        } catch (error) {
            logger.error('Error ignorando alerta', error);
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <ErrorIcon color="error" />;
            case 'ERROR':
                return <ErrorIcon color="warning" />;
            case 'WARNING':
                return <WarningIcon color="warning" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const getSeverityColor = (severity: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (severity) {
            case 'CRITICAL':
                return 'error';
            case 'ERROR':
                return 'warning';
            case 'WARNING':
                return 'warning';
            default:
                return 'info';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    const pendingAlerts = alerts.filter(a => ['PENDING', 'NOTIFIED'].includes(a.status));
    const criticalAlerts = pendingAlerts.filter(a => a.severity === 'CRITICAL');

    return (
        <Box>
            {/* Estadísticas */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Total Alertas
                            </Typography>
                            <Typography variant="h3" color="primary">
                                {stats?.totalAlerts || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Pendientes
                            </Typography>
                            <Badge badgeContent={pendingAlerts.length} color="warning">
                                <Typography variant="h3" color="warning.main">
                                    {stats?.pendingAlerts || 0}
                                </Typography>
                            </Badge>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Críticas
                            </Typography>
                            <Badge badgeContent={criticalAlerts.length} color="error">
                                <Typography variant="h3" color="error.main">
                                    {stats?.criticalAlerts || 0}
                                </Typography>
                            </Badge>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Resueltas (7 días)
                            </Typography>
                            <Typography variant="h3" color="success.main">
                                {stats?.resolvedLast7Days || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Pestañas */}
            <Card>
                <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                    <Tab label={`Pendientes (${pendingAlerts.length})`} />
                    <Tab label="Todas" />
                    <Tab label="Resueltas" />
                </Tabs>

                {/* Panel Pendientes */}
                <TabPanel value={activeTab} index={0}>
                    {pendingAlerts.length === 0 ? (
                        <Alert severity="success">
                            ✅ No hay alertas pendientes
                        </Alert>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Severidad</TableCell>
                                        <TableCell>Vehículo</TableCell>
                                        <TableCell>Fecha</TableCell>
                                        <TableCell>Archivos Faltantes</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingAlerts.map((alert) => (
                                        <TableRow key={alert.id}>
                                            <TableCell>
                                                <Chip
                                                    icon={getSeverityIcon(alert.severity)}
                                                    label={alert.severity}
                                                    color={getSeverityColor(alert.severity)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {alert.Vehicle.name}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {alert.Vehicle.licensePlate}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(alert.date).toLocaleDateString('es-ES')}
                                            </TableCell>
                                            <TableCell>
                                                <List dense>
                                                    {alert.missingFiles.map((file, idx) => (
                                                        <ListItem key={idx}>
                                                            <ListItemText primary={file} />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={alert.status}
                                                    color={alert.status === 'NOTIFIED' ? 'warning' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" gap={1}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<CheckIcon />}
                                                        onClick={() => {
                                                            setSelectedAlert(alert);
                                                            setResolveDialogOpen(true);
                                                        }}
                                                    >
                                                        Resolver
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<CloseIcon />}
                                                        onClick={() => handleIgnore(alert.id)}
                                                    >
                                                        Ignorar
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </TabPanel>

                {/* Panel Todas */}
                <TabPanel value={activeTab} index={1}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Severidad</TableCell>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Archivos Faltantes</TableCell>
                                    <TableCell>Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alerts.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>
                                            <Chip
                                                icon={getSeverityIcon(alert.severity)}
                                                label={alert.severity}
                                                color={getSeverityColor(alert.severity)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{alert.Vehicle.name}</TableCell>
                                        <TableCell>
                                            {new Date(alert.date).toLocaleDateString('es-ES')}
                                        </TableCell>
                                        <TableCell>
                                            {alert.missingFiles.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={alert.status} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>

                {/* Panel Resueltas */}
                <TabPanel value={activeTab} index={2}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell>Fecha Alerta</TableCell>
                                    <TableCell>Archivos Faltantes</TableCell>
                                    <TableCell>Resuelta Por</TableCell>
                                    <TableCell>Fecha Resolución</TableCell>
                                    <TableCell>Notas</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {alerts.filter(a => a.status === 'RESOLVED').map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>{alert.Vehicle.name}</TableCell>
                                        <TableCell>
                                            {new Date(alert.date).toLocaleDateString('es-ES')}
                                        </TableCell>
                                        <TableCell>
                                            {alert.missingFiles.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            {alert.ResolvedByUser?.name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {alert.resolvedAt
                                                ? new Date(alert.resolvedAt).toLocaleDateString('es-ES')
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{alert.resolutionNotes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </TabPanel>
            </Card>

            {/* Dialog Resolver */}
            <Dialog open={resolveDialogOpen} onClose={() => setResolveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Resolver Alerta</DialogTitle>
                <DialogContent>
                    {selectedAlert && (
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                <strong>Vehículo:</strong> {selectedAlert.Vehicle.name}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Fecha:</strong> {new Date(selectedAlert.date).toLocaleDateString('es-ES')}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Archivos faltantes:</strong> {selectedAlert.missingFiles.join(', ')}
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Notas de resolución (opcional)"
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveDialogOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleResolve} variant="contained" color="success">
                        Resolver
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AlertSystemManager;
