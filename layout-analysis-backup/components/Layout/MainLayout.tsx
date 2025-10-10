import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import Navigation from '../Navigation';

export const MainLayout: React.FC = () => {
    const { ready } = useTranslation();
    const [isI18nReady, setIsI18nReady] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [isNavigationOpen, setIsNavigationOpen] = useState(false);

    const handleNavigationToggle = () => {
        setIsNavigationOpen(!isNavigationOpen);
    };

    useEffect(() => {
        if (ready) {
            setIsI18nReady(true);
        }
    }, [ready]);

    if (!isI18nReady) {
        return (
            <Box sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="app-layout">
            {/* Navegación fija */}
            <div className="navigation-container">
                <Navigation
                    isMobile={isMobile}
                    isOpen={isNavigationOpen}
                    onToggle={handleNavigationToggle}
                />
            </div>

            {/* Contenido principal */}
            <div className="main-content">
                <Outlet />
            </div>
        </div>
    );
};