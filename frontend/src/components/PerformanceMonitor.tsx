import { Memory, NetworkCheck, Refresh, Speed, Storage } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Grid, IconButton, LinearProgress, Tooltip, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCacheStats, useOptimizedDataFetching } from '../hooks/useOptimizedDataFetching';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
    memoryUsage: {
        used: number;
        total: number;
        percentage: number;
    };
    cacheStats: {
        totalEntries: number;
        hitRate: number;
        memoryUsage: number;
    };
    networkStats: {
        totalRequests: number;
        avgResponseTime: number;
        errorRate: number;
    };
    componentStats: {
        totalComponents: number;
        lazyLoaded: number;
        cached: number;
    };
}

interface PerformanceMonitorProps {
    showDetails?: boolean;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
    showDetails = false,
    autoRefresh = true,
    refreshInterval = 30000
}) => {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Hook optimizado para obtener métricas del backend
    const { data: backendMetrics, isLoading: backendLoading } = useOptimizedDataFetching({
        endpoint: '/api/performance/metrics',
        cacheKey: 'performance-metrics',
        cacheDuration: 30 * 1000, // 30 segundos
        enabled: autoRefresh,
        refetchInterval: refreshInterval
    });

    const collectMetrics = useCallback(async () => {
        setLoading(true);
        try {
            // Métricas del navegador
            const memoryInfo = (performance as any).memory;
            const memoryUsage = memoryInfo ? {
                used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024), // MB
                total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024), // MB
                percentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100)
            } : {
                used: 0,
                total: 0,
                percentage: 0
            };

            // Estadísticas del caché
            const cacheStats = getCacheStats();

            // Métricas de red (simuladas para el ejemplo)
            const networkStats = {
                totalRequests: Math.floor(Math.random() * 100) + 50,
                avgResponseTime: Math.floor(Math.random() * 500) + 100,
                errorRate: Math.floor(Math.random() * 5)
            };

            // Métricas de componentes
            const componentStats = {
                totalComponents: document.querySelectorAll('[data-component]').length,
                lazyLoaded: document.querySelectorAll('[data-lazy]').length,
                cached: cacheStats.validEntries
            };

            const newMetrics: PerformanceMetrics = {
                memoryUsage,
                cacheStats: {
                    totalEntries: cacheStats.totalEntries,
                    hitRate: Math.random() * 100, // Simulado
                    memoryUsage: cacheStats.totalSize
                },
                networkStats,
                componentStats
            };

            setMetrics(newMetrics);
            setLastUpdate(new Date());

            logger.info('Métricas de rendimiento actualizadas', {
                userId: user?.id,
                metrics: newMetrics
            });

        } catch (error) {
            logger.error('Error recopilando métricas de rendimiento', { error, userId: user?.id });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(collectMetrics, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, refreshInterval, collectMetrics]);

    useEffect(() => {
        collectMetrics();
    }, [collectMetrics]);

    const getPerformanceColor = (percentage: number): string => {
        if (percentage < 50) return 'success';
        if (percentage < 80) return 'warning';
        return 'error';
    };

    const getPerformanceLabel = (percentage: number): string => {
        if (percentage < 50) return 'Excelente';
        if (percentage < 70) return 'Bueno';
        if (percentage < 85) return 'Regular';
        return 'Crítico';
    };

    if (!metrics) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Monitor de Rendimiento
                    </Typography>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Cargando métricas...
                    </Typography>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                        Monitor de Rendimiento
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title="Actualizar métricas">
                            <IconButton
                                onClick={collectMetrics}
                                disabled={loading}
                                size="small"
                            >
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        {lastUpdate && (
                            <Typography variant="caption" color="text.secondary">
                                {lastUpdate.toLocaleTimeString()}
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {/* Uso de Memoria */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Memory color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" color="primary">
                                {metrics.memoryUsage.used}MB
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Memoria Usada
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={metrics.memoryUsage.percentage}
                                color={getPerformanceColor(metrics.memoryUsage.percentage) as any}
                                sx={{ mt: 1 }}
                            />
                            <Chip
                                label={getPerformanceLabel(metrics.memoryUsage.percentage)}
                                size="small"
                                color={getPerformanceColor(metrics.memoryUsage.percentage) as any}
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    </Grid>

                    {/* Estadísticas de Caché */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Storage color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" color="secondary">
                                {metrics.cacheStats.totalEntries}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Entradas en Caché
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Hit Rate: {metrics.cacheStats.hitRate.toFixed(1)}%
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Estadísticas de Red */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <NetworkCheck color="info" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" color="info.main">
                                {metrics.networkStats.avgResponseTime}ms
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tiempo Promedio
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                {metrics.networkStats.totalRequests} requests
                            </Typography>
                        </Box>
                    </Grid>

                    {/* Estadísticas de Componentes */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Box textAlign="center">
                            <Speed color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" color="success.main">
                                {metrics.componentStats.totalComponents}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Componentes Totales
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                {metrics.componentStats.lazyLoaded} lazy loaded
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {showDetails && (
                    <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom>
                            Detalles Técnicos
                        </Typography>
                        <Grid container spacing={1}>
                            <Grid item xs={6}>
                                <Typography variant="caption" display="block">
                                    Memoria Total: {metrics.memoryUsage.total}MB
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Tamaño Caché: {(metrics.cacheStats.memoryUsage / 1024).toFixed(1)}KB
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" display="block">
                                    Tasa de Error: {metrics.networkStats.errorRate}%
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Componentes en Caché: {metrics.componentStats.cached}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {backendMetrics && (
                    <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                            Métricas del Backend
                        </Typography>
                        <Typography variant="caption" display="block">
                            Estado: {backendLoading ? 'Cargando...' : 'Conectado'}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

// Hook para usar el monitor de rendimiento
export function usePerformanceMonitor() {
    const [isMonitoring, setIsMonitoring] = useState(false);

    const startMonitoring = useCallback(() => {
        setIsMonitoring(true);
        logger.info('Monitor de rendimiento iniciado');
    }, []);

    const stopMonitoring = useCallback(() => {
        setIsMonitoring(false);
        logger.info('Monitor de rendimiento detenido');
    }, []);

    return {
        isMonitoring,
        startMonitoring,
        stopMonitoring
    };
}
