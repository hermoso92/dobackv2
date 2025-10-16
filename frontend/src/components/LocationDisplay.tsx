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
        fallbackToCoords: showCoords
    });

    if (loading) {
        return (
            <span className="text-slate-500 italic">
                {fallbackText || 'Cargando dirección...'}
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
