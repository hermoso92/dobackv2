/**
 * EstadosYTiemposTab - Componente para MANAGER
 * 
 * Muestra:
 * - Estados operacionales del vehículo (Parque, Taller, Emergencia, Incendio, Regreso)
 * - Distribución de tiempo por estado
 * - Eventos agrupados por estado
 * - Gráficos interactivos
 * - Exportación a PDF
 */

import { Box, Card, CardContent, CircularProgress, Grid, Tab, Tabs, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';
import OperationalKeysTab from '../operations/OperationalKeysTab';

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
            id={`estados-tabpanel-${index}`}
            aria-labelledby={`estados-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

interface EstadosData {
    summary: {
        totalSessions: number;
        totalDuration: number;
        byState: {
            [key: string]: {
                count: number;
                duration: number;
                percentage: number;
            };
        };
    };
    events: any[];
    timeDistribution: {
        date: string;
        parque: number;
        taller: number;
        emergencia: number;
        incendio: number;
        regreso: number;
    }[];
}

const EstadosYTiemposTab: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<EstadosData | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchEstadosData();
    }, [user?.organizationId]);

    const fetchEstadosData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.get('/api/operational-keys/summary', {
                params: {
                    organizationId: user?.organizationId
                }
            });

            if (response.success) {
                setData(response.data as EstadosData);
            } else {
                throw new Error(response.error || 'Error cargando datos');
            }
        } catch (err) {
            logger.error('Error cargando estados y tiempos:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

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
                <Typography color="error">Error: {error}</Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box p={3}>
                <Typography>No hay datos disponibles</Typography>
            </Box>
        );
    }

    // Preparar datos para gráfico de pastel
    const pieData = {
        labels: Object.keys(data.summary.byState).map(state => {
            const stateNames: { [key: string]: string } = {
                'PARQUE': 'En Parque',
                'TALLER': 'En Taller',
                'EMERGENCIA': 'Emergencia',
                'INCENDIO': 'Incendio',
                'REGRESO': 'Regreso'
            };
            return stateNames[state] || state;
        }),
        datasets: [{
            data: Object.values(data.summary.byState).map(s => s.percentage),
            backgroundColor: [
                'rgba(54, 162, 235, 0.8)',   // Parque - Azul
                'rgba(255, 206, 86, 0.8)',   // Taller - Amarillo
                'rgba(255, 99, 132, 0.8)',   // Emergencia - Rojo
                'rgba(255, 159, 64, 0.8)',   // Incendio - Naranja
                'rgba(75, 192, 192, 0.8)',   // Regreso - Verde
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 2,
        }]
    };

    // Preparar datos para gráfico de barras (distribución temporal)
    const barData = {
        labels: data.timeDistribution.map(d => d.date),
        datasets: [
            {
                label: 'Parque',
                data: data.timeDistribution.map(d => d.parque),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
            },
            {
                label: 'Taller',
                data: data.timeDistribution.map(d => d.taller),
                backgroundColor: 'rgba(255, 206, 86, 0.8)',
            },
            {
                label: 'Emergencia',
                data: data.timeDistribution.map(d => d.emergencia),
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
            },
            {
                label: 'Incendio',
                data: data.timeDistribution.map(d => d.incendio),
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
            },
            {
                label: 'Regreso',
                data: data.timeDistribution.map(d => d.regreso),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
            },
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Fecha'
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Horas'
                },
                ticks: {
                    callback: function (value: any) {
                        return value + ' h';
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' horas';
                    }
                }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        return context.label + ': ' + context.parsed.toFixed(2) + '%';
                    }
                }
            }
        }
    };

    return (
        <Box>
            {/* Resumen General */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Total Sesiones
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {data.summary.totalSessions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                Duración Total
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {(data.summary.totalDuration / 3600).toFixed(1)} h
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {Object.entries(data.summary.byState).map(([state, stats]) => (
                    <Grid item xs={12} md={3} key={state}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                    {state.charAt(0) + state.slice(1).toLowerCase()}
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {(stats.duration / 3600).toFixed(1)} h
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {stats.percentage.toFixed(1)}% del tiempo
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Pestañas */}
            <Card>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="estados tabs">
                    <Tab label="Distribución por Estado" />
                    <Tab label="Distribución Temporal" />
                    <Tab label="Eventos Detallados" />
                </Tabs>

                {/* Panel 1: Distribución por Estado (Pie Chart) */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Distribución de Tiempo por Estado
                        </Typography>
                        <Pie data={pieData} options={pieOptions} />
                    </Box>
                </TabPanel>

                {/* Panel 2: Distribución Temporal (Bar Chart) */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Distribución de Tiempo a lo Largo del Tiempo
                        </Typography>
                        <Bar data={barData} options={barOptions} />
                    </Box>
                </TabPanel>

                {/* Panel 3: Eventos Detallados */}
                <TabPanel value={activeTab} index={2}>
                    <OperationalKeysTab organizationId={''} />
                </TabPanel>
            </Card>
        </Box>
    );
};

export default EstadosYTiemposTab;

