import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeofences } from '../../hooks/useGeofences';
import { Geofence, GeofenceFormData } from '../../types/geofence';

interface GeofenceFormProps {
    geofence?: Geofence | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const GeofenceForm: React.FC<GeofenceFormProps> = ({
    geofence,
    onClose,
    onSuccess,
}) => {
    const { t } = useTranslation();
    const { createGeofence, updateGeofence } = useGeofences();

    const [formData, setFormData] = useState<GeofenceFormData>({
        name: '',
        description: '',
        tag: '',
        type: 'POLYGON',
        mode: 'CAR',
        enabled: true,
        live: true,
        geometry: null,
        geometryCenter: undefined,
        geometryRadius: undefined,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (geofence) {
            setFormData({
                name: geofence.name,
                description: geofence.description || '',
                tag: geofence.tag || '',
                type: geofence.type,
                mode: geofence.mode,
                enabled: geofence.enabled,
                live: geofence.live,
                geometry: geofence.geometry,
                geometryCenter: geofence.geometryCenter,
                geometryRadius: geofence.geometryRadius,
            });
        }
    }, [geofence]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError(t('geofences.form.errors.nameRequired', 'El nombre es requerido'));
            return;
        }

        if (!formData.geometry) {
            setError(t('geofences.form.errors.geometryRequired', 'La geometría es requerida'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (geofence) {
                await updateGeofence(geofence.id, formData);
            } else {
                await createGeofence(formData);
            }
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('geofences.form.errors.generic', 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof GeofenceFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleGeometryChange = (geometry: any) => {
        setFormData(prev => ({
            ...prev,
            geometry,
        }));
    };

    const handleCenterChange = (coordinates: [number, number]) => {
        setFormData(prev => ({
            ...prev,
            geometryCenter: {
                type: 'Point',
                coordinates,
            },
        }));
    };

    const handleRadiusChange = (radius: number) => {
        setFormData(prev => ({
            ...prev,
            geometryRadius: radius,
        }));
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        {t('geofences.form.basicInfo', 'Información Básica')}
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('geofences.form.name', 'Nombre')}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        disabled={loading}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label={t('geofences.form.tag', 'Etiqueta')}
                        value={formData.tag}
                        onChange={(e) => handleInputChange('tag', e.target.value)}
                        disabled={loading}
                        placeholder={t('geofences.form.tagPlaceholder', 'ej. parque, taller, zona')}
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label={t('geofences.form.description', 'Descripción')}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        disabled={loading}
                    />
                </Grid>

                {/* Configuration */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        {t('geofences.form.configuration', 'Configuración')}
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={loading}>
                        <InputLabel>{t('geofences.form.type', 'Tipo')}</InputLabel>
                        <Select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            label={t('geofences.form.type', 'Tipo')}
                        >
                            <MenuItem value="POLYGON">{t('geofences.form.types.polygon', 'Polígono')}</MenuItem>
                            <MenuItem value="CIRCLE">{t('geofences.form.types.circle', 'Círculo')}</MenuItem>
                            <MenuItem value="RECTANGLE">{t('geofences.form.types.rectangle', 'Rectángulo')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={loading}>
                        <InputLabel>{t('geofences.form.mode', 'Modo')}</InputLabel>
                        <Select
                            value={formData.mode}
                            onChange={(e) => handleInputChange('mode', e.target.value)}
                            label={t('geofences.form.mode', 'Modo')}
                        >
                            <MenuItem value="CAR">{t('geofences.form.modes.car', 'Automóvil')}</MenuItem>
                            <MenuItem value="FOOT">{t('geofences.form.modes.foot', 'A Pie')}</MenuItem>
                            <MenuItem value="BIKE">{t('geofences.form.modes.bike', 'Bicicleta')}</MenuItem>
                            <MenuItem value="ALL">{t('geofences.form.modes.all', 'Todos')}</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.enabled}
                                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label={t('geofences.form.enabled', 'Habilitada')}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.live}
                                onChange={(e) => handleInputChange('live', e.target.checked)}
                                disabled={loading}
                            />
                        }
                        label={t('geofences.form.live', 'En Vivo')}
                    />
                </Grid>

                {/* Geometry Configuration */}
                {formData.type === 'CIRCLE' && (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                {t('geofences.form.geometry', 'Geometría')}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={t('geofences.form.centerLat', 'Latitud del Centro')}
                                type="number"
                                value={formData.geometryCenter?.coordinates[1] || ''}
                                onChange={(e) => {
                                    const lat = parseFloat(e.target.value);
                                    const lng = formData.geometryCenter?.coordinates[0] || 0;
                                    handleCenterChange([lng, lat]);
                                }}
                                disabled={loading}
                                inputProps={{ step: 'any' }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={t('geofences.form.centerLng', 'Longitud del Centro')}
                                type="number"
                                value={formData.geometryCenter?.coordinates[0] || ''}
                                onChange={(e) => {
                                    const lng = parseFloat(e.target.value);
                                    const lat = formData.geometryCenter?.coordinates[1] || 0;
                                    handleCenterChange([lng, lat]);
                                }}
                                disabled={loading}
                                inputProps={{ step: 'any' }}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label={t('geofences.form.radius', 'Radio (metros)')}
                                type="number"
                                value={formData.geometryRadius || ''}
                                onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
                                disabled={loading}
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                    </>
                )}

                {/* Import from Radar.com */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            {t('geofences.form.importRadar', 'Importar desde Radar.com')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('geofences.form.importRadarDescription', 'Pega los datos JSON de radar.com para importar automáticamente')}
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                // TODO: Implementar importación desde radar.com
                                alert('Funcionalidad de importación desde radar.com próximamente');
                            }}
                            disabled={loading}
                        >
                            {t('geofences.form.import', 'Importar')}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                >
                    {t('common.cancel', 'Cancelar')}
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {geofence ? t('common.update', 'Actualizar') : t('common.create', 'Crear')}
                </Button>
            </Box>
        </Box>
    );
};
