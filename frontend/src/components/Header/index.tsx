import {
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import {
    AppBar,
    Badge,
    Box,
    IconButton,
    Toolbar,
    Typography,
    useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { t } from "../../i18n";

const Header: React.FC = () => {
    const theme = useTheme();
    const [darkMode, setDarkMode] = useState(false);
    const [notificationCount, setNotificationCount] = useState(3); // Número de notificaciones como ejemplo

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={1}
            sx={{
                zIndex: theme.zIndex.drawer + 1,
                borderBottom: `1px solid ${theme.palette.divider}`
            }}
        >
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', minHeight: '48px' }}>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                >
                    {t('DobackSoft_4')}</Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        size="small"
                        color="inherit"
                        sx={{
                            mr: 1,
                            position: 'relative',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                        }}
                        onClick={() => alert('Notificaciones')}
                        aria-label="Mostrar notificaciones"
                    >
                        <NotificationsIcon fontSize="small" />
                        {notificationCount > 0 && (
                            <Badge
                                badgeContent={notificationCount}
                                color="error"
                                sx={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px'
                                }}
                            />
                        )}
                    </IconButton>

                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={toggleDarkMode}
                        sx={{ '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' } }}
                        aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
                    >
                        {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header; 