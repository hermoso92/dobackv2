import { Box } from '@mui/material';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { StabilityEvent } from '../types/stability';
import { TelemetryData } from '../types/telemetry';
import { VehicleLocation } from '../types/vehicle';
import { logger } from '../utils/logger';
import { t } from "../i18n";

// Configuración del icono por defecto de Leaflet
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Función para obtener el color del evento
const getEventColor = (tipos: string[]): string => {
    if (tipos.includes('vuelco')) return '#FF0000'; // Rojo
    if (tipos.includes('deriva')) return '#FFA500'; // Naranja
    if (tipos.includes('bache')) return '#800080'; // Púrpura
    if (tipos.includes('maniobra_brusca')) return '#FFD700'; // Amarillo
    if (tipos.includes('inestabilidad')) return '#FF00FF'; // Magenta
    return '#000000'; // Negro por defecto
};

// Función para formatear los valores del evento
const formatEventValues = (valores: Record<string, number>): string => {
    return Object.entries(valores)
        .map(([key, value]) => `${key}: ${value.toFixed(2)}`)
        .join('<br/>');
};

interface GPSMapProps {
    vehicleLocations: VehicleLocation[];
    center: [number, number];
    zoom: number;
    telemetryData: TelemetryData[];
    stabilityEvents: StabilityEvent[];
}

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
};

const StabilityEventMarker: React.FC<{ event: StabilityEvent }> = ({ event }) => {
    const icon = divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${getEventColor(event.tipos)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    return (
        <Marker
            position={[event.lat, event.lon]}
            icon={icon}
        >
            <Popup>
                <div>
                    <strong>{t('eventos_5')}</strong> {event.tipos.join(', ')}<br />
                    <strong>{t('timestamp_2')}</strong> {new Date(event.timestamp).toLocaleString()}<br />
                    <strong>{t('valores_1')}</strong><br />
                    <div dangerouslySetInnerHTML={{ __html: formatEventValues(event.valores) }} />
                </div>
            </Popup>
        </Marker>
    );
};

export const GPSMap: React.FC<GPSMapProps> = ({
    vehicleLocations,
    center,
    zoom,
    telemetryData,
    stabilityEvents
}) => {
    const mapRef = useRef(null);

    useEffect(() => {
        logger.info('GPSMap actualizado:', {
            vehicleCount: vehicleLocations.length,
            center,
            zoom,
            stabilityEventsCount: stabilityEvents.length
        });
    }, [vehicleLocations, center, zoom, stabilityEvents]);

    // Crear puntos para la línea de ruta
    const routePoints = telemetryData
        .filter(point => point.latitude && point.longitude)
        .map(point => [point.latitude, point.longitude] as [number, number]);

    return (
        <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Marcadores de vehículos */}
                {vehicleLocations.map(location => (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        icon={defaultIcon}
                    >
                        <Popup>
                            <div>
                                <strong>{t('vehiculo_24')}</strong> {location.name}<br />
                                <strong>{t('ultima_actualizacion_8')}</strong> {new Date(location.lastUpdate).toLocaleString()}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Línea de ruta */}
                {routePoints.length > 0 && (
                    <Polyline
                        positions={routePoints}
                        color="#3388ff"
                        weight={3}
                        opacity={0.7}
                    />
                )}

                {/* Marcadores de eventos de estabilidad */}
                {stabilityEvents.map((event, index) => (
                    <StabilityEventMarker key={`${event.timestamp}-${index}`} event={event} />
                ))}

                <MapUpdater center={center} zoom={zoom} />
            </MapContainer>
        </Box>
    );
};

export default GPSMap; 