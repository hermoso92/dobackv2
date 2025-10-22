import { logger } from '../utils/logger';

/**
 * 🗺️ SERVICIO TOMTOM INTEGRADO - BOMBEROS MADRID
 * Servicio completo para mapas, geocodificación, routing y geofences con TomTom
 */

// Configuración de TomTom
const TOMTOM_CONFIG = {
    apiKey: 'u8wN3BM4AMzDGGC76lLF14vHblDP37HG',
    baseUrl: 'https://api.tomtom.com',
    version: '1',
    mapStyles: {
        basic: 'basic/main',
        hybrid: 'hybrid/main',
        satellite: 'satellite/main',
        traffic: 'basic/traffic'
    }
};

// Tipos de datos
interface TomTomLocation {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    country?: string;
}

interface TomTomRoute {
    id: string;
    summary: {
        lengthInMeters: number;
        travelTimeInSeconds: number;
        trafficDelayInSeconds: number;
    };
    legs: Array<{
        points: [number, number][];
        instructions: Array<{
            instruction: string;
            streetName?: string;
            distance: number;
        }>;
    }>;
}

interface TomTomGeocodeResult {
    position: TomTomLocation;
    address: {
        freeformAddress: string;
        country: string;
        countryCode: string;
        countryCodeISO3: string;
        countrySecondarySubdivision: string;
        countrySubdivision: string;
        countrySubdivisionName: string;
        countrySubdivisionCode: string;
        municipality: string;
        municipalitySubdivision: string;
        postalCode: string;
        streetName: string;
        streetNumber: string;
        localName: string;
        countryTertiarySubdivision: string;
        extendedPostalCode: string;
        neighbourhood: string;
        countrySubdivisionCode: string;
    };
    type: string;
    viewport: {
        topLeftPoint: TomTomLocation;
        btmRightPoint: TomTomLocation;
    };
}

interface TomTomTrafficIncident {
    id: string;
    point: TomTomLocation;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
    startTime: string;
    endTime?: string;
    delay: number;
    length: number;
}

class TomTomService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = TOMTOM_CONFIG.apiKey;
        this.baseUrl = TOMTOM_CONFIG.baseUrl;
    }

    /**
     * Obtiene URL de tiles para diferentes estilos de mapa
     */
    getTileUrl(style: keyof typeof TOMTOM_CONFIG.mapStyles = 'basic'): string {
        return `${this.baseUrl}/map/${TOMTOM_CONFIG.version}/tile/${TOMTOM_CONFIG.mapStyles[style]}/{z}/{x}/{y}.png?key=${this.apiKey}`;
    }

    /**
     * Geocodificación: Convierte dirección a coordenadas
     */
    async geocode(query: string, limit: number = 1): Promise<TomTomGeocodeResult[]> {
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(
                `${this.baseUrl}/search/${TOMTOM_CONFIG.version}/geocode/${encodedQuery}.json?key=${this.apiKey}&limit=${limit}`
            );

            if (!response.ok) {
                throw new Error(`Error en geocodificación: ${response.status}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            logger.error('Error en geocodificación TomTom:', error);
            throw error;
        }
    }

    /**
     * Geocodificación inversa: Convierte coordenadas a dirección
     */
    async reverseGeocode(lat: number, lng: number): Promise<TomTomGeocodeResult[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/search/${TOMTOM_CONFIG.version}/reverseGeocode/${lat},${lng}.json?key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`Error en geocodificación inversa: ${response.status}`);
            }

            const data = await response.json();
            return data.addresses || [];
        } catch (error) {
            logger.error('Error en geocodificación inversa TomTom:', error);
            throw error;
        }
    }

    /**
     * Calcula ruta entre dos puntos
     */
    async calculateRoute(
        start: [number, number],
        end: [number, number],
        options: {
            routeType?: 'fastest' | 'shortest' | 'eco' | 'thrilling';
            traffic?: boolean;
            avoidTolls?: boolean;
            avoidHighways?: boolean;
        } = {}
    ): Promise<TomTomRoute> {
        try {
            const {
                routeType = 'fastest',
                traffic = true,
                avoidTolls = false,
                avoidHighways = false
            } = options;

            const startStr = `${start[0]},${start[1]}`;
            const endStr = `${end[0]},${end[1]}`;

            let url = `${this.baseUrl}/routing/${TOMTOM_CONFIG.version}/calculateRoute/${startStr}:${endStr}/json?key=${this.apiKey}`;
            url += `&routeType=${routeType}`;
            url += `&traffic=${traffic}`;
            url += `&avoidTolls=${avoidTolls}`;
            url += `&avoidHighways=${avoidHighways}`;
            url += '&instructionsType=text';
            url += '&language=es-ES';

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error calculando ruta: ${response.status}`);
            }

            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                throw new Error('No se encontró ruta');
            }

            return data.routes[0];
        } catch (error) {
            logger.error('Error calculando ruta TomTom:', error);
            throw error;
        }
    }

    /**
     * Calcula ruta de emergencia (más rápida, ignora algunas restricciones)
     */
    async calculateEmergencyRoute(
        start: [number, number],
        end: [number, number]
    ): Promise<TomTomRoute> {
        return this.calculateRoute(start, end, {
            routeType: 'fastest',
            traffic: true,
            avoidTolls: false,
            avoidHighways: false
        });
    }

    /**
     * Obtiene información de tráfico en tiempo real
     */
    async getTrafficIncidents(
        bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        }
    ): Promise<TomTomTrafficIncident[]> {
        try {
            const boundsStr = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
            const response = await fetch(
                `${this.baseUrl}/traffic/services/4/incidentDetails/s3/${boundsStr}/json?key=${this.apiKey}&projection=EPSG4326&language=es-ES&expandCluster=true`
            );

            if (!response.ok) {
                throw new Error(`Error obteniendo incidentes de tráfico: ${response.status}`);
            }

            const data = await response.json();
            return data.incidents || [];
        } catch (error) {
            logger.error('Error obteniendo tráfico TomTom:', error);
            return [];
        }
    }

    /**
     * Busca puntos de interés (POI) cerca de una ubicación
     */
    async searchPOI(
        lat: number,
        lng: number,
        query: string,
        radius: number = 1000,
        limit: number = 10
    ): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/search/${TOMTOM_CONFIG.version}/poiSearch/${query}.json?key=${this.apiKey}&lat=${lat}&lon=${lng}&radius=${radius}&limit=${limit}&language=es-ES`
            );

            if (!response.ok) {
                throw new Error(`Error buscando POI: ${response.status}`);
            }

            const data = await response.json();
            return data.results || [];
        } catch (error) {
            logger.error('Error buscando POI TomTom:', error);
            return [];
        }
    }

    /**
     * Busca hospitales y servicios de emergencia cerca de una ubicación
     */
    async findEmergencyServices(
        lat: number,
        lng: number,
        radius: number = 5000
    ): Promise<{
        hospitals: any[];
        fireStations: any[];
        policeStations: any[];
    }> {
        try {
            const [hospitals, fireStations, policeStations] = await Promise.all([
                this.searchPOI(lat, lng, 'hospital', radius, 10),
                this.searchPOI(lat, lng, 'bomberos', radius, 10),
                this.searchPOI(lat, lng, 'policía', radius, 10)
            ]);

            return {
                hospitals,
                fireStations,
                policeStations
            };
        } catch (error) {
            logger.error('Error buscando servicios de emergencia:', error);
            return {
                hospitals: [],
                fireStations: [],
                policeStations: []
            };
        }
    }

    /**
     * Calcula matriz de distancias entre múltiples puntos
     */
    async calculateDistanceMatrix(
        origins: [number, number][],
        destinations: [number, number][]
    ): Promise<{
        origins: Array<{
            lat: number;
            lng: number;
            distances: Array<{
                destinationIndex: number;
                distance: number;
                travelTime: number;
            }>;
        }>;
    }> {
        try {
            const originsStr = origins.map(p => `${p[0]},${p[1]}`).join(':');
            const destinationsStr = destinations.map(p => `${p[0]},${p[1]}`).join(':');

            const response = await fetch(
                `${this.baseUrl}/routing/${TOMTOM_CONFIG.version}/matrix/json?key=${this.apiKey}&origins=${originsStr}&destinations=${destinationsStr}`
            );

            if (!response.ok) {
                throw new Error(`Error calculando matriz de distancias: ${response.status}`);
            }

            const data = await response.json();
            return data.matrix || { origins: [] };
        } catch (error) {
            logger.error('Error calculando matriz de distancias TomTom:', error);
            throw error;
        }
    }

    /**
     * Obtiene el mejor punto de encuentro para múltiples vehículos
     */
    async findOptimalMeetingPoint(
        vehiclePositions: [number, number][],
        targetArea?: [number, number][]
    ): Promise<{
        meetingPoint: [number, number];
        totalTravelTime: number;
        maxTravelTime: number;
        vehicleRoutes: Array<{
            vehicleIndex: number;
            route: TomTomRoute;
        }>;
    }> {
        try {
            // Si hay área objetivo, usar el centro
            let meetingPoint: [number, number];

            if (targetArea && targetArea.length > 0) {
                const centerLat = targetArea.reduce((sum, point) => sum + point[0], 0) / targetArea.length;
                const centerLng = targetArea.reduce((sum, point) => sum + point[1], 0) / targetArea.length;
                meetingPoint = [centerLat, centerLng];
            } else {
                // Usar el centroide de las posiciones de vehículos
                const centerLat = vehiclePositions.reduce((sum, point) => sum + point[0], 0) / vehiclePositions.length;
                const centerLng = vehiclePositions.reduce((sum, point) => sum + point[1], 0) / vehiclePositions.length;
                meetingPoint = [centerLat, centerLng];
            }

            // Calcular rutas desde cada vehículo al punto de encuentro
            const routePromises = vehiclePositions.map((position, index) =>
                this.calculateRoute(position, meetingPoint).then(route => ({
                    vehicleIndex: index,
                    route
                }))
            );

            const vehicleRoutes = await Promise.all(routePromises);

            const totalTravelTime = vehicleRoutes.reduce((sum, vr) => sum + vr.route.summary.travelTimeInSeconds, 0);
            const maxTravelTime = Math.max(...vehicleRoutes.map(vr => vr.route.summary.travelTimeInSeconds));

            return {
                meetingPoint,
                totalTravelTime,
                maxTravelTime,
                vehicleRoutes
            };
        } catch (error) {
            logger.error('Error encontrando punto de encuentro óptimo:', error);
            throw error;
        }
    }

    /**
     * Valida si una coordenada está dentro de un polígono (geofence)
     */
    isPointInPolygon(
        point: [number, number],
        polygon: [number, number][]
    ): boolean {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Calcula la distancia entre dos puntos en metros
     */
    calculateDistance(
        point1: [number, number],
        point2: [number, number]
    ): number {
        const R = 6371000; // Radio de la Tierra en metros
        const [lat1, lng1] = point1;
        const [lat2, lng2] = point2;

        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * Obtiene estadísticas de uso de la API
     */
    getApiStats(): {
        apiKey: string;
        baseUrl: string;
        version: string;
        availableStyles: string[];
    } {
        return {
            apiKey: this.apiKey.substring(0, 8) + '...',
            baseUrl: this.baseUrl,
            version: TOMTOM_CONFIG.version,
            availableStyles: Object.keys(TOMTOM_CONFIG.mapStyles)
        };
    }
}

// Instancia singleton del servicio TomTom
export const tomtomService = new TomTomService();

// Exportar configuración y tipos
export { TOMTOM_CONFIG };
export type {
    TomTomGeocodeResult, TomTomLocation,
    TomTomRoute, TomTomTrafficIncident
};

export default tomtomService;
