/**
 * 🏢 PÁGINA DE ADMINISTRACIÓN - BOMBEROS MADRID
 * Gestión completa de Parques, Vehículos, Geocercas y Zonas
 */

import {
    DirectionsCar,
    Layers,
    LocalParking,
    LocationOn,
    Settings
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Paper,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { GeofencesManagement } from '../components/admin/GeofencesManagement';
import { ParksManagement } from '../components/admin/ParksManagement';
import { VehiclesManagement } from '../components/admin/VehiclesManagement';
import { ZonesManagement } from '../components/admin/ZonesManagement';
import { useAuth } from '../contexts/AuthContext';
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

export const AdministrationPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
        logger.info('Cambio de pestaña en Administración', {
            tab: newValue,
            userId: user?.id
        });
    };

    // Solo ADMIN puede acceder
    // Debug: ver el rol del usuario
    logger.info('👤 Usuario en AdministrationPage:', user);
    logger.info('🔐 Rol del usuario:', user?.role);
    logger.info('✅ isAdmin():', isAdmin ? isAdmin() : 'función no disponible');

    // Verificar acceso usando isAdmin()
    const hasAdminAccess = isAdmin ? isAdmin() : false;

    if (!hasAdminAccess) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">
                    <Typography variant="h6">Acceso Denegado</Typography>
                    <Typography>
                        Solo los administradores pueden acceder a esta sección.
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
                        Debug: Tu rol actual es "{user?.role}". Se requiere rol "ADMIN".
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Header */}
            <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Settings fontSize="large" color="primary" />
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Administración del Sistema
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Gestión completa de parques, vehículos, geocercas y zonas
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* Tabs Navigation */}
            <Paper elevation={1} sx={{ mb: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        aria-label="Administración tabs"
                        variant="fullWidth"
                    >
                        <Tab
                            label="Parques"
                            icon={<LocalParking />}
                            iconPosition="start"
                            id="admin-tab-0"
                        />
                        <Tab
                            label="Vehículos"
                            icon={<DirectionsCar />}
                            iconPosition="start"
                            id="admin-tab-1"
                        />
                        <Tab
                            label="Geocercas"
                            icon={<LocationOn />}
                            iconPosition="start"
                            id="admin-tab-2"
                        />
                        <Tab
                            label="Zonas"
                            icon={<Layers />}
                            iconPosition="start"
                            id="admin-tab-3"
                        />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <TabPanel value={currentTab} index={0}>
                    <ParksManagement />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                    <VehiclesManagement />
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                    <GeofencesManagement />
                </TabPanel>

                <TabPanel value={currentTab} index={3}>
                    <ZonesManagement />
                </TabPanel>
            </Paper>

            {/* Info Footer */}
            <Paper elevation={1} sx={{ p: 2 }}>
                <Alert severity="info">
                    <Typography variant="subtitle2" gutterBottom>
                        💡 Sistema de Administración Activo
                    </Typography>
                    <Typography variant="body2">
                        Esta sección permite gestionar todos los recursos del sistema: parques de bomberos,
                        vehículos, geocercas de Radar.com y zonas geográficas. Todos los cambios se sincronizan
                        automáticamente con el sistema de telemetría en tiempo real.
                    </Typography>
                </Alert>
            </Paper>
        </Box>
    );
};

export default AdministrationPage;

