import React from 'react';
import { useGeocoding } from '../hooks/useGeocoding';

interface LocationDisplayProps {
    lat: number;
    lng: number;
    fallbackText?: string;
    showCoords?: boolean;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
    lat,
    lng,
    fallbackText,
    showCoords = true
}) => {
    const { address, loading } = useGeocoding(lat, lng, {
        enabled: true,
        fallbackToCoords: showCoords
    });

    // Si está cargando, mostrar fallback o coordenadas mientras tanto
    if (loading) {
        const tempDisplay = fallbackText || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        return (
            <span 
                className="text-slate-600" 
                title={`Geocodificando... Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
            >
                {tempDisplay}
            </span>
        );
    }

    const displayText = address || fallbackText || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    return (
        <span title={`Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}>
            {displayText}
        </span>
    );
};

export default LocationDisplay;
