/**
 * 🗺️ COMPONENTE DE MAPA UNIFICADO - BOMBEROS MADRID
 * Integración completa de Leaflet/OpenStreetMap para todas las funcionalidades
 */

import {
    MyLocation as CenterIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Polygon, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// Configuración de iconos personalizados para Leaflet
const createCustomIcon = (color: string, iconType: 'vehicle' | 'fire' | 'maintenance' | 'alert' | 'location') => {
    const iconMap = {
        vehicle: '🚗',
        fire: '🚒',
        maintenance: '🔧',
        alert: '⚠️',
        location: '📍'
    };

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-size: 20px;
            ">
                ${iconMap[iconType]}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

// Tipos de datos
interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    type: 'vehicle' | 'fire' | 'maintenance' | 'alert' | 'location';
    status?: 'available' | 'busy' | 'offline' | 'emergency' | 'maintenance';
    title: string;
    description?: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
}

interface GeofenceData {
    id: string;
    name: string;
    type: 'polygon' | 'circle';
    coordinates: number[][];
    radius?: number;
    color: string;
    description?: string;
    enabled: boolean;
}

interface MapLayer {
    id: string;
    name: string;
    visible: boolean;
    type: 'vehicles' | 'geofences' | 'routes' | 'heatmap';
    data: any[];
}

interface UnifiedMapProps {
    center?: [number, number];
    zoom?: number;
    height?: string | number;
    width?: string | number;
    points?: MapPoint[];
    geofences?: GeofenceData[];
    routes?: Array<{ id: string; points: [number, number][]; color: string; name: string }>;
    layers?: MapLayer[];
    onPointClick?: (point: MapPoint) => void;
    onGeofenceClick?: (geofence: GeofenceData) => void;
    onMapClick?: (lat: number, lng: number) => void;
    showControls?: boolean;
    realTime?: boolean;
    refreshInterval?: number;
}

// Componente para centrar el mapa
const MapCenter: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);

    return null;
};

// Componente para eventos del mapa
const MapEvents: React.FC<{
    onMapClick?: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        }
    });
    return null;
};

// Componente para capas de vehículos
const VehicleLayer: React.FC<{
    vehicles: MapPoint[];
    onVehicleClick?: (vehicle: MapPoint) => void;
}> = ({ vehicles, onVehicleClick }) => {
    return (
        <>
            {vehicles.map((vehicle) => {
                const statusColors = {
                    available: '#4caf50',
                    busy: '#ff9800',
                    offline: '#f44336',
                    emergency: '#e91e63',
                    maintenance: '#9c27b0'
                };

                const icon = createCustomIcon(
                    statusColors[vehicle.status || 'available'],
                    'vehicle'
                );

                return (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.lat, vehicle.lng]}
                        icon={icon}
                        eventHandlers={{
                            click: () => onVehicleClick?.(vehicle)
                        }}
                    >
                        <Popup>
                            <Box sx={{ minWidth: 200 }}>
                                <Typography variant="h6" gutterBottom>
                                    {vehicle.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {vehicle.description}
                                </Typography>
                                {vehicle.timestamp && (
                                    <Typography variant="caption" display="block">
                                        Última actualización: {vehicle.timestamp.toLocaleString()}
                                    </Typography>
                                )}
                                {vehicle.status && (
                                    <Chip
                                        label={vehicle.status}
                                        size="small"
                                        color={
                                            vehicle.status === 'available' ? 'success' :
                                                vehicle.status === 'emergency' ? 'error' :
                                                    vehicle.status === 'maintenance' ? 'secondary' : 'warning'
                                        }
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </Box>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

// Componente para geofences
const GeofenceLayer: React.FC<{
    geofences: GeofenceData[];
    onGeofenceClick?: (geofence: GeofenceData) => void;
}> = ({ geofences, onGeofenceClick }) => {
    return (
        <>
            {geofences.map((geofence) => {
                if (geofence.type === 'circle' && geofence.radius) {
                    return (
                        <Circle
                            key={geofence.id}
                            center={[(geofence.coordinates[0]?.[0]) || 0, (geofence.coordinates[0]?.[1]) || 0]}
                            radius={geofence.radius}
                            pathOptions={{
                                color: geofence.color,
                                fillColor: geofence.color,
                                fillOpacity: 0.2,
                                weight: 2
                            }}
                            eventHandlers={{
                                click: () => onGeofenceClick?.(geofence)
                            }}
                        />
                    );
                } else {
                    return (
                        <Polygon
                            key={geofence.id}
                            positions={geofence.coordinates.map(coord => [coord[0] || 0, coord[1] || 0])}
                            pathOptions={{
                                color: geofence.color,
                                fillColor: geofence.color,
                                fillOpacity: 0.2,
                                weight: 2
                            }}
                            eventHandlers={{
                                click: () => onGeofenceClick?.(geofence)
                            }}
                        />
                    );
                }
            })}
        </>
    );
};

// Componente principal del mapa unificado
const UnifiedMapComponent: React.FC<UnifiedMapProps> = ({
    center = [40.4168, -3.7038], // Madrid por defecto
    zoom = 13,
    height = '500px',
    width = '100%',
    points = [],
    geofences = [],
    routes = [],
    layers = [],
    onPointClick,
    onGeofenceClick,
    onMapClick,
    showControls = true,
    realTime = false,
    refreshInterval = 30000
}) => {
    // const theme = useTheme(); // Removed unused variable
    const [mapCenter, setMapCenter] = useState<[number, number]>(center);
    const [mapZoom, setMapZoom] = useState(zoom);
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set(['vehicles', 'geofences', 'alerts', 'routes']));
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Separar puntos por tipo
    const vehicles = useMemo(() =>
        points.filter(p => p.type === 'vehicle'), [points]);

    const alerts = useMemo(() =>
        points.filter(p => p.type === 'alert'), [points]);

    const firePoints = useMemo(() =>
        points.filter(p => p.type === 'fire'), [points]);

    // Función para centrar el mapa
    const handleCenterMap = useCallback(() => {
        setMapCenter(center);
        setMapZoom(zoom);
    }, [center, zoom]);

    // Función para refrescar datos
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        // Simular refresh
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    }, []);

    // Función para toggle de capas
    const toggleLayer = useCallback((layerId: string) => {
        setVisibleLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(layerId)) {
                newSet.delete(layerId);
            } else {
                newSet.add(layerId);
            }
            return newSet;
        });
    }, []);

    // Auto-refresh si está en tiempo real
    useEffect(() => {
        if (!realTime) return;

        const interval = setInterval(() => {
            handleRefresh();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [realTime, refreshInterval, handleRefresh]);

    return (
        <Box sx={{ height, width, position: 'relative' }}>
            {/* Controles del mapa */}
            {showControls && (
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}>
                    <Tooltip title="Centrar mapa">
                        <IconButton
                            onClick={handleCenterMap}
                            sx={{
                                backgroundColor: 'white',
                                boxShadow: 1,
                                '&:hover': { backgroundColor: 'grey.100' }
                            }}
                        >
                            <CenterIcon />
                        </IconButton>
                    </Tooltip>

                    {realTime && (
                        <Tooltip title="Refrescar datos">
                            <IconButton
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                sx={{
                                    backgroundColor: 'white',
                                    boxShadow: 1,
                                    '&:hover': { backgroundColor: 'grey.100' }
                                }}
                            >
                                <RefreshIcon
                                    sx={{
                                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                        '@keyframes spin': {
                                            '0%': { transform: 'rotate(0deg)' },
                                            '100%': { transform: 'rotate(360deg)' }
                                        }
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            )}

            {/* Selector de capas */}
            {showControls && layers.length > 0 && (
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    borderRadius: 1,
                    p: 1,
                    boxShadow: 1
                }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Capas
                    </Typography>
                    {layers.map(layer => (
                        <Chip
                            key={layer.id}
                            label={layer.name}
                            size="small"
                            onClick={() => toggleLayer(layer.id)}
                            color={visibleLayers.has(layer.id) ? 'primary' : 'default'}
                            variant={visibleLayers.has(layer.id) ? 'filled' : 'outlined'}
                            sx={{ mr: 0.5, mb: 0.5 }}
                        />
                    ))}
                </Box>
            )}

            {/* Mapa Leaflet con TomTom */}
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={true}
            >
                {/* Capa base de TomTom */}
                <TileLayer
                    url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                    attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                />

                {/* Componente para centrar el mapa */}
                <MapCenter center={mapCenter} />

                {/* Eventos del mapa */}
                <MapEvents onMapClick={onMapClick} />

                {/* Capa de vehículos */}
                {visibleLayers.has('vehicles') && vehicles.length > 0 && (
                    <VehicleLayer
                        vehicles={vehicles}
                        onVehicleClick={onPointClick}
                    />
                )}

                {/* Capa de alertas */}
                {visibleLayers.has('alerts') && alerts.length > 0 && (
                    <>
                        {alerts.map((alert) => {
                            const icon = createCustomIcon('#f44336', 'alert');
                            return (
                                <Marker
                                    key={alert.id}
                                    position={[alert.lat, alert.lng]}
                                    icon={icon}
                                    eventHandlers={{
                                        click: () => onPointClick?.(alert)
                                    }}
                                >
                                    <Popup>
                                        <Box sx={{ minWidth: 200 }}>
                                            <Typography variant="h6" color="error">
                                                ⚠️ {alert.title}
                                            </Typography>
                                            <Typography variant="body2">
                                                {alert.description}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </>
                )}

                {/* Capa de puntos de fuego */}
                {visibleLayers.has('fire') && firePoints.length > 0 && (
                    <>
                        {firePoints.map((firePoint) => {
                            const icon = createCustomIcon('#ff5722', 'fire');
                            return (
                                <Marker
                                    key={firePoint.id}
                                    position={[firePoint.lat, firePoint.lng]}
                                    icon={icon}
                                    eventHandlers={{
                                        click: () => onPointClick?.(firePoint)
                                    }}
                                >
                                    <Popup>
                                        <Box sx={{ minWidth: 200 }}>
                                            <Typography variant="h6" color="error">
                                                🚒 {firePoint.title}
                                            </Typography>
                                            <Typography variant="body2">
                                                {firePoint.description}
                                            </Typography>
                                        </Box>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </>
                )}

                {/* Capa de geofences */}
                {visibleLayers.has('geofences') && geofences.length > 0 && (
                    <GeofenceLayer
                        geofences={geofences}
                        onGeofenceClick={onGeofenceClick}
                    />
                )}

                {/* Capa de rutas */}
                {visibleLayers.has('routes') && routes.length > 0 && (
                    <>
                        {routes.map((route) => (
                            <React.Fragment key={route.id}>
                                {route.points.map((point, index) => {
                                    if (index === 0) return null; // Saltar el primer punto
                                    return (
                                        <Marker
                                            key={`${route.id}-${index}`}
                                            position={point}
                                            icon={createCustomIcon(route.color, 'location')}
                                        >
                                            <Popup>
                                                <Typography variant="body2">
                                                    {route.name} - Punto {index + 1}
                                                </Typography>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </>
                )}
            </MapContainer>

            {/* Información de estado */}
            {realTime && (
                <Box sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 1,
                    p: 1,
                    zIndex: 1000
                }}>
                    <Typography variant="caption" color="text.secondary">
                        🟢 Tiempo real activo • {points.length} puntos • {geofences.length} geofences
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UnifiedMapComponent;
