import {
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme
} from '@mui/material';
import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useStabilityData } from '../hooks/useStabilityData';
import { StabilitySession } from '../types/stability';

// Importación lazy del gráfico
const StabilityChart = lazy(() => import('./StabilityChart'));

interface StabilityComparisonProps {
    primarySessionId: string;
    comparisonSessionId: string;
    onComparisonSessionChange: (sessionId: string) => void;
    availableSessions: StabilitySession[];
}

interface ComparisonMetrics {
    primary: {
        averageSI: number;
        maxSI: number;
        minSI: number;
        criticalEvents: number;
        averageSpeed: number;
        maxSpeed: number;
        duration: number;
        riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    };
    comparison: {
        averageSI: number;
        maxSI: number;
        minSI: number;
        criticalEvents: number;
        averageSpeed: number;
        maxSpeed: number;
        duration: number;
        riskLevel: 'BAJO' | 'MEDIO' | 'ALTO';
    };
    differences: {
        siDifference: number;
        siPercentChange: number;
        eventsDifference: number;
        eventsPercentChange: number;
        speedDifference: number;
        speedPercentChange: number;
        durationDifference: number;
        durationPercentChange: number;
    };
    analysis: {
        overallImprovement: 'MEJOR' | 'PEOR' | 'SIMILAR';
        keyInsights: string[];
        recommendations: string[];
    };
}

const StabilityComparison: React.FC<StabilityComparisonProps> = ({
    primarySessionId,
    comparisonSessionId,
    onComparisonSessionChange,
    availableSessions
}) => {
    const theme = useTheme();

    // Estados
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Hooks para datos de ambas sesiones
    const {
        stabilityData: primaryData,
        loading: primaryLoading,
        error: primaryError,
        criticalEvents: primaryEvents
    } = useStabilityData(null, primarySessionId);

    const {
        stabilityData: comparisonData,
        loading: comparisonLoading,
        error: comparisonError,
        criticalEvents: comparisonEvents
    } = useStabilityData(null, comparisonSessionId);

    // Cálculo de métricas comparativas
    const comparisonMetrics = useMemo<ComparisonMetrics | null>(() => {
        if (!primaryData || !comparisonData || primaryData.length === 0 || comparisonData.length === 0) {
            return null;
        }

        // Calcular métricas para sesión primaria
        const primarySI = primaryData.map(point => point.si).filter(si => !isNaN(si));
        const primarySpeed = primaryData.map(point => point.speed || 0).filter(speed => !isNaN(speed));
        const primaryDuration = primaryData.length > 1
            ? (new Date(primaryData[primaryData.length - 1].timestamp).getTime() -
                new Date(primaryData[0].timestamp).getTime()) / 1000 / 60
            : 0;

        const primaryMetrics = {
            averageSI: primarySI.length > 0 ? primarySI.reduce((a, b) => a + b, 0) / primarySI.length : 0,
            maxSI: primarySI.length > 0 ? Math.max(...primarySI) : 0,
            minSI: primarySI.length > 0 ? Math.min(...primarySI) : 0,
            criticalEvents: primaryEvents.length,
            averageSpeed: primarySpeed.length > 0 ? primarySpeed.reduce((a, b) => a + b, 0) / primarySpeed.length : 0,
            maxSpeed: primarySpeed.length > 0 ? Math.max(...primarySpeed) : 0,
            duration: primaryDuration,
            riskLevel: primaryMetrics.averageSI < 0.3 || primaryEvents.length > 10 ? 'ALTO' :
                primaryMetrics.averageSI < 0.6 || primaryEvents.length > 5 ? 'MEDIO' : 'BAJO'
        };

        // Calcular métricas para sesión de comparación
        const comparisonSI = comparisonData.map(point => point.si).filter(si => !isNaN(si));
        const comparisonSpeed = comparisonData.map(point => point.speed || 0).filter(speed => !isNaN(speed));
        const comparisonDuration = comparisonData.length > 1
            ? (new Date(comparisonData[comparisonData.length - 1].timestamp).getTime() -
                new Date(comparisonData[0].timestamp).getTime()) / 1000 / 60
            : 0;

        const comparisonMetrics = {
            averageSI: comparisonSI.length > 0 ? comparisonSI.reduce((a, b) => a + b, 0) / comparisonSI.length : 0,
            maxSI: comparisonSI.length > 0 ? Math.max(...comparisonSI) : 0,
            minSI: comparisonSI.length > 0 ? Math.min(...comparisonSI) : 0,
            criticalEvents: comparisonEvents.length,
            averageSpeed: comparisonSpeed.length > 0 ? comparisonSpeed.reduce((a, b) => a + b, 0) / comparisonSpeed.length : 0,
            maxSpeed: comparisonSpeed.length > 0 ? Math.max(...comparisonSpeed) : 0,
            duration: comparisonDuration,
            riskLevel: comparisonMetrics.averageSI < 0.3 || comparisonEvents.length > 10 ? 'ALTO' :
                comparisonMetrics.averageSI < 0.6 || comparisonEvents.length > 5 ? 'MEDIO' : 'BAJO'
        };

        // Calcular diferencias
        const siDifference = primaryMetrics.averageSI - comparisonMetrics.averageSI;
        const siPercentChange = comparisonMetrics.averageSI > 0 ? (siDifference / comparisonMetrics.averageSI) * 100 : 0;

        const eventsDifference = primaryMetrics.criticalEvents - comparisonMetrics.criticalEvents;
        const eventsPercentChange = comparisonMetrics.criticalEvents > 0 ? (eventsDifference / comparisonMetrics.criticalEvents) * 100 : 0;

        const speedDifference = primaryMetrics.averageSpeed - comparisonMetrics.averageSpeed;
        const speedPercentChange = comparisonMetrics.averageSpeed > 0 ? (speedDifference / comparisonMetrics.averageSpeed) * 100 : 0;

        const durationDifference = primaryMetrics.duration - comparisonMetrics.duration;
        const durationPercentChange = comparisonMetrics.duration > 0 ? (durationDifference / comparisonMetrics.duration) * 100 : 0;

        // Análisis general
        let overallImprovement: 'MEJOR' | 'PEOR' | 'SIMILAR' = 'SIMILAR';
        const keyInsights: string[] = [];
        const recommendations: string[] = [];

        // Evaluar mejora en estabilidad
        if (siDifference > 0.1) {
            overallImprovement = 'MEJOR';
            keyInsights.push('Mejora significativa en el índice de estabilidad');
            recommendations.push('Mantener las condiciones de conducción actuales');
        } else if (siDifference < -0.1) {
            overallImprovement = 'PEOR';
            keyInsights.push('Deterioro en el índice de estabilidad');
            recommendations.push('Revisar técnicas de conducción y condiciones del vehículo');
        }

        // Evaluar eventos críticos
        if (eventsDifference < -2) {
            keyInsights.push('Reducción notable en eventos críticos');
            recommendations.push('Continuar con las prácticas de conducción segura');
        } else if (eventsDifference > 2) {
            keyInsights.push('Aumento en eventos críticos');
            recommendations.push('Implementar medidas preventivas adicionales');
        }

        // Evaluar velocidad
        if (Math.abs(speedDifference) > 10) {
            keyInsights.push(`Diferencia significativa en velocidad promedio: ${speedDifference.toFixed(1)} km/h`);
            if (speedDifference > 0) {
                recommendations.push('Considerar reducir la velocidad para mejorar la estabilidad');
            }
        }

        return {
            primary: primaryMetrics,
            comparison: comparisonMetrics,
            differences: {
                siDifference,
                siPercentChange,
                eventsDifference,
                eventsPercentChange,
                speedDifference,
                speedPercentChange,
                durationDifference,
                durationPercentChange
            },
            analysis: {
                overallImprovement,
                keyInsights,
                recommendations
            }
        };
    }, [primaryData, comparisonData, primaryEvents, comparisonEvents]);

    // Variables seleccionadas para gráficos
    const selectedVariables = {
        timestamp: true,
        time: true,
        ax: false,
        ay: false,
        az: false,
        gx: false,
        gy: false,
        gz: false,
        roll: false,
        pitch: false,
        yaw: false,
        si: true,
        accmag: false
    };

    const variableGroups = [
        {
            title: 'Índice de Estabilidad',
            variables: [
                { key: 'si', label: 'Índice de Estabilidad', unit: '', group: 'stability' }
            ]
        }
    ];

    // Handlers
    const handleComparisonSessionChange = (event: SelectChangeEvent<string>) => {
        onComparisonSessionChange(event.target.value);
    };

    // Renderizado condicional
    if (primaryLoading || comparisonLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Cargando datos de comparación...</Typography>
            </Box>
        );
    }

    if (primaryError || comparisonError) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">
                    Error al cargar datos: {primaryError || comparisonError}
                </Typography>
            </Box>
        );
    }

    if (!comparisonMetrics) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">
                    Selecciona una sesión para comparar
                </Typography>
            </Box>
        );
    }

    const getTrendIcon = (value: number) => {
        if (value > 0) return <TrendingUpIcon color="success" />;
        if (value < 0) return <TrendingDownIcon color="error" />;
        return <TrendingFlatIcon color="action" />;
    };

    const getTrendColor = (value: number) => {
        if (value > 0) return 'success.main';
        if (value < 0) return 'error.main';
        return 'text.secondary';
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Selector de sesión de comparación */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <FormControl fullWidth>
                    <InputLabel>Sesión de Comparación</InputLabel>
                    <Select
                        value={comparisonSessionId}
                        onChange={handleComparisonSessionChange}
                        label="Sesión de Comparación"
                    >
                        {availableSessions
                            .filter(session => session.id !== primarySessionId)
                            .map((session) => (
                                <MenuItem key={session.id} value={session.id}>
                                    {new Date(session.startTime).toLocaleString()}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* Resumen de comparación */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Sesión Primaria
                            </Typography>
                            <Stack spacing={1}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Índice de Estabilidad
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {comparisonMetrics.primary.averageSI.toFixed(3)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Eventos Críticos
                                    </Typography>
                                    <Typography variant="h6" color="error">
                                        {comparisonMetrics.primary.criticalEvents}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={comparisonMetrics.primary.riskLevel}
                                    color={comparisonMetrics.primary.riskLevel === 'ALTO' ? 'error' :
                                        comparisonMetrics.primary.riskLevel === 'MEDIO' ? 'warning' : 'success'}
                                    size="small"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Sesión de Comparación
                            </Typography>
                            <Stack spacing={1}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Índice de Estabilidad
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {comparisonMetrics.comparison.averageSI.toFixed(3)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Eventos Críticos
                                    </Typography>
                                    <Typography variant="h6" color="error">
                                        {comparisonMetrics.comparison.criticalEvents}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={comparisonMetrics.comparison.riskLevel}
                                    color={comparisonMetrics.comparison.riskLevel === 'ALTO' ? 'error' :
                                        comparisonMetrics.comparison.riskLevel === 'MEDIO' ? 'warning' : 'success'}
                                    size="small"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Análisis General
                            </Typography>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {getTrendIcon(comparisonMetrics.differences.siDifference)}
                                    <Typography variant="h6" color={getTrendColor(comparisonMetrics.differences.siDifference)}>
                                        {comparisonMetrics.analysis.overallImprovement}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Diferencia en SI: {comparisonMetrics.differences.siDifference.toFixed(3)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Diferencia en eventos: {comparisonMetrics.differences.eventsDifference}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabla de diferencias detalladas */}
            <Paper sx={{ mb: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Métrica</TableCell>
                                <TableCell align="right">Sesión Primaria</TableCell>
                                <TableCell align="right">Sesión Comparación</TableCell>
                                <TableCell align="right">Diferencia</TableCell>
                                <TableCell align="right">% Cambio</TableCell>
                                <TableCell align="center">Tendencia</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Índice de Estabilidad Promedio</TableCell>
                                <TableCell align="right">{comparisonMetrics.primary.averageSI.toFixed(3)}</TableCell>
                                <TableCell align="right">{comparisonMetrics.comparison.averageSI.toFixed(3)}</TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.siDifference) }}>
                                    {comparisonMetrics.differences.siDifference.toFixed(3)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.siPercentChange) }}>
                                    {comparisonMetrics.differences.siPercentChange.toFixed(1)}%
                                </TableCell>
                                <TableCell align="center">
                                    {getTrendIcon(comparisonMetrics.differences.siDifference)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Eventos Críticos</TableCell>
                                <TableCell align="right">{comparisonMetrics.primary.criticalEvents}</TableCell>
                                <TableCell align="right">{comparisonMetrics.comparison.criticalEvents}</TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(-comparisonMetrics.differences.eventsDifference) }}>
                                    {comparisonMetrics.differences.eventsDifference}
                                </TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(-comparisonMetrics.differences.eventsPercentChange) }}>
                                    {comparisonMetrics.differences.eventsPercentChange.toFixed(1)}%
                                </TableCell>
                                <TableCell align="center">
                                    {getTrendIcon(-comparisonMetrics.differences.eventsDifference)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Velocidad Promedio (km/h)</TableCell>
                                <TableCell align="right">{comparisonMetrics.primary.averageSpeed.toFixed(1)}</TableCell>
                                <TableCell align="right">{comparisonMetrics.comparison.averageSpeed.toFixed(1)}</TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.speedDifference) }}>
                                    {comparisonMetrics.differences.speedDifference.toFixed(1)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.speedPercentChange) }}>
                                    {comparisonMetrics.differences.speedPercentChange.toFixed(1)}%
                                </TableCell>
                                <TableCell align="center">
                                    {getTrendIcon(comparisonMetrics.differences.speedDifference)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Duración (min)</TableCell>
                                <TableCell align="right">{comparisonMetrics.primary.duration.toFixed(1)}</TableCell>
                                <TableCell align="right">{comparisonMetrics.comparison.duration.toFixed(1)}</TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.durationDifference) }}>
                                    {comparisonMetrics.differences.durationDifference.toFixed(1)}
                                </TableCell>
                                <TableCell align="right" sx={{ color: getTrendColor(comparisonMetrics.differences.durationPercentChange) }}>
                                    {comparisonMetrics.differences.durationPercentChange.toFixed(1)}%
                                </TableCell>
                                <TableCell align="center">
                                    {getTrendIcon(comparisonMetrics.differences.durationDifference)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Gráficos comparativos */}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            Sesión Primaria - Índice de Estabilidad
                        </Typography>
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography>Cargando gráfico...</Typography>
                        </Box>}>
                            <StabilityChart
                                data={primaryData}
                                selectedVariables={selectedVariables}
                                variableGroups={variableGroups}
                                onHover={() => { }}
                                handleVariableChange={() => { }}
                            />
                        </Suspense>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            Sesión de Comparación - Índice de Estabilidad
                        </Typography>
                        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography>Cargando gráfico...</Typography>
                        </Box>}>
                            <StabilityChart
                                data={comparisonData}
                                selectedVariables={selectedVariables}
                                variableGroups={variableGroups}
                                onHover={() => { }}
                                handleVariableChange={() => { }}
                            />
                        </Suspense>
                    </Paper>
                </Grid>
            </Grid>

            {/* Insights y recomendaciones */}
            <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Análisis y Recomendaciones
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Hallazgos Clave:
                        </Typography>
                        <Stack spacing={1}>
                            {comparisonMetrics.analysis.keyInsights.map((insight, index) => (
                                <Typography key={index} variant="body2" color="text.secondary">
                                    • {insight}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" gutterBottom>
                            Recomendaciones:
                        </Typography>
                        <Stack spacing={1}>
                            {comparisonMetrics.analysis.recommendations.map((recommendation, index) => (
                                <Typography key={index} variant="body2" color="text.secondary">
                                    • {recommendation}
                                </Typography>
                            ))}
                        </Stack>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default StabilityComparison; 