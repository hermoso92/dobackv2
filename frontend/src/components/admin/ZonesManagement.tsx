/**
 * 🌐 GESTIÓN DE ZONAS - BOMBEROS MADRID
 * CRUD completo de zonas geográficas vinculadas a parques
 */

import {
    Add,
    Delete,
    Edit
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface Zone {
    id: string;
    name: string;
    type: string;
    geometry: any;
    organizationId: string;
    parkId?: string;
    park?: {
        id: string;
        name: string;
    };
    _count?: {
        events: number;
        sessions: number;
    };
}

interface Park {
    id: string;
    name: string;
    identifier: string;
}

export const ZonesManagement: React.FC = () => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [parks, setParks] = useState<Park[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'PARK',
        parkId: ''
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const [zonesResponse, parksResponse] = await Promise.all([
                apiService.get<{ success: boolean; data: Zone[] }>('/api/zones?includeCount=true'),
                apiService.get<{ success: boolean; data: Park[] }>('/api/parks')
            ]);

            if (zonesResponse.data?.success) {
                setZones(zonesResponse.data.data);
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

    const handleOpenDialog = (zone?: Zone) => {
        if (zone) {
            setSelectedZone(zone);
            setFormData({
                name: zone.name,
                type: zone.type,
                parkId: zone.parkId || ''
            });
        } else {
            setSelectedZone(null);
            setFormData({
                name: '',
                type: 'PARK',
                parkId: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedZone(null);
    };

    const handleDelete = async (zone: Zone) => {
        if (!confirm(`¿Eliminar zona "${zone.name}"?`)) {
            return;
        }

        try {
            await apiService.delete(`/zones/${zone.id}`);
            logger.info('Zona eliminada:', zone.id);
            await fetchData();
        } catch (err) {
            logger.error('Error eliminando zona:', err);
            alert('Error eliminando zona. Ver consola para detalles.');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    // Agrupar zonas por tipo
    const zonesByType = zones.reduce((acc, zone) => {
        acc[zone.type] = (acc[zone.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Gestión de Zonas Geográficas
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Nueva Zona
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
                                Total Zonas
                            </Typography>
                            <Typography variant="h4">
                                {zones.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Zonas de Parque
                            </Typography>
                            <Typography variant="h4">
                                {zonesByType['PARK'] || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Eventos
                            </Typography>
                            <Typography variant="h4">
                                {zones.reduce((sum, z) => sum + (z._count?.events || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Sesiones
                            </Typography>
                            <Typography variant="h4">
                                {zones.reduce((sum, z) => sum + (z._count?.sessions || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabla de Zonas */}
            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Parque</TableCell>
                            <TableCell align="center">Eventos</TableCell>
                            <TableCell align="center">Sesiones</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {zones.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography color="textSecondary">
                                        No hay zonas registradas
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            zones.map((zone) => (
                                <TableRow key={zone.id} hover>
                                    <TableCell>
                                        <Typography fontWeight="medium">{zone.name}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={zone.type} size="small" color="primary" />
                                    </TableCell>
                                    <TableCell>
                                        {zone.park ? (
                                            <Typography variant="body2">{zone.park.name}</Typography>
                                        ) : (
                                            <Typography color="textSecondary" variant="caption">
                                                Sin asignar
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={zone._count?.events || 0}
                                            size="small"
                                            color={zone._count?.events ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={zone._count?.sessions || 0}
                                            size="small"
                                            color={zone._count?.sessions ? 'info' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleOpenDialog(zone)}
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(zone)}
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

            {/* Info */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    💡 Sobre las Zonas
                </Typography>
                <Typography variant="body2">
                    Las zonas se crean automáticamente cuando se importan geocercas desde Radar.com.
                    Las zonas vinculadas a parques permiten detectar cuando un vehículo entra o sale del parque.
                </Typography>
            </Alert>
        </Box>
    );
};

export default ZonesManagement;

