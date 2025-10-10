/**
 * 🗺️ PANEL DE EVENTOS DE GEOCERCAS EN TIEMPO REAL
 * Muestra entrada/salida de vehículos en geocercas
 */

import {
    LocationOn,
    TrendingFlat,
    TrendingUp
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';

interface GeofenceEvent {
    id: string;
    vehicleId: string;
    geofenceId: string;
    geofenceName: string;
    type: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE';
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
}

interface GeofenceEventsPanelProps {
    maxEvents?: number;
    refreshInterval?: number;
    autoRefresh?: boolean;
}

export const GeofenceEventsPanel: React.FC<GeofenceEventsPanelProps> = ({
    maxEvents = 50,
    refreshInterval = 10000,
    autoRefresh = true
}) => {
    const [events, setEvents] = useState<GeofenceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<{ success: boolean; data: any[] }>(
                `/api/geofences/events?limit=${maxEvents}`
            );

            if (response.data && response.data.success) {
                const eventsData: GeofenceEvent[] = response.data.data.map((event: any) => ({
                    id: event.id,
                    vehicleId: event.vehicleId,
                    geofenceId: event.geofenceId,
                    geofenceName: event.geofence?.name || 'Desconocida',
                    type: event.type,
                    timestamp: event.timestamp,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    speed: event.speed,
                    heading: event.heading
                }));
                setEvents(eventsData);
                setError(null);
                logger.info(`Eventos de geocercas cargados: ${eventsData.length}`);
            }
        } catch (err) {
            logger.error('Error cargando eventos de geocercas:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    }, [maxEvents]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchEvents();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchEvents]);

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'ENTER':
                return <TrendingUp className="text-green-600" />;
            case 'EXIT':
                return <TrendingFlat className="text-orange-600" />;
            case 'INSIDE':
                return <LocationOn className="text-blue-600" />;
            case 'OUTSIDE':
                return <LocationOn className="text-gray-400" />;
            default:
                return <LocationOn className="text-gray-400" />;
        }
    };

    const getEventColor = (type: string): 'success' | 'warning' | 'info' | 'default' => {
        switch (type) {
            case 'ENTER':
                return 'success';
            case 'EXIT':
                return 'warning';
            case 'INSIDE':
                return 'info';
            default:
                return 'default';
        }
    };

    const getEventLabel = (type: string) => {
        switch (type) {
            case 'ENTER':
                return 'Entrada';
            case 'EXIT':
                return 'Salida';
            case 'INSIDE':
                return 'Dentro';
            case 'OUTSIDE':
                return 'Fuera';
            default:
                return type;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });
    };

    if (loading && events.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                <CircularProgress />
            </Box>
        );
    }

    if (error && events.length === 0) {
        return (
            <Alert severity="error">
                Error cargando eventos: {error}
            </Alert>
        );
    }

    if (events.length === 0) {
        return (
            <Alert severity="info">
                No hay eventos de geocercas registrados
            </Alert>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="h3">
                    Eventos de Geocercas en Tiempo Real
                </Typography>
                <Chip
                    label={`${events.length} eventos`}
                    color="primary"
                    size="small"
                />
            </Box>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Hora</TableCell>
                            <TableCell>Vehículo</TableCell>
                            <TableCell>Geocerca</TableCell>
                            <TableCell>Evento</TableCell>
                            <TableCell align="right">Velocidad</TableCell>
                            <TableCell>Coordenadas</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map((event) => (
                            <TableRow key={event.id} hover>
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatTimestamp(event.timestamp)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {event.vehicleId}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {event.geofenceName}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        icon={getEventIcon(event.type)}
                                        label={getEventLabel(event.type)}
                                        color={getEventColor(event.type)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <Typography variant="body2">
                                        {event.speed ? `${event.speed.toFixed(1)} km/h` : '-'}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="textSecondary">
                                        {event.latitude.toFixed(5)}, {event.longitude.toFixed(5)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default GeofenceEventsPanel;

