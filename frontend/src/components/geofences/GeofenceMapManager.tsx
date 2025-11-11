/**
 * 🗺️ GESTOR DE MAPA INTERACTIVO DE GEOCERCAS
 * 
 * Componente principal para crear, editar y visualizar geocercas en mapa interactivo
 * - Leaflet + Leaflet Draw para dibujo
 * - Soporte para polígonos, círculos y rectángulos
 * - CRUD completo de geocercas
 * 
 * @version 1.0
 * @date 2025-11-05
 */

import {
    Cancel,
    Delete,
    MyLocation,
    Save,
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
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { useGeofences } from '../../hooks/useGeofences';
import { Geofence, GeofenceFormData } from '../../types/geofence';
import { logger } from '../../utils/logger';

// Configuración de iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const GeofenceMapManager: React.FC = () => {
    const { geofences, loading, error, createGeofence, updateGeofence, deleteGeofence, fetchGeofences } = useGeofences();

    // Refs del mapa
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
    const editLayersRef = useRef<Map<string, L.Layer>>(new Map());

    // Estados del componente
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [drawingMode, setDrawingMode] = useState<'POLYGON' | 'CIRCLE' | 'RECTANGLE' | null>(null);
    const [currentLayer, setCurrentLayer] = useState<L.Layer | null>(null);

    // Form data
    const [formData, setFormData] = useState<Partial<GeofenceFormData>>({
        name: '',
        description: '',
        tag: '',
        type: 'POLYGON',
        mode: 'CAR',
        enabled: true,
        live: true,
    });

    // Coordenadas de Madrid como centro por defecto
    const madridCenter: [number, number] = [40.4168, -3.7038];

    // Inicializar mapa
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        try {
            // Crear mapa
            const map = L.map(mapRef.current).setView(madridCenter, 12);
            mapInstanceRef.current = map;

            // Agregar capa de tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
                minZoom: 10
            }).addTo(map);

            // Agregar grupo para dibujos
            drawnItemsRef.current.addTo(map);

            // Configurar controles de dibujo
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: drawnItemsRef.current,
                    remove: false // Usaremos botón personalizado para eliminar
                },
                draw: {
                    polygon: {
                        allowIntersection: false,
                        drawError: {
                            color: '#e74c3c',
                            message: 'No se pueden dibujar polígonos que se crucen'
                        },
                        shapeOptions: {
                            color: '#3498db',
                            fillOpacity: 0.2
                        }
                    },
                    circle: {
                        shapeOptions: {
                            color: '#2ecc71',
                            fillOpacity: 0.2
                        }
                    },
                    rectangle: {
                        shapeOptions: {
                            color: '#f39c12',
                            fillOpacity: 0.2
                        }
                    },
                    polyline: false,
                    marker: false,
                    circlemarker: false
                }
            });

            map.addControl(drawControl);

            // Evento cuando se crea una nueva forma
            map.on(L.Draw.Event.CREATED, (e: any) => {
                const layer = e.layer;
                const type = e.layerType;

                // Agregar al mapa temporalmente
                drawnItemsRef.current.addLayer(layer);
                setCurrentLayer(layer);

                // Determinar tipo de geometría
                let geofenceType: 'POLYGON' | 'CIRCLE' | 'RECTANGLE' = 'POLYGON';
                if (type === 'circle') geofenceType = 'CIRCLE';
                if (type === 'rectangle') geofenceType = 'RECTANGLE';

                setFormData(prev => ({
                    ...prev,
                    type: geofenceType,
                    geometry: layer.toGeoJSON(),
                }));

                // Si es círculo, guardar centro y radio
                if (type === 'circle') {
                    const circle = layer as L.Circle;
                    const center = circle.getLatLng();
                    const radius = circle.getRadius();

                    setFormData(prev => ({
                        ...prev,
                        geometryCenter: {
                            type: 'Point',
                            coordinates: [center.lng, center.lat]
                        },
                        geometryRadius: radius
                    }));
                }

                setShowForm(true);
                logger.info('Nueva forma dibujada', { type: geofenceType });
            });

            // Evento cuando se edita una forma
            map.on(L.Draw.Event.EDITED, (e: any) => {
                const layers = e.layers;
                layers.eachLayer((layer: L.Layer) => {
                    logger.info('Forma editada', { layer });
                    // Actualizar geocerca si está asociada
                    editLayersRef.current.forEach((storedLayer, geofenceId) => {
                        if (storedLayer === layer) {
                            logger.info('Geocerca editada', { geofenceId });
                            // TODO: Actualizar geometría en BD
                        }
                    });
                });
            });

            setMapLoaded(true);
            setMapError(null);

        } catch (err) {
            logger.error('Error inicializando mapa:', err);
            setMapError('Error al cargar el mapa');
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Cargar geocercas existentes en el mapa
    useEffect(() => {
        if (!mapInstanceRef.current || !mapLoaded) return;

        // Limpiar capas existentes
        editLayersRef.current.forEach(layer => {
            drawnItemsRef.current.removeLayer(layer);
        });
        editLayersRef.current.clear();

        // Agregar geocercas al mapa
        geofences.forEach((geofence) => {
            try {
                const layer = addGeofenceToMap(geofence);
                if (layer) {
                    editLayersRef.current.set(geofence.id, layer);
                }
            } catch (err) {
                logger.error(`Error agregando geocerca ${geofence.name}:`, err);
            }
        });

    }, [geofences, mapLoaded]);

    const addGeofenceToMap = (geofence: Geofence): L.Layer | null => {
        if (!mapInstanceRef.current) return null;

        try {
            let layer: L.Layer | null = null;

            if (geofence.type === 'CIRCLE' && geofence.geometryCenter && geofence.geometryRadius) {
                const [lng, lat] = geofence.geometryCenter.coordinates;
                layer = L.circle([lat, lng], {
                    radius: geofence.geometryRadius,
                    color: geofence.enabled ? '#2ecc71' : '#95a5a6',
                    fillOpacity: 0.2
                });
            } else if (geofence.type === 'POLYGON' && geofence.geometry?.coordinates?.[0]) {
                const coords = geofence.geometry.coordinates[0].map((c: number[]) => [c[1], c[0]]);
                layer = L.polygon(coords, {
                    color: geofence.enabled ? '#3498db' : '#95a5a6',
                    fillOpacity: 0.2
                });
            } else if (geofence.type === 'RECTANGLE' && geofence.geometry?.bounds) {
                const { north, south, east, west } = geofence.geometry.bounds;
                layer = L.rectangle([[south, west], [north, east]], {
                    color: geofence.enabled ? '#f39c12' : '#95a5a6',
                    fillOpacity: 0.2
                });
            }

            if (layer) {
                layer.bindPopup(`
                    <div style="font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; color: #2c3e50;">${geofence.name}</h4>
                        <p style="margin: 4px 0; font-size: 13px; color: #7f8c8d;">${geofence.description || 'Sin descripción'}</p>
                        <div style="margin-top: 8px;">
                            <span style="background: ${geofence.enabled ? '#27ae60' : '#95a5a6'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">
                                ${geofence.enabled ? 'ACTIVA' : 'INACTIVA'}
                            </span>
                            <span style="background: #3498db; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 4px;">
                                ${geofence.type}
                            </span>
                        </div>
                    </div>
                `);

                layer.on('click', () => {
                    setSelectedGeofence(geofence);
                });

                drawnItemsRef.current.addLayer(layer);
                return layer;
            }
        } catch (err) {
            logger.error(`Error creando capa para geocerca ${geofence.name}:`, err);
        }

        return null;
    };

    const handleSaveGeofence = async () => {
        if (!formData.name || !formData.geometry) {
            logger.warn('Datos incompletos para guardar geocerca');
            return;
        }

        try {
            await createGeofence(formData as GeofenceFormData);
            logger.info('Geocerca creada exitosamente');

            // Limpiar formulario y capa temporal
            setShowForm(false);
            setFormData({
                name: '',
                description: '',
                tag: '',
                type: 'POLYGON',
                mode: 'CAR',
                enabled: true,
                live: true,
            });

            if (currentLayer) {
                drawnItemsRef.current.removeLayer(currentLayer);
                setCurrentLayer(null);
            }

            // Recargar geocercas
            await fetchGeofences();

        } catch (err) {
            logger.error('Error guardando geocerca:', err);
        }
    };

    const handleCancelDrawing = () => {
        setShowForm(false);
        if (currentLayer) {
            drawnItemsRef.current.removeLayer(currentLayer);
            setCurrentLayer(null);
        }
        setFormData({
            name: '',
            description: '',
            tag: '',
            type: 'POLYGON',
            mode: 'CAR',
            enabled: true,
            live: true,
        });
    };

    const handleDeleteGeofence = async (geofenceId: string) => {
        try {
            await deleteGeofence(geofenceId);
            logger.info('Geocerca eliminada');
            setSelectedGeofence(null);
            await fetchGeofences();
        } catch (err) {
            logger.error('Error eliminando geocerca:', err);
        }
    };

    const handleToggleGeofence = async (geofence: Geofence) => {
        try {
            await updateGeofence(geofence.id, { enabled: !geofence.enabled });
            logger.info('Estado de geocerca actualizado');
            await fetchGeofences();
        } catch (err) {
            logger.error('Error actualizando geocerca:', err);
        }
    };

    const centerMapOnGeofence = (geofence: Geofence) => {
        if (!mapInstanceRef.current) return;

        if (geofence.geometryCenter) {
            const [lng, lat] = geofence.geometryCenter.coordinates;
            mapInstanceRef.current.setView([lat, lng], 15);
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
        <Box>
            {/* Error del mapa */}
            {(mapError || error) && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mapError || error}
                </Alert>
            )}

            {/* Estadísticas rápidas */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="h5" color="primary">{geofences.length}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Geocercas</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="h5" color="success.main">
                                {geofences.filter(g => g.enabled).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Activas</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="h5" color="info.main">
                                {geofences.filter(g => g.type === 'CIRCLE').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Círculos</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="h5" color="warning.main">
                                {geofences.filter(g => g.type === 'POLYGON').length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Polígonos</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Mapa interactivo */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Mapa Interactivo de Geocercas
                        </Typography>
                        {selectedGeofence && (
                            <Box>
                                <Chip
                                    label={selectedGeofence.name}
                                    onDelete={() => setSelectedGeofence(null)}
                                    color="primary"
                                    sx={{ mr: 1 }}
                                />
                                <Tooltip title="Centrar en mapa">
                                    <IconButton
                                        size="small"
                                        onClick={() => centerMapOnGeofence(selectedGeofence)}
                                        color="primary"
                                    >
                                        <MyLocation />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={selectedGeofence.enabled ? 'Desactivar' : 'Activar'}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleToggleGeofence(selectedGeofence)}
                                        color={selectedGeofence.enabled ? 'success' : 'default'}
                                    >
                                        {selectedGeofence.enabled ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteGeofence(selectedGeofence.id)}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Usa las herramientas de dibujo en el mapa para crear nuevas geocercas.
                        Haz clic en una geocerca existente para seleccionarla.
                    </Typography>

                    <Box
                        ref={mapRef}
                        sx={{
                            height: '600px',
                            width: '100%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px solid',
                            borderColor: 'divider',
                            boxShadow: 2,
                        }}
                    >
                        {!mapLoaded && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1000
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Dialog para crear nueva geocerca */}
            <Dialog
                open={showForm}
                onClose={handleCancelDrawing}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Crear Nueva Geocerca - {formData.type}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Descripción"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Etiqueta (tag)"
                                    value={formData.tag || ''}
                                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                    placeholder="parque, taller, zona..."
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Modo</InputLabel>
                                    <Select
                                        value={formData.mode || 'CAR'}
                                        onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                                        label="Modo"
                                    >
                                        <MenuItem value="CAR">Automóvil</MenuItem>
                                        <MenuItem value="FOOT">A Pie</MenuItem>
                                        <MenuItem value="BIKE">Bicicleta</MenuItem>
                                        <MenuItem value="ALL">Todos</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.enabled || false}
                                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                        />
                                    }
                                    label="Habilitada"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.live || false}
                                            onChange={(e) => setFormData({ ...formData, live: e.target.checked })}
                                        />
                                    }
                                    label="En Vivo"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDrawing} startIcon={<Cancel />}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveGeofence}
                        variant="contained"
                        startIcon={<Save />}
                        disabled={!formData.name || !formData.geometry}
                    >
                        Guardar Geocerca
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};











