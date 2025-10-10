import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useVehicleLocations } from '../hooks/useVehicleLocations';
import { t } from "../i18n";
import { api } from '../services/api';
import { authService } from '../services/auth';
import { vehicleService } from '../services/vehicles';
import '../styles/Events.css';

interface EventType {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface Event {
    id: string;
    type: string;
    vehicleId: string;
    vehicleName: string;
    location: string;
    timestamp: string;
    details: string;
    variables: Record<string, { value: number; unit: string }>;
}

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEvents, setExpandedEvents] = useState(new Set<string>());
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newEvent, setNewEvent] = useState({
        type: '',
        vehicleId: '',
        location: '',
        details: '',
        variables: {}
    });
    const [vehicles, setVehicles] = useState<Record<string, any>>({});

    // Hook para ubicaciones en tiempo real
    const { locations } = useVehicleLocations();

    useEffect(() => {
        setLoading(true);
        fetchEvents();
        get('/event-types')
            .then((data) => setEventTypes(Array.isArray(data.data) ? data.data : []))
            .catch(() => setEventTypes([]));
        // Cargar información de vehículos (marca, modelo, placa, etc.)
        const token = authService.getToken() || '';
        vehicleService.getAllVehicles(token)
            .then(list => {
                const map: Record<string, any> = {};
                (list.data || list).forEach(v => { map[v.id] = v; });
                setVehicles(map);
            })
            .catch(() => { /* ignorar errores por ahora */ });
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await api.get('/events');
            setEvents(response.data);
        } catch (error) {
            setError('Error al cargar eventos');
        }
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    const handleTypeFilter = (event: React.MouseEvent<HTMLElement>, newTypes: string[]) => {
        setSelectedTypes(newTypes);
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedEvents);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedEvents(newExpanded);
    };

    const getEventType = (typeId: string) => {
        return eventTypes.find(type => type.id === typeId);
    };

    const handleAddEvent = () => {
        setIsAddModalVisible(true);
    };

    const handleAddEventSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.currentTarget);
            const values = {
                type: formData.get('type') as string,
                vehicleId: formData.get('vehicleId') as string,
                location: formData.get('location') as string,
                details: formData.get('details') as string,
                variables: {}
            };
            await submitEvent(values);
        } catch (err) {
            setError('Error al crear evento');
        }
    };

    const submitEvent = async (eventData: any) => {
        try {
            await api.post('/events', eventData);
            setSuccess('Evento creado correctamente');
            fetchEvents();
        } catch {
            setError('Error al crear evento');
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = `${event.vehicleName} ${event.location} ${getEventType(event.type)?.name || ''} ${event.details || ''}`.toLowerCase().includes(searchTerm);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(event.type);
        return matchesSearch && matchesType;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Container maxWidth="lg">
            <PageHeader
                title="Eventos"
                onAdd={handleAddEvent}
                addButtonText="Nuevo Evento"
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                searchPlaceholder="Buscar eventos..."
            />

            {error && (
                <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                    <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
                </Snackbar>
            )}

            {success && (
                <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
                    <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
                </Snackbar>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredEvents.map((event) => {
                        const eventType = getEventType(event.type);
                        if (!eventType) return null;

                        return (
                            <Card
                                key={event.id}
                                className="event-card"
                                sx={{
                                    borderLeft: `4px solid ${eventType.color}`,
                                    backgroundColor: expandedEvents.has(event.id) ? 'rgba(0, 0, 0, 0.02)' : 'inherit'
                                }}
                            >
                                <CardContent sx={{ p: '8px 16px', '&:last-child': { pb: '8px' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                                            {eventType.icon} {eventType.name}
                                        </Typography>

                                        {
                                            (() => {
                                                const veh = vehicles[event.vehicleId];
                                                const loc = locations.find(l => l.id === event.vehicleId);
                                                const online = loc ? (Date.now() - new Date(loc.lastUpdate).getTime() < 30 * 60 * 1000) : false;
                                                const plate = veh?.licensePlate || event.vehicleName;
                                                const brandModel = veh ? `${veh.brand || ''} ${veh.model || ''}`.trim() : '';
                                                const statusText = online ? 'En línea' : 'Fuera de línea';
                                                return (
                                                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                                        {plate}{brandModel ? ` (${brandModel})` : ''} - {event.location} • {statusText}
                                                    </Typography>
                                                );
                                            })()
                                        }

                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 100 }}>
                                            {formatDate(event.timestamp)}
                                        </Typography>

                                        <IconButton
                                            size="small"
                                            onClick={() => toggleExpand(event.id)}
                                            sx={{ ml: 1 }}
                                        >
                                            {expandedEvents.has(event.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Box>

                                    <Collapse in={expandedEvents.has(event.id)}>
                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                            <Box sx={{ flex: '1 1 300px' }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    {t('variables_1')}</Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {Object.entries(event.variables).map(([key, value]) => (
                                                        <Chip
                                                            key={key}
                                                            label={`${key}: ${value.value}${value.unit}`}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>

                                            {event.details && (
                                                <Box sx={{ flex: '1 1 300px' }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        {t('detalles')}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {event.details}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Collapse>
                                </CardContent>
                            </Card>
                        );
                    })}
                </Box>
            )}

            <Dialog open={isAddModalVisible} onClose={() => setIsAddModalVisible(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleAddEventSubmit}>
                    <DialogTitle>{t('nuevo_evento_1')}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <FormControl fullWidth required>
                                <InputLabel>{t('tipo_de_evento')}</InputLabel>
                                <Select
                                    name="type"
                                    label="Tipo de Evento"
                                >
                                    {eventTypes.map(type => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                name="location"
                                label="Ubicación"
                                required
                                fullWidth
                            />
                            <TextField
                                name="details"
                                label="Detalles"
                                multiline
                                rows={4}
                                fullWidth
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsAddModalVisible(false)}>{t('cancelar_8')}</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {t('crear_evento')}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default Events; 