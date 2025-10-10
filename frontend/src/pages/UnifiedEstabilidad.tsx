import {
    Analytics,
    Assessment,
    Compare,
    Download,
    Fullscreen,
    FullscreenExit,
    Map,
    Pause,
    PlayArrow,
    Refresh,
    Timeline,
    TrendingDown,
    TrendingUp,
    Warning,
    ZoomIn,
    ZoomOut
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
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import VehicleSelector from '../components/VehicleSelector';
import { useAuth } from '../contexts/AuthContext';
import { useMemoizedGPSData } from '../hooks/useMemoizedGPSData';
import { useStabilityData } from '../hooks/useStabilityData';
import { apiService } from '../services/api';
import { StabilityDataPoint, StabilitySession, VariableGroup } from '../types/stability';
import { Vehicle as VehicleType } from '../types/vehicle';
import { logger } from '../utils/logger';

// Importaciones lazy para componentes pesados
const StabilityChart = lazy(() => import('../components/StabilityChart'));
const GPSMap = lazy(() => import('../components/GPSMap'));

// Componentes styled
const MainContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
    padding: theme.spacing(2)
}));

const HeaderSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    width: '100%',
    marginBottom: theme.spacing(2)
}));

const MetricsGrid = styled(Grid)(({ theme }) => ({
    marginBottom: theme.spacing(2)
}));

const MetricCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
    }
}));

const ChartContainer = styled(Box)(({ theme }) => ({
    height: 'calc(100vh - 400px)',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    padding: theme.spacing(2),
    width: '100%',
    overflow: 'hidden',
    position: 'relative'
}));

const ControlPanel = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(2)
}));

interface StabilityMetrics {
    averageSI: number;
    maxSI: number;
    minSI: number;
    criticalEvents: number;
    warningEvents: number;
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
    duration: number;
    riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    stabilityScore: number;
    performance: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
    };
}

const variableGroups: VariableGroup[] = [
    {
        title: 'Aceleraciones',
        variables: [
            { key: 'ax', label: 'Aceleración Longitudinal', unit: 'g', group: 'accelerations' },
            { key: 'ay', label: 'Aceleración Lateral', unit: 'g', group: 'accelerations' },
            { key: 'az', label: 'Aceleración Vertical', unit: 'g', group: 'accelerations' }
        ]
    },
    {
        title: 'Velocidades Angulares',
        variables: [
            { key: 'gx', label: 'Velocidad Angular en Roll', unit: '°/s', group: 'angular_velocities' },
            { key: 'gy', label: 'Velocidad Angular en Pitch', unit: '°/s', group: 'angular_velocities' },
            { key: 'gz', label: 'Velocidad Angular en Yaw', unit: '°/s', group: 'angular_velocities' }
        ]
    },
    {
        title: 'Orientación',
        variables: [
            { key: 'roll', label: 'Ángulo de Inclinación Lateral', unit: '°', group: 'orientation' },
            { key: 'pitch', label: 'Ángulo de Inclinación Longitudinal', unit: '°', group: 'orientation' },
            { key: 'yaw', label: 'Ángulo de Giro', unit: '°', group: 'orientation' }
        ]
    },
    {
        title: 'Métricas de Estabilidad',
        variables: [
            { key: 'si', label: 'Índice de Estabilidad', unit: '', group: 'stability' },
            { key: 'accmag', label: 'Magnitud Total de Aceleración', unit: 'g', group: 'stability' }
        ]
    }
];

const UnifiedEstabilidad: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // Estados principales
    const [vehicles, setVehicles] = useState<VehicleType[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [sessions, setSessions] = useState<StabilitySession[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState(0);

    // Estados de zoom y visualización
    const [chartZoom, setChartZoom] = useState({ x: 0, y: 0, scale: 1 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedVariables, setSelectedVariables] = useState<Partial<Record<keyof StabilityDataPoint, boolean>>>({
        timestamp: true,
        ax: true,
        ay: true,
        az: true,
        gx: true,
        gy: true,
        gz: true,
        roll: true,
        pitch: true,
        yaw: true,
        si: true,
        accmag: true
    });

    // Estados de comparación
    const [comparisonMode, setComparisonMode] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<string[]>([]);

    // Estados de monitoreo en tiempo real
    const [isMonitoring, setIsMonitoring] = useState(false);

    // Hook para datos de estabilidad
    const {
        stabilityData,
        gpsData,
        loading,
        criticalEvents,
        acknowledgedEvents,
        loadSessionData
    } = useStabilityData(selectedVehicle || null, selectedSession || null);

    // Hook para datos GPS memoizados - Usar gpsData del hook en lugar de stabilityData
    const { gpsTelemetryData, mapCenter } = useMemoizedGPSData({
        id: selectedSession,
        gpsData: gpsData && gpsData.length > 0 ? gpsData.map(point => ({
            timestamp: point.timestamp,
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed
        })) : stabilityData.filter(point => point.lat && point.lon).map(point => ({
            timestamp: point.timestamp,
            latitude: point.lat || 0,
            longitude: point.lon || 0,
            speed: point.speed || 0
        }))
    });

    // Downsampling para la gráfica
    const downsampleStability = (data: StabilityDataPoint[], maxPoints = 2000) => {
        if (!Array.isArray(data) || data.length <= maxPoints) return data;
        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, idx) => idx % step === 0);
    };

    const stabilityDataDownsampled = useMemo(() => downsampleStability(stabilityData, 2000), [stabilityData]);

    // Cálculo de métricas de estabilidad
    const stabilityMetrics = useMemo<StabilityMetrics | null>(() => {
        if (!stabilityData || stabilityData.length === 0) return null;

        const siValues = stabilityData.map(point => point.si).filter(si => !isNaN(si));
        const speedValues = stabilityData.map(point => point.speed || 0).filter(speed => !isNaN(speed));

        const averageSI = siValues.length > 0 ? siValues.reduce((a, b) => a + b, 0) / siValues.length : 0;
        const maxSI = siValues.length > 0 ? Math.max(...siValues) : 0;
        const minSI = siValues.length > 0 ? Math.min(...siValues) : 0;

        const averageSpeed = speedValues.length > 0 ? speedValues.reduce((a, b) => a + b, 0) / speedValues.length : 0;
        const maxSpeed = speedValues.length > 0 ? Math.max(...speedValues) : 0;

        const firstTimestamp = stabilityData[0]?.timestamp;
        const lastTimestamp = stabilityData[stabilityData.length - 1]?.timestamp;
        const duration = (stabilityData.length > 1 && firstTimestamp && lastTimestamp)
            ? (new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime()) / 1000 / 60
            : 0;

        // Determinar nivel de riesgo basado en SI (menor es mejor)
        let riskLevel: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';
        if (averageSI > 0.5 || criticalEvents.length > 10) {
            riskLevel = 'ALTO';
        } else if (averageSI > 0.3 || criticalEvents.length > 5) {
            riskLevel = 'MEDIO';
        }

        // Calcular puntuación de estabilidad (mayor es mejor)
        const stabilityScore = Math.max(0, Math.min(100, (1 - averageSI) * 100));

        // Calcular distribución de rendimiento
        const performance = {
            excellent: siValues.filter(si => si >= 0.8).length / siValues.length * 100,
            good: siValues.filter(si => si >= 0.6 && si < 0.8).length / siValues.length * 100,
            fair: siValues.filter(si => si >= 0.4 && si < 0.6).length / siValues.length * 100,
            poor: siValues.filter(si => si < 0.4).length / siValues.length * 100
        };

        return {
            averageSI,
            maxSI,
            minSI,
            criticalEvents: criticalEvents.length,
            warningEvents: acknowledgedEvents.length,
            averageSpeed,
            maxSpeed,
            totalDistance: 0,
            duration,
            riskLevel,
            stabilityScore,
            performance
        };
    }, [stabilityData, criticalEvents, acknowledgedEvents]);

    // Efectos
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        loadVehicles();
    }, []);

    useEffect(() => {
        if (selectedVehicle && selectedVehicle !== '') {
            // Los IDs de vehículos son strings, no necesitamos convertirlos a número
            loadSessions(selectedVehicle);
        }
    }, [selectedVehicle]);

    useEffect(() => {
        if (selectedSession) {
            loadSessionData(selectedSession);
        }
    }, [selectedSession, loadSessionData]);

    // Funciones
    const loadVehicles = useCallback(async () => {
        try {
            const response = await apiService.get<{ success: boolean; data: VehicleType[] }>('/api/vehicles');
            if (response.success && Array.isArray(response.data)) {
                setVehicles(response.data);
            } else {
                setError('No se pudieron cargar los vehículos');
            }
        } catch (error) {
            logger.error('Error al cargar vehículos', { error });
            setError('Error al cargar vehículos');
        }
    }, []);

    const loadSessions = useCallback(async (vehicleId: string) => {
        try {
            setLoadingSessions(true);
            setError(null);
            setSessions([]); // Limpiar sesiones previas

            logger.info('Cargando sesiones de estabilidad', { vehicleId });

            const response = await apiService.get<{ success: boolean; data: StabilitySession[] }>(`/api/stability/vehicle/${vehicleId}/sessions`);

            logger.info('Respuesta del servidor', {
                success: response.success,
                dataLength: Array.isArray(response.data) ? response.data.length : 0
            });

            if (response.success && Array.isArray(response.data)) {
                // Filtrar solo sesiones que tengan mediciones de estabilidad
                const stabilitySessions = response.data.filter((s: any) => {
                    return typeof s.dataPoints === 'number' && s.dataPoints > 0;
                });

                logger.info('Sesiones de estabilidad procesadas', {
                    total: response.data.length,
                    filtered: stabilitySessions.length,
                    samples: stabilitySessions.slice(0, 3).map((s: any) => ({
                        id: s.id,
                        dataPoints: s.dataPoints,
                        startTime: s.startTime
                    }))
                });

                setSessions(stabilitySessions);
                if (stabilitySessions.length > 0) {
                    setSelectedSession(stabilitySessions[0].id);
                    logger.info('Sesión seleccionada automáticamente', { sessionId: stabilitySessions[0].id });
                } else {
                    logger.warn('No se encontraron sesiones con mediciones de estabilidad', { vehicleId });
                    setError('No hay sesiones de estabilidad disponibles para este vehículo. Por favor, sube archivos de estabilidad primero.');
                }
            } else {
                logger.error('Formato de respuesta inválido', { response });
                setError(`Error: ${response.error || 'Formato de respuesta inválido'}`);
            }
        } catch (error) {
            logger.error('Error al cargar sesiones', { error, vehicleId });
            setError(`Error al cargar sesiones: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    const handleVehicleChange = (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        setSelectedSession('');
        setSessions([]);
        setComparisonMode(false);
    };

    const handleSessionChange = (event: SelectChangeEvent<string>) => {
        const sessionId = event.target.value;
        setSelectedSession(sessionId);
        setError(null);
    };

    const handleVariableChange = useCallback((variable: keyof StabilityDataPoint) => {
        setSelectedVariables(prev => ({
            ...prev,
            [variable]: !prev[variable]
        }));
    }, []);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleZoomIn = () => {
        setChartZoom(prev => ({
            ...prev,
            scale: Math.min(prev.scale * 1.2, 5)
        }));
    };

    const handleZoomOut = () => {
        setChartZoom(prev => ({
            ...prev,
            scale: Math.max(prev.scale / 1.2, 0.1)
        }));
    };

    const handleResetZoom = () => {
        setChartZoom({ x: 0, y: 0, scale: 1 });
    };

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleExportData = useCallback(async () => {
        if (!selectedSession || !stabilityData.length) return;

        try {
            const response = await apiService.get(`/api/stability/session/${selectedSession}/export`, {
                responseType: 'blob'
            });

            // Si la respuesta es un blob, crear el archivo directamente
            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `estabilidad-sesion-${selectedSession}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } else {
                // Si no es blob, crear uno con los datos
                const blob = new Blob([JSON.stringify(response)], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `estabilidad-sesion-${selectedSession}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            logger.error('Error al exportar datos:', { error, sessionId: selectedSession });
            setError('Error al exportar los datos');
        }
    }, [selectedSession, stabilityData]);

    const handleComparisonToggle = () => {
        setComparisonMode(!comparisonMode);
        if (comparisonMode) {
            setSelectedSessions([]);
        }
    };

    const handleSessionSelect = (sessionId: string, selected: boolean) => {
        if (selected) {
            setSelectedSessions(prev => [...prev, sessionId]);
        } else {
            setSelectedSessions(prev => prev.filter(id => id !== sessionId));
        }
    };

    const handleCompareSession = () => {
        if (selectedSessions.length < 2) {
            alert('Selecciona al menos 2 sesiones para comparar');
            return;
        }
        logger.info('Iniciando comparación de sesiones', { sessionIds: selectedSessions });
    };

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    const getStabilityColor = (score: number) => {
        if (score >= 90) return '#4caf50';
        if (score >= 70) return '#ff9800';
        if (score >= 50) return '#f44336';
        return '#d32f2f';
    };

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'BAJO':
                return <TrendingUp color="success" />;
            case 'MEDIO':
                return <Warning color="warning" />;
            case 'ALTO':
                return <TrendingDown color="error" />;
            default:
                return <Assessment />;
        }
    };

    // Renderizado condicional
    if (loadingSessions) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && !vehicles.length) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error}
                </Alert>
                <Button variant="contained" onClick={() => window.location.reload()}>
                    Reintentar
                </Button>
            </Box>
        );
    }

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Alert severity="info" sx={{ maxWidth: 600 }}>
                    No hay vehículos disponibles. Por favor, agregue un vehículo para continuar.
                </Alert>
            </Box>
        );
    }

    return (
        <ErrorBoundary>
            <MainContainer>
                {/* Header */}
                <HeaderSection>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                        <Assessment color="primary" />
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Análisis de Estabilidad Unificado
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Análisis avanzado de estabilidad vehicular con IA integrada
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                            label={isMonitoring ? 'Monitoreo Activo' : 'Monitoreo Pausado'}
                            color={isMonitoring ? 'success' : 'default'}
                            icon={isMonitoring ? <PlayArrow /> : <Pause />}
                        />
                        <Button
                            variant="contained"
                            color={isMonitoring ? 'warning' : 'success'}
                            startIcon={isMonitoring ? <Pause /> : <PlayArrow />}
                            onClick={toggleMonitoring}
                        >
                            {isMonitoring ? 'Pausar' : 'Iniciar'}
                        </Button>
                    </Stack>
                </HeaderSection>

                {/* Controles principales */}
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        {error && (
                            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <VehicleSelector
                                    selectedVehicle={selectedVehicle || ''}
                                    onVehicleChange={handleVehicleChange}
                                    showLabel={true}
                                    fullWidth={true}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Sesión</InputLabel>
                                    <Select
                                        value={selectedSession || ''}
                                        onChange={handleSessionChange}
                                        label="Sesión"
                                        disabled={!selectedVehicle || loadingSessions || sessions.length === 0}
                                    >
                                        {sessions.length === 0 ? (
                                            <MenuItem value="" disabled>
                                                {loadingSessions ? 'Cargando sesiones...' : 'No hay sesiones disponibles'}
                                            </MenuItem>
                                        ) : (
                                            sessions.map((session) => (
                                                <MenuItem key={session.id} value={session.id}>
                                                    {new Date(session.startTime || session.startedAt || new Date()).toLocaleString()} - {session.dataPoints} mediciones
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant={comparisonMode ? "contained" : "outlined"}
                                        startIcon={<Compare />}
                                        onClick={handleComparisonToggle}
                                        disabled={!selectedSession}
                                    >
                                        Comparar
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Download />}
                                        onClick={handleExportData}
                                        disabled={!selectedSession || !stabilityData.length}
                                    >
                                        Exportar
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Métricas principales */}
                {stabilityMetrics && (
                    <MetricsGrid container spacing={3} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Puntuación de Estabilidad
                                    </Typography>
                                    <Typography
                                        variant="h4"
                                        style={{ color: getStabilityColor(stabilityMetrics.stabilityScore) }}
                                    >
                                        {stabilityMetrics.stabilityScore.toFixed(1)}%
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                        {getRiskIcon(stabilityMetrics.riskLevel)}
                                        <Typography variant="body2" sx={{ ml: 1 }}>
                                            {stabilityMetrics.riskLevel}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Eventos Críticos
                                    </Typography>
                                    <Typography variant="h4" color="error">
                                        {stabilityMetrics.criticalEvents}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {stabilityMetrics.warningEvents} advertencias
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Velocidad Promedio
                                    </Typography>
                                    <Typography variant="h4">
                                        {stabilityMetrics.averageSpeed.toFixed(1)} km/h
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Máx: {stabilityMetrics.maxSpeed.toFixed(1)} km/h
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Duración
                                    </Typography>
                                    <Typography variant="h4">
                                        {stabilityMetrics.duration.toFixed(1)} min
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {stabilityData.length} puntos de datos
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>
                    </MetricsGrid>
                )}

                {/* Pestañas principales */}
                <Card sx={{ flex: 1 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={currentTab} onChange={handleTabChange} aria-label="estabilidad tabs">
                            <Tab
                                icon={<Analytics />}
                                label="Análisis Principal"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Compare />}
                                label="Comparación"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Map />}
                                label="Mapa GPS"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Timeline />}
                                label="Métricas Detalladas"
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Contenido de pestañas */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {/* Controles de gráfica */}
                            <ControlPanel>
                                <IconButton onClick={handleZoomIn} size="small">
                                    <ZoomIn />
                                </IconButton>
                                <IconButton onClick={handleZoomOut} size="small">
                                    <ZoomOut />
                                </IconButton>
                                <IconButton onClick={handleResetZoom} size="small">
                                    <Refresh />
                                </IconButton>
                                <Divider orientation="vertical" flexItem />
                                <IconButton onClick={handleFullscreen} size="small">
                                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                                </IconButton>
                            </ControlPanel>

                            {/* Gráfica principal */}
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : Array.isArray(stabilityData) && stabilityData.length > 0 ? (
                                <ChartContainer>
                                    <Suspense fallback={
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                            <CircularProgress />
                                        </Box>
                                    }>
                                        <StabilityChart
                                            data={stabilityDataDownsampled}
                                            selectedVariables={selectedVariables as Record<keyof StabilityDataPoint, boolean>}
                                            variableGroups={variableGroups}
                                            onHover={() => { }}
                                            handleVariableChange={handleVariableChange}
                                            onZoomChange={(zoom) => setChartZoom(zoom || { x: 0, y: 0, scale: 1 })}
                                            initialZoom={chartZoom}
                                        />
                                    </Suspense>
                                </ChartContainer>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No hay datos disponibles. Seleccione un vehículo y sesión.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Comparación de Sesiones
                            </Typography>
                            {comparisonMode ? (
                                <Box>
                                    <Typography variant="body1" gutterBottom>
                                        Selecciona las sesiones que deseas comparar:
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {sessions.map((session) => (
                                            <Grid item xs={12} sm={6} md={4} key={session.id}>
                                                <Card
                                                    sx={{
                                                        cursor: 'pointer',
                                                        border: selectedSessions.includes(session.id) ? 2 : 1,
                                                        borderColor: selectedSessions.includes(session.id) ? 'primary.main' : 'divider'
                                                    }}
                                                    onClick={() => handleSessionSelect(session.id, !selectedSessions.includes(session.id))}
                                                >
                                                    <CardContent>
                                                        <Typography variant="h6">
                                                            Sesión {session.id.slice(-4)}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {(session.startTime || session.startedAt) ? new Date(session.startTime || session.startedAt!).toLocaleString() : 'Sin fecha'}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            startIcon={<Compare />}
                                            onClick={handleCompareSession}
                                            disabled={selectedSessions.length < 2}
                                        >
                                            Comparar {selectedSessions.length} sesiones
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Alert severity="info">
                                    Activa el modo comparación para seleccionar sesiones a comparar.
                                </Alert>
                            )}
                        </Box>
                    )}

                    {currentTab === 2 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Mapa GPS con Eventos de Estabilidad
                            </Typography>
                            <Box sx={{ height: 400, backgroundColor: 'grey.100', borderRadius: 1 }}>
                                <Suspense fallback={
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                }>
                                    <GPSMap
                                        vehicleLocations={[]}
                                        center={mapCenter}
                                        zoom={13}
                                        telemetryData={gpsTelemetryData}
                                        stabilityEvents={criticalEvents}
                                        selectedSession={{
                                            id: selectedSession,
                                            gpsData: gpsData || []
                                        }}
                                        stabilityData={stabilityData}
                                        onVehicleClick={() => { }}
                                        selectedEventId={null}
                                        onEventSelect={() => { }}
                                        selectedVehicleId={selectedVehicle || null}
                                        showClusters={true}
                                        onGeneratePDF={() => { }}
                                    />
                                </Suspense>
                            </Box>
                        </Box>
                    )}

                    {currentTab === 3 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Métricas Detalladas y Rendimiento
                            </Typography>
                            {stabilityMetrics && (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Distribución de Rendimiento
                                                </Typography>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Excelente (≥80%):</Typography>
                                                        <Typography color="success.main">
                                                            {stabilityMetrics.performance.excellent.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Bueno (60-80%):</Typography>
                                                        <Typography color="info.main">
                                                            {stabilityMetrics.performance.good.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Regular (40-60%):</Typography>
                                                        <Typography color="warning.main">
                                                            {stabilityMetrics.performance.fair.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Pobre (&lt;40%):</Typography>
                                                        <Typography color="error.main">
                                                            {stabilityMetrics.performance.poor.toFixed(1)}%
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Estadísticas del Índice de Estabilidad
                                                </Typography>
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Promedio:</Typography>
                                                        <Typography variant="h6">
                                                            {stabilityMetrics.averageSI.toFixed(3)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Máximo:</Typography>
                                                        <Typography color="error.main">
                                                            {stabilityMetrics.maxSI.toFixed(3)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Mínimo:</Typography>
                                                        <Typography color="success.main">
                                                            {stabilityMetrics.minSI.toFixed(3)}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    )}
                </Card>
            </MainContainer>
        </ErrorBoundary>
    );
};

export default UnifiedEstabilidad;
