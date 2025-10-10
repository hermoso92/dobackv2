/**
 * Servicio optimizado de vehículos con caché inteligente
 * Optimización específica para Bomberos Madrid
 */

import { EventEmitter } from 'events';
import { CacheService } from './CacheService';

// Instancia de cache para vehículos
const cacheService = new CacheService({ ttl: 5 * 60 * 1000 });

interface VehicleStatus {
    id: string;
    status: 'AVAILABLE' | 'ON_EMERGENCY' | 'MAINTENANCE' | 'OFFLINE';
    lastUpdate: Date;
    location?: {
        lat: number;
        lng: number;
    };
}

interface VehicleStats {
    total: number;
    available: number;
    onEmergency: number;
    maintenance: number;
    offline: number;
    lastUpdated: Date;
}

interface OptimizedVehicleData {
    id: string;
    name: string;
    type: string;
    status: VehicleStatus;
    stats: VehicleStats;
    lastSession?: string;
    lastActivity?: Date;
}

class OptimizedVehicleService extends EventEmitter {
    private vehiclesCache: Map<string, OptimizedVehicleData> = new Map();
    private statsCache: VehicleStats | null = null;
    private lastFullUpdate: Date | null = null;

    /**
     * Obtiene todos los vehículos con caché inteligente
     */
    async getAllVehicles(forceRefresh: boolean = false): Promise<OptimizedVehicleData[]> {
        const cacheKey = cacheService.generateKey('vehicles', 'all');

        if (!forceRefresh) {
            const cached = cacheService.get<OptimizedVehicleData[]>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            // Simulación de datos optimizada para Bomberos Madrid
            const vehicles: OptimizedVehicleData[] = [
                {
                    id: 'doback027',
                    name: 'Bomba 27 - Centro',
                    type: 'BOMBERO',
                    status: {
                        id: 'doback027',
                        status: 'AVAILABLE',
                        lastUpdate: new Date(),
                        location: { lat: 40.4168, lng: -3.7038 }
                    },
                    stats: await this.getVehicleStats(),
                    lastSession: 'session_20241201_001',
                    lastActivity: new Date()
                },
                {
                    id: 'doback028',
                    name: 'Bomba 28 - Norte',
                    type: 'BOMBERO',
                    status: {
                        id: 'doback028',
                        status: 'ON_EMERGENCY',
                        lastUpdate: new Date(),
                        location: { lat: 40.4268, lng: -3.7138 }
                    },
                    stats: await this.getVehicleStats(),
                    lastSession: 'session_20241201_002',
                    lastActivity: new Date()
                },
                {
                    id: 'doback029',
                    name: 'Bomba 29 - Sur',
                    type: 'BOMBERO',
                    status: {
                        id: 'doback029',
                        status: 'MAINTENANCE',
                        lastUpdate: new Date(),
                        location: { lat: 40.4068, lng: -3.6938 }
                    },
                    stats: await this.getVehicleStats(),
                    lastSession: 'session_20241201_003',
                    lastActivity: new Date()
                },
                {
                    id: 'doback030',
                    name: 'Bomba 30 - Este',
                    type: 'BOMBERO',
                    status: {
                        id: 'doback030',
                        status: 'OFFLINE',
                        lastUpdate: new Date(Date.now() - 10 * 60 * 1000)
                    },
                    stats: await this.getVehicleStats(),
                    lastActivity: new Date(Date.now() - 10 * 60 * 1000)
                }
            ];

            // Actualizar caché interno
            this.vehiclesCache.clear();
            vehicles.forEach(vehicle => {
                this.vehiclesCache.set(vehicle.id, vehicle);
            });

            // Guardar en caché con TTL apropiado
            cacheService.set(cacheKey, vehicles, CACHE_CONFIG.REALTIME);
            this.lastFullUpdate = new Date();

            this.emit('vehiclesUpdated', vehicles);
            return vehicles;

        } catch (error) {
            console.error('Error obteniendo vehículos:', error);
            throw error;
        }
    }

    /**
     * Obtiene un vehículo específico con caché
     */
    async getVehicleById(vehicleId: string): Promise<OptimizedVehicleData | null> {
        const cacheKey = cacheService.generateKey('vehicle', vehicleId);

        const cached = cacheService.get<OptimizedVehicleData>(cacheKey);
        if (cached) {
            return cached;
        }

        // Si no está en caché, buscar en caché interno
        const vehicle = this.vehiclesCache.get(vehicleId);
        if (vehicle) {
            cacheService.set(cacheKey, vehicle, CACHE_CONFIG.FREQUENT);
            return vehicle;
        }

        // Si no está en ningún caché, obtener todos los vehículos
        const vehicles = await this.getAllVehicles();
        const foundVehicle = vehicles.find(v => v.id === vehicleId);

        if (foundVehicle) {
            cacheService.set(cacheKey, foundVehicle, CACHE_CONFIG.FREQUENT);
        }

        return foundVehicle || null;
    }

    /**
     * Obtiene estadísticas de vehículos con caché
     */
    async getVehicleStats(forceRefresh: boolean = false): Promise<VehicleStats> {
        const cacheKey = 'vehicle-stats';

        if (!forceRefresh && this.statsCache) {
            const cached = cacheService.get<VehicleStats>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const vehicles = await this.getAllVehicles();

        const stats: VehicleStats = {
            total: vehicles.length,
            available: vehicles.filter(v => v.status.status === 'AVAILABLE').length,
            onEmergency: vehicles.filter(v => v.status.status === 'ON_EMERGENCY').length,
            maintenance: vehicles.filter(v => v.status.status === 'MAINTENANCE').length,
            offline: vehicles.filter(v => v.status.status === 'OFFLINE').length,
            lastUpdated: new Date()
        };

        this.statsCache = stats;
        cacheService.set(cacheKey, stats, CACHE_CONFIG.REALTIME);

        return stats;
    }

    /**
     * Obtiene vehículos por estado con caché
     */
    async getVehiclesByStatus(status: string): Promise<OptimizedVehicleData[]> {
        const cacheKey = cacheService.generateKey('vehicles', 'status', status);

        const cached = cacheService.get<OptimizedVehicleData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const vehicles = await this.getAllVehicles();
        const filtered = vehicles.filter(v => v.status.status === status);

        cacheService.set(cacheKey, filtered, CACHE_CONFIG.REALTIME);
        return filtered;
    }

    /**
     * Actualiza el estado de un vehículo específico
     */
    async updateVehicleStatus(vehicleId: string, status: VehicleStatus): Promise<void> {
        const vehicle = this.vehiclesCache.get(vehicleId);
        if (vehicle) {
            vehicle.status = status;
            vehicle.lastActivity = new Date();

            // Invalidar caches relacionados
            cacheService.delete(cacheService.generateKey('vehicles', 'all'));
            cacheService.delete(cacheService.generateKey('vehicle', vehicleId));
            cacheService.delete('vehicle-stats');
            cacheService.delete(cacheService.generateKey('vehicles', 'status', status.status));

            this.emit('vehicleStatusUpdated', vehicle);
        }
    }

    /**
     * Obtiene vehículos disponibles para emergencias
     */
    async getAvailableVehicles(): Promise<OptimizedVehicleData[]> {
        return this.getVehiclesByStatus('AVAILABLE');
    }

    /**
     * Obtiene vehículos en emergencia
     */
    async getEmergencyVehicles(): Promise<OptimizedVehicleData[]> {
        return this.getVehiclesByStatus('ON_EMERGENCY');
    }

    /**
     * Búsqueda optimizada de vehículos
     */
    async searchVehicles(query: string): Promise<OptimizedVehicleData[]> {
        const cacheKey = cacheService.generateKey('vehicles', 'search', query);

        const cached = cacheService.get<OptimizedVehicleData[]>(cacheKey);
        if (cached) {
            return cached;
        }

        const vehicles = await this.getAllVehicles();
        const filtered = vehicles.filter(vehicle =>
            vehicle.name.toLowerCase().includes(query.toLowerCase()) ||
            vehicle.id.toLowerCase().includes(query.toLowerCase()) ||
            vehicle.type.toLowerCase().includes(query.toLowerCase())
        );

        cacheService.set(cacheKey, filtered, CACHE_CONFIG.FREQUENT);
        return filtered;
    }

    /**
     * Limpia caches específicos de vehículos
     */
    clearVehicleCache(): void {
        const keys = [
            'vehicles:all',
            'vehicle-stats'
        ];

        keys.forEach(key => cacheService.delete(key));

        // Limpiar caché interno
        this.vehiclesCache.clear();
        this.statsCache = null;
        this.lastFullUpdate = null;
    }

    /**
     * Obtiene métricas de rendimiento del servicio
     */
    getPerformanceMetrics() {
        return {
            cacheSize: this.vehiclesCache.size,
            lastUpdate: this.lastFullUpdate,
            cacheStats: cacheService.getStats()
        };
    }
}

export const optimizedVehicleService = new OptimizedVehicleService();
export default optimizedVehicleService;
