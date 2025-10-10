import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { DASHBOARD_ENDPOINTS, createAuthHeaders } from '../../config/api';
import { t } from "../../i18n";
import { logger } from "../../utils/logger";

interface DashboardMetrics {
    totalVehicles: number;
    totalStabilitySessions: number;
    totalCANGPSSessions: number;
    totalAlarms: number;
}

interface VehicleStats {
    id: number;
    brand: string;
    model: string;
    totalSessions: number;
    lastSession: string | null;
}

interface AlarmStats {
    [key: string]: number;
}

export const Dashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
    const [alarmStats, setAlarmStats] = useState<AlarmStats>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const headers = createAuthHeaders(token);

                const [metricsRes, vehiclesRes, alarmsRes] = await Promise.all([
                    fetch(DASHBOARD_ENDPOINTS.METRICS, { headers }),
                    fetch(DASHBOARD_ENDPOINTS.VEHICLES, { headers }),
                    fetch(DASHBOARD_ENDPOINTS.ALARMS, { headers })
                ]);

                if (!metricsRes.ok || !vehiclesRes.ok || !alarmsRes.ok) {
                    throw new Error('Error fetching dashboard data');
                }

                const [metricsData, vehiclesData, alarmsData] = await Promise.all([
                    metricsRes.json(),
                    vehiclesRes.json(),
                    alarmsRes.json()
                ]);

                logger.info('Dashboard: datos recibidos', {
                    metrics: metricsData,
                    vehicles: vehiclesData,
                    alarms: alarmsData
                });

                setMetrics(metricsData);
                setVehicleStats(vehiclesData);
                setAlarmStats(alarmsData);
            } catch (err) {
                logger.error('Dashboard: error detallado', {
                    error: err instanceof Error ? err.message : 'Error desconocido'
                });
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                {t('dashboard_4')}</Typography>

            {/* Métricas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid xs={12} sm={6} md={3} component="div">
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('vehiculos_8')}</Typography>
                            <Typography variant="h5">
                                {metrics?.totalVehicles || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3} component="div">
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('sesiones_de_estabilidad')}</Typography>
                            <Typography variant="h5">
                                {metrics?.totalStabilitySessions || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3} component="div">
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('datos_cangps')}</Typography>
                            <Typography variant="h5">
                                {metrics?.totalCANGPSSessions || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid xs={12} sm={6} md={3} component="div">
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('alarmas')}</Typography>
                            <Typography variant="h5">
                                {metrics?.totalAlarms || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Gráfico de alarmas */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {t('alarmas_por_tipo')}</Typography>
                    <Box height={300}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(alarmStats).map(([type, count]) => ({
                                type,
                                count
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>

            {/* Lista de vehículos */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        {t('vehiculos_activos')}</Typography>
                    <Grid container spacing={2}>
                        {vehicleStats.map((vehicle) => (
                            <Grid xs={12} sm={6} md={4} component="div" key={vehicle.id}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="h6">
                                            {vehicle.brand} {vehicle.model}
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {t('sesiones_2')}{vehicle.totalSessions}
                                        </Typography>
                                        <Typography color="textSecondary">
                                            {t('ultima_sesion')}{vehicle.lastSession ? new Date(vehicle.lastSession).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}; 