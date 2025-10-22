/**
 * ManagerAdministration - Módulo de Administración para MANAGER
 * 
 * Funcionalidades:
 * - Editar perfil propio
 * - CRUD de talleres/parques de su organización
 * - Crear usuarios MANAGER subordinados
 * - Configuración de notificaciones
 * - Ver logs de auditoría
 */

import {
    Add as AddIcon,
    Business as BusinessIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Save as SaveIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    Switch,
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
import React, { useEffect, useState } from 'react';
import FilteredPageWrapper from '../components/filters/FilteredPageWrapper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

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
            id={`admin-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

interface Park {
    id: string;
    name: string;
    address?: string;
    capacity?: number;
}

interface ManagerUser {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

const ManagerAdministration: React.FC = () => {
    const { user } = useAuth();
    const { isManager } = usePermissions();
    const [activeTab, setActiveTab] = useState(0);

    // Estado para perfil
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Estado para parques
    const [parks, setParks] = useState<Park[]>([]);
    const [parkDialogOpen, setParkDialogOpen] = useState(false);
    const [editingPark, setEditingPark] = useState<Park | null>(null);
    const [parkForm, setParkForm] = useState({
        name: '',
        address: '',
        capacity: 10
    });

    // Estado para usuarios
    const [users, setUsers] = useState<ManagerUser[]>([]);
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    // Estado para configuración
    const [config, setConfig] = useState({
        emailAlerts: true,
        emailReports: true,
        emailDailySummary: false
    });

    useEffect(() => {
        if (isManager()) {
            fetchParks();
            fetchUsers();
            fetchConfig();
        }
    }, []);

    const fetchParks = async () => {
        try {
            const response = await apiService.get('/api/parks', {
                params: { organizationId: user?.organizationId }
            });
            if (response.success) {
                setParks(response.data as Park[]);
            }
        } catch (error) {
            logger.error('Error cargando parques', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await apiService.get('/api/users', {
                params: { organizationId: user?.organizationId }
            });
            if (response.success) {
                const usersData = response.data as any[];
                setUsers(usersData.filter((u: any) => u.role === 'MANAGER') as ManagerUser[]);
            }
        } catch (error) {
            logger.error('Error cargando usuarios', error);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await apiService.get('/api/users/config');
            if (response.success) {
                const configData = response.data as any;
                const prefs = configData.notificationPreferences;
                setConfig({
                    emailAlerts: prefs.emailAlerts !== false,
                    emailReports: prefs.emailReports !== false,
                    emailDailySummary: prefs.emailDailySummary === true
                });
            }
        } catch (error) {
            logger.error('Error cargando configuración', error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const response = await apiService.put('/api/users/profile', {
                name: profile.name,
                currentPassword: profile.currentPassword || undefined,
                newPassword: profile.newPassword || undefined
            });

            if (response.success) {
                alert('Perfil actualizado correctamente');
                setProfile({ ...profile, currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            logger.error('Error actualizando perfil', error);
            alert('Error actualizando perfil');
        }
    };

    const handleCreatePark = async () => {
        try {
            const response = await apiService.post('/api/parks', {
                ...parkForm,
                organizationId: user?.organizationId
            });

            if (response.success) {
                setParkDialogOpen(false);
                resetParkForm();
                fetchParks();
            }
        } catch (error) {
            logger.error('Error creando parque', error);
        }
    };

    const handleUpdatePark = async () => {
        if (!editingPark) return;

        try {
            const response = await apiService.put(`/api/parks/${editingPark.id}`, parkForm);

            if (response.success) {
                setParkDialogOpen(false);
                setEditingPark(null);
                resetParkForm();
                fetchParks();
            }
        } catch (error) {
            logger.error('Error actualizando parque', error);
        }
    };

    const handleDeletePark = async (parkId: string) => {
        if (!confirm('¿Estás seguro de eliminar este parque?')) return;

        try {
            const response = await apiService.delete(`/api/parks/${parkId}`);

            if (response.success) {
                fetchParks();
            }
        } catch (error) {
            logger.error('Error eliminando parque', error);
        }
    };

    const handleCreateUser = async () => {
        try {
            const response = await apiService.post('/api/users', {
                ...userForm,
                organizationId: user?.organizationId,
                role: 'MANAGER'
            });

            if (response.success) {
                setUserDialogOpen(false);
                resetUserForm();
                fetchUsers();
                alert('Usuario creado. Se ha enviado un email de bienvenida.');
            }
        } catch (error) {
            logger.error('Error creando usuario', error);
            alert('Error creando usuario');
        }
    };

    const handleUpdateConfig = async () => {
        try {
            const response = await apiService.put('/api/users/config', {
                notificationPreferences: config
            });

            if (response.success) {
                alert('Configuración actualizada');
            }
        } catch (error) {
            logger.error('Error actualizando configuración', error);
        }
    };

    const resetParkForm = () => {
        setParkForm({ name: '', address: '', capacity: 10 });
        setEditingPark(null);
    };

    const resetUserForm = () => {
        setUserForm({ name: '', email: '', password: '' });
    };

    const handleEditPark = (park: Park) => {
        setEditingPark(park);
        setParkForm({
            name: park.name,
            address: park.address || '',
            capacity: park.capacity || 10
        });
        setParkDialogOpen(true);
    };

    return (
        <FilteredPageWrapper>
            <Container maxWidth="xl">
                <Box sx={{ py: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        ⚙️ Administración
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        Gestión de perfil, parques y usuarios
                    </Typography>

                    <Card>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                            <Tab icon={<PersonIcon />} label="Mi Perfil" iconPosition="start" />
                            <Tab icon={<BusinessIcon />} label="Parques/Talleres" iconPosition="start" />
                            <Tab icon={<PersonIcon />} label="Usuarios" iconPosition="start" />
                            <Tab icon={<SettingsIcon />} label="Configuración" iconPosition="start" />
                        </Tabs>

                        {/* Panel 1: Mi Perfil */}
                        <TabPanel value={activeTab} index={0}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Nombre"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={profile.email}
                                        disabled
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                        Cambiar Contraseña
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Contraseña Actual"
                                        value={profile.currentPassword}
                                        onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Nueva Contraseña"
                                        value={profile.newPassword}
                                        onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Confirmar Contraseña"
                                        value={profile.confirmPassword}
                                        onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleUpdateProfile}
                                    >
                                        Guardar Cambios
                                    </Button>
                                </Grid>
                            </Grid>
                        </TabPanel>

                        {/* Panel 2: Parques/Talleres */}
                        <TabPanel value={activeTab} index={1}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Parques y Talleres</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => {
                                        resetParkForm();
                                        setParkDialogOpen(true);
                                    }}
                                >
                                    Nuevo Parque
                                </Button>
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Dirección</TableCell>
                                            <TableCell>Capacidad</TableCell>
                                            <TableCell>Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {parks.map((park) => (
                                            <TableRow key={park.id}>
                                                <TableCell>{park.name}</TableCell>
                                                <TableCell>{park.address || '-'}</TableCell>
                                                <TableCell>{park.capacity || '-'}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditPark(park)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeletePark(park.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Panel 3: Usuarios */}
                        <TabPanel value={activeTab} index={2}>
                            <Box display="flex" justifyContent="space-between" mb={2}>
                                <Typography variant="h6">Usuarios MANAGER</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setUserDialogOpen(true)}
                                >
                                    Crear Usuario
                                </Button>
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Rol</TableCell>
                                            <TableCell>Creado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.map((u) => (
                                            <TableRow key={u.id}>
                                                <TableCell>{u.name}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.role}</TableCell>
                                                <TableCell>
                                                    {new Date(u.createdAt).toLocaleDateString('es-ES')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </TabPanel>

                        {/* Panel 4: Configuración */}
                        <TabPanel value={activeTab} index={3}>
                            <Typography variant="h6" gutterBottom>
                                Notificaciones
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.emailAlerts}
                                                onChange={(e) => setConfig({ ...config, emailAlerts: e.target.checked })}
                                            />
                                        }
                                        label="Recibir alertas por email"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.emailReports}
                                                onChange={(e) => setConfig({ ...config, emailReports: e.target.checked })}
                                            />
                                        }
                                        label="Recibir reportes por email"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={config.emailDailySummary}
                                                onChange={(e) => setConfig({ ...config, emailDailySummary: e.target.checked })}
                                            />
                                        }
                                        label="Recibir resumen diario"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleUpdateConfig}
                                    >
                                        Guardar Configuración
                                    </Button>
                                </Grid>
                            </Grid>
                        </TabPanel>
                    </Card>

                    {/* Dialog Crear/Editar Parque */}
                    <Dialog open={parkDialogOpen} onClose={() => setParkDialogOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>
                            {editingPark ? 'Editar Parque' : 'Nuevo Parque'}
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre"
                                        value={parkForm.name}
                                        onChange={(e) => setParkForm({ ...parkForm, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Dirección"
                                        value={parkForm.address}
                                        onChange={(e) => setParkForm({ ...parkForm, address: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Capacidad"
                                        value={parkForm.capacity}
                                        onChange={(e) => setParkForm({ ...parkForm, capacity: Number(e.target.value) })}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setParkDialogOpen(false)}>Cancelar</Button>
                            <Button
                                variant="contained"
                                onClick={editingPark ? handleUpdatePark : handleCreatePark}
                            >
                                {editingPark ? 'Actualizar' : 'Crear'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Dialog Crear Usuario */}
                    <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Crear Usuario MANAGER</DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre"
                                        value={userForm.name}
                                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="email"
                                        label="Email"
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="password"
                                        label="Contraseña"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setUserDialogOpen(false)}>Cancelar</Button>
                            <Button variant="contained" onClick={handleCreateUser}>
                                Crear
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            </Container>
        </FilteredPageWrapper>
    );
};

export default ManagerAdministration;

