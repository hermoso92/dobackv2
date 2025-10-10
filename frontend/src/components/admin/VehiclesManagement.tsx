/**
 * 🚗 GESTIÓN DE VEHÍCULOS - BOMBEROS MADRID
 * CRUD completo con asignación a parques
 */

import {
    Add,
    Delete,
    Edit,
    LocalParking
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface Vehicle {
    id: string;
    name: string;
    dobackId: string;
    licensePlate: string;
    parkId: string | null;
    park?: {
        id: string;
        name: string;
    };
    status: string;
    type: string;
}

interface Park {
    id: string;
    name: string;
    identifier: string;
}

export const VehiclesManagement: React.FC = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [parks, setParks] = useState<Park[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        dobackId: '',
        licensePlate: '',
        parkId: '',
        type: 'OTHER',
        status: 'ACTIVE'
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // Cargar vehículos y parques en paralelo
            const [vehiclesResponse, parksResponse] = await Promise.all([
                apiService.get<{ success: boolean; data: Vehicle[] }>('/api/vehicles'),
                apiService.get<{ success: boolean; data: Park[] }>('/api/parks')
            ]);

            if (vehiclesResponse.data?.success) {
                setVehicles(vehiclesResponse.data.data);
            }
            if (parksResponse.data?.success) {
                setParks(parksResponse.data.data);
            }

            setError(null);
        } catch (err) {
            logger.error('Error cargando datos:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenDialog = (vehicle?: Vehicle) => {
        if (vehicle) {
            setSelectedVehicle(vehicle);
            setFormData({
                name: vehicle.name,
                dobackId: vehicle.dobackId,
                licensePlate: vehicle.licensePlate,
                parkId: vehicle.parkId || '',
                type: vehicle.type,
                status: vehicle.status
            });
        } else {
            setSelectedVehicle(null);
            setFormData({
                name: '',
                dobackId: '',
                licensePlate: '',
                parkId: '',
                type: 'OTHER',
                status: 'ACTIVE'
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedVehicle(null);
    };

    const handleSave = async () => {
        try {
            const vehicleData = {
                name: formData.name,
                dobackId: formData.dobackId,
                licensePlate: formData.licensePlate,
                parkId: formData.parkId || null,
                type: formData.type,
                status: formData.status
            };

            if (selectedVehicle) {
                await apiService.put(`/api/vehicles/${selectedVehicle.id}`, vehicleData);
                logger.info('Vehículo actualizado:', selectedVehicle.id);
            } else {
                await apiService.post('/api/vehicles', vehicleData);
                logger.info('Vehículo creado:', formData.name);
            }

            await fetchData();
            handleCloseDialog();
        } catch (err) {
            logger.error('Error guardando vehículo:', err);
            alert('Error guardando vehículo. Ver consola para detalles.');
        }
    };

    const handleDelete = async (vehicle: Vehicle) => {
        if (!confirm(`¿Eliminar vehículo "${vehicle.name}"?`)) {
            return;
        }

        try {
            await apiService.delete(`/vehicles/${vehicle.id}`);
            logger.info('Vehículo eliminado:', vehicle.id);
            await fetchData();
        } catch (err) {
            logger.error('Error eliminando vehículo:', err);
            alert('Error eliminando vehículo. Ver consola para detalles.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    // Estadísticas por parque
    const vehiclesByPark = parks.map(park => ({
        park,
        count: vehicles.filter(v => v.parkId === park.id).length
    }));

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Gestión de Vehículos
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Vehículo
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Estadísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Vehículos
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Activos
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.filter(v => v.status === 'ACTIVE').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Asignados a Parques
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.filter(v => v.parkId).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Sin Asignar
                            </Typography>
                            <Typography variant="h4">
                                {vehicles.filter(v => !v.parkId).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Vehículos por Parque */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {vehiclesByPark.map(({ park, count }) => (
                    <Grid item xs={12} md={6} key={park.id}>
                        <Card>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h6">{park.name}</Typography>
                                        <Typography color="textSecondary" variant="caption">
                                            {park.identifier}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        icon={<LocalParking />}
                                        label={`${count} vehículos`}
                                        color="primary"
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabla de Vehículos */}
            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>DOBACK ID</TableCell>
                            <TableCell>Matrícula</TableCell>
                            <TableCell>Parque</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {vehicles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography color="textSecondary">
                                        No hay vehículos registrados
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            vehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">{vehicle.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={vehicle.dobackId} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>{vehicle.licensePlate}</TableCell>
                                    <TableCell>
                                        {vehicle.park ? (
                                            <Chip label={vehicle.park.name} size="small" />
                                        ) : (
                                            <Typography color="textSecondary" variant="caption">
                                                Sin asignar
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{vehicle.type}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={vehicle.status}
                                            size="small"
                                            color={vehicle.status === 'ACTIVE' ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenDialog(vehicle)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(vehicle)}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Crear/Editar */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nombre del Vehículo"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ej: BRP ALCOBENDAS"
                        />
                        <TextField
                            label="DOBACK ID"
                            fullWidth
                            value={formData.dobackId}
                            onChange={(e) => setFormData({ ...formData, dobackId: e.target.value.toUpperCase() })}
                            placeholder="ej: DOBACK024"
                        />
                        <TextField
                            label="Matrícula"
                            fullWidth
                            value={formData.licensePlate}
                            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                            placeholder="ej: 0696MXZ"
                        />
                        <FormControl fullWidth>
                            <InputLabel>Parque</InputLabel>
                            <Select
                                value={formData.parkId}
                                label="Parque"
                                onChange={(e) => setFormData({ ...formData, parkId: e.target.value })}
                            >
                                <MenuItem value="">
                                    <em>Sin asignar</em>
                                </MenuItem>
                                {parks.map((park) => (
                                    <MenuItem key={park.id} value={park.id}>
                                        {park.name} ({park.identifier})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.type}
                                label="Tipo"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <MenuItem value="FIRE_TRUCK">Camión Bomberos</MenuItem>
                                <MenuItem value="AMBULANCE">Ambulancia</MenuItem>
                                <MenuItem value="RESCUE">Rescate</MenuItem>
                                <MenuItem value="LADDER">Escalera</MenuItem>
                                <MenuItem value="OTHER">Otro</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={formData.status}
                                label="Estado"
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <MenuItem value="ACTIVE">Activo</MenuItem>
                                <MenuItem value="MAINTENANCE">Mantenimiento</MenuItem>
                                <MenuItem value="INACTIVE">Inactivo</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!formData.name || !formData.dobackId}
                    >
                        {selectedVehicle ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VehiclesManagement;

