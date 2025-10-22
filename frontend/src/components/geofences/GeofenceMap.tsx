import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { Geofence } from '../../types/geofence';
import { logger } from '../../utils/logger';

// Configuración de iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeofenceMapProps {
    geofences: Geofence[];
    selectedGeofence?: Geofence | null;
    onGeofenceSelect?: (geofence: Geofence) => void;
    height?: string;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
    geofences,
    selectedGeofence,
    onGeofenceSelect,
    height = '500px'
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Coordenadas de Madrid como centro por defecto
    const madridCenter: [number, number] = [40.4168, -3.7038];

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        try {
            // Crear mapa
            const map = L.map(mapRef.current).setView(madridCenter, 11);
            mapInstanceRef.current = map;

            // Agregar capa de tiles (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 10
            }).addTo(map);

            // Añadir controles de zoom personalizados
            map.zoomControl.setPosition('topright');

            // Agregar grupo de marcadores
            markersRef.current.addTo(map);

            setMapLoaded(true);
            setError(null);

        } catch (err) {
            logger.error('Error inicializando mapa:', err);
            setError('Error al cargar el mapa');
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded) return;

        // Limpiar marcadores existentes
        markersRef.current.clearLayers();

        // Agregar geofences al mapa
        geofences.forEach((geofence) => {
            try {
                addGeofenceToMap(geofence);
            } catch (err) {
                logger.error(`Error agregando geofence ${geofence.name}:`, err);
            }
        });

        // Ajustar vista si hay geofences
        if (geofences.length > 0) {
            const bounds = markersRef.current.getBounds();
            if (bounds.isValid()) {
                mapInstanceRef.current.fitBounds(bounds, {
                    padding: [30, 30],
                    maxZoom: 15
                });
            }
        } else {
            // Si no hay geofences, centrar en Madrid
            mapInstanceRef.current.setView(madridCenter, 11);
        }

    }, [geofences, mapLoaded]);

    useEffect(() => {
        if (!mapInstanceRef.current || !selectedGeofence) return;

        // Centrar en geofence seleccionada
        const center = getGeofenceCenter(selectedGeofence);
        if (center) {
            mapInstanceRef.current.setView(center, 15);
        }

    }, [selectedGeofence]);

    const getGeofenceCenter = (geofence: Geofence): [number, number] | null => {
        try {
            // Prioridad 1: geometryCenter (formato estándar)
            if (geofence.geometryCenter?.coordinates) {
                const [lng, lat] = geofence.geometryCenter.coordinates;
                return [lat, lng];
            }

            // Prioridad 2: calcular centro desde geometría
            switch (geofence.type) {
                case 'CIRCLE':
                    if (geofence.geometry?.center) {
                        return geofence.geometry.center;
                    }
                    break;
                case 'POLYGON':
                    if (geofence.geometry?.coordinates?.[0]) {
                        const coords = geofence.geometry.coordinates[0];
                        const sumLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0);
                        const sumLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0);
                        return [sumLat / coords.length, sumLng / coords.length];
                    }
                    break;
                case 'RECTANGLE':
                    if (geofence.geometry?.bounds) {
                        const { north, south, east, west } = geofence.geometry.bounds;
                        return [(north + south) / 2, (east + west) / 2];
                    }
                    break;
            }

            // Fallback: coordenadas por defecto de Madrid si no hay datos
            logger.warn(`No se pudo determinar el centro para geofence ${geofence.name}, usando Madrid por defecto`);
            return madridCenter;
        } catch (err) {
            logger.error('Error calculando centro de geofence:', err);
            return madridCenter;
        }
    };

    const getGeofenceColor = (geofence: Geofence): string => {
        if (!geofence.enabled) return '#9e9e9e';
        if (geofence.live) return '#4caf50';
        return '#2196f3';
    };

    const addGeofenceToMap = (geofence: Geofence) => {
        if (!mapInstanceRef.current) return;

        const center = getGeofenceCenter(geofence);
        if (!center) {
            logger.warn(`No se pudo obtener centro para geofence ${geofence.name}`);
            return;
        }

        const color = getGeofenceColor(geofence);
        const [lat, lng] = center;

        // Crear marcador con icono personalizado
        const marker = L.circleMarker([lat, lng], {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });

        // Agregar popup mejorado
        const popupContent = `
            <div style="min-width: 250px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${geofence.name}</h4>
                <p style="margin: 4px 0 8px 0; font-size: 13px; color: #666;">${geofence.description || 'Sin descripción'}</p>
                <div style="margin: 8px 0; display: flex; gap: 4px; flex-wrap: wrap;">
                    <span style="background: ${color}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${geofence.type}
                    </span>
                    <span style="background: ${geofence.enabled ? '#4caf50' : '#f44336'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${geofence.enabled ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                    ${geofence.live ? '<span style="background: #ff9800; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">EN VIVO</span>' : ''}
                </div>
                <div style="margin: 8px 0; font-size: 12px; line-height: 1.4;">
                    <strong>Tag:</strong> ${geofence.tag || 'N/A'}<br>
                    <strong>Modo:</strong> ${geofence.mode}<br>
                    <strong>Radio:</strong> ${geofence.geometryRadius ? `${geofence.geometryRadius}m` : 'N/A'}<br>
                    <strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Agregar evento de clic
        marker.on('click', () => {
            if (onGeofenceSelect) {
                onGeofenceSelect(geofence);
            }
        });

        // Agregar geometría específica según el tipo
        try {
            switch (geofence.type) {
                case 'CIRCLE':
                    if (geofence.geometryRadius && geofence.geometryRadius > 0) {
                        const circle = L.circle([lat, lng], {
                            radius: geofence.geometryRadius,
                            color: color,
                            weight: 3,
                            opacity: 0.8,
                            fillColor: color,
                            fillOpacity: 0.15
                        });
                        circle.addTo(markersRef.current);
                    }
                    break;

                case 'POLYGON':
                    if (geofence.geometry?.coordinates?.[0] && geofence.geometry.coordinates[0].length > 2) {
                        const coords = geofence.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
                        const polygon = L.polygon(coords, {
                            color: color,
                            weight: 3,
                            opacity: 0.8,
                            fillColor: color,
                            fillOpacity: 0.15
                        });
                        polygon.addTo(markersRef.current);
                    }
                    break;

                case 'RECTANGLE':
                    if (geofence.geometry?.bounds) {
                        const { north, south, east, west } = geofence.geometry.bounds;
                        const rectangle = L.rectangle([[south, west], [north, east]], {
                            color: color,
                            weight: 3,
                            opacity: 0.8,
                            fillColor: color,
                            fillOpacity: 0.15
                        });
                        rectangle.addTo(markersRef.current);
                    }
                    break;
            }
        } catch (err) {
            logger.error(`Error renderizando geometría para ${geofence.name}:`, err);
        }

        // Agregar marcador al grupo
        marker.addTo(markersRef.current);
    };

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Alert severity="error">
                        {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Mapa Interactivo de Geofences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Visualización de todas las geofences activas con sus zonas de influencia
                </Typography>

                <Box
                    ref={mapRef}
                    sx={{
                        height,
                        width: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '2px solid',
                        borderColor: 'divider',
                        boxShadow: 2,
                        '& .leaflet-control-zoom': {
                            borderRadius: '8px !important',
                        },
                        '& .leaflet-control-zoom a': {
                            borderRadius: '6px !important',
                        },
                        '& .leaflet-popup-content': {
                            margin: '8px 12px !important',
                            lineHeight: '1.4 !important',
                        },
                        '& .leaflet-popup-tip': {
                            background: 'white !important',
                        }
                    }}
                >
                    {!mapLoaded && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 1000
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                </Box>

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Leyenda de Geofences
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                            <Typography variant="caption">Activo en Vivo</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#2196f3', borderRadius: '50%' }} />
                            <Typography variant="caption">Activo</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#9e9e9e', borderRadius: '50%' }} />
                            <Typography variant="caption">Deshabilitado</Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Total de geofences: {geofences.length} | Activas: {geofences.filter(g => g.enabled).length}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};