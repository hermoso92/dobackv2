/**
 * 📊 ANALÍTICAS DE GEOCERCAS
 * 
 * Componente para visualizar estadísticas y métricas de geocercas
 * - Eventos por geocerca
 * - Gráficos de tendencias
 * - Ranking de geocercas más activas
 * - Métricas de tiempo
 * 
 * @version 1.0
 * @date 2025-11-05
 */

import { API_CONFIG } from '@/config/api';
import {
    AccessTime,
    LocationOn,
    Timeline,
    TrendingUp
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || `${API_CONFIG.BASE_URL}`;

interface GeofenceStats {
    totalGeofences: number;
    activeGeofences: number;
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsLast24h: number;
    mostActiveGeofences: Array<{
        id: string;
        name: string;
        eventCount: number;
    }>;
}

export const GeofenceAnalytics: React.FC = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<GeofenceStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        if (!token) {
            logger.warn('No hay token de autenticación');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/geofences/stats/summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setStats(data.data);
            logger.info('Estadísticas de geocercas cargadas', data.data);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            logger.error('Error obteniendo estadísticas:', err);
        } finally {
            setLoading(false);
        }
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
            <Alert severity="error" sx={{ m: 2 }}>
                Error cargando estadísticas: {error}
            </Alert>
        );
    }

    if (!stats) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                No hay datos de estadísticas disponibles
            </Alert>
        );
    }

    return (
        <Box>
            {/* Métricas principales */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOn color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Geocercas
                                </Typography>
                            </Box>
                            <Typography variant="h4" color="primary">
                                {stats.totalGeofences}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {stats.activeGeofences} activas
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Timeline color="success" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Eventos
                                </Typography>
                            </Box>
                            <Typography variant="h4" color="success.main">
                                {stats.totalEvents}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Histórico completo
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AccessTime color="warning" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Últimas 24h
                                </Typography>
                            </Box>
                            <Typography variant="h4" color="warning.main">
                                {stats.eventsLast24h}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Eventos recientes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp color="info" sx={{ mr: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Promedio / Geocerca
                                </Typography>
                            </Box>
                            <Typography variant="h4" color="info.main">
                                {stats.totalGeofences > 0
                                    ? Math.round(stats.totalEvents / stats.totalGeofences)
                                    : 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Eventos totales
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Eventos por tipo */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Eventos por Tipo
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                {Object.entries(stats.eventsByType).map(([type, count]) => (
                                    <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip
                                                label={type}
                                                size="small"
                                                color={type === 'ENTER' ? 'success' : type === 'EXIT' ? 'warning' : 'default'}
                                            />
                                        </Box>
                                        <Typography variant="h6" color="text.secondary">
                                            {count}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                            {Object.keys(stats.eventsByType).length === 0 && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No hay eventos registrados aún
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Geocercas Más Activas
                            </Typography>
                            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Geocerca</strong></TableCell>
                                            <TableCell align="right"><strong>Eventos</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stats.mostActiveGeofences.map((geofence) => (
                                            <TableRow key={geofence.id}>
                                                <TableCell>{geofence.name}</TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={geofence.eventCount}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {stats.mostActiveGeofences.length === 0 && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    No hay eventos registrados aún
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Información adicional */}
            <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                    📊 Análisis de Datos
                </Typography>
                <Typography variant="body2">
                    Las estadísticas se actualizan automáticamente cada vez que se procesa una nueva sesión.
                    Los eventos se detectan cuando un vehículo entra o sale de una geocerca activa.
                </Typography>
            </Alert>
        </Box>
    );
};











