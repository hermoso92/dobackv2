import { Box, Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParkKPI } from '../hooks/useParkKPI';
import { useParks } from '../hooks/useParks';
import AdvancedTimeseriesChart from './AdvancedTimeseriesChart';

interface ParkKPIWidgetProps {
    parkId?: string;
    token: string;
    onParkSelect?: (parkId: string) => void;
}

const eventTypes = [
    { value: '', label: 'Todos' },
    { value: 'critical', label: 'Crítico' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'danger', label: 'Peligroso' },
];

export const ParkKPIWidget: React.FC<ParkKPIWidgetProps> = ({ parkId, token, onParkSelect }) => {
    const { parks } = useParks(token);

    // Filtros persistentes
    const [selectedParkId, setSelectedParkId] = useState(parkId || '');
    const [date, setDate] = useState('');
    const [eventType, setEventType] = useState('');
    const [severity, setSeverity] = useState('');
    const [filters, setFilters] = useState({ parkId: selectedParkId, date, eventType, severity });

    useEffect(() => {
        setFilters({ parkId: selectedParkId, date, eventType, severity });
    }, [selectedParkId, date, eventType, severity]);

    const { kpi, loading, error, refetch } = useParkKPI(selectedParkId, token, date);

    const handleParkChange = (newParkId: string) => {
        setSelectedParkId(newParkId);
        if (onParkSelect) {
            onParkSelect(newParkId);
        }
    };

    const selectedPark = parks?.find(p => p.id === selectedParkId);

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>KPIs de Parque</Typography>

                {/* Selector de Parque */}
                <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Seleccionar Parque</InputLabel>
                        <Select
                            value={selectedParkId}
                            label="Seleccionar Parque"
                            onChange={(e) => handleParkChange(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>Selecciona un parque</em>
                            </MenuItem>
                            {parks?.map((park) => (
                                <MenuItem key={park.id} value={park.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={park.name}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            ({park.identifier || park.id})
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {selectedParkId ? (
                    <>
                        {/* Filtros adicionales */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            <TextField
                                label="Fecha"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                size="small"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                            />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Tipo Evento</InputLabel>
                                <Select
                                    value={eventType}
                                    label="Tipo Evento"
                                    onChange={e => setEventType(e.target.value)}
                                >
                                    {eventTypes.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Severidad"
                                value={severity}
                                onChange={e => setSeverity(e.target.value)}
                                size="small"
                            />
                            <Button
                                onClick={() => { setDate(''); setEventType(''); setSeverity(''); }}
                                variant="outlined"
                                size="small"
                            >
                                Limpiar
                            </Button>
                            <Button onClick={refetch} variant="contained" size="small">
                                Refrescar
                            </Button>
                        </Box>

                        {/* Información del parque seleccionado */}
                        {selectedPark && (
                            <Box sx={{ mb: 2, p: 1, backgroundColor: 'primary.light', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: 'primary.contrastText' }}>
                                    Parque: {selectedPark.name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                                    ID: {selectedPark.identifier || selectedPark.id}
                                </Typography>
                            </Box>
                        )}

                        {/* KPIs */}
                        {loading && <Typography>Cargando KPIs...</Typography>}
                        {error && <Typography color="error">Error: {error}</Typography>}
                        {kpi && (
                            <Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                                    <Card sx={{ p: 1, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                                        <Typography variant="h6" color="primary">
                                            {(kpi.totalClave2 / 60 || 0).toFixed(1)}h
                                        </Typography>
                                        <Typography variant="caption">Clave 2</Typography>
                                    </Card>
                                    <Card sx={{ p: 1, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
                                        <Typography variant="h6" color="success.main">
                                            {(kpi.totalClave5 / 60 || 0).toFixed(1)}h
                                        </Typography>
                                        <Typography variant="caption">Clave 5</Typography>
                                    </Card>
                                    <Card sx={{ p: 1, textAlign: 'center', backgroundColor: '#ffebee' }}>
                                        <Typography variant="h6" color="error">
                                            {kpi.totalEventsHigh || 0}
                                        </Typography>
                                        <Typography variant="caption">Eventos Críticos</Typography>
                                    </Card>
                                    <Card sx={{ p: 1, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                                        <Typography variant="h6" color="warning.main">
                                            {kpi.totalEventsModerate || 0}
                                        </Typography>
                                        <Typography variant="caption">Eventos Moderados</Typography>
                                    </Card>
                                </Box>

                                {/* Gráficos de tendencias */}
                                {kpi.timeseries && kpi.timeseries.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Tendencias</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                                            <AdvancedTimeseriesChart
                                                data={kpi.timeseries}
                                                xKey="date"
                                                yKey="totalClave2"
                                                title="Horas Clave 2"
                                                color="#1976d2"
                                                height={200}
                                                maxPoints={30}
                                            />
                                            <AdvancedTimeseriesChart
                                                data={kpi.timeseries}
                                                xKey="date"
                                                yKey="totalClave5"
                                                title="Horas Clave 5"
                                                color="#388e3c"
                                                height={200}
                                                maxPoints={30}
                                            />
                                            <AdvancedTimeseriesChart
                                                data={kpi.timeseries}
                                                xKey="date"
                                                yKey="totalEventsHigh"
                                                title="Eventos Críticos"
                                                color="#d32f2f"
                                                height={200}
                                                maxPoints={30}
                                            />
                                            <AdvancedTimeseriesChart
                                                data={kpi.timeseries}
                                                xKey="date"
                                                yKey="totalEventsModerate"
                                                title="Eventos Moderados"
                                                color="#fbc02d"
                                                height={200}
                                                maxPoints={30}
                                            />
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Selecciona un parque para ver sus KPIs
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}; 