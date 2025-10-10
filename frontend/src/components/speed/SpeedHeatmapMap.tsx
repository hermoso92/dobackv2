import {
    Cancel,
    CenterFocusStrong,
    CheckCircle,
    Warning,
    ZoomIn,
    ZoomOut
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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

interface SpeedHeatmapMapProps {
    events: SpeedEvent[];
    showHeatmap: boolean;
    onEventClick: (event: SpeedEvent) => void;
    center?: [number, number];
    zoom?: number;
}

// Componentes styled
const MapContainer = styled(Box)({
    height: '500px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
    position: 'relative',
    backgroundColor: '#f5f5f5'
});

const MapOverlay = styled(Box)({
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
});

const LegendContainer = styled(Box)({
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000
});

const EventMarker = styled(Box)<{
    severity: 'normal' | 'warning' | 'critical';
    rotativoActive: boolean;
}>(({ theme, severity, rotativoActive }) => {
    const getColor = () => {
        if (!rotativoActive) {
            return severity === 'critical' ? '#f44336' :
                severity === 'warning' ? '#ff9800' : '#4caf50';
        }
        return severity === 'critical' ? '#d32f2f' :
            severity === 'warning' ? '#f57c00' : '#388e3c';
    };

    const getSize = () => {
        return severity === 'critical' ? '16px' :
            severity === 'warning' ? '12px' : '8px';
    };

    return {
        position: 'absolute',
        width: getSize(),
        height: getSize(),
        borderRadius: '50%',
        backgroundColor: getColor(),
        border: rotativoActive ? '3px solid #fff' : '2px solid #fff',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        transform: 'translate(-50%, -50%)',
        '&:hover': {
            transform: 'translate(-50%, -50%) scale(1.2)',
            zIndex: 100
        }
    };
});

const HeatmapLayer = styled(Box)({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    opacity: 0.7
});

// Función para convertir coordenadas geográficas a píxeles del mapa
const latLngToPixel = (lat: number, lng: number, mapCenter: [number, number], mapSize: { width: number; height: number }, zoom: number) => {
    // Simulación de proyección - en un mapa real usarías una librería como Leaflet
    const scale = Math.pow(2, zoom - 10);
    const x = (lng - mapCenter[1]) * scale * 1000 + mapSize.width / 2;
    const y = (mapCenter[0] - lat) * scale * 1000 + mapSize.height / 2;
    return { x, y };
};

// Función para obtener el color del heatmap según la intensidad
const getHeatmapColor = (intensity: number) => {
    const colors = [
        'rgba(0, 255, 0, 0.1)',    // Verde - normal
        'rgba(255, 255, 0, 0.2)',  // Amarillo - advertencia
        'rgba(255, 165, 0, 0.3)',  // Naranja - moderado
        'rgba(255, 0, 0, 0.4)',    // Rojo - crítico
        'rgba(128, 0, 0, 0.5)'     // Rojo oscuro - muy crítico
    ];

    const index = Math.min(Math.floor(intensity * colors.length), colors.length - 1);
    return colors[index];
};

// Componente principal
export const SpeedHeatmapMap: React.FC<SpeedHeatmapMapProps> = ({
    events,
    showHeatmap,
    onEventClick,
    center = [40.4168, -3.7038],
    zoom = 11
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
    const [currentZoom, setCurrentZoom] = useState(zoom);
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);

    // Actualizar tamaño del mapa
    useEffect(() => {
        const updateMapSize = () => {
            if (mapRef.current) {
                const rect = mapRef.current.getBoundingClientRect();
                setMapSize({ width: rect.width, height: rect.height });
            }
        };

        updateMapSize();
        window.addEventListener('resize', updateMapSize);
        return () => window.removeEventListener('resize', updateMapSize);
    }, []);

    // Calcular clusters de eventos para el heatmap
    const heatmapData = React.useMemo(() => {
        if (!showHeatmap || events.length === 0) return [];

        const clusters: Array<{ lat: number; lng: number; intensity: number; events: SpeedEvent[] }> = [];
        const clusterRadius = 0.01; // Radio del cluster en grados

        events.forEach(event => {
            let addedToCluster = false;

            // Buscar cluster existente cercano
            for (const cluster of clusters) {
                const distance = Math.sqrt(
                    Math.pow(event.lat - cluster.lat, 2) +
                    Math.pow(event.lng - cluster.lng, 2)
                );

                if (distance < clusterRadius) {
                    cluster.events.push(event);
                    cluster.intensity = Math.min(cluster.events.length / 10, 1); // Normalizar intensidad
                    addedToCluster = true;
                    break;
                }
            }

            // Crear nuevo cluster si no se encontró uno cercano
            if (!addedToCluster) {
                clusters.push({
                    lat: event.lat,
                    lng: event.lng,
                    intensity: 1 / 10,
                    events: [event]
                });
            }
        });

        return clusters;
    }, [events, showHeatmap]);

    // Handlers de zoom y navegación
    const handleZoomIn = useCallback(() => {
        setCurrentZoom(prev => Math.min(prev + 1, 18));
    }, []);

    const handleZoomOut = useCallback(() => {
        setCurrentZoom(prev => Math.max(prev - 1, 1));
    }, []);

    const handleCenterMap = useCallback(() => {
        setMapCenter(center);
        setCurrentZoom(zoom);
    }, [center, zoom]);

    // Renderizar eventos como marcadores
    const renderEventMarkers = () => {
        return events.map(event => {
            const pixelPos = latLngToPixel(event.lat, event.lng, mapCenter, mapSize, currentZoom);

            // Verificar si el evento está visible en el mapa
            if (pixelPos.x < -50 || pixelPos.x > mapSize.width + 50 ||
                pixelPos.y < -50 || pixelPos.y > mapSize.height + 50) {
                return null;
            }

            return (
                <EventMarker
                    key={event.id}
                    severity={event.severity}
                    rotativoActive={event.rotativoActive}
                    style={{
                        left: pixelPos.x,
                        top: pixelPos.y
                    }}
                    onClick={() => onEventClick(event)}
                    title={`${event.vehicleName} - ${event.speed} km/h (${event.speedLimit} km/h límite) - ${event.rotativoActive ? 'Con' : 'Sin'} rotativo`}
                />
            );
        });
    };

    // Renderizar heatmap
    const renderHeatmap = () => {
        if (!showHeatmap || heatmapData.length === 0) return null;

        return (
            <HeatmapLayer>
                {heatmapData.map((cluster, index) => {
                    const pixelPos = latLngToPixel(cluster.lat, cluster.lng, mapCenter, mapSize, currentZoom);
                    const radius = Math.max(20, cluster.intensity * 100);

                    return (
                        <Box
                            key={index}
                            sx={{
                                position: 'absolute',
                                left: pixelPos.x - radius / 2,
                                top: pixelPos.y - radius / 2,
                                width: radius,
                                height: radius,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${getHeatmapColor(cluster.intensity)} 0%, transparent 70%)`,
                                pointerEvents: 'none'
                            }}
                        />
                    );
                })}
            </HeatmapLayer>
        );
    };

    // Calcular estadísticas
    const stats = React.useMemo(() => {
        const total = events.length;
        const withRotativo = events.filter(e => e.rotativoActive).length;
        const withoutRotativo = total - withRotativo;
        const critical = events.filter(e => e.severity === 'critical').length;
        const warning = events.filter(e => e.severity === 'warning').length;
        const normal = events.filter(e => e.severity === 'normal').length;

        return { total, withRotativo, withoutRotativo, critical, warning, normal };
    }, [events]);

    return (
        <MapContainer ref={mapRef}>
            {/* Controles del mapa */}
            <MapOverlay>
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

                <Tooltip title="Centrar Mapa">
                    <IconButton
                        size="small"
                        sx={{ bgcolor: 'white', boxShadow: 1 }}
                        onClick={handleCenterMap}
                    >
                        <CenterFocusStrong />
                    </IconButton>
                </Tooltip>
            </MapOverlay>

            {/* Heatmap */}
            {renderHeatmap()}

            {/* Marcadores de eventos */}
            {renderEventMarkers()}

            {/* Leyenda */}
            <LegendContainer>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    Leyenda
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption">Normal (dentro del límite)</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="caption">Advertencia (cerca del límite)</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Cancel sx={{ fontSize: 16, color: 'error.main' }} />
                        <Typography variant="caption">Crítico (exceso claro)</Typography>
                    </Box>

                    <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #ddd' }}>
                        <Typography variant="caption" color="text.secondary">
                            Borde blanco = Con rotativo
                        </Typography>
                    </Box>
                </Box>
            </LegendContainer>

            {/* Estadísticas */}
            <Box sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000
            }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold' }}>
                    Eventos: {stats.total}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                    Con rotativo: {stats.withRotativo}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                    Sin rotativo: {stats.withoutRotativo}
                </Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                    Críticos: {stats.critical}
                </Typography>
            </Box>

            {/* Información del mapa */}
            <Box sx={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
            }}>
                Zoom: {currentZoom} | Centro: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
            </Box>
        </MapContainer>
    );
};

