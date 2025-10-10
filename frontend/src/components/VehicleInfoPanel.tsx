import { Box, Stack, Typography } from '@mui/material';
import React from 'react';
import { useGeocoding } from '../hooks/useGeocoding';
import { vehicleService } from '../services/vehicles';
import { Vehicle } from '../types/vehicle';

interface VehicleInfoPanelProps {
    vehicle: Vehicle | null;
    lastLocation?: { lat: number; lon: number; lastUpdate?: string } | null;
}

const VehicleInfoPanel: React.FC<VehicleInfoPanelProps> = ({ vehicle, lastLocation }) => {
    if (!vehicle) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" color="text.secondary">Selecciona un vehículo</Typography>
            </Box>
        );
    }

    const [info, setInfo] = React.useState<Partial<Vehicle>>({});

    // Usar el hook de geocodificación
    const { address, loading: addressLoading } = useGeocoding(
        lastLocation?.lat ?? null,
        lastLocation?.lon ?? null,
        { fallbackToCoords: true }
    );

    // Cargar marca y modelo si faltan
    React.useEffect(() => {
        let active = true;
        if (vehicle && (!vehicle.brand || !vehicle.model)) {
            vehicleService.getVehicleById(vehicle.id)
                .then(v => { if (active) setInfo({ brand: v.brand, model: v.model }); })
                .catch(() => { /* ignorar */ });
        } else if (vehicle) {
            setInfo({ brand: vehicle.brand, model: vehicle.model });
        }
        return () => { active = false; };
    }, [vehicle]);

    const isOnline = lastLocation?.lastUpdate ? (Date.now() - new Date(lastLocation.lastUpdate).getTime() < 30 * 60 * 1000) : false;

    return (
        <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
            <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{vehicle.licensePlate || vehicle.plate || vehicle.name}</Typography>
                {(info.brand || info.model) && (
                    <Typography variant="body2">{[info.brand, info.model].filter(Boolean).join(' ')}</Typography>
                )}
                {address && !addressLoading && (
                    <Typography variant="body2" color="text.secondary">{address}</Typography>
                )}
                {addressLoading && (
                    <Typography variant="body2" color="text.secondary">Obteniendo dirección…</Typography>
                )}
                {lastLocation?.lastUpdate && (
                    <Typography variant="body2" color={isOnline ? 'success.main' : 'text.secondary'}>
                        {isOnline ? 'En línea (≤30 min)' : 'Sin señal (>30 min)'}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

export default VehicleInfoPanel; 