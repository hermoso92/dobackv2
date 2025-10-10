import tt, { LngLatBounds, LngLatLike } from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { useCallback, useEffect, useRef } from 'react';
import { EventDTO, GeofenceDTO, TelemetryPointDTO } from '../../types/telemetry';
import { logger } from '../../utils/logger';

interface TelemetryMapAdvancedProps {
    points: TelemetryPointDTO[];
    events: EventDTO[];
    geofences: GeofenceDTO[];
    currentReplayPoint?: TelemetryPointDTO | null;
    showHeatmap: boolean;
    heatmapLayer: 'speed' | 'events' | 'geofence_violations';
    onPointClick?: (point: TelemetryPointDTO) => void;
    onEventClick?: (event: EventDTO) => void;
    onGeofenceClick?: (geofence: GeofenceDTO) => void;
}

type TomTomMap = tt.Map & {
    addLayer?: (layer: unknown) => void;
};

type TomTomPolygon = {
    remove: () => void;
    on: (event: string, handler: () => void) => void;
    getBounds: () => LngLatBounds;
};

const severityColor = (severity: string): string => {
    switch (severity) {
        case 'CRITICAL':
            return '#dc2626';
        case 'HIGH':
            return '#ea580c';
        case 'MEDIUM':
            return '#d97706';
        case 'LOW':
            return '#16a34a';
        default:
            return '#6b7280';
    }
};

const getHeatmapColor = (intensity: number): string => {
    if (intensity > 0.8) return '#dc2626';
    if (intensity > 0.6) return '#ea580c';
    if (intensity > 0.4) return '#d97706';
    if (intensity > 0.2) return '#eab308';
    return '#16a34a';
};

const TelemetryMapAdvanced: React.FC<TelemetryMapAdvancedProps> = ({
    points,
    events,
    geofences,
    currentReplayPoint,
    showHeatmap,
    heatmapLayer,
    onPointClick,
    onEventClick,
    onGeofenceClick
}) => {
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<TomTomMap | null>(null);
    const geofenceLayerRef = useRef<TomTomPolygon[]>([]);
    const markerRef = useRef<tt.Marker[]>([]);
    const eventMarkerRef = useRef<tt.Marker[]>([]);
    const replayMarkerRef = useRef<tt.Marker | null>(null);
    const heatmapLayerRef = useRef<any>(null);
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

    const clearMarkers = useCallback(() => {
        markerRef.current.forEach((marker) => marker.remove());
        markerRef.current = [];
    }, []);

    const clearEventMarkers = useCallback(() => {
        eventMarkerRef.current.forEach((marker) => marker.remove());
        eventMarkerRef.current = [];
    }, []);

    const clearReplayMarker = useCallback(() => {
        if (replayMarkerRef.current) {
            replayMarkerRef.current.remove();
            replayMarkerRef.current = null;
        }
    }, []);

    const clearGeofences = useCallback(() => {
        geofenceLayerRef.current.forEach((layer) => layer.remove());
        geofenceLayerRef.current = [];
    }, []);

    const clearHeatmap = useCallback(() => {
        if (heatmapLayerRef.current && mapRef.current) {
            try {
                mapRef.current.removeLayer('heatmap');
                mapRef.current.removeSource('heatmap');
            } catch (error) {
                // Layer might not exist
            }
            heatmapLayerRef.current = null;
        }
    }, []);

    const renderGeofences = useCallback(
        (map: TomTomMap, geofencesList: GeofenceDTO[]) => {
            clearGeofences();

            geofencesList.forEach((geofence) => {
                try {
                    if (geofence.geometry.type === 'Polygon' && geofence.geometry.coordinates) {
                        const rings = geofence.geometry.coordinates;
                        const mainRing = rings[0];
                        if (!mainRing || mainRing.length === 0) return;

                        const polygon = new (tt as any).Polygon({
                            positions: mainRing.map(([lng, lat]) => [lng, lat] as LngLatLike),
                            color: '#2563eb',
                            fillColor: 'rgba(37,99,235,0.25)',
                            fillOpacity: 0.4
                        }).addTo(map) as TomTomPolygon;

                        polygon.on('click', () => {
                            onGeofenceClick?.(geofence);
                            new tt.Popup({ offset: 12 })
                                .setLngLat(polygon.getBounds().getCenter())
                                .setHTML(`
                                    <div style="min-width:140px">
                                        <strong>${geofence.name}</strong>
                                        <div>Provider: ${geofence.provider}</div>
                                        <div>Type: ${geofence.type}</div>
                                        <div>Version: ${geofence.version}</div>
                                    </div>
                                `)
                                .addTo(map);
                        });

                        geofenceLayerRef.current.push(polygon);
                    }

                    if (geofence.geometry.type === 'Circle' && geofence.geometry.center && geofence.geometry.radius) {
                        const { latitude, longitude } = geofence.geometry.center;
                        const radiusMeters = geofence.geometry.radius;

                        const circle = new (tt as any).Polygon({
                            geoJson: (tt as any).circle([longitude, latitude], radiusMeters).toGeoJSON(),
                            color: '#2563eb',
                            fillColor: 'rgba(37,99,235,0.25)',
                            fillOpacity: 0.35
                        }).addTo(map) as TomTomPolygon;

                        circle.on('click', () => {
                            onGeofenceClick?.(geofence);
                            new tt.Popup({ offset: 12 })
                                .setLngLat(new tt.LngLat(longitude, latitude))
                                .setHTML(`
                                    <div style="min-width:140px">
                                        <strong>${geofence.name}</strong>
                                        <div>Provider: ${geofence.provider}</div>
                                        <div>Type: ${geofence.type}</div>
                                        <div>Radius: ${radiusMeters}m</div>
                                    </div>
                                `)
                                .addTo(map);
                        });

                        geofenceLayerRef.current.push(circle);
                    }
                } catch (error) {
                    logger.error('Error rendering geofence', { error, geofence });
                }
            });
        },
        [clearGeofences, onGeofenceClick]
    );

    const renderHeatmap = useCallback(
        (map: TomTomMap, pointsList: TelemetryPointDTO[], eventsList: EventDTO[], layer: string) => {
            clearHeatmap();

            if (!showHeatmap || pointsList.length === 0) return;

            let heatmapData: Array<{ lat: number; lng: number; intensity: number }> = [];

            switch (layer) {
                case 'speed':
                    heatmapData = pointsList
                        .filter(point => point.speed && point.speed > 0)
                        .map(point => ({
                            lat: point.lat,
                            lng: point.lng,
                            intensity: Math.min((point.speed || 0) / 120, 1) // Normalizar a 120 km/h
                        }));
                    break;

                case 'events':
                    heatmapData = eventsList.map(event => ({
                        lat: event.lat,
                        lng: event.lng,
                        intensity: event.severity === 'CRITICAL' ? 1 :
                            event.severity === 'HIGH' ? 0.8 :
                                event.severity === 'MEDIUM' ? 0.6 : 0.4
                    }));
                    break;

                case 'geofence_violations':
                    const violationEvents = eventsList.filter(event =>
                        event.type.includes('geofence') || event.type.includes('violation')
                    );
                    heatmapData = violationEvents.map(event => ({
                        lat: event.lat,
                        lng: event.lng,
                        intensity: 0.9
                    }));
                    break;
            }

            if (heatmapData.length === 0) return;

            // Crear fuente de datos para heatmap
            const source = {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: heatmapData.map(point => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [point.lng, point.lat]
                        },
                        properties: {
                            intensity: point.intensity
                        }
                    }))
                }
            };

            // Añadir fuente al mapa
            map.addSource('heatmap', source);

            // Crear capa de heatmap
            const heatmapLayer = {
                id: 'heatmap',
                type: 'heatmap',
                source: 'heatmap',
                maxzoom: 15,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0, 0,
                        1, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        15, 3
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(33,102,172,0)',
                        0.2, 'rgb(103,169,207)',
                        0.4, 'rgb(209,229,240)',
                        0.6, 'rgb(253,219,199)',
                        0.8, 'rgb(239,138,98)',
                        1, 'rgb(178,24,43)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 2,
                        15, 20
                    ],
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7, 1,
                        15, 0
                    ]
                }
            };

            map.addLayer(heatmapLayer);
            heatmapLayerRef.current = heatmapLayer;
        },
        [showHeatmap, clearHeatmap]
    );

    const renderPoints = useCallback(
        (map: TomTomMap, pointsList: TelemetryPointDTO[]) => {
            clearMarkers();

            if (!pointsList || pointsList.length === 0) return;

            const bounds = new LngLatBounds();
            pointsList.forEach((point) => {
                bounds.extend([point.lng, point.lat]);

                const markerElement = document.createElement('div');
                markerElement.style.backgroundColor = '#3b82f6';
                markerElement.style.width = '8px';
                markerElement.style.height = '8px';
                markerElement.style.borderRadius = '50%';
                markerElement.style.border = '2px solid white';
                markerElement.style.cursor = 'pointer';

                const marker = new tt.Marker({ element: markerElement })
                    .setLngLat(new tt.LngLat(point.lng, point.lat))
                    .addTo(map);

                marker.setPopup(
                    new tt.Popup({ offset: 12 }).setHTML(`
                        <div style="min-width:140px">
                            <div><strong>${new Date(point.ts).toLocaleString()}</strong></div>
                            <div>Speed: ${point.speed || 'N/A'} km/h</div>
                            <div>Heading: ${point.heading || 'N/A'}°</div>
                        </div>
                    `)
                );

                marker.getElement().addEventListener('click', () => {
                    onPointClick?.(point);
                });

                markerRef.current.push(marker);
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
            }
        },
        [clearMarkers, onPointClick]
    );

    const renderEvents = useCallback(
        (map: TomTomMap, eventsList: EventDTO[]) => {
            clearEventMarkers();

            eventsList.forEach((event) => {
                const markerElement = document.createElement('div');
                markerElement.style.backgroundColor = severityColor(event.severity);
                markerElement.style.width = '12px';
                markerElement.style.height = '12px';
                markerElement.style.borderRadius = '50%';
                markerElement.style.border = '2px solid white';
                markerElement.style.cursor = 'pointer';

                const marker = new tt.Marker({ element: markerElement })
                    .setLngLat(new tt.LngLat(event.lng, event.lat))
                    .addTo(map);

                marker.setPopup(
                    new tt.Popup({ offset: 12 }).setHTML(`
                        <div style="min-width:140px">
                            <div><strong>${event.type}</strong></div>
                            <div>Severity: ${event.severity}</div>
                            <div>Time: ${new Date(event.ts).toLocaleString()}</div>
                            ${event.meta ? `<div>Meta: ${JSON.stringify(event.meta)}</div>` : ''}
                        </div>
                    `)
                );

                marker.getElement().addEventListener('click', () => {
                    onEventClick?.(event);
                });

                eventMarkerRef.current.push(marker);
            });
        },
        [clearEventMarkers, onEventClick]
    );

    const renderReplayMarker = useCallback(
        (map: TomTomMap, point: TelemetryPointDTO | null) => {
            clearReplayMarker();

            if (!point) return;

            const markerElement = document.createElement('div');
            markerElement.style.backgroundColor = '#ef4444';
            markerElement.style.width = '16px';
            markerElement.style.height = '16px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.border = '3px solid white';
            markerElement.style.boxShadow = '0 0 10px rgba(239,68,68,0.5)';

            const marker = new tt.Marker({ element: markerElement })
                .setLngLat(new tt.LngLat(point.lng, point.lat))
                .addTo(map);

            replayMarkerRef.current = marker;
        },
        [clearReplayMarker]
    );

    // Inicializar mapa
    useEffect(() => {
        if (!mapElement.current || !apiKey || mapRef.current) return;

        const map = tt.map({
            key: apiKey,
            container: mapElement.current,
            style: 'https://api.tomtom.com/map/1/style/basic/main.json',
            center: [0, 0],
            zoom: 2
        }) as TomTomMap;

        mapRef.current = map;

        return () => {
            clearMarkers();
            clearEventMarkers();
            clearReplayMarker();
            clearGeofences();
            clearHeatmap();
            map.remove();
            mapRef.current = null;
        };
    }, [apiKey, clearMarkers, clearEventMarkers, clearReplayMarker, clearGeofences, clearHeatmap]);

    // Renderizar geocercas
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        renderGeofences(map, geofences);
    }, [geofences, renderGeofences]);

    // Renderizar puntos
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        renderPoints(map, points);
    }, [points, renderPoints]);

    // Renderizar eventos
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        renderEvents(map, events);
    }, [events, renderEvents]);

    // Renderizar heatmap
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        renderHeatmap(map, points, events, heatmapLayer);
    }, [points, events, heatmapLayer, renderHeatmap]);

    // Renderizar marcador de replay
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        renderReplayMarker(map, currentReplayPoint);
    }, [currentReplayPoint, renderReplayMarker]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!apiKey && (
                <div style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    zIndex: 10,
                    background: '#f87171',
                    color: 'white',
                    padding: '8px',
                    borderRadius: '4px'
                }}>
                    TOMTOM API KEY missing (set VITE_TOMTOM_API_KEY)
                </div>
            )}

            <div ref={mapElement} style={{ width: '100%', height: '100%' }} data-testid="telemetry-map-advanced" />
        </div>
    );
};

export default TelemetryMapAdvanced;
