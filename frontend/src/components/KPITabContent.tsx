import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

interface KPIData {
    vehicleStatus: {
        isInBase: boolean;
        isWithRotative: boolean;
    };
    totalDistance: number;
    maxSpeed: number;
    avgSpeed: number;
    totalGPSPoints: number;
    timeInBase: number;
    timeOutOfBase: number;
    timeWithRotative: number;
    timeWithoutRotative: number;
    totalOperationalTime: number;
    activeTime: number;
    fuelEfficiency: number;
    rotativeUsage: {
        efficiency: number;
    };
    stabilityEvents: {
        critical: number;
        dangerous: number;
    };
    speedExcesses: {
        severe: number;
    };
}

interface KPITabContentProps {
    kpiData: KPIData;
    formatTime: (minutes: number) => string;
    calculatePercentage: (value: number, total: number) => number;
}

export const renderOperationalContent = ({ kpiData, formatTime, calculatePercentage }: KPITabContentProps) => (
    <>
        {/* Estado del vehículo - Compacto */}
        <Grid container spacing={2} mb={3}>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📍 Ubicación
                        </Typography>
                        <Typography variant="h6" color={kpiData.vehicleStatus.isInBase ? 'success.main' : 'warning.main'}>
                            {kpiData.vehicleStatus.isInBase ? 'En Base' : 'Fuera'}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            🔄 Rotativo
                        </Typography>
                        <Typography variant="h6" color={kpiData.vehicleStatus.isWithRotative ? 'success.main' : 'warning.main'}>
                            {kpiData.vehicleStatus.isWithRotative ? 'ON' : 'OFF'}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📏 Distancia
                        </Typography>
                        <Typography variant="h6" color="primary">
                            {kpiData.totalDistance.toFixed(1)} km
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            ⚡ Vel. Máx
                        </Typography>
                        <Typography variant="h6" color={kpiData.maxSpeed > 80 ? 'error.main' : 'success.main'}>
                            {kpiData.maxSpeed.toFixed(0)} km/h
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📊 Vel. Prom
                        </Typography>
                        <Typography variant="h6" color="info.main">
                            {kpiData.avgSpeed.toFixed(1)} km/h
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={6} md={2}>
                <Card sx={{ textAlign: 'center', p: 1 }}>
                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            📍 GPS
                        </Typography>
                        <Typography variant="h6" color={kpiData.totalGPSPoints > 0 ? 'success.main' : 'warning.main'}>
                            {kpiData.totalGPSPoints}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>

        {/* Distribución de Tiempos - Compacta */}
        <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ⏱️ Distribución de Tiempos
            </Typography>
            <Grid container spacing={1}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">
                                🏢 En Base
                            </Typography>
                            <Typography variant="h6" color="success.main">
                                {formatTime(kpiData.timeInBase)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {calculatePercentage(kpiData.timeInBase, kpiData.totalOperationalTime).toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">
                                🚗 Fuera Base
                            </Typography>
                            <Typography variant="h6" color="warning.main">
                                {formatTime(kpiData.timeOutOfBase)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {calculatePercentage(kpiData.timeOutOfBase, kpiData.totalOperationalTime).toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">
                                🔄 Con Rotativo
                            </Typography>
                            <Typography variant="h6" color="info.main">
                                {formatTime(kpiData.timeWithRotative)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {calculatePercentage(kpiData.timeWithRotative, kpiData.totalOperationalTime).toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 1 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Typography variant="body2" color="text.secondary">
                                ⏸️ Sin Rotativo
                            </Typography>
                            <Typography variant="h6" color="error.main">
                                {formatTime(kpiData.timeWithoutRotative)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {calculatePercentage(kpiData.timeWithoutRotative, kpiData.totalOperationalTime).toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    </>
);

export const renderPerformanceContent = ({ kpiData }: KPITabContentProps) => (
    <>
        {/* Métricas de Rendimiento */}
        <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Métricas de Rendimiento
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                🚀 Eficiencia Operativa
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {((kpiData.activeTime / kpiData.totalOperationalTime) * 100).toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                ⛽ Eficiencia Combustible
                            </Typography>
                            <Typography variant="h4" color="info.main">
                                {kpiData.fuelEfficiency.toFixed(1)} km/l
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                🔄 Eficiencia Rotativo
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {kpiData.rotativeUsage.efficiency.toFixed(1)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📈 Productividad
                            </Typography>
                            <Typography variant="h4" color="warning.main">
                                {(kpiData.totalDistance / (kpiData.totalOperationalTime / 60)).toFixed(1)} km/h
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    </>
);

export const renderSafetyContent = ({ kpiData }: KPITabContentProps) => (
    <>
        {/* Métricas de Seguridad */}
        <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🛡️ Métricas de Seguridad
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                🚨 Eventos Críticos
                            </Typography>
                            <Typography variant="h4" color={kpiData.stabilityEvents.critical > 0 ? 'error.main' : 'success.main'}>
                                {kpiData.stabilityEvents.critical}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                ⚠️ Eventos Peligrosos
                            </Typography>
                            <Typography variant="h4" color={kpiData.stabilityEvents.dangerous > 0 ? 'warning.main' : 'success.main'}>
                                {kpiData.stabilityEvents.dangerous}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                🚗 Excesos de Velocidad
                            </Typography>
                            <Typography variant="h4" color={kpiData.speedExcesses.severe > 0 ? 'error.main' : 'success.main'}>
                                {kpiData.speedExcesses.severe}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📊 Velocidad Máxima
                            </Typography>
                            <Typography variant="h4" color={kpiData.maxSpeed > 80 ? 'error.main' : 'success.main'}>
                                {kpiData.maxSpeed.toFixed(0)} km/h
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    </>
);

export const renderMaintenanceContent = ({ kpiData }: KPITabContentProps) => (
    <>
        {/* Métricas de Mantenimiento */}
        <Box mb={3}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🔧 Métricas de Mantenimiento
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                ⏱️ Tiempo de Uso
                            </Typography>
                            <Typography variant="h4" color="primary">
                                {(kpiData.totalOperationalTime / 60).toFixed(1)}h
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📏 Kilometraje
                            </Typography>
                            <Typography variant="h4" color="info.main">
                                {kpiData.totalDistance.toFixed(0)} km
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                🔄 Uso del Rotativo
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {(kpiData.timeWithRotative / 60).toFixed(1)}h
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                📍 Puntos GPS
                            </Typography>
                            <Typography variant="h4" color="warning.main">
                                {kpiData.totalGPSPoints}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    </>
);