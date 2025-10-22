import { PictureAsPdf as PictureAsPdfIcon } from '@mui/icons-material';
import { Box, Fab, Box as MuiBox, Stack, Tooltip, Typography } from '@mui/material';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { divIcon, Icon, latLngBounds, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { EVENT_CONFIG, GEO_CONFIG, UI_CONFIG } from '../config/constants';
import { StabilityIndexEvent } from '../hooks/useStabilityIndexEvents';
import { t } from "../i18n";
import { TelemetryData } from '../types/telemetry';
import { VehicleLocation } from '../types/vehicle';
import { logger } from '../utils/logger';
import MapLegend from './MapLegend';

// Definir interface EventCluster localmente para evitar dependencia circular
interface EventCluster {
    id: string;
    lat: number;
    lon: number;
    count: number;
    events: StabilityIndexEvent[];
    center: { lat: number; lon: number };
    severity: string;
    eventCount: number;
    radius: number;
    primaryType: string;
}

// Función para obtener ruta real usando TomTom Routing API
const getRealRoute = async (points: [number, number][]): Promise<[number, number][]> => {
    if (points.length < 2) return points;

    try {
        const tomtomKey = 'u8wN3BM4AMzDGGC76lLF14vHblDP37HG';
        const waypoints = points.map(([lat, lon]) => `${lat},${lon}`).join(':');
        const url = `https://api.tomtom.com/routing/1/calculateRoute/${waypoints}/json?key=${tomtomKey}&routeType=fastest&traffic=true&travelMode=car`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes[0] && data.routes[0].legs) {
            const routePoints: [number, number][] = [];
            data.routes[0].legs.forEach((leg: any) => {
                if (leg.points) {
                    leg.points.forEach((point: any) => {
                        routePoints.push([point.latitude, point.longitude]);
                    });
                }
            });
            return routePoints;
        }
    } catch (error) {
        logger.warn('Error obteniendo ruta real de TomTom:', error);
    }

    // Fallback: devolver puntos originales si falla la API
    return points;
};

// Configuración del icono por defecto de Leaflet
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icono marcador rojo para el vehículo seleccionado (misma forma que el azul por defecto)
const selectedVehicleIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Función para obtener el color del evento
const getEventColor = (tipos: string[], level?: string): string => {
    // Primero verificar el nivel del evento
    if (level) {
        const lc = level.toLowerCase();
        if (lc === 'critical' || lc === 'critico') return '#E53935'; // Rojo
        if (lc === 'danger' || lc === 'peligroso') return '#FFA000'; // Naranja
        if (lc === 'moderate' || lc === 'moderado') return '#FFEB3B'; // Amarillo
    }

    // Si no hay nivel, buscar en tipos
    const lc = tipos.map(t => t.trim().toLowerCase());

    // Buscar colores específicos para los nuevos tipos de eventos
    for (const tipo of lc) {
        const colorKey = tipo as keyof typeof EVENT_CONFIG.COLORS;
        if (colorKey in EVENT_CONFIG.COLORS) {
            return EVENT_CONFIG.COLORS[colorKey];
        }
    }

    return EVENT_CONFIG.COLORS.default;
};

// Función para formatear los valores del evento
const formatEventValues = (valores: Record<string, number>): string => {
    const labels: Record<string, string> = {
        si: 'Índice de estabilidad',
        roll: 'Ángulo de balanceo (°)',
        ay: 'Aceleración lateral (m/s²)',
        yaw: 'Velocidad de guiñada (rad/s)'
    };

    return Object.entries(valores)
        .map(([key, value]) => {
            const label = labels[key] || key;
            let formattedValue: string;

            // Validar y formatear valores según el tipo
            if (key === 'si') {
                formattedValue = `${(value * 100).toFixed(0)}%`;
            } else if (key === 'roll') {
                // Limitar ángulo de balanceo a valores razonables
                const validValue = Math.abs(value) > 180 ? (value % 360) : value;
                formattedValue = validValue.toFixed(2);
            } else if (key === 'ay') {
                // Limitar aceleración lateral a valores razonables (máximo 10g)
                const validValue = Math.abs(value) > 100 ? (value > 0 ? 100 : -100) : value;
                formattedValue = validValue.toFixed(2);
            } else if (key === 'yaw') {
                // Limitar velocidad de guiñada a valores razonables
                const validValue = Math.abs(value) > 10 ? (value > 0 ? 10 : -10) : value;
                formattedValue = validValue.toFixed(2);
            } else {
                formattedValue = value.toFixed(2);
            }

            return `${label}: ${formattedValue}`;
        })
        .join('<br/>');
};

interface GPSMapProps {
    vehicleLocations: VehicleLocation[];
    center: [number, number];
    zoom: number;
    telemetryData: TelemetryData[];
    stabilityEvents: StabilityIndexEvent[];
    selectedSession?: {
        id: string;
        gpsData: {
            timestamp: string;
            latitude: number;
            longitude: number;
            altitude: number;
            speed: number;
            heading: number;
            satellites: number;
            accuracy: number;
        }[];
    } | null;
    stabilityData?: import('../types/stability').StabilityDataPoint[];
    onVehicleClick?: (vehicle: VehicleLocation) => void;
    /** Id of the event currently selected externally (e.g. from timeline panel) */
    selectedEventId?: string | null;
    /** Callback invoked when user clicks a stability event marker */
    onEventSelect?: (eventId: string) => void;
    selectedVehicleId?: string | null;
    // Props para clustering
    clusters?: EventCluster[];
    showClusters?: boolean;
    onClusterClick?: (cluster: EventCluster) => void;
    /** Callback para generar reporte PDF profesional */
    onGeneratePDF?: () => void;
    zones?: any[];
}

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);

    return null;
};

// Componente para mostrar la información del evento en el popup
const EventPopup: React.FC<{ evt: StabilityIndexEvent; nearest?: TelemetryData; fallbackDesc: string }> = ({ evt, nearest, fallbackDesc }) => {
    const stabilityPairs = Object.entries(evt.valores || {}).filter(([k]) => k === 'si');
    const isOverspeed = evt.tipos.includes('limite_superado_velocidad');

    const varLabels: Record<string, string> = {
        si: 'Índice de estabilidad',
        roll: 'Ángulo de balanceo (°)',
        ay: 'Aceleración lateral (m/s²)',
        yaw: 'Velocidad de guiñada (rad/s)'
    };

    const formatValue = (k: string, v: number) => {
        if (k === 'si') return `${(v * 100).toFixed(0)} %`;
        return v.toFixed(2);
    };

    const cacheKey = React.useMemo(() => `geo_${evt.lat.toFixed(5)}_${evt.lon.toFixed(5)}`, [evt.lat, evt.lon]);
    const [street, setStreet] = React.useState<string | null>(() => {
        // 1) Si viene en nearest, úsalo
        const raw = (nearest as any)?.street;
        if (raw) return raw.split(',').slice(0, 2).join(',').trim();
        // 2) Si está en localStorage, úsalo
        const cached = localStorage.getItem(cacheKey);
        return cached ?? null;
    });

    React.useEffect(() => {
        if (street) return;

        let cancelled = false;
        let timeoutId: NodeJS.Timeout;
        const lat = evt.lat;
        const lon = evt.lon;

        // Rate limiting básico: delay aleatorio para evitar saturar la API
        const delay = Math.random() * GEO_CONFIG.GEOCODING.RATE_LIMIT_DELAY;

        const fetchAddress = async () => {
            timeoutId = setTimeout(async () => {
                if (cancelled) return;

                try {
                    const controller = new AbortController();
                    const fetchTimeoutId = setTimeout(() => controller.abort(), GEO_CONFIG.GEOCODING.TIMEOUT);

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                        {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': GEO_CONFIG.GEOCODING.USER_AGENT
                            }
                        }
                    );

                    clearTimeout(fetchTimeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();

                    if (cancelled) return;

                    const raw = data.display_name || data.address?.road || '';
                    const short = raw.split(',').slice(0, 2).join(',').trim();
                    if (short) {
                        localStorage.setItem(cacheKey, short);
                        setStreet(short);
                    }
                } catch (error) {
                    // En caso de error, no hacer nada (no mostrar dirección)
                    if (!cancelled) {
                        localStorage.setItem(cacheKey, ''); // Marcar como fallido para no reintentar
                    }
                }
            }, delay);
        };

        fetchAddress();

        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cacheKey, street]);

    // Obtener el nivel de severidad del evento
    const severityLevel = evt.level || 'moderate';
    const severityText = t(severityLevel);

    // Obtener el tipo de evento principal (excluyendo niveles de severidad y causas genéricas)
    const specificEventTypes = evt.tipos.filter(t =>
        !['sin_causa_clara', 'pendiente_lateral', 'curva_brusca', 'maniobra_brusca', 'terreno_irregular', 'perdida_adherencia', 'critical', 'danger', 'moderate', 'moderado'].includes(t)
    );

    // Si no hay tipos específicos, usar el primero que no sea un nivel de severidad
    const nonSeverityTypes = evt.tipos.filter(t => !['critical', 'danger', 'moderate', 'moderado'].includes(t));
    const primaryEventType = specificEventTypes.length > 0 ? specificEventTypes[0] : (nonSeverityTypes.length > 0 ? nonSeverityTypes[0] : 'sin_causa_clara');

    // Función para formatear texto
    const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <MuiBox sx={{ fontSize: '0.75rem', lineHeight: 1.2, width: '100%', maxWidth: 420 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Typography component="span" sx={{ fontSize: '1rem' }}>⚠️</Typography>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: severityLevel === 'critical' ? 'error.main' : severityLevel === 'danger' ? 'warning.main' : 'info.main' }}>
                        Evento {severityText} - {t(primaryEventType)}
                    </Typography>
                </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                {new Date(evt.timestamp).toLocaleString()}
            </Typography>
            {street && (
                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    📍 {street}
                </Typography>
            )}
            {/* Mostrar porcentaje de estabilidad */}
            {evt.perc !== undefined && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Índice de Estabilidad: {evt.perc}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                        {evt.perc < 10 ? '🔴 Riesgo crítico de vuelco' :
                            evt.perc < 30 ? '🟠 Riesgo alto de vuelco' :
                                evt.perc < 50 ? '🟡 Riesgo moderado de vuelco' :
                                    '✅ Estabilidad aceptable'}
                    </Typography>
                </Box>
            )}


            {/* Mostrar datos CAN si están disponibles */}
            {evt.can && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Datos del vehículo:</Typography>
                    <Typography variant="caption" display="block">
                        Velocidad: {evt.can.vehicleSpeed > 0 ? `${evt.can.vehicleSpeed.toFixed(1)} km/h` : 'No disponible'}
                    </Typography>
                    {/* Mostrar RPM solo si está disponible y es > 0 */}
                    {typeof evt.can.engineRPM === 'number' && evt.can.engineRPM > 0 && (
                        <Typography variant="caption" display="block">
                            RPM: {evt.can.engineRPM.toFixed(0)}
                        </Typography>
                    )}
                    {/* Mostrar Rotativo solo si está definido */}
                    {typeof evt.can.rotativo === 'boolean' && (
                        <Typography variant="caption" display="block">
                            Rotativo: {evt.can.rotativo ? 'Encendido' : 'Apagado'}
                        </Typography>
                    )}
                </Box>
            )}

            {isOverspeed && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                    ⚠️ Exceso de velocidad detectado
                </Typography>
            )}
        </MuiBox>
    );
};

// Componente para mostrar estadísticas de filtrado
const FilteringStats: React.FC<{
    originalCount: number;
    filteredCount: number;
    showStats: boolean;
}> = ({ originalCount, filteredCount, showStats }) => {
    if (!showStats || originalCount === filteredCount) return null;

    const filteredOut = originalCount - filteredCount;
    const percentage = ((filteredOut / originalCount) * 100).toFixed(1);

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: 1,
                borderRadius: 1,
                fontSize: '0.75rem',
                zIndex: 1000,
                border: '1px solid #ddd'
            }}
        >
            <Typography variant="caption" color="text.secondary">
                Puntos filtrados: {filteredOut} de {originalCount} ({percentage}%)
            </Typography>
        </Box>
    );
};

export const GPSMap: React.FC<GPSMapProps> = ({
    vehicleLocations,
    center,
    zoom,
    telemetryData,
    stabilityEvents,
    selectedSession,
    stabilityData = [],
    onVehicleClick,
    selectedEventId,
    onEventSelect,
    selectedVehicleId = null,
    clusters,
    showClusters,
    onClusterClick,
    onGeneratePDF,
    zones = [],
}) => {
    // Debug logs removed for performance

    const mapRef = useRef<LeafletMap | null>(null);
    const markerRefs = useRef<Record<string, LeafletMarker>>({});

    // Estado para ruta real
    const [realRoutePoints, setRealRoutePoints] = React.useState<[number, number][]>([]);
    const [isLoadingRoute, setIsLoadingRoute] = React.useState(false);

    // Calcular puntos y segmentos de la ruta (antes de cualquier hook que los use)
    const [routePoints, routeSegments] = React.useMemo(() => {
        let points: [number, number][] = [];
        let segments: { positions: [[number, number], [number, number]], color: string }[] = [];

        // Crear un tipo unificado para los datos GPS
        type GPSPoint = {
            timestamp: string;
            latitude: number;
            longitude: number;
            altitude?: number;
            speed?: number;
            heading?: number;
            satellites?: number;
            accuracy?: number;
        };

        // Usar selectedSession.gpsData si está disponible y tiene puntos
        let gps: GPSPoint[] = (selectedSession?.gpsData && selectedSession.gpsData.length > 0)
            ? selectedSession.gpsData.filter(p => {
                return !isNaN(p.latitude) && !isNaN(p.longitude) &&
                    p.latitude >= -90 && p.latitude <= 90 &&
                    p.longitude >= -180 && p.longitude <= 180;
            })
            : telemetryData.filter(p => {
                return !isNaN(p.latitude) && !isNaN(p.longitude) &&
                    p.latitude >= -90 && p.latitude <= 90 &&
                    p.longitude >= -180 && p.longitude <= 180;
            });
        // Corrección de coordenadas corruptas
        gps = gps.map(point => {
            let { latitude, longitude } = point;
            if (latitude > 0 && latitude < 1 && latitude.toString().startsWith('0.')) {
                latitude = parseFloat('40' + latitude.toString().substring(1));
            }
            if (latitude > 4 && latitude < 5 && !latitude.toString().startsWith('40.')) {
                latitude = parseFloat('40' + latitude.toString().substring(1));
            }
            if (longitude < 0 && longitude > -1 && longitude.toString().startsWith('-0.')) {
                longitude = parseFloat(longitude.toString().replace('-0.', '-3.'));
            }
            if (longitude < -1000 || longitude > 1000) {
                longitude = -3.8840388;
            }
            return {
                ...point,
                latitude,
                longitude
            };
        });
        // Ordenar por timestamp
        gps = gps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        // Filtrado fiel: saltos y velocidad absurda
        const filteredGps: GPSPoint[] = [];
        let lastValid: GPSPoint | null = null;
        let bigJumps = 0;
        for (let i = 0; i < gps.length; i++) {
            const point = gps[i];
            if (!lastValid) {
                filteredGps.push(point);
                lastValid = point;
                continue;
            }
            const t1 = new Date(lastValid.timestamp).getTime();
            const t2 = new Date(point.timestamp).getTime();
            const dt = (t2 - t1) / 1000; // segundos
            // Haversine
            const R = 6371000;
            const lat1 = lastValid.latitude * Math.PI / 180;
            const lat2 = point.latitude * Math.PI / 180;
            const dLat = (point.latitude - lastValid.latitude) * Math.PI / 180;
            const dLon = (point.longitude - lastValid.longitude) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dist = R * c; // metros
            const speed = dt > 0 ? (dist / dt) * 3.6 : 0; // km/h
            let valid = true;
            if (dist > 2000) {
                valid = false;
                bigJumps++;
            } else if (dist > 500 && dt < 10) {
                valid = false;
                bigJumps++;
            } else if (speed > 200) {
                valid = false;
                bigJumps++;
            }
            if (valid) {
                filteredGps.push(point);
                lastValid = point;
            }
        }

        // Downsampling uniforme para máximo 2000 puntos
        const MAX_POINTS = 2000;
        let downsampledGps = filteredGps;
        if (filteredGps.length > MAX_POINTS) {
            const step = Math.ceil(filteredGps.length / MAX_POINTS);
            downsampledGps = filteredGps.filter((_, idx) => idx % step === 0);
        }

        // Simplificar la lógica: usar todos los puntos válidos sin filtros adicionales
        if (downsampledGps.length > 0) {
            points = downsampledGps.map(point => [point.latitude, point.longitude] as [number, number]);
        }

        // Por ahora no usamos segmentos coloreados, solo una línea continua
        segments = [];

        return [points, segments];
    }, [selectedSession, telemetryData, stabilityData]);

    // Componente interno para capturar la instancia de Leaflet Map una vez que el MapContainer esté listo
    const MapSetter: React.FC = () => {
        const map = useMap();
        useEffect(() => {
            mapRef.current = map as LeafletMap;
        }, [map]);
        return null;
    };

    useEffect(() => {
        if (stabilityEvents.length > 0) {
            logger.debug('GPSMap renderizado:', {
                vehicleCount: vehicleLocations.length,
                stabilityEventsCount: stabilityEvents.length,
                selectedSessionGPSPoints: selectedSession?.gpsData?.length || 0
            });
        }
    }, [vehicleLocations.length, stabilityEvents.length, selectedSession?.gpsData?.length]);

    // Route rendering debug log removed

    // Cuando cambie la selección externa de evento, centra el mapa y abre el popup correspondiente
    useEffect(() => {
        if (!selectedEventId) return;
        const marker = markerRefs.current[selectedEventId];
        if (marker && mapRef.current) {
            try {
                const ll = marker.getLatLng();
                const z = mapRef.current.getZoom();
                mapRef.current.setView(ll, Math.max(z - 1, 3), { animate: true });
                marker.openPopup();
            } catch (error) {
                logger.debug('Error al centrar mapa en evento seleccionado:', error);
            }
        }
    }, [selectedEventId]);

    // Bounds completos de la ruta para re-enfoque
    const routeBounds: LatLngBounds | null = React.useMemo(() => {
        return routePoints.length ? latLngBounds(routePoints as any) : null;
    }, [routePoints]);

    // Obtener ruta real cuando cambien los puntos GPS
    React.useEffect(() => {
        if (routePoints.length > 1) {
            setIsLoadingRoute(true);
            getRealRoute(routePoints)
                .then(realRoute => {
                    setRealRoutePoints(realRoute);
                    logger.info(`🗺️ Ruta real obtenida: ${realRoute.length} puntos`);
                })
                .catch(error => {
                    logger.warn('Error obteniendo ruta real:', error);
                    setRealRoutePoints(routePoints); // Fallback a puntos originales
                })
                .finally(() => {
                    setIsLoadingRoute(false);
                });
        } else {
            setRealRoutePoints([]);
        }
    }, [routePoints]);

    const adjustPan = (lat: number, lon: number) => {
        const map = mapRef.current;
        if (!map) return;

        try {
            const margin = 50; // px
            const cSize = map.getSize();
            const pt = map.latLngToContainerPoint([lat, lon]);
            let dx = 0, dy = 0;
            if (pt.x < margin) dx = pt.x - margin;
            else if (pt.x > cSize.x - margin) dx = pt.x - (cSize.x - margin);
            if (pt.y < margin) dy = pt.y - margin;
            else if (pt.y > cSize.y - margin) dy = pt.y - (cSize.y - margin);
            if (dx !== 0 || dy !== 0) map.panBy([-dx, -dy], { animate: true });
        } catch (error) {
            logger.debug('Error al ajustar pan del mapa:', error);
        }
    };

    // Ajuste automático de vista al trazar la ruta
    useEffect(() => {
        if (!mapRef.current || routePoints.length < 2) return;

        // Verificar que el mapa esté completamente inicializado
        const map = mapRef.current;
        try {
            // Intentar obtener el tamaño del mapa para verificar si está listo
            const size = map.getSize();
            if (!size || size.x === 0 || size.y === 0) {
                // Si el mapa no está listo, esperar un poco más
                const timer = setTimeout(() => {
                    if (mapRef.current) {
                        try {
                            const currentSize = mapRef.current.getSize();
                            if (currentSize && currentSize.x > 0 && currentSize.y > 0) {
                                fitBoundsToRoute();
                            }
                        } catch (e) {
                            logger.debug('Mapa aún no está listo para fitBounds');
                        }
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            // Si hay error al obtener el tamaño, el mapa no está listo
            const timer = setTimeout(() => {
                if (mapRef.current) {
                    fitBoundsToRoute();
                }
            }, 500);
            return () => clearTimeout(timer);
        }

        fitBoundsToRoute();
    }, [routePoints.length]);

    const fitBoundsToRoute = () => {
        if (!mapRef.current || routePoints.length < 2) return;

        try {
            // Verificar que todos los puntos sean válidos antes de calcular bounds
            const validPoints = routePoints.filter(point => {
                const [lat, lng] = point;
                return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            });

            if (validPoints.length > 1) {
                const bounds = latLngBounds(validPoints as [number, number][]);
                mapRef.current.fitBounds(bounds, {
                    padding: [20, 20],
                    animate: true,
                    maxZoom: 16
                });
                logger.info('GPSMap - fitBounds aplicado a la ruta', {
                    bounds: bounds.toBBoxString(),
                    puntos: validPoints.length,
                    totalPoints: routePoints.length,
                    filteredPoints: routePoints.length - validPoints.length
                });
            } else {
                logger.warn('GPSMap - No hay suficientes puntos válidos para fitBounds', {
                    totalPoints: routePoints.length,
                    validPoints: validPoints.length
                });
            }
        } catch (e) {
            logger.error('GPSMap - Error en fitBounds', e);
        }
    };

    // Iconos y colores para zonas
    const zoneTypeConfig: Record<string, { color: string; icon: string; label: string }> = {
        taller: { color: '#FFA000', icon: '🛠️', label: 'Taller' },
        parque: { color: '#1976d2', icon: '🏞️', label: 'Parque' },
        sensible: { color: '#FFEB3B', icon: '⚠️', label: 'Sensible' },
        hospital: { color: '#43a047', icon: '🏥', label: 'Hospital' },
        base: { color: '#0288d1', icon: '🏢', label: 'Base' },
        otro: { color: '#757575', icon: '❓', label: 'Otro' },
    };

    // Debug: Log de datos del mapa
    logger.info('🗺️ GPSMap renderizando:', {
        center,
        zoom,
        routePoints: routePoints.length,
        vehicleLocations: vehicleLocations.length,
        stabilityEvents: stabilityEvents.length,
        selectedSession: selectedSession?.id
    });

    return (
        <Box sx={{ height: '100%', position: 'relative', minHeight: '400px' }}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', minHeight: '400px' }}
                zoomControl={true}
                attributionControl={true}
            >
                <TileLayer
                    url="https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=u8wN3BM4AMzDGGC76lLF14vHblDP37HG"
                    attribution='&copy; <a href="https://www.tomtom.com/">TomTom</a>'
                />

                {/* Debug: Mostrar información del mapa */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    zIndex: 1000,
                    border: '1px solid #ccc'
                }}>
                    <div>📍 Puntos GPS: {routePoints.length}</div>
                    <div>🚗 Vehículos: {vehicleLocations.length}</div>
                    <div>⚠️ Eventos: {stabilityEvents.length}</div>
                    <div>🎯 Centro: {center[0].toFixed(4)}, {center[1].toFixed(4)}</div>
                    <div>🔍 Zoom: {zoom}</div>
                    <div>📊 Sesión: {selectedSession?.id || 'Ninguna'}</div>
                    <div>📅 Fecha: {selectedSession?.date || 'N/A'}</div>
                    <div>🕐 Hora: {selectedSession?.startTime || 'N/A'}</div>
                    <div>🔗 Ruta Original: {routePoints.length > 1 ? 'SÍ' : 'NO'}</div>
                    <div>🛣️ Ruta Real: {realRoutePoints.length > 1 ? 'SÍ' : 'NO'}</div>
                    <div>⏳ Cargando: {isLoadingRoute ? 'SÍ' : 'NO'}</div>
                    <div style={{ marginTop: '5px', padding: '3px', background: '#f0f0f0', borderRadius: '3px' }}>
                        <strong>⚠️ Verificar sincronización:</strong><br />
                        Los eventos deben coincidir con la ruta
                    </div>
                </div>

                <MapSetter />

                {/* Marcadores de vehículos */}
                {vehicleLocations.map(location => (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        icon={location.id === selectedVehicleId ? selectedVehicleIcon : defaultIcon}
                        eventHandlers={{
                            click: () => {
                                onVehicleClick?.(location);
                            }
                        }}
                    >
                        <Popup>
                            <div>
                                <strong>{t('vehiculo')}</strong> {location.plate ?? location.name}<br />
                                <strong>{t('ultima_actualizacion')}</strong> {new Date(location.lastUpdate).toLocaleString()}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Línea de ruta real (siguiendo carreteras) */}
                {realRoutePoints.length > 1 && (
                    <Polyline
                        positions={realRoutePoints}
                        color="#0066cc"
                        weight={4}
                        opacity={0.8}
                        smoothFactor={2}
                        dashArray="10, 5"
                    />
                )}

                {/* Línea de ruta original (puntos GPS directos) - Solo para debug */}
                {routePoints.length > 1 && (
                    <Polyline
                        positions={routePoints}
                        color="#ff0000"
                        weight={2}
                        opacity={0.3}
                        smoothFactor={1}
                    />
                )}

                {/* Puntos de la ruta para debug - Solo cada 5 puntos para no saturar */}
                {routePoints.map((point, index) => {
                    if (index % 5 === 0 || index === routePoints.length - 1) {
                        return (
                            <CircleMarker
                                key={`route-point-${index}`}
                                center={point}
                                radius={2}
                                color="#ff0000"
                                fillColor="#ff0000"
                                fillOpacity={0.6}
                            >
                                <Tooltip>
                                    Punto {index + 1}: {point[0].toFixed(6)}, {point[1].toFixed(6)}
                                </Tooltip>
                            </CircleMarker>
                        );
                    }
                    return null;
                })}





                {/* Marcadores de eventos de estabilidad */}
                {stabilityEvents.map((event, idx) => {
                    const id = buildEventId(event);
                    return (
                        <Marker
                            key={`${id}-${idx}`}
                            position={[event.lat, event.lon]}
                            icon={divIcon({
                                className: 'custom-div-icon',
                                html: `<div style="background-color: ${getEventColor(event.tipos || [], event.level)}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                                iconSize: [12, 12],
                                iconAnchor: [6, 6]
                            })}
                            ref={(ref) => {
                                if (ref) markerRefs.current[id] = ref;
                            }}
                            eventHandlers={{
                                click: () => {
                                    onEventSelect?.(id);
                                },
                                popupclose: () => {
                                    // Usar setTimeout para evitar conflictos con el estado del DOM de Leaflet
                                    setTimeout(() => {
                                        if (routeBounds && mapRef.current) {
                                            try {
                                                mapRef.current.fitBounds(routeBounds, { padding: [40, 40], animate: true });
                                            } catch (error) {
                                                logger.debug('Error al ajustar bounds después de cerrar popup:', error);
                                            }
                                        }
                                    }, 100);
                                },
                                popupopen: (e) => {
                                    const map = mapRef.current;
                                    if (!map) return;

                                    try {
                                        const z = map.getZoom();
                                        map.setZoom(Math.max(z - 1, 3), { animate: true });
                                        const ll = e.sourceTarget.getLatLng();
                                        adjustPan(ll.lat, ll.lng);
                                    } catch (error) {
                                        logger.debug('Error al abrir popup de evento:', error);
                                    }
                                }
                            }}
                        >
                            <Popup minWidth={300} maxWidth={420} offset={[0, 20]} keepInView={true}>
                                <EventPopup evt={event} nearest={(() => {
                                    if (telemetryData.length === 0) return undefined;
                                    return telemetryData.reduce((prev, curr) => {
                                        const currTime = new Date(curr.timestamp).getTime();
                                        const prevTime = new Date(prev.timestamp).getTime();
                                        const eventTime = new Date(event.timestamp).getTime();
                                        return Math.abs(currTime - eventTime) < Math.abs(prevTime - eventTime) ? curr : prev;
                                    }, telemetryData[0]);
                                })()} fallbackDesc={event.tipos?.map(tip => tip).join(', ') ?? 'Evento desconocido'} />
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Clusters de eventos */}
                {showClusters && clusters && clusters.map((cluster, idx) => (
                    <Marker
                        key={`cluster-${idx}`}
                        position={[cluster.center.lat, cluster.center.lon]}
                        icon={divIcon({
                            className: 'custom-cluster-icon',
                            html: `<div style="
                                background-color: ${cluster.severity === 'critical' ? '#ff4444' :
                                    cluster.severity === 'danger' ? '#ff8800' : '#ffaa00'}; 
                                width: ${Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT, UI_CONFIG.MAP.CLUSTER.MAX_SIZE)}px; 
                                height: ${Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT, UI_CONFIG.MAP.CLUSTER.MAX_SIZE)}px; 
                                border-radius: 50%; 
                                border: 3px solid white; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center; 
                                color: white; 
                                font-weight: bold; 
                                font-size: 12px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            ">${cluster.eventCount}</div>`,
                            iconSize: [Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT, UI_CONFIG.MAP.CLUSTER.MAX_SIZE), Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT, UI_CONFIG.MAP.CLUSTER.MAX_SIZE)],
                            iconAnchor: [Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE / 2 + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT / 2, UI_CONFIG.MAP.CLUSTER.MAX_SIZE / 2), Math.min(UI_CONFIG.MAP.CLUSTER.MIN_SIZE / 2 + cluster.eventCount * UI_CONFIG.MAP.CLUSTER.SIZE_INCREMENT / 2, UI_CONFIG.MAP.CLUSTER.MAX_SIZE / 2)]
                        })}
                        eventHandlers={{
                            click: () => {
                                onClusterClick?.(cluster);
                            }
                        }}
                    >
                        <Popup minWidth={300} maxWidth={420}>
                            <div>
                                <h4>Cluster de {cluster.eventCount} eventos</h4>
                                <p><strong>Severidad:</strong> {cluster.severity}</p>
                                <p><strong>Radio:</strong> {cluster.radius.toFixed(1)}m</p>
                                <p><strong>Tipo principal:</strong> {cluster.primaryType}</p>
                                <p><strong>Eventos:</strong> {cluster.events.length}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Marcadores de zonas (incluyendo talleres) */}
                {zones.map((zone: any) => {
                    const cfg = zoneTypeConfig[zone.type] || zoneTypeConfig['otro'];
                    return (
                        <Marker
                            key={zone.id}
                            position={zone.geometry?.coordinates ? [zone.geometry.coordinates[1], zone.geometry.coordinates[0]] : [0, 0]}
                            icon={divIcon({
                                className: 'zone-marker',
                                html: `<div style="background-color: ${cfg.color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 18px;">${cfg.icon}</div>`,
                                iconSize: [28, 28],
                                iconAnchor: [14, 14],
                            })}
                        >
                            <Popup minWidth={220} maxWidth={320}>
                                <div>
                                    <strong>{cfg.icon} {zone.name}</strong><br />
                                    <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span><br />
                                    {zone.parkId && <span>Parque asociado: {zone.parkId}</span>}<br />
                                    <span>ID: {zone.id}</span>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                <MapUpdater center={center} zoom={zoom} />
                <FilteringStats
                    originalCount={telemetryData.length}
                    filteredCount={routePoints.length}
                    showStats={routePoints.length < telemetryData.length}
                />
                <FilteringStats
                    originalCount={stabilityEvents.length}
                    filteredCount={stabilityEvents.length}
                    showStats={false}
                />
            </MapContainer>

            {/* Botón circular para generar reportes profesionales */}
            {onGeneratePDF && (
                <Tooltip title="Generar reporte PDF profesional" placement="left">
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={onGeneratePDF}
                        sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            zIndex: 1000,
                            boxShadow: 3
                        }}
                    >
                        <PictureAsPdfIcon />
                    </Fab>
                </Tooltip>
            )}

            {/* Leyenda del mapa */}
            <MapLegend />
        </Box>
    );
};

// Util: build deterministic id for an event
export const buildEventId = (event: StabilityIndexEvent): string => `${event.timestamp}-${event.lat}-${event.lon}-${event.tipos?.[0] ?? 'unknown'}`;

export default GPSMap; 