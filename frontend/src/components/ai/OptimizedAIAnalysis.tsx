import {
    Assessment,
    Insights,
    Psychology,
    Speed,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    LinearProgress,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface OptimizedAnalysisData {
    timeWindow: string;
    totalEvents: number;
    criticalEvents: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
}

interface OptimizedAIAnalysisProps {
    timeWindow?: '1h' | '24h' | '7d' | '30d';
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const OptimizedAIAnalysis: React.FC<OptimizedAIAnalysisProps> = ({
    timeWindow = '24h',
    autoRefresh = true,
    refreshInterval = 30000 // 30 segundos
}) => {
    const { user } = useAuth();
    const [analysisData, setAnalysisData] = useState<OptimizedAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const loadAnalysis = useCallback(async () => {
        if (!user?.organizationId) return;

        try {
            setLoading(true);
            setError(null);

            const response = await apiService.get('/ai/analysis/optimized', {
                params: { timeWindow }
            });

            if (response.success && response.data) {
                setAnalysisData(response.data);
                setLastUpdate(new Date());
                logger.info('Análisis optimizado cargado', { timeWindow, data: response.data });
            } else {
                throw new Error(response.message || 'Error cargando análisis');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error cargando análisis optimizado', { error: errorMessage, timeWindow });
        } finally {
            setLoading(false);
        }
    }, [user?.organizationId, timeWindow]);

    // Cargar datos iniciales
    useEffect(() => {
        loadAnalysis();
    }, [loadAnalysis]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(loadAnalysis, refreshInterval);
        return () => clearInterval(interval);
    }, [loadAnalysis, autoRefresh, refreshInterval]);

    const getRiskLevelColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'HIGH': return 'error';
            case 'MEDIUM': return 'warning';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    const getRiskLevelIcon = (riskLevel: string) => {
        switch (riskLevel) {
            case 'HIGH': return <Warning />;
            case 'MEDIUM': return <Speed />;
            case 'LOW': return <Assessment />;
            default: return <Insights />;
        }
    };

    const formatTimeWindow = (window: string) => {
        switch (window) {
            case '1h': return 'Última hora';
            case '24h': return 'Últimas 24 horas';
            case '7d': return 'Últimos 7 días';
            case '30d': return 'Últimos 30 días';
            default: return window;
        }
    };

    if (loading && !analysisData) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="center" minHeight="200px">
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Analizando datos...
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="center" minHeight="200px">
                        <Typography color="error">
                            Error: {error}
                        </Typography>
                        <IconButton onClick={loadAnalysis} sx={{ ml: 2 }}>
                            <Assessment />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (!analysisData) {
        return (
            <Card>
                <CardContent>
                    <Typography>No hay datos disponibles</Typography>
                </CardContent>
            </Card>
        );
    }

    const riskPercentage = analysisData.totalEvents > 0
        ? (analysisData.criticalEvents / analysisData.totalEvents) * 100
        : 0;

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6" className="flex items-center gap-2">
                        <Psychology />
                        Análisis IA Optimizado
                    </Typography>

                    <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                            label={formatTimeWindow(analysisData.timeWindow)}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        {lastUpdate && (
                            <Tooltip title={`Última actualización: ${lastUpdate.toLocaleTimeString()}`}>
                                <Typography variant="caption" color="text.secondary">
                                    {lastUpdate.toLocaleTimeString()}
                                </Typography>
                            </Tooltip>
                        )}
                        <IconButton onClick={loadAnalysis} size="small">
                            <TrendingUp />
                        </IconButton>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Score de Riesgo */}
                    <Grid item xs={12} md={4}>
                        <Box textAlign="center">
                            <Typography variant="h4" color={`${getRiskLevelColor(analysisData.riskLevel)}.main`}>
                                {Math.round(riskPercentage)}%
                            </Typography>
                            <Typography variant="subtitle2" color="text.secondary">
                                Riesgo Crítico
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={1}>
                                {getRiskLevelIcon(analysisData.riskLevel)}
                                <Chip
                                    label={analysisData.riskLevel}
                                    size="small"
                                    color={getRiskLevelColor(analysisData.riskLevel)}
                                />
                            </Box>
                        </Box>
                    </Grid>

                    {/* Estadísticas Generales */}
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="h6" color="primary">
                                    {analysisData.totalEvents}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Total Eventos
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="h6" color="error.main">
                                    {analysisData.criticalEvents}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Eventos Críticos
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* Barra de progreso de riesgo */}
                        <Box mt={2}>
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                Distribución de Riesgo
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={riskPercentage}
                                color={analysisData.riskLevel === 'HIGH' ? 'error' :
                                    analysisData.riskLevel === 'MEDIUM' ? 'warning' : 'success'}
                                sx={{ height: 8, borderRadius: 4 }}
                            />
                        </Box>
                    </Grid>

                    {/* Eventos por Severidad */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                            Por Severidad
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {Object.entries(analysisData.eventsBySeverity).map(([severity, count]) => (
                                <Chip
                                    key={severity}
                                    label={`${severity}: ${count}`}
                                    size="small"
                                    color={severity === 'CRITICAL' ? 'error' :
                                        severity === 'HIGH' ? 'warning' :
                                            severity === 'MEDIUM' ? 'info' : 'default'}
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>

                    {/* Eventos por Tipo */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                            Por Tipo
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {Object.entries(analysisData.eventsByType).map(([type, count]) => (
                                <Chip
                                    key={type}
                                    label={`${type}: ${count}`}
                                    size="small"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
