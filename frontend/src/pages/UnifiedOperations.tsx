import {
    Notifications as AlertsIcon,
    Event as EventsIcon,
    Build as MaintenanceIcon
} from '@mui/icons-material';
import {
    Box,
    Card,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import React, { Suspense, lazy, useState } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import { OptimizedLoadingSpinner } from '../components/ui/OptimizedLoadingSpinner';
import { logger } from '../utils/logger';

// Lazy loading de componentes
const GestorEventos = lazy(() => import('../components/events/GestorEventos').then(module => ({ default: module.GestorEventos })));
const AlertsManager = lazy(() => import('./AlertsManager'));
const MaintenanceManager = lazy(() => import('./MaintenanceManager'));

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = React.memo<TabPanelProps>(({ children, value, index }) => {
    const isVisible = value === index;

    return (
        <div
            role="tabpanel"
            hidden={!isVisible}
            id={`operations-tabpanel-${index}`}
            aria-labelledby={`operations-tab-${index}`}
        >
            {isVisible && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
});

TabPanel.displayName = 'TabPanel';

/**
 * Módulo Operaciones - Unifica Eventos, Alertas y Mantenimiento
 * Según estructura V3: Un solo módulo con pestañas internas
 */
const UnifiedOperations: React.FC = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
        logger.info(`[UnifiedOperations] Cambio a pestaña: ${newValue}`);
    };

    return (
        <ErrorBoundary>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 'calc(100vh - 80px)',
                width: '100%',
                backgroundColor: 'background.default',
                p: 3
            }}>
                {/* Header */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Operaciones
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestión de Eventos, Alertas y Mantenimiento
                    </Typography>
                </Box>

                {/* Tabs Navigation */}
                <Card sx={{ mb: 2 }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        aria-label="operaciones tabs"
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none',
                                fontWeight: 500,
                                fontSize: '0.95rem'
                            }
                        }}
                    >
                        <Tab
                            icon={<EventsIcon />}
                            label="Eventos"
                            iconPosition="start"
                            id="operations-tab-0"
                            aria-controls="operations-tabpanel-0"
                        />
                        <Tab
                            icon={<AlertsIcon />}
                            label="Alertas"
                            iconPosition="start"
                            id="operations-tab-1"
                            aria-controls="operations-tabpanel-1"
                        />
                        <Tab
                            icon={<MaintenanceIcon />}
                            label="Mantenimiento"
                            iconPosition="start"
                            id="operations-tab-2"
                            aria-controls="operations-tabpanel-2"
                        />
                    </Tabs>
                </Card>

                {/* Tab Content */}
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <TabPanel value={currentTab} index={0}>
                        <Suspense fallback={<OptimizedLoadingSpinner />}>
                            <GestorEventos />
                        </Suspense>
                    </TabPanel>

                    <TabPanel value={currentTab} index={1}>
                        <Suspense fallback={<OptimizedLoadingSpinner />}>
                            <AlertsManager />
                        </Suspense>
                    </TabPanel>

                    <TabPanel value={currentTab} index={2}>
                        <Suspense fallback={<OptimizedLoadingSpinner />}>
                            <MaintenanceManager />
                        </Suspense>
                    </TabPanel>
                </Box>
            </Box>
        </ErrorBoundary>
    );
};

export default UnifiedOperations;

