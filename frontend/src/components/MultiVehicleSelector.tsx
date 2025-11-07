import { logger } from '../utils/logger';
import {
    DirectionsCar as CarIcon,
    Group as GroupIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    ButtonGroup,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export interface VehicleSelection {
    type: 'select' | 'all';
    vehicleIds: string[];
    filterBy?: {
        type?: string[];
        status?: string[];
        parkId?: string[];
    };
}

interface Vehicle {
    id: string;
    name: string;
    type?: string;
    status?: string;
    parkId?: string;
    parkName?: string;
}

interface MultiVehicleSelectorProps {
    onVehicleSelectionChange: (selection: VehicleSelection) => void;
    initialSelection?: VehicleSelection;
}

const MultiVehicleSelector: React.FC<MultiVehicleSelectorProps> = ({
    onVehicleSelectionChange,
    initialSelection = { type: 'select', vehicleIds: [] }
}) => {
    const { isAuthenticated, authLoading } = useAuth();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [selection, setSelection] = useState<VehicleSelection>(initialSelection);
    const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchVehicles();
        }
    }, [isAuthenticated, authLoading]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const response = await apiService.get('/api/vehicles');
            logger.info('MultiVehicleSelector - Respuesta del servidor:', response);

            if (response.success && Array.isArray(response.data)) {
                setVehicles(response.data);
            } else {
                logger.error('MultiVehicleSelector - Formato de respuesta inválido:', response);
                setVehicles([]);
            }
        } catch (error) {
            logger.error('Error al obtener vehículos:', error);
            setVehicles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectionTypeChange = (type: 'select' | 'all') => {
        const newSelection: VehicleSelection = { type, vehicleIds: [] };

        if (type === 'all') {
            newSelection.vehicleIds = vehicles.map(v => v.id);
            setSelectedVehicles(vehicles);
        } else if (type === 'select' && selection.vehicleIds.length > 0) {
            // Mantener la selección actual si ya hay vehículos seleccionados
            newSelection.vehicleIds = selection.vehicleIds;
            const selectedVehiclesList = vehicles.filter(v => selection.vehicleIds.includes(v.id));
            setSelectedVehicles(selectedVehiclesList);
        }

        setSelection(newSelection);
        onVehicleSelectionChange(newSelection);
    };

    const handleVehicleChange = (vehicleId: string) => {
        if (selection.type === 'select') {
            const currentIds = selection.vehicleIds;
            const newIds = currentIds.includes(vehicleId)
                ? currentIds.filter(id => id !== vehicleId)
                : [...currentIds, vehicleId];

            const newSelection: VehicleSelection = { type: 'select', vehicleIds: newIds };
            setSelection(newSelection);
            const selectedVehiclesList = vehicles.filter(v => newIds.includes(v.id));
            setSelectedVehicles(selectedVehiclesList);
            onVehicleSelectionChange(newSelection);
        }
    };

    const clearSelection = () => {
        const newSelection: VehicleSelection = { type: 'select', vehicleIds: [] };
        setSelection(newSelection);
        setSelectedVehicles([]);
        onVehicleSelectionChange(newSelection);
    };

    if (authLoading || loading) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Cargando vehículos...</Typography>
            </Box>
        );
    }

    if (!isAuthenticated) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="error">Usuario no autenticado</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CarIcon />
                Selección de Vehículos
            </Typography>

            {/* Selector de tipo */}
            <Box sx={{ mb: 2 }}>
                <ButtonGroup variant="outlined" fullWidth>
                    <Button
                        startIcon={<GroupIcon />}
                        variant={selection.type === 'select' ? 'contained' : 'outlined'}
                        onClick={() => handleSelectionTypeChange('select')}
                    >
                        Seleccionar Vehículo/s
                    </Button>
                    <Button
                        startIcon={<CarIcon />}
                        variant={selection.type === 'all' ? 'contained' : 'outlined'}
                        onClick={() => handleSelectionTypeChange('all')}
                    >
                        Todos los Vehículos
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Selector de vehículos */}
            {selection.type !== 'all' && (
                <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Seleccionar vehículo/s</InputLabel>
                        <Select
                            multiple
                            value={selection.vehicleIds}
                            onChange={(e) => {
                                const value = e.target.value as string[];
                                // Actualizar la selección directamente
                                const newSelection: VehicleSelection = { type: 'select', vehicleIds: value };
                                setSelection(newSelection);
                                const selectedVehiclesList = vehicles.filter(v => value.includes(v.id));
                                setSelectedVehicles(selectedVehiclesList);
                                onVehicleSelectionChange(newSelection);
                            }}
                            renderValue={(selected) => {
                                return (selected as string[]).map(id => {
                                    const vehicle = vehicles.find(v => v.id === id);
                                    return vehicle ? vehicle.name : id;
                                }).join(', ');
                            }}
                        >
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                        <CarIcon fontSize="small" />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="body2">{vehicle.name}</Typography>
                                            {vehicle.parkName && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {vehicle.parkName}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* Vehículos seleccionados */}
            {selectedVehicles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Vehículos seleccionados ({selectedVehicles.length}):
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {selectedVehicles.map((vehicle) => (
                            <Chip
                                key={vehicle.id}
                                label={vehicle.name}
                                onDelete={() => handleVehicleChange(vehicle.id)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                    <Button
                        size="small"
                        onClick={clearSelection}
                        sx={{ mt: 1 }}
                    >
                        Limpiar selección
                    </Button>
                </Box>
            )}

            {/* Información para todos los vehículos */}
            {selection.type === 'all' && (
                <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary">
                        🚗 Se analizarán todos los vehículos disponibles ({vehicles.length} vehículos)
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default MultiVehicleSelector;