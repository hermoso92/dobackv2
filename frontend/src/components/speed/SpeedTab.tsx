import {
    Assessment,
    Cancel,
    CheckCircle,
    Download,
    FilterList,
    Map,
    Refresh,
    Speed,
    Visibility,
    VisibilityOff,
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
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { logger } from '../../utils/logger';
import { SpeedHeatmapMap } from './SpeedHeatmapMap';
import { useSpeedPDFExport } from './SpeedPDFExport';

// Tipos
interface SpeedEvent {
    id: string;
    vehicleId: string;
    vehicleName: string;
    timestamp: string;
    lat: number;
    lng: number;
    speed: number;
    speedLimit: number;
    rotativoActive: boolean;
    roadType: string;
    severity: 'normal' | 'warning' | 'critical';
    location: string;
}

interface SpeedFilters {
    vehicles: string[];
    timeRange: 'day' | 'week' | 'month' | 'year' | 'all';
    rotativoStatus: 'all' | 'with' | 'without';
}

interface SpeedMetrics {
    maxSpeed: number;
    avgSpeed: number;
    totalExcesses: number;
    excessesWithRotativo: number;
    excessesWithoutRotativo: number;
    topSpeedVehicles: Array<{
        vehicleId: string;
        vehicleName: string;
        maxSpeed: number;
        excessCount: number;
    }>;
}

// Componentes styled
const FilterSection = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap'
}));

const MetricsCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
    }
}));


// Componente principal
export const SpeedTab: React.FC = () => {
    const { exportPDF } = useSpeedPDFExport();

    // Estados principales
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados de datos
    const [speedEvents, setSpeedEvents] = useState<SpeedEvent[]>([]);
    const [speedMetrics, setSpeedMetrics] = useState<SpeedMetrics | null>(null);
    const [vehicles, setVehicles] = useState<any[]>([]);

    // Estados de filtros
    const [filters, setFilters] = useState<SpeedFilters>({
        vehicles: [],
        timeRange: 'week',
        rotativoStatus: 'all'
    });

    // Estados de visualización
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<SpeedEvent | null>(null);
    const [mapCenter] = useState<[number, number]>([40.4168, -3.7038]);
    const [mapZoom] = useState(11);

    // Cargar vehículos
    useEffect(() => {
        const loadVehicles = async () => {
            try {
                // Simulación de carga de vehículos - reemplazar con API real
                const mockVehicles = [
                    { id: '2143-BMZ', name: '2143-BMZ', type: 'BOMBA' },
                    { id: '2144-BMZ', name: '2144-BMZ', type: 'ESCALERA' },
                    { id: '2145-BMZ', name: '2145-BMZ', type: 'BOMBA' },
                    { id: '2146-BMZ', name: '2146-BMZ', type: 'URGENCIA' }
                ];
                setVehicles(mockVehicles);
            } catch (err) {
                logger.error('Error cargando vehículos:', err);
            }
        };

        loadVehicles();
    }, []);

    // Cargar datos de velocidad
    const loadSpeedData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            logger.info('Cargando datos de velocidad con filtros:', filters);

            // Simulación de datos - reemplazar con API real
            const mockEvents: SpeedEvent[] = [
                {
                    id: '1',
                    vehicleId: '2143-BMZ',
                    vehicleName: '2143-BMZ',
                    timestamp: '2024-01-15T10:30:00Z',
                    lat: 40.4168,
                    lng: -3.7038,
                    speed: 85,
                    speedLimit: 50,
                    rotativoActive: true,
                    roadType: 'Carretera secundaria',
                    severity: 'critical',
                    location: 'M-40, salida 18'
                },
                {
                    id: '2',
                    vehicleId: '2143-BMZ',
                    vehicleName: '2143-BMZ',
                    timestamp: '2024-01-15T11:15:00Z',
                    lat: 40.4200,
                    lng: -3.7100,
                    speed: 75,
                    speedLimit: 50,
                    rotativoActive: false,
                    roadType: 'Carretera secundaria',
                    severity: 'warning',
                    location: 'Carretera de Madrid'
                },
                {
                    id: '3',
                    vehicleId: '2144-BMZ',
                    vehicleName: '2144-BMZ',
                    timestamp: '2024-01-15T12:00:00Z',
                    lat: 40.4100,
                    lng: -3.6900,
                    speed: 45,
                    speedLimit: 50,
                    rotativoActive: false,
                    roadType: 'Urbana',
                    severity: 'normal',
                    location: 'Centro de Madrid'
                }
            ];

            // Filtrar eventos según filtros aplicados
            let filteredEvents = mockEvents;

            if (filters.vehicles.length > 0) {
                filteredEvents = filteredEvents.filter(event =>
                    filters.vehicles.includes(event.vehicleId)
                );
            }

            if (filters.rotativoStatus !== 'all') {
                filteredEvents = filteredEvents.filter(event =>
                    filters.rotativoStatus === 'with' ? event.rotativoActive : !event.rotativoActive
                );
            }

            setSpeedEvents(filteredEvents);

            // Calcular métricas
            const metrics: SpeedMetrics = {
                maxSpeed: Math.max(...filteredEvents.map(e => e.speed)),
                avgSpeed: filteredEvents.reduce((sum, e) => sum + e.speed, 0) / filteredEvents.length || 0,
                totalExcesses: filteredEvents.filter(e => e.speed > e.speedLimit).length,
                excessesWithRotativo: filteredEvents.filter(e => e.speed > e.speedLimit && e.rotativoActive).length,
                excessesWithoutRotativo: filteredEvents.filter(e => e.speed > e.speedLimit && !e.rotativoActive).length,
                topSpeedVehicles: []
            };

            setSpeedMetrics(metrics);

            logger.info('Datos de velocidad cargados:', { events: filteredEvents.length, metrics });

        } catch (err: any) {
            logger.error('Error cargando datos de velocidad:', err);
            setError(err.message || 'Error cargando datos de velocidad');
            toast.error('Error cargando datos de velocidad');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Cargar datos cuando cambien los filtros
    useEffect(() => {
        loadSpeedData();
    }, [loadSpeedData]);

    // Handlers
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleVehicleChange = (event: SelectChangeEvent<string[]>) => {
        const value = typeof event.target.value === 'string'
            ? event.target.value.split(',')
            : event.target.value;
        setFilters(prev => ({ ...prev, vehicles: value }));
    };

    const handleTimeRangeChange = (event: SelectChangeEvent) => {
        setFilters(prev => ({ ...prev, timeRange: event.target.value as any }));
    };

    const handleRotativoChange = (event: SelectChangeEvent) => {
        setFilters(prev => ({ ...prev, rotativoStatus: event.target.value as any }));
    };

    const handleExportPDF = async () => {
        if (!speedMetrics) {
            toast.error('No hay datos para exportar');
            return;
        }

        try {
            await exportPDF(speedEvents, filters, speedMetrics);
        } catch (error) {
            // Error ya manejado en el hook
        }
    };

    const handleEventClick = (event: SpeedEvent) => {
        setSelectedEvent(event);
    };

    // Renderizar filtros
    const renderFilters = () => (
        <FilterSection>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList />
                Filtros de Velocidad
            </Typography>

            <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Vehículos</InputLabel>
                <Select
                    multiple
                    value={filters.vehicles}
                    onChange={handleVehicleChange}
                    label="Vehículos"
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                            ))}
                        </Box>
                    )}
                >
                    {vehicles.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Período</InputLabel>
                <Select
                    value={filters.timeRange}
                    onChange={handleTimeRangeChange}
                    label="Período"
                >
                    <MenuItem value="day">Día</MenuItem>
                    <MenuItem value="week">Semana</MenuItem>
                    <MenuItem value="month">Mes</MenuItem>
                    <MenuItem value="year">Año</MenuItem>
                    <MenuItem value="all">Todo</MenuItem>
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Estado Rotativo</InputLabel>
                <Select
                    value={filters.rotativoStatus}
                    onChange={handleRotativoChange}
                    label="Estado Rotativo"
                >
                    <MenuItem value="all">Ambos</MenuItem>
                    <MenuItem value="with">Con Rotativo</MenuItem>
                    <MenuItem value="without">Sin Rotativo</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                <Tooltip title="Actualizar datos">
                    <IconButton onClick={loadSpeedData} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Exportar PDF">
                    <IconButton onClick={handleExportPDF}>
                        <Download />
                    </IconButton>
                </Tooltip>
            </Box>
        </FilterSection>
    );

    // Renderizar métricas
    const renderMetrics = () => {
        if (!speedMetrics) return null;

        return (
            <Grid container spacing={3} sx={{ p: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '50%',
                                    bgcolor: 'error.light',
                                    color: 'error.contrastText'
                                }}>
                                    <Speed />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {speedMetrics.maxSpeed}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        km/h máxima
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </MetricsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '50%',
                                    bgcolor: 'info.light',
                                    color: 'info.contrastText'
                                }}>
                                    <Assessment />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {speedMetrics.avgSpeed.toFixed(1)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        km/h media
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </MetricsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '50%',
                                    bgcolor: 'warning.light',
                                    color: 'warning.contrastText'
                                }}>
                                    <Warning />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {speedMetrics.totalExcesses}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Excesos totales
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </MetricsCard>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <MetricsCard>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '50%',
                                    bgcolor: 'error.light',
                                    color: 'error.contrastText'
                                }}>
                                    <Cancel />
                                </Box>
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {speedMetrics.excessesWithoutRotativo}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sin rotativo
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </MetricsCard>
                </Grid>
            </Grid>
        );
    };

    // Renderizar mapa de calor
    const renderHeatmap = () => (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Mapa de Calor de Velocidad</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant={showHeatmap ? "contained" : "outlined"}
                        startIcon={showHeatmap ? <Visibility /> : <VisibilityOff />}
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        size="small"
                    >
                        {showHeatmap ? 'Ocultar' : 'Mostrar'} Calor
                    </Button>
                </Box>
            </Box>

            <SpeedHeatmapMap
                events={speedEvents}
                showHeatmap={showHeatmap}
                onEventClick={handleEventClick}
                center={mapCenter}
                zoom={mapZoom}
            />
        </Box>
    );

    // Renderizar tabla de eventos
    const renderEventsTable = () => (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Eventos de Velocidad ({speedEvents.length})
            </Typography>

            {speedEvents.length === 0 ? (
                <Alert severity="info">
                    No se encontraron eventos de velocidad con los filtros aplicados.
                </Alert>
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Vehículo
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Fecha/Hora
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Velocidad
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Límite
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Rotativo
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Ubicación
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                    Severidad
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {speedEvents.map((event) => (
                                <tr
                                    key={event.id}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleEventClick(event)}
                                >
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        {event.vehicleName}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        {new Date(event.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        <strong>{event.speed} km/h</strong>
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        {event.speedLimit} km/h
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        <Chip
                                            label={event.rotativoActive ? 'Sí' : 'No'}
                                            color={event.rotativoActive ? 'success' : 'default'}
                                            size="small"
                                            icon={event.rotativoActive ? <CheckCircle /> : <Cancel />}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        {event.location}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                                        <Chip
                                            label={event.severity === 'critical' ? 'Crítico' :
                                                event.severity === 'warning' ? 'Advertencia' : 'Normal'}
                                            color={event.severity === 'critical' ? 'error' :
                                                event.severity === 'warning' ? 'warning' : 'success'}
                                            size="small"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
            )}
        </Box>
    );

    // Renderizar modal de detalle de evento
    const renderEventDetail = () => {
        if (!selectedEvent) return null;

        return (
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <Card sx={{ maxWidth: 500, width: '90%', maxHeight: '90%', overflow: 'auto' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">Detalle del Evento</Typography>
                            <IconButton onClick={() => setSelectedEvent(null)}>
                                <Cancel />
                            </IconButton>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Vehículo
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {selectedEvent.vehicleName}
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Fecha/Hora
                                </Typography>
                                <Typography variant="body1">
                                    {new Date(selectedEvent.timestamp).toLocaleString()}
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Velocidad Registrada
                                </Typography>
                                <Typography variant="body1" fontWeight="bold" color="error.main">
                                    {selectedEvent.speed} km/h
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Límite de la Vía
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.speedLimit} km/h
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Estado del Rotativo
                                </Typography>
                                <Chip
                                    label={selectedEvent.rotativoActive ? 'Activo' : 'Inactivo'}
                                    color={selectedEvent.rotativoActive ? 'success' : 'default'}
                                    size="small"
                                    icon={selectedEvent.rotativoActive ? <CheckCircle /> : <Cancel />}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Tipo de Vía
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.roadType}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    Ubicación
                                </Typography>
                                <Typography variant="body1">
                                    {selectedEvent.location}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        );
    };

    if (loading && !speedMetrics) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando datos de velocidad...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={loadSpeedData}>
                        Reintentar
                    </Button>
                }>
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {renderFilters()}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab icon={<Map />} label="Mapa de Calor" />
                    <Tab icon={<Assessment />} label="Métricas" />
                    <Tab icon={<Speed />} label="Eventos" />
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {activeTab === 0 && renderHeatmap()}
                {activeTab === 1 && renderMetrics()}
                {activeTab === 2 && renderEventsTable()}
            </Box>

            {renderEventDetail()}
        </Box>
    );
};
