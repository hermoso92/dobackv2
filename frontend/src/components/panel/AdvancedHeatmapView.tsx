import {
import { logger } from '../../utils/logger';
    DirectionsCar,
    Download,
    FilterList,
    Layers
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Switch,
    Tooltip,
    Typography
} from '@mui/material';
import L from 'leaflet';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CircleMarker,
    Tooltip as LeafletTooltip,
    MapContainer,
    Marker,
    Polygon,
    Polyline,
    Popup,
    TileLayer,
    useMap
} from 'react-leaflet';
// import { VehicleSelector } from './VehicleSelector';

interface AdvancedHeatmapViewProps {
    data: {
        points: HeatmapPoint[];
        routes: any[];
        geofences: any[];
    };
    loading?: boolean;
    error?: string;
    onPointClick?: (point: any) => void;
    onExportPDF?: () => void;
    vehicles?: any[];
    selectedVehicles?: string[];
    onVehicleSelectionChange?: (vehicles: string[]) => void;
}

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
    timestamp: string;
    vehicleId: string;
    vehicleName?: string;
    eventType: string;
    severity?: string;
    speed?: number;
    rotativo?: boolean;
    street?: string;
}

interface HeatmapLayer {
    id: string;
    name: string;
    visible: boolean;
    color: string;
    data: HeatmapPoint[];
}

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
};

// Función para crear iconos de vehículos
const createVehicleIcon = (color: string, status: string) => {
    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: white;
            font-weight: bold;
        ">
            🚒
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-vehicle-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
};

export const AdvancedHeatmapView: React.FC<AdvancedHeatmapViewProps> = ({
    data,
    loading = false,
    error,
    onPointClick,
    onExportPDF,
    vehicles = [],
    selectedVehicles = [],
    onVehicleSelectionChange
}) => {
    const { t } = useTranslation();

    // Estados del mapa
    const [mapCenter] = useState<[number, number]>([40.4168, -3.7038]); // Madrid
    const [mapZoom] = useState(11);

    // Estados de configuración
    const [radius, setRadius] = useState(25);
    const [opacity, setOpacity] = useState(0.7);
    const [showIntensity, setShowIntensity] = useState(true);
    const [selectedType, setSelectedType] = useState<'speeding' | 'critical' | 'stability' | 'all'>('all');
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'with' | 'without'>('all');
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'custom'>('week');

    // Estados de capas
    const [layers, setLayers] = useState<HeatmapLayer[]>([
        { id: 'vehicles', name: 'Vehículos', visible: true, color: '#4caf50', data: [] },
        { id: 'routes', name: 'Rutas', visible: true, color: '#0066cc', data: [] },
        { id: 'heatmap', name: 'Mapa de Calor', visible: true, color: '#ff0000', data: [] },
        { id: 'speed', name: 'Calor por Velocidad', visible: false, color: '#ff6600', data: [] },
        { id: 'geofences', name: 'Geocercas', visible: true, color: '#1976d2', data: [] }
    ]);

    // Estados de filtros avanzados
    const [showFilters, setShowFilters] = useState(false);
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);

    // Procesar datos del heatmap
    const processedData = useMemo(() => {
        logger.info('🔍 Procesando datos del heatmap:', { data, vehicles });

        if (!data || !data.points) {
            logger.info('❌ No hay datos o puntos');
            return { points: [], routes: [], geofences: [] };
        }

        logger.info('📊 Puntos originales:', data.points.length);

        const points: HeatmapPoint[] = data.points.map(point => ({
            ...point,
            vehicleName: vehicles.find(v => v.id === point.vehicleId)?.name || point.vehicleId,
            street: point.street || 'Dirección no disponible'
        }));

        logger.info('🚗 Puntos procesados:', points.length);

        // Filtrar por vehículos seleccionados
        const filteredPoints = selectedVehicles.length > 0
            ? points.filter(p => selectedVehicles.includes(p.vehicleId))
            : points;

        logger.info('🎯 Puntos filtrados por vehículos:', filteredPoints.length);

        // Filtrar por tipo de evento
        const typeFilteredPoints = selectedType === 'all'
            ? filteredPoints
            : filteredPoints.filter(p => {
                switch (selectedType) {
                    case 'speeding':
                        return p.eventType.includes('speeding') || p.eventType.includes('velocidad') || p.eventType.includes('Velocidad');
                    case 'critical':
                        return p.severity === 'critical' || p.severity === 'danger';
                    case 'stability':
                        return p.eventType.includes('stability') || p.eventType.includes('estabilidad');
                    default:
                        return true;
                }
            });

        logger.info('📈 Puntos filtrados por tipo:', typeFilteredPoints.length, 'tipo:', selectedType);

        // Filtrar por rotativo
        const rotativoFilteredPoints = rotativoFilter === 'all'
            ? typeFilteredPoints
            : typeFilteredPoints.filter(p => {
                if (rotativoFilter === 'with') return p.rotativo === true;
                if (rotativoFilter === 'without') return p.rotativo === false;
                return true;
            });

        logger.info('🔄 Puntos filtrados por rotativo:', rotativoFilteredPoints.length);

        // Generar rutas por vehículo
        const routes = vehicles.map(vehicle => {
            const vehiclePoints = rotativoFilteredPoints
                .filter(p => p.vehicleId === vehicle.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            return {
                vehicleId: vehicle.id,
                vehicleName: vehicle.name,
                points: vehiclePoints.map(p => [p.lat, p.lng] as [number, number]),
                color: vehicle.id === selectedVehicles[0] ? '#ff0000' : '#0066cc'
            };
        }).filter(route => route.points.length > 1);

        logger.info('🛣️ Rutas generadas:', routes.length);

        const result = {
            points: rotativoFilteredPoints,
            routes,
            geofences: [] // TODO: Implementar geocercas
        };

        logger.info('✅ Resultado final:', result);
        return result;
    }, [data, vehicles, selectedVehicles, selectedType, rotativoFilter]);

    // Función para obtener color basado en intensidad
    const getIntensityColor = useCallback((intensity: number) => {
        if (intensity >= 0.8) return '#ff0000'; // Rojo - muy alta
        if (intensity >= 0.6) return '#ff6600'; // Naranja - alta
        if (intensity >= 0.4) return '#ffcc00'; // Amarillo - media
        if (intensity >= 0.2) return '#66ff00'; // Verde claro - baja
        return '#00ff00'; // Verde - muy baja
    }, []);

    // Función para obtener color basado en velocidad
    const getSpeedColor = useCallback((speed: number) => {
        if (speed >= 80) return '#ff0000'; // Rojo - muy rápido
        if (speed >= 60) return '#ff6600'; // Naranja - rápido
        if (speed >= 40) return '#ffcc00'; // Amarillo - moderado
        if (speed >= 20) return '#66ff00'; // Verde claro - lento
        return '#00ff00'; // Verde - muy lento
    }, []);

    // Función para obtener etiqueta de intensidad
    const getIntensityLabel = useCallback((intensity: number) => {
        if (intensity >= 0.8) return 'Muy Alta';
        if (intensity >= 0.6) return 'Alta';
        if (intensity >= 0.4) return 'Media';
        if (intensity >= 0.2) return 'Baja';
        return 'Muy Baja';
    }, []);

    // Manejar click en punto
    const handlePointClick = useCallback((point: HeatmapPoint) => {
        if (onPointClick) {
            onPointClick(point);
        }
    }, [onPointClick]);

    // Manejar cambio de capa
    const handleLayerToggle = useCallback((layerId: string) => {
        setLayers(prev => prev.map(layer =>
            layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ));
    }, []);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const points = processedData.points;
        const totalPoints = points.length;
        const avgIntensity = totalPoints > 0
            ? points.reduce((sum, p) => sum + p.intensity, 0) / totalPoints
            : 0;
        const vehiclesCount = new Set(points.map(p => p.vehicleId)).size;
        const withRotativo = points.filter(p => p.rotativo).length;
        const withoutRotativo = points.filter(p => !p.rotativo).length;

        return {
            totalPoints,
            avgIntensity,
            vehiclesCount,
            withRotativo,
            withoutRotativo,
            routesCount: processedData.routes.length
        };
    }, [processedData]);

    if (error) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Alert severity="error">
                        Error cargando datos del mapa de calor: {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Box className="flex items-center justify-center h-64">
                        <Typography>Cargando mapa de calor...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="p-0">
                {/* Header con controles */}
                <Box className="p-4 border-b border-gray-200">
                    <Box className="flex items-center justify-between mb-4">
                        <Typography variant="h6" className="font-bold">
                            🗺️ Mapa de Calor Interactivo
                        </Typography>

                        <Box className="flex items-center gap-2">
                            <Tooltip title="Seleccionar Vehículos">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DirectionsCar />}
                                    onClick={() => setShowVehicleSelector(true)}
                                >
                                    Vehículos ({selectedVehicles.length})
                                </Button>
                            </Tooltip>

                            <Tooltip title="Mostrar/Ocultar Filtros">
                                <IconButton
                                    onClick={() => setShowFilters(!showFilters)}
                                    color={showFilters ? 'primary' : 'default'}
                                >
                                    <FilterList />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Exportar PDF">
                                <IconButton onClick={onExportPDF} color="primary">
                                    <Download />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Filtros principales */}
                    <Grid container spacing={2} className="mb-4">
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo de Evento</InputLabel>
                                <Select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as any)}
                                    label="Tipo de Evento"
                                >
                                    <MenuItem value="all">Todos los Eventos</MenuItem>
                                    <MenuItem value="speeding">Excesos de Velocidad</MenuItem>
                                    <MenuItem value="critical">Eventos Críticos</MenuItem>
                                    <MenuItem value="stability">Estabilidad</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Rotativo</InputLabel>
                                <Select
                                    value={rotativoFilter}
                                    onChange={(e) => setRotativoFilter(e.target.value as any)}
                                    label="Rotativo"
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="with">Con Rotativo</MenuItem>
                                    <MenuItem value="without">Sin Rotativo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Período</InputLabel>
                                <Select
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value as any)}
                                    label="Período"
                                >
                                    <MenuItem value="day">Último Día</MenuItem>
                                    <MenuItem value="week">Última Semana</MenuItem>
                                    <MenuItem value="month">Último Mes</MenuItem>
                                    <MenuItem value="custom">Personalizado</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <Typography variant="body2" className="mb-1">
                                Radio: {radius}px
                            </Typography>
                            <Slider
                                value={radius}
                                onChange={(_, value) => setRadius(value as number)}
                                min={10}
                                max={50}
                                step={5}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <Typography variant="body2" className="mb-1">
                                Opacidad: {Math.round(opacity * 100)}%
                            </Typography>
                            <Slider
                                value={opacity}
                                onChange={(_, value) => setOpacity(value as number)}
                                min={0.1}
                                max={1}
                                step={0.1}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={2}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showIntensity}
                                        onChange={(e) => setShowIntensity(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Mostrar Intensidad"
                            />
                        </Grid>
                    </Grid>

                    {/* Estadísticas */}
                    <Box className="flex gap-2 mb-4">
                        <Chip
                            label={`${stats.totalPoints} eventos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.vehiclesCount} vehículos`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.withRotativo} con rotativo`}
                            size="small"
                            color="success"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.withoutRotativo} sin rotativo`}
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.routesCount} rutas`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    </Box>

                    {/* Leyenda de colores compacta */}
                    <Box className="flex flex-col gap-2 mb-4">
                        {/* Intensidad - Una línea horizontal */}
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" className="text-gray-600 font-medium min-w-[80px]">
                                Intensidad:
                            </Typography>
                            <Box className="flex items-center gap-2">
                                {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
                                    <React.Fragment key={intensity}>
                                        <Box
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getIntensityColor(intensity) }}
                                        />
                                        <Typography variant="caption" className="text-xs">
                                            {getIntensityLabel(intensity)}
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Box>
                        </Box>

                        {/* Velocidad - Una línea horizontal */}
                        <Box className="flex items-center gap-2">
                            <Typography variant="body2" className="text-gray-600 font-medium min-w-[80px]">
                                Velocidad:
                            </Typography>
                            <Box className="flex items-center gap-2">
                                {[20, 40, 60, 80, 100].map((speed) => (
                                    <React.Fragment key={speed}>
                                        <Box
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: getSpeedColor(speed) }}
                                        />
                                        <Typography variant="caption" className="text-xs">
                                            {speed} km/h
                                        </Typography>
                                    </React.Fragment>
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Controles de capas */}
                <Box className="p-4 border-b border-gray-200">
                    <Typography variant="subtitle2" className="mb-2 font-semibold">
                        Capas del Mapa
                    </Typography>
                    <Box className="flex gap-2">
                        {layers.map((layer) => (
                            <Button
                                key={layer.id}
                                variant={layer.visible ? 'contained' : 'outlined'}
                                size="small"
                                startIcon={<Layers />}
                                onClick={() => handleLayerToggle(layer.id)}
                                sx={{
                                    backgroundColor: layer.visible ? layer.color : 'transparent',
                                    borderColor: layer.color,
                                    color: layer.visible ? 'white' : layer.color,
                                    '&:hover': {
                                        backgroundColor: layer.visible ? layer.color : layer.color + '20'
                                    }
                                }}
                            >
                                {layer.name}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Mapa */}
                <Box className="h-96 w-full">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        className="h-full w-full"
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                            attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                        />

                        <MapUpdater center={mapCenter} zoom={mapZoom} />

                        {/* Vehículos */}
                        {layers.find(l => l.id === 'vehicles')?.visible && vehicles.map((vehicle) => {
                            if (!vehicle.gpsData || !vehicle.gpsData.latitude || !vehicle.gpsData.longitude) {
                                return null;
                            }

                            const statusColors = {
                                AVAILABLE: '#4caf50',
                                ON_EMERGENCY: '#ff9800',
                                OFFLINE: '#f44336',
                                MAINTENANCE: '#9c27b0',
                                BUSY: '#ff9800'
                            };

                            const color = statusColors[vehicle.status?.status as keyof typeof statusColors] || '#4caf50';
                            const icon = createVehicleIcon(color, vehicle.status?.status || 'AVAILABLE');

                            return (
                                <Marker
                                    key={vehicle.id}
                                    position={[vehicle.gpsData.latitude, vehicle.gpsData.longitude]}
                                    icon={icon}
                                >
                                    <Popup>
                                        <Box className="p-2">
                                            <Typography variant="subtitle2" className="mb-1 font-bold">
                                                {vehicle.name}
                                            </Typography>
                                            <Typography variant="body2" className="mb-1">
                                                <strong>ID:</strong> {vehicle.id}
                                            </Typography>
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Estado:</strong> {vehicle.status?.status || 'Desconocido'}
                                            </Typography>
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Última actualización:</strong> {new Date(vehicle.status?.lastUpdate || Date.now()).toLocaleString()}
                                            </Typography>
                                            {vehicle.gpsData.speed && (
                                                <Typography variant="body2" className="mb-1">
                                                    <strong>Velocidad:</strong> {vehicle.gpsData.speed} km/h
                                                </Typography>
                                            )}
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Rutas */}
                        {layers.find(l => l.id === 'routes')?.visible && processedData.routes.map((route, index) => (
                            <Polyline
                                key={`route-${route.vehicleId}-${index}`}
                                positions={route.points}
                                color={route.color}
                                weight={3}
                                opacity={0.8}
                                smoothFactor={2}
                            >
                                <LeafletTooltip>
                                    Ruta de {route.vehicleName} ({route.points.length} puntos)
                                </LeafletTooltip>
                            </Polyline>
                        ))}

                        {/* Puntos del mapa de calor */}
                        {layers.find(l => l.id === 'heatmap')?.visible && processedData.points.map((point, index) => (
                            <CircleMarker
                                key={`heatmap-${index}`}
                                center={[point.lat, point.lng]}
                                radius={radius}
                                pathOptions={{
                                    color: getIntensityColor(point.intensity),
                                    fillColor: getIntensityColor(point.intensity),
                                    fillOpacity: opacity,
                                    weight: 2
                                }}
                                eventHandlers={{
                                    click: () => handlePointClick(point)
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1 font-bold">
                                            {point.eventType}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Vehículo:</strong> {point.vehicleName}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Fecha:</strong> {new Date(point.timestamp).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Intensidad:</strong> {getIntensityLabel(point.intensity)}
                                        </Typography>
                                        {point.speed && (
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Velocidad:</strong> {point.speed} km/h
                                            </Typography>
                                        )}
                                        {point.rotativo !== undefined && (
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Rotativo:</strong> {point.rotativo ? 'Encendido' : 'Apagado'}
                                            </Typography>
                                        )}
                                        <Typography variant="body2">
                                            <strong>Dirección:</strong> {point.street}
                                        </Typography>
                                    </Box>
                                </Popup>
                            </CircleMarker>
                        ))}

                        {/* Puntos por velocidad */}
                        {layers.find(l => l.id === 'speed')?.visible && processedData.points
                            .filter(p => p.speed && p.speed > 0)
                            .map((point, index) => (
                                <CircleMarker
                                    key={`speed-${index}`}
                                    center={[point.lat, point.lng]}
                                    radius={radius * 0.8}
                                    pathOptions={{
                                        color: getSpeedColor(point.speed!),
                                        fillColor: getSpeedColor(point.speed!),
                                        fillOpacity: opacity * 0.7,
                                        weight: 2
                                    }}
                                    eventHandlers={{
                                        click: () => handlePointClick(point)
                                    }}
                                >
                                    <Popup>
                                        <Box className="p-2">
                                            <Typography variant="subtitle2" className="mb-1 font-bold">
                                                Velocidad: {point.speed} km/h
                                            </Typography>
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Vehículo:</strong> {point.vehicleName}
                                            </Typography>
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Fecha:</strong> {new Date(point.timestamp).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </CircleMarker>
                            ))}

                        {/* Geocercas */}
                        {layers.find(l => l.id === 'geofences')?.visible && data.geofences?.map((geofence, index) => (
                            <Polygon
                                key={`geofence-${geofence.id || index}`}
                                positions={geofence.coordinates}
                                pathOptions={{
                                    color: geofence.color || '#1976d2',
                                    fillColor: geofence.color || '#1976d2',
                                    fillOpacity: 0.2,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1 font-bold">
                                            {geofence.name}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Tipo:</strong> {geofence.type}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>ID:</strong> {geofence.id}
                                        </Typography>
                                    </Box>
                                </Popup>
                            </Polygon>
                        ))}
                    </MapContainer>
                </Box>

                {/* Selector de vehículos - Temporalmente deshabilitado */}
                {/* <VehicleSelector
                    vehicles={vehicles}
                    selectedVehicles={selectedVehicles}
                    onSelectionChange={onVehicleSelectionChange || (() => { })}
                    open={showVehicleSelector}
                    onClose={() => setShowVehicleSelector(false)}
                /> */}
            </CardContent>
        </Card>
    );
};
