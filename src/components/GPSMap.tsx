import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GPSPoint {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
}

interface GPSMapProps {
    center?: LatLngExpression;
    zoom?: number;
    height?: number | string;
    width?: number | string;
    points?: GPSPoint[];
    title?: string;
}

// Componente para manejar los eventos del mapa
const MapEvents: React.FC = () => {
    const map = useMapEvents({
        zoomend: () => {
            map.invalidateSize();
        },
        resize: () => {
            map.invalidateSize();
        }
    });
    return null;
};

// Componente para manejar el centro del mapa
const MapCenter: React.FC<{ center: LatLngExpression }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.setView(center as [number, number]);
        }
    }, [map, center]);
    return null;
};

// Componente para renderizar los marcadores
const MarkersLayer: React.FC<{ points: GPSPoint[] }> = React.memo(({ points }) => {
    return (
        <>
            {points.map((point, index) => (
                <Marker
                    key={`${point.lat}-${point.lng}-${index}`}
                    position={[point.lat, point.lng]}
                >
                    <Popup>
                        <div>
                            <p>Velocidad: {point.speed} km/h</p>
                            <p>Hora: {new Date(point.timestamp).toLocaleString()}</p>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
});

MarkersLayer.displayName = 'MarkersLayer';

const GPSMap: React.FC<GPSMapProps> = ({
    center = [40.4168, -3.7038],
    zoom = 13,
    height = 400,
    width = '100%',
    points = [],
    title
}) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const mapStyle = useCallback(() => ({
        height,
        width,
        position: 'relative' as const,
        zIndex: 1
    }), [height, width]);

    if (!isMounted) {
        return (
            <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>Cargando mapa...</div>
            </div>
        );
    }

    return (
        <div style={{ height, width, position: 'relative' }}>
            {title && (
                <div style={{ marginBottom: '8px' }}>
                    <h3>{title}</h3>
                </div>
            )}
            <div style={mapStyle()}>
                <MapContainer
                    center={center as [number, number]}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    attributionControl={true}
                    zoomControl={true}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MapCenter center={center} />
                    <MapEvents />
                    {points.length > 0 && <MarkersLayer points={points} />}
                </MapContainer>
            </div>
        </div>
    );
};

export default React.memo(GPSMap); 