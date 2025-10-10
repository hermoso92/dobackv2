import { Box } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';

// Configuración de iconos personalizados para Leaflet
const createCustomIcon = (color: string, iconType: 'route' | 'alert' | 'start' | 'end') => {
    const iconMap = {
        route: '📍',
        alert: '⚠️',
        start: '🟢',
        end: '🔴'
    };

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-size: 16px;
            ">
                ${iconMap[iconType]}
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

interface RoutePoint {
    lat: number;
    lng: number;
    speed: number;
    timestamp: Date;
}

interface EventPoint {
    id: string;
    lat?: number;
    lng?: number;
    type: string;
    severity: string;
    timestamp: Date;
}

interface RouteMapProps {
    center: [number, number];
    zoom: number;
    height: string;
    route: RoutePoint[];
    events: EventPoint[];
    vehicleName: string;
}

const RouteMapComponent: React.FC<RouteMapProps> = ({
    center,
    zoom,
    height,
    route,
    events,
    vehicleName
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Crear mapa
        mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

        // Agregar capa de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Agregar marcador de inicio
        if (route.length > 0 && route[0]) {
            const startIcon = createCustomIcon('#4caf50', 'start');
            L.marker([route[0].lat, route[0].lng], { icon: startIcon })
                .addTo(mapRef.current)
                .bindPopup(`
                    <div>
                        <h4>🚀 Inicio de ruta</h4>
                        <p><strong>Vehículo:</strong> ${vehicleName}</p>
                        <p><strong>Hora:</strong> ${route[0].timestamp.toLocaleString()}</p>
                        <p><strong>Velocidad:</strong> ${route[0].speed.toFixed(1)} km/h</p>
                    </div>
                `);
        }

        // Agregar marcador de fin
        if (route.length > 1 && route[route.length - 1] && mapRef.current) {
            const endIcon = createCustomIcon('#f44336', 'end');
            const lastPoint = route[route.length - 1];
            if (lastPoint) {
                L.marker([lastPoint.lat, lastPoint.lng], { icon: endIcon })
                    .addTo(mapRef.current)
                    .bindPopup(`
                        <div>
                            <h4>🏁 Fin de ruta</h4>
                            <p><strong>Vehículo:</strong> ${vehicleName}</p>
                            <p><strong>Hora:</strong> ${lastPoint.timestamp.toLocaleString()}</p>
                            <p><strong>Velocidad:</strong> ${lastPoint.speed.toFixed(1)} km/h</p>
                        </div>
                    `);
            }
        }

        // Agregar línea de ruta
        if (route.length > 1) {
            const routeCoordinates = route.map(point => [point.lat, point.lng] as [number, number]);
            L.polyline(routeCoordinates, {
                color: '#1976d2',
                weight: 4,
                opacity: 0.8
            }).addTo(mapRef.current);
        }

        // Agregar eventos como marcadores con diferentes estilos según tipo
        events.forEach((event: any) => {
            if (event.lat && event.lng && mapRef.current) {
                // Determinar color e icono según severidad y tipo
                let color = '#ff9800'; // naranja por defecto
                let icon = '⚠️';
                let eventTypeName = 'Evento de Estabilidad';

                if (event.severity === 'critical') {
                    color = '#d32f2f'; // rojo crítico
                    icon = '🚨';
                }

                if (event.type === 'rollover_risk') {
                    eventTypeName = 'Riesgo de Vuelco';
                    icon = '🚨';
                    color = '#d32f2f';
                } else if (event.type === 'dangerous_drift') {
                    eventTypeName = 'Deriva Peligrosa';
                    icon = '⚡';
                    color = '#ff5722';
                } else if (event.type === 'abrupt_maneuver') {
                    eventTypeName = 'Maniobra Brusca';
                    icon = '💨';
                    color = '#ff9800';
                }

                const eventIcon = L.divIcon({
                    className: 'event-marker',
                    html: `
                        <div style="
                            background-color: ${color};
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: 3px solid white;
                            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                            font-size: 18px;
                            animation: pulse 2s infinite;
                        ">
                            ${icon}
                        </div>
                    `,
                    iconSize: [35, 35],
                    iconAnchor: [17, 17],
                    popupAnchor: [0, -17]
                });

                // Construir popup visual y detallado
                const severityColor = event.severity === 'critical' ? '#d32f2f' :
                    event.severity === 'high' ? '#f57c00' : '#1976d2';
                const severityBg = event.severity === 'critical' ? '#ffebee' :
                    event.severity === 'high' ? '#fff3e0' : '#e3f2fd';

                let popupContent = `
                    <div style="min-width: 320px; font-family: 'Segoe UI', sans-serif;">
                        <!-- Header del evento -->
                        <div style="background: linear-gradient(135deg, ${color}, ${color}dd); 
                                    color: white; padding: 12px; margin: -8px -8px 12px -8px; 
                                    border-radius: 8px 8px 0 0; text-align: center;">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">
                                🚨 ${eventTypeName}
                            </h3>
                        </div>
                        
                        <!-- Severidad -->
                        <div style="background: ${severityBg}; padding: 8px 12px; margin: 0 0 12px 0; 
                                    border-radius: 6px; border-left: 4px solid ${severityColor};">
                            <strong style="color: ${severityColor};">Severidad: ${event.severity.toUpperCase()}</strong>
                        </div>
                        
                        <!-- Información temporal -->
                        <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                <span style="font-size: 16px; margin-right: 8px;">🕐</span>
                                <strong>Hora:</strong>
                            </div>
                            <div style="margin-left: 24px; font-family: monospace; font-size: 14px;">
                                ${new Date(event.timestamp).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}
                            </div>
                        </div>
                        
                        <!-- Datos técnicos -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                `;

                // Índice de Estabilidad
                if (event.si !== undefined) {
                    const siPercent = (event.si * 100).toFixed(1);
                    const siColor = event.si < 0.3 ? '#d32f2f' : event.si < 0.5 ? '#f57c00' : '#4caf50';
                    popupContent += `
                        <div style="background: ${siColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">ÍNDICE ESTABILIDAD</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${siColor};">
                                ${siPercent}%
                            </div>
                        </div>
                    `;
                }

                // Roll
                if (event.roll !== undefined) {
                    const rollColor = Math.abs(event.roll) > 10 ? '#d32f2f' : '#4caf50';
                    popupContent += `
                        <div style="background: ${rollColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">ROLL</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${rollColor};">
                                ${event.roll.toFixed(1)}°
                            </div>
                        </div>
                    `;
                }

                // Aceleración Lateral
                if (event.ay !== undefined) {
                    const ayValue = (event.ay / 1000).toFixed(2);
                    const ayColor = Math.abs(event.ay) > 500 ? '#d32f2f' : '#4caf50';
                    popupContent += `
                        <div style="background: ${ayColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">ACEL. LATERAL</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${ayColor};">
                                ${ayValue} m/s²
                            </div>
                        </div>
                    `;
                }

                // Giro (gx)
                if (event.gx !== undefined) {
                    const gxColor = Math.abs(event.gx) > 5000 ? '#d32f2f' : '#4caf50';
                    popupContent += `
                        <div style="background: ${gxColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">GIRO (gx)</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${gxColor};">
                                ${event.gx.toFixed(1)}°/s
                            </div>
                        </div>
                    `;
                }

                // Velocidad
                if (event.speed !== undefined && event.speed > 0) {
                    const speedColor = event.speed > 80 ? '#d32f2f' : event.speed > 50 ? '#f57c00' : '#4caf50';
                    popupContent += `
                        <div style="background: ${speedColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">VELOCIDAD</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${speedColor};">
                                ${event.speed.toFixed(1)} km/h
                            </div>
                        </div>
                    `;
                }

                // Estado Rotativo
                if (event.rotativoState !== undefined) {
                    const rotativoColor = event.rotativoState > 0 ? '#4caf50' : '#757575';
                    const rotativoText = event.rotativoState > 0 ? 'ENCENDIDO' : 'APAGADO';
                    const rotativoIcon = event.rotativoState > 0 ? '🔴' : '⚫';
                    popupContent += `
                        <div style="background: ${rotativoColor}20; padding: 8px; border-radius: 4px; text-align: center;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">ROTATIVO</div>
                            <div style="font-size: 18px; font-weight: bold; color: ${rotativoColor};">
                                ${rotativoIcon} ${rotativoText}
                            </div>
                        </div>
                    `;
                }

                popupContent += `
                        </div>
                        
                        <!-- Información adicional -->
                        <div style="background: #e8f5e8; padding: 8px; border-radius: 4px; 
                                    border-left: 3px solid #4caf50; font-size: 12px; color: #2e7d32;">
                            📍 GPS correlacionado: ±${event.gpsTimeDiff || 0}s
                        </div>
                    </div>
                `;

                L.marker([event.lat, event.lng], { icon: eventIcon })
                    .addTo(mapRef.current)
                    .bindPopup(popupContent);
            }
        });

        // Ajustar vista para mostrar toda la ruta
        if (route.length > 0 && mapRef.current) {
            const group = L.featureGroup();
            route.forEach(point => {
                group.addLayer(L.marker([point.lat, point.lng]));
            });
            mapRef.current.fitBounds(group.getBounds().pad(0.1));
        }

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [center, zoom, route, events, vehicleName]);

    return (
        <Box
            ref={mapContainerRef}
            sx={{
                height,
                width: '100%',
                borderRadius: 1,
                overflow: 'hidden'
            }}
        />
    );
};

export default RouteMapComponent;
