import { Box } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { logger } from '../../utils/logger';

// Extender la interfaz Window para incluir propiedades globales
declare global {
    interface Window {
        currentPopup?: L.Popup;
        mapInstance?: L.Map;
        routeBounds?: L.LatLngBounds;
        popupIsOpen?: boolean;
    }
}

// CSS personalizado para popups de eventos
const customPopupStyles = `
<style>
.custom-event-popup .leaflet-popup-content-wrapper {
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    border: 2px solid #e0e0e0;
    padding: 0;
    overflow: hidden;
}

.custom-event-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
    width: auto !important;
    max-width: 450px;
    max-height: 600px;
    overflow-y: auto;
}

.custom-event-popup .leaflet-popup-tip {
    background: white;
    border: 2px solid #e0e0e0;
    border-top: none;
    border-right: none;
}

.custom-event-popup .leaflet-popup-close-button {
    display: none;
}
</style>
`;

// Inyectar estilos en el documento
if (typeof document !== 'undefined' && !document.getElementById('custom-popup-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'custom-popup-styles';
    styleElement.innerHTML = customPopupStyles;
    document.head.appendChild(styleElement);
}

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
    timestamp: Date | string;
}

interface EventPoint {
    id: string;
    lat?: number;
    lng?: number;
    type: string;
    severity: string;
    timestamp: Date | string;
    si?: number;
    roll?: number;
    ay?: number;
    gx?: number;
    speed?: number;
    rotativoState?: number;
    gpsTimeDiff?: number;
}

interface RouteMapComponentProps {
    center: [number, number];
    zoom: number;
    height: string;
    route: RoutePoint[];
    events: EventPoint[];
    vehicleName: string;
}

const RouteMapComponent: React.FC<RouteMapComponentProps> = ({
    center,
    zoom,
    height,
    route,
    events,
    vehicleName
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const isInitializingRef = useRef<boolean>(false);
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Log de debugging
    logger.info('RouteMapComponent renderizado', {
        center,
        zoom,
        routeLength: route?.length,
        eventsLength: events?.length,
        vehicleName
    });

    useEffect(() => {
        logger.info('RouteMapComponent useEffect ejecutado', {
            hasRoute: !!route,
            routeLength: route?.length,
            hasMapContainer: !!mapContainerRef.current,
            isInitializing: isInitializingRef.current
        });

        // Solo inicializar si tenemos datos de ruta
        if (!route || route.length === 0) {
            logger.warn('RouteMapComponent: No hay datos de ruta, saltando inicialización');
            return;
        }

        if (!mapContainerRef.current || isInitializingRef.current) {
            logger.warn('RouteMapComponent: No se puede inicializar', {
                hasContainer: !!mapContainerRef.current,
                isInitializing: isInitializingRef.current
            });
            return;
        }

        logger.info('RouteMapComponent: Iniciando creación del mapa');
        // Marcar como inicializando
        isInitializingRef.current = true;

        // Cancelar cualquier timeout pendiente
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
        }

        // Limpiar mapa existente con mejor manejo de errores
        if (mapRef.current) {
            try {
                // Verificar si el mapa está en el DOM antes de removerlo
                if (mapContainerRef.current && mapContainerRef.current.contains(mapRef.current.getContainer())) {
                    mapRef.current.remove();
                }
            } catch (e) {
                logger.warn('Error removing map:', e);
            }
            mapRef.current = null;
        }

        // Limpiar contenedor DOM
        if (mapContainerRef.current) {
            mapContainerRef.current.innerHTML = '';
        }

        // Pequeño delay para asegurar que el contenedor esté listo
        initTimeoutRef.current = setTimeout(() => {
            if (!mapContainerRef.current) {
                isInitializingRef.current = false;
                return;
            }

            try {
                logger.info('RouteMapComponent: Creando instancia del mapa Leaflet');
                // Crear mapa con configuración mejorada
                mapRef.current = L.map(mapContainerRef.current, {
                    center: center,
                    zoom: zoom,
                    zoomControl: true,
                    attributionControl: true,
                    scrollWheelZoom: true,
                    doubleClickZoom: true,
                    boxZoom: true,
                    keyboard: true,
                    dragging: true,
                    touchZoom: true,
                    zoomAnimation: true,
                    fadeAnimation: true,
                    markerZoomAnimation: true
                });

                // Agregar capa de tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                    minZoom: 1
                }).addTo(mapRef.current);

                logger.info('RouteMapComponent: Capa de tiles añadida al mapa');

                // Agregar marcador de inicio
                if (route.length > 0) {
                    const startIcon = createCustomIcon('#4caf50', 'start');
                    const startPoint = route[0];
                    if (startPoint && startPoint.lat && startPoint.lng) {
                        const timestamp = startPoint.timestamp ?
                            (startPoint.timestamp instanceof Date ?
                                startPoint.timestamp.toLocaleString() :
                                new Date(startPoint.timestamp).toLocaleString()) :
                            'N/A';

                        L.marker([startPoint.lat, startPoint.lng], { icon: startIcon })
                            .addTo(mapRef.current)
                            .bindPopup(`
                                <div>
                                    <h4>🚀 Inicio de ruta</h4>
                                    <p><strong>Vehículo:</strong> ${vehicleName}</p>
                                    <p><strong>Hora:</strong> ${timestamp}</p>
                                    <p><strong>Velocidad:</strong> ${(startPoint.speed || 0).toFixed(1)} km/h</p>
                                </div>
                            `);
                    }
                }

                // Agregar marcador de fin
                if (route.length > 1) {
                    const endIcon = createCustomIcon('#f44336', 'end');
                    const lastPoint = route[route.length - 1];
                    if (lastPoint && lastPoint.lat && lastPoint.lng) {
                        const endTimestamp = lastPoint.timestamp ?
                            (lastPoint.timestamp instanceof Date ?
                                lastPoint.timestamp.toLocaleString() :
                                new Date(lastPoint.timestamp).toLocaleString()) :
                            'N/A';

                        L.marker([lastPoint.lat, lastPoint.lng], { icon: endIcon })
                            .addTo(mapRef.current)
                            .bindPopup(`
                                <div>
                                    <h4>🏁 Fin de ruta</h4>
                                    <p><strong>Vehículo:</strong> ${vehicleName}</p>
                                    <p><strong>Hora:</strong> ${endTimestamp}</p>
                                    <p><strong>Velocidad:</strong> ${(lastPoint.speed || 0).toFixed(1)} km/h</p>
                                </div>
                            `);
                    }
                }

                // Agregar línea de ruta
                if (route.length > 1) {
                    const routeCoordinates = route.map(point => [point.lat, point.lng] as [number, number]);
                    L.polyline(routeCoordinates, {
                        color: '#1976d2',
                        weight: 3,
                        opacity: 0.9,
                        smoothFactor: 1.0
                    }).addTo(mapRef.current);

                    logger.info('RouteMapComponent: Ruta añadida al mapa', {
                        routePoints: routeCoordinates.length,
                        firstPoint: routeCoordinates[0],
                        lastPoint: routeCoordinates[routeCoordinates.length - 1],
                        color: '#1976d2',
                        weight: 3
                    });

                    // Ajustar vista para mostrar toda la ruta
                    if (routeCoordinates.length > 0) {
                        const group = L.featureGroup();
                        group.addLayer(L.polyline(routeCoordinates));
                        const routeBounds = group.getBounds().pad(0.1);
                        mapRef.current.fitBounds(routeBounds);

                        // Guardar bounds para zoom out posterior
                        window.routeBounds = routeBounds;
                    }
                }

                // Prevenir cierre automático de popups
                if (mapRef.current) {
                    // Desactivar scroll zoom cuando hay popup abierto
                    mapRef.current.on('popupopen', () => {
                        if (mapRef.current) {
                            mapRef.current.scrollWheelZoom.disable();
                        }
                    });

                    mapRef.current.on('popupclose', () => {
                        if (mapRef.current) {
                            mapRef.current.scrollWheelZoom.enable();
                        }
                    });
                }

                // Agregar eventos si existen
                logger.info('RouteMapComponent: Añadiendo eventos al mapa', {
                    eventsCount: events.length
                });
                events.forEach(event => {
                    if (event.lat && event.lng) {
                        const eventIcon = createCustomIcon('#ff9800', 'alert');
                        const eventTimestamp = event.timestamp ?
                            (event.timestamp instanceof Date ?
                                event.timestamp.toLocaleString() :
                                new Date(event.timestamp).toLocaleString()) :
                            'N/A';

                        const marker = L.marker([event.lat, event.lng], { icon: eventIcon });
                        if (mapRef.current) {
                            marker.addTo(mapRef.current);
                        }

                        const popup = L.popup({
                            autoClose: false, // No cerrar automáticamente
                            closeOnClick: false, // No cerrar al hacer clic en el mapa
                            className: 'custom-event-popup', // Clase CSS personalizada
                            maxWidth: 450, // Ancho máximo del popup
                            maxHeight: 600, // Altura máxima del popup
                            keepInView: true, // Mantener popup visible
                            closeButton: false, // No mostrar botón X por defecto
                            autoPan: false, // No mover el mapa automáticamente
                            autoPanPaddingTopLeft: [0, 0],
                            autoPanPaddingBottomRight: [0, 0]
                        }).setContent(`
                                <div style="
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    max-width: 400px;
                                    background: white;
                                    border-radius: 12px;
                                    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                                    overflow: hidden;
                                    border: 2px solid #e0e0e0;
                                ">
                                    <!-- Header con gradiente -->
                                    <div style="
                                        background: linear-gradient(135deg, 
                                            ${event.severity === 'critical' ? '#ff4444' :
                                event.severity === 'high' ? '#ff8800' : '#ffaa00'}, 
                                            ${event.severity === 'critical' ? '#cc0000' :
                                event.severity === 'high' ? '#cc6600' : '#cc8800'});
                                        color: white;
                                        padding: 16px 20px;
                                        text-align: center;
                                        font-weight: bold;
                                        font-size: 18px;
                                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                    ">
                                        🚨 ${event.type === 'rollover_risk' ? 'Riesgo de Vuelco' :
                                event.type === 'rollover_imminent' ? 'Vuelco Inminente' :
                                    event.type === 'dangerous_drift' ? 'Deriva Peligrosa' :
                                        event.type === 'abrupt_maneuver' ? 'Maniobra Brusca' :
                                            event.type}
                                    </div>
                                    
                                    <!-- Severidad -->
                                    <div style="
                                        padding: 12px 20px;
                                        text-align: center;
                                        font-weight: bold;
                                        font-size: 14px;
                                        color: ${event.severity === 'critical' ? '#d32f2f' :
                                event.severity === 'high' ? '#f57c00' : '#388e3c'};
                                        background: ${event.severity === 'critical' ? '#ffebee' :
                                event.severity === 'high' ? '#fff3e0' : '#e8f5e8'};
                                        border-bottom: 1px solid #eee;
                                    ">
                                        Severidad: ${event.severity.toUpperCase()}
                                    </div>
                                    
                                    <!-- Hora -->
                                    <div style="
                                        padding: 8px 20px;
                                        text-align: center;
                                        color: #666;
                                        font-size: 13px;
                                        border-bottom: 1px solid #eee;
                                    ">
                                        🕐 Hora: ${eventTimestamp}
                                    </div>
                                    
                                    <!-- Datos técnicos en grid -->
                                    <div style="
                                        padding: 16px 20px;
                                        display: grid;
                                        grid-template-columns: 1fr 1fr;
                                        gap: 12px;
                                    ">
                                        <!-- Índice Estabilidad -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${(event.si || 0) < 0.30 ? '#ffebee' : (event.si || 0) < 0.50 ? '#fff3e0' : '#e8f5e8'};
                                            border: 2px solid ${(event.si || 0) < 0.30 ? '#f44336' : (event.si || 0) < 0.50 ? '#ff9800' : '#4caf50'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">ÍNDICE ESTABILIDAD</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${(event.si || 0) < 0.30 ? '#d32f2f' : (event.si || 0) < 0.50 ? '#f57c00' : '#388e3c'};">
                                                ${((event.si || 0) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        
                                        <!-- Roll -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${Math.abs(event.roll || 0) > 10 ? '#ffebee' : '#f5f5f5'};
                                            border: 2px solid ${Math.abs(event.roll || 0) > 10 ? '#f44336' : '#e0e0e0'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">ROLL</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${Math.abs(event.roll || 0) > 10 ? '#d32f2f' : '#666'};">
                                                ${(event.roll || 0).toFixed(1)}°
                                            </div>
                                        </div>
                                        
                                        <!-- Aceleración Lateral -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${Math.abs(event.ay || 0) > 3000 ? '#ffebee' : '#f5f5f5'};
                                            border: 2px solid ${Math.abs(event.ay || 0) > 3000 ? '#f44336' : '#e0e0e0'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">ACEL. LATERAL</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${Math.abs(event.ay || 0) > 3000 ? '#d32f2f' : '#666'};">
                                                ${(() => {
                                const ayValue = event.ay || 0;
                                // Validar valor físicamente posible (máximo 50 m/s² = 5g)
                                if (Math.abs(ayValue) > 50000) {
                                    return '❌ Error';
                                }
                                return (ayValue / 1000).toFixed(2) + ' m/s²';
                            })()}
                                            </div>
                                        </div>
                                        
                                        <!-- Giro (gx) -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${Math.abs(event.gx || 0) > 45 ? '#ffebee' : '#f5f5f5'};
                                            border: 2px solid ${Math.abs(event.gx || 0) > 45 ? '#f44336' : '#e0e0e0'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">GIRO (gx)</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${Math.abs(event.gx || 0) > 45 ? '#d32f2f' : '#666'};">
                                                ${(() => {
                                const gxValue = event.gx || 0;
                                // Validar valor físicamente posible (máximo 360°/s = 1 vuelta completa por segundo)
                                if (Math.abs(gxValue) > 360) {
                                    return '❌ Error';
                                }
                                return gxValue.toFixed(1) + '°/s';
                            })()}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Velocidad y Rotativo -->
                                    <div style="
                                        padding: 16px 20px;
                                        border-top: 1px solid #eee;
                                        display: grid;
                                        grid-template-columns: 1fr 1fr;
                                        gap: 12px;
                                    ">
                                        <!-- Velocidad -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${(event.speed || 0) > 80 ? '#ffebee' : '#e3f2fd'};
                                            border: 2px solid ${(event.speed || 0) > 80 ? '#f44336' : '#2196f3'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">VELOCIDAD</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${(event.speed || 0) > 80 ? '#d32f2f' : '#1976d2'};">
                                                ${(event.speed || 0).toFixed(1)} km/h
                                            </div>
                                        </div>
                                        
                                        <!-- Rotativo -->
                                        <div style="
                                            padding: 8px 12px;
                                            border-radius: 8px;
                                            text-align: center;
                                            background: ${event.rotativoState === 1 ? '#ffebee' : '#e8f5e8'};
                                            border: 2px solid ${event.rotativoState === 1 ? '#f44336' : '#4caf50'};
                                        ">
                                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">ROTATIVO</div>
                                            <div style="font-size: 16px; font-weight: bold; color: ${event.rotativoState === 1 ? '#d32f2f' : '#388e3c'};">
                                                ${event.rotativoState === 1 ? '🔴 ENCENDIDO' : '🟢 APAGADO'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- GPS Correlacionado -->
                                    <div style="
                                        padding: 8px 20px;
                                        text-align: center;
                                        color: #666;
                                        font-size: 12px;
                                        border-top: 1px solid #eee;
                                        background: #f8f9fa;
                                        position: relative;
                                    ">
                                        📍 GPS correlacionado: ±${Math.floor((event.gpsTimeDiff || 0) / 1000)}s
                                        
                                        <!-- Botón cerrar -->
                                        <button onclick="
                                            try {
                                                // Cerrar popup
                                                if (window.currentPopup) {
                                                    window.currentPopup.remove();
                                                    window.currentPopup = null;
                                                }
                                                window.popupIsOpen = false;
                                                
                                                // Zoom out a la vista completa
                                                setTimeout(() => {
                                                    if (window.mapInstance && window.routeBounds && !window.mapInstance._removed) {
                                                        window.mapInstance.fitBounds(window.routeBounds, { 
                                                            padding: [20, 20],
                                                            animate: true,
                                                            duration: 0.8
                                                        });
                                                    }
                                                }, 100);
                                            } catch (error) {
                                                console.warn('Error cerrando popup:', error);
                                            }
                                        " style="
                                            position: absolute;
                                            top: 4px;
                                            right: 8px;
                                            background: #f44336;
                                            color: white;
                                            border: none;
                                            border-radius: 50%;
                                            width: 24px;
                                            height: 24px;
                                            cursor: pointer;
                                            font-size: 14px;
                                            font-weight: bold;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                        " title="Cerrar">×</button>
                                    </div>
                                </div>
                            `);

                        // Vincular popup al marker con configuración mejorada
                        marker.bindPopup(popup, {
                            autoClose: false,
                            closeOnClick: false,
                            autoPan: true,
                            keepInView: true,
                            closeButton: false,
                            maxWidth: 450,
                            maxHeight: 600,
                            className: 'custom-event-popup'
                        });

                        // Manejar el evento de apertura del popup
                        marker.on('popupopen', () => {
                            try {
                                // Guardar referencias globales
                                window.currentPopup = popup;
                                window.mapInstance = mapRef.current || undefined;
                                window.popupIsOpen = true;

                                // Zoom al evento con mejor posicionamiento
                                if (mapRef.current && event.lat && event.lng) {
                                    // Pequeño delay para asegurar que el popup se renderice
                                    setTimeout(() => {
                                        if (mapRef.current) {
                                            mapRef.current.setView([event.lat!, event.lng!], 16, {
                                                animate: true,
                                                duration: 0.5
                                            });
                                        }
                                    }, 100);
                                }
                            } catch (error) {
                                console.warn('⚠️ Error en zoom al evento:', error);
                            }
                        });

                        // Manejar el evento de cierre del popup
                        marker.on('popupclose', () => {
                            try {
                                // Limpiar referencias globales
                                window.currentPopup = undefined;
                                window.popupIsOpen = false;
                            } catch (error) {
                                console.warn('⚠️ Error cerrando popup:', error);
                            }
                        });
                    }
                });

                // Forzar redibujado del mapa con mejor manejo de errores
                setTimeout(() => {
                    try {
                        if (mapRef.current) {
                            mapRef.current.invalidateSize();
                        }
                    } catch (error) {
                        logger.warn('Error invalidando tamaño del mapa', { error });
                    }
                }, 100);
            } catch (error) {
                logger.error('Error inicializando mapa', { error });
            } finally {
                logger.info('RouteMapComponent: Inicialización del mapa completada');
                isInitializingRef.current = false;
            }
        }, 100);

        // Cleanup
        return () => {
            logger.info('RouteMapComponent: Limpiando mapa');

            // Cancelar timeout pendiente
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = null;
            }

            // Limpiar mapa
            if (mapRef.current) {
                try {
                    mapRef.current.remove();
                } catch (e) {
                    logger.warn('Error removing map on cleanup:', e);
                }
                mapRef.current = null;
            }

            // Resetear el flag de inicialización para permitir re-inicialización
            isInitializingRef.current = false;
        };
    }, []); // Solo inicializar una vez, sin dependencias que causen re-renders

    return (
        <Box
            ref={mapContainerRef}
            sx={{
                width: '100%',
                height: height,
                position: 'relative'
            }}
        />
    );
};

export default RouteMapComponent;