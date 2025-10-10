import {
    Assessment,
    Download,
    FilterList,
    Pause,
    PlayArrow,
    Stop,
    Timeline
} from '@mui/icons-material';
import {
    Alert,
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
    Slider,
    Stack,
    Switch,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useReplay } from '../../hooks/useReplay';
import { useTelemetryData } from '../../hooks/useTelemetryData';
import {
    EventDTO,
    ExportOptions,
    TelemetryFilters,
    TelemetryPointDTO
} from '../../types/telemetry';
import { logger } from '../../utils/logger';
import { TelemetryMapAdvanced } from './TelemetryMapAdvanced';

interface TelemetryPageProps {
    initialSessionId?: string;
}

export const TelemetryPage: React.FC<TelemetryPageProps> = ({ initialSessionId }) => {
    // Estados principales
    const [selectedSessionId, setSelectedSessionId] = useState<string>(initialSessionId || '');
    const [activeTab, setActiveTab] = useState(0);
    const [filters, setFilters] = useState<TelemetryFilters>({});
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapLayer, setHeatmapLayer] = useState<'speed' | 'events' | 'geofence_violations'>('speed');
    const [downsample, setDownsample] = useState<'5s' | '10s' | '100m'>('10s');

    // Hooks de datos
    const { useSessions, useSessionPoints, useEvents, useGeofences } = useTelemetryData();

    // Queries
    const { data: sessions = [], isLoading: loadingSessions } = useSessions({
        vehicleId: filters.vehicleId,
        from: filters.from,
        to: filters.to
    });

    const { data: points = [], isLoading: loadingPoints } = useSessionPoints(selectedSessionId, downsample);

    const { data: events = [], isLoading: loadingEvents } = useEvents({
        sessionId: selectedSessionId,
        ...filters
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
        checkForCriticalEvents(events);
    }, [events, checkForCriticalEvents]);

    // Cálculos derivados
    const selectedSession = useMemo(() =>
        sessions.find(s => s.id === selectedSessionId),
        [sessions, selectedSessionId]
    );

    const eventsBySeverity = useMemo(() => {
        const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        events.forEach(event => {
            counts[event.severity]++;
        });
        return counts;
    }, [events]);

    const isLoading = loadingSessions || loadingPoints || loadingEvents || loadingGeofences;

    // Handlers
    const handleSessionChange = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        stop(); // Detener replay al cambiar sesión
    };

    const handleFilterChange = (newFilters: Partial<TelemetryFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleExport = async (format: 'CSV' | 'PDF', options: ExportOptions) => {
        try {
            // Implementar exportación
            logger.info('Exportando datos', { format, options, sessionId: selectedSessionId });
        } catch (error) {
            logger.error('Error en exportación', { error, format, options });
        }
    };

    const handlePointClick = (point: TelemetryPointDTO) => {
        const pointIndex = points.findIndex(p => p.ts === point.ts);
        if (pointIndex !== -1) {
            setCurrentIndex(pointIndex);
        }
    };

    const handleEventClick = (event: EventDTO) => {
        // Buscar punto más cercano al evento
        const eventTime = new Date(event.ts).getTime();
        const closestPointIndex = points.reduce((closest, point, index) => {
            const pointTime = new Date(point.ts).getTime();
            const closestTime = new Date(points[closest].ts).getTime();
            return Math.abs(pointTime - eventTime) < Math.abs(closestTime - eventTime) ? index : closest;
        }, 0);

        setCurrentIndex(closestPointIndex);
    };

    // Renderizar contenido de tabs
    const renderTabContent = () => {
        switch (activeTab) {
            case 0: // Resumen
                return (
                    <Stack spacing={2}>
                        <Typography variant="h6">Resumen de Sesión</Typography>
                        {selectedSession ? (
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" color="primary">
                                                {selectedSession.summary.km.toFixed(1)} km
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Distancia total
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" color="primary">
                                                {selectedSession.summary.avgSpeed?.toFixed(0) || 'N/A'} km/h
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Velocidad media
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" color="primary">
                                                {selectedSession.summary.maxSpeed?.toFixed(0) || 'N/A'} km/h
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Velocidad máxima
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h4" color="primary">
                                                {points.length}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Puntos GPS
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        ) : (
                            <Alert severity="info">Selecciona una sesión para ver el resumen</Alert>
                        )}

                        <Typography variant="h6" sx={{ mt: 2 }}>Eventos por Severidad</Typography>
                        <Stack direction="row" spacing={1}>
                            <Chip label={`LOW: ${eventsBySeverity.LOW}`} color="success" />
                            <Chip label={`MEDIUM: ${eventsBySeverity.MEDIUM}`} color="warning" />
                            <Chip label={`HIGH: ${eventsBySeverity.HIGH}`} color="error" />
                            <Chip label={`CRITICAL: ${eventsBySeverity.CRITICAL}`} color="error" variant="filled" />
                        </Stack>
                    </Stack>
                );

            case 1: // Filtros
                return (
                    <Stack spacing={2}>
                        <Typography variant="h6">Filtros</Typography>

                        <FormControl fullWidth size="small">
                            <InputLabel>Vehículo</InputLabel>
                            <Select
                                value={filters.vehicleId || ''}
                                label="Vehículo"
                                onChange={(e) => handleFilterChange({ vehicleId: e.target.value })}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                {/* Aquí irían las opciones de vehículos */}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Severidad</InputLabel>
                            <Select
                                value={filters.severity || ''}
                                label="Severidad"
                                onChange={(e) => handleFilterChange({ severity: e.target.value })}
                            >
                                <MenuItem value="">Todas</MenuItem>
                                <MenuItem value="LOW">LOW</MenuItem>
                                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                                <MenuItem value="HIGH">HIGH</MenuItem>
                                <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Evento</InputLabel>
                            <Select
                                value={filters.type || ''}
                                label="Tipo de Evento"
                                onChange={(e) => handleFilterChange({ type: e.target.value })}
                            >
                                <MenuItem value="">Todos</MenuItem>
                                <MenuItem value="geofence_enter">Entrada Geocerca</MenuItem>
                                <MenuItem value="geofence_exit">Salida Geocerca</MenuItem>
                                <MenuItem value="speed_exceeded">Exceso Velocidad</MenuItem>
                                <MenuItem value="hard_brake">Frenada Brusca</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Downsample</InputLabel>
                            <Select
                                value={downsample}
                                label="Downsample"
                                onChange={(e) => setDownsample(e.target.value as '5s' | '10s' | '100m')}
                            >
                                <MenuItem value="5s">5 segundos</MenuItem>
                                <MenuItem value="10s">10 segundos</MenuItem>
                                <MenuItem value="100m">100 metros</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                );

            case 2: // Replay
                return (
                    <Stack spacing={2}>
                        <Typography variant="h6">Replay de Sesión</Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
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
                                marks={events.map((event, index) => ({
                                    value: points.findIndex(p => p.ts === event.ts),
                                    label: event.severity
                                })).filter(mark => mark.value !== -1)}
                            />
                            <Typography variant="body2" color="text.secondary" align="center">
                                {replayState.currentIndex + 1} / {points.length} puntos
                            </Typography>
                        </Box>

                        {currentPoint && (
                            <Card>
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
                    </Stack>
                );

            case 3: // Export
                return (
                    <Stack spacing={2}>
                        <Typography variant="h6">Exportar Datos</Typography>

                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => handleExport('CSV', { format: 'CSV', includePoints: true, includeEvents: true, dateRange: { from: '', to: '' } })}
                            disabled={!selectedSessionId}
                        >
                            Exportar CSV
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<Download />}
                            onClick={() => handleExport('PDF', { format: 'PDF', includeHeatmap: true, includeEvents: true, includeKPIs: true })}
                            disabled={!selectedSessionId}
                        >
                            Exportar PDF
                        </Button>
                    </Stack>
                );

            case 4: // Eventos
                return (
                    <Stack spacing={2}>
                        <Typography variant="h6">Eventos ({events.length})</Typography>

                        {events.length === 0 ? (
                            <Alert severity="info">No hay eventos para esta sesión</Alert>
                        ) : (
                            <Stack spacing={1}>
                                {events.map((event) => (
                                    <Card key={event.id} sx={{ cursor: 'pointer' }} onClick={() => handleEventClick(event)}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2">{event.type}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(event.ts).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={event.severity}
                                                    color={event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Stack>
                );

            default:
                return null;
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h4">Telemetría</Typography>
                <Typography variant="body2" color="text.secondary">
                    Visualización avanzada de rutas, eventos y geocercas
                </Typography>
            </Box>

            {/* Contenido principal */}
            <Box sx={{ flex: 1, display: 'flex' }}>
                {/* Mapa (8 columnas) */}
                <Box sx={{ flex: 2, position: 'relative' }}>
                    {isLoading && (
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 20,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CircularProgress />
                        </Box>
                    )}

                    <TelemetryMapAdvanced
                        points={points}
                        events={events}
                        geofences={geofences}
                        currentReplayPoint={currentPoint}
                        showHeatmap={showHeatmap}
                        heatmapLayer={heatmapLayer}
                        onPointClick={handlePointClick}
                        onEventClick={handleEventClick}
                    />

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

                {/* Panel lateral (4 columnas) */}
                <Box sx={{ width: 400, borderLeft: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
                            <Tab icon={<Assessment />} label="Resumen" />
                            <Tab icon={<FilterList />} label="Filtros" />
                            <Tab icon={<PlayArrow />} label="Replay" />
                            <Tab icon={<Download />} label="Export" />
                            <Tab icon={<Timeline />} label="Eventos" />
                        </Tabs>
                    </Box>

                    {/* Contenido de tabs */}
                    <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
                        {renderTabContent()}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
