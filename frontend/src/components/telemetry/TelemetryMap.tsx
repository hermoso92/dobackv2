import tt, { LngLatBounds, LngLatLike } from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import { useCallback, useEffect, useRef } from 'react';
import { RadarGeofence } from '../../api/radar';
import { TelemetryPoint } from '../../api/telemetry';

const severityColor = (severity: number): string => {
    switch (severity) {
        case 2:
            return '#ef4444';
        case 1:
            return '#f59e0b';
        default:
            return '#22c55e';
    }
};

interface TelemetryMapProps {
    points: TelemetryPoint[];
    geofences?: RadarGeofence[];
}

interface RadarGeofenceGeometryPolygon {
    type: 'Polygon';
    coordinates: [number, number][][];
}

interface RadarGeofenceGeometryCircle {
    type: 'Circle';
    center: { latitude: number; longitude: number };
    radius: number;
}

type SupportedRadarGeometry = RadarGeofenceGeometryPolygon | RadarGeofenceGeometryCircle;

type TomTomPolygon = {
    remove: () => void;
    on: (event: string, handler: () => void) => void;
    getBounds: () => LngLatBounds;
};

type TomTomMap = tt.Map & {
    addLayer?: (layer: unknown) => void;
};

const isSupportedGeometry = (geometry: unknown): geometry is SupportedRadarGeometry => {
    if (!geometry || typeof geometry !== 'object') {
        return false;
    }

    const typed = geometry as { type?: string };
    return typed.type === 'Polygon' || typed.type === 'Circle';
};

export const TelemetryMap: React.FC<TelemetryMapProps> = ({ points, geofences = [] }) => {
    const mapElement = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<TomTomMap | null>(null);
    const geofenceLayerRef = useRef<TomTomPolygon[]>([]);
    const markerRef = useRef<tt.Marker[]>([]);
    const apiKey = import.meta.env.VITE_TOMTOM_API_KEY;

    const clearMarkers = useCallback(() => {
        if (markerRef.current.length > 0) {
            markerRef.current.forEach((marker) => marker.remove());
            markerRef.current = [];
        }
    }, []);

    const clearGeofences = useCallback(() => {
        if (geofenceLayerRef.current.length > 0) {
            geofenceLayerRef.current.forEach((layer) => layer.remove());
            geofenceLayerRef.current = [];
        }
    }, []);

    const renderGeofences = useCallback(
        (map: TomTomMap, geofencesList: RadarGeofence[]) => {
            clearGeofences();

            geofencesList.forEach((geofence) => {
                if (!isSupportedGeometry(geofence.geometry)) {
                    return;
                }

                try {
                    if (geofence.geometry.type === 'Polygon') {
                        const rings = Array.isArray(geofence.geometry.coordinates)
                            ? (geofence.geometry.coordinates as [number, number][][])
                            : [];
                        const mainRing = rings[0];
                        if (!mainRing || mainRing.length === 0) {
                            return;
                        }
                        const polygon = new (tt as any).Polygon({
                            positions: mainRing.map(([lng, lat]) => [lng, lat] as LngLatLike),
                            color: '#2563eb',
                            fillColor: 'rgba(37,99,235,0.25)',
                            fillOpacity: 0.4
                        }).addTo(map) as TomTomPolygon;
                        polygon.on('click', () => {
                            new tt.Popup({ offset: 12 })
                                .setLngLat(polygon.getBounds().getCenter())
                                .setHTML(`<div style="min-width:140px">${geofence.description || geofence.id}</div>`)
                                .addTo(map);
                        });
                        geofenceLayerRef.current.push(polygon);
                    }

                    if (geofence.geometry.type === 'Circle') {
                        const { latitude, longitude } = geofence.geometry.center;
                        const radiusMeters = geofence.geometry.radius;
                        if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof radiusMeters !== 'number') {
                            return;
                        }
                        const circle = new (tt as any).Polygon({
                            geoJson: (tt as any).circle([longitude, latitude], radiusMeters).toGeoJSON(),
                            color: '#2563eb',
                            fillColor: 'rgba(37,99,235,0.25)',
                            fillOpacity: 0.35
                        }).addTo(map) as TomTomPolygon;
                        circle.on('click', () => {
                            new tt.Popup({ offset: 12 })
                                .setLngLat(new tt.LngLat(longitude, latitude))
                                .setHTML(`<div style="min-width:140px">${geofence.description || geofence.id}</div>`)
                                .addTo(map);
                        });
                        geofenceLayerRef.current.push(circle);
                    }
                } catch (error) {
                    console.error('Error rendering geofence', geofence.id, error);
                }
            });
        },
        [clearGeofences]
    );

    useEffect(() => {
        if (!mapElement.current || !apiKey || mapRef.current) {
            return;
        }

        const map = tt.map({
            key: apiKey,
            container: mapElement.current,
            style: 'https://api.tomtom.com/map/1/style/basic/main.json'
        }) as TomTomMap;
        mapRef.current = map;

        if (geofences.length > 0) {
            renderGeofences(map, geofences);
        }

        return () => {
            clearMarkers();
            clearGeofences();
            map.remove();
            mapRef.current = null;
        };
    }, [apiKey, geofences, renderGeofences, clearGeofences, clearMarkers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        renderGeofences(map, geofences);
    }, [geofences, renderGeofences]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) {
            return;
        }

        clearMarkers();

        if (!points || points.length === 0) {
            map.setZoom(4);
            map.setCenter([0, 0]);
            return;
        }

        const bounds = new LngLatBounds();
        points.forEach((point) => {
            const longitude = point.lng;
            const latitude = point.lat;
            if (typeof longitude !== 'number' || typeof latitude !== 'number') {
                return;
            }

            bounds.extend([longitude, latitude]);
            const markerElement = document.createElement('div');
            markerElement.style.backgroundColor = severityColor(point.severity ?? 0);
            markerElement.style.width = '12px';
            markerElement.style.height = '12px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.border = '2px solid white';

            const marker = new tt.Marker({ element: markerElement }).setLngLat(new tt.LngLat(longitude, latitude)).addTo(map);
            marker.setPopup(
                new tt.Popup({ offset: 12 }).setHTML(`
                    <div style="min-width:140px">
                        <div><strong>${new Date(point.recorded_at).toLocaleString()}</strong></div>
                        <div>Speed: ${point.speed ?? 'N/A'} km/h</div>
                        <div>Severity: ${point.severity ?? 'N/A'}</div>
                    </div>
                `)
            );

            markerRef.current.push(marker);
        });

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
        }
    }, [points, clearMarkers]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!apiKey && (
                <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: '#f87171', color: 'white', padding: '8px', borderRadius: '4px' }}>
                    TOMTOM API KEY missing (set VITE_TOMTOM_API_KEY)
                </div>
            )}

            <div ref={mapElement} style={{ width: '100%', height: '100%' }} data-testid="telemetry-map" />
        </div>
    );
};
