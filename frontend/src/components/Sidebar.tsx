import {
import { logger } from '../utils/logger';
    Analytics as AnalyticsIcon,
    Brightness4,
    Brightness7,
    Close as CloseIcon,
    Dashboard as DashboardIcon,
    BugReport as DiagnosticsIcon,
    EventNote as GestorEventosIcon,
    Psychology as ProcessingIcon,
    Assessment as ReportsIcon,
    Speed as SpeedIcon,
    Memory as TelemetriaIcon,
    DirectionsCar as VehiclesIcon
} from '@mui/icons-material';
import {
    Box,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useColorMode } from '../contexts/ThemeModeContext';

interface Vehicle {
    id: string;
    name: string;
    organizationId: string;
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode, toggleColorMode } = useColorMode();
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');

    // Obtener vehículos de la organización del usuario
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch('/api/vehicles', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setVehicles(data);
                }
            } catch (err) {
                logger.error('Error fetching vehicles:', err);
            }
        };

        fetchVehicles();
    }, []);

    // Cargar vehículo seleccionado desde localStorage
    useEffect(() => {
        const storedVehicle = localStorage.getItem('selectedVehicle');
        if (storedVehicle) {
            setSelectedVehicle(storedVehicle);
        }
    }, []);

    const handleVehicleChange = (event: any) => {
        const vehicleId = event.target.value;
        setSelectedVehicle(vehicleId);
        // Guardar en localStorage para sincronizar con otras páginas
        localStorage.setItem('selectedVehicle', vehicleId);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        onClose();
    };

    const menuItems = [
        {
            label: 'Gestión Flota',
            path: '/gestion-flota',
            icon: <DashboardIcon />,
        },
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: <DashboardIcon />,
        },
        {
            label: 'Estabilidad',
            path: '/estabilidad',
            icon: <SpeedIcon />,
        },
        {
            label: 'Telemetría',
            path: '/telemetria',
            icon: <TelemetriaIcon />,
        },
        {
            label: 'Vehículos',
            path: '/vehicles',
            icon: <VehiclesIcon />,
        },
        {
            label: 'Reportes',
            path: '/reports',
            icon: <ReportsIcon />,
        },
        {
            label: 'Gestor de Eventos',
            path: '/gestor-eventos',
            icon: <GestorEventosIcon />,
        },
        {
            label: 'Procesamiento Inteligente',
            path: '/processing-management',
            icon: <ProcessingIcon />,
        },
        {
            label: 'KPIs Avanzados',
            path: '/advanced-kpis',
            icon: <AnalyticsIcon />,
        },
        {
            label: 'Diagnóstico del Sistema',
            path: '/diagnostics',
            icon: <DiagnosticsIcon />,
        },
    ];

    return (
        <Drawer
            anchor="left"
            open={open}
            onClose={onClose}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 280,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={700}>
                        Doback Soft
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Selector de vehículo */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Vehículo Seleccionado
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Vehículo</InputLabel>
                        <Select
                            value={selectedVehicle}
                            label="Vehículo"
                            onChange={handleVehicleChange}
                        >
                            {vehicles.map((vehicle) => (
                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Navegación */}
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.main',
                                        color: 'primary.contrastText',
                                        '&:hover': {
                                            backgroundColor: 'primary.dark',
                                        },
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: location.pathname === item.path ? 'inherit' : 'text.secondary',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Configuración */}
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Configuración
                    </Typography>
                    <IconButton onClick={toggleColorMode} title={mode === 'light' ? t('modo_oscuro') : t('modo_claro')}>
                        {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                    </IconButton>
                </Box>
            </Box>
        </Drawer>
    );
};

export default Sidebar; 