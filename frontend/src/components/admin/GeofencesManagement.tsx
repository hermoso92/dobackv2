/**
 * 🗺️ GESTIÓN DE GEOCERCAS - BOMBEROS MADRID
 * CRUD completo con sincronización desde Radar.com
 */

import {
    Delete,
    Map,
    Refresh,
    Sync
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
    Switch,
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
import UnifiedMapComponent from '../maps/UnifiedMapComponent';

interface Geofence {
    id: string;
    externalId?: string;
    name: string;
    description?: string;
    tag?: string;
    type: 'POLYGON' | 'CIRCLE' | 'RECTANGLE';
    mode: 'CAR' | 'FOOT' | 'BIKE' | 'ALL';
    enabled: boolean;
    live: boolean;
    geometry: any;
    geometryCenter?: any;
    geometryRadius?: number;
    organizationId: string;
    _count?: {
        events: number;
    };
}

export const GeofencesManagement: React.FC = () => {
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);

    const fetchGeofences = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<{ success: boolean; data: Geofence[] }>('/api/geofences');

            if (response.data && response.data.success) {
                setGeofences(response.data.data);
                logger.info(`Geocercas cargadas: ${response.data.data.length}`);
            }
            setError(null);
        } catch (err) {
            logger.error('Error cargando geocercas:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGeofences();
    }, [fetchGeofences]);

    const handleSyncRadar = async () => {
        if (!confirm('¿Sincronizar geocercas desde Radar.com? Esto puede tardar unos segundos.')) {
            return;
        }

        try {
            setSyncing(true);
            // Llamar al script de importación desde Radar.com
            const response = await apiService.post('/api/geofences/sync-radar', {}) as any;

            if (response.data?.success) {
                logger.info('Geocercas sincronizadas desde Radar.com');
                await fetchGeofences();
                alert('Geocercas sincronizadas exitosamente desde Radar.com');
            }
        } catch (err) {
            logger.error('Error sincronizando con Radar.com:', err);
            alert('Error sincronizando con Radar.com. Ver consola para detalles.');
        } finally {
            setSyncing(false);
        }
    };

    const handleToggleEnabled = async (geofence: Geofence) => {
        try {
            await apiService.put(`/api/geofences/${geofence.id}`, {
                enabled: !geofence.enabled
            });
            logger.info(`Geocerca ${geofence.enabled ? 'desactivada' : 'activada'}:`, geofence.id);
            await fetchGeofences();
        } catch (err) {
            logger.error('Error actualizando geocerca:', err);
            alert('Error actualizando geocerca. Ver consola para detalles.');
        }
    };

    const handleDelete = async (geofence: Geofence) => {
        if (!confirm(`¿Eliminar geocerca "${geofence.name}"? Esto eliminará también todos los eventos asociados.`)) {
            return;
        }

        try {
            await apiService.delete(`/api/geofences/${geofence.id}`);
            logger.info('Geocerca eliminada:', geofence.id);
            await fetchGeofences();
        } catch (err) {
            logger.error('Error eliminando geocerca:', err);
            alert('Error eliminando geocerca. Ver consola para detalles.');
        }
    };

    const handleViewDetails = (geofence: Geofence) => {
        setSelectedGeofence(geofence);
        setOpenDialog(true);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    // Preparar datos para el mapa
    const mapGeofences = geofences.map(g => ({
        id: g.id,
        name: g.name,
        type: g.type.toLowerCase() as 'polygon' | 'circle',
        coordinates: g.geometry?.coordinates?.[0] || [],
        center: g.geometryCenter?.coordinates || [0, 0],
        radius: g.geometryRadius || 0,
        color: g.enabled ? '#2563eb' : '#9ca3af',
        description: g.description || '',
        enabled: g.enabled,
        tag: g.tag
    }));

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                    Gestión de Geocercas
                </Typography>
                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={syncing ? <CircularProgress size={20} /> : <Sync />}
                        onClick={handleSyncRadar}
                        disabled={syncing}
                    >
                        {syncing ? 'Sincronizando...' : 'Sync Radar.com'}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchGeofences}
                    >
                        Actualizar
                    </Button>
                </Box>
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
                                Total Geocercas
                            </Typography>
                            <Typography variant="h4">
                                {geofences.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Activas
                            </Typography>
                            <Typography variant="h4">
                                {geofences.filter(g => g.enabled).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Desde Radar.com
                            </Typography>
                            <Typography variant="h4">
                                {geofences.filter(g => g.externalId).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Eventos Registrados
                            </Typography>
                            <Typography variant="h4">
                                {geofences.reduce((sum, g) => sum + (g._count?.events || 0), 0)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Mapa de Geocercas */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Mapa de Geocercas
                    </Typography>
                    <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
                        <UnifiedMapComponent
                            center={[40.4168, -3.7038]}
                            zoom={11}
                            height="100%"
                            geofences={mapGeofences}
                            onGeofenceClick={(geofence) => {
                                const fullGeofence = geofences.find(g => g.id === geofence.id);
                                if (fullGeofence) handleViewDetails(fullGeofence);
                            }}
                            showControls={true}
                        />
                    </Box>
                </CardContent>
            </Card>

            {/* Tabla de Geocercas */}
            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Estado</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Tag</TableCell>
                            <TableCell>Origen</TableCell>
                            <TableCell align="center">Eventos</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {geofences.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Box sx={{ py: 4 }}>
                                        <Typography color="textSecondary" gutterBottom>
                                            No hay geocercas registradas
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Sync />}
                                            onClick={handleSyncRadar}
                                            sx={{ mt: 2 }}
                                        >
                                            Sincronizar desde Radar.com
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            geofences.map((geofence) => (
                                <TableRow key={geofence.id} hover>
                                    <TableCell>
                                        <Switch
                                            checked={geofence.enabled}
                                            onChange={() => handleToggleEnabled(geofence)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="medium">{geofence.name}</Typography>
                                        {geofence.description && (
                                            <Typography variant="caption" color="textSecondary">
                                                {geofence.description}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={geofence.type} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        {geofence.tag && (
                                            <Chip label={geofence.tag} size="small" color="secondary" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {geofence.externalId ? (
                                            <Chip label="Radar.com" size="small" color="primary" icon={<Sync />} />
                                        ) : (
                                            <Chip label="Manual" size="small" variant="outlined" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={geofence._count?.events || 0}
                                            size="small"
                                            color={geofence._count?.events ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Ver Detalles">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleViewDetails(geofence)}
                                            >
                                                <Map />
                                            </IconButton>
                                        </Tooltip>
                                        {!geofence.externalId && (
                                            <Tooltip title="Eliminar">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(geofence)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog Detalles */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedGeofence && (
                    <>
                        <DialogTitle>
                            {selectedGeofence.name}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ pt: 2 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Tipo
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedGeofence.type}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                            Estado
                                        </Typography>
                                        <Chip
                                            label={selectedGeofence.enabled ? 'Activa' : 'Inactiva'}
                                            color={selectedGeofence.enabled ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </Grid>
                                    {selectedGeofence.tag && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Tag
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedGeofence.tag}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {selectedGeofence.externalId && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Radar.com ID
                                            </Typography>
                                            <Typography variant="body1" gutterBottom fontFamily="monospace">
                                                {selectedGeofence.externalId}
                                            </Typography>
                                        </Grid>
                                    )}
                                    {selectedGeofence.geometryRadius && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Radio
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedGeofence.geometryRadius} metros
                                            </Typography>
                                        </Grid>
                                    )}
                                    {selectedGeofence.description && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" color="textSecondary">
                                                Descripción
                                            </Typography>
                                            <Typography variant="body1" gutterBottom>
                                                {selectedGeofence.description}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default GeofencesManagement;

