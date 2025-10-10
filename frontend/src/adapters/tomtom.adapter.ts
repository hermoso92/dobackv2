import { logger } from '../utils/logger';

// Adapter para TomTom Maps API
export class TomTomAdapter {
    private static apiKey: string | null = null;

    /**
     * Inicializa el adapter con la API key
     */
    static initialize(apiKey: string): void {
        this.apiKey = apiKey;
    }

    /**
     * Obtiene tiles de TomTom para el mapa
     */
    static getTileUrl(x: number, y: number, z: number, style: string = 'basic-main'): string {
        if (!this.apiKey) {
            throw new Error('TomTom API key no configurada');
        }

        return `https://api.tomtom.com/map/1/tile/${style}/${z}/${x}/${y}.png?key=${this.apiKey}`;
    }

    /**
     * Calcula ruta entre puntos usando TomTom Routing API
     */
    static async calculateRoute(
        waypoints: Array<{ lat: number; lng: number }>,
        options: {
            avoidTolls?: boolean;
            avoidHighways?: boolean;
            travelMode?: 'car' | 'truck' | 'pedestrian';
        } = {}
    ): Promise<{
        coordinates: Array<{ lat: number; lng: number }>;
        distance: number;
        duration: number;
    }> {
        if (!this.apiKey) {
            throw new Error('TomTom API key no configurada');
        }

        try {
            const waypointString = waypoints
                .map(wp => `${wp.lng},${wp.lat}`)
                .join(':');

            const params = new URLSearchParams({
                key: this.apiKey,
                travelMode: options.travelMode || 'car',
                avoid: [
                    options.avoidTolls ? 'tollRoads' : '',
                    options.avoidHighways ? 'motorways' : ''
                ].filter(Boolean).join(',')
            });

            const response = await fetch(
                `https://api.tomtom.com/routing/1/calculateRoute/${waypointString}/json?${params}`
            );

            if (!response.ok) {
                throw new Error(`Error en TomTom Routing API: ${response.status}`);
            }

            const data = await response.json();
            const route = data.routes[0];

            return {
                coordinates: route.legs.flatMap((leg: any) =>
                    leg.points.map((point: any) => ({
                        lat: point.latitude,
                        lng: point.longitude
                    }))
                ),
                distance: route.summary.lengthInMeters,
                duration: route.summary.travelTimeInSeconds
            };
        } catch (error) {
            logger.error('Error calculando ruta con TomTom', { error, waypoints, options });
            throw error;
        }
    }

    /**
     * Geocodifica una dirección usando TomTom Search API
     */
    static async geocode(
        query: string,
        options: {
            countrySet?: string;
            limit?: number;
            typeahead?: boolean;
        } = {}
    ): Promise<Array<{
        lat: number;
        lng: number;
        address: string;
        country: string;
        municipality: string;
    }>> {
        if (!this.apiKey) {
            throw new Error('TomTom API key no configurada');
        }

        try {
            const params = new URLSearchParams({
                key: this.apiKey,
                query,
                limit: (options.limit || 5).toString(),
                typeahead: (options.typeahead || false).toString()
            });

            if (options.countrySet) {
                params.append('countrySet', options.countrySet);
            }

            const response = await fetch(
                `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?${params}`
            );

            if (!response.ok) {
                throw new Error(`Error en TomTom Geocoding API: ${response.status}`);
            }

            const data = await response.json();

            return data.results.map((result: any) => ({
                lat: result.position.lat,
                lng: result.position.lon,
                address: result.address.freeformAddress,
                country: result.address.country,
                municipality: result.address.municipality
            }));
        } catch (error) {
            logger.error('Error geocodificando con TomTom', { error, query, options });
            throw error;
        }
    }

    /**
     * Obtiene información de tráfico en tiempo real
     */
    static async getTrafficInfo(
        bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number },
        options: {
            zoom?: number;
            style?: 'absolute' | 'relative' | 'relative-delay';
        } = {}
    ): Promise<Array<{
        lat: number;
        lng: number;
        severity: 'low' | 'moderate' | 'heavy' | 'severe';
        delay: number;
    }>> {
        if (!this.apiKey) {
            throw new Error('TomTom API key no configurada');
        }

        try {
            const bboxString = `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`;
            const params = new URLSearchParams({
                key: this.apiKey,
                zoom: (options.zoom || 10).toString(),
                style: options.style || 'relative'
            });

            const response = await fetch(
                `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${bbox.minLat},${bbox.minLng}&key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`Error en TomTom Traffic API: ${response.status}`);
            }

            const data = await response.json();

            // TomTom Traffic API devuelve datos por segmento, aquí simplificamos
            return [{
                lat: bbox.minLat + (bbox.maxLat - bbox.minLat) / 2,
                lng: bbox.minLng + (bbox.maxLng - bbox.minLng) / 2,
                severity: data.flowSegmentData?.currentSpeed < 20 ? 'heavy' : 'low',
                delay: data.flowSegmentData?.freeFlowSpeed - data.flowSegmentData?.currentSpeed || 0
            }];
        } catch (error) {
            logger.error('Error obteniendo tráfico de TomTom', { error, bbox, options });
            throw error;
        }
    }

    /**
     * Valida si la API key es válida
     */
    static async validateApiKey(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await fetch(
                `https://api.tomtom.com/search/2/geocode/test.json?key=${this.apiKey}`
            );
            return response.ok;
        } catch {
            return false;
        }
    }
}
