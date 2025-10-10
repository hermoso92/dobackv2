import {
    BugReport,
    CheckCircle,
    Download,
    Error,
    Memory,
    MonitorHeart,
    NetworkCheck,
    PlayArrow,
    Refresh,
    Settings,
    Speed,
    Storage,
    Timeline,
    Visibility,
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
import React, { useState } from 'react';
import {
    AlertDTO,
    LogEntryDTO,
    SystemHealthDTO,
    SystemMetricsDTO,
    TestSuiteDTO
} from '../../types/observability';
import { logger } from '../../utils/logger';

interface ObservabilityPageProps {
    initialTab?: number;
}

export const ObservabilityPage: React.FC<ObservabilityPageProps> = ({
    initialTab = 0
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [selectedLog, setSelectedLog] = useState<LogEntryDTO | null>(null);
    const [selectedAlert, setSelectedAlert] = useState<AlertDTO | null>(null);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Mock data para desarrollo
    const mockSystemHealth: SystemHealthDTO = {
        status: 'healthy',
        timestamp: '2024-01-15T10:30:00Z',
        uptime: 86400, // 24 horas
        version: '1.0.0',
        environment: 'production',
        checks: [
            {
                name: 'database',
                status: 'healthy',
                message: 'Database connection successful',
                duration: 15,
                lastCheck: '2024-01-15T10:30:00Z',
                details: { connections: 5, maxConnections: 100 }
            },
            {
                name: 'redis',
                status: 'healthy',
                message: 'Redis connection successful',
                duration: 8,
                lastCheck: '2024-01-15T10:30:00Z',
                details: { memory: '2.5MB', keys: 1250 }
            },
            {
                name: 'external-api',
                status: 'degraded',
                message: 'High response time detected',
                duration: 2500,
                lastCheck: '2024-01-15T10:30:00Z',
                details: { responseTime: 2500, threshold: 1000 }
            }
        ],
        summary: {
            total: 3,
            healthy: 2,
            unhealthy: 0,
            degraded: 1
        }
    };

    const mockSystemMetrics: SystemMetricsDTO = {
        timestamp: '2024-01-15T10:30:00Z',
        uptime: 86400,
        memory: {
            used: 2048,
            total: 8192,
            percentage: 25
        },
        cpu: {
            usage: 45,
            load: [1.2, 1.5, 1.8]
        },
        disk: {
            used: 150,
            total: 500,
            percentage: 30
        },
        network: {
            bytesIn: 1024000,
            bytesOut: 512000,
            connections: 25
        },
        database: {
            connections: 5,
            maxConnections: 100,
            queryTime: 45,
            slowQueries: 2
        },
        cache: {
            hits: 1250,
            misses: 150,
            hitRate: 89.3,
            size: 50
        },
        queue: {
            pending: 3,
            processing: 1,
            completed: 1250,
            failed: 5
        }
    };

    const mockLogs: LogEntryDTO[] = [
        {
            id: 'log-1',
            timestamp: '2024-01-15T10:30:00Z',
            level: 'info',
            message: 'User login successful',
            requestId: 'req-123',
            orgId: 'org-1',
            userId: 'user-1',
            route: '/api/auth/login',
            method: 'POST',
            statusCode: 200,
            duration: 150,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            tags: ['authentication', 'success']
        },
        {
            id: 'log-2',
            timestamp: '2024-01-15T10:29:45Z',
            level: 'warn',
            message: 'Slow query detected',
            requestId: 'req-122',
            orgId: 'org-1',
            route: '/api/telemetry/sessions',
            method: 'GET',
            statusCode: 200,
            duration: 2500,
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0...',
            tags: ['database', 'performance']
        },
        {
            id: 'log-3',
            timestamp: '2024-01-15T10:29:30Z',
            level: 'error',
            message: 'Database connection failed',
            requestId: 'req-121',
            orgId: 'org-1',
            route: '/api/vehicles',
            method: 'GET',
            statusCode: 500,
            duration: 5000,
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0...',
            error: {
                name: 'DatabaseError',
                message: 'Connection timeout',
                stack: 'Error: Connection timeout\n    at Database.connect...',
                code: 'DB_TIMEOUT'
            },
            tags: ['database', 'error']
        }
    ];

    const mockAlerts: AlertDTO[] = [
        {
            id: 'alert-1',
            name: 'High CPU Usage',
            type: 'metric',
            severity: 'high',
            status: 'active',
            message: 'CPU usage is above 80%',
            description: 'System CPU usage has been above 80% for the last 5 minutes',
            source: 'system-monitor',
            metric: 'cpu.usage',
            threshold: 80,
            currentValue: 85,
            triggeredAt: '2024-01-15T10:25:00Z',
            labels: { instance: 'server-1', environment: 'production' },
            annotations: { summary: 'High CPU usage detected' }
        },
        {
            id: 'alert-2',
            name: 'Database Slow Queries',
            type: 'metric',
            severity: 'medium',
            status: 'active',
            message: 'Multiple slow queries detected',
            description: '5 slow queries detected in the last 10 minutes',
            source: 'database-monitor',
            metric: 'database.slow_queries',
            threshold: 3,
            currentValue: 5,
            triggeredAt: '2024-01-15T10:20:00Z',
            labels: { database: 'main', environment: 'production' },
            annotations: { summary: 'Database performance issue' }
        }
    ];

    const mockTestSuites: TestSuiteDTO[] = [
        {
            id: 'suite-1',
            name: 'Unit Tests',
            type: 'unit',
            status: 'passed',
            duration: 45000,
            startedAt: '2024-01-15T10:00:00Z',
            completedAt: '2024-01-15T10:00:45Z',
            tests: [],
            summary: {
                total: 150,
                passed: 148,
                failed: 2,
                skipped: 0,
                coverage: {
                    lines: 85,
                    functions: 90,
                    branches: 80,
                    statements: 87
                }
            },
            environment: {
                nodeVersion: '18.17.0',
                platform: 'linux',
                arch: 'x64',
                memory: 8192
            }
        },
        {
            id: 'suite-2',
            name: 'E2E Tests',
            type: 'e2e',
            status: 'failed',
            duration: 120000,
            startedAt: '2024-01-15T09:30:00Z',
            completedAt: '2024-01-15T09:32:00Z',
            tests: [],
            summary: {
                total: 25,
                passed: 23,
                failed: 2,
                skipped: 0
            },
            environment: {
                nodeVersion: '18.17.0',
                platform: 'linux',
                arch: 'x64',
                memory: 8192
            }
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleLogSelect = (log: LogEntryDTO) => {
        setSelectedLog(log);
        logger.info('Log seleccionado', { logId: log.id });
    };

    const handleAlertSelect = (alert: AlertDTO) => {
        setSelectedAlert(alert);
        logger.info('Alerta seleccionada', { alertId: alert.id });
    };

    const handleRunTests = (suiteType: string) => {
        logger.info('Ejecutando tests', { suiteType });
        // TODO: Implementar ejecución de tests
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'error';
            case 'warn':
                return 'warning';
            case 'info':
                return 'info';
            case 'debug':
                return 'default';
            default:
                return 'default';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'error';
            case 'high':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'info';
            default:
                return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'success';
            case 'unhealthy':
                return 'error';
            case 'degraded':
                return 'warning';
            case 'passed':
                return 'success';
            case 'failed':
                return 'error';
            case 'running':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    const formatBytes = (bytes: number) => {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (isLoading) {
        return (
            <Box className="h-full flex items-center justify-center">
                <CircularProgress />
                <Typography className="ml-2">Cargando observabilidad...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="h-full p-4">
                <Alert severity="error">
                    Error cargando observabilidad: {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box className="h-full flex flex-col">
            {/* Header */}
            <Box className="mb-4">
                <Box className="flex items-center justify-between mb-2">
                    <Box className="flex items-center gap-2">
                        <MonitorHeart />
                        <Typography variant="h4" className="font-bold">
                            Observabilidad & QA
                        </Typography>
                    </Box>

                    <Box className="flex items-center gap-2">
                        <Tooltip title="Configuración">
                            <IconButton>
                                <Settings />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Refrescar">
                            <IconButton>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Typography variant="body1" className="text-gray-600">
                    Monitoreo del sistema, logs, métricas, alertas y tests automatizados
                </Typography>
            </Box>

            {/* Tabs */}
            <Card className="flex-1 flex flex-col">
                <Box className="border-b border-gray-200">
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        className="min-h-0"
                    >
                        <Tab label="Salud del Sistema" />
                        <Tab label="Logs" />
                        <Tab label="Métricas" />
                        <Tab label="Alertas" />
                        <Tab label="Tests" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <CardContent className="flex-1 p-4">
                    {activeTab === 0 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Estado de Salud del Sistema
                            </Typography>

                            {/* Status Overview */}
                            <Grid container spacing={3} className="mb-4">
                                <Grid item xs={12} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between">
                                                <Box>
                                                    <Typography variant="h6" className="font-bold">
                                                        {mockSystemHealth.summary.healthy}
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        Saludables
                                                    </Typography>
                                                </Box>
                                                <CheckCircle color="success" />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between">
                                                <Box>
                                                    <Typography variant="h6" className="font-bold">
                                                        {mockSystemHealth.summary.degraded}
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        Degradados
                                                    </Typography>
                                                </Box>
                                                <Warning color="warning" />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between">
                                                <Box>
                                                    <Typography variant="h6" className="font-bold">
                                                        {mockSystemHealth.summary.unhealthy}
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        No Saludables
                                                    </Typography>
                                                </Box>
                                                <Error color="error" />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between">
                                                <Box>
                                                    <Typography variant="h6" className="font-bold">
                                                        {formatUptime(mockSystemHealth.uptime)}
                                                    </Typography>
                                                    <Typography variant="body2" className="text-gray-600">
                                                        Tiempo activo
                                                    </Typography>
                                                </Box>
                                                <Timeline color="info" />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Health Checks */}
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" className="mb-3">
                                        Health Checks
                                    </Typography>
                                    <List>
                                        {mockSystemHealth.checks.map((check, index) => (
                                            <React.Fragment key={check.name}>
                                                <ListItem>
                                                    <ListItemIcon>
                                                        {check.status === 'healthy' ?
                                                            <CheckCircle color="success" /> :
                                                            check.status === 'degraded' ?
                                                                <Warning color="warning" /> :
                                                                <Error color="error" />
                                                        }
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={check.name}
                                                        secondary={check.message}
                                                    />
                                                    <Box className="text-right">
                                                        <Typography variant="body2" className="text-gray-600">
                                                            {check.duration}ms
                                                        </Typography>
                                                        <Chip
                                                            label={check.status}
                                                            size="small"
                                                            color={getStatusColor(check.status) as any}
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                </ListItem>
                                                {index < mockSystemHealth.checks.length - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <Box className="flex items-center justify-between mb-4">
                                <Typography variant="h6">
                                    Logs del Sistema
                                </Typography>
                                <Box className="flex gap-2">
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        onClick={() => logger.info('Exportar logs')}
                                    >
                                        Exportar
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Refresh />}
                                        onClick={() => logger.info('Refrescar logs')}
                                    >
                                        Refrescar
                                    </Button>
                                </Box>
                            </Box>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Nivel</TableCell>
                                            <TableCell>Mensaje</TableCell>
                                            <TableCell>Ruta</TableCell>
                                            <TableCell>Duración</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockLogs.map((log) => (
                                            <TableRow key={log.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.level}
                                                        size="small"
                                                        color={getLevelColor(log.level) as any}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {log.message}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" className="font-mono">
                                                        {log.method} {log.route}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {log.duration}ms
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Tooltip title="Ver detalles">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleLogSelect(log)}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {activeTab === 2 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Métricas del Sistema
                            </Typography>

                            <Grid container spacing={3}>
                                {/* CPU */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    CPU
                                                </Typography>
                                                <Speed />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.cpu.usage}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={mockSystemMetrics.cpu.usage}
                                                className="mb-2"
                                            />
                                            <Typography variant="body2" className="text-gray-600">
                                                Load: {mockSystemMetrics.cpu.load.join(', ')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Memory */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Memoria
                                                </Typography>
                                                <Memory />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.memory.percentage}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={mockSystemMetrics.memory.percentage}
                                                className="mb-2"
                                            />
                                            <Typography variant="body2" className="text-gray-600">
                                                {mockSystemMetrics.memory.used}MB / {mockSystemMetrics.memory.total}MB
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Disk */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Disco
                                                </Typography>
                                                <Storage />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.disk.percentage}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={mockSystemMetrics.disk.percentage}
                                                className="mb-2"
                                            />
                                            <Typography variant="body2" className="text-gray-600">
                                                {mockSystemMetrics.disk.used}GB / {mockSystemMetrics.disk.total}GB
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Network */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Red
                                                </Typography>
                                                <NetworkCheck />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.network.connections}
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600 mb-1">
                                                Conexiones activas
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600">
                                                In: {formatBytes(mockSystemMetrics.network.bytesIn)} |
                                                Out: {formatBytes(mockSystemMetrics.network.bytesOut)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Database */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Base de Datos
                                                </Typography>
                                                <Storage />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.database.connections}
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600 mb-1">
                                                Conexiones activas
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600">
                                                Tiempo promedio: {mockSystemMetrics.database.queryTime}ms |
                                                Lentas: {mockSystemMetrics.database.slowQueries}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Cache */}
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Box className="flex items-center justify-between mb-2">
                                                <Typography variant="h6" className="font-bold">
                                                    Cache
                                                </Typography>
                                                <Memory />
                                            </Box>
                                            <Typography variant="h4" className="font-bold mb-2">
                                                {mockSystemMetrics.cache.hitRate}%
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600 mb-1">
                                                Hit Rate
                                            </Typography>
                                            <Typography variant="body2" className="text-gray-600">
                                                Hits: {mockSystemMetrics.cache.hits} |
                                                Misses: {mockSystemMetrics.cache.misses}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" className="mb-4">
                                Alertas del Sistema
                            </Typography>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Severidad</TableCell>
                                            <TableCell>Estado</TableCell>
                                            <TableCell>Métrica</TableCell>
                                            <TableCell>Valor Actual</TableCell>
                                            <TableCell>Disparada</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockAlerts.map((alert) => (
                                            <TableRow key={alert.id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" className="font-bold">
                                                            {alert.name}
                                                        </Typography>
                                                        <Typography variant="caption" className="text-gray-600">
                                                            {alert.message}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={alert.severity}
                                                        size="small"
                                                        color={getSeverityColor(alert.severity) as any}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={alert.status}
                                                        size="small"
                                                        color={getStatusColor(alert.status) as any}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" className="font-mono">
                                                        {alert.metric}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {alert.currentValue} / {alert.threshold}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {new Date(alert.triggeredAt).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box className="flex items-center gap-1">
                                                        <Tooltip title="Reconocer">
                                                            <IconButton size="small" color="info">
                                                                <CheckCircle />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Resolver">
                                                            <IconButton size="small" color="success">
                                                                <CheckCircle />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Ver detalles">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleAlertSelect(alert)}
                                                            >
                                                                <Visibility />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {activeTab === 4 && (
                        <Box>
                            <Box className="flex items-center justify-between mb-4">
                                <Typography variant="h6">
                                    Tests Automatizados
                                </Typography>
                                <Box className="flex gap-2">
                                    <Button
                                        variant="outlined"
                                        startIcon={<PlayArrow />}
                                        onClick={() => handleRunTests('unit')}
                                    >
                                        Unit Tests
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<PlayArrow />}
                                        onClick={() => handleRunTests('e2e')}
                                    >
                                        E2E Tests
                                    </Button>
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                {mockTestSuites.map((suite) => (
                                    <Grid item xs={12} md={6} key={suite.id}>
                                        <Card className="h-full">
                                            <CardContent>
                                                <Box className="flex items-center justify-between mb-2">
                                                    <Box className="flex items-center gap-2">
                                                        <BugReport />
                                                        <Typography variant="h6" className="font-bold">
                                                            {suite.name}
                                                        </Typography>
                                                    </Box>
                                                    <Chip
                                                        label={suite.status}
                                                        size="small"
                                                        color={getStatusColor(suite.status) as any}
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" className="text-gray-600 mb-3">
                                                    {suite.type.toUpperCase()} • {suite.duration}ms
                                                </Typography>

                                                <Box className="space-y-2">
                                                    <Box className="flex justify-between items-center">
                                                        <Typography variant="body2">Total:</Typography>
                                                        <Typography variant="body2" className="font-bold">
                                                            {suite.summary.total}
                                                        </Typography>
                                                    </Box>
                                                    <Box className="flex justify-between items-center">
                                                        <Typography variant="body2">Pasaron:</Typography>
                                                        <Typography variant="body2" className="font-bold text-green-600">
                                                            {suite.summary.passed}
                                                        </Typography>
                                                    </Box>
                                                    <Box className="flex justify-between items-center">
                                                        <Typography variant="body2">Fallaron:</Typography>
                                                        <Typography variant="body2" className="font-bold text-red-600">
                                                            {suite.summary.failed}
                                                        </Typography>
                                                    </Box>
                                                    {suite.summary.coverage && (
                                                        <Box className="flex justify-between items-center">
                                                            <Typography variant="body2">Cobertura:</Typography>
                                                            <Typography variant="body2" className="font-bold">
                                                                {suite.summary.coverage.lines}%
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>

                                                <Box className="mt-3 text-xs text-gray-500">
                                                    Completado: {new Date(suite.completedAt!).toLocaleString()}
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
