/**
 * 🚒 DASHBOARD DE EMERGENCIAS - BOMBEROS MADRID
 * Vista principal para monitoreo en tiempo real de vehículos de bomberos
 */

import {
import { logger } from '../utils/logger';
    Warning as AlertIcon,
    CheckCircle as AvailableIcon,
    Warning as EmergencyIcon,
    GetApp as ExportIcon,
    Build as MaintenanceIcon,
    OfflineBolt as OfflineIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useCallback, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import { DashboardStats, useEmergencyDashboard, VehicleStatus } from '../hooks/useEmergencyDashboard';

// Tipos
interface GPSData {
    vehicleId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
    satellites: number;
    accuracy: number;
    lastUpdate: Date;
    status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

interface VehicleStatus {
    vehicleId: string;
    name: string;
    type: string;
    gpsData: GPSData | null;
    isActive: boolean;
    lastSeen: Date;
    emergencyStatus: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
}

interface DashboardStats {
    total: number;
    online: number;
    emergency: number;
    available: number;
    offline: number;
    maintenance: number;
}

// Configuración de iconos personalizados para Leaflet
const createCustomIcon = (color: string, type: string) => {
    const iconHtml = `
        <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
            <span style="color: white; font-size: 16px; font-weight: bold;">
                ${type === 'FIRE_TRUCK' ? '🚒' : type === 'AMBULANCE' ? '🚑' : '🚛'}
            </span>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-vehicle-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

// Interfaces adicionales
interface EmergencyAlert {
    id: string;
    vehicleId: string;
    vehicleName: string;
    type: 'SPEED_EXCESS' | 'GPS_LOST' | 'MAINTENANCE_DUE' | 'FUEL_LOW' | 'EMERGENCY_BUTTON';
    message: string;
    timestamp: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    resolved: boolean;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`emergency-tabpanel-${index}`}
            aria-labelledby={`emergency-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const EmergencyDashboard: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    // Estados adicionales
    const [tabValue, setTabValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showAlerts, setShowAlerts] = useState(true);

    // Hook personalizado para el dashboard
    const {
        vehicles,
        stats,
        loading,
        error,
        lastUpdate,
        forceUpdate
    } = useEmergencyDashboard();

    // Datos simulados para alertas (en producción vendrían del backend)
    const emergencyAlerts: EmergencyAlert[] = useMemo(() => [
        {
            id: '1',
            vehicleId: 'DOBACK027',
            vehicleName: 'Bomba Escalera 027',
            type: 'SPEED_EXCESS',
            message: 'Velocidad excesiva detectada: 85 km/h en zona urbana',
            timestamp: new Date(Date.now() - 5 * 60000), // 5 minutos atrás
            severity: 'HIGH',
            resolved: false
        },
        {
            id: '2',
            vehicleId: 'DOBACK015',
            vehicleName: 'Bomba Escalera 015',
            type: 'GPS_LOST',
            message: 'Señal GPS perdida durante 3 minutos',
            timestamp: new Date(Date.now() - 10 * 60000), // 10 minutos atrás
            severity: 'MEDIUM',
            resolved: false
        },
        {
            id: '3',
            vehicleId: 'DOBACK042',
            vehicleName: 'Bomba Escalera 042',
            type: 'MAINTENANCE_DUE',
            message: 'Mantenimiento programado vence en 2 días',
            timestamp: new Date(Date.now() - 30 * 60000), // 30 minutos atrás
            severity: 'LOW',
            resolved: false
        }
    ], []);

    // Filtrar vehículos
    const filteredVehicles = useMemo(() => {
        let filtered = vehicles;

        // Filtro por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(vehicle =>
                vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.vehicleId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro por estado
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(vehicle => vehicle.emergencyStatus === statusFilter);
        }

        return filtered;
    }, [vehicles, searchTerm, statusFilter]);

    // Configuración del mapa (Madrid)
    const mapCenter: [number, number] = [40.4168, -3.7038];
    const mapZoom = 11;

    /**
     * Fuerza actualización de datos
     */
    const handleForceUpdate = useCallback(async () => {
        await forceUpdate();
    }, [forceUpdate]);

    /**
     * Maneja el cambio de pestañas
     */
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    /**
     * Obtiene el color según la severidad de la alerta
     */
    const getAlertSeverityColor = (severity: EmergencyAlert['severity']) => {
        switch (severity) {
            case 'CRITICAL': return 'error';
            case 'HIGH': return 'warning';
            case 'MEDIUM': return 'info';
            case 'LOW': return 'success';
            default: return 'default';
        }
    };

    /**
     * Obtiene el icono según el tipo de alerta
     */
    const getAlertIcon = (type: EmergencyAlert['type']) => {
        switch (type) {
            case 'SPEED_EXCESS': return <AlertIcon />;
            case 'GPS_LOST': return <OfflineIcon />;
            case 'MAINTENANCE_DUE': return <MaintenanceIcon />;
            case 'FUEL_LOW': return <AlertIcon />;
            case 'EMERGENCY_BUTTON': return <EmergencyIcon />;
            default: return <AlertIcon />;
        }
    };

    /**
     * Obtiene el color según el estado del vehículo
     */
    const getVehicleColor = (status: VehicleStatus['emergencyStatus']) => {
        switch (status) {
            case 'ON_EMERGENCY': return theme.palette.error.main;
            case 'AVAILABLE': return theme.palette.success.main;
            case 'MAINTENANCE': return theme.palette.warning.main;
            case 'OFFLINE': return theme.palette.grey[500];
            default: return theme.palette.grey[500];
        }
    };

    /**
     * Obtiene el icono según el estado del vehículo
     */
    const getVehicleIcon = (status: VehicleStatus['emergencyStatus']) => {
        switch (status) {
            case 'ON_EMERGENCY': return <EmergencyIcon />;
            case 'AVAILABLE': return <AvailableIcon />;
            case 'MAINTENANCE': return <MaintenanceIcon />;
            case 'OFFLINE': return <OfflineIcon />;
            default: return <OfflineIcon />;
        }
    };

    /**
     * Obtiene el texto del estado
     */
    const getStatusText = (status: VehicleStatus['emergencyStatus']) => {
        switch (status) {
            case 'ON_EMERGENCY': return 'En Emergencia';
            case 'AVAILABLE': return 'Disponible';
            case 'MAINTENANCE': return 'Mantenimiento';
            case 'OFFLINE': return 'Desconectado';
            default: return 'Desconocido';
        }
    };

    /**
     * Formatea la velocidad
     */
    const formatSpeed = (speed: number | null | undefined) => {
        if (speed === null || speed === undefined || isNaN(speed)) {
            return 'Sin datos';
        }
        return `${speed.toFixed(1)} km/h`;
    };

    /**
     * Formatea el tiempo transcurrido
     */
    const formatTimeAgo = (date: Date | string | null | undefined) => {
        // Validar que la fecha existe y es válida
        if (!date) return 'Sin datos';

        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;

            // Verificar que la fecha es válida y que dateObj existe
            if (!dateObj || isNaN(dateObj.getTime())) return 'Fecha inválida';

            const now = new Date();
            const diffMs = now.getTime() - dateObj.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `${diffMins}min`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h`;

            const diffDays = Math.floor(diffHours / 24);
            return `${diffDays}d`;
        } catch (error) {
            logger.warn('Error formateando fecha:', error);
            return 'Error de fecha';
        }
    };

    // Los efectos ya están manejados por el hook useEmergencyDashboard

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Error cargando dashboard de emergencias: {error}
                </Alert>
                <Button variant="contained" onClick={handleForceUpdate}>
                    Reintentar
                </Button>
            </Container>
        );
    }

    return (
        <ErrorBoundary>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box>
                            <Typography variant="h4" component="h1" gutterBottom>
                                🚒 Dashboard de Emergencias
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Bomberos Madrid - Monitoreo en Tiempo Real
                            </Typography>
                        </Box>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <Chip
                                icon={stats.isMonitoring ? <CheckCircle /> : <OfflineIcon />}
                                label={stats.isMonitoring ? 'Monitoreo Activo' : 'Monitoreo Inactivo'}
                                color={stats.isMonitoring ? 'success' : 'error'}
                                variant="outlined"
                            />

                            <Tooltip title="Actualizar datos">
                                <IconButton onClick={handleForceUpdate}>
                                    <RefreshIcon />
                                </IconButton>
                            </Tooltip>

                            <Button
                                variant="outlined"
                                startIcon={<ExportIcon />}
                                onClick={() => navigate('/reports')}
                            >
                                Generar Reporte
                            </Button>
                        </Stack>
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                        Última actualización: {lastUpdate.toLocaleString()}
                    </Typography>
                </Box>

                {/* Alertas Críticas */}
                {emergencyAlerts.filter(alert => alert.severity === 'CRITICAL' && !alert.resolved).length > 0 && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        icon={<EmergencyIcon />}
                    >
                        <Typography variant="h6">
                            ¡ALERTAS CRÍTICAS ACTIVAS!
                        </Typography>
                        <Typography variant="body2">
                            {emergencyAlerts.filter(alert => alert.severity === 'CRITICAL' && !alert.resolved).length} alerta(s) crítica(s) requieren atención inmediata.
                        </Typography>
                    </Alert>
                )}

                {/* Estadísticas Generales */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Vehículos
                                </Typography>
                                <Typography variant="h4" component="div">
                                    {stats.total}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    Online
                                </Typography>
                                <Typography variant="h4" component="div" color="success.main">
                                    {stats.online}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Card sx={{ border: `2px solid ${theme.palette.error.main}` }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    En Emergencia
                                </Typography>
                                <Typography variant="h4" component="div" color="error.main">
                                    {stats.emergency}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    Disponibles
                                </Typography>
                                <Typography variant="h4" component="div" color="success.main">
                                    {stats.available}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    Mantenimiento
                                </Typography>
                                <Typography variant="h4" component="div" color="warning.main">
                                    {stats.maintenance}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography color="text.secondary" gutterBottom>
                                    Offline
                                </Typography>
                                <Typography variant="h4" component="div" color="grey.500">
                                    {stats.offline}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Sistema de Pestañas */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="emergency dashboard tabs">
                        <Tab label="Vista General" />
                        <Tab label="Mapa en Tiempo Real" />
                        <Tab label="Alertas" />
                        <Tab label="Historial" />
                    </Tabs>
                </Box>

                {/* Pestaña: Vista General */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        🗺️ Ubicación de Vehículos
                                    </Typography>

                                    <Box sx={{ height: 400, width: '100%' }}>
                                        <MapContainer
                                            center={mapCenter}
                                            zoom={mapZoom}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer
                                                url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                                                attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                                            />

                                            {filteredVehicles.map((vehicle) => {
                                                if (!vehicle.gpsData || !vehicle.isActive) return null;

                                                // Validación robusta de datos GPS
                                                if (!vehicle.gpsData.latitude || !vehicle.gpsData.longitude ||
                                                    isNaN(vehicle.gpsData.latitude) || isNaN(vehicle.gpsData.longitude)) {
                                                    logger.warn(`Datos GPS inválidos para vehículo ${vehicle.vehicleId}:`, vehicle.gpsData);
                                                    return null;
                                                }

                                                const color = getVehicleColor(vehicle.emergencyStatus);

                                                return (
                                                    <Marker
                                                        key={vehicle.vehicleId}
                                                        position={[vehicle.gpsData.latitude, vehicle.gpsData.longitude]}
                                                        icon={createCustomIcon(color, vehicle.type)}
                                                    >
                                                        <Popup>
                                                            <Box sx={{ minWidth: 200 }}>
                                                                <Typography variant="h6" gutterBottom>
                                                                    {vehicle.name}
                                                                </Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {vehicle.vehicleId}
                                                                </Typography>
                                                                <Chip
                                                                    label={getStatusText(vehicle.emergencyStatus)}
                                                                    size="small"
                                                                    color={
                                                                        vehicle.emergencyStatus === 'ON_EMERGENCY' ? 'error' :
                                                                            vehicle.emergencyStatus === 'AVAILABLE' ? 'success' :
                                                                                vehicle.emergencyStatus === 'MAINTENANCE' ? 'warning' : 'default'
                                                                    }
                                                                    sx={{ mt: 1 }}
                                                                />
                                                                <Box sx={{ mt: 1 }}>
                                                                    <Typography variant="caption" display="block">
                                                                        Velocidad: {formatSpeed(vehicle.gpsData?.speed)}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        Actualizado: {formatTimeAgo(vehicle.gpsData?.lastUpdate)}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </Popup>
                                                    </Marker>
                                                );
                                            })}
                                        </MapContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Lista de Vehículos */}
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                        <Typography variant="h6">
                                            🚒 Estado de Vehículos
                                        </Typography>
                                        <Chip label={`${filteredVehicles.length} vehículos`} size="small" />
                                    </Stack>

                                    {/* Filtros */}
                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <TextField
                                            size="small"
                                            placeholder="Buscar vehículo..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            InputProps={{
                                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                                            }}
                                            sx={{ flexGrow: 1 }}
                                        />
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <InputLabel>Estado</InputLabel>
                                            <Select
                                                value={statusFilter}
                                                label="Estado"
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                            >
                                                <MenuItem value="ALL">Todos</MenuItem>
                                                <MenuItem value="AVAILABLE">Disponibles</MenuItem>
                                                <MenuItem value="ON_EMERGENCY">En Emergencia</MenuItem>
                                                <MenuItem value="MAINTENANCE">Mantenimiento</MenuItem>
                                                <MenuItem value="OFFLINE">Offline</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Stack>

                                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Vehículo</TableCell>
                                                    <TableCell align="center">Estado</TableCell>
                                                    <TableCell align="right">Velocidad</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredVehicles.map((vehicle) => (
                                                    <TableRow key={vehicle.vehicleId}>
                                                        <TableCell>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {vehicle.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {vehicle.vehicleId}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                icon={getVehicleIcon(vehicle.emergencyStatus)}
                                                                label={getStatusText(vehicle.emergencyStatus)}
                                                                size="small"
                                                                color={
                                                                    vehicle.emergencyStatus === 'ON_EMERGENCY' ? 'error' :
                                                                        vehicle.emergencyStatus === 'AVAILABLE' ? 'success' :
                                                                            vehicle.emergencyStatus === 'MAINTENANCE' ? 'warning' : 'default'
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {vehicle.gpsData ? (
                                                                <Typography variant="body2">
                                                                    {formatSpeed(vehicle.gpsData?.speed)}
                                                                </Typography>
                                                            ) : (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    --
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Pestaña: Mapa en Tiempo Real */}
                <TabPanel value={tabValue} index={1}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                🗺️ Mapa de Seguimiento en Tiempo Real
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Vista completa de todos los vehículos con actualización automática cada 30 segundos
                            </Typography>

                            <Box sx={{ height: 600, width: '100%' }}>
                                <MapContainer
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                                        attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                                    />

                                    {vehicles.map((vehicle) => {
                                        if (!vehicle.gpsData || !vehicle.isActive) return null;

                                        // Validación robusta de datos GPS
                                        if (!vehicle.gpsData.latitude || !vehicle.gpsData.longitude ||
                                            isNaN(vehicle.gpsData.latitude) || isNaN(vehicle.gpsData.longitude)) {
                                            logger.warn(`Datos GPS inválidos para vehículo ${vehicle.vehicleId}:`, vehicle.gpsData);
                                            return null;
                                        }

                                        const color = getVehicleColor(vehicle.emergencyStatus);

                                        return (
                                            <Marker
                                                key={vehicle.vehicleId}
                                                position={[vehicle.gpsData.latitude, vehicle.gpsData.longitude]}
                                                icon={createCustomIcon(color, vehicle.type)}
                                            >
                                                <Popup>
                                                    <Box sx={{ minWidth: 250 }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            {vehicle.name}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            {vehicle.vehicleId}
                                                        </Typography>

                                                        <Chip
                                                            label={getStatusText(vehicle.emergencyStatus)}
                                                            size="small"
                                                            color={
                                                                vehicle.emergencyStatus === 'ON_EMERGENCY' ? 'error' :
                                                                    vehicle.emergencyStatus === 'AVAILABLE' ? 'success' :
                                                                        vehicle.emergencyStatus === 'MAINTENANCE' ? 'warning' : 'default'
                                                            }
                                                            sx={{ mb: 2 }}
                                                        />

                                                        <Divider sx={{ my: 1 }} />

                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Velocidad:</strong> {formatSpeed(vehicle.gpsData?.speed)}
                                                            </Typography>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Dirección:</strong> {vehicle.gpsData.heading}°
                                                            </Typography>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Precisión:</strong> {vehicle.gpsData.accuracy}m
                                                            </Typography>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Satélites:</strong> {vehicle.gpsData.satellites}
                                                            </Typography>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Actualizado:</strong> {formatTimeAgo(vehicle.gpsData?.lastUpdate)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </MapContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </TabPanel>

                {/* Pestaña: Alertas */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        🚨 Sistema de Alertas
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Alertas automáticas y notificaciones del sistema de monitoreo
                                    </Typography>

                                    <List>
                                        {emergencyAlerts.map((alert) => (
                                            <ListItem key={alert.id} sx={{ mb: 2 }}>
                                                <ListItemIcon>
                                                    <Chip
                                                        icon={getAlertIcon(alert.type)}
                                                        label={alert.severity}
                                                        size="small"
                                                        color={getAlertSeverityColor(alert.severity)}
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body1" fontWeight="medium">
                                                            {alert.vehicleName} ({alert.vehicleId})
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {alert.message}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatTimeAgo(alert?.timestamp)}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                >
                                                    Resolver
                                                </Button>
                                            </ListItem>
                                        ))}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Pestaña: Historial */}
                <TabPanel value={tabValue} index={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📊 Historial de Actividad
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Registro de eventos y actividad reciente de los vehículos
                            </Typography>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6">
                                        Últimas 24 horas
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <List>
                                        <ListItem>
                                            <ListItemIcon>
                                                <EmergencyIcon color="error" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Bomba Escalera 027 - Emergencia activada"
                                                secondary="Hace 2 horas - Incendio en Calle Mayor 123"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <AvailableIcon color="success" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Bomba Escalera 015 - Disponible"
                                                secondary="Hace 3 horas - Regreso de intervención"
                                            />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <MaintenanceIcon color="warning" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Bomba Escalera 042 - En mantenimiento"
                                                secondary="Hace 5 horas - Revisión programada"
                                            />
                                        </ListItem>
                                    </List>
                                </AccordionDetails>
                            </Accordion>

                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="h6">
                                        Esta semana
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" color="text.secondary">
                                        Estadísticas semanales y resumen de actividad...
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        </CardContent>
                    </Card>
                </TabPanel>
            </Container>
        </ErrorBoundary>
    );
};

export default EmergencyDashboard;
