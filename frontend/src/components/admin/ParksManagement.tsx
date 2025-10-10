/**
 * 🏢 GESTIÓN DE PARQUES - BOMBEROS MADRID
 * CRUD completo con mapa, estadísticas y vinculación de vehículos
 */

import {
    Add,
    Delete,
    Edit,
    Map,
    People
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
    Grid,
    IconButton,
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
import UnifiedMapComponent from '../maps/UnifiedMapComponent';

interface Park {
    id: string;
    name: string;
    identifier: string;
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    organizationId: string;
    _count?: {
        vehicles: number;
        zones: number;
    };
}

export const ParksManagement: React.FC = () => {
    const [parks, setParks] = useState<Park[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPark, setSelectedPark] = useState<Park | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        identifier: '',
        latitude: 40.4168,
        longitude: -3.7038
    });

    const fetchParks = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<{ success: boolean; data: Park[] }>('/api/parks?includeCount=true');

            if (response.data && response.data.success) {
                setParks(response.data.data);
                logger.info(`Parques cargados: ${response.data.data.length}`);
            }
            setError(null);
        } catch (err) {
            logger.error('Error cargando parques:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchParks();
    }, [fetchParks]);

    const handleOpenDialog = (park?: Park) => {
        if (park) {
            setSelectedPark(park);
            setFormData({
                name: park.name,
                identifier: park.identifier,
                latitude: park.geometry.coordinates[1],
                longitude: park.geometry.coordinates[0]
            });
        } else {
            setSelectedPark(null);
            setFormData({
                name: '',
                identifier: '',
                latitude: 40.4168,
                longitude: -3.7038
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedPark(null);
    };

    const handleSave = async () => {
        try {
            const parkData = {
                name: formData.name,
                identifier: formData.identifier,
                geometry: {
                    type: 'Point',
                    coordinates: [formData.longitude, formData.latitude]
                },
                geometryPostgis: JSON.stringify({
                    type: 'Point',
                    coordinates: [formData.longitude, formData.latitude]
                })
            };

            if (selectedPark) {
                // Actualizar
                await apiService.put(`/api/parks/${selectedPark.id}`, parkData);
                logger.info('Parque actualizado:', selectedPark.id);
            } else {
                // Crear
                await apiService.post('/api/parks', parkData);
                logger.info('Parque creado:', formData.name);
            }

            await fetchParks();
            handleCloseDialog();
        } catch (err) {
            logger.error('Error guardando parque:', err);
            alert('Error guardando parque. Ver consola para detalles.');
        }
    };

    const handleDelete = async (park: Park) => {
        if (!confirm(`¿Eliminar parque "${park.name}"? Esto desvinculará todos los vehículos asociados.`)) {
            return;
        }

        try {
            await apiService.delete(`/api/parks/${park.id}`);
            logger.info('Parque eliminado:', park.id);
            await fetchParks();
        } catch (err) {
            logger.error('Error eliminando parque:', err);
            alert('Error eliminando parque. Ver consola para detalles.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Gestión de Parques de Bomberos
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Parque
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Estadísticas */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Parques
                            </Typography>
                            <Typography variant="h4">
                                {parks.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Vehículos
                            </Typography>
                            <Typography variant="h4">
                                {parks.reduce((sum, p) => sum + (p._count?.vehicles || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Zonas
                            </Typography>
                            <Typography variant="h4">
                                {parks.reduce((sum, p) => sum + (p._count?.zones || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Mapa de Parques */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Ubicación de Parques
                    </Typography>
                    <Box sx={{ height: 400, border: '1px solid #ddd', borderRadius: 1 }}>
                        <UnifiedMapComponent
                            center={[40.4168, -3.7038]}
                            zoom={11}
                            height="100%"
                            points={parks.map(park => ({
                                id: park.id,
                                lat: park.geometry.coordinates[1],
                                lng: park.geometry.coordinates[0],
                                type: 'location' as const,
                                title: park.name,
                                description: `ID: ${park.identifier}\nVehículos: ${park._count?.vehicles || 0}\nZonas: ${park._count?.zones || 0}`
                            }))}
                            showControls={true}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Tabla de Parques */}
            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Identificador</TableCell>
                            <TableCell>Coordenadas</TableCell>
                            <TableCell align="center">Vehículos</TableCell>
                            <TableCell align="center">Zonas</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography color="textSecondary">
                                        No hay parques registrados
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            parks.map((park) => (
                                <TableRow key={park.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">{park.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={park.identifier} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {park.geometry.coordinates[1].toFixed(4)}, {park.geometry.coordinates[0].toFixed(4)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={<People />}
                                            label={park._count?.vehicles || 0}
                                            size="small"
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            icon={<Map />}
                                            label={park._count?.zones || 0}
                                            size="small"
                                            color="secondary"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenDialog(park)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(park)}
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
                    {selectedPark ? 'Editar Parque' : 'Nuevo Parque'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Nombre del Parque"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="ej: Parque Alcobendas"
                        />
                        <TextField
                            label="Identificador"
                            fullWidth
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value.toUpperCase() })}
                            placeholder="ej: ALCOBENDAS"
                            helperText="Identificador único en mayúsculas"
                        />
                        <TextField
                            label="Latitud"
                            type="number"
                            fullWidth
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                            inputProps={{ step: 0.000001 }}
                        />
                        <TextField
                            label="Longitud"
                            type="number"
                            fullWidth
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                            inputProps={{ step: 0.000001 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        disabled={!formData.name || !formData.identifier}
                    >
                        {selectedPark ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ParksManagement;

