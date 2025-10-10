import {
    CheckCircle,
    Error,
    Info,
    OpenInNew,
    Schedule,
    Search,
    Warning
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { Alert as AlertType } from '../../types/panel';

interface AlertsListProps {
    alerts: AlertType[];
    loading?: boolean;
    error?: string;
    onAlertClick?: (alert: AlertType) => void;
    onMarkAsRead?: (alertId: string) => void;
}

export const AlertsList: React.FC<AlertsListProps> = ({
    alerts,
    loading = false,
    error,
    onAlertClick,
    onMarkAsRead
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

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

    const filteredAlerts = alerts.filter(alert => {
        const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.vehicleName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
        const matchesType = typeFilter === 'all' || alert.type === typeFilter;

        return matchesSearch && matchesSeverity && matchesType;
    });

    const handleAlertClick = (alert: AlertType) => {
        if (onAlertClick) {
            onAlertClick(alert);
        }
    };

    const handleMarkAsRead = (alertId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        if (onMarkAsRead) {
            onMarkAsRead(alertId);
        }
    };

    if (error) {
        return (
            <Card className="h-full">
                <CardContent>
                    <Alert severity="error">
                        Error cargando alertas: {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <Box className="mb-4">
                    <Typography variant="h6" className="mb-2">
                        Alertas Recientes
                    </Typography>

                    {/* Filtros */}
                    <Box className="flex gap-2 mb-4">
                        <TextField
                            size="small"
                            placeholder="Buscar alertas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <Search fontSize="small" className="mr-2" />
                            }}
                            className="flex-1"
                        />

                        <FormControl size="small" className="w-32">
                            <InputLabel>Severidad</InputLabel>
                            <Select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                label="Severidad"
                            >
                                <MenuItem value="all">Todas</MenuItem>
                                <MenuItem value="CRITICAL">Crítica</MenuItem>
                                <MenuItem value="HIGH">Alta</MenuItem>
                                <MenuItem value="MEDIUM">Media</MenuItem>
                                <MenuItem value="LOW">Baja</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" className="w-32">
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                label="Tipo"
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="speed_exceeded">Exceso Velocidad</MenuItem>
                                <MenuItem value="geofence_violation">Violación Geocerca</MenuItem>
                                <MenuItem value="critical_event">Evento Crítico</MenuItem>
                                <MenuItem value="maintenance">Mantenimiento</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Estadísticas */}
                    <Box className="flex gap-2 mb-4">
                        <Chip
                            label={`${filteredAlerts.length} alertas`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                        <Chip
                            label={`${alerts.filter(a => a.severity === 'CRITICAL').length} críticas`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                        <Chip
                            label={`${alerts.filter(a => a.severity === 'HIGH').length} altas`}
                            size="small"
                            color="warning"
                            variant="outlined"
                        />
                    </Box>
                </Box>

                {/* Lista de alertas */}
                {loading ? (
                    <Box className="flex items-center justify-center h-64">
                        <CircularProgress />
                        <Typography className="ml-2">Cargando alertas...</Typography>
                    </Box>
                ) : filteredAlerts.length === 0 ? (
                    <Alert severity="info">
                        No hay alertas que coincidan con los filtros seleccionados
                    </Alert>
                ) : (
                    <List className="max-h-96 overflow-y-auto">
                        {filteredAlerts.map((alert, index) => (
                            <React.Fragment key={alert.id}>
                                <ListItem
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => handleAlertClick(alert)}
                                >
                                    <ListItemIcon>
                                        {getSeverityIcon(alert.severity)}
                                    </ListItemIcon>

                                    <ListItemText
                                        primary={
                                            <Box className="flex items-center gap-2">
                                                <Typography variant="subtitle2" className="font-medium">
                                                    {alert.vehicleName}
                                                </Typography>
                                                <Chip
                                                    label={alert.severity}
                                                    size="small"
                                                    color={getSeverityColor(alert.severity) as any}
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={alert.type}
                                                    size="small"
                                                    color="default"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" className="mb-1">
                                                    {alert.message}
                                                </Typography>
                                                <Box className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Schedule fontSize="small" />
                                                    <Typography variant="caption">
                                                        {formatTimestamp(alert.timestamp)}
                                                    </Typography>
                                                    {alert.location && (
                                                        <Typography variant="caption">
                                                            • {alert.location.lat.toFixed(4)}, {alert.location.lng.toFixed(4)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />

                                    <Box className="flex items-center gap-1">
                                        <Tooltip title="Ver detalles">
                                            <IconButton size="small" color="primary">
                                                <OpenInNew fontSize="small" />
                                            </IconButton>
                                        </Tooltip>

                                        <Tooltip title="Marcar como leída">
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={(e) => handleMarkAsRead(alert.id, e)}
                                            >
                                                <CheckCircle fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </ListItem>

                                {index < filteredAlerts.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};
