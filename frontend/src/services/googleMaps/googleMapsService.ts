/**
 * Google Maps Services - Exportación Principal
 * 
 * Punto de entrada único para todos los servicios de Google Maps Platform
 * 
 * Uso:
 * ```typescript
 * import { googleMaps } from '@/services/googleMaps/googleMapsService';
 * 
 * // Geocoding
 * const address = await googleMaps.geocoding.reverseGeocode(lat, lng);
 * 
 * // Routes
 * const route = await googleMaps.routes.computeRoute({ origin, destination });
 * 
 * // Roads (snap-to-road)
 * const snapped = await googleMaps.roads.snapToRoads(gpsPoints);
 * 
 * // Elevation
 * const profile = await googleMaps.elevation.getElevationProfile(path);
 * 
 * // Places
 * const places = await googleMaps.places.searchNearby({ location, radius: 1000 });
 * ```
 */

import googleGeocodingService from './geocodingService';
import googleRoutesService from './routesService';
import googleRoadsService from './roadsService';
import googleElevationService from './elevationService';
import googlePlacesService from './placesService';
import googleDistanceMatrixService from './distanceMatrixService';
import googleTimeZoneService from './timeZoneService';
import googleWeatherService from './weatherService';

// Exportar servicios individuales
export { googleGeocodingService } from './geocodingService';
export { googleRoutesService } from './routesService';
export { googleRoadsService } from './roadsService';
export { googleElevationService } from './elevationService';
export { googlePlacesService } from './placesService';
export { googleDistanceMatrixService } from './distanceMatrixService';
export { googleTimeZoneService } from './timeZoneService';
export { googleWeatherService } from './weatherService';

// Exportar tipos
export type {
    GeocodingResult,
    ReverseGeocodingOptions,
} from './geocodingService';

export type {
    RouteRequest,
    RouteResponse,
    RouteDetail,
    RouteLeg,
    RouteStep,
    DistanceMatrixRequest,
    DistanceMatrixResponse,
} from './routesService';

export type {
    SnappedPoint,
    SpeedLimit,
} from './roadsService';

export type {
    ElevationPoint,
    ElevationProfile,
} from './elevationService';

export type {
    Place,
    PlaceSearchRequest,
    NearbySearchRequest,
} from './placesService';

export type {
    DistanceMatrixRequest,
    DistanceMatrixResponse,
    DistanceMatrixElement,
    OptimizedDispatch,
} from './distanceMatrixService';

export type {
    TimeZoneResult,
    LocalTime,
} from './timeZoneService';

export type {
    WeatherCondition,
    WeatherAlert,
} from './weatherService';

// Exportar utilidades
export {
    LatLng,
    LatLngLiteral,
    Bounds,
    GoogleMapsError,
    toLatLngLiteral,
    fromLatLngLiteral,
    isValidCoordinate,
    haversineDistance,
    formatDuration,
    formatDistance,
} from './index';

// ===========================
// SERVICIO UNIFICADO
// ===========================

/**
 * Servicio unificado de Google Maps Platform
 * Agrupa todos los servicios en un solo objeto para facilitar el uso
 */
export const googleMaps = {
    /**
     * Geocoding: Conversión entre coordenadas y direcciones
     */
    geocoding: googleGeocodingService,
    
    /**
     * Routes: Cálculo de rutas optimizadas
     */
    routes: googleRoutesService,
    
    /**
     * Roads: Snap-to-road y límites de velocidad
     */
    roads: googleRoadsService,
    
    /**
     * Elevation: Datos de elevación y perfiles de altitud
     */
    elevation: googleElevationService,
    
    /**
     * Places: Búsqueda de lugares y puntos de interés
     */
    places: googlePlacesService,
    
    /**
     * Distance Matrix: Distancias y tiempos entre múltiples puntos
     */
    distanceMatrix: googleDistanceMatrixService,
    
    /**
     * Time Zone: Conversión de timestamps a hora local
     */
    timeZone: googleTimeZoneService,
    
    /**
     * Weather: Condiciones meteorológicas
     */
    weather: googleWeatherService,
    
    /**
     * Limpia todos los caches de todos los servicios
     */
    clearAllCaches(): void {
        googleGeocodingService.clearCache();
        googleRoutesService.clearCache();
        googleRoadsService.clearCache();
        googleElevationService.clearCache();
        googlePlacesService.clearCache();
        googleDistanceMatrixService.clearCache();
        googleTimeZoneService.clearCache();
        googleWeatherService.clearCache();
    },
    
    /**
     * Limpia caches antiguos de todos los servicios
     */
    cleanOldCaches(maxAge: number): void {
        googleGeocodingService.cleanOldCache(maxAge);
        googleRoutesService.cleanOldCache(maxAge);
        googleRoadsService.cleanOldCache(maxAge);
        googleElevationService.cleanOldCache(maxAge);
        googlePlacesService.cleanOldCache(maxAge);
        googleDistanceMatrixService.cleanOldCache(maxAge);
        googleTimeZoneService.cleanOldCache(maxAge);
        googleWeatherService.cleanOldCache(maxAge);
    },
} as const;

// Exportar como default también
export default googleMaps;

