import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
    useTheme
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import * as XLSX from 'xlsx';
import { StabilityIndexEvent } from '../hooks/useStabilityIndexEvents';

interface OptimizedEventListProps {
    events: StabilityIndexEvent[];
    height: number;
    onEventClick?: (event: StabilityIndexEvent) => void;
    selectedEventId?: string | null;
    parks?: any[];
    vehicles?: any[];
}

interface EventItemProps {
    index: number;
    style: React.CSSProperties;
    data: {
        events: StabilityIndexEvent[];
        onEventClick?: (event: StabilityIndexEvent) => void;
        selectedEventId?: string | null;
    };
}

const EventItem: React.FC<EventItemProps> = ({ index, style, data }) => {
    const theme = useTheme();
    const { events, onEventClick, selectedEventId } = data;
    const event = events[index];

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return theme.palette.error.main;
            case 'danger': return theme.palette.warning.main;
            case 'moderate': return theme.palette.info.main;
            default: return theme.palette.success.main;
        }
    };

    const getLevelLabel = (level: string) => {
        switch (level) {
            case 'critical': return 'CRÍTICO';
            case 'danger': return 'PELIGROSO';
            case 'moderate': return 'MODERADO';
            default: return 'PUNTO INTERÉS';
        }
    };

    const isSelected = selectedEventId === `${event.lat}-${event.lon}-${event.timestamp}`;

    return (
        <div style={style}>
            <Card
                sx={{
                    m: 1,
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                        boxShadow: theme.shadows[4]
                    }
                }}
                onClick={() => onEventClick?.(event)}
            >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Checkbox checked={selectedIds.includes(event.id || `${event.timestamp}-${event.lat}-${event.lon}`)} onChange={() => handleSelect(event.id || `${event.timestamp}-${event.lat}-${event.lon}`)} />
                        <Chip
                            label={getLevelLabel(event.level)}
                            color={event.level === 'critical' ? 'error' :
                                event.level === 'danger' ? 'warning' :
                                    event.level === 'moderate' ? 'info' : 'success'}
                            size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(event.timestamp).toLocaleTimeString()}
                        </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        SI: {event.perc.toFixed(1)}%
                    </Typography>

                    {event.tipos && event.tipos.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {event.tipos.map(tipo => tipo.replace('_', ' ')).join(', ')}
                        </Typography>
                    )}

                    {event.can && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {event.can.vehicleSpeed && (
                                <Chip
                                    label={`${event.can.vehicleSpeed} km/h`}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                            {event.can.engineRPM && (
                                <Chip
                                    label={`${event.can.engineRPM} RPM`}
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        📍 {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                    </Typography>
                </CardContent>
            </Card>
        </div>
    );
};

export const OptimizedEventList: React.FC<OptimizedEventListProps> = ({
    events,
    height,
    onEventClick,
    selectedEventId,
    parks = [],
    vehicles = []
}) => {
    // Filtros avanzados
    const [filterType, setFilterType] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('');
    const [filterPark, setFilterPark] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [search, setSearch] = useState('');

    // Estado para selección múltiple y feedback
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Filtrado de eventos
    const filteredEvents = useMemo(() => {
        return events.filter(ev => {
            const matchesType = filterType ? (ev.tipos?.includes(filterType)) : true;
            const matchesSeverity = filterSeverity ? (ev.level === filterSeverity) : true;
            const matchesVehicle = filterVehicle ? (ev.vehicleId === filterVehicle) : true;
            const matchesPark = filterPark ? (ev.parkId === filterPark) : true;
            const matchesDateFrom = filterDateFrom ? (new Date(ev.timestamp) >= new Date(filterDateFrom)) : true;
            const matchesDateTo = filterDateTo ? (new Date(ev.timestamp) <= new Date(filterDateTo)) : true;
            const matchesSearch = search ? (
                (ev.tipos?.join(' ') || '').toLowerCase().includes(search.toLowerCase()) ||
                (ev.level || '').toLowerCase().includes(search.toLowerCase()) ||
                (ev.vehicleId || '').toLowerCase().includes(search.toLowerCase())
            ) : true;
            return matchesType && matchesSeverity && matchesVehicle && matchesPark && matchesDateFrom && matchesDateTo && matchesSearch;
        });
    }, [events, filterType, filterSeverity, filterVehicle, filterPark, filterDateFrom, filterDateTo, search]);

    // Manejar selección
    const handleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const handleSelectAll = () => {
        if (selectedIds.length === filteredEvents.length) setSelectedIds([]);
        else setSelectedIds(filteredEvents.map(ev => ev.id || `${ev.timestamp}-${ev.lat}-${ev.lon}`));
    };

    // Exportar solo seleccionados si hay alguno
    const exportData = selectedIds.length > 0 ? filteredEvents.filter(ev => selectedIds.includes(ev.id || `${ev.timestamp}-${ev.lat}-${ev.lon}`)) : filteredEvents;

    // Exportar CSV
    const handleExportCSV = () => {
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'eventos.csv');
    };
    // Exportar Excel
    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Eventos');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'eventos.xlsx');
    };
    // Exportar PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const columns = [
            { header: 'Fecha', dataKey: 'timestamp' },
            { header: 'Tipo', dataKey: 'tipos' },
            { header: 'Severidad', dataKey: 'level' },
            { header: 'Vehículo', dataKey: 'vehicleId' },
            { header: 'Parque', dataKey: 'parkId' },
            { header: 'SI', dataKey: 'perc' },
            { header: 'Velocidad', dataKey: 'can.vehicleSpeed' },
            { header: 'RPM', dataKey: 'can.engineRPM' },
        ];
        const rows = exportData.map(ev => ({
            timestamp: new Date(ev.timestamp).toLocaleString(),
            tipos: ev.tipos?.join(', '),
            level: ev.level,
            vehicleId: ev.vehicleId,
            parkId: ev.parkId,
            perc: ev.perc,
            'can.vehicleSpeed': ev.can?.vehicleSpeed,
            'can.engineRPM': ev.can?.engineRPM
        }));
        (doc as any).autoTable({ columns, body: rows });
        doc.save('eventos.pdf');
    };

    // Opciones de tipo/severidad
    const tipoOpciones = Array.from(new Set(events.flatMap(ev => ev.tipos || [])));
    const severidadOpciones = Array.from(new Set(events.map(ev => ev.level)));

    // Barra de filtros y exportación
    return (
        <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select value={filterType} label="Tipo" onChange={e => setFilterType(e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        {tipoOpciones.map(tipo => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Severidad</InputLabel>
                    <Select value={filterSeverity} label="Severidad" onChange={e => setFilterSeverity(e.target.value)}>
                        <MenuItem value="">Todas</MenuItem>
                        {severidadOpciones.map(sev => <MenuItem key={sev} value={sev}>{sev}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Vehículo</InputLabel>
                    <Select value={filterVehicle} label="Vehículo" onChange={e => setFilterVehicle(e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        {vehicles.map(v => <MenuItem key={v.id} value={v.id}>{v.identifier || v.licensePlate}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Parque</InputLabel>
                    <Select value={filterPark} label="Parque" onChange={e => setFilterPark(e.target.value)}>
                        <MenuItem value="">Todos</MenuItem>
                        {parks.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                    </Select>
                </FormControl>
                <TextField
                    label="Desde"
                    type="date"
                    size="small"
                    value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Hasta"
                    type="date"
                    size="small"
                    value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Buscar"
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Button variant="outlined" onClick={handleSelectAll}>{selectedIds.length === filteredEvents.length ? 'Deseleccionar todo' : 'Seleccionar todo'}</Button>
                <Button variant="outlined" onClick={handleExportCSV}>Exportar CSV</Button>
                <Button variant="outlined" onClick={handleExportExcel}>Exportar Excel</Button>
                <Button variant="outlined" onClick={handleExportPDF}>Exportar PDF</Button>
                <Button variant="contained" color="primary" onClick={() => { handleExportCSV(); setSnackbar({ open: true, message: 'Exportado CSV', severity: 'success' }); }}>Exportar seleccionados CSV</Button>
                <Button variant="contained" color="primary" onClick={() => { handleExportExcel(); setSnackbar({ open: true, message: 'Exportado Excel', severity: 'success' }); }}>Exportar seleccionados Excel</Button>
                <Button variant="contained" color="primary" onClick={() => { handleExportPDF(); setSnackbar({ open: true, message: 'Exportado PDF', severity: 'success' }); }}>Exportar seleccionados PDF</Button>
                <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <MuiAlert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </MuiAlert>
                </Snackbar>
            </Stack>
            <List
                height={height}
                itemCount={filteredEvents.length}
                itemSize={120}
                itemData={{ events: filteredEvents, onEventClick, selectedEventId }}
                overscanCount={5}
            >
                {EventItem}
            </List>
        </Box>
    );
};

export default OptimizedEventList; 