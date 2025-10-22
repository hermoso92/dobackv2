import {
    Assessment,
    CheckCircle,
    Error,
    Memory,
    Notifications,
    People,
    Refresh,
    Speed,
    Storage,
    Warning,
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
    Grid,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../config/api';
import { usePermissions } from '../hooks/usePermissions';

interface SystemStatus {
    timestamp: string;
    services: {
        backend: ServiceStatus;
        database: ServiceStatus;
        cronJobs: ServiceStatus;
    };
    statistics: {
        users: UserStatistics;
        alerts: AlertStatistics;
        reports: ReportStatistics;
    };
    performance: {
        uptime: number;
        cpu: CpuInfo;
        memory: MemoryInfo;
        responseTime: number;
    };
    logs: RecentLog[];
}

interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'down';
    message: string;
    lastCheck: string;
}

interface UserStatistics {
    total: number;
    byRole: {
        ADMIN: number;
        MANAGER: number;
        OPERATOR: number;
        VIEWER: number;
    };
    activeToday: number;
}

interface AlertStatistics {
    total: number;
    pending: number;
    resolved: number;
    ignored: number;
    critical: number;
}

interface ReportStatistics {
    total: number;
    active: number;
    executedToday: number;
    scheduled: number;
}

interface CpuInfo {
    model: string;
    cores: number;
    usage: number;
}

interface MemoryInfo {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
}

interface RecentLog {
    timestamp: string;
    level: string;
    message: string;
    category?: string;
}

const SystemStatusPage: React.FC = () => {
    const { isAdmin } = usePermissions();
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    // Solo ADMIN puede acceder
    if (!isAdmin()) {
        return <Navigate to="/" replace />;
    }

    const fetchStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/system/status');
            setStatus(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al obtener estado del sistema');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(fetchStatus, 30000); // Cada 30 segundos
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [autoRefresh]);

    const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
        switch (status) {
            case 'healthy':
                return 'success';
            case 'degraded':
                return 'warning';
            case 'down':
                return 'error';
        }
    };

    const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
        switch (status) {
            case 'healthy':
                return <CheckCircle color="success" />;
            case 'degraded':
                return <Warning color="warning" />;
            case 'down':
                return <Error color="error" />;
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error':
            case 'critical':
                return 'error';
            case 'warn':
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            case 'debug':
                return 'default';
            default:
                return 'default';
        }
    };

    if (loading && !status) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ mt: 2 }}>
                    Cargando estado del sistema...
                </Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    if (!status) return null;

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    📊 Estado del Sistema
                </Typography>
                <Box>
                    <Button
                        variant={autoRefresh ? 'contained' : 'outlined'}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        sx={{ mr: 1 }}
                    >
                        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={fetchStatus}
                        disabled={loading}
                    >
                        Actualizar
                    </Button>
                </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Última actualización: {new Date(status.timestamp).toLocaleString()}
            </Typography>

            {/* Services Status */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {getStatusIcon(status.services.backend.status)}
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                    Backend
                                </Typography>
                                <Chip
                                    label={status.services.backend.status}
                                    color={getStatusColor(status.services.backend.status)}
                                    size="small"
                                    sx={{ ml: 'auto' }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {status.services.backend.message}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {getStatusIcon(status.services.database.status)}
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                    Base de Datos
                                </Typography>
                                <Chip
                                    label={status.services.database.status}
                                    color={getStatusColor(status.services.database.status)}
                                    size="small"
                                    sx={{ ml: 'auto' }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {status.services.database.message}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                {getStatusIcon(status.services.cronJobs.status)}
                                <Typography variant="h6" sx={{ ml: 1 }}>
                                    Cron Jobs
                                </Typography>
                                <Chip
                                    label={status.services.cronJobs.status}
                                    color={getStatusColor(status.services.cronJobs.status)}
                                    size="small"
                                    sx={{ ml: 'auto' }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {status.services.cronJobs.message}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <People color="primary" sx={{ fontSize: 40 }} />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h4">{status.statistics.users.total}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Usuarios Totales
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">ADMIN: {status.statistics.users.byRole.ADMIN}</Typography>
                            <Typography variant="body2">MANAGER: {status.statistics.users.byRole.MANAGER}</Typography>
                            <Typography variant="body2">OPERATOR: {status.statistics.users.byRole.OPERATOR}</Typography>
                            <Typography variant="body2">VIEWER: {status.statistics.users.byRole.VIEWER}</Typography>
                            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                Activos hoy: {status.statistics.users.activeToday}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Notifications color="warning" sx={{ fontSize: 40 }} />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h4">{status.statistics.alerts.total}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Alertas Totales
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="warning.main">
                                Pendientes: {status.statistics.alerts.pending}
                            </Typography>
                            <Typography variant="body2" color="success.main">
                                Resueltas: {status.statistics.alerts.resolved}
                            </Typography>
                            <Typography variant="body2">
                                Ignoradas: {status.statistics.alerts.ignored}
                            </Typography>
                            <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                                Críticas: {status.statistics.alerts.critical}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Assessment color="info" sx={{ fontSize: 40 }} />
                            <Box sx={{ ml: 2 }}>
                                <Typography variant="h4">{status.statistics.reports.total}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Reportes Programados
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="success.main">
                                Activos: {status.statistics.reports.active}
                            </Typography>
                            <Typography variant="body2">
                                Ejecutados hoy: {status.statistics.reports.executedToday}
                            </Typography>
                            <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                Programados: {status.statistics.reports.scheduled}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Performance */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Speed color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Uptime
                            </Typography>
                        </Box>
                        <Typography variant="h5">{formatUptime(status.performance.uptime)}</Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Memory color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                CPU
                            </Typography>
                        </Box>
                        <Typography variant="body2">{status.performance.cpu.model}</Typography>
                        <Typography variant="body2">{status.performance.cpu.cores} cores</Typography>
                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                            {status.performance.cpu.usage.toFixed(1)}%
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Storage color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Memoria
                            </Typography>
                        </Box>
                        <Typography variant="body2">
                            {status.performance.memory.used} MB / {status.performance.memory.total} MB
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={status.performance.memory.usagePercentage}
                            color={status.performance.memory.usagePercentage > 80 ? 'error' : 'primary'}
                            sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="h6" color="primary">
                            {status.performance.memory.usagePercentage}%
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Speed color="primary" />
                            <Typography variant="h6" sx={{ ml: 1 }}>
                                Respuesta
                            </Typography>
                        </Box>
                        <Typography variant="h5">{status.performance.responseTime} ms</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tiempo de esta request
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Logs */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    📝 Logs Recientes
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Timestamp</TableCell>
                                <TableCell>Nivel</TableCell>
                                <TableCell>Mensaje</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {status.logs.map((log, index) => (
                                <TableRow key={index}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.level.toUpperCase()}
                                            color={getLevelColor(log.level)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {log.message}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default SystemStatusPage;

