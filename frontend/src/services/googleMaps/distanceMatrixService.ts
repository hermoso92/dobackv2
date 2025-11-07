/**
 * Google Maps Distance Matrix API Service
 * 
 * Calcula distancias y tiempos entre múltiples orígenes y destinos
 * Ideal para optimización de despacho de flota
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface DistanceMatrixRequest {
    origins: LatLng[];
    destinations: LatLng[];
    travelMode?: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT';
    departureTime?: Date;
    trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
}

export interface DistanceMatrixResponse {
    originAddresses: string[];
    destinationAddresses: string[];
    rows: DistanceMatrixRow[];
}

export interface DistanceMatrixRow {
    elements: DistanceMatrixElement[];
}

export interface DistanceMatrixElement {
    status: string;
    distance?: {
        text: string;
        value: number; // metros
    };
    duration?: {
        text: string;
        value: number; // segundos
    };
    durationInTraffic?: {
        text: string;
        value: number; // segundos
    };
}

export interface OptimizedDispatch {
    vehicleId: string;
    origin: LatLng;
    destination: LatLng;
    distance: number;
    duration: number;
    eta: Date;
}

// ===========================
// SERVICIO DE DISTANCE MATRIX
// ===========================

class GoogleDistanceMatrixService extends GoogleMapsServiceBase {
    private readonly MAX_ELEMENTS = 100; // Límite de Google Maps (origins x destinations)
    
    /**
     * Calcula matriz de distancias entre orígenes y destinos
     */
    async compute(request: DistanceMatrixRequest): Promise<DistanceMatrixResponse | null> {
        this.checkApiKey();
        
        const { origins, destinations } = request;
        
        // Validar límites
        if (origins.length * destinations.length > this.MAX_ELEMENTS) {
            logger.error('Distance Matrix: Demasiados elementos', {
                origins: origins.length,
                destinations: destinations.length,
                max: this.MAX_ELEMENTS,
            });
            throw new Error(`Máximo ${this.MAX_ELEMENTS} elementos (origins × destinations)`);
        }
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.ROUTES);
        
        // Construir URL
        const params = new URLSearchParams({
            origins: origins.map(o => `${o.lat},${o.lng}`).join('|'),
            destinations: destinations.map(d => `${d.lat},${d.lng}`).join('|'),
            mode: (request.travelMode || 'DRIVE').toLowerCase(),
            key: this.apiKey,
            language: GOOGLE_MAPS_CONFIG.LANGUAGE,
            units: 'metric',
        });
        
        if (request.departureTime) {
            params.append('departure_time', Math.floor(request.departureTime.getTime() / 1000).toString());
        }
        
        if (request.trafficModel) {
            params.append('traffic_model', request.trafficModel);
        }
        
        const url = `${GOOGLE_MAPS_CONFIG.DISTANCE_MATRIX_API}?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                4 * 60 * 60 * 1000 // Cache 4 horas
            );
            
            if (response.status !== 'OK') {
                logger.warn('Distance Matrix: Error en respuesta', {
                    status: response.status,
                    errorMessage: response.error_message,
                });
                return null;
            }
            
            return {
                originAddresses: response.origin_addresses || [],
                destinationAddresses: response.destination_addresses || [],
                rows: response.rows || [],
            };
            
        } catch (error: any) {
            logger.error('Distance Matrix: Error en petición', {
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Encuentra el vehículo más cercano a un destino
     */
    async findClosestVehicle(
        vehicles: Array<{ id: string; location: LatLng }>,
        destination: LatLng,
        considerTraffic = true
    ): Promise<OptimizedDispatch | null> {
        const origins = vehicles.map(v => v.location);
        
        const matrix = await this.compute({
            origins,
            destinations: [destination],
            travelMode: 'DRIVE',
            departureTime: considerTraffic ? new Date() : undefined,
            trafficModel: considerTraffic ? 'best_guess' : undefined,
        });
        
        if (!matrix || !matrix.rows) {
            return null;
        }
        
        // Encontrar el más cercano por TIEMPO (no distancia)
        let closestIndex = -1;
        let minDuration = Infinity;
        
        matrix.rows.forEach((row, i) => {
            const element = row.elements[0];
            
            if (element.status === 'OK') {
                const duration = element.durationInTraffic?.value || element.duration?.value || Infinity;
                
                if (duration < minDuration) {
                    minDuration = duration;
                    closestIndex = i;
                }
            }
        });
        
        if (closestIndex === -1) {
            return null;
        }
        
        const closestElement = matrix.rows[closestIndex].elements[0];
        
        return {
            vehicleId: vehicles[closestIndex].id,
            origin: vehicles[closestIndex].location,
            destination,
            distance: closestElement.distance?.value || 0,
            duration: closestElement.durationInTraffic?.value || closestElement.duration?.value || 0,
            eta: new Date(Date.now() + (closestElement.durationInTraffic?.value || closestElement.duration?.value || 0) * 1000),
        };
    }
    
    /**
     * Optimiza asignación de múltiples vehículos a múltiples destinos
     */
    async optimizeAssignments(
        vehicles: Array<{ id: string; location: LatLng }>,
        destinations: LatLng[]
    ): Promise<Map<string, OptimizedDispatch>> {
        const origins = vehicles.map(v => v.location);
        
        const matrix = await this.compute({
            origins,
            destinations,
            travelMode: 'DRIVE',
            departureTime: new Date(),
            trafficModel: 'best_guess',
        });
        
        if (!matrix || !matrix.rows) {
            return new Map();
        }
        
        // Algoritmo greedy de asignación
        const assignments = new Map<string, OptimizedDispatch>();
        const assignedVehicles = new Set<number>();
        const assignedDestinations = new Set<number>();
        
        // Crear lista de todas las combinaciones posibles
        const combinations: Array<{
            vehicleIdx: number;
            destIdx: number;
            duration: number;
            distance: number;
        }> = [];
        
        matrix.rows.forEach((row, vehicleIdx) => {
            row.elements.forEach((element, destIdx) => {
                if (element.status === 'OK' && element.duration) {
                    combinations.push({
                        vehicleIdx,
                        destIdx,
                        duration: element.durationInTraffic?.value || element.duration.value,
                        distance: element.distance?.value || 0,
                    });
                }
            });
        });
        
        // Ordenar por duración (más rápido primero)
        combinations.sort((a, b) => a.duration - b.duration);
        
        // Asignar greedily
        for (const combo of combinations) {
            if (!assignedVehicles.has(combo.vehicleIdx) && !assignedDestinations.has(combo.destIdx)) {
                const vehicle = vehicles[combo.vehicleIdx];
                const destination = destinations[combo.destIdx];
                
                assignments.set(vehicle.id, {
                    vehicleId: vehicle.id,
                    origin: vehicle.location,
                    destination,
                    distance: combo.distance,
                    duration: combo.duration,
                    eta: new Date(Date.now() + combo.duration * 1000),
                });
                
                assignedVehicles.add(combo.vehicleIdx);
                assignedDestinations.add(combo.destIdx);
            }
        }
        
        return assignments;
    }
    
    /**
     * Calcula distancia y tiempo entre dos puntos (simplificado)
     */
    async getDistanceAndDuration(
        origin: LatLng,
        destination: LatLng,
        considerTraffic = false
    ): Promise<{ distance: number; duration: number; durationInTraffic?: number } | null> {
        const matrix = await this.compute({
            origins: [origin],
            destinations: [destination],
            travelMode: 'DRIVE',
            departureTime: considerTraffic ? new Date() : undefined,
        });
        
        if (!matrix || !matrix.rows[0]?.elements[0]) {
            return null;
        }
        
        const element = matrix.rows[0].elements[0];
        
        if (element.status !== 'OK') {
            return null;
        }
        
        return {
            distance: element.distance?.value || 0,
            duration: element.duration?.value || 0,
            durationInTraffic: element.durationInTraffic?.value,
        };
    }
}

// Exportar instancia única (singleton)
export const googleDistanceMatrixService = new GoogleDistanceMatrixService();
export default googleDistanceMatrixService;

