import {
import { logger } from '../utils/logger';
    Close as CloseIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useGeocoding } from '../hooks/useGeocoding';

interface EventDetail {
    id: string;
    type: string;
    severity: string;
    timestamp: string;
    lat: number;
    lng: number;
    vehicleName?: string;
    vehicleId?: string;
    details?: any;
    speed?: number;
    si?: number;
    roll?: number;
    ay?: number;
    gx?: number;
    rotativoState?: number;
}

interface EventDetailsModalProps {
    open: boolean;
    onClose: () => void;
    events: EventDetail[];
    location: string;
    coordinates: { lat: number; lng: number };
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
    open,
    onClose,
    events,
    location,
    coordinates
}) => {
    const [expandedSeverity, setExpandedSeverity] = useState<string | null>(null);
    const { address, loading: geocodingLoading } = useGeocoding(coordinates.lat, coordinates.lng, {
        fallbackToCoords: true
    });

    // Validar que events sea un array válido
    const validEvents = Array.isArray(events) ? events : [];

    // 🔍 Debug: Ver qué datos estamos recibiendo
    React.useEffect(() => {
        if (open && validEvents.length > 0) {
            logger.info('📋 EventDetailsModal - Primeros 3 eventos:', validEvents.slice(0, 3));
        }
    }, [open, validEvents]);

    const getSeverityColor = (severity: string) => {
        if (!severity) return '#757575';

        switch (severity.toLowerCase()) {
            case 'grave':
            case 'critical':
                return '#d32f2f';
            case 'moderado':
            case 'moderada':
            case 'high':
                return '#f57c00';
            case 'leve':
            case 'low':
                return '#fbc02d';
            default:
                return '#757575';
        }
    };

    const getSeverityIcon = (severity: string) => {
        if (!severity) return '⚪';

        switch (severity.toLowerCase()) {
            case 'grave':
            case 'critical':
                return '🔴';
            case 'moderado':
            case 'moderada':
            case 'high':
                return '🟠';
            case 'leve':
            case 'low':
                return '🟡';
            default:
                return '⚪';
        }
    };

    const getEventTypeText = (type: string) => {
        if (!type) return 'Evento Desconocido';

        switch (type) {
            case 'rollover_risk':
                return 'Riesgo de Vuelco';
            case 'rollover_imminent':
                return 'Vuelco Inminente';
            case 'dangerous_drift':
                return 'Deriva Peligrosa';
            case 'abrupt_maneuver':
                return 'Maniobra Brusca';
            case 'speed_violation':
                return 'Exceso de Velocidad';
            default:
                return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
    };

    const formatTimestamp = (timestamp: string) => {
        try {
            return new Date(timestamp).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return timestamp;
        }
    };

    // Agrupar eventos por severidad
    const eventsBySeverity = validEvents.filter(event => event && typeof event === 'object').reduce((acc, event) => {
        const severity = (event.severity || 'unknown').toLowerCase();
        if (!acc[severity]) {
            acc[severity] = [];
        }
        acc[severity].push(event);
        return acc;
    }, {} as Record<string, EventDetail[]>);

    const severityOrder = ['grave', 'critical', 'moderado', 'moderada', 'high', 'leve', 'low'];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1
            }}>
                <Box>
                    <Typography variant="h6" component="div">
                        📍 Detalle de Eventos
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {geocodingLoading ? 'Cargando dirección...' : (address || location)}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>
                {/* Resumen */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        📊 Resumen del Punto
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${validEvents.length} eventos totales`}
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${new Set(validEvents.map(e => e.vehicleName || e.vehicleId)).size} vehículos`}
                            color="secondary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`}
                            color="default"
                            variant="outlined"
                            icon={<LocationIcon />}
                        />
                    </Box>
                </Box>

                {/* Eventos por severidad */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    🚨 Eventos por Severidad
                </Typography>

                {severityOrder.map(severity => {
                    const severityEvents = eventsBySeverity[severity];
                    if (!severityEvents || severityEvents.length === 0) return null;

                    const isExpanded = expandedSeverity === severity;
                    const severityText = severity.charAt(0).toUpperCase() + severity.slice(1);

                    return (
                        <Box key={severity} sx={{ mb: 2 }}>
                            <Button
                                onClick={() => setExpandedSeverity(isExpanded ? null : severity)}
                                sx={{
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    bgcolor: isExpanded ? 'grey.100' : 'transparent',
                                    borderRadius: 1,
                                    textTransform: 'none'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">
                                        {getSeverityIcon(severity)} {severityText}
                                    </Typography>
                                    <Chip
                                        label={severityEvents.length}
                                        size="small"
                                        sx={{
                                            bgcolor: getSeverityColor(severity),
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </Box>
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </Button>

                            <Collapse in={isExpanded}>
                                <Box sx={{ mt: 1, ml: 2 }}>
                                    <List dense>
                                        {severityEvents.map((event, index) => (
                                            <ListItem
                                                key={event.id || index}
                                                sx={{
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    border: '1px solid',
                                                    borderColor: 'grey.200'
                                                }}
                                            >
                                                <ListItemIcon>
                                                    <WarningIcon sx={{ color: getSeverityColor(event.severity) }} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {getEventTypeText(event.type)}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                                                <Chip
                                                                    label={formatTimestamp(event.timestamp || '')}
                                                                    size="small"
                                                                    icon={<ScheduleIcon />}
                                                                    variant="outlined"
                                                                />
                                                                {event.vehicleName && (
                                                                    <Chip
                                                                        label={`🚒 ${event.vehicleName}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                                {event.speed !== undefined && event.speed !== null && Number(event.speed) > 0 && (
                                                                    <Chip
                                                                        label={`${Number(event.speed).toFixed(1)} km/h`}
                                                                        size="small"
                                                                        color="warning"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <Box sx={{ mt: 1 }}>
                                                            {event.si !== undefined && event.si !== null && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    📊 Índice Estabilidad: {(Number(event.si) * 100).toFixed(1)}%
                                                                </Typography>
                                                            )}
                                                            {event.rotativoState !== undefined && event.rotativoState !== null && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    🚨 Rotativo: {
                                                                        event.rotativoState === 1 ? '🔴 Encendido' :
                                                                            event.rotativoState === 2 ? '🟢 Clave 2' :
                                                                                event.rotativoState === 5 ? '🟣 Clave 5' :
                                                                                    '⚪ Apagado'
                                                                    }
                                                                </Typography>
                                                            )}
                                                            {event.speed !== undefined && event.speed !== null && Number(event.speed) > 0 && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    🚗 Velocidad: {Number(event.speed).toFixed(1)} km/h
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsModal;
