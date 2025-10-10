import {
    LocationOn as LocationIcon,
    Map as MapIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { GeofenceEventsTable } from '../components/geofences/GeofenceEventsTable';
import { GeofenceFilters } from '../components/geofences/GeofenceFilters';
import { GeofenceMap } from '../components/geofences/GeofenceMap';
import { GeofenceStats } from '../components/geofences/GeofenceStats';
import { GeofenceTable } from '../components/geofences/GeofenceTable';
import { useGeofenceHelpers } from '../hooks/useGeofenceHelpers';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

// Interfaces
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

interface Geofence {
    id: string;
    externalId?: string;
    name: string;
    description?: string;
    tag?: string;
    type: 'POLYGON' | 'CIRCLE' | 'RECTANGLE';
    mode: 'CAR' | 'FOOT' | 'BIKE' | 'ALL';
    enabled: boolean;
    live: boolean;
    geometry: any;
    geometryCenter?: {
        type: 'Point';
        coordinates: [number, number];
    };
    geometryRadius?: number;
    disallowedPrecedingTagSubstrings?: any;
    ip?: any;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}

interface GeofenceEvent {
    id: string;
    geofenceId: string;
    vehicleId: string;
    vehicleName: string;
    eventType: 'entry' | 'exit';
    timestamp: string;
    coordinates: [number, number];
    speed: number;
    duration?: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`geofences-tabpanel-${index}`}
            aria-labelledby={`geofences-tab-${index}`}
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

const GeofencesManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const helpers = useGeofenceHelpers();

    // Estados principales
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);

    // Estados de carga y errores
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Estados para paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Timezone del usuario (por ahora Europe/Madrid, posteriormente desde user settings)
    const userTimezone = 'Europe/Madrid';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar geofences
            const geofencesResponse = await apiService.get('/api/geofences');
            const dataCount = Array.isArray(geofencesResponse.data) ? geofencesResponse.data.length : 0;
            logger.info('Datos de geofences cargados', { count: dataCount });

            if (geofencesResponse.success && geofencesResponse.data && Array.isArray(geofencesResponse.data)) {
                const convertedGeofences: Geofence[] = geofencesResponse.data.map((apiGeofence: any) => ({
                    id: apiGeofence.id,
                    externalId: apiGeofence.externalId,
                    name: apiGeofence.name,
                    description: apiGeofence.description || '',
                    tag: apiGeofence.tag,
                    type: apiGeofence.type,
                    mode: apiGeofence.mode || 'CAR',
                    enabled: apiGeofence.enabled,
                    live: apiGeofence.live,
                    geometry: apiGeofence.geometry,
                    geometryCenter: apiGeofence.geometryCenter,
                    geometryRadius: apiGeofence.geometryRadius,
                    disallowedPrecedingTagSubstrings: apiGeofence.disallowedPrecedingTagSubstrings,
                    ip: apiGeofence.ip,
                    organizationId: apiGeofence.organizationId,
                    createdAt: apiGeofence.createdAt,
                    updatedAt: apiGeofence.updatedAt
                }));

                setGeofences(convertedGeofences);

                // Cargar eventos de geofences
                try {
                    const eventsResponse = await apiService.get('/api/geofences/events?limit=50');
                    if (eventsResponse.success && eventsResponse.data && Array.isArray(eventsResponse.data)) {
                        const convertedEvents: GeofenceEvent[] = eventsResponse.data.map((apiEvent: any) => ({
                            id: apiEvent.id,
                            geofenceId: apiEvent.geofenceId,
                            vehicleId: apiEvent.vehicleId,
                            vehicleName: apiEvent.vehicleId,
                            eventType: apiEvent.type.toLowerCase() === 'enter' ? 'entry' : 'exit',
                            timestamp: apiEvent.timestamp,
                            coordinates: [apiEvent.latitude, apiEvent.longitude],
                            speed: apiEvent.speed || 0,
                            duration: undefined
                        }));
                        setGeofenceEvents(convertedEvents);
                        logger.info('Eventos de geofences cargados', { count: convertedEvents.length });
                    }
                } catch (eventsError) {
                    logger.warn('No se pudieron cargar eventos de geofences', { error: eventsError });
                    setGeofenceEvents([]);
                }
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            logger.error('Error cargando datos de geofences', { error });
            setError('Error al cargar los datos desde el servidor');
            setGeofences([]);
            setGeofenceEvents([]);
        } finally {
            setLoading(false);
        }
    };


    // Filtrar geofences
    const filteredGeofences = useMemo(() => {
        let filtered = geofences;

        if (searchTerm) {
            filtered = filtered.filter(geofence =>
                geofence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (geofence.description && geofence.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                helpers.getDepartmentFromTag(geofence.tag).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(geofence => geofence.type.toLowerCase() === typeFilter);
        }

        if (priorityFilter !== 'ALL') {
            filtered = filtered.filter(geofence => helpers.getPriorityFromTag(geofence.tag) === priorityFilter);
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(geofence =>
                statusFilter === 'ACTIVE' ? geofence.enabled : !geofence.enabled
            );
        }

        return filtered;
    }, [geofences, searchTerm, typeFilter, priorityFilter, statusFilter, helpers]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleCreateGeofence = () => {
        // TODO: Implementar diálogo de creación de geofence
        logger.info('Crear nuevo geofence');
    };

    const handleCreateRealData = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            logger.info('Iniciando creación de datos reales de geofences');
            const response = await apiService.post('/api/geofences/create-real-data', {});

            if (response.success) {
                setSuccess(`Datos reales creados exitosamente: ${response.message || 'Geofences de Bomberos Madrid configuradas'}`);
                logger.info('Datos reales creados', { message: response.message });

                setTimeout(async () => {
                    await loadData();
                }, 1000);
            } else {
                setError(response.error || 'Error desconocido al crear datos reales');
            }

        } catch (error: any) {
            logger.error('Error creando datos reales', { error });
            const errorMessage = error?.response?.data?.error || error?.message || 'Error al crear datos reales';
            setError(`Error al crear datos reales: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditGeofence = (geofence: Geofence) => {
        // TODO: Implementar diálogo de edición de geofence
        logger.info('Editar geofence', { id: geofence.id });
    };

    const handleDeleteGeofence = async (geofenceId: string) => {
        try {
            logger.info('Eliminando geofence', { id: geofenceId });
            const response = await apiService.delete(`/api/geofences/${geofenceId}`);

            if (response.success) {
                setGeofences(prev => prev.filter(g => g.id !== geofenceId));
                setSuccess('Geofence eliminado correctamente');
            } else {
                setError('Error al eliminar el geofence');
            }
        } catch (error) {
            logger.error('Error eliminando geofence', { error, id: geofenceId });
            setError('Error al eliminar el geofence');
        }
    };

    const handleToggleGeofence = async (geofenceId: string) => {
        try {
            const geofence = geofences.find(g => g.id === geofenceId);
            if (!geofence) return;

            logger.info('Cambiando estado de geofence', { id: geofenceId, enabled: !geofence.enabled });
            const response = await apiService.put(`/api/geofences/${geofenceId}`, {
                enabled: !geofence.enabled
            });

            if (response.success) {
                setGeofences(prev => prev.map(g =>
                    g.id === geofenceId ? { ...g, enabled: !g.enabled } : g
                ));
                setSuccess('Estado del geofence actualizado');
            } else {
                setError('Error al actualizar el geofence');
            }
        } catch (error) {
            logger.error('Error actualizando geofence', { error, id: geofenceId });
            setError('Error al actualizar el geofence');
        }
    };


    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <MapIcon sx={{ mr: 2, fontSize: 40 }} />
                    Gestión de Geofences - Bomberos Madrid
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    Administra zonas geográficas de interés para el seguimiento y alertas de vehículos
                </Typography>
            </Box>

            {/* Estadísticas rápidas */}
            <GeofenceStats
                geofences={geofences}
                geofenceEvents={geofenceEvents}
                getPriorityFromTag={helpers.getPriorityFromTag}
            />

            <Paper elevation={2}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="geofences tabs">
                        <Tab
                            icon={<MapIcon />}
                            label="Gestión de Geofences"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<TimelineIcon />}
                            label="Eventos de Geofences"
                            iconPosition="start"
                        />
                        <Tab
                            icon={<LocationIcon />}
                            label="Mapa Interactivo"
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Pestaña: Gestión de Geofences */}
                <TabPanel value={activeTab} index={0}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                        <Typography variant="h6">
                            Lista de Geofences
                        </Typography>
                        <GeofenceFilters
                            searchTerm={searchTerm}
                            typeFilter={typeFilter}
                            priorityFilter={priorityFilter}
                            statusFilter={statusFilter}
                            loading={loading}
                            onSearchChange={setSearchTerm}
                            onTypeFilterChange={setTypeFilter}
                            onPriorityFilterChange={setPriorityFilter}
                            onStatusFilterChange={setStatusFilter}
                            onCreateRealData={handleCreateRealData}
                            onCreateGeofence={handleCreateGeofence}
                        />
                    </Stack>

                    <GeofenceTable
                        geofences={filteredGeofences}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        userTimezone={userTimezone}
                        getGeofenceColor={helpers.getGeofenceColor}
                        getPriorityFromTag={helpers.getPriorityFromTag}
                        getDepartmentFromTag={helpers.getDepartmentFromTag}
                        getModeText={helpers.getModeText}
                        onPageChange={setPage}
                        onRowsPerPageChange={setRowsPerPage}
                        onEditGeofence={handleEditGeofence}
                        onDeleteGeofence={handleDeleteGeofence}
                        onToggleGeofence={handleToggleGeofence}
                    />
                </TabPanel>

                {/* Pestaña: Eventos de Geofences */}
                <TabPanel value={activeTab} index={1}>
                    <Typography variant="h6" gutterBottom>
                        Eventos Recientes de Geofences
                    </Typography>

                    <GeofenceEventsTable
                        events={geofenceEvents}
                        geofences={geofences}
                        userTimezone={userTimezone}
                    />
                </TabPanel>

                {/* Pestaña: Mapa Interactivo */}
                <TabPanel value={activeTab} index={2}>
                    <Typography variant="h6" gutterBottom>
                        Mapa Interactivo de Geofences
                    </Typography>

                    {geofences.length === 0 ? (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>No hay geofences configuradas.</strong><br />
                                Haz clic en "Crear Datos Reales" para generar geofences de ejemplo para Bomberos Madrid, incluyendo:
                                <br />• Parque Central (Puerta del Sol)
                                <br />• Estaciones de Chamberí, Vallecas y Carabanchel
                                <br />• Zonas de alto riesgo (Gran Vía, Retiro)
                            </Typography>
                        </Alert>
                    ) : (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                <strong>Mapa interactivo activo</strong> con {geofences.length} geofences configuradas ({geofences.filter(g => g.enabled).length} activas).
                                Haz clic en los marcadores para ver detalles completos.
                            </Typography>
                        </Alert>
                    )}

                    {/* Mapa Interactivo */}
                    <Box sx={{ mb: 3 }}>
                        <GeofenceMap
                            geofences={geofences}
                            height="600px"
                        />
                    </Box>

                    {/* Resumen de Geofences */}
                    <Typography variant="h6" gutterBottom>
                        Resumen de Geofences
                    </Typography>

                    <Grid container spacing={3}>
                        {geofences.filter(g => g.enabled).map((geofence) => (
                            <Grid item xs={12} md={6} lg={4} key={geofence.id}>
                                <Card>
                                    <CardContent>
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                            <Box sx={{ color: helpers.getGeofenceColor(geofence) }}>
                                                <LocationIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6">
                                                    {geofence.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {helpers.getDepartmentFromTag(geofence.tag)}
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack spacing={1} sx={{ mb: 2 }}>
                                            <Typography variant="body2">
                                                <strong>Tipo:</strong> {geofence.type}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Prioridad:</strong> {helpers.getPriorityFromTag(geofence.tag).toUpperCase()}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Modo:</strong> {helpers.getModeText(geofence.mode)}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Tag:</strong> {geofence.tag || 'N/A'}
                                            </Typography>
                                        </Stack>

                                        <Stack direction="row" spacing={1}>
                                            <Chip
                                                label={geofence.enabled ? 'Activo' : 'Inactivo'}
                                                size="small"
                                                color={geofence.enabled ? 'success' : 'default'}
                                            />
                                            <Chip
                                                label={helpers.getPriorityFromTag(geofence.tag).toUpperCase()}
                                                size="small"
                                                color={
                                                    helpers.getPriorityFromTag(geofence.tag) === 'critical' ? 'error' :
                                                        helpers.getPriorityFromTag(geofence.tag) === 'high' ? 'warning' :
                                                            helpers.getPriorityFromTag(geofence.tag) === 'medium' ? 'info' : 'default'
                                                }
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>
            </Paper>

            {/* Snackbars para notificaciones */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default GeofencesManager;
