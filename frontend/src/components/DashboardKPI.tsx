import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface DashboardMetrics {
    totalVehicles?: number;
    activeVehicles?: number;
    totalStabilitySessions?: number;
    totalCANGPSSessions?: number;
    totalAlarms?: number;
    totalAlerts?: number;
    activeAlerts?: number;
    [key: string]: any;
}

const iconSx = { fontSize: 28, mr: 1 } as const;

const DashboardKPI: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const response = await apiService.get<any>('/api/dashboard/stats');
                const data = response.data ?? response;
                setMetrics(data as DashboardMetrics);
            } catch (err) {
                logger.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <Box p={2} textAlign="center"><CircularProgress size={24} /></Box>;

    const items = [
        { label: t('vehiculos_8'), value: metrics?.totalVehicles ?? metrics?.activeVehicles ?? 0, icon: <DirectionsCarIcon sx={iconSx} color="primary" /> },
        { label: t('sesiones_de_estabilidad'), value: (metrics as any)?.recentEvents?.length ?? metrics?.totalStabilitySessions ?? 0, icon: <TimelineIcon sx={iconSx} color="secondary" /> },
        { label: t('datos_cangps'), value: (metrics as any)?.totalCANGPSSessions ?? 0, icon: <GpsFixedIcon sx={iconSx} color="success" /> },
        { label: t('alarmas'), value: metrics?.totalAlerts ?? metrics?.activeAlerts ?? 0, icon: <WarningAmberIcon sx={iconSx} color="error" /> }
    ];

    return (
        <Box p={2} bgcolor="background.default">
            <Grid container spacing={2}>
                {items.map(it => (
                    <Grid key={it.label} item xs={6} md={3}>
                        <Card sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                            {it.icon}
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">{it.label}</Typography>
                                <Typography variant="h5">{it.value}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default DashboardKPI; 