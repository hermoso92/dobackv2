/**
 * Google Maps Roads API Service
 * 
 * Snap-to-road: ajusta puntos GPS a carreteras reales
 * Muy útil para rutas de vehículos con datos GPS imprecisos
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface SnappedPoint {
    location: LatLng;
    originalIndex?: number;
    placeId: string;
}

export interface SpeedLimit {
    placeId: string;
    speedLimit: number;
    units: 'KPH' | 'MPH';
}

// ===========================
// SERVICIO DE ROADS
// ===========================

class GoogleRoadsService extends GoogleMapsServiceBase {
    private readonly MAX_POINTS_PER_REQUEST = 100; // Límite de Google Maps
    
    /**
     * Snap-to-road: ajusta puntos GPS a carreteras
     * 
     * @param path Array de coordenadas GPS
     * @param interpolate Si true, añade puntos intermedios para rutas más suaves
     * @returns Array de puntos ajustados a carreteras
     */
    async snapToRoads(path: LatLng[], interpolate = false): Promise<SnappedPoint[]> {
        this.checkApiKey();
        
        if (!path || path.length === 0) {
            return [];
        }
        
        // Si hay más de 100 puntos, dividir en batches
        if (path.length > this.MAX_POINTS_PER_REQUEST) {
            return this.snapToRoadsBatch(path, interpolate);
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.ROADS);
        
        // Construir parámetros
        const pathParam = path.map((p) => `${p.lat},${p.lng}`).join('|');
        
        const params = new URLSearchParams({
            path: pathParam,
            interpolate: interpolate.toString(),
            key: this.apiKey,
        });
        
        const url = `${GOOGLE_MAPS_CONFIG.ROADS_API}?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.ROADS
            );
            
            if (!response.snappedPoints || response.snappedPoints.length === 0) {
                logger.warn('Roads: No se pudieron ajustar los puntos', {
                    pointsCount: path.length,
                });
                return [];
            }
            
            return response.snappedPoints.map((point: any) => ({
                location: {
                    lat: point.location.latitude,
                    lng: point.location.longitude,
                },
                originalIndex: point.originalIndex,
                placeId: point.placeId,
            }));
            
        } catch (error: any) {
            logger.error('Roads: Error en snap-to-road', {
                pointsCount: path.length,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Snap-to-road en batches para rutas largas
     */
    private async snapToRoadsBatch(path: LatLng[], interpolate: boolean): Promise<SnappedPoint[]> {
        const results: SnappedPoint[] = [];
        const batchSize = this.MAX_POINTS_PER_REQUEST;
        
        // Dividir en batches con solapamiento de 5 puntos para continuidad
        const overlap = 5;
        
        for (let i = 0; i < path.length; i += batchSize - overlap) {
            const end = Math.min(i + batchSize, path.length);
            const batch = path.slice(i, end);
            
            const snapped = await this.snapToRoads(batch, interpolate);
            
            // Evitar duplicados en el solapamiento
            if (i > 0) {
                // Remover primeros puntos que ya están en resultados
                const uniqueSnapped = snapped.filter(
                    (point) =>
                        !results.some(
                            (existing) =>
                                existing.location.lat === point.location.lat &&
                                existing.location.lng === point.location.lng
                        )
                );
                results.push(...uniqueSnapped);
            } else {
                results.push(...snapped);
            }
            
            // Pequeña pausa entre batches para evitar rate limiting
            if (end < path.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }
    
    /**
     * Obtiene límite de velocidad para una ruta
     * 
     * @param placeIds Array de Place IDs obtenidos de snapToRoads
     * @returns Array de límites de velocidad
     */
    async getSpeedLimits(placeIds: string[]): Promise<SpeedLimit[]> {
        this.checkApiKey();
        
        if (!placeIds || placeIds.length === 0) {
            return [];
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.ROADS);
        
        const params = new URLSearchParams({
            placeId: placeIds.join(','),
            key: this.apiKey,
            units: 'KPH',
        });
        
        const url = `https://roads.googleapis.com/v1/speedLimits?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.ROADS
            );
            
            if (!response.speedLimits || response.speedLimits.length === 0) {
                logger.warn('Roads: No se encontraron límites de velocidad', {
                    placeIds: placeIds.length,
                });
                return [];
            }
            
            return response.speedLimits.map((limit: any) => ({
                placeId: limit.placeId,
                speedLimit: limit.speedLimit,
                units: limit.units || 'KPH',
            }));
            
        } catch (error: any) {
            logger.error('Roads: Error al obtener límites de velocidad', {
                placeIds: placeIds.length,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Snap-to-road con límites de velocidad incluidos
     * Útil para detectar infracciones de velocidad
     */
    async snapWithSpeedLimits(path: LatLng[], interpolate = false): Promise<{
        snappedPoints: SnappedPoint[];
        speedLimits: SpeedLimit[];
    }> {
        const snappedPoints = await this.snapToRoads(path, interpolate);
        
        if (snappedPoints.length === 0) {
            return { snappedPoints: [], speedLimits: [] };
        }
        
        // Obtener Place IDs únicos
        const placeIds = [...new Set(snappedPoints.map((p) => p.placeId))];
        
        const speedLimits = await this.getSpeedLimits(placeIds);
        
        return {
            snappedPoints,
            speedLimits,
        };
    }
    
    /**
     * Calcula la distancia total de una ruta ajustada
     */
    calculateRouteDistance(snappedPoints: SnappedPoint[]): number {
        if (snappedPoints.length < 2) {
            return 0;
        }
        
        let totalDistance = 0;
        
        for (let i = 0; i < snappedPoints.length - 1; i++) {
            const p1 = snappedPoints[i].location;
            const p2 = snappedPoints[i + 1].location;
            
            totalDistance += this.haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        }
        
        return totalDistance;
    }
    
    /**
     * Calcula distancia Haversine entre dos puntos (en metros)
     */
    private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
}

// Exportar instancia única (singleton)
export const googleRoadsService = new GoogleRoadsService();
export default googleRoadsService;

