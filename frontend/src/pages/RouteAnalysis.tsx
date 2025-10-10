/**
 * 🛣️ ANÁLISIS DE RUTAS DE EMERGENCIA - BOMBEROS MADRID
 * Análisis de rutas frecuentes, cuellos de botella y optimización
 */

import {
    GetApp as ExportIcon
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
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

// Tipos
interface RouteData {
    id: string;
    name: string;
    startPoint: [number, number];
    endPoint: [number, number];
    waypoints: [number, number][];
    frequency: number;
    averageTime: number;
    averageSpeed: number;
    lastUsed: string;
    efficiency: number; // 0-100%
}

interface BottleneckArea {
    id: string;
    name: string;
    location: [number, number];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    delayMinutes: number;
    frequency: number;
    suggestions: string[];
}

interface ResponseAnalysis {
    vehicleId: string;
    vehicleName: string;
    averageResponseTime: number;
    fastestTime: number;
    slowestTime: number;
    efficiency: number;
    improvements: string[];
}

interface OptimizationSuggestion {
    id: string;
    type: 'ROUTE' | 'SCHEDULING' | 'VEHICLE' | 'GENERAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    impact: number; // % de mejora esperada
    effort: 'LOW' | 'MEDIUM' | 'HIGH'; // Esfuerzo de implementación
}

const RouteAnalysis: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
    const [selectedRoute, setSelectedRoute] = useState<string>('all');

    // Datos simulados (en producción vendrían del backend)
    const [routes, setRoutes] = useState<RouteData[]>([
        {
            id: 'route-1',
            name: 'Estación Central → Zona Centro',
            startPoint: [40.4168, -3.7038],
            endPoint: [40.4200, -3.7100],
            waypoints: [
                [40.4180, -3.7050],
                [40.4190, -3.7080]
            ],
            frequency: 45,
            averageTime: 8.5,
            averageSpeed: 35.2,
            lastUsed: '2025-01-15 14:30:00',
            efficiency: 85
        },
        {
            id: 'route-2',
            name: 'Estación Norte → Zona Industrial',
            startPoint: [40.4250, -3.6800],
            endPoint: [40.4300, -3.6750],
            waypoints: [
                [40.4270, -3.6780]
            ],
            frequency: 32,
            averageTime: 12.3,
            averageSpeed: 28.7,
            lastUsed: '2025-01-15 13:45:00',
            efficiency: 72
        },
        {
            id: 'route-3',
            name: 'Estación Sur → Zona Residencial',
            startPoint: [40.4100, -3.7200],
            endPoint: [40.4050, -3.7300],
            waypoints: [
                [40.4075, -3.7250],
                [40.4060, -3.7280]
            ],
            frequency: 28,
            averageTime: 15.8,
            averageSpeed: 22.1,
            lastUsed: '2025-01-15 12:15:00',
            efficiency: 68
        }
    ]);

    const [bottlenecks, setBottlenecks] = useState<BottleneckArea[]>([
        {
            id: 'bottleneck-1',
            name: 'Intersección Gran Vía - Alcalá',
            location: [40.4180, -3.7050],
            severity: 'HIGH',
            delayMinutes: 4.2,
            frequency: 38,
            suggestions: [
                'Coordinación con semáforos inteligentes',
                'Ruta alternativa por calles paralelas',
                'Horarios de mayor congestión: 8:00-10:00, 18:00-20:00'
            ]
        },
        {
            id: 'bottleneck-2',
            name: 'Acceso M-30 Norte',
            location: [40.4280, -3.6780],
            severity: 'MEDIUM',
            delayMinutes: 2.8,
            frequency: 25,
            suggestions: [
                'Uso de carril BUS-VAO',
                'Coordinación con DGT para paso prioritario'
            ]
        }
    ]);

    const [responseAnalysis, setResponseAnalysis] = useState<ResponseAnalysis[]>([
        {
            vehicleId: 'DOBACK022',
            vehicleName: 'Bomba Escalera 1',
            averageResponseTime: 6.8,
            fastestTime: 4.2,
            slowestTime: 12.1,
            efficiency: 88,
            improvements: ['Optimizar ruta de salida', 'Mejorar comunicación con central']
        },
        {
            vehicleId: 'DOBACK023',
            vehicleName: 'Bomba Escalera 2',
            averageResponseTime: 8.2,
            fastestTime: 5.1,
            slowestTime: 15.3,
            efficiency: 75,
            improvements: ['Revisar ubicación de estación', 'Capacitación adicional del conductor']
        }
    ]);

    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
        {
            id: 'suggestion-1',
            type: 'ROUTE',
            priority: 'HIGH',
            title: 'Optimizar Ruta Centro',
            description: 'Implementar algoritmo de rutas dinámicas para zona centro',
            impact: 15,
            effort: 'MEDIUM'
        },
        {
            id: 'suggestion-2',
            type: 'VEHICLE',
            priority: 'MEDIUM',
            title: 'Reubicar Bomba Escalera 2',
            description: 'Mover vehículo a posición más estratégica',
            impact: 12,
            effort: 'HIGH'
        }
    ]);

    // Configuración del mapa (Madrid)
    const mapCenter: [number, number] = [40.4168, -3.7038];
    const mapZoom = 11;

    // Handlers
    const handleTimeRangeChange = (event: any) => {
        setTimeRange(event.target.value);
    };

    const handleRouteChange = (event: any) => {
        setSelectedRoute(event.target.value);
    };

    const handleExportReport = () => {
        navigate('/reports');
    };

    // Obtener color según severidad
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return theme.palette.error.main;
            case 'HIGH': return theme.palette.warning.main;
            case 'MEDIUM': return theme.palette.info.main;
            case 'LOW': return theme.palette.success.main;
            default: return theme.palette.grey[500];
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    // Simular carga de datos
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Simular delay de API
                await new Promise(resolve => setTimeout(resolve, 1000));
                setLoading(false);
            } catch (err) {
                setError('Error cargando datos de análisis de rutas');
                setLoading(false);
            }
        };

        loadData();
    }, [timeRange]);

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            🛣️ Análisis de Rutas de Emergencia
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Optimización de rutas y tiempos de respuesta - Bomberos Madrid
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Período</InputLabel>
                            <Select value={timeRange} onChange={handleTimeRangeChange} label="Período">
                                <MenuItem value="week">Última semana</MenuItem>
                                <MenuItem value="month">Último mes</MenuItem>
                                <MenuItem value="quarter">Último trimestre</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            startIcon={<ExportIcon />}
                            onClick={handleExportReport}
                        >
                            Exportar Análisis
                        </Button>
                    </Stack>
                </Stack>
            </Box>

            {/* Estadísticas Generales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary" gutterBottom>
                                Rutas Analizadas
                            </Typography>
                            <Typography variant="h4" component="div">
                                {routes.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary" gutterBottom>
                                Tiempo Promedio
                            </Typography>
                            <Typography variant="h4" component="div" color="primary.main">
                                {(routes.reduce((acc, route) => acc + route.averageTime, 0) / routes.length).toFixed(1)}min
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary" gutterBottom>
                                Cuellos de Botella
                            </Typography>
                            <Typography variant="h4" component="div" color="warning.main">
                                {bottlenecks.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography color="text.secondary" gutterBottom>
                                Eficiencia Promedio
                            </Typography>
                            <Typography variant="h4" component="div" color="success.main">
                                {(routes.reduce((acc, route) => acc + route.efficiency, 0) / routes.length).toFixed(0)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Mapa de Rutas */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🗺️ Mapa de Rutas Frecuentes
                            </Typography>

                            <Box sx={{ height: 500, width: '100%' }}>
                                <MapContainer
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                                        attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                                    />

                                    {/* Rutas */}
                                    {routes.map((route) => {
                                        const allPoints = [route.startPoint, ...route.waypoints, route.endPoint];

                                        return (
                                            <Polyline
                                                key={route.id}
                                                positions={allPoints}
                                                color={route.efficiency > 80 ? '#4caf50' : route.efficiency > 60 ? '#ff9800' : '#f44336'}
                                                weight={Math.max(2, route.frequency / 10)}
                                                opacity={0.8}
                                            >
                                                <Popup>
                                                    <Box sx={{ minWidth: 200 }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            {route.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Frecuencia: {route.frequency} veces
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Tiempo promedio: {route.averageTime} min
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Eficiencia: {route.efficiency}%
                                                        </Typography>
                                                    </Box>
                                                </Popup>
                                            </Polyline>
                                        );
                                    })}

                                    {/* Cuellos de botella */}
                                    {bottlenecks.map((bottleneck) => (
                                        <Marker
                                            key={bottleneck.id}
                                            position={bottleneck.location}
                                            icon={L.divIcon({
                                                html: `
                                                    <div style="
                                                        background-color: ${getSeverityColor(bottleneck.severity)};
                                                        width: 20px;
                                                        height: 20px;
                                                        border-radius: 50%;
                                                        border: 2px solid white;
                                                        display: flex;
                                                        align-items: center;
                                                        justify-content: center;
                                                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                                    ">
                                                        <span style="color: white; font-size: 10px; font-weight: bold;">⚠</span>
                                                    </div>
                                                `,
                                                className: 'custom-bottleneck-icon',
                                                iconSize: [20, 20],
                                                iconAnchor: [10, 10]
                                            })}
                                        >
                                            <Popup>
                                                <Box sx={{ minWidth: 200 }}>
                                                    <Typography variant="h6" gutterBottom>
                                                        {bottleneck.name}
                                                    </Typography>
                                                    <Chip
                                                        label={bottleneck.severity}
                                                        size="small"
                                                        color={getPriorityColor(bottleneck.severity)}
                                                        sx={{ mb: 1 }}
                                                    />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Retraso promedio: {bottleneck.delayMinutes} min
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Frecuencia: {bottleneck.frequency} veces
                                                    </Typography>
                                                </Box>
                                            </Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Panel de Información */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Cuellos de Botella */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    ⚠️ Cuellos de Botella
                                </Typography>
                                <Stack spacing={2}>
                                    {bottlenecks.map((bottleneck) => (
                                        <Box key={bottleneck.id}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {bottleneck.name}
                                                </Typography>
                                                <Chip
                                                    label={`+${bottleneck.delayMinutes}min`}
                                                    size="small"
                                                    color={getPriorityColor(bottleneck.severity)}
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {bottleneck.frequency} incidencias
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Sugerencias de Optimización */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    💡 Sugerencias de Optimización
                                </Typography>
                                <Stack spacing={2}>
                                    {suggestions.map((suggestion) => (
                                        <Box key={suggestion.id}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {suggestion.title}
                                                </Typography>
                                                <Chip
                                                    label={`+${suggestion.impact}%`}
                                                    size="small"
                                                    color={getPriorityColor(suggestion.priority)}
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {suggestion.description}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>

            {/* Análisis de Tiempos de Respuesta */}
            <Card sx={{ mt: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        ⏱️ Análisis de Tiempos de Respuesta
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell align="center">Tiempo Promedio</TableCell>
                                    <TableCell align="center">Más Rápido</TableCell>
                                    <TableCell align="center">Más Lento</TableCell>
                                    <TableCell align="center">Eficiencia</TableCell>
                                    <TableCell align="center">Mejoras Sugeridas</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {responseAnalysis.map((analysis) => (
                                    <TableRow key={analysis.vehicleId}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {analysis.vehicleName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {analysis.vehicleId}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2">
                                                {analysis.averageResponseTime.toFixed(1)} min
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" color="success.main">
                                                {analysis.fastestTime.toFixed(1)} min
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Typography variant="body2" color="error.main">
                                                {analysis.slowestTime.toFixed(1)} min
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={`${analysis.efficiency}%`}
                                                size="small"
                                                color={analysis.efficiency > 80 ? 'success' : analysis.efficiency > 60 ? 'warning' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={analysis.improvements.join(', ')}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {analysis.improvements.length} sugerencias
                                                </Typography>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Container>
    );
};

export default RouteAnalysis;
