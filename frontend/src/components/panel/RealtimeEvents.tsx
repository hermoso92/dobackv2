import {
    CheckCircle,
    Error,
    Info,
    LocationOn,
    PlayArrow,
    Refresh,
    Schedule,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Badge,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Switch,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { RealtimeEvent } from '../../types/panel';

interface RealtimeEventsProps {
    events: RealtimeEvent[];
    loading?: boolean;
    error?: string;
    onEventClick?: (event: RealtimeEvent) => void;
    onRefresh?: () => void;
}

export const RealtimeEvents: React.FC<RealtimeEventsProps> = ({
    events,
    loading = false,
    error,
    onEventClick,
    onRefresh
}) => {
    const [isLive, setIsLive] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    // Auto-refresh cada 30 segundos si está habilitado
    useEffect(() => {
        if (!autoRefresh || !isLive) return;

        const interval = setInterval(() => {
            if (onRefresh) {
                onRefresh();
                setLastUpdate(new Date());
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, isLive, onRefresh]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <Error color="error" />;
            case 'HIGH':
                return <Warning color="warning" />;
            case 'MEDIUM':
                return <Info color="info" />;
            case 'LOW':
                return <CheckCircle color="success" />;
            default:
                return <Info color="action" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return 'error';
            case 'HIGH':
                return 'warning';
            case 'MEDIUM':
                return 'info';
            case 'LOW':
                return 'success';
            default:
                return 'default';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString();
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'speed_exceeded':
                return 'Exceso de Velocidad';
            case 'geofence_enter':
                return 'Entrada a Geocerca';
            case 'geofence_exit':
                return 'Salida de Geocerca';
            case 'geofence_violation':
                return 'Violación de Geocerca';
            case 'critical_event':
                return 'Evento Crítico';
            case 'maintenance_required':
                return 'Mantenimiento Requerido';
            default:
                return type;
        }
    };

    const handleEventClick = (event: RealtimeEvent) => {
        if (onEventClick) {
            onEventClick(event);
        }
    };

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh();
            setLastUpdate(new Date());
        }
    };

    const handleLiveToggle = () => {
        setIsLive(!isLive);
        if (!isLive && onRefresh) {
            onRefresh();
            setLastUpdate(new Date());
        }
    };

    if (error) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Alert severity="error">
                        Error cargando eventos en tiempo real: {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <Box className="mb-4">
                    <Box className="flex items-center justify-between mb-2">
                        <Typography variant="h6">
                            Eventos en Tiempo Real
                        </Typography>

                        <Box className="flex items-center gap-2">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isLive}
                                        onChange={handleLiveToggle}
                                        size="small"
                                        color="primary"
                                    />
                                }
                                label="En Vivo"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={autoRefresh}
                                        onChange={(e) => setAutoRefresh(e.target.checked)}
                                        size="small"
                                        color="secondary"
                                    />
                                }
                                label="Auto-refresh"
                            />

                            <Tooltip title="Actualizar ahora">
                                <IconButton
                                    size="small"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    <Refresh fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Estado del stream */}
                    <Box className="flex items-center gap-2 mb-4">
                        <Badge
                            color={isLive ? 'success' : 'default'}
                            variant="dot"
                        >
                            <Chip
                                label={isLive ? 'Conectado' : 'Desconectado'}
                                size="small"
                                color={isLive ? 'success' : 'default'}
                                variant="outlined"
                            />
                        </Badge>

                        <Typography variant="caption" className="text-gray-500">
                            Última actualización: {lastUpdate.toLocaleTimeString()}
                        </Typography>
                    </Box>

                    {/* Estadísticas */}
                    <Box className="flex gap-2 mb-4">
                        <Chip
                            label={`${events.length} eventos`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${events.filter(e => e.severity === 'CRITICAL').length} críticos`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                        <Chip
                            label={`${events.filter(e => e.severity === 'HIGH').length} altos`}
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                {/* Lista de eventos */}
                {loading ? (
                    <Box className="flex items-center justify-center h-64">
                        <CircularProgress />
                        <Typography className="ml-2">Cargando eventos...</Typography>
                    </Box>
                ) : events.length === 0 ? (
                    <Alert severity="info">
                        No hay eventos en tiempo real disponibles
                    </Alert>
                ) : (
                    <List className="max-h-96 overflow-y-auto">
                        {events.map((event, index) => (
                            <React.Fragment key={event.id}>
                                <ListItem
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleEventClick(event)}
                                >
                                    <ListItemIcon>
                                        {getSeverityIcon(event.severity)}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box className="flex items-center gap-2">
                                                <Typography variant="subtitle2" className="font-medium">
                                                    {event.vehicleName}
                                                </Typography>
                                                <Chip
                                                    label={event.severity}
                                                    size="small"
                                                    color={getSeverityColor(event.severity) as any}
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={getEventTypeLabel(event.type)}
                                                    size="small"
                                                    color="default"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" className="mb-1">
                                                    {event.data?.message || `Evento ${event.type}`}
                                                </Typography>
                                                <Box className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Schedule fontSize="small" />
                                                    <Typography variant="caption">
                                                        {formatTimestamp(event.timestamp)}
                                                    </Typography>
                                                    <LocationOn fontSize="small" />
                                                    <Typography variant="caption">
                                                        {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        }
                                    />

                                    <Box className="flex items-center gap-1">
                                        <Tooltip title="Ver detalles">
                                            <IconButton size="small" color="primary">
                                                <PlayArrow fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>

                                {index < events.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};
