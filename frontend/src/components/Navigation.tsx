import {
    ManageAccounts as AccountIcon,
    AdminPanelSettings as AdminIcon,
    Psychology as AIIcon,
    Notifications as BellIcon,
    CloudUpload as CloudUploadIcon,
    Dashboard as DashboardIcon,
    LocationOn as GeofenceIcon,
    MenuBook as KnowledgeIcon,
    LocalFireDepartment as LogoIcon,
    Logout as LogoutIcon,
    Settings as ManagementIcon,
    Build as OperationsIcon,
    Person as ProfileIcon,
    Assignment as ReportIcon,
    ShowChart as StabilityIcon,
    Memory as TelemetryIcon
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tab,
    Tabs,
    Toolbar,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import React, { ReactElement, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { t } from "../i18n";
import { UserRole } from '../types/auth';
import { Permission } from '../types/permissions';

// ✅ Definición mejorada de ítems de navegación con permisos granulares
interface NavItem {
    text: string;
    path: string;
    icon: ReactElement;
    allowedRoles?: UserRole[];  // ⭐ Roles permitidos (si no se especifica, todos)
    requiredPermission?: Permission;  // ⭐ Permiso específico requerido
}

interface NavigationProps {
    isMobile: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

// Componente de Navegación principal
const Navigation: React.FC<NavigationProps> = ({ isMobile, isOpen, onToggle }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { hasPermission } = usePermissions();
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const theme = useTheme();

    // Manejo del menú de usuario
    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handleLogout = () => {
        handleUserMenuClose();
        logout();
        navigate('/login');
    };

    // ✅ Array mejorado con permisos granulares - Estructura V3 DobackSoft
    const navItems: NavItem[] = useMemo(() => [
        {
            text: 'Panel de Control',
            path: '/dashboard',
            icon: <DashboardIcon fontSize="small" />,
            // ✅ TODOS pueden acceder al dashboard (pero verán contenido diferente)
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.VIEWER],
        },
        {
            text: 'Estabilidad',
            path: '/stability',
            icon: <StabilityIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.STABILITY_VIEW,
        },
        {
            text: 'Telemetría',
            path: '/telemetry',
            icon: <TelemetryIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.TELEMETRY_VIEW,
        },
        {
            text: 'Inteligencia Artificial',
            path: '/ai',
            icon: <AIIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.AI_VIEW,
        },
        {
            text: 'Geofences',
            path: '/geofences',
            icon: <GeofenceIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.GEOFENCES_VIEW,
        },
        {
            text: 'Subir Archivos',
            path: '/upload',
            icon: <CloudUploadIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.SESSIONS_UPLOAD,
        },
        {
            text: 'Operaciones',
            path: '/operations',
            icon: <OperationsIcon fontSize="small" />,
            // ✅ ADMIN y MANAGER
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
            requiredPermission: Permission.OPERATIONS_VIEW,
        },
        {
            text: 'Reportes',
            path: '/reports',
            icon: <ReportIcon fontSize="small" />,
            // ✅ ADMIN y MANAGER
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
            requiredPermission: Permission.REPORTS_VIEW,
        },
        {
            text: 'Alertas',
            path: '/alerts',
            icon: <BellIcon fontSize="small" />,
            // ✅ ADMIN y MANAGER (NUEVO)
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
            requiredPermission: Permission.ALERTS_VIEW,
        },
        {
            text: 'Administración',
            path: '/administration',
            icon: <ManagementIcon fontSize="small" />,
            // ✅ ADMIN y MANAGER (contenido diferente por rol)
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER],
        },
        {
            text: 'Configuración Sistema',
            path: '/admin',
            icon: <AdminIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.SYSTEM_VIEW_CONFIG,
        },
        {
            text: 'Base de Conocimiento',
            path: '/knowledge-base',
            icon: <KnowledgeIcon fontSize="small" />,
            // ✅ SOLO ADMIN
            allowedRoles: [UserRole.ADMIN],
            requiredPermission: Permission.KNOWLEDGE_BASE_VIEW,
        },
        {
            text: 'Mi Cuenta',
            path: '/profile',
            icon: <AccountIcon fontSize="small" />,
            // ✅ TODOS
            allowedRoles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.VIEWER],
        }
    ], []);

    // ✅ Filtrar ítems por permisos granulares
    const filteredNavItems = useMemo(() => {
        return navItems.filter(item => {
            // Verificar roles permitidos
            if (item.allowedRoles && user?.role) {
                const hasRequiredRole = item.allowedRoles.includes(user.role as UserRole);
                if (!hasRequiredRole) {
                    return false;
                }
            }

            // Verificar permiso específico si está definido
            if (item.requiredPermission) {
                const hasRequiredPermission = hasPermission(item.requiredPermission);
                if (!hasRequiredPermission) {
                    return false;
                }
            }

            return true;
        });
    }, [navItems, user?.role, hasPermission]);

    // Determina la tab activa basada en la ruta actual
    const getCurrentTabValue = () => {
        const currentPath = location.pathname;
        const index = filteredNavItems.findIndex(item => item.path === currentPath);
        return index >= 0 ? index : 0;
    };

    // Navegación para dispositivos móviles (drawer)
    const mobileNavigation = (
        <Drawer
            anchor="left"
            open={isOpen}
            onClose={onToggle}
            sx={{
                '& .MuiDrawer-paper': { width: 260, bgcolor: 'background.paper' },
            }}
        >
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
                <LogoIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                <Typography variant="subtitle1" color="primary" fontWeight="bold">{t('DobackSoft_1')}</Typography>
            </Box>

            <List sx={{ px: 0.5 }}>
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <ListItem key={item.path} disablePadding dense>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                onClick={onToggle}
                                sx={{
                                    py: 1,
                                    bgcolor: isActive ? 'action.selected' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    borderLeft: 2,
                                    borderColor: isActive ? 'primary.main' : 'transparent',
                                }}
                            >
                                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body2"
                                            fontWeight={isActive ? 'bold' : 'regular'}
                                            color={isActive ? 'primary.main' : 'text.primary'}
                                            fontSize="0.85rem"
                                        >
                                            {item.text}
                                        </Typography>
                                    }
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ p: .5, mt: 'auto' }}>
                <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose} dense>
                    <ListItemIcon>
                        <ProfileIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Mi Perfil"
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                    />
                </MenuItem>
                <MenuItem onClick={handleLogout} dense>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Cerrar Sesión"
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                    />
                </MenuItem>
            </Box>
        </Drawer>
    );

    // Navegación para escritorio
    const desktopNavigation = (
        <AppBar position="fixed" color="default" elevation={0} sx={{
            borderBottom: 1,
            borderColor: 'divider',
            height: 60,
            width: '100%',
            margin: 0,
            padding: 0,
            top: '0 !important',
            left: 0,
            right: 0
        }}>
            <Toolbar variant="dense" sx={{
                height: '100%',
                minHeight: '60px !important',
                width: '100%',
                paddingX: 0,
                paddingY: 0,
                margin: 0
            }}>
                {/* Tabs de navegación - Sin logo para aprovechar espacio */}
                <Tabs
                    value={getCurrentTabValue()}
                    aria-label="navigation tabs"
                    sx={{
                        flexGrow: 1,
                        minHeight: 60,
                        width: '100%', // Ancho completo
                        '& .MuiTab-root': {
                            minWidth: 'auto',
                            px: { xs: 1, md: 2 }, // Más padding para mejor distribución
                            minHeight: 60,
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.9rem' // Texto ligeramente más grande
                        }
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {filteredNavItems.map((item) => (
                        <Tab
                            key={item.path}
                            icon={item.icon}
                            label={item.text}
                            component={Link}
                            to={item.path}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>

                {/* Perfil de usuario */}
                <Tooltip title={user?.name || 'Usuario'}>
                    <IconButton
                        onClick={handleUserMenuOpen}
                        size="small"
                        sx={{ ml: 1 }}
                        aria-controls={Boolean(userMenuAnchor) ? 'user-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={Boolean(userMenuAnchor) ? 'true' : undefined}
                    >
                        <Avatar sx={{ width: 30, height: 30, bgcolor: theme.palette.primary.main }}>
                            {user?.name?.charAt(0) || 'U'}
                        </Avatar>
                    </IconButton>
                </Tooltip>

                <Menu
                    id="user-menu"
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }} dense>
                        <ListItemIcon>
                            <ProfileIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Mi Perfil"
                            primaryTypographyProps={{ fontSize: '0.85rem' }}
                        />
                    </MenuItem>
                    <MenuItem onClick={handleLogout} dense>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Cerrar Sesión"
                            primaryTypographyProps={{ fontSize: '0.85rem' }}
                        />
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );

    return (
        <>
            {isMobile ? mobileNavigation : desktopNavigation}
        </>
    );
};

export default Navigation; 