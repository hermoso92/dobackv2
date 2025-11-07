import {
import { logger } from '../../utils/logger';
    Route
} from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useTelemetryData } from '../../hooks/useTelemetryData';
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

export const SessionsAndRoutesView: React.FC = () => {
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
        };
    } | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    // Obtener sesiones reales
    const { data: sessionsData, isLoading: sessionsLoading } = useSessions({
        vehicleId: selectedVehicleId || undefined
    });

    // Procesar datos de sesiones
    useEffect(() => {
        if (sessionsData && Array.isArray(sessionsData)) {
            logger.info('🔍 SessionsAndRoutesView: procesando', sessionsData.length, 'sesiones');
            logger.info('📊 Primera sesión:', sessionsData[0]);

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

            logger.info('✅ Sesiones procesadas:', processedSessions.length);
            logger.info('📊 Primera sesión procesada:', processedSessions[0]);
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
                logger.info('🔄 Sincronizando sesión seleccionada:', foundSession);
                setSelectedSession(foundSession);
            }
        } else if (!selectedSessionId && selectedSession) {
            logger.info('🧹 Limpiando sesión seleccionada');
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
                logger.info('🗺️ Cargando datos de ruta para sesión:', selectedSessionId);
                const response = await fetch(`/api/session-route/${selectedSessionId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        logger.info('✅ Datos de ruta cargados:', data.data);
                        setRouteData(data.data);
                    } else {
                        logger.warn('⚠️ No se pudieron cargar los datos de la ruta');
                        setRouteData(null);
                    }
                } else {
                    logger.error('❌ Error cargando datos de ruta:', response.status);
                    setRouteData(null);
                }
            } catch (error) {
                logger.error('❌ Error cargando datos de ruta:', error);
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

    logger.info('🔍 SessionsAndRoutesView render:', {
        sessions: sessions.length,
        selectedVehicleId,
        selectedSessionId,
        selectedSession: !!selectedSession,
        sessionsData: sessionsData?.length,
        availableSessionIds: sessions.map(s => s.id),
        selectedSessionFound: sessions.find(s => s.id === selectedSessionId)
    });

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

            {/* Mapa con ruta y eventos */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Card sx={{ height: '100%', boxShadow: 1 }}>
                    <CardContent sx={{ height: '100%', p: 0 }}>
                        {(selectedSession || (selectedSessionId && sessions.length > 0)) ? (
                            <Box sx={{ height: '100%', position: 'relative' }}>
                                <Typography variant="h6" sx={{ p: 1, pb: 0.5, fontSize: '1rem' }}>
                                    Ruta de {selectedSession?.vehicleName || 'Sesión seleccionada'}
                                </Typography>

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
                                            {logger.info('🗺️ Renderizando mapa con datos:', {
                                                routePoints: routeData.route.length,
                                                events: routeData.events.length,
                                                center: routeData.route.length > 0 && routeData.route[0] ? [routeData.route[0].lat, routeData.route[0].lng] : [40.4168, -3.7038]
                                            })}
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
                                        {routeData.stats.skippedJumps > 0 && (
                                            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 'bold' }}>
                                                🚫 Saltos GPS filtrados: {routeData.stats.skippedJumps}
                                            </Typography>
                                        )}
                                        {routeData.stats.maxDistanceBetweenPoints && (
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
                                        {routeData.stats.skippedJumps > 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{
                                                display: 'block',
                                                mt: 1,
                                                fontSize: '0.7rem',
                                                fontStyle: 'italic'
                                            }}>
                                                ℹ️ Los puntos GPS con saltos &gt;{routeData.stats.maxDistanceBetweenPoints}m fueron filtrados para mostrar una ruta realista
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
        </Box>
    );
};