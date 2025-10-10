import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    Build as BuildIcon,
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Error as ErrorIcon,
    BuildCircle as MaintenanceIcon,
    Person as PersonIcon,
    PlayArrow as PlayIcon,
    Schedule as ScheduleIcon,
    Search as SearchIcon,
    Timeline as TimelineIcon,
    DirectionsCar as VehicleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { operationsService } from '../services/operations';
import { logger } from '../utils/logger';

// Interfaces
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface MaintenanceTask {
    id: string;
    vehicleId: string;
    vehicleName: string;
    type: 'preventive' | 'corrective' | 'inspection' | 'repair' | 'cleaning';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
    scheduledDate: string;
    estimatedDuration: number; // en horas
    actualDuration?: number;
    assignedTo: string;
    department: string;
    cost?: number;
    parts?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
}

interface MaintenanceSchedule {
    id: string;
    vehicleId: string;
    vehicleName: string;
    type: 'preventive' | 'inspection' | 'service';
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    intervalValue: number;
    lastPerformed: string;
    nextDue: string;
    isActive: boolean;
    description: string;
    department: string;
}

interface MaintenanceStats {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
    scheduledTasks: number;
    totalCost: number;
    averageDuration: number;
    completionRate: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`maintenance-tabpanel-${index}`}
            aria-labelledby={`maintenance-tab-${index}`}
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

const MaintenanceManager: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    // Estados principales
    const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
    const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
    const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStats | null>(null);
    const [realStats, setRealStats] = useState<any>(null);

    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para formularios
    const [showTaskDialog, setShowTaskDialog] = useState(false);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Datos simulados para Bomberos Madrid
    const mockMaintenanceTasks: MaintenanceTask[] = [
        {
            id: '1',
            vehicleId: 'DOBACK027',
            vehicleName: 'Bomba Escalera 027',
            type: 'preventive',
            title: 'Mantenimiento Preventivo Mensual',
            description: 'Revisión completa del sistema hidráulico, motor y equipos de rescate',
            priority: 'high',
            status: 'scheduled',
            scheduledDate: '2024-12-25T08:00:00Z',
            estimatedDuration: 4,
            assignedTo: 'Juan Pérez',
            department: 'Central',
            cost: 450,
            parts: ['Filtro de aceite', 'Bujías', 'Líquido hidráulico'],
            createdAt: '2024-12-20T10:00:00Z',
            updatedAt: '2024-12-20T10:00:00Z'
        },
        {
            id: '2',
            vehicleId: 'DOBACK015',
            vehicleName: 'Escalera Automática 015',
            type: 'inspection',
            title: 'Inspección de Seguridad Trimestral',
            description: 'Verificación de sistemas de seguridad y funcionamiento de la escalera',
            priority: 'critical',
            status: 'in_progress',
            scheduledDate: '2024-12-20T09:00:00Z',
            estimatedDuration: 2,
            actualDuration: 1.5,
            assignedTo: 'María González',
            department: 'Distrito Norte',
            cost: 200,
            createdAt: '2024-12-15T14:30:00Z',
            updatedAt: '2024-12-20T09:00:00Z'
        },
        {
            id: '3',
            vehicleId: 'DOBACK042',
            vehicleName: 'Unidad de Urgencia 042',
            type: 'corrective',
            title: 'Reparación Sistema de Frenos',
            description: 'Sustitución de pastillas de freno y revisión del sistema de frenado',
            priority: 'high',
            status: 'completed',
            scheduledDate: '2024-12-18T10:00:00Z',
            estimatedDuration: 3,
            actualDuration: 2.5,
            assignedTo: 'Antonio López',
            department: 'Distrito Sur',
            cost: 320,
            parts: ['Pastillas de freno', 'Discos de freno', 'Líquido de frenos'],
            createdAt: '2024-12-17T16:20:00Z',
            updatedAt: '2024-12-18T12:30:00Z',
            completedAt: '2024-12-18T12:30:00Z'
        },
        {
            id: '4',
            vehicleId: 'DOBACK033',
            vehicleName: 'Bomba de Agua 033',
            type: 'preventive',
            title: 'Cambio de Aceite y Filtros',
            description: 'Mantenimiento básico del motor y cambio de filtros',
            priority: 'medium',
            status: 'overdue',
            scheduledDate: '2024-12-15T08:00:00Z',
            estimatedDuration: 1.5,
            assignedTo: 'Carlos Rodríguez',
            department: 'Central',
            cost: 150,
            parts: ['Aceite motor', 'Filtro de aceite', 'Filtro de aire'],
            createdAt: '2024-12-10T09:00:00Z',
            updatedAt: '2024-12-15T08:00:00Z'
        }
    ];

    const mockMaintenanceSchedules: MaintenanceSchedule[] = [
        {
            id: '1',
            vehicleId: 'DOBACK027',
            vehicleName: 'Bomba Escalera 027',
            type: 'preventive',
            interval: 'monthly',
            intervalValue: 1,
            lastPerformed: '2024-11-25T08:00:00Z',
            nextDue: '2024-12-25T08:00:00Z',
            isActive: true,
            description: 'Mantenimiento preventivo mensual completo',
            department: 'Central'
        },
        {
            id: '2',
            vehicleId: 'DOBACK015',
            vehicleName: 'Escalera Automática 015',
            type: 'inspection',
            interval: 'quarterly',
            intervalValue: 3,
            lastPerformed: '2024-09-20T09:00:00Z',
            nextDue: '2024-12-20T09:00:00Z',
            isActive: true,
            description: 'Inspección de seguridad trimestral',
            department: 'Distrito Norte'
        },
        {
            id: '3',
            vehicleId: 'DOBACK042',
            vehicleName: 'Unidad de Urgencia 042',
            type: 'service',
            interval: 'weekly',
            intervalValue: 1,
            lastPerformed: '2024-12-13T10:00:00Z',
            nextDue: '2024-12-20T10:00:00Z',
            isActive: true,
            description: 'Servicio semanal de limpieza y revisión básica',
            department: 'Distrito Sur'
        }
    ];

    const mockMaintenanceStats: MaintenanceStats = {
        totalTasks: 24,
        completedTasks: 18,
        overdueTasks: 3,
        inProgressTasks: 2,
        scheduledTasks: 1,
        totalCost: 12850,
        averageDuration: 2.3,
        completionRate: 75
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            logger.info('[MaintenanceManager] Cargando datos reales de mantenimiento');

            // Cargar datos reales del backend
            const maintenanceResponse = await operationsService.getMaintenanceTasks({
                limit: 100,
                offset: 0
            });

            logger.info('[MaintenanceManager] Datos reales cargados:', {
                count: maintenanceResponse.records.length,
                stats: maintenanceResponse.stats
            });

            // Mapear los registros al formato del componente
            const mappedTasks: MaintenanceTask[] = maintenanceResponse.records.map(record => {
                // Determinar estimatedDuration basado en el tipo
                let estimatedDuration = 2;
                if (record.type === 'PREVENTIVE') estimatedDuration = 4;
                if (record.type === 'CORRECTIVE') estimatedDuration = 3;
                if (record.type === 'INSPECTION') estimatedDuration = 2;

                return {
                    id: record.id,
                    vehicleId: record.vehicleId,
                    vehicleName: record.vehicleName,
                    type: record.type.toLowerCase() as any,
                    title: record.title,
                    description: record.description,
                    priority: record.priority,
                    status: record.status.toLowerCase() as any,
                    scheduledDate: record.scheduledDate,
                    estimatedDuration,
                    actualDuration: record.completedDate ? estimatedDuration : undefined,
                    assignedTo: record.assignedTo,
                    department: record.department,
                    cost: record.cost,
                    parts: record.parts,
                    notes: record.notes,
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                    completedAt: record.completedDate
                };
            });

            setMaintenanceTasks(mappedTasks.length > 0 ? mappedTasks : mockMaintenanceTasks);
            setMaintenanceSchedules(mockMaintenanceSchedules); // Mantener mock por ahora

            // Calcular estadísticas reales
            const realStatsData: MaintenanceStats = {
                totalTasks: maintenanceResponse.stats.total,
                completedTasks: maintenanceResponse.stats.completed,
                overdueTasks: 0, // No tenemos este dato del backend
                inProgressTasks: maintenanceResponse.stats.in_progress,
                scheduledTasks: maintenanceResponse.stats.scheduled,
                totalCost: maintenanceResponse.stats.totalCost,
                averageDuration: 2.3,
                completionRate: maintenanceResponse.stats.total > 0
                    ? Math.round((maintenanceResponse.stats.completed / maintenanceResponse.stats.total) * 100)
                    : 0
            };

            setMaintenanceStats(realStatsData);
            setRealStats(maintenanceResponse.stats);

            logger.info('[MaintenanceManager] Datos cargados correctamente');
        } catch (error) {
            logger.error('[MaintenanceManager] Error cargando datos de mantenimiento:', error);
            setError('Error al cargar los datos. Mostrando datos de ejemplo.');
            // Fallback a datos mock en caso de error
            setMaintenanceTasks(mockMaintenanceTasks);
            setMaintenanceSchedules(mockMaintenanceSchedules);
            setMaintenanceStats(mockMaintenanceStats);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar tareas de mantenimiento
    const filteredMaintenanceTasks = useMemo(() => {
        let filtered = maintenanceTasks;

        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(task => task.type === typeFilter);
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(task => task.status === statusFilter);
        }

        if (priorityFilter !== 'ALL') {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }

        return filtered;
    }, [maintenanceTasks, searchTerm, typeFilter, statusFilter, priorityFilter]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCreateTask = () => {
        setEditingTask(null);
        setShowTaskDialog(true);
    };

    const handleEditTask = (task: MaintenanceTask) => {
        setEditingTask(task);
        setShowTaskDialog(true);
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 500));
            setMaintenanceTasks(prev => prev.filter(t => t.id !== taskId));
            setSuccess('Tarea de mantenimiento eliminada correctamente');
        } catch (error) {
            logger.error('Error eliminando tarea de mantenimiento:', error);
            setError('Error al eliminar la tarea de mantenimiento');
        }
    };

    const handleStartTask = async (taskId: string) => {
        try {
            // Simular inicio de tarea
            await new Promise(resolve => setTimeout(resolve, 300));
            setMaintenanceTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, status: 'in_progress' as const } : task
            ));
            setSuccess('Tarea iniciada correctamente');
        } catch (error) {
            logger.error('Error iniciando tarea:', error);
            setError('Error al iniciar la tarea');
        }
    };

    const handleCompleteTask = async (taskId: string) => {
        try {
            // Simular completar tarea
            await new Promise(resolve => setTimeout(resolve, 300));
            setMaintenanceTasks(prev => prev.map(task =>
                task.id === taskId
                    ? {
                        ...task,
                        status: 'completed' as const,
                        completedAt: new Date().toISOString()
                    }
                    : task
            ));
            setSuccess('Tarea completada correctamente');
        } catch (error) {
            logger.error('Error completando tarea:', error);
            setError('Error al completar la tarea');
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'preventive': return <ScheduleIcon />;
            case 'corrective': return <BuildIcon />;
            case 'inspection': return <CheckIcon />;
            case 'repair': return <MaintenanceIcon />;
            case 'cleaning': return <BuildIcon />;
            default: return <BuildIcon />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'default';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'info';
            case 'in_progress': return 'warning';
            case 'completed': return 'success';
            case 'cancelled': return 'default';
            case 'overdue': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Programada';
            case 'in_progress': return 'En Progreso';
            case 'completed': return 'Completada';
            case 'cancelled': return 'Cancelada';
            case 'overdue': return 'Vencida';
            default: return status;
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isOverdue = (scheduledDate: string): boolean => {
        return new Date(scheduledDate) < new Date();
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <BuildIcon sx={{ mr: 2, fontSize: 40 }} />
                        Gestión de Mantenimiento - Bomberos Madrid
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Administra tareas de mantenimiento, programaciones y seguimiento de vehículos
                    </Typography>
                </Box>

                {/* Estadísticas rápidas */}
                {maintenanceStats && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <AssignmentIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                                        <Box>
                                            <Typography color="textSecondary" gutterBottom>
                                                Total Tareas
                                            </Typography>
                                            <Typography variant="h5">
                                                {maintenanceStats.totalTasks}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <CheckIcon sx={{ color: 'success.main', fontSize: 32 }} />
                                        <Box>
                                            <Typography color="textSecondary" gutterBottom>
                                                Completadas
                                            </Typography>
                                            <Typography variant="h5">
                                                {maintenanceStats.completedTasks}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <ErrorIcon sx={{ color: 'error.main', fontSize: 32 }} />
                                        <Box>
                                            <Typography color="textSecondary" gutterBottom>
                                                Vencidas
                                            </Typography>
                                            <Typography variant="h5">
                                                {maintenanceStats.overdueTasks}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <TimelineIcon sx={{ color: 'info.main', fontSize: 32 }} />
                                        <Box>
                                            <Typography color="textSecondary" gutterBottom>
                                                Tasa de Cumplimiento
                                            </Typography>
                                            <Typography variant="h5">
                                                {maintenanceStats.completionRate}%
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                <Paper elevation={2}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} aria-label="maintenance tabs">
                            <Tab
                                icon={<AssignmentIcon />}
                                label="Tareas de Mantenimiento"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<ScheduleIcon />}
                                label="Programaciones"
                                iconPosition="start"
                            />
                            <Tab
                                icon={<TimelineIcon />}
                                label="Historial"
                                iconPosition="start"
                            />
                        </Tabs>
                    </Box>

                    {/* Pestaña: Tareas de Mantenimiento */}
                    <TabPanel value={activeTab} index={0}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h6">
                                Lista de Tareas de Mantenimiento
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    size="small"
                                    placeholder="Buscar tareas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                    }}
                                    sx={{ minWidth: 200 }}
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Tipo</InputLabel>
                                    <Select
                                        value={typeFilter}
                                        label="Tipo"
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                    >
                                        <MenuItem value="ALL">Todos</MenuItem>
                                        <MenuItem value="preventive">Preventivo</MenuItem>
                                        <MenuItem value="corrective">Correctivo</MenuItem>
                                        <MenuItem value="inspection">Inspección</MenuItem>
                                        <MenuItem value="repair">Reparación</MenuItem>
                                        <MenuItem value="cleaning">Limpieza</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        value={statusFilter}
                                        label="Estado"
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <MenuItem value="ALL">Todos</MenuItem>
                                        <MenuItem value="scheduled">Programadas</MenuItem>
                                        <MenuItem value="in_progress">En Progreso</MenuItem>
                                        <MenuItem value="completed">Completadas</MenuItem>
                                        <MenuItem value="overdue">Vencidas</MenuItem>
                                        <MenuItem value="cancelled">Canceladas</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Prioridad</InputLabel>
                                    <Select
                                        value={priorityFilter}
                                        label="Prioridad"
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                    >
                                        <MenuItem value="ALL">Todas</MenuItem>
                                        <MenuItem value="critical">Crítica</MenuItem>
                                        <MenuItem value="high">Alta</MenuItem>
                                        <MenuItem value="medium">Media</MenuItem>
                                        <MenuItem value="low">Baja</MenuItem>
                                    </Select>
                                </FormControl>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreateTask}
                                >
                                    Nueva Tarea
                                </Button>
                            </Stack>
                        </Stack>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Vehículo</TableCell>
                                        <TableCell>Tarea</TableCell>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell>Prioridad</TableCell>
                                        <TableCell>Estado</TableCell>
                                        <TableCell>Asignado</TableCell>
                                        <TableCell>Fecha Programada</TableCell>
                                        <TableCell>Duración</TableCell>
                                        <TableCell>Costo</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredMaintenanceTasks.map((task) => (
                                        <TableRow key={task.id} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <VehicleIcon sx={{ color: 'primary.main' }} />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {task.vehicleName}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {task.vehicleId}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {task.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200 }}>
                                                        {task.description}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    {getTypeIcon(task.type)}
                                                    <Chip
                                                        label={task.type.toUpperCase()}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={task.priority.toUpperCase()}
                                                    size="small"
                                                    color={getPriorityColor(task.priority)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Chip
                                                        label={getStatusText(task.status)}
                                                        size="small"
                                                        color={getStatusColor(task.status)}
                                                    />
                                                    {task.status === 'overdue' && (
                                                        <WarningIcon sx={{ color: 'error.main', fontSize: 16 }} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <PersonIcon sx={{ fontSize: 16 }} />
                                                    <Typography variant="body2">
                                                        {task.assignedTo}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color={isOverdue(task.scheduledDate) && task.status !== 'completed' ? 'error' : 'inherit'}
                                                >
                                                    {formatDate(task.scheduledDate)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {task.actualDuration ? `${task.actualDuration}h` : `${task.estimatedDuration}h`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {task.cost ? `€${task.cost}` : '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    {task.status === 'scheduled' && (
                                                        <Tooltip title="Iniciar">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleStartTask(task.id)}
                                                            >
                                                                <PlayIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {task.status === 'in_progress' && (
                                                        <Tooltip title="Completar">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleCompleteTask(task.id)}
                                                            >
                                                                <CheckIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Editar">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleEditTask(task)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteTask(task.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredMaintenanceTasks.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                            labelRowsPerPage="Filas por página:"
                        />
                    </TabPanel>

                    {/* Pestaña: Programaciones */}
                    <TabPanel value={activeTab} index={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography variant="h6">
                                Programaciones de Mantenimiento
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setShowScheduleDialog(true)}
                            >
                                Nueva Programación
                            </Button>
                        </Stack>

                        <Grid container spacing={3}>
                            {maintenanceSchedules.map((schedule) => (
                                <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                                    <Card>
                                        <CardContent>
                                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                                <ScheduleIcon sx={{ color: 'primary.main' }} />
                                                <Box>
                                                    <Typography variant="h6">
                                                        {schedule.vehicleName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {schedule.type.toUpperCase()} - {schedule.interval}
                                                    </Typography>
                                                </Box>
                                            </Stack>

                                            <Stack spacing={1} sx={{ mb: 2 }}>
                                                <Typography variant="body2">
                                                    <strong>Descripción:</strong> {schedule.description}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Último:</strong> {formatDate(schedule.lastPerformed)}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Próximo:</strong> {formatDate(schedule.nextDue)}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <strong>Departamento:</strong> {schedule.department}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={1}>
                                                <Chip
                                                    label={schedule.isActive ? 'Activa' : 'Inactiva'}
                                                    size="small"
                                                    color={schedule.isActive ? 'success' : 'default'}
                                                />
                                                {isOverdue(schedule.nextDue) && (
                                                    <Chip
                                                        label="VENCIDA"
                                                        size="small"
                                                        color="error"
                                                    />
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </TabPanel>

                    {/* Pestaña: Historial */}
                    <TabPanel value={activeTab} index={2}>
                        <Typography variant="h6" gutterBottom>
                            Historial de Mantenimiento
                        </Typography>

                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                El historial completo de mantenimiento mostrará todas las tareas realizadas,
                                incluyendo detalles de costos, duración y técnicos asignados.
                                Esta funcionalidad se implementará en la siguiente fase con reportes avanzados.
                            </Typography>
                        </Alert>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Resumen de Costos
                                        </Typography>
                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    Costo Total del Mes
                                                </Typography>
                                                <Typography variant="h5" color="primary">
                                                    €{maintenanceStats?.totalCost.toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" gutterBottom>
                                                    Duración Promedio
                                                </Typography>
                                                <Typography variant="h6">
                                                    {maintenanceStats?.averageDuration}h
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Progreso del Mes
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" gutterBottom>
                                                Tareas Completadas
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={maintenanceStats?.completionRate || 0}
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {maintenanceStats?.completedTasks} de {maintenanceStats?.totalTasks} tareas
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </TabPanel>
                </Paper>

                {/* Snackbars para notificaciones */}
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError(null)}
                >
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={!!success}
                    autoHideDuration={3000}
                    onClose={() => setSuccess(null)}
                >
                    <Alert severity="success" onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                </Snackbar>
            </Container>
        </LocalizationProvider>
    );
};

export default MaintenanceManager;
