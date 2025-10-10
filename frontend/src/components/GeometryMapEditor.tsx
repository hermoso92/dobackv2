import { Box, Slider, Typography } from '@mui/material';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

interface Geometry {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
    radius: number; // metros
}

interface GeometryMapEditorProps {
    geometry: Geometry | null;
    onChange: (geometry: Geometry | null) => void;
    disabled?: boolean;
}

const DEFAULT_CENTER: LatLngExpression = [40.4168, -3.7038]; // Madrid
const DEFAULT_RADIUS = 100;

const DraggableMarker: React.FC<{
    position: LatLngExpression;
    onPositionChange: (lat: number, lon: number) => void;
    disabled?: boolean;
}> = ({ position, onPositionChange, disabled }) => {
    const markerRef = useRef<L.Marker>(null);
    useMapEvents({
        click(e) {
            if (!disabled) {
                onPositionChange(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return (
        <Marker
            draggable={!disabled}
            position={position}
            ref={markerRef}
            eventHandlers={{
                dragend: () => {
                    const marker = markerRef.current;
                    if (marker) {
                        const { lat, lng } = marker.getLatLng();
                        onPositionChange(lat, lng);
                    }
                },
            }}
            icon={L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
                shadowSize: [41, 41],
            })}
        />
    );
};

export const GeometryMapEditor: React.FC<GeometryMapEditorProps> = ({ geometry, onChange, disabled }) => {
    const [center, setCenter] = useState<[number, number]>(geometry ? [geometry.coordinates[1], geometry.coordinates[0]] : [40.4168, -3.7038]);
    const [radius, setRadius] = useState<number>(geometry ? geometry.radius : DEFAULT_RADIUS);
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (geometry) {
            setCenter([geometry.coordinates[1], geometry.coordinates[0]]);
            setRadius(geometry.radius);
        }
    }, [geometry]);

    const handleMarkerChange = (lat: number, lon: number) => {
        setCenter([lat, lon]);
        setTouched(true);
        onChange({ type: 'Point', coordinates: [lon, lat], radius });
    };

    const handleRadiusChange = (_: any, value: number | number[]) => {
        const r = Array.isArray(value) ? value[0] : value;
        setRadius(r);
        setTouched(true);
        onChange({ type: 'Point', coordinates: [center[1], center[0]], radius: r });
    };

    return (
        <Box sx={{ width: '100%', height: 320, mb: 2 }}>
            <MapContainer center={center as [number, number]} zoom={15} style={{ height: 280, width: '100%' }} scrollWheelZoom={!disabled}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <DraggableMarker position={center as [number, number]} onPositionChange={handleMarkerChange} disabled={disabled} />
                <Circle center={center as [number, number]} radius={radius} pathOptions={{ color: 'blue', fillOpacity: 0.2 }} />
            </MapContainer>
            <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Radio: {radius} m</Typography>
                <Slider
                    min={20}
                    max={1000}
                    step={10}
                    value={radius}
                    onChange={handleRadiusChange}
                    disabled={disabled}
                />
            </Box>
            <Typography variant="caption" color={touched || geometry ? 'textSecondary' : 'error'}>
                {touched || geometry ? 'Haz clic en el mapa para seleccionar el centro y ajusta el radio.' : 'Debes seleccionar la ubicación en el mapa antes de guardar.'}
            </Typography>
        </Box>
    );
}; 