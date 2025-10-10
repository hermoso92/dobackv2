import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { t } from "../../i18n";
import { apiService } from '../../services/api.js';
import { eventService } from '../../services/events.js';
import type { Event } from '../../types/events.js';
import { EventStatus, EventType } from '../../types/events.js';
import type { Vehicle } from '../../types/vehicle.js';
import { logger } from '../../utils/logger.js';

interface EventFormData {
    id?: string;
    name: string;
    description: string;
    estado: EventStatus;
    tipo: EventType;
    isPredefined: boolean;
    autoEvaluate: boolean;
    conditions: any[];
    vehicles: string[];
    type?: EventType;
    status?: EventStatus;
}

const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
        case 'ACTIVE':
            return 'success';
        case 'INACTIVE':
            return 'warning';
        case 'TRIGGERED':
            return 'error';
        case 'RESOLVED':
            return 'info';
        default:
            return 'default';
    }
};

const getTypeColor = (type: EventType) => {
    switch (type) {
        case EventType.COMBINED:
            return 'primary';
        case EventType.STABILITY:
            return 'warning';
        case EventType.CAN:
            return 'secondary';
        default:
            return 'default';
    }
};

const generateUniqueKey = (event: Event, index: number): string => {
    if (event.id) {
        return `event-${event.id}`;
    }
    return `event-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`;
};

export const GestorEventos = () => {
    const { user, isInitialized } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [openDeleteAll, setOpenDeleteAll] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<EventFormData>({
        name: '',
        description: '',
        estado: EventStatus.ACTIVE,
        tipo: EventType.STABILITY,
        isPredefined: false,
        autoEvaluate: false,
        conditions: [],
        vehicles: []
    });
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const dataLoadedRef = useRef(false);

    const loadData = async () => {
        if (dataLoadedRef.current) return;

        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            logger.debug('Iniciando carga de datos');

            // Obtener organizationId del token
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('No se encontró el token de autenticación');
            }

            let organizationId: string;
            try {
                const parts = token.split('.');
                if (parts.length < 2) {
                    throw new Error('Token inválido');
                }
                const tokenPart = parts[1];
                if (!tokenPart) {
                    throw new Error('Token inválido');
                }
                const payload = JSON.parse(atob(tokenPart));
                organizationId = payload.organizationId;
                if (!organizationId) {
                    throw new Error('No se encontró el ID de la organización en el token');
                }
            } catch (e) {
                throw new Error('Error al decodificar el token de autenticación');
            }

            // Cargar vehículos y eventos en paralelo
            const [vehiclesResponse, events] = await Promise.all([
                apiService.get<Vehicle[]>(`/api/vehicles?organizationId=${organizationId}`),
                eventService.getEvents({})
            ]);

            if (vehiclesResponse.success && vehiclesResponse.data) {
                logger.debug('Vehículos cargados:', {
                    count: vehiclesResponse.data.length,
                    vehicles: vehiclesResponse.data.map(v => ({
                        id: v.id,
                        name: v.name
                    }))
                });
                setVehicles(vehiclesResponse.data);
            }

            logger.debug('Eventos cargados:', {
                count: events.length,
                events: events.map(event => ({
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    estado: event.estado,
                    tipo: event.tipo,
                    vehicles: event.vehicles
                }))
            });

            setEvents(events);
            dataLoadedRef.current = true;
            logger.debug('Carga de datos completada');
        } catch (error) {
            logger.error('Error al cargar datos:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar los datos';
            setError(errorMessage);
            setErrorMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isInitialized && user && !dataLoadedRef.current) {
            loadData();
        }
    }, [isInitialized, user]);

    const handleEdit = async (event: Event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description,
            estado: event.estado,
            tipo: event.tipo,
            isPredefined: event.isPredefined,
            autoEvaluate: (event as any).autoEvaluate || false,
            conditions: event.conditions || [],
            vehicles: event.vehicles || []
        });
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            await eventService.deleteEvent(id);
            setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
            setSuccessMessage('Evento eliminado correctamente');
        } catch (error) {
            logger.error('Error al eliminar evento:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el evento';
            setError(errorMessage);
            setErrorMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            estado: EventStatus.ACTIVE,
            tipo: EventType.STABILITY,
            isPredefined: false,
            autoEvaluate: false,
            conditions: [],
            vehicles: []
        });
        setEditingEvent(null);
    };

    const handleOpenDialog = () => {
        resetForm();
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            const eventData: any = {
                ...formData,
                type: formData.tipo,
                status: formData.estado
            };

            if (editingEvent) {
                const updatedEvent = await eventService.updateEvent(editingEvent.id!, eventData);
                setEvents(prevEvents =>
                    prevEvents.map(event =>
                        event.id === editingEvent.id ? updatedEvent : event
                    )
                );
                setSuccessMessage('Evento actualizado correctamente');
            } else {
                // createEvent obtiene organizationId del token automáticamente si no se proporciona
                // @ts-ignore - eventService is JavaScript
                const newEvent = await eventService.createEvent(eventData, user?.organizationId || '');
                setEvents(prevEvents => [...prevEvents, newEvent]);
                setSuccessMessage('Evento creado correctamente');
            }

            handleCloseDialog();
        } catch (error) {
            logger.error('Error al guardar evento:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar el evento';
            setError(errorMessage);
            setErrorMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        try {
            setLoading(true);
            setError(null);
            setErrorMessage(null);
            setSuccessMessage(null);

            await eventService.deleteAllEvents();
            setEvents([]);
            setOpenDeleteAll(false);
            setSuccessMessage('Todos los eventos han sido eliminados');
        } catch (error) {
            logger.error('Error al eliminar todos los eventos:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar todos los eventos';
            setError(errorMessage);
            setErrorMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {t('gestor_de_eventos_4')}</Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenDialog}
                        sx={{ mr: 1 }}
                    >
                        {t('crear_evento_2')}</Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setOpenDeleteAll(true)}
                    >
                        {t('eliminar_todos')}</Button>
                </Box>
            </Box>

            {errorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                </Alert>
            )}

            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('nombre_10')}</TableCell>
                                <TableCell>{t('descripcion_2')}</TableCell>
                                <TableCell>{t('estado_19')}</TableCell>
                                <TableCell>{t('tipo_21')}</TableCell>
                                <TableCell>Auto-Evaluación</TableCell>
                                <TableCell>{t('vehiculos_9')}</TableCell>
                                <TableCell>{t('acciones_14')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {events.map((event, index) => {
                                logger.debug('Renderizando evento:', {
                                    id: event.id,
                                    name: event.name,
                                    vehicles: event.vehicles
                                });
                                return (
                                    <TableRow key={generateUniqueKey(event, index)}>
                                        <TableCell>{event.name}</TableCell>
                                        <TableCell>{event.description}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.estado}
                                                color={getStatusColor(event.estado)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={event.tipo}
                                                color={getTypeColor(event.tipo)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={(event as any).autoEvaluate ? 'Sí' : 'No'}
                                                color={(event as any).autoEvaluate ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell key={`${event.id}-vehicles`}>
                                            {event.vehicles.length > 0 && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOnIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {`${event.vehicles.length} vehículo${event.vehicles.length !== 1 ? 's' : ''} asignado${event.vehicles.length !== 1 ? 's' : ''}`}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(event)}
                                                sx={{ mr: 1 }}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => event.id && handleDelete(event.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingEvent ? 'Editar Evento' : 'Crear Evento'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            margin="normal"
                            multiline
                            rows={4}
                            required
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>{t('estado_20')}</InputLabel>
                            <Select
                                value={formData.estado}
                                label="Estado"
                                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, estado: e.target.value as EventStatus })}
                            >
                                <MenuItem value={EventStatus.ACTIVE}>{t('activo_2')}</MenuItem>
                                <MenuItem value={EventStatus.INACTIVE}>{t('inactivo_1')}</MenuItem>
                                <MenuItem value={EventStatus.TRIGGERED}>{t('disparado')}</MenuItem>
                                <MenuItem value={EventStatus.RESOLVED}>{t('resuelto_1')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>{t('tipo_22')}</InputLabel>
                            <Select
                                value={formData.tipo}
                                label="Tipo"
                                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, tipo: e.target.value as EventType })}
                            >
                                <MenuItem value={EventType.STABILITY}>{t('estabilidad_5')}</MenuItem>
                                <MenuItem value={EventType.CAN}>{t('can_1')}</MenuItem>
                                <MenuItem value={EventType.COMBINED}>{t('combinado_1')}</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.autoEvaluate}
                                    onChange={(e) => setFormData({ ...formData, autoEvaluate: e.target.checked })}
                                    color="primary"
                                />
                            }
                            label="Evaluación Automática"
                            sx={{ mt: 2, mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Si está habilitado, este evento se evaluará automáticamente cuando se cree una nueva sesión.
                        </Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>{t('vehiculo_23')}</InputLabel>
                            <Select
                                value={formData.vehicles[0] || ''}
                                label="Vehículo"
                                onChange={(e: SelectChangeEvent) => setFormData({ ...formData, vehicles: [e.target.value] })}
                            >
                                {vehicles.map((vehicle) => (
                                    <MenuItem key={vehicle.id} value={vehicle.id}>
                                        {vehicle.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>{t('cancelar_22')}</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {editingEvent ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={openDeleteAll}
                onClose={() => setOpenDeleteAll(false)}
            >
                <DialogTitle>{t('confirmar_eliminacion_4')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('esta_seguro_de_que_desea_eliminar_todos_los_eventos_esta_accion_no_se_puede_deshacer')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteAll(false)}>{t('cancelar_23')}</Button>
                    <Button
                        onClick={handleDeleteAll}
                        color="error"
                        variant="contained"
                        disabled={loading}
                    >
                        {t('eliminar_23')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 