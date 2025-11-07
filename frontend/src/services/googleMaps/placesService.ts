/**
 * Google Maps Places API (New) Service
 * 
 * Búsqueda de lugares, puntos de interés y detalles
 * Versión nueva de la API con más de 200 millones de lugares
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface Place {
    id: string;
    displayName: string;
    formattedAddress?: string;
    location: LatLng;
    types?: string[];
    rating?: number;
    userRatingCount?: number;
    businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
    priceLevel?: 'FREE' | 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE' | 'VERY_EXPENSIVE';
    websiteUri?: string;
    phoneNumber?: string;
    openingHours?: {
        openNow?: boolean;
        weekdayDescriptions?: string[];
    };
}

export interface PlaceSearchRequest {
    location?: LatLng;
    radius?: number; // En metros (máximo 50,000)
    query?: string;
    types?: string[]; // Ej: ['restaurant', 'cafe', 'parking']
    maxResultCount?: number; // Máximo 20
    rankPreference?: 'RELEVANCE' | 'DISTANCE';
}

export interface NearbySearchRequest {
    location: LatLng;
    radius: number; // En metros
    types?: string[];
    maxResultCount?: number; // Máximo 20
    rankPreference?: 'POPULARITY' | 'DISTANCE';
}

// ===========================
// SERVICIO DE PLACES
// ===========================

class GooglePlacesService extends GoogleMapsServiceBase {
    
    /**
     * Busca lugares cercanos a una ubicación
     */
    async searchNearby(request: NearbySearchRequest): Promise<Place[]> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.PLACES);
        
        const body: any = {
            locationRestriction: {
                circle: {
                    center: {
                        latitude: request.location.lat,
                        longitude: request.location.lng,
                    },
                    radius: Math.min(request.radius, 50000), // Máximo 50km
                },
            },
            maxResultCount: Math.min(request.maxResultCount || 20, 20),
            rankPreference: request.rankPreference || 'POPULARITY',
            languageCode: GOOGLE_MAPS_CONFIG.LANGUAGE,
        };
        
        if (request.types && request.types.length > 0) {
            body.includedTypes = request.types;
        }
        
        try {
            const response = await this.fetchAPI<any>(
                GOOGLE_MAPS_CONFIG.PLACES_NEARBY_API,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount',
                    },
                    body: JSON.stringify(body),
                },
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.PLACES
            );
            
            if (!response.places || response.places.length === 0) {
                return [];
            }
            
            return response.places.map((place: any) => this.parsePlace(place));
            
        } catch (error: any) {
            logger.error('Places: Error en búsqueda cercana', {
                request,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Busca lugares por texto
     */
    async searchText(query: string, location?: LatLng, radius?: number): Promise<Place[]> {
        this.checkApiKey();
        
        if (!query || query.trim().length === 0) {
            return [];
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.PLACES);
        
        const body: any = {
            textQuery: query.trim(),
            maxResultCount: 20,
            languageCode: GOOGLE_MAPS_CONFIG.LANGUAGE,
            regionCode: GOOGLE_MAPS_CONFIG.REGION,
        };
        
        if (location && radius) {
            body.locationBias = {
                circle: {
                    center: {
                        latitude: location.lat,
                        longitude: location.lng,
                    },
                    radius: Math.min(radius, 50000),
                },
            };
        }
        
        try {
            const response = await this.fetchAPI<any>(
                `${GOOGLE_MAPS_CONFIG.PLACES_API}:searchText`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount',
                    },
                    body: JSON.stringify(body),
                },
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.PLACES
            );
            
            if (!response.places || response.places.length === 0) {
                return [];
            }
            
            return response.places.map((place: any) => this.parsePlace(place));
            
        } catch (error: any) {
            logger.error('Places: Error en búsqueda de texto', {
                query,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Obtiene detalles de un lugar por su ID
     */
    async getPlaceDetails(placeId: string): Promise<Place | null> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.PLACES);
        
        try {
            const response = await this.fetchAPI<any>(
                `${GOOGLE_MAPS_CONFIG.PLACES_API}/${placeId}`,
                {
                    method: 'GET',
                    headers: {
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,rating,userRatingCount,businessStatus,priceLevel,websiteUri,nationalPhoneNumber,currentOpeningHours',
                    },
                },
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.PLACES
            );
            
            return this.parsePlace(response);
            
        } catch (error: any) {
            logger.error('Places: Error al obtener detalles del lugar', {
                placeId,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Busca parkings cercanos a una ubicación
     * Útil para operaciones de flota
     */
    async findNearbyParkings(location: LatLng, radius = 1000): Promise<Place[]> {
        return this.searchNearby({
            location,
            radius,
            types: ['parking'],
            maxResultCount: 20,
            rankPreference: 'DISTANCE',
        });
    }
    
    /**
     * Busca gasolineras cercanas
     * Útil para planificación de rutas
     */
    async findNearbyGasStations(location: LatLng, radius = 5000): Promise<Place[]> {
        return this.searchNearby({
            location,
            radius,
            types: ['gas_station'],
            maxResultCount: 20,
            rankPreference: 'DISTANCE',
        });
    }
    
    /**
     * Busca talleres mecánicos cercanos
     * Útil para mantenimiento de flota
     */
    async findNearbyRepairShops(location: LatLng, radius = 5000): Promise<Place[]> {
        return this.searchNearby({
            location,
            radius,
            types: ['car_repair'],
            maxResultCount: 20,
            rankPreference: 'DISTANCE',
        });
    }
    
    /**
     * Busca lugares por categoría personalizada
     */
    async findByCategory(
        location: LatLng,
        categories: string[],
        radius = 5000
    ): Promise<Place[]> {
        return this.searchNearby({
            location,
            radius,
            types: categories,
            maxResultCount: 20,
            rankPreference: 'POPULARITY',
        });
    }
    
    /**
     * Parsea respuesta de lugar a nuestro formato
     */
    private parsePlace(place: any): Place {
        return {
            id: place.id,
            displayName: place.displayName?.text || 'Sin nombre',
            formattedAddress: place.formattedAddress,
            location: {
                lat: place.location?.latitude || 0,
                lng: place.location?.longitude || 0,
            },
            types: place.types || [],
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            businessStatus: place.businessStatus,
            priceLevel: place.priceLevel,
            websiteUri: place.websiteUri,
            phoneNumber: place.nationalPhoneNumber,
            openingHours: place.currentOpeningHours
                ? {
                      openNow: place.currentOpeningHours.openNow,
                      weekdayDescriptions: place.currentOpeningHours.weekdayDescriptions,
                  }
                : undefined,
        };
    }
}

// Exportar instancia única (singleton)
export const googlePlacesService = new GooglePlacesService();
export default googlePlacesService;

