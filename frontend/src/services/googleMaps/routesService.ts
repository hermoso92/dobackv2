/**
 * Google Maps Routes API Service
 * 
 * Cálculo de rutas optimizadas, distancias y tiempos de viaje
 * Reemplaza Directions API + Distance Matrix API con mejor rendimiento
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng, toLatLngLiteral } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface RouteRequest {
    origin: LatLng;
    destination: LatLng;
    waypoints?: LatLng[];
    travelMode?: 'DRIVE' | 'BICYCLE' | 'WALK' | 'TWO_WHEELER' | 'TRANSIT';
    routingPreference?: 'TRAFFIC_AWARE' | 'TRAFFIC_AWARE_OPTIMAL' | 'TRAFFIC_UNAWARE';
    departureTime?: Date;
    computeAlternativeRoutes?: boolean;
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
}

export interface RouteResponse {
    routes: RouteDetail[];
    status: string;
}

export interface RouteDetail {
    distanceMeters: number;
    duration: string;  // ISO 8601 duration (ej: "PT1H30M")
    durationSeconds: number;
    polyline: string;  // Encoded polyline
    legs: RouteLeg[];
    warnings?: string[];
    viewport?: {
        low: LatLng;
        high: LatLng;
    };
}

export interface RouteLeg {
    distanceMeters: number;
    duration: string;
    durationSeconds: number;
    startLocation: LatLng;
    endLocation: LatLng;
    steps: RouteStep[];
}

export interface RouteStep {
    distanceMeters: number;
    duration: string;
    durationSeconds: number;
    startLocation: LatLng;
    endLocation: LatLng;
    navigationInstruction?: {
        maneuver?: string;
        instructions?: string;
    };
    polyline: string;
}

export interface DistanceMatrixRequest {
    origins: LatLng[];
    destinations: LatLng[];
    travelMode?: 'DRIVE' | 'BICYCLE' | 'WALK' | 'TWO_WHEELER' | 'TRANSIT';
    departureTime?: Date;
}

export interface DistanceMatrixResponse {
    rows: Array<{
        elements: Array<{
            distanceMeters: number;
            duration: string;
            durationSeconds: number;
            status: string;
        }>;
    }>;
}

// ===========================
// SERVICIO DE ROUTES
// ===========================

class GoogleRoutesService extends GoogleMapsServiceBase {
    
    /**
     * Calcula ruta entre origen y destino
     */
    async computeRoute(request: RouteRequest): Promise<RouteDetail | null> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.ROUTES);
        
        const body = {
            origin: {
                location: {
                    latLng: toLatLngLiteral(request.origin.lat, request.origin.lng),
                },
            },
            destination: {
                location: {
                    latLng: toLatLngLiteral(request.destination.lat, request.destination.lng),
                },
            },
            travelMode: request.travelMode || 'DRIVE',
            routingPreference: request.routingPreference || 'TRAFFIC_AWARE_OPTIMAL',
            computeAlternativeRoutes: request.computeAlternativeRoutes || false,
            routeModifiers: {
                avoidTolls: request.avoidTolls || false,
                avoidHighways: request.avoidHighways || false,
                avoidFerries: request.avoidFerries || false,
            },
            languageCode: GOOGLE_MAPS_CONFIG.LANGUAGE,
            units: 'METRIC',
        };
        
        // Añadir waypoints si existen
        if (request.waypoints && request.waypoints.length > 0) {
            (body as any).intermediates = request.waypoints.map((wp) => ({
                location: {
                    latLng: toLatLngLiteral(wp.lat, wp.lng),
                },
            }));
        }
        
        // Añadir departure time si existe
        if (request.departureTime) {
            (body as any).departureTime = request.departureTime.toISOString();
        }
        
        try {
            const response = await this.fetchAPI<any>(
                GOOGLE_MAPS_CONFIG.ROUTES_API,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs,routes.viewport,routes.warnings',
                    },
                    body: JSON.stringify(body),
                },
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.ROUTES
            );
            
            if (!response.routes || response.routes.length === 0) {
                logger.warn('Routes: No se encontró ruta', { request });
                return null;
            }
            
            return this.parseRoute(response.routes[0]);
            
        } catch (error: any) {
            logger.error('Routes: Error al calcular ruta', {
                request,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Calcula múltiples rutas alternativas
     */
    async computeAlternativeRoutes(request: RouteRequest): Promise<RouteDetail[]> {
        this.checkApiKey();
        
        const routeRequest = {
            ...request,
            computeAlternativeRoutes: true,
        };
        
        try {
            const result = await this.computeRoute(routeRequest);
            return result ? [result] : [];
            
        } catch (error: any) {
            logger.error('Routes: Error al calcular rutas alternativas', {
                request,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Calcula distancia y tiempo entre origen y destino (simplificado)
     */
    async getDistanceAndDuration(
        origin: LatLng,
        destination: LatLng,
        travelMode: 'DRIVE' | 'BICYCLE' | 'WALK' = 'DRIVE'
    ): Promise<{ distance: number; duration: number } | null> {
        const route = await this.computeRoute({
            origin,
            destination,
            travelMode,
            routingPreference: 'TRAFFIC_UNAWARE', // Más rápido sin tráfico
        });
        
        if (!route) {
            return null;
        }
        
        return {
            distance: route.distanceMeters,
            duration: route.durationSeconds,
        };
    }
    
    /**
     * Decodifica polyline a array de coordenadas
     */
    decodePolyline(encoded: string): LatLng[] {
        const points: LatLng[] = [];
        let index = 0;
        let lat = 0;
        let lng = 0;
        
        while (index < encoded.length) {
            let b;
            let shift = 0;
            let result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
            lat += dlat;
            
            shift = 0;
            result = 0;
            
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
            lng += dlng;
            
            points.push({
                lat: lat / 1e5,
                lng: lng / 1e5,
            });
        }
        
        return points;
    }
    
    /**
     * Parsea duración ISO 8601 a segundos
     */
    private parseDuration(duration: string): number {
        // Formato: PT1H30M45S
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
        const matches = duration.match(regex);
        
        if (!matches) {
            return 0;
        }
        
        const hours = parseInt(matches[1] || '0', 10);
        const minutes = parseInt(matches[2] || '0', 10);
        const seconds = parseFloat(matches[3] || '0');
        
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    /**
     * Parsea ruta de la respuesta de la API
     */
    private parseRoute(route: any): RouteDetail {
        const durationSeconds = this.parseDuration(route.duration || 'PT0S');
        
        return {
            distanceMeters: route.distanceMeters || 0,
            duration: route.duration || 'PT0S',
            durationSeconds,
            polyline: route.polyline?.encodedPolyline || '',
            legs: (route.legs || []).map((leg: any) => this.parseLeg(leg)),
            warnings: route.warnings || [],
            viewport: route.viewport
                ? {
                      low: {
                          lat: route.viewport.low.latitude,
                          lng: route.viewport.low.longitude,
                      },
                      high: {
                          lat: route.viewport.high.latitude,
                          lng: route.viewport.high.longitude,
                      },
                  }
                : undefined,
        };
    }
    
    /**
     * Parsea leg de la ruta
     */
    private parseLeg(leg: any): RouteLeg {
        const durationSeconds = this.parseDuration(leg.duration || 'PT0S');
        
        return {
            distanceMeters: leg.distanceMeters || 0,
            duration: leg.duration || 'PT0S',
            durationSeconds,
            startLocation: {
                lat: leg.startLocation?.latLng?.latitude || 0,
                lng: leg.startLocation?.latLng?.longitude || 0,
            },
            endLocation: {
                lat: leg.endLocation?.latLng?.latitude || 0,
                lng: leg.endLocation?.latLng?.longitude || 0,
            },
            steps: (leg.steps || []).map((step: any) => this.parseStep(step)),
        };
    }
    
    /**
     * Parsea step de la ruta
     */
    private parseStep(step: any): RouteStep {
        const durationSeconds = this.parseDuration(step.duration || 'PT0S');
        
        return {
            distanceMeters: step.distanceMeters || 0,
            duration: step.duration || 'PT0S',
            durationSeconds,
            startLocation: {
                lat: step.startLocation?.latLng?.latitude || 0,
                lng: step.startLocation?.latLng?.longitude || 0,
            },
            endLocation: {
                lat: step.endLocation?.latLng?.latitude || 0,
                lng: step.endLocation?.latLng?.longitude || 0,
            },
            navigationInstruction: step.navigationInstruction,
            polyline: step.polyline?.encodedPolyline || '',
        };
    }
}

// Exportar instancia única (singleton)
export const googleRoutesService = new GoogleRoutesService();
export default googleRoutesService;

