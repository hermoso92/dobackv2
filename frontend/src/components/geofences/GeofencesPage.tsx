import {
import { logger } from '../../utils/logger';
    Add,
    Delete,
    Edit,
    LocationOn,
    Map,
    Timeline,
    Visibility,
    VisibilityOff
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
    Fab,
    Grid,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeofences } from '../../hooks/useGeofences';
import { Geofence } from '../../types/geofence';
import { logger } from '../../utils/logger';
import { GeofenceEvents } from './GeofenceEvents';
import { GeofenceForm } from './GeofenceForm';
import { GeofenceImporter } from './GeofenceImporter';
import { GeofenceMap } from './GeofenceMap';

export const GeofencesPage: React.FC = () => {
    const { t } = useTranslation();
    const { geofences, loading, error, deleteGeofence, fetchGeofences } = useGeofences();

    const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [geofenceToDelete, setGeofenceToDelete] = useState<Geofence | null>(null);

    const handleCreateGeofence = () => {
        setSelectedGeofence(null);
        setShowForm(true);
    };

    const handleEditGeofence = (geofence: Geofence) => {
        setSelectedGeofence(geofence);
        setShowForm(true);
    };

    const handleDeleteGeofence = (geofence: Geofence) => {
        setGeofenceToDelete(geofence);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!geofenceToDelete) return;

        try {
            await deleteGeofence(geofenceToDelete.id);
            await fetchGeofences();
            setDeleteDialogOpen(false);
            setGeofenceToDelete(null);
        } catch (error) {
            logger.error('Error deleting geofence:', error);
        }
    };

    const handleViewMap = (geofence: Geofence) => {
        setSelectedGeofence(geofence);
        setShowMap(true);
    };

    const handleViewEvents = (geofence: Geofence) => {
        setSelectedGeofence(geofence);
        setShowEvents(true);
    };

    const getGeofenceTypeColor = (type: string) => {
        switch (type) {
            case 'POLYGON':
                return 'primary';
            case 'CIRCLE':
                return 'secondary';
            case 'RECTANGLE':
                return 'success';
            default:
                return 'default';
        }
    };

    const getGeofenceModeIcon = (mode: string) => {
        switch (mode) {
            case 'CAR':
                return '🚗';
            case 'FOOT':
                return '🚶';
            case 'BIKE':
                return '🚴';
            case 'ALL':
                return '🚦';
            default:
                return '📍';
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {t('geofences.title', 'Geocercas')}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {t('geofences.subtitle', 'Gestiona las geocercas de tu organización')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <GeofenceImporter onSuccess={fetchGeofences} />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateGeofence}
                        sx={{ minWidth: 200 }}
                    >
                        {t('geofences.create', 'Crear Geocerca')}
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Debug Info */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    🔍 Debug Info:
                </Typography>
                <Typography variant="body2">
                    • Cargando: {loading ? 'Sí' : 'No'}<br />
                    • Geocercas encontradas: {geofences.length}<br />
                    • Error: {error || 'Ninguno'}
                </Typography>
                <Button
                    size="small"
                    onClick={fetchGeofences}
                    sx={{ mt: 1 }}
                >
                    🔄 Recargar Geocercas
                </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('geofences.total', 'Total Geocercas')}
                            </Typography>
                            <Typography variant="h4">
                                {geofences.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('geofences.enabled', 'Habilitadas')}
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {geofences.filter(g => g.enabled).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('geofences.live', 'En Vivo')}
                            </Typography>
                            <Typography variant="h4" color="primary.main">
                                {geofences.filter(g => g.live).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('geofences.polygons', 'Polígonos')}
                            </Typography>
                            <Typography variant="h4" color="info.main">
                                {geofences.filter(g => g.type === 'POLYGON').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Geofences List */}
            <Grid container spacing={3}>
                {geofences.map((geofence) => (
                    <Grid item xs={12} sm={6} md={4} key={geofence.id}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" component="h3">
                                        {geofence.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {geofence.enabled ? (
                                            <Chip
                                                icon={<Visibility />}
                                                label={t('geofences.enabled', 'Habilitada')}
                                                color="success"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<VisibilityOff />}
                                                label={t('geofences.disabled', 'Deshabilitada')}
                                                color="default"
                                                size="small"
                                            />
                                        )}
                                        {geofence.live && (
                                            <Chip
                                                icon={<Timeline />}
                                                label={t('geofences.live', 'En Vivo')}
                                                color="primary"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Box>

                                {geofence.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {geofence.description}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <Chip
                                        label={geofence.type}
                                        color={getGeofenceTypeColor(geofence.type) as any}
                                        size="small"
                                    />
                                    <Chip
                                        label={`${getGeofenceModeIcon(geofence.mode)} ${geofence.mode}`}
                                        variant="outlined"
                                        size="small"
                                    />
                                    {geofence.tag && (
                                        <Chip
                                            label={geofence.tag}
                                            variant="outlined"
                                            size="small"
                                        />
                                    )}
                                </Box>

                                {geofence.geometryCenter && (
                                    <Typography variant="caption" color="text.secondary">
                                        📍 {geofence.geometryCenter.coordinates[1].toFixed(6)}, {geofence.geometryCenter.coordinates[0].toFixed(6)}
                                    </Typography>
                                )}
                            </CardContent>

                            <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                                <Tooltip title={t('geofences.viewMap', 'Ver en Mapa')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleViewMap(geofence)}
                                        color="primary"
                                    >
                                        <Map />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('geofences.viewEvents', 'Ver Eventos')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleViewEvents(geofence)}
                                        color="info"
                                    >
                                        <Timeline />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('geofences.edit', 'Editar')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEditGeofence(geofence)}
                                        color="warning"
                                    >
                                        <Edit />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={t('geofences.delete', 'Eliminar')}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteGeofence(geofence)}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Empty State */}
            {geofences.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('geofences.empty.title', 'No hay geocercas')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        {t('geofences.empty.description', 'Crea tu primera geocerca para comenzar a monitorear ubicaciones')}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateGeofence}
                    >
                        {t('geofences.create', 'Crear Geocerca')}
                    </Button>
                </Box>
            )}

            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="add"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={handleCreateGeofence}
            >
                <Add />
            </Fab>

            {/* Dialogs */}
            <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedGeofence ? t('geofences.edit', 'Editar Geocerca') : t('geofences.create', 'Crear Geocerca')}
                </DialogTitle>
                <DialogContent>
                    <GeofenceForm
                        geofence={selectedGeofence}
                        onClose={() => setShowForm(false)}
                        onSuccess={() => {
                            setShowForm(false);
                            fetchGeofences();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showMap} onClose={() => setShowMap(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {t('geofences.map', 'Mapa de Geocerca')} - {selectedGeofence?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedGeofence && (
                        <GeofenceMap geofence={selectedGeofence} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowMap(false)}>
                        {t('common.close', 'Cerrar')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={showEvents} onClose={() => setShowEvents(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {t('geofences.events', 'Eventos de Geocerca')} - {selectedGeofence?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedGeofence && (
                        <GeofenceEvents geofence={selectedGeofence} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowEvents(false)}>
                        {t('common.close', 'Cerrar')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>
                    {t('geofences.deleteConfirm.title', 'Confirmar Eliminación')}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('geofences.deleteConfirm.message', '¿Estás seguro de que quieres eliminar la geocerca')} "{geofenceToDelete?.name}"?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {t('geofences.deleteConfirm.warning', 'Esta acción no se puede deshacer')}
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        {t('common.delete', 'Eliminar')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
