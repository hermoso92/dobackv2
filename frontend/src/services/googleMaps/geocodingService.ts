/**
 * Google Maps Geocoding API Service
 * 
 * Convierte coordenadas a direcciones y viceversa
 * Reemplaza OpenStreetMap Nominatim con mejor rendimiento y precisión
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface GeocodingResult {
    formattedAddress: string;
    street?: string;
    streetNumber?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    location: LatLng;
    placeId?: string;
    types: string[];
}

export interface ReverseGeocodingOptions {
    resultType?: string[];  // ej: ['street_address', 'route']
    locationType?: string[];  // ej: ['ROOFTOP', 'RANGE_INTERPOLATED']
}

interface GoogleGeocodingResponse {
    results: Array<{
        formatted_address: string;
        address_components: Array<{
            long_name: string;
            short_name: string;
            types: string[];
        }>;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
            location_type: string;
        };
        place_id: string;
        types: string[];
    }>;
    status: string;
    error_message?: string;
}

// ===========================
// SERVICIO DE GEOCODING
// ===========================

class GoogleGeocodingService extends GoogleMapsServiceBase {
    
    /**
     * Convierte coordenadas a dirección (Reverse Geocoding)
     */
    async reverseGeocode(
        lat: number,
        lng: number,
        options: ReverseGeocodingOptions = {}
    ): Promise<GeocodingResult | null> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.GEOCODING);
        
        // Construir URL
        const params = new URLSearchParams({
            latlng: `${lat},${lng}`,
            key: this.apiKey,
            language: GOOGLE_MAPS_CONFIG.LANGUAGE,
            region: GOOGLE_MAPS_CONFIG.REGION,
        });
        
        if (options.resultType && options.resultType.length > 0) {
            params.append('result_type', options.resultType.join('|'));
        }
        
        if (options.locationType && options.locationType.length > 0) {
            params.append('location_type', options.locationType.join('|'));
        }
        
        const url = `${GOOGLE_MAPS_CONFIG.REVERSE_GEOCODING_API}?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<GoogleGeocodingResponse>(
                url,
                {},
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.GEOCODING
            );
            
            if (response.status !== 'OK' || !response.results || response.results.length === 0) {
                logger.warn('Geocoding: No se encontraron resultados', {
                    lat,
                    lng,
                    status: response.status,
                });
                return null;
            }
            
            // Tomar el primer resultado (más preciso)
            return this.parseGeocodingResult(response.results[0]);
            
        } catch (error: any) {
            logger.error('Geocoding: Error en reverse geocoding', {
                lat,
                lng,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Convierte dirección a coordenadas (Forward Geocoding)
     */
    async geocode(address: string): Promise<GeocodingResult | null> {
        this.checkApiKey();
        
        if (!address || address.trim().length === 0) {
            return null;
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.GEOCODING);
        
        // Construir URL
        const params = new URLSearchParams({
            address: address.trim(),
            key: this.apiKey,
            language: GOOGLE_MAPS_CONFIG.LANGUAGE,
            region: GOOGLE_MAPS_CONFIG.REGION,
        });
        
        const url = `${GOOGLE_MAPS_CONFIG.GEOCODING_API}?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<GoogleGeocodingResponse>(
                url,
                {},
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.GEOCODING
            );
            
            if (response.status !== 'OK' || !response.results || response.results.length === 0) {
                logger.warn('Geocoding: No se encontraron resultados para la dirección', {
                    address,
                    status: response.status,
                });
                return null;
            }
            
            return this.parseGeocodingResult(response.results[0]);
            
        } catch (error: any) {
            logger.error('Geocoding: Error en geocoding', {
                address,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Batch Reverse Geocoding: múltiples coordenadas en una sola llamada
     * Optimizado para listas grandes de puntos GPS
     */
    async batchReverseGeocode(
        coordinates: Array<{ lat: number; lng: number }>,
        options: ReverseGeocodingOptions = {}
    ): Promise<Map<string, GeocodingResult | null>> {
        const results = new Map<string, GeocodingResult | null>();
        
        // Procesar en paralelo con límite de concurrencia
        const batchSize = 10;
        
        for (let i = 0; i < coordinates.length; i += batchSize) {
            const batch = coordinates.slice(i, i + batchSize);
            
            const promises = batch.map(async ({ lat, lng }) => {
                const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
                const result = await this.reverseGeocode(lat, lng, options);
                results.set(key, result);
            });
            
            await Promise.all(promises);
        }
        
        return results;
    }
    
    /**
     * Obtiene solo el nombre de la calle (optimizado para UI)
     */
    async getStreetName(lat: number, lng: number): Promise<string> {
        const result = await this.reverseGeocode(lat, lng, {
            resultType: ['street_address', 'route'],
        });
        
        if (!result) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
        
        // Priorizar: calle + número > calle > dirección formateada
        if (result.street && result.streetNumber) {
            return `${result.street} ${result.streetNumber}${result.city ? ', ' + result.city : ''}`;
        }
        
        if (result.street) {
            return `${result.street}${result.city ? ', ' + result.city : ''}`;
        }
        
        return result.formattedAddress;
    }
    
    /**
     * Parsea el resultado de la API a nuestro formato
     */
    private parseGeocodingResult(result: any): GeocodingResult {
        const addressComponents = result.address_components || [];
        
        // Extraer componentes de la dirección
        const getComponent = (types: string[]): string | undefined => {
            const component = addressComponents.find((comp: any) =>
                types.some((type) => comp.types.includes(type))
            );
            return component?.long_name;
        };
        
        const getShortComponent = (types: string[]): string | undefined => {
            const component = addressComponents.find((comp: any) =>
                types.some((type) => comp.types.includes(type))
            );
            return component?.short_name;
        };
        
        return {
            formattedAddress: result.formatted_address,
            street: getComponent(['route', 'street_address']),
            streetNumber: getComponent(['street_number']),
            city: getComponent(['locality', 'administrative_area_level_3']),
            province: getComponent(['administrative_area_level_2']),
            postalCode: getComponent(['postal_code']),
            country: getShortComponent(['country']),
            location: {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
            },
            placeId: result.place_id,
            types: result.types || [],
        };
    }
}

// Exportar instancia única (singleton)
export const googleGeocodingService = new GoogleGeocodingService();
export default googleGeocodingService;

