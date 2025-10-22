import {
import { logger } from '../utils/logger';
    Download as DownloadIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon,
    Assessment as ReportIcon,
    Stop as StopIcon,
    Storage as StorageIcon,
    CheckCircle as SuccessIcon,
    CloudUpload as UploadIcon,
    Visibility as ViewIcon,
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
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface ProcessingStats {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    totalSessions: number;
    createdSessions: number;
    failedSessions: number;
    totalMeasurements: number;
    stabilityMeasurements: number;
    canMeasurements: number;
    gpsMeasurements: number;
    rotativoMeasurements: number;
    processingTime: number;
    lastProcessed: string;
}

interface ProcessingLog {
    timestamp: string;
    level: 'info' | 'error' | 'warning' | 'success';
    message: string;
}

interface SessionSummary {
    id: string;
    vehicleName: string;
    date: string;
    measurements: {
        stability: number;
        can: number;
        gps: number;
        rotativo: number;
        total: number;
    };
    status: 'completed' | 'processing' | 'failed';
}

const ProcessingDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [stats, setStats] = useState<ProcessingStats | null>(null);
    const [logs, setLogs] = useState<ProcessingLog[]>([]);
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logDialogOpen, setLogDialogOpen] = useState(false);
    const [selectedLogType, setSelectedLogType] = useState<'main' | 'errors' | 'progress'>('main');

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 5000); // Actualizar cada 5 segundos
        return () => clearInterval(interval);
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Cargar estadísticas
            const statsResponse = await api.get('/api/processing/stats');
            setStats(statsResponse.data);

            // Cargar sesiones recientes
            const sessionsResponse = await api.get('/api/processing/sessions');
            setSessions(sessionsResponse.data);

            // Cargar logs recientes
            const logsResponse = await api.get('/api/processing/logs');
            setLogs(logsResponse.data);

        } catch (err) {
            logger.error('Error loading dashboard data:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const startProcessing = async () => {
        try {
            setIsProcessing(true);
            setError(null);

            await api.post('/api/processing/start');

            // Recargar datos después de iniciar procesamiento
            setTimeout(loadDashboardData, 2000);

        } catch (err) {
            logger.error('Error starting processing:', err);
            setError('Error al iniciar el procesamiento');
        } finally {
            setIsProcessing(false);
        }
    };

    const stopProcessing = async () => {
        try {
            setIsProcessing(false);
            await api.post('/api/processing/stop');
        } catch (err) {
            logger.error('Error stopping processing:', err);
        }
    };

    const resetDatabase = async () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar todos los datos de procesamiento? Esta acción no se puede deshacer.')) {
            try {
                await api.post('/api/processing/reset');
                loadDashboardData();
            } catch (err) {
                logger.error('Error resetting database:', err);
                setError('Error al limpiar la base de datos');
            }
        }
    };

    const downloadReport = async (type: 'html' | 'json') => {
        try {
            const response = await api.get(`/api/processing/report/${type}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `processing-report.${type}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            logger.error('Error downloading report:', err);
            setError('Error al descargar el reporte');
        }
    };

    const getLogIcon = (level: string) => {
        switch (level) {
            case 'error': return <ErrorIcon color="error" />;
            case 'warning': return <WarningIcon color="warning" />;
            case 'success': return <SuccessIcon color="success" />;
            default: return <InfoIcon color="info" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };

    const tabs = [
        { label: 'Dashboard', icon: <StorageIcon /> },
        { label: 'Procesamiento', icon: <PlayIcon /> },
        { label: 'Sesiones', icon: <UploadIcon /> },
        { label: 'Reportes', icon: <ReportIcon /> },
        { label: 'Logs', icon: <InfoIcon /> }
    ];

    if (isLoading && !stats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                🧠 Dashboard de Procesamiento Inteligente
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    {tabs.map((tab, index) => (
                        <Tab key={index} icon={tab.icon} label={tab.label} />
                    ))}
                </Tabs>
            </Box>

            {/* Tab 0: Dashboard */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    {/* Estadísticas Generales */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 Estadísticas Generales
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="primary">
                                                {stats?.totalSessions || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Sesiones Totales
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="success.main">
                                                {stats?.totalMeasurements?.toLocaleString() || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Mediciones Totales
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="info.main">
                                                {stats?.processedFiles || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Archivos Procesados
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box textAlign="center">
                                            <Typography variant="h4" color="warning.main">
                                                {stats?.processingTime || 0}m
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Tiempo Procesamiento
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Estadísticas por Tipo */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📈 Mediciones por Tipo
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon><InfoIcon color="primary" /></ListItemIcon>
                                        <ListItemText
                                            primary="Estabilidad"
                                            secondary={`${stats?.stabilityMeasurements?.toLocaleString() || 0} mediciones`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><InfoIcon color="secondary" /></ListItemIcon>
                                        <ListItemText
                                            primary="CAN"
                                            secondary={`${stats?.canMeasurements?.toLocaleString() || 0} mediciones`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><InfoIcon color="info" /></ListItemIcon>
                                        <ListItemText
                                            primary="GPS"
                                            secondary={`${stats?.gpsMeasurements?.toLocaleString() || 0} mediciones`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><InfoIcon color="warning" /></ListItemIcon>
                                        <ListItemText
                                            primary="Rotativo"
                                            secondary={`${stats?.rotativoMeasurements?.toLocaleString() || 0} mediciones`}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Estado del Sistema */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    🔧 Estado del Sistema
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <Chip
                                                label={isProcessing ? 'Procesando' : 'Detenido'}
                                                color={isProcessing ? 'warning' : 'default'}
                                                size="small"
                                            />
                                        </ListItemIcon>
                                        <ListItemText primary="Estado del Procesamiento" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                        <ListItemText
                                            primary="Última Actualización"
                                            secondary={stats?.lastProcessed ? new Date(stats.lastProcessed).toLocaleString() : 'Nunca'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><WarningIcon color="warning" /></ListItemIcon>
                                        <ListItemText
                                            primary="Archivos Fallidos"
                                            secondary={`${stats?.failedFiles || 0} archivos`}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 1: Procesamiento */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    🚀 Control de Procesamiento
                                </Typography>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="body1" gutterBottom>
                                        Sistema de procesamiento inteligente que agrupa archivos por fecha y vehículo,
                                        creando una sesión única por día por vehículo.
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<PlayIcon />}
                                        onClick={startProcessing}
                                        disabled={isProcessing}
                                        size="large"
                                    >
                                        {isProcessing ? 'Procesando...' : 'Iniciar Procesamiento'}
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        startIcon={<StopIcon />}
                                        onClick={stopProcessing}
                                        disabled={!isProcessing}
                                        size="large"
                                    >
                                        Detener
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<RefreshIcon />}
                                        onClick={loadDashboardData}
                                        size="large"
                                    >
                                        Actualizar
                                    </Button>
                                </Box>

                                {isProcessing && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            Procesamiento en curso...
                                        </Typography>
                                        <LinearProgress />
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="h6" gutterBottom>
                                    🗑️ Gestión de Datos
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={resetDatabase}
                                    disabled={isProcessing}
                                    sx={{ mr: 2 }}
                                >
                                    Limpiar Base de Datos
                                </Button>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    ⚠️ Esta acción eliminará todas las mediciones y sesiones existentes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Sesiones */}
            {activeTab === 2 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📋 Sesiones Recientes
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Vehículo</TableCell>
                                                <TableCell>Fecha</TableCell>
                                                <TableCell align="right">Estabilidad</TableCell>
                                                <TableCell align="right">CAN</TableCell>
                                                <TableCell align="right">GPS</TableCell>
                                                <TableCell align="right">Rotativo</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell>Estado</TableCell>
                                                <TableCell align="right">Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sessions.map((session) => (
                                                <TableRow key={session.id}>
                                                    <TableCell>{session.vehicleName}</TableCell>
                                                    <TableCell>{new Date(session.date).toLocaleDateString()}</TableCell>
                                                    <TableCell align="right">{session.measurements.stability.toLocaleString()}</TableCell>
                                                    <TableCell align="right">{session.measurements.can.toLocaleString()}</TableCell>
                                                    <TableCell align="right">{session.measurements.gps.toLocaleString()}</TableCell>
                                                    <TableCell align="right">{session.measurements.rotativo.toLocaleString()}</TableCell>
                                                    <TableCell align="right">
                                                        <strong>{session.measurements.total.toLocaleString()}</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={session.status}
                                                            color={getStatusColor(session.status) as any}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Ver detalles">
                                                            <IconButton size="small">
                                                                <ViewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Reportes */}
            {activeTab === 3 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📊 Generar Reportes
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadReport('html')}
                                        size="large"
                                    >
                                        Descargar Reporte HTML
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => downloadReport('json')}
                                        size="large"
                                    >
                                        Descargar Reporte JSON
                                    </Button>
                                </Box>

                                <Typography variant="body1" gutterBottom>
                                    Los reportes incluyen:
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                        <ListItemText primary="Estadísticas completas del sistema" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                        <ListItemText primary="Sesiones por vehículo y fecha" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                        <ListItemText primary="Mediciones por tipo de archivo" />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon><SuccessIcon color="success" /></ListItemIcon>
                                        <ListItemText primary="Análisis de estructura de sesiones" />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 4: Logs */}
            {activeTab === 4 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    📝 Logs del Sistema
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setLogDialogOpen(true)}
                                        startIcon={<ViewIcon />}
                                    >
                                        Ver Logs Completos
                                    </Button>
                                </Box>

                                <List>
                                    {logs.slice(0, 10).map((log, index) => (
                                        <ListItem key={index}>
                                            <ListItemIcon>
                                                {getLogIcon(log.level)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={log.message}
                                                secondary={new Date(log.timestamp).toLocaleString()}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Dialog para logs completos */}
            <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">Logs del Sistema</Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedLogType('main')}
                            color={selectedLogType === 'main' ? 'primary' : 'default'}
                            size="small"
                        >
                            Principal
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedLogType('errors')}
                            color={selectedLogType === 'errors' ? 'error' : 'default'}
                            size="small"
                        >
                            Errores
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => setSelectedLogType('progress')}
                            color={selectedLogType === 'progress' ? 'info' : 'default'}
                            size="small"
                        >
                            Progreso
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ height: '400px', overflow: 'auto' }}>
                        <List>
                            {logs.map((log, index) => (
                                <ListItem key={index} divider>
                                    <ListItemIcon>
                                        {getLogIcon(log.level)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={log.message}
                                        secondary={new Date(log.timestamp).toLocaleString()}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLogDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProcessingDashboard;



