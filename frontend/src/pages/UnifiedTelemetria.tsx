import {
    Assessment,
    Compare,
    Event,
    Map,
    Memory,
    Notifications,
    Pause,
    PlayArrow,
    Refresh,
    Speed,
    Stop,
    Timeline,
    Upload
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
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Slider,
    Stack,
    Switch,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import VehicleSelector from '../components/VehicleSelector';
import { useAuth } from '../contexts/AuthContext';
import { useExport } from '../hooks/useExport';
import { useReplay } from '../hooks/useReplay';
import { useTelemetryData } from '../hooks/useTelemetryData';
import { apiService } from '../services/api';
import { Alarm, EventDTO, ExportOptions, TelemetryFilters, TelemetryPointDTO, TelemetrySessionDTO, Vehicle } from '../types/telemetry';
import { logger } from '../utils/logger';

// Importaciones lazy para componentes pesados
const TelemetryMapAdvanced = lazy(() => import('../components/telemetry/TelemetryMapAdvanced'));
const RealTimeData = lazy(() => import('../components/RealTimeData'));
const ExportDialog = lazy(() => import('../components/export/ExportDialog').then(module => ({ default: module.ExportDialog })));

// Componentes styled
const MainContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: theme.palette.background.default,
    overflow: 'auto'
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

interface TelemetryMetrics {
    maxSpeed: number;
    averageSpeed: number;
    maxRPM: number;
    averageRPM: number;
    totalDistance: number;
    totalTime: number;
    fuelEfficiency: number;
    accelerationTime: number;
    decelerationTime: number;
    idleTime: number;
    maxAcceleration: number;
    maxDeceleration: number;
    hasTemperature: boolean;
    averageTemperature: number;
    maxTemperature: number;
}

const UnifiedTelemetria: React.FC = () => {
    const navigate = useNavigate();
    const { t: translate } = useTranslation();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Estados principales
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string | undefined>(undefined);
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [availableSessions, setAvailableSessions] = useState<TelemetrySessionDTO[]>([]);
    const [telemetryData, setTelemetryData] = useState<TelemetrySessionDTO | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [currentTab, setCurrentTab] = useState(0);

    // Limpiar localStorage al inicializar para evitar conflictos
    useEffect(() => {
        localStorage.removeItem('selectedVehicle');
    }, []);

    // Estados de visualización
    const [selectedVariables, setSelectedVariables] = useState({
        speed: true,
        rpm: true,
        temperature: true,
        fuel: true
    });
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapLayer, setHeatmapLayer] = useState<'speed' | 'events' | 'geofence_violations'>('speed');
    const [downsample, setDownsample] = useState<'5s' | '10s' | '100m'>('10s');
    const [filters, setFilters] = useState<TelemetryFilters>({});

    // Estados de alarmas y eventos
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [showAlarms, setShowAlarms] = useState(false);
    const [showEvents, setShowEvents] = useState(false);

    // Estados de comparación
    const [comparisonMode, setComparisonMode] = useState(false);
    const [selectedSessionA, setSelectedSessionA] = useState<string>('');
    const [selectedSessionB, setSelectedSessionB] = useState<string>('');
    const [availableSessionsForComparison, setAvailableSessionsForComparison] = useState<TelemetrySessionDTO[]>([]);

    // Estados de monitoreo en tiempo real
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState<number>(5000);

    // Estados de exportación
    const [showExportDialog, setShowExportDialog] = useState(false);

    // Hook de datos de telemetría
    const { useSessions, useSessionPoints, useEvents, useGeofences } = useTelemetryData();

    // Hook de exportación
    const { exportTelemetry, exportSession, isExporting: exportLoading, error: exportError } = useExport();

    // Calcular rango de fechas (últimos 30 días)
    const dateRange = useMemo(() => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
            from: startTime.toISOString(),
            to: endTime.toISOString()
        };
    }, []);

    // Queries
    const { data: sessions = [], isLoading: loadingSessions } = useSessions({
        vehicleId: selectedVehicle || undefined,
        from: filters.from || dateRange.from,
        to: filters.to || dateRange.to
    });

    const { data: points = [], isLoading: loadingPoints } = useSessionPoints(selectedSession, downsample);
    const { data: sessionEvents = [], isLoading: loadingEvents } = useEvents({
        ...filters,
        vehicleId: selectedVehicle || undefined
    });

    const { data: geofences = [], isLoading: loadingGeofences } = useGeofences();

    // Hook de replay
    const {
        replayState,
        currentPoint,
        play,
        pause,
        stop,
        setSpeed,
        setCurrentIndex,
        checkForCriticalEvents
    } = useReplay(points);

    // Auto-pause en eventos críticos
    useEffect(() => {
        if (Array.isArray(sessionEvents)) {
            checkForCriticalEvents(sessionEvents);
        }
    }, [sessionEvents, checkForCriticalEvents]);

    // Cálculos derivados
    const selectedSessionData = useMemo(() =>
        sessions.find(s => s.id === selectedSession),
        [sessions, selectedSession]
    );

    const eventsBySeverity = useMemo(() => {
        const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        if (Array.isArray(sessionEvents)) {
            sessionEvents.forEach(event => {
                if (event && event.severity && counts.hasOwnProperty(event.severity)) {
                    counts[event.severity]++;
                }
            });
        }
        return counts;
    }, [sessionEvents]);

    // Cálculo de métricas de telemetría desde el summary del backend
    const telemetryMetrics = useMemo<TelemetryMetrics | null>(() => {
        if (!telemetryData || !telemetryData.summary) return null;

        const summary = telemetryData.summary;
        // Calcular duración en minutos
        const startTime = new Date(telemetryData.startedAt).getTime();
        const endTime = telemetryData.endedAt ? new Date(telemetryData.endedAt).getTime() : Date.now();
        const totalTime = (endTime - startTime) / 60000;

        return {
            maxSpeed: summary.maxSpeed || 0,
            averageSpeed: summary.avgSpeed || 0,
            maxRPM: 0, // No disponible en el summary actual
            averageRPM: 0, // No disponible en el summary actual
            totalDistance: summary.km || 0,
            totalTime,
            fuelEfficiency: 0, // Calcular cuando tengamos datos CAN
            accelerationTime: 0,
            decelerationTime: 0,
            idleTime: 0,
            maxAcceleration: 0,
            maxDeceleration: 0,
            hasTemperature: false,
            averageTemperature: 0,
            maxTemperature: 0
        };
    }, [telemetryData]);

    // Efectos
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadVehicles();
        }
    }, [isAuthenticated]);

    // Actualizar sesiones disponibles cuando cambian los datos del hook
    useEffect(() => {
        if (sessions && sessions.length > 0) {
            // Si hay vehículo seleccionado, filtrar por ese vehículo
            if (selectedVehicle) {
                const filteredSessions = sessions.filter(s => s.vehicleId === selectedVehicle);
                setAvailableSessions(filteredSessions);
                // Auto-seleccionar la primera sesión si no hay ninguna seleccionada
                const firstSession = filteredSessions[0];
                if (!selectedSession && firstSession) {
                    setSelectedSession(firstSession.id);
                }
            } else {
                // Si no hay vehículo seleccionado, mostrar todas las sesiones
                setAvailableSessions(sessions);
                // Auto-seleccionar la primera sesión si no hay ninguna seleccionada
                const firstSession = sessions[0];
                if (!selectedSession && firstSession) {
                    setSelectedSession(firstSession.id);
                }
            }
        } else {
            // Limpiar sesiones si no hay datos
            setAvailableSessions([]);
            setSelectedSession('');
        }
    }, [sessions, selectedSession, selectedVehicle]);

    useEffect(() => {
        if (selectedSession) {
            const session = sessions.find(s => s.id === selectedSession);
            if (session) {
                setTelemetryData(session as any);
            }
        }
    }, [selectedSession, sessions]);

    // Funciones
    const loadVehicles = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.get<{ success: boolean; data: Vehicle[] }>('/api/vehicles');

            if (response.success && Array.isArray(response.data)) {
                setVehicles(response.data);
            } else {
                setError('No se pudieron cargar los vehículos');
            }
        } catch (error: any) {
            logger.error('Error fetching vehicles:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                setError('Error al cargar la lista de vehículos');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);


    const handleVehicleChange = (vehicleId: string) => {
        setSelectedVehicle(vehicleId);
        setSelectedSession('');
        setAvailableSessions([]);
        setTelemetryData(null);
        setComparisonMode(false);
        // Limpiar el cache de queries para forzar recarga
        queryClient.invalidateQueries({ queryKey: ['telemetry', 'sessions'] });
        queryClient.invalidateQueries({ queryKey: ['telemetry', 'events'] });
    };

    const handleSessionChange = (_event: SelectChangeEvent<string>) => {
        const sessionId = _event.target.value;
        setSelectedSession(sessionId);
        setError('');
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };


    const handleExport = async (format: 'CSV' | 'PDF', options: ExportOptions) => {
        try {
            logger.info('Exportando datos', { format, options, sessionId: selectedSession });

            // ✅ Implementación real de exportación
            if (selectedSession) {
                // Exportar sesión específica
                await exportSession(selectedSession, {
                    format,
                    ...options,
                    vehicleIds: selectedVehicle ? [selectedVehicle] : []
                });
            } else {
                // Exportar telemetría general
                await exportTelemetry({
                    format,
                    ...options,
                    vehicleIds: selectedVehicle ? [selectedVehicle] : []
                });
            }
        } catch (error) {
            logger.error('Error en exportación', { error, format, options });
        }
    };

    const handleRefresh = () => {
        // El hook useSessions se recargará automáticamente al cambiar los filtros
        setFilters(prev => ({ ...prev }));
    };

    const toggleMonitoring = () => {
        setIsMonitoring(!isMonitoring);
    };

    const handleComparisonToggle = () => {
        const newMode = !comparisonMode;
        setComparisonMode(newMode);
        if (newMode) {
            // Cargar todas las sesiones disponibles para comparación
            setAvailableSessionsForComparison(availableSessions);
        } else {
            setSelectedSessionA('');
            setSelectedSessionB('');
        }
    };

    // Calcular métricas comparativas
    const comparisonMetrics = useMemo(() => {
        if (!selectedSessionA || !selectedSessionB) return null;

        const sessionA = availableSessionsForComparison.find(s => s.id === selectedSessionA);
        const sessionB = availableSessionsForComparison.find(s => s.id === selectedSessionB);

        if (!sessionA || !sessionB) return null;

        return {
            sessionA: {
                id: sessionA.id,
                startedAt: sessionA.startedAt,
                distance: sessionA.summary.km || 0,
                avgSpeed: sessionA.summary.avgSpeed || 0,
                maxSpeed: sessionA.summary.maxSpeed || 0,
                duration: sessionA.endedAt
                    ? (new Date(sessionA.endedAt).getTime() - new Date(sessionA.startedAt).getTime()) / 60000
                    : 0,
                pointsCount: sessionA.pointsCount,
                events: sessionA.summary.eventsBySeverity
            },
            sessionB: {
                id: sessionB.id,
                startedAt: sessionB.startedAt,
                distance: sessionB.summary.km || 0,
                avgSpeed: sessionB.summary.avgSpeed || 0,
                maxSpeed: sessionB.summary.maxSpeed || 0,
                duration: sessionB.endedAt
                    ? (new Date(sessionB.endedAt).getTime() - new Date(sessionB.startedAt).getTime()) / 60000
                    : 0,
                pointsCount: sessionB.pointsCount,
                events: sessionB.summary.eventsBySeverity
            },
            differences: {
                distance: ((sessionA.summary.km || 0) - (sessionB.summary.km || 0)),
                avgSpeed: ((sessionA.summary.avgSpeed || 0) - (sessionB.summary.avgSpeed || 0)),
                maxSpeed: ((sessionA.summary.maxSpeed || 0) - (sessionB.summary.maxSpeed || 0)),
                events: {
                    CRITICAL: (sessionA.summary.eventsBySeverity.CRITICAL - sessionB.summary.eventsBySeverity.CRITICAL),
                    HIGH: (sessionA.summary.eventsBySeverity.HIGH - sessionB.summary.eventsBySeverity.HIGH),
                    MEDIUM: (sessionA.summary.eventsBySeverity.MEDIUM - sessionB.summary.eventsBySeverity.MEDIUM),
                    LOW: (sessionA.summary.eventsBySeverity.LOW - sessionB.summary.eventsBySeverity.LOW)
                }
            }
        };
    }, [selectedSessionA, selectedSessionB, availableSessionsForComparison]);

    const handlePointClick = (point: TelemetryPointDTO) => {
        if (points && points.length > 0) {
            const pointIndex = points.findIndex(p => p.ts === point.ts);
            if (pointIndex !== -1) {
                setCurrentIndex(pointIndex);
            }
        }
    };

    const handleEventClick = (event: EventDTO) => {
        if (points && points.length > 0) {
            const firstPoint = points[0];
            if (!firstPoint) return;

            const eventTime = new Date(event.ts).getTime();
            const closestPointIndex = points.reduce((closest, point, _index) => {
                const pointTime = new Date(point.ts).getTime();
                const closestPoint = points[closest];
                if (!closestPoint) return 0;
                const closestTime = new Date(closestPoint.ts).getTime();
                return Math.abs(pointTime - eventTime) < Math.abs(closestTime - eventTime) ? _index : closest;
            }, 0);

            setCurrentIndex(closestPointIndex);
        }
    };

    // Renderizado condicional
    if (!isAuthenticated) {
        return null;
    }

    if (loading && vehicles.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Alert severity="error" sx={{ maxWidth: 600 }}>
                    {error}
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
                        <Memory color="primary" />
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                Telemetría Unificada
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Análisis avanzado de datos CAN/GPS con monitoreo en tiempo real
                            </Typography>
                        </Box>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <Tooltip title="Eventos">
                            <IconButton onClick={() => setShowEvents(!showEvents)}>
                                <Badge badgeContent={Array.isArray(sessionEvents) ? sessionEvents.length : 0} color="primary">
                                    <Event />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Alarmas">
                            <IconButton onClick={() => setShowAlarms(!showAlarms)}>
                                <Badge badgeContent={alarms.length} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Actualizar datos">
                            <IconButton onClick={handleRefresh} disabled={loading}>
                                <Refresh />
                            </IconButton>
                        </Tooltip>
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
                        <Grid container spacing={3} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <VehicleSelector
                                    selectedVehicle={selectedVehicle}
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
                                        disabled={availableSessions.length === 0}
                                    >
                                        {availableSessions.map((session) => (
                                            <MenuItem key={session.id} value={session.id}>
                                                {new Date(session.startedAt).toLocaleString()} -
                                                {session.pointsCount > 0
                                                    ? `${session.pointsCount} puntos GPS`
                                                    : 'Sin datos'}
                                            </MenuItem>
                                        ))}
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
                                        startIcon={<Upload />}
                                        onClick={() => setShowExportDialog(true)}
                                        disabled={exportLoading}
                                    >
                                        {exportLoading ? 'Exportando...' : 'Exportar'}
                                    </Button>
                                </Stack>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Métricas principales */}
                {telemetryMetrics && (
                    <MetricsGrid container spacing={3} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Velocidad Máxima
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {telemetryMetrics.maxSpeed.toFixed(1)} km/h
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Promedio: {telemetryMetrics.averageSpeed.toFixed(1)} km/h
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        RPM Máximo
                                    </Typography>
                                    <Typography variant="h4" color="secondary">
                                        {telemetryMetrics.maxRPM.toFixed(0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Promedio: {telemetryMetrics.averageRPM.toFixed(0)}
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Distancia Total
                                    </Typography>
                                    <Typography variant="h4" color="info.main">
                                        {telemetryMetrics.totalDistance.toFixed(2)} km
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Tiempo: {telemetryMetrics.totalTime.toFixed(1)} min
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Eficiencia Combustible
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {telemetryMetrics.fuelEfficiency.toFixed(2)} km/l
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {telemetryMetrics.hasTemperature ? `${telemetryMetrics.averageTemperature.toFixed(1)}°C` : 'Sin temp'}
                                    </Typography>
                                </CardContent>
                            </MetricCard>
                        </Grid>
                    </MetricsGrid>
                )}

                {/* Pestañas principales */}
                <Card sx={{ flex: 1 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={currentTab} onChange={handleTabChange} aria-label="telemetria tabs">
                            <Tab
                                icon={<Speed />}
                                label="Datos en Tiempo Real"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Map />}
                                label="Mapa Avanzado"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Compare />}
                                label="Comparador"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Timeline />}
                                label="Replay"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<Assessment />}
                                label="Métricas"
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Contenido de pestañas */}
                    {currentTab === 0 && (
                        <Box sx={{ p: 3 }}>
                            {selectedVehicle && selectedSession && telemetryData ? (
                                <Suspense fallback={
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                                        <CircularProgress />
                                    </Box>
                                }>
                                    <RealTimeData session={telemetryData as any} />
                                </Suspense>
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                                    <Typography>
                                        {!selectedVehicle
                                            ? 'Selecciona un vehículo para ver datos en tiempo real'
                                            : !selectedSession
                                                ? 'Selecciona una sesión para ver datos en tiempo real'
                                                : 'Cargando datos de la sesión...'}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {currentTab === 1 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Mapa GPS con Telemetría
                            </Typography>
                            <Box sx={{ height: 500, position: 'relative' }}>
                                <Suspense fallback={
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                        <CircularProgress />
                                    </Box>
                                }>
                                    <TelemetryMapAdvanced
                                        points={points}
                                        events={Array.isArray(sessionEvents) ? sessionEvents : []}
                                        geofences={geofences}
                                        currentReplayPoint={currentPoint}
                                        showHeatmap={showHeatmap}
                                        heatmapLayer={heatmapLayer}
                                        onPointClick={handlePointClick}
                                        onEventClick={handleEventClick}
                                        onGeofenceClick={() => { }}
                                    />
                                </Suspense>

                                {/* Controles del mapa */}
                                <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                                    <Stack spacing={1}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={showHeatmap}
                                                    onChange={(e) => setShowHeatmap(e.target.checked)}
                                                />
                                            }
                                            label="Heatmap"
                                        />

                                        {showHeatmap && (
                                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                                <InputLabel>Capa</InputLabel>
                                                <Select
                                                    value={heatmapLayer}
                                                    label="Capa"
                                                    onChange={(e) => setHeatmapLayer(e.target.value as any)}
                                                >
                                                    <MenuItem value="speed">Velocidad</MenuItem>
                                                    <MenuItem value="events">Eventos</MenuItem>
                                                    <MenuItem value="geofence_violations">Violaciones</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    </Stack>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {currentTab === 2 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Comparador de Sesiones
                            </Typography>
                            {comparisonMode ? (
                                <>
                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        <Grid item xs={12} md={6}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom color="primary">
                                                        Sesión A
                                                    </Typography>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Seleccionar Sesión</InputLabel>
                                                        <Select
                                                            value={selectedSessionA}
                                                            onChange={(e) => setSelectedSessionA(e.target.value)}
                                                            label="Seleccionar Sesión"
                                                        >
                                                            {availableSessionsForComparison.map((session) => (
                                                                <MenuItem key={session.id} value={session.id}>
                                                                    {new Date(session.startedAt).toLocaleString()} - {session.summary.km.toFixed(1)} km
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    {selectedSessionA && comparisonMetrics && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Stack spacing={1}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Distancia:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionA.distance.toFixed(2)} km
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Vel. Promedio:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionA.avgSpeed.toFixed(1)} km/h
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Vel. Máxima:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionA.maxSpeed.toFixed(1)} km/h
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Duración:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionA.duration.toFixed(0)} min
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Eventos Críticos:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold" color="error">
                                                                        {comparisonMetrics.sessionA.events.CRITICAL + comparisonMetrics.sessionA.events.HIGH}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom color="secondary">
                                                        Sesión B
                                                    </Typography>
                                                    <FormControl fullWidth>
                                                        <InputLabel>Seleccionar Sesión</InputLabel>
                                                        <Select
                                                            value={selectedSessionB}
                                                            onChange={(e) => setSelectedSessionB(e.target.value)}
                                                            label="Seleccionar Sesión"
                                                        >
                                                            {availableSessionsForComparison.map((session) => (
                                                                <MenuItem
                                                                    key={session.id}
                                                                    value={session.id}
                                                                    disabled={session.id === selectedSessionA}
                                                                >
                                                                    {new Date(session.startedAt).toLocaleString()} - {session.summary.km.toFixed(1)} km
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    {selectedSessionB && comparisonMetrics && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Stack spacing={1}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Distancia:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionB.distance.toFixed(2)} km
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Vel. Promedio:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionB.avgSpeed.toFixed(1)} km/h
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Vel. Máxima:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionB.maxSpeed.toFixed(1)} km/h
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Duración:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {comparisonMetrics.sessionB.duration.toFixed(0)} min
                                                                    </Typography>
                                                                </Box>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Typography variant="body2">Eventos Críticos:</Typography>
                                                                    <Typography variant="body2" fontWeight="bold" color="error">
                                                                        {comparisonMetrics.sessionB.events.CRITICAL + comparisonMetrics.sessionB.events.HIGH}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>

                                    {comparisonMetrics && (
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>
                                                    Análisis Comparativo
                                                </Typography>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12} md={3}>
                                                        <Card variant="outlined">
                                                            <CardContent>
                                                                <Typography color="textSecondary" gutterBottom>
                                                                    Diferencia de Distancia
                                                                </Typography>
                                                                <Typography variant="h5" color={comparisonMetrics.differences.distance > 0 ? 'primary' : 'secondary'}>
                                                                    {comparisonMetrics.differences.distance > 0 ? '+' : ''}
                                                                    {comparisonMetrics.differences.distance.toFixed(2)} km
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {comparisonMetrics.differences.distance > 0
                                                                        ? 'Sesión A recorrió más'
                                                                        : 'Sesión B recorrió más'}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <Card variant="outlined">
                                                            <CardContent>
                                                                <Typography color="textSecondary" gutterBottom>
                                                                    Diferencia Vel. Promedio
                                                                </Typography>
                                                                <Typography variant="h5" color={comparisonMetrics.differences.avgSpeed > 0 ? 'warning.main' : 'success.main'}>
                                                                    {comparisonMetrics.differences.avgSpeed > 0 ? '+' : ''}
                                                                    {comparisonMetrics.differences.avgSpeed.toFixed(1)} km/h
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {comparisonMetrics.differences.avgSpeed > 0
                                                                        ? 'Sesión A más rápida'
                                                                        : 'Sesión B más rápida'}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <Card variant="outlined">
                                                            <CardContent>
                                                                <Typography color="textSecondary" gutterBottom>
                                                                    Diferencia Vel. Máxima
                                                                </Typography>
                                                                <Typography variant="h5" color="info.main">
                                                                    {comparisonMetrics.differences.maxSpeed > 0 ? '+' : ''}
                                                                    {comparisonMetrics.differences.maxSpeed.toFixed(1)} km/h
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {comparisonMetrics.differences.maxSpeed > 0
                                                                        ? 'Sesión A alcanzó más'
                                                                        : 'Sesión B alcanzó más'}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <Card variant="outlined">
                                                            <CardContent>
                                                                <Typography color="textSecondary" gutterBottom>
                                                                    Diferencia Eventos Críticos
                                                                </Typography>
                                                                <Typography variant="h5" color="error">
                                                                    {comparisonMetrics.differences.events.CRITICAL + comparisonMetrics.differences.events.HIGH > 0 ? '+' : ''}
                                                                    {comparisonMetrics.differences.events.CRITICAL + comparisonMetrics.differences.events.HIGH}
                                                                </Typography>
                                                                <Typography variant="body2" color="textSecondary">
                                                                    {(comparisonMetrics.differences.events.CRITICAL + comparisonMetrics.differences.events.HIGH) > 0
                                                                        ? 'Sesión A más eventos'
                                                                        : 'Sesión B más eventos'}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ mt: 3 }}>
                                                    <Typography variant="subtitle1" gutterBottom>
                                                        Distribución de Eventos por Sesión
                                                    </Typography>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="body2" color="primary" gutterBottom>
                                                                Sesión A
                                                            </Typography>
                                                            <Stack direction="row" spacing={1}>
                                                                <Chip
                                                                    label={`Críticos: ${comparisonMetrics.sessionA.events.CRITICAL}`}
                                                                    color="error"
                                                                    size="small"
                                                                    variant="filled"
                                                                />
                                                                <Chip
                                                                    label={`Altos: ${comparisonMetrics.sessionA.events.HIGH}`}
                                                                    color="error"
                                                                    size="small"
                                                                />
                                                                <Chip
                                                                    label={`Medios: ${comparisonMetrics.sessionA.events.MEDIUM}`}
                                                                    color="warning"
                                                                    size="small"
                                                                />
                                                                <Chip
                                                                    label={`Bajos: ${comparisonMetrics.sessionA.events.LOW}`}
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            </Stack>
                                                        </Grid>
                                                        <Grid item xs={12} md={6}>
                                                            <Typography variant="body2" color="secondary" gutterBottom>
                                                                Sesión B
                                                            </Typography>
                                                            <Stack direction="row" spacing={1}>
                                                                <Chip
                                                                    label={`Críticos: ${comparisonMetrics.sessionB.events.CRITICAL}`}
                                                                    color="error"
                                                                    size="small"
                                                                    variant="filled"
                                                                />
                                                                <Chip
                                                                    label={`Altos: ${comparisonMetrics.sessionB.events.HIGH}`}
                                                                    color="error"
                                                                    size="small"
                                                                />
                                                                <Chip
                                                                    label={`Medios: ${comparisonMetrics.sessionB.events.MEDIUM}`}
                                                                    color="warning"
                                                                    size="small"
                                                                />
                                                                <Chip
                                                                    label={`Bajos: ${comparisonMetrics.sessionB.events.LOW}`}
                                                                    color="success"
                                                                    size="small"
                                                                />
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Box>

                                                <Alert severity="info" sx={{ mt: 2 }}>
                                                    <Typography variant="body2">
                                                        <strong>Interpretación:</strong> Los valores positivos indican que la Sesión A tiene valores superiores.
                                                        Los valores negativos indican que la Sesión B tiene valores superiores.
                                                    </Typography>
                                                </Alert>
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            ) : (
                                <Alert severity="info">
                                    Activa el modo comparación para seleccionar y comparar sesiones del vehículo actual.
                                </Alert>
                            )}
                        </Box>
                    )}

                    {currentTab === 3 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Replay de Sesión
                            </Typography>

                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <IconButton onClick={play} disabled={replayState.isPlaying || points.length === 0}>
                                    <PlayArrow />
                                </IconButton>
                                <IconButton onClick={pause} disabled={!replayState.isPlaying}>
                                    <Pause />
                                </IconButton>
                                <IconButton onClick={stop}>
                                    <Stop />
                                </IconButton>

                                <Typography variant="body2" sx={{ ml: 2 }}>
                                    Velocidad: {replayState.speed}x
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() => setSpeed(1)}
                                    variant={replayState.speed === 1 ? 'contained' : 'outlined'}
                                >
                                    1x
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setSpeed(5)}
                                    variant={replayState.speed === 5 ? 'contained' : 'outlined'}
                                >
                                    5x
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setSpeed(10)}
                                    variant={replayState.speed === 10 ? 'contained' : 'outlined'}
                                >
                                    10x
                                </Button>
                            </Stack>

                            <Box sx={{ px: 2 }}>
                                <Slider
                                    value={replayState.currentIndex}
                                    onChange={(_, value) => setCurrentIndex(value as number)}
                                    min={0}
                                    max={Math.max(0, points.length - 1)}
                                    step={1}
                                    marks={Array.isArray(sessionEvents) ? sessionEvents.map((event, index) => ({
                                        value: points.findIndex(p => p.ts === event.ts),
                                        label: event.severity
                                    })).filter(mark => mark.value !== -1) : []}
                                />
                                <Typography variant="body2" color="text.secondary" align="center">
                                    {replayState.currentIndex + 1} / {points.length} puntos
                                </Typography>
                            </Box>

                            {currentPoint && (
                                <Card sx={{ mt: 2 }}>
                                    <CardContent>
                                        <Typography variant="subtitle2">Punto Actual</Typography>
                                        <Typography variant="body2">
                                            Tiempo: {new Date(currentPoint.ts).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2">
                                            Velocidad: {currentPoint.speed || 'N/A'} km/h
                                        </Typography>
                                        <Typography variant="body2">
                                            Posición: {currentPoint.lat.toFixed(6)}, {currentPoint.lng.toFixed(6)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            )}
                        </Box>
                    )}

                    {currentTab === 4 && (
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Métricas Detalladas y Eventos
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Eventos por Severidad
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                                <Chip label={`LOW: ${eventsBySeverity.LOW}`} color="success" />
                                                <Chip label={`MEDIUM: ${eventsBySeverity.MEDIUM}`} color="warning" />
                                                <Chip label={`HIGH: ${eventsBySeverity.HIGH}`} color="error" />
                                                <Chip label={`CRITICAL: ${eventsBySeverity.CRITICAL}`} color="error" variant="filled" />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Resumen de Sesión
                                            </Typography>
                                            {selectedSessionData ? (
                                                <Stack spacing={2}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Distancia total:</Typography>
                                                        <Typography variant="h6">
                                                            {selectedSessionData.summary.km?.toFixed(1) || 'N/A'} km
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Velocidad media:</Typography>
                                                        <Typography variant="h6">
                                                            {selectedSessionData.summary.avgSpeed?.toFixed(0) || 'N/A'} km/h
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Velocidad máxima:</Typography>
                                                        <Typography variant="h6">
                                                            {selectedSessionData.summary.maxSpeed?.toFixed(0) || 'N/A'} km/h
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography>Puntos GPS:</Typography>
                                                        <Typography variant="h6">
                                                            {points.length}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            ) : (
                                                <Alert severity="info">Selecciona una sesión para ver el resumen</Alert>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </Card>

                {/* Diálogo de Exportación */}
                <Suspense fallback={<div>Cargando...</div>}>
                    <ExportDialog
                        open={showExportDialog}
                        onClose={() => setShowExportDialog(false)}
                        exportType={selectedSession ? 'session' : 'telemetry'}
                        sessionId={selectedSession}
                        vehicleIds={selectedVehicle ? [selectedVehicle] : []}
                        defaultDateRange={{
                            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            end: new Date()
                        }}
                    />
                </Suspense>
            </MainContainer>
        </ErrorBoundary>
    );
};

export default UnifiedTelemetria;
