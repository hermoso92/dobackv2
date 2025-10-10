import {
    CenterFocusStrong,
    Layers,
    Refresh,
    TrendingUp,
    ZoomIn,
    ZoomOut
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
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
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CircleMarker,
    Tooltip as LeafletTooltip,
    MapContainer,
    Popup,
    TileLayer,
    useMap
} from 'react-leaflet';

// Configuración de iconos personalizados (no utilizado actualmente)
// const createCustomIcon = (color: string, type: 'vehicle' | 'speed' | 'critical' | 'warning' | 'normal') => {
//     // Implementación comentada para evitar warnings de linting
// };

// Tipos de datos
interface HeatmapPoint {
    id: string;
    lat: number;
    lng: number;
    intensity: number;
    timestamp: string;
    vehicleId: string;
    vehicleName: string;
    eventType: string;
    severity: 'normal' | 'warning' | 'critical';
    speed?: number;
    speedLimit?: number;
    rotativo?: boolean;
    roadType?: string;
    location: string;
}

interface HeatmapLayer {
    id: string;
    name: string;
    visible: boolean;
    color: string;
    opacity: number;
}

interface EnhancedHeatmapMapProps {
    data: HeatmapPoint[];
    loading?: boolean;
    error?: string;
    onPointClick?: (point: HeatmapPoint) => void;
    center?: [number, number];
    zoom?: number;
    height?: string;
}

// Componente para actualizar el mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// Función para obtener color basado en intensidad
const getIntensityColor = (intensity: number): string => {
    if (intensity >= 0.8) return '#d32f2f'; // Rojo oscuro - muy alta
    if (intensity >= 0.6) return '#f57c00'; // Naranja - alta
    if (intensity >= 0.4) return '#fbc02d'; // Amarillo - media
    if (intensity >= 0.2) return '#689f38'; // Verde - baja
    return '#388e3c'; // Verde oscuro - muy baja
};

// Función para obtener color basado en velocidad
const getSpeedColor = (speed: number, speedLimit: number): string => {
    const ratio = speed / speedLimit;
    if (ratio >= 1.5) return '#d32f2f'; // Rojo - exceso severo
    if (ratio >= 1.2) return '#f57c00'; // Naranja - exceso moderado
    if (ratio >= 1.0) return '#fbc02d'; // Amarillo - exceso leve
    return '#388e3c'; // Verde - dentro del límite
};

// Función para obtener color basado en severidad
const getSeverityColor = (severity: string): string => {
    switch (severity) {
        case 'critical': return '#d32f2f';
        case 'warning': return '#f57c00';
        case 'normal': return '#388e3c';
        default: return '#757575';
    }
};

export const EnhancedHeatmapMap: React.FC<EnhancedHeatmapMapProps> = ({
    data,
    loading = false,
    error,
    onPointClick,
    center = [40.4168, -3.7038],
    zoom = 11,
    height = '500px'
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);
    const [mapZoom, setMapZoom] = useState(zoom);

    // Estados de configuración
    const [radius, setRadius] = useState(15);
    const [opacity, setOpacity] = useState(0.7);
    const [showIntensity, setShowIntensity] = useState(true);
    const [showSpeed, setShowSpeed] = useState(false);
    const [showClusters, setShowClusters] = useState(true);
    const [selectedType, setSelectedType] = useState<'all' | 'speed' | 'critical' | 'warning' | 'normal'>('all');
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'with' | 'without'>('all');

    // Estados de capas
    const [layers, setLayers] = useState<HeatmapLayer[]>([
        { id: 'intensity', name: 'Intensidad', visible: true, color: '#ff0000', opacity: 0.7 },
        { id: 'speed', name: 'Velocidad', visible: false, color: '#ff6600', opacity: 0.6 },
        { id: 'severity', name: 'Severidad', visible: false, color: '#1976d2', opacity: 0.8 }
    ]);

    // Procesar datos del heatmap
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return { points: [], clusters: [] };

        // Filtrar por tipo
        let filteredPoints = data;
        if (selectedType !== 'all') {
            filteredPoints = data.filter(point => {
                switch (selectedType) {
                    case 'speed':
                        return point.speed && point.speedLimit && point.speed > point.speedLimit;
                    case 'critical':
                        return point.severity === 'critical';
                    case 'warning':
                        return point.severity === 'warning';
                    case 'normal':
                        return point.severity === 'normal';
                    default:
                        return true;
                }
            });
        }

        // Filtrar por rotativo
        if (rotativoFilter !== 'all') {
            filteredPoints = filteredPoints.filter(point => {
                if (rotativoFilter === 'with') return point.rotativo === true;
                if (rotativoFilter === 'without') return point.rotativo === false;
                return true;
            });
        }

        // Generar clusters para el heatmap
        const clusters: Array<{ lat: number; lng: number; intensity: number; count: number; points: HeatmapPoint[] }> = [];
        const clusterRadius = 0.005; // Radio del cluster en grados

        // Asegurar que filteredPoints sea un array
        const pointsArray = Array.isArray(filteredPoints) ? filteredPoints : (Array.isArray((filteredPoints as any)?.points) ? (filteredPoints as any).points : []);

        pointsArray.forEach((point: any) => {
            let addedToCluster = false;

            // Buscar cluster existente cercano
            for (const cluster of clusters) {
                const distance = Math.sqrt(
                    Math.pow(point.lat - cluster.lat, 2) +
                    Math.pow(point.lng - cluster.lng, 2)
                );

                if (distance < clusterRadius) {
                    cluster.points.push(point);
                    cluster.count++;
                    cluster.intensity = Math.min(cluster.count / 20, 1); // Normalizar intensidad
                    addedToCluster = true;
                    break;
                }
            }

            // Crear nuevo cluster si no se encontró uno cercano
            if (!addedToCluster) {
                clusters.push({
                    lat: point.lat,
                    lng: point.lng,
                    intensity: 1 / 20,
                    count: 1,
                    points: [point]
                });
            }
        });

        return {
            points: pointsArray,
            clusters
        };
    }, [data, selectedType, rotativoFilter]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const points = Array.isArray(processedData.points) ? processedData.points : [];
        const total = points.length;
        const critical = points.filter(p => p.severity === 'critical').length;
        const warning = points.filter(p => p.severity === 'warning').length;
        const normal = points.filter(p => p.severity === 'normal').length;
        const withRotativo = points.filter(p => p.rotativo).length;
        const withoutRotativo = points.filter(p => !p.rotativo).length;
        const speeding = points.filter(p => p.speed && p.speedLimit && p.speed > p.speedLimit).length;

        return {
            total,
            critical,
            warning,
            normal,
            withRotativo,
            withoutRotativo,
            speeding,
            clusters: Array.isArray(processedData.clusters) ? processedData.clusters.length : 0
        };
    }, [processedData]);

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

    // Controles de zoom
    const handleZoomIn = useCallback(() => {
        setMapZoom(prev => Math.min(prev + 1, 18));
    }, []);

    const handleZoomOut = useCallback(() => {
        setMapZoom(prev => Math.max(prev - 1, 1));
    }, []);

    const handleCenterMap = useCallback(() => {
        setMapCenter(center);
        setMapZoom(zoom);
    }, [center, zoom]);

    // Obtener color del punto basado en la capa activa
    const getPointColor = useCallback((point: HeatmapPoint) => {
        const intensityLayer = layers.find(l => l.id === 'intensity');
        const speedLayer = layers.find(l => l.id === 'speed');
        const severityLayer = layers.find(l => l.id === 'severity');

        if (speedLayer?.visible && point.speed && point.speedLimit) {
            return getSpeedColor(point.speed, point.speedLimit);
        }
        if (severityLayer?.visible) {
            return getSeverityColor(point.severity);
        }
        if (intensityLayer?.visible) {
            return getIntensityColor(point.intensity);
        }
        return getSeverityColor(point.severity);
    }, [layers]);

    if (error) {
        return (
            <Card sx={{ height }}>
                <CardContent>
                    <Box className="flex items-center justify-center h-full">
                        <Typography color="error">
                            Error cargando mapa: {error}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card sx={{ height }}>
                <CardContent>
                    <Box className="flex items-center justify-center h-full">
                        <Typography>Cargando mapa...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card sx={{ height }}>
            <CardContent className="p-0">
                {/* Header con controles */}
                <Box className="p-4 border-b border-gray-200">
                    <Box className="flex items-center justify-between mb-4">
                        <Typography variant="h6" className="font-bold flex items-center gap-2">
                            <TrendingUp />
                            Mapa de Calor Avanzado
                        </Typography>

                        <Box className="flex items-center gap-2">
                            <Tooltip title="Centrar Mapa">
                                <IconButton onClick={handleCenterMap} size="small">
                                    <CenterFocusStrong />
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Actualizar">
                                <IconButton size="small">
                                    <Refresh />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Filtros principales */}
                    <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Evento</InputLabel>
                            <Select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as any)}
                                label="Tipo de Evento"
                            >
                                <MenuItem value="all">Todos los Eventos</MenuItem>
                                <MenuItem value="speed">Excesos de Velocidad</MenuItem>
                                <MenuItem value="critical">Eventos Críticos</MenuItem>
                                <MenuItem value="warning">Advertencias</MenuItem>
                                <MenuItem value="normal">Normales</MenuItem>
                            </Select>
                        </FormControl>

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

                        <Box>
                            <Typography variant="body2" className="mb-1">
                                Radio: {radius}px
                            </Typography>
                            <Slider
                                value={radius}
                                onChange={(_, value) => setRadius(value as number)}
                                min={5}
                                max={30}
                                step={5}
                                size="small"
                            />
                        </Box>

                        <Box>
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
                        </Box>
                    </Box>

                    {/* Controles de visualización */}
                    <Box className="flex items-center gap-4 mb-4">
                        <Box className="flex items-center gap-2">
                            <Switch
                                checked={showIntensity}
                                onChange={(e) => setShowIntensity(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2">Mostrar Intensidad</Typography>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Switch
                                checked={showSpeed}
                                onChange={(e) => setShowSpeed(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2">Mostrar Velocidad</Typography>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Switch
                                checked={showClusters}
                                onChange={(e) => setShowClusters(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2">Mostrar Clusters</Typography>
                        </Box>
                    </Box>

                    {/* Estadísticas */}
                    <Box className="flex gap-2 mb-4">
                        <Chip
                            label={`${stats.total} eventos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.critical} críticos`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.warning} advertencias`}
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.speeding} excesos`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.clusters} clusters`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    </Box>

                    {/* Controles de capas */}
                    <Box className="flex gap-2">
                        <Typography variant="body2" className="flex items-center mr-2">
                            <Layers className="mr-1" />
                            Capas:
                        </Typography>
                        {layers.map((layer) => (
                            <Button
                                key={layer.id}
                                variant={layer.visible ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => handleLayerToggle(layer.id)}
                                sx={{
                                    backgroundColor: layer.visible ? layer.color : 'transparent',
                                    borderColor: layer.color,
                                    color: layer.visible ? 'white' : layer.color,
                                    minWidth: 'auto',
                                    px: 2
                                }}
                            >
                                {layer.name}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* Mapa */}
                <Box sx={{ height: 'calc(100% - 200px)', position: 'relative' }}>
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        className="h-full w-full"
                        style={{ height: '100%', width: '100%' }}
                        ref={mapRef}
                    >
                        <TileLayer
                            url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                            attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                        />

                        <MapUpdater center={mapCenter} zoom={mapZoom} />

                        {/* Clusters del heatmap */}
                        {showClusters && Array.isArray(processedData.clusters) && processedData.clusters.map((cluster, index) => (
                            <CircleMarker
                                key={`cluster-${index}`}
                                center={[cluster.lat, cluster.lng]}
                                radius={Math.max(radius, cluster.count * 2)}
                                pathOptions={{
                                    color: getIntensityColor(cluster.intensity),
                                    fillColor: getIntensityColor(cluster.intensity),
                                    fillOpacity: opacity,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1 font-bold">
                                            Cluster de Eventos
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Eventos:</strong> {cluster.count}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Intensidad:</strong> {Math.round(cluster.intensity * 100)}%
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Ubicación:</strong> {cluster.lat.toFixed(4)}, {cluster.lng.toFixed(4)}
                                        </Typography>
                                    </Box>
                                </Popup>
                                <LeafletTooltip>
                                    {cluster.count} eventos - Intensidad: {Math.round(cluster.intensity * 100)}%
                                </LeafletTooltip>
                            </CircleMarker>
                        ))}

                        {/* Puntos individuales */}
                        {processedData.points.map((point: HeatmapPoint, index: number) => (
                            <CircleMarker
                                key={`point-${point.id}-${index}`}
                                center={[point.lat, point.lng]}
                                radius={radius * 0.6}
                                pathOptions={{
                                    color: getPointColor(point),
                                    fillColor: getPointColor(point),
                                    fillOpacity: opacity * 0.8,
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
                                            <strong>Severidad:</strong> {point.severity}
                                        </Typography>
                                        {point.speed && (
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Velocidad:</strong> {point.speed} km/h
                                                {point.speedLimit && ` (Límite: ${point.speedLimit} km/h)`}
                                            </Typography>
                                        )}
                                        {point.rotativo !== undefined && (
                                            <Typography variant="body2" className="mb-1">
                                                <strong>Rotativo:</strong> {point.rotativo ? 'Encendido' : 'Apagado'}
                                            </Typography>
                                        )}
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Intensidad:</strong> {Math.round(point.intensity * 100)}%
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Ubicación:</strong> {point.location}
                                        </Typography>
                                    </Box>
                                </Popup>
                                <LeafletTooltip>
                                    {point.vehicleName} - {point.eventType} - {point.severity}
                                </LeafletTooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>

                    {/* Controles de zoom */}
                    <Box sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                    }}>
                        <Tooltip title="Zoom In">
                            <IconButton
                                size="small"
                                sx={{ bgcolor: 'white', boxShadow: 1 }}
                                onClick={handleZoomIn}
                            >
                                <ZoomIn />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Zoom Out">
                            <IconButton
                                size="small"
                                sx={{ bgcolor: 'white', boxShadow: 1 }}
                                onClick={handleZoomOut}
                            >
                                <ZoomOut />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Leyenda */}
                    <Box sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 1000
                    }}>
                        <Typography variant="subtitle2" className="mb-2 font-bold">
                            Leyenda
                        </Typography>

                        <Box className="flex flex-col gap-1">
                            <Box className="flex items-center gap-2">
                                <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getIntensityColor(0.2) }} />
                                <Typography variant="caption">Baja Intensidad</Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                                <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getIntensityColor(0.6) }} />
                                <Typography variant="caption">Media Intensidad</Typography>
                            </Box>
                            <Box className="flex items-center gap-2">
                                <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getIntensityColor(1.0) }} />
                                <Typography variant="caption">Alta Intensidad</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};
