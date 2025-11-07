/**
 * useGoogleMaps Hook
 * 
 * Hook de React para usar Google Maps APIs en componentes
 * Incluye estados de loading, error y caché
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { googleMaps } from '../services/googleMaps/googleMapsService';
import type {
    GeocodingResult,
    RouteDetail,
    SnappedPoint,
    ElevationProfile,
    Place,
} from '../services/googleMaps/googleMapsService';
import { logger } from '../utils/logger';

// ===========================
// TIPOS Y INTERFACES
// ===========================

interface UseGoogleMapsOptions {
    enabled?: boolean;
    cacheResults?: boolean;
}

interface GeocodingState {
    result: GeocodingResult | null;
    loading: boolean;
    error: Error | null;
}

interface RouteState {
    route: RouteDetail | null;
    loading: boolean;
    error: Error | null;
}

interface SnappedState {
    snappedPoints: SnappedPoint[];
    loading: boolean;
    error: Error | null;
}

interface ElevationState {
    profile: ElevationProfile | null;
    loading: boolean;
    error: Error | null;
}

interface PlacesState {
    places: Place[];
    loading: boolean;
    error: Error | null;
}

// ===========================
// HOOK: useGeocodingReverse
// ===========================

export function useGeocodingReverse(
    lat: number | null,
    lng: number | null,
    options: UseGoogleMapsOptions = {}
) {
    const { enabled = true, cacheResults = true } = options;
    
    const [state, setState] = useState<GeocodingState>({
        result: null,
        loading: false,
        error: null,
    });
    
    const cacheRef = useRef<Map<string, GeocodingResult>>(new Map());
    
    useEffect(() => {
        if (!enabled || lat === null || lng === null) {
            setState({ result: null, loading: false, error: null });
            return;
        }
        
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        
        // Verificar cache
        if (cacheResults && cacheRef.current.has(key)) {
            setState({
                result: cacheRef.current.get(key)!,
                loading: false,
                error: null,
            });
            return;
        }
        
        let cancelled = false;
        
        const fetchGeocode = async () => {
            setState(prev => ({ ...prev, loading: true, error: null }));
            
            try {
                const result = await googleMaps.geocoding.reverseGeocode(lat, lng);
                
                if (!cancelled) {
                    if (result && cacheResults) {
                        cacheRef.current.set(key, result);
                    }
                    
                    setState({
                        result,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error: any) {
                if (!cancelled) {
                    logger.error('useGeocodingReverse: Error', { lat, lng, error });
                    setState({
                        result: null,
                        loading: false,
                        error: error as Error,
                    });
                }
            }
        };
        
        fetchGeocode();
        
        return () => {
            cancelled = true;
        };
    }, [lat, lng, enabled, cacheResults]);
    
    return state;
}

// ===========================
// HOOK: useRoute
// ===========================

export function useRoute(
    originLat: number | null,
    originLng: number | null,
    destLat: number | null,
    destLng: number | null,
    options: UseGoogleMapsOptions = {}
) {
    const { enabled = true } = options;
    
    const [state, setState] = useState<RouteState>({
        route: null,
        loading: false,
        error: null,
    });
    
    const computeRoute = useCallback(async () => {
        if (!enabled || originLat === null || originLng === null || destLat === null || destLng === null) {
            return;
        }
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const route = await googleMaps.routes.computeRoute({
                origin: { lat: originLat, lng: originLng },
                destination: { lat: destLat, lng: destLng },
                travelMode: 'DRIVE',
                routingPreference: 'TRAFFIC_AWARE_OPTIMAL',
            });
            
            setState({
                route,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            logger.error('useRoute: Error', { error });
            setState({
                route: null,
                loading: false,
                error: error as Error,
            });
        }
    }, [originLat, originLng, destLat, destLng, enabled]);
    
    useEffect(() => {
        if (enabled && originLat && originLng && destLat && destLng) {
            computeRoute();
        }
    }, [originLat, originLng, destLat, destLng, enabled, computeRoute]);
    
    return { ...state, refetch: computeRoute };
}

// ===========================
// HOOK: useSnapToRoads
// ===========================

export function useSnapToRoads(
    path: Array<{ lat: number; lng: number }> | null,
    interpolate = false,
    options: UseGoogleMapsOptions = {}
) {
    const { enabled = true } = options;
    
    const [state, setState] = useState<SnappedState>({
        snappedPoints: [],
        loading: false,
        error: null,
    });
    
    const snapToRoads = useCallback(async () => {
        if (!enabled || !path || path.length === 0) {
            return;
        }
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const snappedPoints = await googleMaps.roads.snapToRoads(path, interpolate);
            
            setState({
                snappedPoints,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            logger.error('useSnapToRoads: Error', { error });
            setState({
                snappedPoints: [],
                loading: false,
                error: error as Error,
            });
        }
    }, [path, interpolate, enabled]);
    
    useEffect(() => {
        if (enabled && path && path.length > 0) {
            snapToRoads();
        }
    }, [path, interpolate, enabled, snapToRoads]);
    
    return { ...state, refetch: snapToRoads };
}

// ===========================
// HOOK: useElevationProfile
// ===========================

export function useElevationProfile(
    path: Array<{ lat: number; lng: number }> | null,
    samples = 100,
    options: UseGoogleMapsOptions = {}
) {
    const { enabled = true } = options;
    
    const [state, setState] = useState<ElevationState>({
        profile: null,
        loading: false,
        error: null,
    });
    
    const getProfile = useCallback(async () => {
        if (!enabled || !path || path.length < 2) {
            return;
        }
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const profile = await googleMaps.elevation.getElevationProfile(path, samples);
            
            setState({
                profile,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            logger.error('useElevationProfile: Error', { error });
            setState({
                profile: null,
                loading: false,
                error: error as Error,
            });
        }
    }, [path, samples, enabled]);
    
    useEffect(() => {
        if (enabled && path && path.length >= 2) {
            getProfile();
        }
    }, [path, samples, enabled, getProfile]);
    
    return { ...state, refetch: getProfile };
}

// ===========================
// HOOK: useNearbyPlaces
// ===========================

export function useNearbyPlaces(
    lat: number | null,
    lng: number | null,
    radius = 1000,
    types: string[] = [],
    options: UseGoogleMapsOptions = {}
) {
    const { enabled = true } = options;
    
    const [state, setState] = useState<PlacesState>({
        places: [],
        loading: false,
        error: null,
    });
    
    const searchNearby = useCallback(async () => {
        if (!enabled || lat === null || lng === null) {
            return;
        }
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const places = await googleMaps.places.searchNearby({
                location: { lat, lng },
                radius,
                types: types.length > 0 ? types : undefined,
                maxResultCount: 20,
                rankPreference: 'DISTANCE',
            });
            
            setState({
                places,
                loading: false,
                error: null,
            });
        } catch (error: any) {
            logger.error('useNearbyPlaces: Error', { error });
            setState({
                places: [],
                loading: false,
                error: error as Error,
            });
        }
    }, [lat, lng, radius, types, enabled]);
    
    useEffect(() => {
        if (enabled && lat !== null && lng !== null) {
            searchNearby();
        }
    }, [lat, lng, radius, JSON.stringify(types), enabled, searchNearby]);
    
    return { ...state, refetch: searchNearby };
}

// ===========================
// HOOK: useGoogleMaps (unificado)
// ===========================

/**
 * Hook unificado que proporciona acceso a todos los servicios de Google Maps
 */
export function useGoogleMaps() {
    return {
        geocoding: googleMaps.geocoding,
        routes: googleMaps.routes,
        roads: googleMaps.roads,
        elevation: googleMaps.elevation,
        places: googleMaps.places,
        clearAllCaches: googleMaps.clearAllCaches,
        cleanOldCaches: googleMaps.cleanOldCaches,
    };
}

export default useGoogleMaps;

