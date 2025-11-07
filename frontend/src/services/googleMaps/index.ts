/**
 * Google Maps Platform - Servicio Principal
 * 
 * Integración completa de Google Maps APIs para DobackSoft:
 * - Routes API: Rutas optimizadas
 * - Roads API: Snap-to-road GPS
 * - Geocoding API: Conversión coordenadas ↔ direcciones
 * - Elevation API: Datos de elevación
 * - Places API: Información de lugares
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface LatLng {
    lat: number;
    lng: number;
}

export interface LatLngLiteral {
    latitude: number;
    longitude: number;
}

export interface Bounds {
    northeast: LatLng;
    southwest: LatLng;
}

export interface GoogleMapsError {
    code: string;
    message: string;
    status?: number;
}

// ===========================
// CLASE BASE PARA SERVICIOS
// ===========================

export abstract class GoogleMapsServiceBase {
    protected apiKey: string;
    protected cache: Map<string, { data: any; timestamp: number }> = new Map();
    protected requestQueue: Promise<any>[] = [];
    protected lastRequestTime = 0;
    
    constructor() {
        this.apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
        
        if (!this.apiKey) {
            logger.warn('Google Maps API Key no configurada. Algunas funcionalidades estarán limitadas.');
        }
    }
    
    /**
     * Verifica si la API key está configurada
     */
    protected checkApiKey(): void {
        if (!this.apiKey) {
            throw new Error('Google Maps API Key no está configurada. Añádela en las variables de entorno.');
        }
    }
    
    /**
     * Rate limiting: espera el tiempo necesario entre requests
     */
    protected async rateLimit(requestsPerSecond: number): Promise<void> {
        const minInterval = 1000 / requestsPerSecond;
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < minInterval) {
            const delay = minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }
    
    /**
     * Cache: obtiene datos del cache si están disponibles y no han expirado
     */
    protected getCached<T>(key: string, ttl: number): T | null {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }
        
        const age = Date.now() - cached.timestamp;
        
        if (age > ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data as T;
    }
    
    /**
     * Cache: almacena datos en el cache
     */
    protected setCached(key: string, data: any): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }
    
    /**
     * Fetch genérico con manejo de errores
     */
    protected async fetchAPI<T>(
        url: string,
        options: RequestInit = {},
        useCache = true,
        cacheTTL = 3600000 // 1 hora por defecto
    ): Promise<T> {
        this.checkApiKey();
        
        // Verificar cache
        if (useCache) {
            const cached = this.getCached<T>(url, cacheTTL);
            if (cached) {
                logger.debug('Google Maps API: Cache hit', { url });
                return cached;
            }
        }
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                logger.error('Google Maps API Error', {
                    status: response.status,
                    statusText: response.statusText,
                    url,
                    error: errorData,
                });
                
                throw {
                    code: errorData.error?.code || 'UNKNOWN_ERROR',
                    message: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                    status: response.status,
                } as GoogleMapsError;
            }
            
            const data = await response.json();
            
            // Almacenar en cache
            if (useCache) {
                this.setCached(url, data);
            }
            
            return data as T;
            
        } catch (error: any) {
            if (error.name === 'AbortError') {
                logger.error('Google Maps API: Request timeout', { url });
                throw {
                    code: 'TIMEOUT',
                    message: 'La petición ha excedido el tiempo límite',
                } as GoogleMapsError;
            }
            
            logger.error('Google Maps API: Request failed', {
                url,
                error: error.message,
            });
            
            throw error;
        }
    }
    
    /**
     * Limpia el cache completo
     */
    clearCache(): void {
        this.cache.clear();
        logger.info('Google Maps API: Cache limpiado');
    }
    
    /**
     * Limpia entradas del cache más antiguas que el TTL especificado
     */
    cleanOldCache(maxAge: number): void {
        const now = Date.now();
        let deleted = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > maxAge) {
                this.cache.delete(key);
                deleted++;
            }
        }
        
        if (deleted > 0) {
            logger.info(`Google Maps API: ${deleted} entradas antiguas eliminadas del cache`);
        }
    }
}

// ===========================
// UTILIDADES
// ===========================

/**
 * Convierte coordenadas a formato Google Maps
 */
export function toLatLngLiteral(lat: number, lng: number): LatLngLiteral {
    return { latitude: lat, longitude: lng };
}

/**
 * Convierte formato Google Maps a coordenadas simples
 */
export function fromLatLngLiteral(location: LatLngLiteral): LatLng {
    return { lat: location.latitude, lng: location.longitude };
}

/**
 * Valida coordenadas
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

/**
 * Calcula distancia Haversine entre dos puntos (en metros)
 */
export function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Formatea duración en segundos a texto legible
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    
    return `${minutes}min`;
}

/**
 * Formatea distancia en metros a texto legible
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    
    return `${Math.round(meters)} m`;
}

export default GoogleMapsServiceBase;

