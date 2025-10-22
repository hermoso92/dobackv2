import {
import { logger } from '../utils/logger';
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface Vehicle {
    id: string;
    name: string;
    licensePlate: string;
}

interface VehicleSelectorProps {
    selectedVehicle?: string;
    onVehicleChange?: (vehicleId: string) => void;
    showLabel?: boolean;
    fullWidth?: boolean;
    size?: 'small' | 'medium';
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
    selectedVehicle,
    onVehicleChange,
    showLabel = true,
    fullWidth = true,
    size = 'medium'
}) => {
    const { t } = useTranslation();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Obtener vehículos de la organización del usuario
    useEffect(() => {
        const fetchVehicles = async () => {
            // Solo hacer la petición si el usuario está autenticado
            if (!isAuthenticated || authLoading) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await apiService.get('/api/vehicles');
                logger.info('VehicleSelector - Respuesta del servidor:', response);

                // El apiService ya maneja la autenticación y devuelve { success: true, data: [...] }
                if (response.success && Array.isArray(response.data)) {
                    setVehicles(response.data);
                } else {
                    logger.error('VehicleSelector - Formato de respuesta inválido:', response);
                    setVehicles([]);
                }
            } catch (err) {
                logger.error('VehicleSelector - Error fetching vehicles:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, [isAuthenticated, authLoading, selectedVehicle, onVehicleChange]);

    const handleVehicleChange = (event: any) => {
        const vehicleId = event.target.value;

        // Guardar en localStorage para sincronizar con otras páginas
        localStorage.setItem('selectedVehicle', vehicleId);

        // Llamar al callback si existe
        if (onVehicleChange) {
            onVehicleChange(vehicleId);
        }
    };

    if (authLoading) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CarIcon />
                <Typography variant="body2" color="text.secondary">
                    {t('verificando_autenticacion')}
                </Typography>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CarIcon />
                <Typography variant="body2" color="text.secondary">
                    {t('usuario_no_autenticado')}
                </Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CarIcon />
                <Typography variant="body2" color="text.secondary">
                    {t('cargando_vehiculos')}
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CarIcon />
                <Typography variant="body2" color="error">
                    {t('error_al_cargar_vehiculos')}: {error}
                </Typography>
            </Box>
        );
    }

    if (vehicles.length === 0) {
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <CarIcon />
                <Typography variant="body2" color="text.secondary">
                    {t('no_hay_vehiculos')}
                </Typography>
            </Box>
        );
    }

    return (
        <Box display="flex" alignItems="center" gap={1}>
            <CarIcon color="primary" />
            <FormControl fullWidth={fullWidth} size={size}>
                {showLabel && (
                    <InputLabel>{t('vehiculo')}</InputLabel>
                )}
                <Select
                    value={selectedVehicle || ''}
                    onChange={handleVehicleChange}
                    label={showLabel ? t('vehiculo') : undefined}
                    displayEmpty={!showLabel}
                >
                    {!showLabel && (
                        <MenuItem value="">
                            <em>{t('seleccionar_vehiculo')}</em>
                        </MenuItem>
                    )}
                    {vehicles.map((vehicle) => (
                        <MenuItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.name} ({vehicle.licensePlate})
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default VehicleSelector;