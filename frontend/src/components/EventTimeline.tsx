import {
    Pause,
    PlayArrow,
    ZoomIn,
    ZoomOut
} from '@mui/icons-material';
import {
    Box,
    Chip,
    IconButton,
    Paper,
    Slider,
    Stack,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { StabilityIndexEvent } from '../hooks/useStabilityIndexEvents';

interface EventTimelineProps {
    events: StabilityIndexEvent[];
    onEventSelect?: (event: StabilityIndexEvent) => void;
    selectedEventId?: string | null;
    height?: number;
}

interface TimelineEvent extends StabilityIndexEvent {
    position: number; // Posición en timeline (0-100)
    color: string;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
    events,
    onEventSelect,
    selectedEventId,
    height = 200
}) => {
    const theme = useTheme();
    const [zoomLevel, setZoomLevel] = useState(1);
    const [timeRange, setTimeRange] = useState([0, 100]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    // Procesar eventos para timeline
    const timelineEvents: TimelineEvent[] = useMemo(() => {
        if (events.length === 0) return [];

        // Ordenar eventos por timestamp
        const sortedEvents = [...events].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const startTime = new Date(sortedEvents[0].timestamp).getTime();
        const endTime = new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime();
        const duration = endTime - startTime;

        return sortedEvents.map(event => {
            const eventTime = new Date(event.timestamp).getTime();
            const position = duration > 0 ? ((eventTime - startTime) / duration) * 100 : 0;

            const color = getEventColor(event.level);

            return {
                ...event,
                position,
                color
            };
        });
    }, [events]);

    // Filtrar eventos por rango visible
    const visibleEvents = useMemo(() => {
        return timelineEvents.filter(event =>
            event.position >= timeRange[0] && event.position <= timeRange[1]
        );
    }, [timelineEvents, timeRange]);

    const getEventColor = (level: string) => {
        switch (level) {
            case 'critical': return theme.palette.error.main;
            case 'danger': return theme.palette.warning.main;
            case 'moderate': return theme.palette.info.main;
            default: return theme.palette.success.main;
        }
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev * 1.5, 10));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev / 1.5, 1));
    };

    const handleTimeRangeChange = (event: Event, newValue: number | number[]) => {
        setTimeRange(newValue as number[]);
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
    };

    // Reproducción automática de timeline
    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + 1;
                    if (next >= 100) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return next;
                });
            }, 100);
        }

        return () => clearInterval(interval);
    }, [isPlaying]);

    if (events.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', height }}>
                <Typography variant="body1" color="text.secondary">
                    No hay eventos para mostrar en la timeline
                </Typography>
            </Paper>
        );
    }

    const firstEvent = timelineEvents[0];
    const lastEvent = timelineEvents[timelineEvents.length - 1];

    return (
        <Paper sx={{ p: 2, height }}>
            {/* Controles */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Timeline de Eventos</Typography>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Reproducir timeline">
                        <IconButton size="small" onClick={togglePlayback}>
                            {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Acercar">
                        <IconButton size="small" onClick={handleZoomIn}>
                            <ZoomIn />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Alejar">
                        <IconButton size="small" onClick={handleZoomOut}>
                            <ZoomOut />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            {/* Timeline principal */}
            <Box sx={{ position: 'relative', height: 80, mb: 2 }}>
                {/* Línea de tiempo base */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: theme.palette.grey[300],
                    transform: 'translateY(-50%)'
                }} />

                {/* Indicador de tiempo actual */}
                {isPlaying && (
                    <Box sx={{
                        position: 'absolute',
                        left: `${currentTime}%`,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: theme.palette.primary.main,
                        zIndex: 3
                    }} />
                )}

                {/* Eventos en timeline */}
                {visibleEvents.map((event, index) => {
                    const eventId = `${event.lat}-${event.lon}-${event.timestamp}`;
                    const isSelected = selectedEventId === eventId;

                    return (
                        <Tooltip
                            key={eventId}
                            title={
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {event.level.toUpperCase()} - SI: {event.perc.toFixed(1)}%
                                    </Typography>
                                    <Typography variant="caption">
                                        {new Date(event.timestamp).toLocaleString()}
                                    </Typography>
                                    {event.tipos && (
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            {event.tipos.join(', ')}
                                        </Typography>
                                    )}
                                </Box>
                            }
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: `${event.position}%`,
                                    top: '50%',
                                    width: isSelected ? 16 : 12,
                                    height: isSelected ? 16 : 12,
                                    borderRadius: '50%',
                                    bgcolor: event.color,
                                    border: isSelected ? `3px solid ${theme.palette.primary.main}` : `2px solid white`,
                                    transform: 'translate(-50%, -50%)',
                                    cursor: 'pointer',
                                    zIndex: isSelected ? 2 : 1,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translate(-50%, -50%) scale(1.2)',
                                        zIndex: 2
                                    }
                                }}
                                onClick={() => onEventSelect?.(event)}
                            />
                        </Tooltip>
                    );
                })}
            </Box>

            {/* Control de rango temporal */}
            <Box sx={{ px: 2 }}>
                <Typography variant="caption" gutterBottom>
                    Rango temporal visible
                </Typography>
                <Slider
                    value={timeRange}
                    onChange={handleTimeRangeChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value.toFixed(0)}%`}
                    size="small"
                />
            </Box>

            {/* Información temporal */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Inicio: {new Date(firstEvent.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Fin: {new Date(lastEvent.timestamp).toLocaleString()}
                </Typography>
            </Box>

            {/* Estadísticas rápidas */}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Chip
                    label={`${visibleEvents.length} eventos`}
                    size="small"
                    variant="outlined"
                />
                <Chip
                    label={`${visibleEvents.filter(e => e.level === 'critical').length} críticos`}
                    size="small"
                    color="error"
                />
                <Chip
                    label={`${visibleEvents.filter(e => e.level === 'danger').length} peligrosos`}
                    size="small"
                    color="warning"
                />
                <Chip
                    label={`Zoom: ${zoomLevel.toFixed(1)}x`}
                    size="small"
                    variant="outlined"
                />
            </Box>
        </Paper>
    );
};

export default EventTimeline; 