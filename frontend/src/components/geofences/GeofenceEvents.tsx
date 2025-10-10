import {
    Directions,
    LocationOn,
    Refresh,
    Speed,
    Timeline,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeofenceEvents } from '../../hooks/useGeofences';
import { formatDateTZ } from '../../utils/dateUtils';

interface GeofenceEventsProps {
    geofence: any; // Geofence type
}

export const GeofenceEvents: React.FC<GeofenceEventsProps> = ({ geofence }) => {
    const { t } = useTranslation();
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
    const [customFrom, setCustomFrom] = useState<string>('');
    const [customTo, setCustomTo] = useState<string>('');

    // Calcular fechas basadas en el rango seleccionado
    const getDateRange = () => {
        const now = new Date();
        let from: Date | undefined;
        let to: Date | undefined;

        switch (dateRange) {
            case 'today':
                from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                to = now;
                break;
            case 'month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                to = now;
                break;
            case 'custom':
                from = customFrom ? new Date(customFrom) : undefined;
                to = customTo ? new Date(customTo) : undefined;
                break;
        }

        return { from, to };
    };

    const { from, to } = getDateRange();
    const { events, loading, error, fetchEvents } = useGeofenceEvents(geofence.id, from, to);

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'ENTER':
                return 'success';
            case 'EXIT':
                return 'error';
            case 'INSIDE':
                return 'info';
            case 'OUTSIDE':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'ENTER':
                return '🚪';
            case 'EXIT':
                return '🚪';
            case 'INSIDE':
                return '📍';
            case 'OUTSIDE':
                return '📍';
            default:
                return '❓';
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'ENTER':
                return t('geofences.events.enter', 'Entrada');
            case 'EXIT':
                return t('geofences.events.exit', 'Salida');
            case 'INSIDE':
                return t('geofences.events.inside', 'Dentro');
            case 'OUTSIDE':
                return t('geofences.events.outside', 'Fuera');
            default:
                return type;
        }
    };

    const handleRefresh = () => {
        fetchEvents();
    };

    const handleDateRangeChange = (newRange: 'today' | 'week' | 'month' | 'custom') => {
        setDateRange(newRange);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    {t('geofences.events.title', 'Eventos de Geocerca')}
                </Typography>
                <Tooltip title={t('common.refresh', 'Actualizar')}>
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>{t('geofences.events.dateRange', 'Rango de Fechas')}</InputLabel>
                            <Select
                                value={dateRange}
                                onChange={(e) => handleDateRangeChange(e.target.value as any)}
                                label={t('geofences.events.dateRange', 'Rango de Fechas')}
                            >
                                <MenuItem value="today">{t('geofences.events.today', 'Hoy')}</MenuItem>
                                <MenuItem value="week">{t('geofences.events.week', 'Última Semana')}</MenuItem>
                                <MenuItem value="month">{t('geofences.events.month', 'Último Mes')}</MenuItem>
                                <MenuItem value="custom">{t('geofences.events.custom', 'Personalizado')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {dateRange === 'custom' && (
                        <>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="datetime-local"
                                    label={t('geofences.events.from', 'Desde')}
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    type="datetime-local"
                                    label={t('geofences.events.to', 'Hasta')}
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </Paper>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                            {events.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('geofences.events.total', 'Total Eventos')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                            {events.filter(e => e.type === 'ENTER').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('geofences.events.entries', 'Entradas')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                            {events.filter(e => e.type === 'EXIT').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('geofences.events.exits', 'Salidas')}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                            {events.filter(e => e.type === 'INSIDE').length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('geofences.events.inside', 'Dentro')}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Events Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('geofences.events.type', 'Tipo')}</TableCell>
                            <TableCell>{t('geofences.events.timestamp', 'Fecha/Hora')}</TableCell>
                            <TableCell>{t('geofences.events.location', 'Ubicación')}</TableCell>
                            <TableCell>{t('geofences.events.speed', 'Velocidad')}</TableCell>
                            <TableCell>{t('geofences.events.heading', 'Dirección')}</TableCell>
                            <TableCell>{t('geofences.events.status', 'Estado')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Box sx={{ py: 4 }}>
                                        <Timeline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary">
                                            {t('geofences.events.empty', 'No hay eventos')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('geofences.events.emptyDescription', 'Los eventos aparecerán cuando los vehículos entren o salgan de esta geocerca')}
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : (
                            events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <Chip
                                            icon={<span>{getEventTypeIcon(event.type)}</span>}
                                            label={getEventTypeLabel(event.type)}
                                            color={getEventTypeColor(event.type) as any}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {formatDateTZ(event.timestamp)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOn fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {event.speed ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Speed fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {event.speed.toFixed(1)} km/h
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {event.heading ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Directions fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {event.heading.toFixed(0)}°
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                -
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={event.status}
                                            color={event.status === 'ACTIVE' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
