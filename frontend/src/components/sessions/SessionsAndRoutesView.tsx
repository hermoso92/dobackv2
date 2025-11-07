import {
    Route
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    LinearProgress,
    Typography
} from '@mui/material';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';
import { SESSION_ENDPOINTS } from '../../config/api';
import { getOrganizationId } from '../../config/organization';
import { useAuth } from '../../hooks/useAuth';
import { usePDFExport } from '../../hooks/usePDFExport';
import { useTelemetryData } from '../../hooks/useTelemetryData';
import { apiService } from '../../services/api';
import { geocodingService } from '../../services/geocodingService';
import { logger } from '../../utils/logger';
import RouteMapComponent from '../maps/RouteMapComponent';
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

// Exportar función de exportación para uso desde el dashboard
export const useRouteExportFunction = () => {
    const { exportRouteReport, captureElementEnhanced } = usePDFExport();

    return useCallback(async (selectedSession: any, routeData: any) => {
        if (!selectedSession || !routeData) {
            logger.warn('No hay sesión o ruta seleccionada para exportar');
            return;
        }

        try {
            logger.info('Iniciando exportación de recorrido', { sessionId: selectedSession.id });

            // Capturar mapa usando html2canvas directamente sin modificar el DOM
            const mapElement = document.querySelector('.leaflet-container');
            let mapImage: string | null = null;

            if (mapElement) {
                try {
                    // Importar html2canvas dinámicamente
                    const html2canvas = (await import('html2canvas')).default;

                    // Esperar a que el mapa esté completamente renderizado
                    // Verificar que el mapa tenga contenido antes de capturar
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts) {
                        // Verificar que el mapa tenga tiles cargados
                        const mapTiles = mapElement.querySelectorAll('.leaflet-tile');
                        const routeLine = mapElement.querySelector('.leaflet-interactive');

                        if (mapTiles.length > 0 && routeLine) {
                            logger.info('Mapa completamente renderizado', {
                                tiles: mapTiles.length,
                                hasRoute: !!routeLine,
                                attempt: attempts + 1
                            });
                            break;
                        }

                        logger.info(`Esperando renderizado del mapa... intento ${attempts + 1}/${maxAttempts}`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        attempts++;
                    }

                    // Esperar un poco más para asegurar que todo esté estable
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Capturar el mapa directamente con html2canvas con configuración optimizada
                    const canvas = await html2canvas(mapElement as HTMLElement, {
                        scale: 2, // Reducir escala para mejor rendimiento
                        useCORS: true,
                        allowTaint: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        width: mapElement.clientWidth,
                        height: mapElement.clientHeight,
                        scrollX: 0,
                        scrollY: 0,
                        windowWidth: mapElement.clientWidth,
                        windowHeight: mapElement.clientHeight,
                        ignoreElements: (element) => {
                            // Ignorar elementos que pueden causar problemas
                            return element.classList.contains('leaflet-control') ||
                                element.classList.contains('leaflet-popup');
                        }
                    });

                    mapImage = canvas.toDataURL('image/png');
                    logger.info('Mapa capturado exitosamente');
                } catch (error) {
                    logger.warn('Error capturando mapa', { error });
                }
            }

            // Preparar eventos con geocodificación usando el servicio backend (TODOS los eventos)
            logger.info('Preparando eventos para exportación con geocodificación...', { totalEvents: routeData.events.length });

            // Procesar eventos en lotes para evitar sobrecarga
            const batchSize = 10;
            const eventsWithLocations = [];

            for (let i = 0; i < routeData.events.length; i += batchSize) {
                const batch = routeData.events.slice(i, i + batchSize);
                logger.info(`Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(routeData.events.length / batchSize)}`, {
                    batchStart: i,
                    batchEnd: i + batch.length
                });

                const batchResults = await Promise.all(
                    batch.map(async (event: any) => {
                        try {
                            // Usar el servicio de geocodificación que funciona a través del backend
                            const location = await geocodingService.reverseGeocode(event.lat, event.lng);

                            // Mapear severidad (soporta múltiples formatos del backend)
                            const severityLower = (event.severity || '').toLowerCase();
                            let mappedSeverity = 'leve';
                            if (severityLower === 'grave' || severityLower === 'high' || severityLower === 'critical') {
                                mappedSeverity = 'grave';
                            } else if (severityLower === 'moderada' || severityLower === 'medium') {
                                mappedSeverity = 'moderada';
                            } else if (severityLower === 'leve' || severityLower === 'low') {
                                mappedSeverity = 'leve';
                            }

                            return {
                                id: event.id,
                                lat: event.lat,
                                lng: event.lng,
                                location: location,
                                type: event.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Evento',
                                severity: mappedSeverity,
                                timestamp: new Date(event.timestamp)
                            };
                        } catch (error) {
                            logger.warn('Error geocodificando evento', { error, event });

                            // Mapear severidad (soporta múltiples formatos del backend)
                            const severityLower = (event.severity || '').toLowerCase();
                            let mappedSeverity = 'leve';
                            if (severityLower === 'grave' || severityLower === 'high' || severityLower === 'critical') {
                                mappedSeverity = 'grave';
                            } else if (severityLower === 'moderada' || severityLower === 'medium') {
                                mappedSeverity = 'moderada';
                            } else if (severityLower === 'leve' || severityLower === 'low') {
                                mappedSeverity = 'leve';
                            }

                            return {
                                id: event.id,
                                lat: event.lat,
                                lng: event.lng,
                                location: `${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}`,
                                type: event.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Evento',
                                severity: mappedSeverity,
                                timestamp: new Date(event.timestamp)
                            };
                        }
                    })
                );

                eventsWithLocations.push(...batchResults);

                // Pequeña pausa entre lotes para no sobrecargar el servicio
                if (i + batchSize < routeData.events.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            logger.info('Geocodificación completada', { processedEvents: eventsWithLocations.length });

            // Preparar datos para el PDF con nombres reales y formato correcto
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
    }, [captureElementEnhanced, exportRouteReport]);
};

interface SessionsAndRoutesViewProps {
    onSessionDataChange?: (session: any, routeData: any) => void;
}

export const SessionsAndRoutesView: React.FC<SessionsAndRoutesViewProps> = ({ onSessionDataChange }) => {
    const { user } = useAuth();
    const { useSessions } = useTelemetryData();
    const exportFunction = useRouteExportFunction();  // ✅ Usar función de exportar

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
            logger.info('Cargando datos de ruta', { selectedSessionId });
            try {
                const data = await apiService.get<any>(`/api/session-route/${selectedSessionId}`);
                logger.info('Respuesta del endpoint session-route', { data });
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
                    logger.info('Datos de ruta cargados exitosamente', {
                        routePoints: formattedData.route.length,
                        events: formattedData.events.length,
                        stats: formattedData.stats
                    });
                } else {
                    logger.warn('Respuesta del endpoint sin datos válidos', { data });
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

    // Notificar cambios en los datos de la sesión al componente padre
    useEffect(() => {
        if (selectedSession && routeData && onSessionDataChange) {
            onSessionDataChange(selectedSession, routeData);
        }
    }, [selectedSession, routeData, onSessionDataChange]);


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
        <Box sx={{ p: 1, height: '100vh', display: 'flex', flexDirection: 'column' }} id="sesiones-tab-content">
            {/* Barra superior con selectores y botón exportar */}
            <Box sx={{ mb: 1, flexShrink: 0, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ flex: 1 }}>
                    <VehicleSessionSelector
                        selectedVehicleId={selectedVehicleId}
                        selectedSessionId={selectedSessionId}
                        onVehicleChange={setSelectedVehicleId}
                        onSessionChange={setSelectedSessionId}
                        showSessionSelector={true}
                    />
                </Box>
                {/* Botón Exportar PDF */}
                {selectedSession && routeData && (
                    <button
                        onClick={() => exportFunction(selectedSession, routeData)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                        Exportar Recorrido PDF
                    </button>
                )}
            </Box>

            {/* Grid: Mapa + Ranking */}
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
                                                    Cargando ruta... Session: {selectedSessionId}
                                                </Typography>
                                            </Box>
                                        ) : routeData ? (
                                            <>
                                                <RouteMapComponent
                                                    key={`route-map-${selectedSessionId}`}
                                                    center={routeData.route.length > 0 && routeData.route[0] ?
                                                        [routeData.route[0].lat, routeData.route[0].lng] :
                                                        [40.4168, -3.7038]
                                                    }
                                                    zoom={13}
                                                    height="100%"
                                                    route={routeData.route}
                                                    events={routeData.events}
                                                    vehicleName={routeData.session.vehicleName}
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

                {/* Panel de Ranking */}
                <Box sx={{ height: '100%', overflow: 'auto' }}>
                    <Card sx={{ height: '100%', boxShadow: 1 }}>
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