import {
    Analytics,
    CenterFocusStrong,
    Refresh,
    ZoomIn,
    ZoomOut
} from '@mui/icons-material';
import {
    Box,
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
import { SpeedViolation } from '../../types/deviceControl';

// Configuración de iconos personalizados para violaciones de velocidad (no utilizado actualmente)
// const createSpeedIcon = (violationType: string, rotativoOn: boolean) => {
//     // Implementación comentada para evitar warnings de linting
// };

// Tipos de datos
interface AdvancedSpeedAnalysisMapProps {
    violations: SpeedViolation[];
    loading?: boolean;
    error?: string;
    onViolationClick?: (violation: SpeedViolation) => void;
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

// Función para obtener color basado en el tipo de violación
const getViolationColor = (violationType: string): string => {
    switch (violationType) {
        case 'grave': return '#d32f2f';
        case 'moderada': return '#f57c00';
        case 'leve': return '#fbc02d';
        default: return '#757575';
    }
};

// Función para obtener color basado en el exceso de velocidad
const getExcessColor = (speed: number, speedLimit: number): string => {
    const excess = speed - speedLimit;
    if (excess >= 20) return '#d32f2f'; // Rojo - exceso severo
    if (excess >= 10) return '#f57c00'; // Naranja - exceso moderado
    if (excess >= 5) return '#fbc02d'; // Amarillo - exceso leve
    return '#388e3c'; // Verde - exceso mínimo
};

// Función para obtener descripción del tipo de vía
const getRoadTypeDescription = (roadType: string): string => {
    const descriptions: Record<string, string> = {
        'urban': 'Zona Urbana',
        'interurban': 'Interurbana',
        'highway': 'Autopista',
        'residential': 'Residencial',
        'industrial': 'Industrial',
        'park': 'Parque',
        'unknown': 'Desconocida'
    };
    return descriptions[roadType] || roadType;
};

export const AdvancedSpeedAnalysisMap: React.FC<AdvancedSpeedAnalysisMapProps> = ({
    violations,
    loading = false,
    error,
    onViolationClick,
    center = [40.4168, -3.7038],
    zoom = 11,
    height = '500px'
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);
    const [mapZoom, setMapZoom] = useState(zoom);

    // Estados de configuración
    const [radius, setRadius] = useState(12);
    const [opacity] = useState(0.8);
    const [showExcess, setShowExcess] = useState(true);
    const [showViolationType, setShowViolationType] = useState(false);
    const [showClusters, setShowClusters] = useState(true);
    const [selectedViolationType, setSelectedViolationType] = useState<'all' | 'grave' | 'leve' | 'correcto'>('all');
    const [rotativoFilter, setRotativoFilter] = useState<'all' | 'with' | 'without'>('all');
    const [parkFilter, setParkFilter] = useState<'all' | 'in' | 'out'>('all');
    const [roadTypeFilter, setRoadTypeFilter] = useState<string>('all');

    // Procesar datos de violaciones
    const processedData = useMemo(() => {
        if (!violations || violations.length === 0) return { violations: [], clusters: [] };

        // Filtrar por tipo de violación
        let filteredViolations = violations;
        if (selectedViolationType !== 'all') {
            filteredViolations = violations.filter(v => v.violationType === selectedViolationType);
        }

        // Filtrar por rotativo
        if (rotativoFilter !== 'all') {
            filteredViolations = filteredViolations.filter(v => {
                if (rotativoFilter === 'with') return v.rotativoOn === true;
                if (rotativoFilter === 'without') return v.rotativoOn === false;
                return true;
            });
        }

        // Filtrar por parque
        if (parkFilter !== 'all') {
            filteredViolations = filteredViolations.filter(v => {
                if (parkFilter === 'in') return v.inPark === true;
                if (parkFilter === 'out') return v.inPark === false;
                return true;
            });
        }

        // Filtrar por tipo de vía
        if (roadTypeFilter !== 'all') {
            filteredViolations = filteredViolations.filter(v => v.roadType === roadTypeFilter);
        }

        // Generar clusters para el heatmap
        const clusters: Array<{ lat: number; lng: number; intensity: number; count: number; violations: SpeedViolation[] }> = [];
        const clusterRadius = 0.003; // Radio del cluster en grados

        filteredViolations.forEach(violation => {
            let addedToCluster = false;

            // Buscar cluster existente cercano
            for (const cluster of clusters) {
                const distance = Math.sqrt(
                    Math.pow(violation.lat - cluster.lat, 2) +
                    Math.pow(violation.lng - cluster.lng, 2)
                );

                if (distance < clusterRadius) {
                    cluster.violations.push(violation);
                    cluster.count++;
                    cluster.intensity = Math.min(cluster.count / 15, 1); // Normalizar intensidad
                    addedToCluster = true;
                    break;
                }
            }

            // Crear nuevo cluster si no se encontró uno cercano
            if (!addedToCluster) {
                clusters.push({
                    lat: violation.lat,
                    lng: violation.lng,
                    intensity: 1 / 15,
                    count: 1,
                    violations: [violation]
                });
            }
        });

        return {
            violations: filteredViolations,
            clusters
        };
    }, [violations, selectedViolationType, rotativoFilter, parkFilter, roadTypeFilter]);

    // Calcular estadísticas
    const stats = useMemo(() => {
        const violations = processedData.violations;
        const total = violations.length;
        const grave = violations.filter(v => v.violationType === 'grave').length;
        const moderada = violations.filter(v => v.violationType === 'correcto').length;
        const leve = violations.filter(v => v.violationType === 'leve').length;
        const withRotativo = violations.filter(v => v.rotativoOn).length;
        const withoutRotativo = violations.filter(v => !v.rotativoOn).length;
        const inPark = violations.filter(v => v.inPark).length;
        const outPark = violations.filter(v => !v.inPark).length;
        const avgExcess = violations.length > 0
            ? violations.reduce((sum, v) => sum + (v.speed - v.speedLimit), 0) / violations.length
            : 0;

        return {
            total,
            grave,
            moderada,
            leve,
            withRotativo,
            withoutRotativo,
            inPark,
            outPark,
            avgExcess: Math.round(avgExcess * 10) / 10,
            clusters: processedData.clusters.length
        };
    }, [processedData]);

    // Obtener tipos de vía únicos
    const roadTypes = useMemo(() => {
        const types = new Set(violations.map(v => v.roadType));
        return Array.from(types);
    }, [violations]);

    // Manejar click en violación
    const handleViolationClick = useCallback((violation: SpeedViolation) => {
        if (onViolationClick) {
            onViolationClick(violation);
        }
    }, [onViolationClick]);

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

    // Obtener color del punto basado en la configuración
    const getPointColor = useCallback((violation: SpeedViolation) => {
        if (showViolationType) {
            return getViolationColor(violation.violationType);
        }
        if (showExcess) {
            return getExcessColor(violation.speed, violation.speedLimit);
        }
        return getViolationColor(violation.violationType);
    }, [showViolationType, showExcess]);

    if (error) {
        return (
            <Card sx={{ height }}>
                <CardContent>
                    <Box className="flex items-center justify-center h-full">
                        <Typography color="error">
                            Error cargando mapa de velocidad: {error}
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
                        <Typography>Cargando análisis de velocidad...</Typography>
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
                            <Analytics />
                            Análisis Avanzado de Velocidad
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
                    <Box className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Violación</InputLabel>
                            <Select
                                value={selectedViolationType}
                                onChange={(e) => setSelectedViolationType(e.target.value as any)}
                                label="Tipo de Violación"
                            >
                                <MenuItem value="all">Todas las Violaciones</MenuItem>
                                <MenuItem value="grave">Graves</MenuItem>
                                <MenuItem value="correcto">Correctas</MenuItem>
                                <MenuItem value="leve">Leves</MenuItem>
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

                        <FormControl fullWidth size="small">
                            <InputLabel>Zona</InputLabel>
                            <Select
                                value={parkFilter}
                                onChange={(e) => setParkFilter(e.target.value as any)}
                                label="Zona"
                            >
                                <MenuItem value="all">Todas las Zonas</MenuItem>
                                <MenuItem value="in">En Parque</MenuItem>
                                <MenuItem value="out">Fuera del Parque</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Tipo de Vía</InputLabel>
                            <Select
                                value={roadTypeFilter}
                                onChange={(e) => setRoadTypeFilter(e.target.value)}
                                label="Tipo de Vía"
                            >
                                <MenuItem value="all">Todas las Vías</MenuItem>
                                {roadTypes.map(roadType => (
                                    <MenuItem key={roadType} value={roadType}>
                                        {getRoadTypeDescription(roadType)}
                                    </MenuItem>
                                ))}
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
                                max={25}
                                step={2}
                                size="small"
                            />
                        </Box>
                    </Box>

                    {/* Controles de visualización */}
                    <Box className="flex items-center gap-4 mb-4">
                        <Box className="flex items-center gap-2">
                            <Switch
                                checked={showExcess}
                                onChange={(e) => setShowExcess(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2">Mostrar por Exceso</Typography>
                        </Box>

                        <Box className="flex items-center gap-2">
                            <Switch
                                checked={showViolationType}
                                onChange={(e) => setShowViolationType(e.target.checked)}
                                size="small"
                            />
                            <Typography variant="body2">Mostrar por Tipo</Typography>
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
                            label={`${stats.total} violaciones`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.grave} graves`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.moderada} moderadas`}
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.leve} leves`}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                        <Chip
                            label={`Exceso promedio: ${stats.avgExcess} km/h`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${stats.clusters} clusters`}
                            size="small"
                            color="default"
                            variant="outlined"
                        />
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
                        {showClusters && processedData.clusters.map((cluster, index) => (
                            <CircleMarker
                                key={`cluster-${index}`}
                                center={[cluster.lat, cluster.lng]}
                                radius={Math.max(radius * 2, cluster.count * 3)}
                                pathOptions={{
                                    color: '#ff0000',
                                    fillColor: '#ff0000',
                                    fillOpacity: opacity * 0.3,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1 font-bold">
                                            Cluster de Violaciones
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Violaciones:</strong> {cluster.count}
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
                                    {cluster.count} violaciones - Intensidad: {Math.round(cluster.intensity * 100)}%
                                </LeafletTooltip>
                            </CircleMarker>
                        ))}

                        {/* Violaciones individuales */}
                        {processedData.violations.map((violation, index) => (
                            <CircleMarker
                                key={`violation-${violation.id}-${index}`}
                                center={[violation.lat, violation.lng]}
                                radius={radius}
                                pathOptions={{
                                    color: getPointColor(violation),
                                    fillColor: getPointColor(violation),
                                    fillOpacity: opacity,
                                    weight: 2
                                }}
                                eventHandlers={{
                                    click: () => handleViolationClick(violation)
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1 font-bold">
                                            Violación de Velocidad
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Vehículo:</strong> {violation.vehicleName}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Velocidad:</strong> {violation.speed} km/h
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Límite:</strong> {violation.speedLimit} km/h
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Exceso:</strong> {violation.speed - violation.speedLimit} km/h
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Tipo:</strong> {violation.violationType}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Rotativo:</strong> {violation.rotativoOn ? 'Encendido' : 'Apagado'}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Zona:</strong> {violation.inPark ? 'En Parque' : 'Fuera del Parque'}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Tipo de Vía:</strong> {getRoadTypeDescription(violation.roadType)}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Fecha:</strong> {new Date(violation.timestamp).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Popup>
                                <LeafletTooltip>
                                    {violation.vehicleName} - {violation.speed} km/h - Exceso: {violation.speed - violation.speedLimit} km/h
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
                            {showViolationType ? (
                                <>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getViolationColor('grave') }} />
                                        <Typography variant="caption">Grave</Typography>
                                    </Box>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getViolationColor('moderada') }} />
                                        <Typography variant="caption">Moderada</Typography>
                                    </Box>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getViolationColor('leve') }} />
                                        <Typography variant="caption">Leve</Typography>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getExcessColor(70, 50) }} />
                                        <Typography variant="caption">Exceso ≥20 km/h</Typography>
                                    </Box>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getExcessColor(60, 50) }} />
                                        <Typography variant="caption">Exceso ≥10 km/h</Typography>
                                    </Box>
                                    <Box className="flex items-center gap-2">
                                        <Box className="w-3 h-3 rounded-full" style={{ backgroundColor: getExcessColor(55, 50) }} />
                                        <Typography variant="caption">Exceso ≥5 km/h</Typography>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};
