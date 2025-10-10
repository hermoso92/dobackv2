import {
    Add as AddIcon,
    Analytics as AnalyticsIcon,
    CheckCircle as CheckIcon,
    Business as CompanyIcon,
    Delete as DeleteIcon,
    CloudDownload as DownloadIcon,
    Edit as EditIcon,
    Warning as EmergencyIcon,
    GetApp as ExportIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Settings as SettingsIcon,
    CloudUpload as UploadIcon,
    DirectionsCar as VehicleIcon
} from '@mui/icons-material';
import {
    Alert,
    Avatar,
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
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

// Interfaces
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    status: 'active' | 'inactive' | 'suspended';
    department: string;
    lastLogin: string;
    createdAt: string;
    avatar?: string;
}

interface Vehicle {
    id: string;
    name: string;
    type: 'BOMBA' | 'ESCALERA' | 'URGENCIA' | 'MANTENIMIENTO';
    status: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
    department: string;
    lastMaintenance: string;
    createdAt: string;
    licensePlate?: string;
}

interface Department {
    id: string;
    name: string;
    code: string;
    manager: string;
    vehicleCount: number;
    userCount: number;
    status: 'active' | 'inactive';
}

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalVehicles: number;
    availableVehicles: number;
    emergencyVehicles: number;
    maintenanceVehicles: number;
    totalDepartments: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    lastBackup: string;
    storageUsed: number;
    storageTotal: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`admin-tabpanel-${index}`}
            aria-labelledby={`admin-tab-${index}`}
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

const UnifiedAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    // Estados principales
    const [users, setUsers] = useState<User[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para formularios
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showVehicleDialog, setShowVehicleDialog] = useState(false);
    const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Datos simulados para Bomberos Madrid
    const mockUsers: User[] = [
        {
            id: '1',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@bomberosmadrid.es',
            role: 'ADMIN',
            status: 'active',
            department: 'Central',
            lastLogin: '2024-12-20T08:30:00Z',
            createdAt: '2024-01-15T10:00:00Z'
        },
        {
            id: '2',
            name: 'María González',
            email: 'maria.gonzalez@bomberosmadrid.es',
            role: 'MANAGER',
            status: 'active',
            department: 'Distrito Norte',
            lastLogin: '2024-12-20T07:45:00Z',
            createdAt: '2024-02-20T14:30:00Z'
        },
        {
            id: '3',
            name: 'Antonio López',
            email: 'antonio.lopez@bomberosmadrid.es',
            role: 'OPERATOR',
            status: 'active',
            department: 'Distrito Sur',
            lastLogin: '2024-12-19T22:15:00Z',
            createdAt: '2024-03-10T09:20:00Z'
        }
    ];

    const mockVehicles: Vehicle[] = [
        {
            id: '1',
            name: 'Bomba Escalera 027',
            type: 'BOMBA',
            status: 'ON_EMERGENCY',
            department: 'Central',
            lastMaintenance: '2024-12-15T10:00:00Z',
            createdAt: '2024-01-01T00:00:00Z',
            licensePlate: 'M-1234-AB'
        },
        {
            id: '2',
            name: 'Escalera Automática 015',
            type: 'ESCALERA',
            status: 'AVAILABLE',
            department: 'Distrito Norte',
            lastMaintenance: '2024-12-18T14:30:00Z',
            createdAt: '2024-01-15T00:00:00Z',
            licensePlate: 'M-5678-CD'
        },
        {
            id: '3',
            name: 'Unidad de Urgencia 042',
            type: 'URGENCIA',
            status: 'MAINTENANCE',
            department: 'Distrito Sur',
            lastMaintenance: '2024-12-20T08:00:00Z',
            createdAt: '2024-02-01T00:00:00Z',
            licensePlate: 'M-9012-EF'
        }
    ];

    const mockDepartments: Department[] = [
        {
            id: '1',
            name: 'Central',
            code: 'CENTRAL',
            manager: 'Carlos Rodríguez',
            vehicleCount: 15,
            userCount: 45,
            status: 'active'
        },
        {
            id: '2',
            name: 'Distrito Norte',
            code: 'NORTE',
            manager: 'María González',
            vehicleCount: 8,
            userCount: 25,
            status: 'active'
        },
        {
            id: '3',
            name: 'Distrito Sur',
            code: 'SUR',
            manager: 'Antonio López',
            vehicleCount: 12,
            userCount: 30,
            status: 'active'
        }
    ];

    const mockSystemStats: SystemStats = {
        totalUsers: 100,
        activeUsers: 95,
        totalVehicles: 35,
        availableVehicles: 28,
        emergencyVehicles: 5,
        maintenanceVehicles: 2,
        totalDepartments: 3,
        systemHealth: 'good',
        lastBackup: '2024-12-20T02:00:00Z',
        storageUsed: 75,
        storageTotal: 100
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Simular carga de datos
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUsers(mockUsers);
            setVehicles(mockVehicles);
            setDepartments(mockDepartments);
            setSystemStats(mockSystemStats);
        } catch (error) {
            logger.error('Error cargando datos de administración:', error);
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar usuarios
    const filteredUsers = useMemo(() => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        if (roleFilter !== 'ALL') {
            filtered = filtered.filter(user => user.role === roleFilter);
        }

        return filtered;
    }, [users, searchTerm, statusFilter, roleFilter]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCreateUser = () => {
        setEditingItem(null);
        setShowUserDialog(true);
    };

    const handleEditUser = (user: User) => {
        setEditingItem(user);
        setShowUserDialog(true);
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 500));
            setUsers(prev => prev.filter(u => u.id !== userId));
            setSuccess('Usuario eliminado correctamente');
        } catch (error) {
            logger.error('Error eliminando usuario:', error);
            setError('Error al eliminar el usuario');
        }
    };

    const handleCreateVehicle = () => {
        setEditingItem(null);
        setShowVehicleDialog(true);
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setEditingItem(vehicle);
        setShowVehicleDialog(true);
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        try {
            // Simular eliminación
            await new Promise(resolve => setTimeout(resolve, 500));
            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
            setSuccess('Vehículo eliminado correctamente');
        } catch (error) {
            logger.error('Error eliminando vehículo:', error);
            setError('Error al eliminar el vehículo');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
            case 'AVAILABLE':
                return 'success';
            case 'ON_EMERGENCY':
                return 'error';
            case 'MAINTENANCE':
                return 'warning';
            case 'inactive':
            case 'OFFLINE':
                return 'default';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'inactive': return 'Inactivo';
            case 'suspended': return 'Suspendido';
            case 'AVAILABLE': return 'Disponible';
            case 'ON_EMERGENCY': return 'En Emergencia';
            case 'MAINTENANCE': return 'Mantenimiento';
            case 'OFFLINE': return 'Offline';
            default: return status;
        }
    };

    const getRoleText = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'Administrador';
            case 'MANAGER': return 'Gestor';
            case 'OPERATOR': return 'Operador';
            default: return role;
        }
    };

    const getSystemHealthColor = (health: string) => {
        switch (health) {
            case 'excellent': return 'success';
            case 'good': return 'info';
            case 'warning': return 'warning';
            case 'critical': return 'error';
            default: return 'default';
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

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 2, fontSize: 40 }} />
                    Administración del Sistema - Bomberos Madrid
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Gestión completa de usuarios, vehículos, departamentos y configuración del sistema
                </Typography>
            </Box>

            {/* Estadísticas del sistema */}
            {systemStats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        <PersonIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Usuarios Activos
                                        </Typography>
                                        <Typography variant="h5">
                                            {systemStats.activeUsers}/{systemStats.totalUsers}
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
                                    <Avatar sx={{ bgcolor: 'success.main' }}>
                                        <VehicleIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Vehículos Disponibles
                                        </Typography>
                                        <Typography variant="h5">
                                            {systemStats.availableVehicles}/{systemStats.totalVehicles}
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
                                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                                        <EmergencyIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            En Emergencia
                                        </Typography>
                                        <Typography variant="h5">
                                            {systemStats.emergencyVehicles}
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
                                    <Avatar sx={{ bgcolor: getSystemHealthColor(systemStats.systemHealth) + '.main' }}>
                                        <CheckIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom>
                                            Estado del Sistema
                                        </Typography>
                                        <Typography variant="h6" color={`${getSystemHealthColor(systemStats.systemHealth)}.main`}>
                                            {systemStats.systemHealth.toUpperCase()}
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
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin tabs">
                        <Tab
                            icon={<PersonIcon />}
                            label="Usuarios"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<VehicleIcon />}
                            label="Vehículos"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<CompanyIcon />}
                            label="Departamentos"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<AnalyticsIcon />}
                            label="Sistema"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Pestaña: Usuarios */}
                <TabPanel value={activeTab} index={0}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Gestión de Usuarios
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField
                                size="small"
                                placeholder="Buscar usuarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                                sx={{ minWidth: 200 }}
                            />
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Estado"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="active">Activos</MenuItem>
                                    <MenuItem value="inactive">Inactivos</MenuItem>
                                    <MenuItem value="suspended">Suspendidos</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    value={roleFilter}
                                    label="Rol"
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <MenuItem value="ALL">Todos</MenuItem>
                                    <MenuItem value="ADMIN">Administrador</MenuItem>
                                    <MenuItem value="MANAGER">Gestor</MenuItem>
                                    <MenuItem value="OPERATOR">Operador</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateUser}
                            >
                                Nuevo Usuario
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Rol</TableCell>
                                    <TableCell>Departamento</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Último Acceso</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Avatar sx={{ width: 32, height: 32 }}>
                                                    {user.name.charAt(0)}
                                                </Avatar>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {user.name}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getRoleText(user.role)}
                                                size="small"
                                                color={user.role === 'ADMIN' ? 'error' : user.role === 'MANAGER' ? 'warning' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>{user.department}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusText(user.status)}
                                                size="small"
                                                color={getStatusColor(user.status)}
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditUser(user)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteUser(user.id)}
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
                        count={filteredUsers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        labelRowsPerPage="Filas por página:"
                    />
                </TabPanel>

                {/* Pestaña: Vehículos */}
                <TabPanel value={activeTab} index={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Gestión de Vehículos
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateVehicle}
                        >
                            Nuevo Vehículo
                        </Button>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Vehículo</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Matrícula</TableCell>
                                    <TableCell>Departamento</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Último Mantenimiento</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {vehicle.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={vehicle.type}
                                                size="small"
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell>{vehicle.licensePlate || 'N/A'}</TableCell>
                                        <TableCell>{vehicle.department}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusText(vehicle.status)}
                                                size="small"
                                                color={getStatusColor(vehicle.status)}
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(vehicle.lastMaintenance)}</TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditVehicle(vehicle)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteVehicle(vehicle.id)}
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
                </TabPanel>

                {/* Pestaña: Departamentos */}
                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Gestión de Departamentos
                    </Typography>

                    <Grid container spacing={3}>
                        {departments.map((dept) => (
                            <Grid item xs={12} md={4} key={dept.id}>
                                <Card>
                                    <CardContent>
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                <CompanyIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6">
                                                    {dept.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Código: {dept.code}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Responsable:</strong> {dept.manager}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Vehículos:</strong> {dept.vehicleCount}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Usuarios:</strong> {dept.userCount}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={dept.status === 'active' ? 'Activo' : 'Inactivo'}
                                                size="small"
                                                color={dept.status === 'active' ? 'success' : 'default'}
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>

                {/* Pestaña: Sistema */}
                <TabPanel value={activeTab} index={3}>
                    <Typography variant="h6" gutterBottom>
                        Información del Sistema
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Estado del Sistema
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="body2" gutterBottom>
                                                Salud del Sistema
                                            </Typography>
                                            <Chip
                                                label={systemStats?.systemHealth.toUpperCase() || 'N/A'}
                                                color={getSystemHealthColor(systemStats?.systemHealth || 'good')}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" gutterBottom>
                                                Último Respaldo
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {systemStats ? formatDate(systemStats.lastBackup) : 'N/A'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" gutterBottom>
                                                Almacenamiento Usado
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={systemStats?.storageUsed || 0}
                                                sx={{ mb: 1 }}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {systemStats?.storageUsed || 0}% de {systemStats?.storageTotal || 100}GB
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
                                        Acciones del Sistema
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<RefreshIcon />}
                                            fullWidth
                                        >
                                            Actualizar Datos
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<DownloadIcon />}
                                            fullWidth
                                        >
                                            Descargar Respaldo
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<UploadIcon />}
                                            fullWidth
                                        >
                                            Restaurar Respaldo
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<ExportIcon />}
                                            fullWidth
                                        >
                                            Exportar Configuración
                                        </Button>
                                    </Stack>
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
    );
};

export default UnifiedAdmin;
