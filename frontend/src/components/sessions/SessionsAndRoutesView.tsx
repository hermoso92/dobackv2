import {
    Route
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { SESSION_ENDPOINTS } from '../../config/api';
import { getOrganizationId } from '../../config/organization';
import { useAuth } from '../../hooks/useAuth';
import { usePDFExport } from '../../hooks/usePDFExport';
import { useStabilityCalculation } from '../../hooks/useStabilityCalculation';
import { useTelemetryData } from '../../hooks/useTelemetryData';
import { apiService } from '../../services/api';
import { logger } from '../../utils/logger';
import LEDIndicator from '../indicators/LEDIndicator';
import RouteMapComponent from '../maps/RouteMapComponent';
import RoutePlaybackWithLEDs from '../playback/RoutePlaybackWithLEDs';
import { VehicleSessionSelector } from '../selectors/VehicleSessionSelector';

interface Session {
    id: string;
    vehicleId: string;
    vehicleName: string;
    startTime: string;
    endTime: string;
    duration: string; // Now HH:MM string
    distance: number;
    status: 'completed' | 'active' | 'interrupted';
    route: any[];
    events: any[];
    avgSpeed: number;
    maxSpeed: number;
}

// Exportar función para uso externo
export const useRouteExport = (routeData: any, selectedSession: any) => {
    const { exportRouteReport, captureElementEnhanced } = usePDFExport();
    
    return useCallback(async () => {
        if (!selectedSession || !routeData) {
            logger.warn('No hay sesión o ruta seleccionada para exportar');
            return;
        }

        try {
            logger.info('Iniciando exportación de recorrido', { sessionId: selectedSession.id });

            // Capturar mapa del elemento con ID específico
            const mapElement = document.querySelector('.leaflet-container');
            let mapImage: string | null = null;

            if (mapElement) {
                const tempId = 'route-map-export';
                mapElement.id = tempId;
                await new Promise(resolve => setTimeout(resolve, 1000));
                mapImage = await captureElementEnhanced(tempId, 3);
                mapElement.removeAttribute('id');
            }

            // Geocodificar ubicaciones de eventos
            logger.info('Geocodificando ubicaciones de eventos...');
            const eventsWithLocations = await Promise.all(
                routeData.events.map(async (event: any) => {
                    let location = `${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}`;
                    
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${event.lat}&lon=${event.lng}`,
                            { headers: { 'User-Agent': 'DobackSoft/1.0' } }
                        );
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.address) {
                                const road = data.address.road || data.address.street || data.address.highway;
                                const city = data.address.city || data.address.town || data.address.village;
                                if (road && city) {
                                    location = `${road}, ${city}`;
                                } else if (road) {
                                    location = road;
                                }
                            }
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 600));
                    } catch (error) {
                        logger.warn('Error geocodificando evento', { error });
                    }
                    
                    return {
                        id: event.id,
                        lat: event.lat,
                        lng: event.lng,
                        location: location,
                        type: event.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Evento',
                        severity: event.severity === 'HIGH' || event.severity === 'grave' ? 'Grave' :
                                 event.severity === 'MEDIUM' || event.severity === 'moderada' ? 'Moderada' :
                                 event.severity === 'LOW' || event.severity === 'leve' ? 'Leve' :
                                 'Desconocida',
                        timestamp: new Date(event.timestamp)
                    };
                })
            );

            const exportData = {
                sessionId: selectedSession.id,
                vehicleName: selectedSession.vehicleName || `Vehículo ${selectedSession.vehicleId}`,
                startTime: selectedSession.startTime,
                endTime: selectedSession.endTime,
                duration: selectedSession.duration,
                distance: selectedSession.distance,
                avgSpeed: selectedSession.avgSpeed,
                maxSpeed: selectedSession.maxSpeed,
                route: routeData.route.map((point: any) => ({
                    lat: point.lat,
                    lng: point.lng,
                    speed: point.speed,
                    timestamp: new Date(point.timestamp)
                })),
                events: eventsWithLocations,
                stats: {
                    validRoutePoints: routeData.stats.validRoutePoints,
                    validEvents: routeData.stats.validEvents,
                    totalGpsPoints: routeData.stats.totalGpsPoints,
                    totalEvents: routeData.stats.totalEvents
                },
                mapImage: mapImage || undefined
            };

            await exportRouteReport(exportData);
            logger.info('Recorrido exportado exitosamente');
        } catch (error) {
            logger.error('Error exportando recorrido', { error });
        }
    }, [selectedSession, routeData, captureElementEnhanced, exportRouteReport]);
};

export const SessionsAndRoutesView: React.FC = () => {
    const { user } = useAuth();
    const { useSessions } = useTelemetryData();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [routeData, setRouteData] = useState<{
        route: Array<{ lat: number; lng: number; speed: number; timestamp: Date }>;
        events: Array<{ id: string; lat: number; lng: number; type: string; severity: string; timestamp: Date }>;
        session: any;
        stats: {
            validRoutePoints: number;
            validEvents: number;
            totalGpsPoints: number;
            totalEvents: number;
            skippedJumps?: number;
            maxDistanceBetweenPoints?: number;
        };
    } | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Estados para el ranking
    const [ranking, setRanking] = useState<any[]>([]);
    const [rankingMetric, setRankingMetric] = useState<'events' | 'distance' | 'duration' | 'speed'>('events');
    const [loadingRanking, setLoadingRanking] = useState(false);

    // Estados para el indicador LED
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    // Hook para calcular estabilidad del evento seleccionado
    const stabilityPercentage = useStabilityCalculation(selectedEvent);

    // Obtener sesiones reales
    const { data: sessionsData, isLoading: sessionsLoading } = useSessions({
        vehicleId: selectedVehicleId || undefined
    });

    // Cargar ranking de sesiones
    const loadRanking = useCallback(async () => {
        try {
            setLoadingRanking(true);
            logger.info('Cargando ranking de sesiones');

            const params = new URLSearchParams({
                organizationId: getOrganizationId(user?.organizationId),
                metric: rankingMetric,
                limit: '10'
            });

            if (selectedVehicleId) {
                params.append('vehicleIds', selectedVehicleId);
            }

            const response = await apiService.get<{ ranking: any[]; total: number }>(
                `${SESSION_ENDPOINTS.RANKING}?${params.toString()}`
            );

            if (response.success && response.data) {
                setRanking(response.data.ranking || []);
                logger.info(`Ranking cargado: ${response.data.ranking?.length || 0} sesiones`);
            }

        } catch (err) {
            logger.error('Error cargando ranking de sesiones:', err);
        } finally {
            setLoadingRanking(false);
        }
    }, [rankingMetric, selectedVehicleId]);

    useEffect(() => {
        loadRanking();
    }, [loadRanking]);

    // Procesar datos de sesiones
    useEffect(() => {
        if (sessionsData && Array.isArray(sessionsData)) {
            const processedSessions: Session[] = sessionsData.map((session: any) => {
                const startTime = session.startTime || session.startedAt;
                const endTime = session.endTime || session.endedAt;
                const duration = session.durationString || formatDuration(session.duration || 0);

                return {
                    id: session.id,
                    vehicleId: session.vehicleId,
                    vehicleName: session.vehicleName || session.vehicle?.name || `Vehículo ${session.vehicleId}`,
                    startTime: startTime ? new Date(startTime).toLocaleString() : 'N/A',
                    endTime: endTime ? new Date(endTime).toLocaleString() : 'N/A',
                    duration: duration,
                    distance: parseFloat(session.distance) || parseFloat(session.summary?.km) || 0,
                    status: getSessionStatus(session),
                    route: session.route || [],
                    events: session.events || [],
                    avgSpeed: parseFloat(session.avgSpeed) || parseFloat(session.summary?.avgSpeed) || 0,
                    maxSpeed: parseFloat(session.maxSpeed) || parseFloat(session.summary?.maxSpeed) || 0
                };
            });

            setSessions(processedSessions);
        }
    }, [sessionsData]);

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const getSessionStatus = (session: any): 'completed' | 'active' | 'interrupted' => {
        if (session.status === 'completed') return 'completed';
        if (session.status === 'active') return 'active';
        return 'interrupted';
    };

    // Sincronizar selectedSession cuando cambie selectedSessionId
    useEffect(() => {
        if (selectedSessionId && sessions.length > 0) {
            const foundSession = sessions.find(s => s.id === selectedSessionId);
            if (foundSession && (!selectedSession || selectedSession.id !== foundSession.id)) {
                setSelectedSession(foundSession);
            }
        } else if (!selectedSessionId && selectedSession) {
            setSelectedSession(null);
        }
    }, [selectedSessionId, sessions, selectedSession]);

    // Cargar datos de la ruta cuando cambie la sesión seleccionada
    useEffect(() => {
        const loadRouteData = async () => {
            if (!selectedSessionId) {
                setRouteData(null);
                return;
            }

            setLoadingRoute(true);
            try {
                const data = await apiService.get<any>(`/api/session-route/${selectedSessionId}`);
                if (data.success && data.data) {
                    const routeDataResponse = data.data as {
                        route?: any[];
                        events?: any[];
                        session?: any;
                        stats?: any;
                    };

                    // Asegurar que los datos tienen la estructura correcta
                    const formattedData = {
                        route: routeDataResponse.route || [],
                        events: routeDataResponse.events || [],
                        session: routeDataResponse.session || {},
                        stats: {
                            validRoutePoints: routeDataResponse.stats?.validRoutePoints || 0,
                            validEvents: routeDataResponse.stats?.validEvents || 0,
                            totalGpsPoints: routeDataResponse.stats?.totalGpsPoints || 0,
                            totalEvents: routeDataResponse.stats?.totalEvents || 0,
                            skippedJumps: routeDataResponse.stats?.skippedJumps,
                            maxDistanceBetweenPoints: routeDataResponse.stats?.maxDistanceBetweenPoints
                        }
                    };

                    setRouteData(formattedData);
                } else {
                    setRouteData(null);
                }
            } catch (error) {
                logger.error('Error cargando datos de ruta', { error });
                setRouteData(null);
            } finally {
                setLoadingRoute(false);
            }
        };

        loadRouteData();
    }, [selectedSessionId]);

    if (sessionsLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Cargando sesiones...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Selectores compactos */}
            <Box sx={{ mb: 1, flexShrink: 0 }}>
                <VehicleSessionSelector
                    selectedVehicleId={selectedVehicleId}
                    selectedSessionId={selectedSessionId}
                    onVehicleChange={setSelectedVehicleId}
                    onSessionChange={setSelectedSessionId}
                    showSessionSelector={true}
                />
            </Box>

            {/* Grid: Mapa + Panel lateral */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1 }}>
                {/* Mapa con ruta y eventos */}
                <Box sx={{ height: '100%' }}>
                    <Card sx={{ height: '100%', boxShadow: 1 }}>
                        <CardContent sx={{ height: '100%', p: 0 }}>
                            {(selectedSession || (selectedSessionId && sessions.length > 0)) ? (
                                <Box sx={{ height: '100%', position: 'relative' }}>
                                    {/* Header con título */}
                                    <Box sx={{ p: 1, pb: 0.5 }}>
                                        <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                                            Ruta de {selectedSession?.vehicleName || 'Sesión seleccionada'}
                                        </Typography>
                                    </Box>

                                    {/* Mapa real con datos GPS */}
                                    <Box sx={{ height: 'calc(100vh - 150px)', position: 'relative' }}>
                                        {loadingRoute ? (
                                            <Box sx={{
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <LinearProgress sx={{ width: '50%' }} />
                                                <Typography variant="body2" sx={{ ml: 2 }}>
                                                    Cargando ruta...
                                                </Typography>
                                            </Box>
                                        ) : routeData ? (
                                            <>
                                                <RouteMapComponent
                                                    center={routeData.route.length > 0 && routeData.route[0] ?
                                                        [routeData.route[0].lat, routeData.route[0].lng] :
                                                        [40.4168, -3.7038]
                                                    }
                                                    zoom={13}
                                                    height="100%"
                                                    route={routeData.route}
                                                    events={routeData.events}
                                                    vehicleName={routeData.session.vehicleName}
                                                    onEventSelect={setSelectedEvent}
                                                />
                                            </>
                                        ) : (
                                            <Box sx={{
                                                height: '100%',
                                                bgcolor: 'grey.100',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {/* Placeholder para el mapa */}
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    color: 'text.secondary'
                                                }}>
                                                    <Route sx={{ fontSize: 64 }} />
                                                    <Typography variant="h6">
                                                        No hay datos de ruta disponibles
                                                    </Typography>
                                                    <Typography variant="body2" textAlign="center">
                                                        Esta sesión no contiene datos GPS válidos<br />
                                                        para mostrar en el mapa
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* Información de estadísticas */}
                                    {routeData && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 60,
                                            left: 16,
                                            bgcolor: 'rgba(255,255,255,0.95)',
                                            p: 1.5,
                                            borderRadius: 2,
                                            zIndex: 1000,
                                            maxWidth: '300px',
                                            fontSize: '0.875rem',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                📊 Estadísticas de la Ruta
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                📍 Puntos GPS válidos: {routeData.stats.validRoutePoints}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                ⚠️ Eventos: {routeData.stats.validEvents}
                                            </Typography>
                                            {routeData.stats.skippedJumps !== undefined && routeData.stats.skippedJumps > 0 && (
                                                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                                    🚫 Saltos GPS filtrados: {routeData.stats.skippedJumps}
                                                </Typography>
                                            )}
                                            {routeData.stats.maxDistanceBetweenPoints !== undefined && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                    📏 Dist. máx: {routeData.stats.maxDistanceBetweenPoints}m
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                🚗 {routeData.session.vehicleName}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                📅 {new Date(routeData.session.startTime).toLocaleDateString()}
                                            </Typography>
                                            {(routeData.stats.skippedJumps ?? 0) > 0 && (
                                                <Typography variant="caption" color="text.secondary" sx={{
                                                    display: 'block',
                                                    mt: 1,
                                                    fontSize: '0.7rem',
                                                    fontStyle: 'italic'
                                                }}>
                                                    ℹ️ Los puntos GPS con saltos &gt;{routeData.stats.maxDistanceBetweenPoints || 0}m fueron filtrados para mostrar una ruta realista
                                                </Typography>
                                            )}
                                        </Box>
                                    )}

                                    {/* Panel de detalles del evento con indicador LED */}
                                    {selectedEvent && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 60,
                                            right: 16,
                                            bgcolor: 'rgba(255,255,255,0.98)',
                                            p: 3,
                                            borderRadius: 2,
                                            zIndex: 1000,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                            minWidth: '350px',
                                            maxWidth: '400px',
                                            border: '1px solid #e0e0e0'
                                        }}>
                                            {/* Header */}
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    📊 Detalles del Evento
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => setSelectedEvent(null)}
                                                    sx={{ 
                                                        minWidth: 'auto', 
                                                        p: 0.5,
                                                        fontSize: '0.8rem',
                                                        color: 'text.secondary',
                                                        '&:hover': { bgcolor: 'grey.100' }
                                                    }}
                                                >
                                                    ✕
                                                </Button>
                                            </Box>

                                            {/* Información básica del evento */}
                                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                                                    🔍 Información del Evento
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    <strong>Tipo:</strong> {selectedEvent.type || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    <strong>Severidad:</strong> 
                                                    <span style={{ 
                                                        marginLeft: 4,
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: selectedEvent.severity?.toLowerCase().includes('critic') ? '#fee2e2' :
                                                                        selectedEvent.severity?.toLowerCase().includes('grave') ? '#fee2e2' :
                                                                        selectedEvent.severity?.toLowerCase().includes('moder') ? '#fef3c7' : '#d1fae5',
                                                        color: selectedEvent.severity?.toLowerCase().includes('critic') ? '#b91c1c' :
                                                               selectedEvent.severity?.toLowerCase().includes('grave') ? '#b91c1c' :
                                                               selectedEvent.severity?.toLowerCase().includes('moder') ? '#a16207' : '#065f46'
                                                    }}>
                                                        {selectedEvent.severity || 'N/A'}
                                                    </span>
                                                </Typography>
                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                    <strong>Fecha:</strong> {new Date(selectedEvent.timestamp).toLocaleString()}
                                                </Typography>
                                                {selectedEvent.speed && (
                                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <strong>Velocidad:</strong> {selectedEvent.speed} km/h
                                                    </Typography>
                                                )}
                                                {selectedEvent.rotativoState !== undefined && (
                                                    <Typography variant="body2">
                                                        <strong>Rotativo:</strong> 
                                                        <span style={{ 
                                                            marginLeft: 4,
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            backgroundColor: selectedEvent.rotativoState ? '#d1fae5' : '#fee2e2',
                                                            color: selectedEvent.rotativoState ? '#065f46' : '#b91c1c'
                                                        }}>
                                                            {selectedEvent.rotativoState ? 'Encendido' : 'Apagado'}
                                                        </span>
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Métricas técnicas */}
                                            {(selectedEvent.details || selectedEvent.metrics) && (
                                                <Box sx={{ mb: 3, p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                                        📈 Métricas Técnicas
                                                    </Typography>
                                                    {selectedEvent.details && typeof selectedEvent.details === 'object' && (
                                                        <>
                                                            {selectedEvent.details.ltr !== undefined && (
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <strong>LTR:</strong> {selectedEvent.details.ltr.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                            {selectedEvent.details.ssf !== undefined && (
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <strong>SSF:</strong> {selectedEvent.details.ssf.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                            {selectedEvent.details.drs !== undefined && (
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <strong>DRS:</strong> {selectedEvent.details.drs.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}
                                                    {selectedEvent.metrics && typeof selectedEvent.metrics === 'object' && (
                                                        <>
                                                            {selectedEvent.metrics.ltr !== undefined && (
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <strong>LTR:</strong> {selectedEvent.metrics.ltr.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                            {selectedEvent.metrics.ssf !== undefined && (
                                                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                    <strong>SSF:</strong> {selectedEvent.metrics.ssf.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                            {selectedEvent.metrics.drs !== undefined && (
                                                                <Typography variant="body2">
                                                                    <strong>DRS:</strong> {selectedEvent.metrics.drs.toFixed(3)}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Indicador LED */}
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                                                    🔴 Indicador LED del Dispositivo
                                                </Typography>
                                                <LEDIndicator
                                                    stabilityPercentage={stabilityPercentage}
                                                    size="medium"
                                                    showAcousticInfo={true}
                                                    showLabels={true}
                                                />
                                            </Box>

                                            {/* Coordenadas */}
                                            {selectedEvent.lat && selectedEvent.lng && (
                                                <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'center' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        📍 {selectedEvent.lat.toFixed(6)}, {selectedEvent.lng.toFixed(6)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Box sx={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: 2,
                                    color: 'text.secondary'
                                }}>
                                    <Route sx={{ fontSize: 64 }} />
                                    <Typography variant="h6">
                                        {sessions.length > 0 ? 'Selecciona una sesión' : 'No hay sesiones disponibles'}
                                    </Typography>
                                    <Typography variant="body2" textAlign="center">
                                        {sessions.length > 0
                                            ? 'Elige un vehículo y una sesión para ver la ruta en el mapa'
                                            : 'No se encontraron sesiones para mostrar en el mapa'
                                        }
                                    </Typography>
                                    {sessions.length > 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                            {sessions.length} sesiones disponibles
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Panel lateral: Ranking + Playback */}
                <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* Playback con LEDs */}
                    {routeData && routeData.route.length > 0 && (
                        <RoutePlaybackWithLEDs
                            route={routeData.route}
                            events={routeData.events.map(event => ({
                                ...event,
                                timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp
                            }))}
                            className="flex-shrink-0"
                        />
                    )}

                    {/* Panel de Ranking */}
                    <Card sx={{ flex: 1, boxShadow: 1 }}>
                        <CardContent sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 'bold' }}>
                                🏆 Ranking de Sesiones
                            </Typography>

                            {/* Selector de métrica */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                                    Ordenar por:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {[
                                        { value: 'events', label: 'Eventos' },
                                        { value: 'distance', label: 'Distancia' },
                                        { value: 'duration', label: 'Duración' },
                                        { value: 'speed', label: 'Velocidad' }
                                    ].map((metric) => (
                                        <button
                                            key={metric.value}
                                            onClick={() => setRankingMetric(metric.value as any)}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: rankingMetric === metric.value ? '#3B82F6' : '#F1F5F9',
                                                color: rankingMetric === metric.value ? 'white' : '#64748B',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {metric.label}
                                        </button>
                                    ))}
                                </Box>
                            </Box>

                            {/* Lista de ranking */}
                            {loadingRanking ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <LinearProgress sx={{ width: '100%' }} />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {ranking.map((session) => (
                                        <Box
                                            key={session.sessionId}
                                            onClick={() => {
                                                setSelectedVehicleId(session.vehicleId);
                                                setSelectedSessionId(session.sessionId);
                                            }}
                                            sx={{
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                p: 1.5,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                backgroundColor: selectedSessionId === session.sessionId ? '#EFF6FF' : 'white',
                                                '&:hover': {
                                                    backgroundColor: '#F8FAFC',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'start', gap: 1.5 }}>
                                                {/* Ranking número */}
                                                <Typography
                                                    sx={{
                                                        fontSize: '1.5rem',
                                                        fontWeight: 'bold',
                                                        color: session.rank === 1 ? '#EAB308' :
                                                            session.rank === 2 ? '#94A3B8' :
                                                                session.rank === 3 ? '#D97706' :
                                                                    '#64748B',
                                                        minWidth: '30px'
                                                    }}
                                                >
                                                    {session.rank}
                                                </Typography>

                                                {/* Info de la sesión */}
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                                        {session.vehicleName}
                                                    </Typography>

                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                                        {new Date(session.startTime).toLocaleDateString('es-ES')}
                                                    </Typography>

                                                    {/* Métricas */}
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                        <span>Total eventos:</span>
                                                        <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{session.totalEvents}</span>
                                                    </Box>

                                                    {rankingMetric === 'distance' && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            <span>Distancia:</span>
                                                            <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{session.distance} km</span>
                                                        </Box>
                                                    )}

                                                    {rankingMetric === 'duration' && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            <span>Duración:</span>
                                                            <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{session.duration}</span>
                                                        </Box>
                                                    )}

                                                    {rankingMetric === 'speed' && (
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                            <span>Vel. promedio:</span>
                                                            <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{session.avgSpeed} km/h</span>
                                                        </Box>
                                                    )}

                                                    {/* Eventos por severidad */}
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                                        {session.grave > 0 && (
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: '#FEE2E2',
                                                                color: '#B91C1C',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem'
                                                            }}>
                                                                🔴 {session.grave}
                                                            </span>
                                                        )}
                                                        {session.moderada > 0 && (
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: '#FED7AA',
                                                                color: '#C2410C',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem'
                                                            }}>
                                                                🟠 {session.moderada}
                                                            </span>
                                                        )}
                                                        {session.leve > 0 && (
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: '#FEF3C7',
                                                                color: '#A16207',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem'
                                                            }}>
                                                                🟡 {session.leve}
                                                            </span>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}

                                    {ranking.length === 0 && !loadingRanking && (
                                        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>
                                            No hay sesiones disponibles
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};