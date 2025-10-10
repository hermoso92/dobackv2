import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { useEventClusters } from '../hooks/useEventClusters';

interface EventClusterMapProps {
    token: string;
    parks: any[];
    vehicles: any[];
    selectedEvent?: any;
    onSelectEvent?: (event: any) => void;
}

const eventTypes = [
    { value: '', label: 'Todos' },
    { value: 'critical', label: 'Crítico' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'danger', label: 'Peligroso' },
];

export const EventClusterMap: React.FC<EventClusterMapProps> = ({ token, parks, vehicles, selectedEvent, onSelectEvent }) => {
    // Filtros persistentes
    const [parkId, setParkId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [eventType, setEventType] = useState('');
    const [severity, setSeverity] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    // Solo strings para URLSearchParams
    const filters = useMemo(() => ({
        parkId: parkId || '',
        vehicleId: vehicleId || '',
        eventType: eventType || '',
        severity: severity || '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || ''
    }), [parkId, vehicleId, eventType, severity, dateFrom, dateTo]);

    useEffect(() => {
        // setFilters({ parkId, vehicleId, eventType, severity, dateFrom, dateTo }); // This line is removed as per new_code
    }, [parkId, vehicleId, eventType, severity, dateFrom, dateTo]);

    const { clusters, loading, error, refetch } = useEventClusters(filters, token);

    const safeVehicles = Array.isArray(vehicles) ? vehicles : [];

    // Centrado dinámico si hay evento seleccionado
    const defaultCenter: [number, number] = [40.4168, -3.7038];
    const mapCenter: [number, number] = selectedEvent ? [selectedEvent.lat, selectedEvent.lon] : defaultCenter;

    return (
        <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Filtros Clustering / Heatmap</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Parque</InputLabel>
                    <Select
                        value={parkId}
                        label="Parque"
                        onChange={e => setParkId(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {parks.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Vehículo</InputLabel>
                    <Select
                        value={vehicleId}
                        label="Vehículo"
                        onChange={e => setVehicleId(e.target.value)}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {safeVehicles.map((v: any) => <MenuItem key={v.id} value={v.id}>{v.identifier || v.licensePlate}</MenuItem>)}
                    </Select>
                </FormControl>
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
                <TextField
                    label="Desde"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Hasta"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    size="small"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                />
                <Button onClick={() => { setParkId(''); setVehicleId(''); setEventType(''); setSeverity(''); setDateFrom(''); setDateTo(''); }} variant="outlined">Limpiar filtros</Button>
                <Button onClick={refetch} variant="contained">Refrescar</Button>
            </Box>
            {loading && <div>Cargando clusters...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            <Box sx={{ width: '100%', height: 400, mt: 2 }}>
                <MapContainer center={mapCenter} zoom={selectedEvent ? 15 : 11} style={{ height: 400, width: '100%' }} scrollWheelZoom>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {clusters && clusters.map((cluster: any, idx: number) => (
                        <CircleMarker
                            key={idx}
                            center={[cluster.lat, cluster.lon] as [number, number]}
                            radius={Math.max(8, Math.min(30, cluster.count))}
                            pathOptions={{ color: (selectedEvent && cluster.lat === selectedEvent.lat && cluster.lon === selectedEvent.lon) ? 'lime' : (cluster.severity === 'critical' ? 'red' : cluster.severity === 'moderate' ? 'orange' : 'blue'), fillOpacity: 0.5 }}
                            eventHandlers={onSelectEvent ? { click: () => onSelectEvent(cluster) } : undefined}
                        >
                            <Tooltip>
                                <div>
                                    <strong>Eventos:</strong> {cluster.count}<br />
                                    <strong>Tipo:</strong> {cluster.type}<br />
                                    <strong>Severidad:</strong> {cluster.severity}<br />
                                    <strong>Vehículo:</strong> {cluster.vehicleIdentifier || '-'}<br />
                                    <strong>Fecha:</strong> {cluster.date || '-'}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </Box>
        </Box>
    );
}; 