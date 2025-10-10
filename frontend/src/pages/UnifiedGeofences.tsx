import {
    Analytics,
    LocationOn,
    Rule,
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
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { GeofenceRulesManager } from '../components/geofences/GeofenceRulesManager';
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
            id={`geofence-tabpanel-${index}`}
            aria-labelledby={`geofence-tab-${index}`}
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

function a11yProps(index: number) {
    return {
        id: `geofence-tab-${index}`,
        'aria-controls': `geofence-tabpanel-${index}`,
    };
}

const UnifiedGeofences: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);

    React.useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
        logger.info('Cambio de pestaña en Geocercas', {
            tab: newValue,
            userId: user?.id
        });
    };

    const handleRuleCreated = (rule: any) => {
        logger.info('Nueva regla de geocerca creada', {
            ruleId: rule.id,
            userId: user?.id
        });
    };

    const handleRuleUpdated = (rule: any) => {
        logger.info('Regla de geocerca actualizada', {
            ruleId: rule.id,
            userId: user?.id
        });
    };

    const handleRuleDeleted = (ruleId: string) => {
        logger.info('Regla de geocerca eliminada', {
            ruleId,
            userId: user?.id
        });
    };

    return (
        <ErrorBoundary>
            <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Header */}
                <Paper elevation={1} sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Gestión de Geocercas
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Configura y gestiona las reglas de geocercas para monitoreo automático de vehículos
                    </Typography>
                </Paper>

                {/* Tabs */}
                <Paper elevation={1} sx={{ mb: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={currentTab}
                            onChange={handleTabChange}
                            aria-label="Geocercas tabs"
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            <Tab
                                label="Reglas de Geocercas"
                                icon={<Rule />}
                                iconPosition="start"
                                {...a11yProps(0)}
                            />
                            <Tab
                                label="Zonas Geográficas"
                                icon={<LocationOn />}
                                iconPosition="start"
                                {...a11yProps(1)}
                            />
                            <Tab
                                label="Analíticas"
                                icon={<Analytics />}
                                iconPosition="start"
                                {...a11yProps(2)}
                            />
                            <Tab
                                label="Configuración"
                                icon={<Settings />}
                                iconPosition="start"
                                {...a11yProps(3)}
                            />
                        </Tabs>
                    </Box>

                    {/* Contenido de las pestañas */}
                    <TabPanel value={currentTab} index={0}>
                        <GeofenceRulesManager
                            onRuleCreated={handleRuleCreated}
                            onRuleUpdated={handleRuleUpdated}
                            onRuleDeleted={handleRuleDeleted}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={1}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Gestión de Zonas Geográficas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidad en desarrollo. Aquí podrás crear y gestionar zonas geográficas
                                para aplicar reglas de geocercas.
                            </Typography>
                        </Box>
                    </TabPanel>

                    <TabPanel value={currentTab} index={2}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Analíticas de Geocercas
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidad en desarrollo. Aquí podrás ver estadísticas y análisis
                                del comportamiento de las geocercas.
                            </Typography>
                        </Box>
                    </TabPanel>

                    <TabPanel value={currentTab} index={3}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                Configuración del Sistema
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Funcionalidad en desarrollo. Aquí podrás configurar parámetros
                                globales del sistema de geocercas.
                            </Typography>
                        </Box>
                    </TabPanel>
                </Paper>

                {/* Información del sistema */}
                <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Sistema de Geocercas Activo
                    </Typography>
                    <Typography variant="body2">
                        El sistema de geocercas está configurado para monitorear automáticamente
                        la ubicación de los vehículos y ejecutar reglas en tiempo real.
                        Las reglas se evalúan continuamente y pueden generar alertas,
                        notificaciones o acciones automáticas.
                    </Typography>
                </Alert>
            </Box>
        </ErrorBoundary>
    );
};

export default UnifiedGeofences;
