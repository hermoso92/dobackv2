import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Switch,
    Typography
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { HeatmapData } from '../../types/panel';

interface HeatmapViewProps {
    data: HeatmapData;
    loading?: boolean;
    error?: string;
    onPointClick?: (point: any) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
    data,
    loading = false,
    error,
    onPointClick
}) => {
    const [radius, setRadius] = useState(20);
    const [opacity, setOpacity] = useState(0.6);
    const [showIntensity, setShowIntensity] = useState(true);
    const [selectedType, setSelectedType] = useState<'speeding' | 'critical' | 'violations'>('speeding');

    const getPointColor = useCallback((intensity: number) => {
        if (intensity >= 0.8) return '#ff0000'; // Rojo - alta intensidad
        if (intensity >= 0.6) return '#ff6600'; // Naranja
        if (intensity >= 0.4) return '#ffcc00'; // Amarillo
        if (intensity >= 0.2) return '#66ff00'; // Verde claro
        return '#00ff00'; // Verde - baja intensidad
    }, []);

    const getIntensityLabel = useCallback((intensity: number) => {
        if (intensity >= 0.8) return 'Muy Alta';
        if (intensity >= 0.6) return 'Alta';
        if (intensity >= 0.4) return 'Media';
        if (intensity >= 0.2) return 'Baja';
        return 'Muy Baja';
    }, []);

    const handlePointClick = useCallback((point: any) => {
        if (onPointClick) {
            onPointClick(point);
        }
    }, [onPointClick]);

    if (error) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Alert severity="error">
                        Error cargando datos del heatmap: {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Box className="flex items-center justify-center h-64">
                        <Typography>Cargando datos del heatmap...</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.points || data.points.length === 0) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Alert severity="info">
                        No hay datos disponibles para el heatmap seleccionado
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <Box className="mb-4">
                    <Typography variant="h6" className="mb-2">
                        Mapa de Calor - {data.type === 'speeding' ? 'Excesos de Velocidad' :
                            data.type === 'critical' ? 'Eventos Críticos' : 'Violaciones'}
                    </Typography>

                    <Grid container spacing={2} className="mb-4">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo</InputLabel>
                                <Select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as any)}
                                    label="Tipo"
                                >
                                    <MenuItem value="speeding">Excesos de Velocidad</MenuItem>
                                    <MenuItem value="critical">Eventos Críticos</MenuItem>
                                    <MenuItem value="violations">Violaciones</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" className="mb-1">
                                Radio: {radius}px
                            </Typography>
                            <Slider
                                value={radius}
                                onChange={(_, value) => setRadius(value as number)}
                                min={10}
                                max={50}
                                step={5}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" className="mb-1">
                                Opacidad: {Math.round(opacity * 100)}%
                            </Typography>
                            <Slider
                                value={opacity}
                                onChange={(_, value) => setOpacity(value as number)}
                                min={0.1}
                                max={1}
                                step={0.1}
                                size="small"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showIntensity}
                                        onChange={(e) => setShowIntensity(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label="Mostrar Intensidad"
                            />
                        </Grid>
                    </Grid>

                    {/* Leyenda de colores */}
                    <Box className="flex items-center gap-2 mb-4">
                        <Typography variant="body2" className="text-gray-600">
                            Intensidad:
                        </Typography>
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
                            <Box key={intensity} className="flex items-center gap-1">
                                <Box
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: getPointColor(intensity) }}
                                />
                                <Typography variant="caption">
                                    {getIntensityLabel(intensity)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Estadísticas */}
                    <Box className="flex gap-2 mb-4">
                        <Chip
                            label={`${data.points.length} puntos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`Intensidad promedio: ${(data.points.reduce((sum, p) => sum + p.intensity, 0) / data.points.length).toFixed(2)}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                {/* Mapa */}
                <Box className="h-96 w-full">
                    <MapContainer
                        center={[40.4168, -3.7038]} // Madrid por defecto
                        zoom={10}
                        className="h-full w-full"
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {data.points.map((point, index) => (
                            <CircleMarker
                                key={index}
                                center={[point.lat, point.lng]}
                                radius={radius}
                                pathOptions={{
                                    color: getPointColor(point.intensity),
                                    fillColor: getPointColor(point.intensity),
                                    fillOpacity: opacity,
                                    weight: 2
                                }}
                                eventHandlers={{
                                    click: () => handlePointClick(point)
                                }}
                            >
                                <Popup>
                                    <Box className="p-2">
                                        <Typography variant="subtitle2" className="mb-1">
                                            {data.type === 'speeding' ? 'Exceso de Velocidad' :
                                                data.type === 'critical' ? 'Evento Crítico' : 'Violación'}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Vehículo:</strong> {point.vehicleId}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Fecha:</strong> {new Date(point.timestamp).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" className="mb-1">
                                            <strong>Intensidad:</strong> {getIntensityLabel(point.intensity)}
                                        </Typography>
                                        {point.eventType && (
                                            <Typography variant="body2">
                                                <strong>Tipo:</strong> {point.eventType}
                                            </Typography>
                                        )}
                                    </Box>
                                </Popup>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </Box>
            </CardContent>
        </Card>
    );
};
