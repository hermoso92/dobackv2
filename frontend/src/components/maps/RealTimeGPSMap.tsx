/**
 * 🗺️ MAPA GPS EN TIEMPO REAL
 * Componente para mostrar ubicaciones de vehículos en tiempo real
 */

import { Alert, Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { logger } from '../../utils/logger';

// Configuración de iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VehicleData {
    vehicleId: string;
    name: string;
    type: string;
    emergencyStatus: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
    isActive: boolean;
    gpsData?: {
        latitude: number;
        longitude: number;
        speed: number;
        heading: number;
        accuracy: number;
        satellites: number;
        lastUpdate: string;
    };
}

interface RealTimeGPSMapProps {
    vehicles: VehicleData[];
    height?: string;
    onVehicleClick?: (vehicle: VehicleData) => void;
}

export const RealTimeGPSMap: React.FC<RealTimeGPSMapProps> = ({
    vehicles,
    height = '500px',
    onVehicleClick
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

            // Agregar capa de tiles
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

        // Agregar vehículos al mapa
        vehicles.forEach((vehicle) => {
            try {
                addVehicleToMap(vehicle);
            } catch (err) {
                logger.error(`Error agregando vehículo ${vehicle.name}:`, err);
            }
        });

        // Ajustar vista si hay vehículos
        if (vehicles.length > 0 && markersRef.current.getLayers().length > 0) {
            try {
                // Crear bounds manualmente desde las coordenadas de los vehículos válidos
                const validVehicles = vehicles.filter(v => v.gpsData && v.isActive &&
                    v.gpsData.latitude && v.gpsData.longitude &&
                    !isNaN(v.gpsData.latitude) && !isNaN(v.gpsData.longitude));

                if (validVehicles.length > 0) {
                    const lats = validVehicles.map(v => v.gpsData!.latitude);
                    const lngs = validVehicles.map(v => v.gpsData!.longitude);

                    const bounds = L.latLngBounds(
                        L.latLng(Math.min(...lats), Math.min(...lngs)),
                        L.latLng(Math.max(...lats), Math.max(...lngs))
                    );

                    mapInstanceRef.current.fitBounds(bounds, {
                        padding: [30, 30],
                        maxZoom: 15
                    });
                } else {
                    mapInstanceRef.current.setView(madridCenter, 11);
                }
            } catch (error) {
                logger.warn('Error ajustando vista del mapa:', error);
                mapInstanceRef.current.setView(madridCenter, 11);
            }
        } else {
            // Si no hay vehículos o marcadores, centrar en Madrid
            mapInstanceRef.current.setView(madridCenter, 11);
        }

    }, [vehicles, mapLoaded]);

    const getVehicleColor = (status: string): string => {
        switch (status) {
            case 'ON_EMERGENCY': return '#f44336'; // Rojo
            case 'AVAILABLE': return '#4caf50'; // Verde
            case 'MAINTENANCE': return '#ff9800'; // Naranja
            case 'OFFLINE': return '#9e9e9e'; // Gris
            default: return '#2196f3'; // Azul
        }
    };

    const getVehicleIcon = (color: string, type: string) => {
        const iconHtml = `
            <div style="
                background-color: ${color};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
            ">
                ${type === 'BOMBA' ? '🚒' : type === 'ESCALERA' ? '🪜' : '🚗'}
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-vehicle-icon',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
    };

    const formatSpeed = (speed: number | null | undefined) => {
        if (speed === null || speed === undefined || isNaN(speed)) {
            return 'Sin datos';
        }
        return `${speed.toFixed(1)} km/h`;
    };

    const formatTimeAgo = (dateString: string | null | undefined) => {
        if (!dateString) return 'Sin datos';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha inválida';

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `${diffMins}min`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
            return `${Math.floor(diffMins / 1440)}d`;
        } catch (error) {
            return 'Error de fecha';
        }
    };

    const addVehicleToMap = (vehicle: VehicleData) => {
        if (!mapInstanceRef.current || !vehicle.gpsData || !vehicle.isActive) {
            logger.warn(`Vehículo ${vehicle.name} no válido para mostrar en mapa`);
            return;
        }

        const { latitude, longitude } = vehicle.gpsData;

        // Validación de coordenadas
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude) ||
            latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            logger.warn(`Coordenadas inválidas para vehículo ${vehicle.name}: lat=${latitude}, lng=${longitude}`);
            return;
        }

        try {
            const color = getVehicleColor(vehicle.emergencyStatus);
            const icon = getVehicleIcon(color, vehicle.type);

            // Crear marcador
            const marker = L.marker([latitude, longitude], { icon });

            // Agregar popup
            const popupContent = `
            <div style="min-width: 250px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${vehicle.name}</h4>
                <p style="margin: 4px 0 8px 0; font-size: 13px; color: #666;">${vehicle.vehicleId}</p>
                <div style="margin: 8px 0; display: flex; gap: 4px; flex-wrap: wrap;">
                    <span style="background: ${color}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${vehicle.emergencyStatus}
                    </span>
                    <span style="background: #2196f3; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${vehicle.type}
                    </span>
                </div>
                <div style="margin: 8px 0; font-size: 12px; line-height: 1.4;">
                    <strong>Velocidad:</strong> ${formatSpeed(vehicle.gpsData.speed)}<br>
                    <strong>Dirección:</strong> ${vehicle.gpsData.heading}°<br>
                    <strong>Precisión:</strong> ${vehicle.gpsData.accuracy}m<br>
                    <strong>Satélites:</strong> ${vehicle.gpsData.satellites}<br>
                    <strong>Actualizado:</strong> ${formatTimeAgo(vehicle.gpsData.lastUpdate)}
                </div>
            </div>
        `;

            marker.bindPopup(popupContent);

            // Agregar evento de clic
            marker.on('click', () => {
                if (onVehicleClick) {
                    onVehicleClick(vehicle);
                }
            });

            // Agregar marcador al grupo
            marker.addTo(markersRef.current);
        } catch (error) {
            logger.error(`Error creando marcador para vehículo ${vehicle.name}:`, error);
        }
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
                    🗺️ Mapa GPS en Tiempo Real
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ubicaciones actuales de todos los vehículos activos
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
                        Leyenda de Vehículos
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
                            <Typography variant="caption">En Emergencia</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                            <Typography variant="caption">Disponible</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
                            <Typography variant="caption">Mantenimiento</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: '#9e9e9e', borderRadius: '50%' }} />
                            <Typography variant="caption">Offline</Typography>
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Total de vehículos: {vehicles.length} | Activos: {vehicles.filter(v => v.isActive).length}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};
