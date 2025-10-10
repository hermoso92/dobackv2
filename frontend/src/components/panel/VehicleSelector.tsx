import {
    Close,
    DirectionsCar,
    Search,
    SelectAll
} from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    TextField,
    Typography
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { Vehicle } from '../../hooks/useVehicles';

interface VehicleSelectorProps {
    vehicles: Vehicle[];
    selectedVehicles: string[];
    onSelectionChange: (vehicles: string[]) => void;
    open: boolean;
    onClose: () => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
    vehicles,
    selectedVehicles,
    onSelectionChange,
    open,
    onClose
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // Filtrar vehículos basado en la búsqueda
    const filteredVehicles = useMemo(() => {
        if (!searchTerm) return vehicles;

        const search = searchTerm.toLowerCase();
        return vehicles.filter(vehicle =>
            (vehicle.plate || '').toLowerCase().includes(search) ||
            vehicle.name.toLowerCase().includes(search) ||
            vehicle.id.toLowerCase().includes(search)
        );
    }, [vehicles, searchTerm]);

    // Manejar selección individual
    const handleVehicleToggle = (vehicleId: string) => {
        const newSelection = selectedVehicles.includes(vehicleId)
            ? selectedVehicles.filter(id => id !== vehicleId)
            : [...selectedVehicles, vehicleId];

        onSelectionChange(newSelection);
    };

    // Manejar selección de todos
    const handleSelectAll = () => {
        if (selectAll) {
            onSelectionChange([]);
        } else {
            onSelectionChange(filteredVehicles.map(v => v.id));
        }
        setSelectAll(!selectAll);
    };

    // Manejar cierre del diálogo
    const handleClose = () => {
        setSearchTerm('');
        setSelectAll(false);
        onClose();
    };

    // Manejar confirmación
    const handleConfirm = () => {
        handleClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box className="flex items-center justify-between">
                    <Typography variant="h6" className="flex items-center gap-2">
                        <DirectionsCar />
                        Seleccionar Vehículos
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Campo de búsqueda */}
                <TextField
                    fullWidth
                    placeholder="Buscar vehículo por nombre, matrícula o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <Search className="mr-2 text-gray-400" />
                    }}
                    className="mb-4"
                    size="small"
                />

                {/* Estadísticas */}
                <Box className="flex gap-2 mb-4">
                    <Chip
                        label={`${vehicles.length} vehículos total`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                    <Chip
                        label={`${filteredVehicles.length} filtrados`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                    />
                    <Chip
                        label={`${selectedVehicles.length} seleccionados`}
                        size="small"
                        color="success"
                        variant="outlined"
                    />
                </Box>

                {/* Botón seleccionar todos */}
                <Box className="mb-4">
                    <FormControlLabel
                        control={
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SelectAll />}
                                onClick={handleSelectAll}
                            >
                                {selectAll ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                            </Button>
                        }
                        label=""
                    />
                </Box>

                {/* Lista de vehículos */}
                <List className="max-h-96 overflow-y-auto">
                    {filteredVehicles.length === 0 ? (
                        <ListItem>
                            <ListItemText
                                primary="No se encontraron vehículos"
                                secondary={searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay vehículos disponibles'}
                            />
                        </ListItem>
                    ) : (
                        filteredVehicles.map((vehicle) => (
                            <ListItem key={vehicle.id} disablePadding>
                                <ListItemButton
                                    onClick={() => handleVehicleToggle(vehicle.id)}
                                    selected={selectedVehicles.includes(vehicle.id)}
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            checked={selectedVehicles.includes(vehicle.id)}
                                            onChange={() => handleVehicleToggle(vehicle.id)}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box className="flex items-center gap-2">
                                                <Typography variant="body1" className="font-medium">
                                                    {vehicle.name}
                                                </Typography>
                                                {vehicle.plate && (
                                                    <Chip
                                                        label={vehicle.plate}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box className="flex flex-col gap-1">
                                                <Typography variant="body2" color="text.secondary">
                                                    ID: {vehicle.id}
                                                </Typography>
                                                {vehicle.lastUpdate && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Última actualización: {new Date(vehicle.lastUpdate).toLocaleString()}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))
                    )}
                </List>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="primary"
                >
                    Confirmar ({selectedVehicles.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};
