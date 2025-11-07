/**
 * EstadosYTiemposTab - Dashboard de Estados Operacionales para Bomberos
 * 
 * Muestra métricas específicas para operaciones de bomberos:
 * - Emergencias atendidas (IDA → INCIDENCIA → VUELTA)
 * - Tiempo promedio en incidencia
 * - Distancia IDA vs VUELTA
 * - Distribución por estado (claves 0-5)
 * 
 * Layout modular sin scroll obligatorio (reglas DobackSoft V3)
 * 
 * @version 2.0
 * @date 2025-11-05
 */

import {
    ClockIcon,
    DocumentArrowDownIcon,
    FireIcon,
    MapPinIcon,
    TruckIcon
} from '@heroicons/react/24/outline';
import { Box, Card, CardContent, CircularProgress, Grid, Tab, Tabs, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import { usePDFExport } from '../../hooks/usePDFExport';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';
import { normalizeKPI } from '../../utils/normalizeKPIs';
import { KPICard } from '../Dashboard/ExecutiveDashboard/components/KPICard';
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
    
    // Hook para exportación PDF
    const { exportEnhancedTabToPDF, isExporting } = usePDFExport();

    useEffect(() => {
        fetchEstadosData();
    }, [user?.organizationId]);

    const fetchEstadosData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiService.get('/api/operational-keys/estados-summary', {
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

    // Calcular métricas específicas para bomberos
    const numEmergencias = data?.summary?.numEmergencias || 0;
    const tiempoPromedioIncidencia = data?.summary?.tiempoPromedioIncidencia || 0;
    const distanciaIda = data?.summary?.distanciaIda || 0;
    const distanciaVuelta = data?.summary?.distanciaVuelta || 0;

    return (
        <Box sx={{ 
            p: 2, 
            minHeight: '100vh',  // ✅ Evita cortes en monitores altos
            height: '100%', 
            overflow: 'auto' 
        }} id="estados-tiempos-tab-content">
            {/* Botón Exportar PDF */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={() => exportEnhancedTabToPDF(
                        'estados-tiempos-tab-content',
                        'Reporte_Estados_Tiempos_Bomberos',
                        {
                            title: 'Estados & Tiempos - Dashboard Bomberos',
                            subtitle: `Generado: ${new Date().toLocaleString('es-ES')}`,
                            kpis: {
                                emergencias: numEmergencias,
                                tiempoIncidencia: tiempoPromedioIncidencia,
                                distanciaIda: distanciaIda,
                                distanciaVuelta: distanciaVuelta,
                                totalSesiones: data?.summary?.totalSessions || 0,
                                duracionTotal: data?.summary?.totalDuration || 0
                            }
                        }
                    )}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                    {isExporting ? 'Generando PDF...' : 'Exportar Reporte PDF'}
                </button>
            </div>

            {/* FILA 1: KPIs Principales para Bomberos - Layout Modular Sin Scroll */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <FireIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Emergencias Atendidas</div>
                                <div className="text-2xl font-bold text-red-600">{normalizeKPI(numEmergencias)}</div>
                            </div>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <ClockIcon className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Tiempo Prom. Incidencia</div>
                                <div className="text-2xl font-bold text-orange-600">
                                    {Math.floor(tiempoPromedioIncidencia / 60)}:{(tiempoPromedioIncidencia % 60).toString().padStart(2, '0')} min
                                </div>
                            </div>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <TruckIcon className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Distancia IDA</div>
                                <div className="text-2xl font-bold text-blue-600">{normalizeKPI(distanciaIda)} km</div>
                            </div>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <MapPinIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-500">Distancia VUELTA</div>
                                <div className="text-2xl font-bold text-green-600">{normalizeKPI(distanciaVuelta)} km</div>
                            </div>
                        </div>
                    </div>
                </Grid>
            </Grid>

            {/* FILA 2: Gráficos con altura fija - Layout Modular */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400, minHeight: 400 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom className="text-slate-700 font-semibold">
                                Distribución por Estado
                            </Typography>
                            <Box sx={{ height: 340 }}>
                                <Pie key="estados-pie-chart" data={pieData} options={pieOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400, minHeight: 400 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom className="text-slate-700 font-semibold">
                                Evolución Temporal
                            </Typography>
                            <Box sx={{ height: 340, overflow: 'auto' }}>
                                <Bar key="estados-bar-chart" data={barData} options={barOptions} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* FILA 3: Timeline de Claves Operacionales (Opcional - Con Scroll) */}
            <Card sx={{ mt: 2 }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="estados tabs">
                    <Tab label="Resumen Estados" />
                    <Tab label="Timeline Detallado" />
                </Tabs>

                {/* Panel 1: Resumen de estados */}
                <TabPanel value={activeTab} index={0}>
                    <Box sx={{ height: 300, overflow: 'auto' }}>
                        <Grid container spacing={2}>
                {Object.entries(data.summary.byState).map(([state, stats]) => (
                                <Grid item xs={12} md={4} key={state}>
                                    <Card variant="outlined">
                            <CardContent>
                                            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    {state.charAt(0) + state.slice(1).toLowerCase()}
                                </Typography>
                                            <Typography variant="h5" color="primary">
                                    {(stats.duration / 3600).toFixed(1)} h
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                                {stats.percentage.toFixed(1)}% del tiempo total
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
                    </Box>
                </TabPanel>

                {/* Panel 2: Timeline detallado de claves */}
                <TabPanel value={activeTab} index={1}>
                    <Box sx={{ height: 400, overflow: 'auto' }}>
                        <OperationalKeysTab organizationId={user?.organizationId || ''} />
                    </Box>
                </TabPanel>
            </Card>
        </Box>
    );
};

export default EstadosYTiemposTab;

