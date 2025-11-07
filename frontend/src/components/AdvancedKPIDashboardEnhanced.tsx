
import {
import { logger } from '../utils/logger';
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Grid,
    Paper,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';
import DateRangeSelector, { DateRangeConfig } from './DateRangeSelector';

import MultiVehicleSelector, { VehicleSelection } from './MultiVehicleSelector';



interface VehicleStatus {
    isInBase: boolean;
    isWithRotative: boolean;
    lastUpdate: string;
    currentLocation?: string;
}

interface AdvancedKPIData {
    // Estados del vehículo
    vehicleStatus: VehicleStatus;

    // Tiempos por ubicación
    timeInBase: number; // minutos
    timeOutOfBase: number; // minutos
    timeInWorkshop?: number; // minutos
    timeInSensitiveZone?: number; // minutos
    totalOperationalTime: number; // minutos

    // Tiempos con/sin rotativo por ubicación
    timeInBaseWithRotative?: number; // minutos
    timeInBaseWithoutRotative?: number; // minutos
    timeOutOfBaseWithRotative?: number; // minutos
    timeOutOfBaseWithoutRotative?: number; // minutos
    timeInWorkshopWithRotative?: number; // minutos
    timeInWorkshopWithoutRotative?: number; // minutos

    // Tiempos generales
    timeWithRotative: number; // minutos
    timeWithoutRotative: number; // minutos
    activeTime: number; // minutos
    idleTime: number; // minutos

    // Distancias
    totalDistance: number; // km
    distanceInBase: number; // km
    distanceOutOfBase: number; // km

    // Velocidades
    maxSpeed: number; // km/h
    avgSpeed: number; // km/h
    timeExceedingSpeed?: number; // minutos

    // Excesos de velocidad
    speedExcesses: {
        minor: number; // 1-10 km/h sobre límite
        moderate: number; // 11-20 km/h sobre límite
        severe: number; // 21-30 km/h sobre límite
        verySevere?: number; // >30 km/h sobre límite
    };

    // Eventos por severidad
    stabilityEvents: {
        total: number;
        critical: number;
        dangerous: number;
        moderate?: number; // eventos moderados
        minor: number;
    };

    // Eventos por ubicación
    criticalEventsInPark?: number;
    criticalEventsOutOfPark?: number;
    criticalEventsInWorkshop?: number;
    dangerousEventsInPark?: number;
    dangerousEventsOutOfPark?: number;
    dangerousEventsInWorkshop?: number;

    // Claves operativas
    key2Minutes?: number; // Rotativo ON fuera de parque
    key5Minutes?: number; // Rotativo OFF fuera de parque

    // Eficiencia
    fuelEfficiency: number; // km/l

    // Rotativo
    rotativeUsage: {
        totalTime: number; // minutos
        activeTime: number; // minutos
        idleTime: number; // minutos
        efficiency: number; // porcentaje
    };

    // Geocercas
    geofenceEvents: {
        entries: number;
        exits: number;
        violations: number;
    };

    // Estadísticas generales
    totalGPSPoints: number;
    dataQuality: number; // porcentaje
    lastMaintenance?: string;
    nextMaintenance?: string;
}

interface AdvancedKPIDashboardEnhancedProps {
    vehicleId?: string;
    date?: string;
}



// Componentes estilizados
const DashboardContainer = (props: any) => (
    <Box
        sx={{
            padding: 3,
            backgroundColor: 'background.default',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden'
        }}
        {...props}
    />
);





export const AdvancedKPIDashboardEnhanced: React.FC<AdvancedKPIDashboardEnhancedProps> = ({
    vehicleId,
    date = new Date().toISOString().slice(0, 10)
}) => {
    const [kpiData, setKpiData] = useState<AdvancedKPIData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [dateRangeConfig, setDateRangeConfig] = useState<DateRangeConfig>({
        type: 'single',
        singleDate: new Date(date)
    });
    const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>({
        type: 'select',
        vehicleIds: vehicleId ? [vehicleId] : []
    });

    // Funciones auxiliares
    const formatTime = (minutes: number): string => {
        if (minutes === 0) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };



    const fetchKPIData = async () => {
        if (vehicleSelection.type === 'select' && vehicleSelection.vehicleIds.length === 0) {
            setKpiData(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Construir parámetros de consulta basados en la configuración
            let queryParams = '';

            if (vehicleSelection.type === 'select') {
                if (vehicleSelection.vehicleIds.length === 1) {
                    queryParams += `vehicleId=${vehicleSelection.vehicleIds[0]}`;
                } else if (vehicleSelection.vehicleIds.length > 1) {
                    queryParams += `vehicleIds=${vehicleSelection.vehicleIds.join(',')}`;
                }
            } else if (vehicleSelection.type === 'all') {
                queryParams += 'allVehicles=true';
            }

            if (dateRangeConfig.type === 'single' && dateRangeConfig.singleDate) {
                queryParams += `&date=${dateRangeConfig.singleDate.toISOString().slice(0, 10)}`;
            } else if (dateRangeConfig.type === 'range' && dateRangeConfig.startDate && dateRangeConfig.endDate) {
                queryParams += `&startDate=${dateRangeConfig.startDate.toISOString().slice(0, 10)}`;
                queryParams += `&endDate=${dateRangeConfig.endDate.toISOString().slice(0, 10)}`;
                queryParams += `&dateRange=range`;
            } else if (dateRangeConfig.type === 'all_time') {
                queryParams += `&dateRange=all_time`;
            }

            logger.info(`Obteniendo KPIs con parámetros: ${queryParams}`);

            // Usar el endpoint correcto que existe en el backend
            const response = await apiService.get(
                `/api/advanced-kpi/dashboard?${queryParams}`
            );

            logger.info('Respuesta del servidor KPIs:', response);

            if (response.success && response.data) {
                // El backend devuelve datos en formato dashboard, necesitamos adaptarlos
                const dashboardData = response.data as any;

                // Adaptar los datos del backend al formato esperado por el componente
                const timeInParque = dashboardData.mainBoxes?.[0]?.value || 0; // Tiempo en Parque
                const timeEnTaller = dashboardData.mainBoxes?.[1]?.value || 0; // Tiempo en Taller
                const timeFueraParque = dashboardData.mainBoxes?.[2]?.value || 0; // Tiempo Fuera de Parque
                const totalTime = timeInParque + timeEnTaller + timeFueraParque;

                // Claves operativas (rotativo)
                const clave2Minutes = dashboardData.operationalKeys?.[0]?.value || 0; // Rotativo ON fuera
                const clave5Minutes = dashboardData.operationalKeys?.[1]?.value || 0; // Rotativo OFF fuera
                const timeWithRotative = clave2Minutes; // Tiempo con rotativo activo
                const timeWithoutRotative = clave5Minutes; // Tiempo sin rotativo activo

                // Estadísticas
                const totalDistance = dashboardData.statsBoxes?.[0]?.value || 0; // Distancia Recorrida
                const timeEnMovimiento = dashboardData.statsBoxes?.[1]?.value || 0; // Tiempo en Movimiento
                const timeDetenido = dashboardData.statsBoxes?.[2]?.value || 0; // Tiempo Detenido
                const totalPuntosGPS = dashboardData.statsBoxes?.[3]?.value || 0; // Puntos GPS

                // Velocidades
                const maxSpeed = dashboardData.speedBoxes?.[0]?.value || 0; // Velocidad Máxima
                const avgSpeed = dashboardData.speedBoxes?.[1]?.value || 0; // Velocidad Promedio

                // Excesos de velocidad
                const excesosLeves = dashboardData.speedExcessBoxes?.[0]?.value || 0;
                const excesosModerados = dashboardData.speedExcessBoxes?.[1]?.value || 0;
                const excesosGraves = dashboardData.speedExcessBoxes?.[2]?.value || 0;
                const excesosMuyGraves = dashboardData.speedExcessBoxes?.[3]?.value || 0;

                // Eventos
                const eventosCriticos = dashboardData.eventBoxes?.[0]?.value || 0;
                const eventosPeligrosos = dashboardData.eventBoxes?.[1]?.value || 0;
                const eventosModerados = dashboardData.eventBoxes?.[2]?.value || 0;
                const eventosLeves = dashboardData.eventBoxes?.[3]?.value || 0;

                // Obtener datos adicionales del rawData si está disponible
                const rawData = dashboardData.rawData || {};

                const adaptedData: AdvancedKPIData = {
                    vehicleStatus: {
                        isInBase: timeInParque > 0,
                        isWithRotative: timeWithRotative > 0,
                        lastUpdate: new Date().toISOString(),
                        currentLocation: timeInParque > 0 ? 'En Base' : 'Fuera de Base'
                    },
                    // Tiempos por ubicación
                    timeInBase: timeInParque,
                    timeOutOfBase: timeFueraParque,
                    timeInWorkshop: timeEnTaller,
                    timeInSensitiveZone: rawData.tiempoEnZonaSensible || 0,
                    totalOperationalTime: totalTime,

                    // Tiempos con/sin rotativo por ubicación
                    timeInBaseWithRotative: rawData.tiempoEnParqueConRotativo || 0,
                    timeInBaseWithoutRotative: rawData.tiempoEnParqueSinRotativo || 0,
                    timeOutOfBaseWithRotative: rawData.tiempoFueraParqueConRotativo || 0,
                    timeOutOfBaseWithoutRotative: rawData.tiempoFueraParqueSinRotativo || 0,
                    timeInWorkshopWithRotative: rawData.tiempoEnTallerConRotativo || 0,
                    timeInWorkshopWithoutRotative: rawData.tiempoEnTallerSinRotativo || 0,

                    // Tiempos generales
                    timeWithRotative: timeWithRotative,
                    timeWithoutRotative: timeWithoutRotative,
                    activeTime: timeEnMovimiento,
                    idleTime: timeDetenido,

                    // Distancias
                    totalDistance: totalDistance,
                    distanceInBase: 0, // No disponible en el backend actual
                    distanceOutOfBase: totalDistance,

                    // Velocidades
                    maxSpeed: maxSpeed,
                    avgSpeed: avgSpeed,
                    timeExceedingSpeed: rawData.tiempoExcediendoVelocidad || 0,

                    // Excesos de velocidad
                    speedExcesses: {
                        minor: excesosLeves,
                        moderate: excesosModerados,
                        severe: excesosGraves,
                        verySevere: excesosMuyGraves
                    },

                    // Eventos por severidad
                    stabilityEvents: {
                        total: eventosCriticos + eventosPeligrosos + eventosModerados + eventosLeves,
                        critical: eventosCriticos,
                        dangerous: eventosPeligrosos,
                        moderate: eventosModerados,
                        minor: eventosLeves
                    },

                    // Eventos por ubicación
                    criticalEventsInPark: rawData.eventosCriticosEnParque || 0,
                    criticalEventsOutOfPark: rawData.eventosCriticosFueraParque || 0,
                    criticalEventsInWorkshop: rawData.eventosCriticosEnTaller || 0,
                    dangerousEventsInPark: rawData.eventosPeligrososEnParque || 0,
                    dangerousEventsOutOfPark: rawData.eventosPeligrososFueraParque || 0,
                    dangerousEventsInWorkshop: rawData.eventosPeligrososEnTaller || 0,

                    // Claves operativas
                    key2Minutes: clave2Minutes,
                    key5Minutes: clave5Minutes,

                    // Eficiencia
                    fuelEfficiency: 0, // No disponible en el backend actual

                    // Rotativo
                    rotativeUsage: {
                        totalTime: timeWithRotative + timeWithoutRotative,
                        activeTime: timeWithRotative,
                        idleTime: timeWithoutRotative,
                        efficiency: totalTime > 0 ? (timeWithRotative / totalTime) * 100 : 0
                    },

                    // Geocercas
                    geofenceEvents: {
                        entries: 0, // No disponible en el backend actual
                        exits: 0, // No disponible en el backend actual
                        violations: 0 // No disponible en el backend actual
                    },

                    // Estadísticas generales
                    totalGPSPoints: totalPuntosGPS,
                    dataQuality: totalPuntosGPS > 0 ? 100 : 0
                };

                setKpiData(adaptedData);
            } else {
                throw new Error(response.error || 'Error al obtener datos de KPIs');
            }
        } catch (err) {
            logger.error('Error obteniendo KPIs:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            // No usar datos mock, mostrar error real
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchKPIData();
    }, [vehicleId, date, dateRangeConfig, vehicleSelection]);





    if (loading) {
        return (
            <DashboardContainer>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </DashboardContainer>
        );
    }

    if (error) {
        return (
            <DashboardContainer>
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            </DashboardContainer>
        );
    }

    // Mostrar los selectores siempre, y los datos solo si están disponibles
    const showData = kpiData && (vehicleSelection.type === 'all' || vehicleSelection.vehicleIds.length > 0);









    return (
        <DashboardContainer>
            {/* Selectores ultra-compactos - sin encabezado */}
            <Grid container spacing={0} mb={0}>
                <Grid item xs={6}>
                    <DateRangeSelector
                        onDateRangeChange={setDateRangeConfig}
                        initialConfig={dateRangeConfig}
                    />
                </Grid>
                <Grid item xs={6}>
                    <MultiVehicleSelector
                        onVehicleSelectionChange={setVehicleSelection}
                        initialSelection={vehicleSelection}
                    />
                </Grid>
            </Grid>



            {/* Mostrar datos solo si están disponibles */}
            {showData ? (
                <>
                    {/* Dashboard Grafana-style - 3 filas de 10 cajas */}
                    <Grid container spacing={0} sx={{ mb: 0 }}>
                        {/* Fila 1: Tiempos por Ubicación (10 cajas) */}
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🏢 Parque
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInBase)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔧 Taller
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInWorkshop || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🚗 Fuera
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeOutOfBase)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⚠️ Sensible
                                    </Typography>
                                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInSensitiveZone || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🚀 Movimiento
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.activeTime)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⏸️ Detenido
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.idleTime)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Parque ON
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInBaseWithRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Parque OFF
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInBaseWithoutRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Fuera ON
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeOutOfBaseWithRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Fuera OFF
                                    </Typography>
                                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeOutOfBaseWithoutRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Taller ON
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInWorkshopWithRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Taller OFF
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeInWorkshopWithoutRotative || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Fila 2: Eventos y Velocidad (10 cajas) */}
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🚨 Críticos
                                    </Typography>
                                    <Typography variant="h6" color={kpiData.stabilityEvents.critical > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.stabilityEvents.critical}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⚠️ Peligrosos
                                    </Typography>
                                    <Typography variant="h6" color={kpiData.stabilityEvents.dangerous > 0 ? 'warning.main' : 'success.main'} sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.stabilityEvents.dangerous}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        📊 Moderados
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.stabilityEvents.moderate || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ℹ️ Leves
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.stabilityEvents.minor || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🏢 Críticos P
                                    </Typography>
                                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.criticalEventsInPark || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🚗 Críticos F
                                    </Typography>
                                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.criticalEventsOutOfPark || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⚡ Vel. Máx
                                    </Typography>
                                    <Typography variant="h6" color={kpiData.maxSpeed > 60 ? 'error.main' : 'success.main'} sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.maxSpeed.toFixed(0)} km/h
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        📊 Vel. Prom
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.avgSpeed.toFixed(1)} km/h
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⏱️ Tiempo Exceso
                                    </Typography>
                                    <Typography variant="h6" color={(kpiData.timeExceedingSpeed || 0) > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.timeExceedingSpeed || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🟡 Excesos Leves
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.speedExcesses.minor || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🟠 Excesos Mod
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.speedExcesses.moderate || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔴 Excesos Graves
                                    </Typography>
                                    <Typography variant="h6" color={kpiData.speedExcesses.severe > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.speedExcesses.severe || 0}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Fila 3: Métricas Generales (10 cajas) */}
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        📏 Distancia
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.totalDistance.toFixed(1)} km
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        📍 GPS
                                    </Typography>
                                    <Typography variant="h6" color="info.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.totalGPSPoints}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        ⏱️ Tiempo Total
                                    </Typography>
                                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {(kpiData.totalOperationalTime / 60).toFixed(1)}h
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔑 Clave 2
                                    </Typography>
                                    <Typography variant="h6" color="warning.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.key2Minutes || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔑 Clave 5
                                    </Typography>
                                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {formatTime(kpiData.key5Minutes || 0)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={1.2} md={1.2}>
                            <Card sx={{ textAlign: 'center', p: 0.2, minHeight: 40, height: '100%', borderRadius: 0, border: 'none' }}>
                                <CardContent sx={{ p: 0.2, '&:last-child': { pb: 0.2 } }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                                        🔄 Eficiencia
                                    </Typography>
                                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                        {kpiData.rotativeUsage.efficiency.toFixed(1)}%
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            ) : (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Selecciona vehículos y configura el análisis para ver los KPIs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Los KPIs avanzados te mostrarán información detallada sobre el comportamiento de los vehículos,
                        incluyendo tiempos en diferentes zonas, eventos de estabilidad, excesos de velocidad y más.
                    </Typography>
                </Paper>
            )}
        </DashboardContainer>
    );
};

export default AdvancedKPIDashboardEnhanced;