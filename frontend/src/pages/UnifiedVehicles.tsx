import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from "../i18n";
import { authService } from '../services/auth';
import { Session, sessionService } from '../services/sessions';
import { Vehicle, VehicleStatus, VehicleType, vehicleService } from '../services/vehicles';
import { SessionStatus } from '../types/enums';
import { logger } from '../utils/logger';

const vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: 'TRUCK', label: 'Camión' },
    { value: 'VAN', label: 'Furgoneta' },
    { value: 'CAR', label: 'Coche' },
    { value: 'BUS', label: 'Autobús' },
    { value: 'MOTORCYCLE', label: 'Motocicleta' },
    { value: 'OTHER', label: 'Otro' }
];

type GroupedSessions = {
    [date: string]: {
        routine: Session[];
        maintenance: Session[];
        emergency: Session[];
        test: Session[];
        training: Session[];
    };
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vehicles-tabpanel-${index}`}
            aria-labelledby={`vehicles-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const UnifiedVehicles = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estados principales
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [groupedSessions, setGroupedSessions] = useState<GroupedSessions>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados de diálogos
    const [openDialog, setOpenDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteSessionDialog, setOpenDeleteSessionDialog] = useState(false);
    const [openEditSessionDialog, setOpenEditSessionDialog] = useState(false);

    // Estados de formularios
    const [newVehicle, setNewVehicle] = useState({
        name: '',
        model: '',
        licensePlate: '',
        brand: '',
        type: 'CAR' as VehicleType,
        status: 'ACTIVE' as VehicleStatus
    });
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<SessionStatus>(SessionStatus.COMPLETED);

    // Estado de pestañas
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        if (selectedVehicle && tabValue === 1) {
            fetchVehicleSessions();
        }
    }, [selectedVehicle, tabValue]);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = authService.getToken() || '';
            const data = await vehicleService.getAllVehicles(token);
            setVehicles(data.data || data);
        } catch (error) {
            logger.error('Error al cargar vehículos:', error);
            setError('Error al cargar vehículos');
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicleSessions = async () => {
        if (!selectedVehicle) return;

        try {
            const sessionsData = await sessionService.getVehicleSessions(selectedVehicle.id);
            setSessions(sessionsData);
            groupSessionsByDate(sessionsData);
        } catch (error) {
            logger.error('Error al cargar sesiones:', error);
            setError('Error al cargar sesiones del vehículo');
        }
    };

    const groupSessionsByDate = (sessions: Session[]) => {
        const grouped: GroupedSessions = {};

        sessions.forEach(session => {
            try {
                const startDate = new Date(session.startTime);
                if (isNaN(startDate.getTime())) {
                    logger.error('Fecha de inicio inválida:', {
                        sessionId: session.id,
                        startTime: session.startTime
                    });
                    return;
                }

                const date = startDate.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

                if (!grouped[date]) {
                    grouped[date] = {
                        routine: [],
                        maintenance: [],
                        emergency: [],
                        test: [],
                        training: []
                    };
                }

                switch (session.type) {
                    case 'ROUTINE':
                        grouped[date].routine.push(session);
                        break;
                    case 'MAINTENANCE':
                        grouped[date].maintenance.push(session);
                        break;
                    case 'EMERGENCY':
                        grouped[date].emergency.push(session);
                        break;
                    case 'TEST':
                        grouped[date].test.push(session);
                        break;
                    case 'TRAINING':
                        grouped[date].training.push(session);
                        break;
                    default:
                        logger.warn('Tipo de sesión desconocido:', { type: session.type });
                        break;
                }
            } catch (error) {
                logger.error('Error procesando sesión:', {
                    sessionId: session.id,
                    error
                });
            }
        });

        setGroupedSessions(grouped);
    };

    const handleCreateVehicle = async () => {
        try {
            const token = authService.getToken() || '';
            await vehicleService.createVehicle(newVehicle, token);
            setOpenDialog(false);
            resetVehicleForm();
            fetchVehicles();
        } catch (error) {
            logger.error('Error al crear vehículo:', error);
            setError('Error al crear vehículo');
        }
    };

    const handleEditVehicle = async () => {
        if (!selectedVehicle) return;
        try {
            const token = authService.getToken() || '';
            await vehicleService.updateVehicle(selectedVehicle.id, newVehicle, token);
            setOpenDialog(false);
            setSelectedVehicle(null);
            resetVehicleForm();
            fetchVehicles();
        } catch (error) {
            logger.error('Error al actualizar vehículo:', error);
            setError('Error al actualizar vehículo');
        }
    };

    const handleDeleteVehicle = async () => {
        if (!selectedVehicle) return;
        try {
            const token = authService.getToken() || '';
            await vehicleService.deleteVehicle(selectedVehicle.id, token);
            setOpenDeleteDialog(false);
            setSelectedVehicle(null);
            fetchVehicles();
        } catch (error) {
            logger.error('Error al eliminar vehículo:', error);
            setError('Error al eliminar vehículo');
        }
    };

    const handleUpdateSessionStatus = async () => {
        if (!selectedSession) return;

        try {
            const updatedSession = await sessionService.updateSession(selectedSession.id, {
                vehicleId: selectedSession.vehicleId,
                type: selectedSession.type,
                status: selectedStatus,
                startTime: selectedSession.startTime,
                endTime: selectedSession.endTime
            });

            const updatedSessions = sessions.map(s =>
                s.id === updatedSession.id ? updatedSession : s
            );
            setSessions(updatedSessions);
            groupSessionsByDate(updatedSessions);

            setOpenEditSessionDialog(false);
            setSelectedSession(null);
        } catch (error) {
            logger.error('Error al actualizar sesión:', error);
            setError(error instanceof Error ? error.message : 'Error al actualizar sesión');
        }
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        try {
            await sessionService.deleteSession(selectedSession.id);

            const updatedSessions = sessions.filter(s => s.id !== selectedSession.id);
            setSessions(updatedSessions);
            groupSessionsByDate(updatedSessions);

            setOpenDeleteSessionDialog(false);
            setSelectedSession(null);
        } catch (error) {
            logger.error('Error al eliminar sesión:', error);
            setError('Error al eliminar sesión');
        }
    };

    const resetVehicleForm = () => {
        setNewVehicle({
            name: '',
            model: '',
            licensePlate: '',
            brand: '',
            type: 'CAR' as VehicleType,
            status: 'ACTIVE' as VehicleStatus
        });
    };

    const handleOpenEditDialog = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setNewVehicle({
            name: vehicle.name,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            type: vehicle.type || 'CAR' as VehicleType,
            status: vehicle.status
        });
        setOpenEditDialog(true);
    };

    const openDeleteConfirmDialog = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setOpenDeleteDialog(true);
    };

    const handleOpenEditSessionDialog = (session: Session) => {
        setSelectedSession(session);
        setSelectedStatus(session.status as SessionStatus);
        setOpenEditSessionDialog(true);
    };

    const openDeleteSessionConfirmDialog = (session: Session) => {
        setSelectedSession(session);
        setOpenDeleteSessionDialog(true);
    };

    const getStatusChip = (status: VehicleStatus) => {
        const statusColors: Record<VehicleStatus, 'success' | 'default' | 'warning'> = {
            ACTIVE: 'success',
            INACTIVE: 'default',
            MAINTENANCE: 'warning',
            REPAIR: 'warning'
        };

        return (
            <Chip
                label={status}
                color={statusColors[status] || 'default'}
                size="small"
            />
        );
    };

    const getSessionStatusChip = (status: SessionStatus) => {
        const statusColors: Record<SessionStatus, 'success' | 'default' | 'warning' | 'error' | 'info'> = {
            [SessionStatus.ACTIVE]: 'success',
            [SessionStatus.PAUSED]: 'warning',
            [SessionStatus.COMPLETED]: 'info',
            [SessionStatus.ERROR]: 'error',
            [SessionStatus.CANCELLED]: 'default'
        };

        const statusLabels: Record<SessionStatus, string> = {
            [SessionStatus.ACTIVE]: 'Activa',
            [SessionStatus.PAUSED]: 'Pausada',
            [SessionStatus.COMPLETED]: 'Completada',
            [SessionStatus.ERROR]: 'Error',
            [SessionStatus.CANCELLED]: 'Cancelada'
        };

        return (
            <Chip
                label={statusLabels[status] || status}
                color={statusColors[status] || 'default'}
                size="small"
            />
        );
    };

    const getTypeChip = (type: string) => {
        const typeColors: Record<string, 'primary' | 'secondary' | 'info' | 'warning' | 'error'> = {
            ROUTINE: 'primary',
            MAINTENANCE: 'secondary',
            EMERGENCY: 'error',
            TEST: 'info',
            TRAINING: 'warning'
        };

        const typeLabels: Record<string, string> = {
            ROUTINE: 'Rutina',
            MAINTENANCE: 'Mantenimiento',
            EMERGENCY: 'Emergencia',
            TEST: 'Prueba',
            TRAINING: 'Entrenamiento'
        };

        return (
            <Chip
                label={typeLabels[type] || type}
                color={typeColors[type] || 'default'}
                size="small"
                sx={{ mr: 1 }}
            />
        );
    };

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return '-';
        return new Date(date).toLocaleString();
    };

    const formatDuration = (startTime: Date | string | undefined, endTime: Date | string | undefined) => {
        if (!startTime || !endTime) return '-';
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return '-';
            }

            const duration = end.getTime() - start.getTime();
            const minutes = Math.round(duration / 1000 / 60);

            if (minutes < 0) {
                return '-';
            }

            return `${minutes} min`;
        } catch (error) {
            return '-';
        }
    };

    const formatAccordionDate = (dateStr: string) => {
        try {
            const [day, month, year] = dateStr.split('/').map(Number);
            const date = new Date(year, month - 1, day);
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateStr;
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {t('vehiculos_5')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setSelectedVehicle(null);
                        resetVehicleForm();
                        setOpenDialog(true);
                    }}
                >
                    {t('nuevo_vehiculo_1')}</Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="vehicles tabs">
                    <Tab label="Lista de Vehículos" />
                    <Tab
                        label="Sesiones del Vehículo"
                        disabled={!selectedVehicle}
                    />
                    <Tab label="Estadísticas" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Paper sx={{ width: '100%', overflow: 'auto' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('nombre_5')}</TableCell>
                                    <TableCell>{t('marca_1')}</TableCell>
                                    <TableCell>{t('modelo_1')}</TableCell>
                                    <TableCell>{t('matricula_2')}</TableCell>
                                    <TableCell>{t('tipo_13')}</TableCell>
                                    <TableCell>{t('estado_8')}</TableCell>
                                    <TableCell>{t('ultima_actividad')}</TableCell>
                                    <TableCell>{t('acciones_7')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vehicles.map((vehicle) => (
                                    <TableRow
                                        key={vehicle.id}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5'
                                            }
                                        }}
                                    >
                                        <TableCell>{vehicle.name}</TableCell>
                                        <TableCell>{vehicle.brand}</TableCell>
                                        <TableCell>{vehicle.model}</TableCell>
                                        <TableCell>{vehicle.licensePlate}</TableCell>
                                        <TableCell>{vehicle.type}</TableCell>
                                        <TableCell>{getStatusChip(vehicle.status)}</TableCell>
                                        <TableCell>{formatDate(vehicle.updatedAt)}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedVehicle(vehicle);
                                                    setTabValue(1);
                                                }}
                                                sx={{ mr: 1 }}
                                                title="Ver sesiones"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenEditDialog(vehicle)}
                                                sx={{ mr: 1 }}
                                                title="Editar vehículo"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => openDeleteConfirmDialog(vehicle)}
                                                color="error"
                                                title="Eliminar vehículo"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {selectedVehicle ? (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {t('sesiones_del_vehiculo')}</Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    {selectedVehicle.name} - {selectedVehicle.licensePlate}
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setSelectedVehicle(null);
                                    setTabValue(0);
                                }}
                            >
                                Volver a Lista</Button>
                        </Box>

                        {Object.entries(groupedSessions).map(([date, sessionsByType]) => (
                            <Accordion key={date} sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6">
                                        {formatAccordionDate(date)}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        {Object.entries(sessionsByType).map(([type, sessions]) => (
                                            sessions.length > 0 && (
                                                <Grid item xs={12} key={type}>
                                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                        {type === 'routine' ? 'Sesiones de Rutina' :
                                                            type === 'maintenance' ? 'Sesiones de Mantenimiento' :
                                                                type === 'emergency' ? 'Sesiones de Emergencia' :
                                                                    type === 'test' ? 'Sesiones de Prueba' :
                                                                        'Sesiones de Entrenamiento'}
                                                    </Typography>
                                                    <TableContainer component={Paper}>
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>{t('id_2')}</TableCell>
                                                                    <TableCell>{t('inicio_1')}</TableCell>
                                                                    <TableCell>{t('fin_1')}</TableCell>
                                                                    <TableCell>{t('estado_10')}</TableCell>
                                                                    <TableCell>{t('duracion_2')}</TableCell>
                                                                    <TableCell>{t('acciones_8')}</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {sessions.map((session) => (
                                                                    <TableRow key={session.id}>
                                                                        <TableCell>{session.id}</TableCell>
                                                                        <TableCell>{formatDate(session.startTime)}</TableCell>
                                                                        <TableCell>{formatDate(session.endTime)}</TableCell>
                                                                        <TableCell>
                                                                            {getTypeChip(session.type || 'STABILITY')}
                                                                            {getSessionStatusChip(session.status as SessionStatus)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {formatDuration(session.startTime, session.endTime)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleOpenEditSessionDialog(session)}
                                                                                sx={{ mr: 1 }}
                                                                                title="Editar sesión"
                                                                            >
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => openDeleteSessionConfirmDialog(session)}
                                                                                color="error"
                                                                                title="Eliminar sesión"
                                                                            >
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </Grid>
                                            )
                                        ))}
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                ) : (
                    <Alert severity="info">
                        Selecciona un vehículo de la lista para ver sus sesiones.
                    </Alert>
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Resumen de Vehículos
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {vehicles.length}
                                </Typography>
                                <Typography color="text.secondary">
                                    Total de vehículos registrados
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Vehículos Activos
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {vehicles.filter(v => v.status === 'ACTIVE').length}
                                </Typography>
                                <Typography color="text.secondary">
                                    Vehículos en servicio
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    En Mantenimiento
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {vehicles.filter(v => v.status === 'MAINTENANCE').length}
                                </Typography>
                                <Typography color="text.secondary">
                                    Vehículos en mantenimiento
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Total de Sesiones
                                </Typography>
                                <Typography variant="h4" color="info.main">
                                    {sessions.length}
                                </Typography>
                                <Typography color="text.secondary">
                                    Sesiones registradas
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Dialog para crear/editar vehículo */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nombre"
                        fullWidth
                        value={newVehicle.name}
                        onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <TextField
                        label="Marca"
                        fullWidth
                        value={newVehicle.brand}
                        onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Modelo"
                        fullWidth
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="Matrícula"
                        fullWidth
                        value={newVehicle.licensePlate}
                        onChange={(e) => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>{t('tipo_14')}</InputLabel>
                        <Select
                            value={newVehicle.type}
                            label="Tipo"
                            onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as VehicleType })}
                        >
                            {vehicleTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>{t('estado_9')}</InputLabel>
                        <Select
                            value={newVehicle.status}
                            label="Estado"
                            onChange={(e) => setNewVehicle({ ...newVehicle, status: e.target.value as VehicleStatus })}
                        >
                            <MenuItem value="ACTIVE">{t('activo_1')}</MenuItem>
                            <MenuItem value="INACTIVE">{t('inactivo')}</MenuItem>
                            <MenuItem value="MAINTENANCE">{t('en_mantenimiento')}</MenuItem>
                            <MenuItem value="REPAIR">{t('en_reparacion')}</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>{t('cancelar_15')}</Button>
                    <Button
                        onClick={selectedVehicle ? handleEditVehicle : handleCreateVehicle}
                        variant="contained"
                    >
                        {selectedVehicle ? 'Guardar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para confirmar eliminación de vehículo */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>{t('confirmar_eliminacion_2')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('esta_seguro_que_desea_eliminar_el_vehiculo')}{selectedVehicle?.name}{t('esta_accion_no_se_puede_deshacer')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>{t('cancelar_16')}</Button>
                    <Button onClick={handleDeleteVehicle} color="error" variant="contained">
                        {t('eliminar_3')}</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para editar sesión */}
            <Dialog open={openEditSessionDialog} onClose={() => setOpenEditSessionDialog(false)}>
                <DialogTitle>{t('cambiar_estado_de_sesion')}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel>{t('estado_11')}</InputLabel>
                        <Select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as SessionStatus)}
                        >
                            <MenuItem value={SessionStatus.ACTIVE}>{t('activa')}</MenuItem>
                            <MenuItem value={SessionStatus.PAUSED}>{t('pausada')}</MenuItem>
                            <MenuItem value={SessionStatus.COMPLETED}>{t('completada')}</MenuItem>
                            <MenuItem value={SessionStatus.ERROR}>{t('error_2')}</MenuItem>
                            <MenuItem value={SessionStatus.CANCELLED}>{t('cancelada')}</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditSessionDialog(false)}>{t('cancelar_17')}</Button>
                    <Button onClick={handleUpdateSessionStatus} variant="contained">
                        {t('guardar_3')}</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para confirmar eliminación de sesión */}
            <Dialog open={openDeleteSessionDialog} onClose={() => setOpenDeleteSessionDialog(false)}>
                <DialogTitle>{t('confirmar_eliminacion_3')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('esta_seguro_que_desea_eliminar_esta_sesion_esta_accion_no_se_puede_deshacer')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteSessionDialog(false)}>{t('cancelar_18')}</Button>
                    <Button onClick={handleDeleteSession} color="error" variant="contained">
                        {t('eliminar_4')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UnifiedVehicles;
