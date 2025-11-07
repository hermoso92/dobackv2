/**
 * Google Maps Elevation API Service
 * 
 * Obtiene datos de elevación para puntos GPS
 * Útil para análisis de estabilidad en pendientes y altitudes
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface ElevationPoint {
    location: LatLng;
    elevation: number; // Metros sobre el nivel del mar
    resolution: number; // Precisión en metros
}

export interface ElevationProfile {
    points: ElevationPoint[];
    minElevation: number;
    maxElevation: number;
    totalGain: number; // Elevación total ganada
    totalLoss: number; // Elevación total perdida
    maxGrade: number;  // Pendiente máxima en porcentaje
}

// ===========================
// SERVICIO DE ELEVATION
// ===========================

class GoogleElevationService extends GoogleMapsServiceBase {
    private readonly MAX_POINTS_PER_REQUEST = 512; // Límite de Google Maps
    
    /**
     * Obtiene elevación para una lista de coordenadas
     */
    async getElevation(locations: LatLng[]): Promise<ElevationPoint[]> {
        this.checkApiKey();
        
        if (!locations || locations.length === 0) {
            return [];
        }
        
        // Si hay más de 512 puntos, dividir en batches
        if (locations.length > this.MAX_POINTS_PER_REQUEST) {
            return this.getElevationBatch(locations);
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.ELEVATION);
        
        // Construir parámetros
        const locationsParam = locations.map((loc) => `${loc.lat},${loc.lng}`).join('|');
        
        const params = new URLSearchParams({
            locations: locationsParam,
            key: this.apiKey,
        });
        
        const url = `${GOOGLE_MAPS_CONFIG.ELEVATION_API}?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                GOOGLE_MAPS_CONFIG.CACHE_TTL.ELEVATION
            );
            
            if (response.status !== 'OK' || !response.results || response.results.length === 0) {
                logger.warn('Elevation: No se encontraron datos de elevación', {
                    status: response.status,
                    pointsCount: locations.length,
                });
                return [];
            }
            
            return response.results.map((result: any) => ({
                location: {
                    lat: result.location.lat,
                    lng: result.location.lng,
                },
                elevation: result.elevation,
                resolution: result.resolution,
            }));
            
        } catch (error: any) {
            logger.error('Elevation: Error al obtener elevación', {
                pointsCount: locations.length,
                error: error.message,
            });
            return [];
        }
    }
    
    /**
     * Obtiene elevación en batches para muchos puntos
     */
    private async getElevationBatch(locations: LatLng[]): Promise<ElevationPoint[]> {
        const results: ElevationPoint[] = [];
        const batchSize = this.MAX_POINTS_PER_REQUEST;
        
        for (let i = 0; i < locations.length; i += batchSize) {
            const batch = locations.slice(i, i + batchSize);
            const elevations = await this.getElevation(batch);
            results.push(...elevations);
            
            // Pequeña pausa entre batches
            if (i + batchSize < locations.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }
    
    /**
     * Obtiene elevación para un solo punto
     */
    async getSingleElevation(lat: number, lng: number): Promise<number | null> {
        const results = await this.getElevation([{ lat, lng }]);
        return results.length > 0 ? results[0].elevation : null;
    }
    
    /**
     * Obtiene perfil de elevación para una ruta
     * Incluye estadísticas útiles
     */
    async getElevationProfile(path: LatLng[], samples = 100): Promise<ElevationProfile | null> {
        this.checkApiKey();
        
        if (!path || path.length < 2) {
            return null;
        }
        
        // Si la ruta tiene pocos puntos, usar todos
        const sampledPath = path.length <= samples ? path : this.samplePath(path, samples);
        
        const elevations = await this.getElevation(sampledPath);
        
        if (elevations.length === 0) {
            return null;
        }
        
        // Calcular estadísticas
        const elevationValues = elevations.map((p) => p.elevation);
        const minElevation = Math.min(...elevationValues);
        const maxElevation = Math.max(...elevationValues);
        
        let totalGain = 0;
        let totalLoss = 0;
        let maxGrade = 0;
        
        for (let i = 1; i < elevations.length; i++) {
            const prev = elevations[i - 1];
            const curr = elevations[i];
            
            const elevationDiff = curr.elevation - prev.elevation;
            
            if (elevationDiff > 0) {
                totalGain += elevationDiff;
            } else {
                totalLoss += Math.abs(elevationDiff);
            }
            
            // Calcular pendiente
            const distance = this.haversineDistance(
                prev.location.lat,
                prev.location.lng,
                curr.location.lat,
                curr.location.lng
            );
            
            if (distance > 0) {
                const grade = Math.abs((elevationDiff / distance) * 100);
                maxGrade = Math.max(maxGrade, grade);
            }
        }
        
        return {
            points: elevations,
            minElevation,
            maxElevation,
            totalGain,
            totalLoss,
            maxGrade,
        };
    }
    
    /**
     * Samplea una ruta para obtener N puntos equidistantes
     */
    private samplePath(path: LatLng[], samples: number): LatLng[] {
        if (path.length <= samples) {
            return path;
        }
        
        const sampled: LatLng[] = [path[0]]; // Siempre incluir el primer punto
        const step = (path.length - 1) / (samples - 1);
        
        for (let i = 1; i < samples - 1; i++) {
            const index = Math.round(i * step);
            sampled.push(path[index]);
        }
        
        sampled.push(path[path.length - 1]); // Siempre incluir el último punto
        
        return sampled;
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
    
    /**
     * Detecta pendientes pronunciadas en una ruta
     * Útil para análisis de estabilidad
     */
    async detectSteepGrades(path: LatLng[], gradeThreshold = 5): Promise<Array<{
        location: LatLng;
        grade: number;
        elevation: number;
    }>> {
        const profile = await this.getElevationProfile(path, 100);
        
        if (!profile) {
            return [];
        }
        
        const steepGrades: Array<{ location: LatLng; grade: number; elevation: number }> = [];
        
        for (let i = 1; i < profile.points.length; i++) {
            const prev = profile.points[i - 1];
            const curr = profile.points[i];
            
            const elevationDiff = curr.elevation - prev.elevation;
            const distance = this.haversineDistance(
                prev.location.lat,
                prev.location.lng,
                curr.location.lat,
                curr.location.lng
            );
            
            if (distance > 0) {
                const grade = Math.abs((elevationDiff / distance) * 100);
                
                if (grade >= gradeThreshold) {
                    steepGrades.push({
                        location: curr.location,
                        grade,
                        elevation: curr.elevation,
                    });
                }
            }
        }
        
        return steepGrades;
    }
}

// Exportar instancia única (singleton)
export const googleElevationService = new GoogleElevationService();
export default googleElevationService;

