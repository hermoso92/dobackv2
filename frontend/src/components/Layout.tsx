import {
import { logger } from '../utils/logger';
    DirectionsCar as CarIcon,
    Dashboard as DashboardIcon,
    BugReport as DiagnosticsIcon,
    EventNote as EventIcon,
    Logout as LogoutIcon,
    Menu as MenuIcon,
    Person as ProfileIcon,
    Speed as SpeedIcon,
    Memory as TelemetryIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from "../i18n";

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Estabilidad', icon: <SpeedIcon />, path: '/estabilidad' },
    { text: 'Telemetría', icon: <TelemetryIcon />, path: '/telemetria' },
    { text: 'Vehículos', icon: <CarIcon />, path: '/vehiculos' },
    { text: 'Gestor de Eventos', icon: <EventIcon />, path: '/gestor-eventos' },
    { text: 'Carga de Datos', icon: <UploadIcon />, path: '/carga-datos' },
    { text: 'Diagnóstico', icon: <DiagnosticsIcon />, path: '/diagnostics' },
    { text: 'Perfil', icon: <ProfileIcon />, path: '/perfil' }
];

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
    const { logout } = useAuth();

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMenuAnchor(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMenuAnchor(null);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        handleMobileMenuClose();
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            logger.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {t('dobacksoft')}</Typography>

                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/dashboard')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/dashboard' ? '2px solid white' : 'none'
                            }}
                            startIcon={<DashboardIcon />}
                        >
                            {t('dashboard_1')}</Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/vehiculos')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/vehiculos' ? '2px solid white' : 'none'
                            }}
                            startIcon={<CarIcon />}
                        >
                            {t('vehiculos_1')}</Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/telemetria')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/telemetria' ? '2px solid white' : 'none'
                            }}
                            startIcon={<TelemetryIcon />}
                        >
                            {t('telemetria')}</Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/estabilidad-inteligente')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/estabilidad-inteligente' ? '2px solid white' : 'none'
                            }}
                            startIcon={<SpeedIcon />}
                        >
                            {t('estabilidad_inteligente')}</Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/gestor-eventos')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/gestor-eventos' ? '2px solid white' : 'none'
                            }}
                            startIcon={<EventIcon />}
                        >
                            {t('gestor_de_eventos_1')}</Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/diagnostics')}
                            sx={{
                                mx: 1,
                                borderBottom: location.pathname === '/diagnostics' ? '2px solid white' : 'none'
                            }}
                            startIcon={<DiagnosticsIcon />}
                        >
                            Diagnóstico</Button>
                        <Button
                            color="inherit"
                            onClick={handleLogout}
                            sx={{ mx: 1 }}
                            startIcon={<LogoutIcon />}
                        >
                            {t('cerrar_sesion')}</Button>
                    </Box>

                    {/* Mobile Menu Button */}
                    <IconButton
                        color="inherit"
                        aria-label="menu"
                        onClick={handleMobileMenuOpen}
                        sx={{ display: { xs: 'flex', md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Mobile Menu */}
            <Menu
                anchorEl={mobileMenuAnchor}
                open={Boolean(mobileMenuAnchor)}
                onClose={handleMobileMenuClose}
                sx={{ display: { xs: 'block', md: 'none' } }}
            >
                {menuItems.map((item) => (
                    <MenuItem
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                    >
                        {item.icon}
                        <Typography sx={{ ml: 1 }}>{item.text}</Typography>
                    </MenuItem>
                ))}
                <MenuItem onClick={handleLogout}>
                    <LogoutIcon />
                    <Typography sx={{ ml: 1 }}>{t('cerrar_sesion_1')}</Typography>
                </MenuItem>
            </Menu>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout; 