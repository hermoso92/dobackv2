import axios from 'axios';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils/logger';

export interface GPSPoint {
    lat: number;
    lon: number;
    timestamp: Date;
}

export interface MatchedRoute {
    distance: number;
    duration: number;
    geometry: any;
    confidence: number;
}

export class OSRMService {
    private baseUrl: string;
    private timeout: number = 15000;
    private readonly MAX_OSRM_POINTS = 90; // ✅ Reducido para URLs más cortas

    constructor() {
        this.baseUrl = process.env.OSRM_URL || 'http://localhost:5000';

        // ✅ Configurar reintentos exponenciales
        axiosRetry(axios, {
            retries: 3,
            retryDelay: axiosRetry.exponentialDelay,
            retryCondition: (e) => ['ECONNRESET', 'ETIMEDOUT'].includes((e as any)?.code)
        });
    }

    async matchRoute(points: GPSPoint[]): Promise<MatchedRoute> {
        try {
            if (points.length < 2) {
                throw new Error('Se necesitan al menos 2 puntos GPS');
            }

            // Filtrar jitter (vehículo parado)
            const filteredPoints = this.filterJitter(points);

            // Detectar gaps y dividir segmentos
            const segments = this.splitByGaps(filteredPoints, 30);

            if (segments.length > 1) {
                logger.debug(`Sesión dividida en ${segments.length} segmentos por gaps GPS`);
                const results = await Promise.all(segments.map(seg => this.matchSegment(seg)));
                return this.combineSegments(results);
            }

            return await this.matchSegment(filteredPoints);

        } catch (error: any) {
            logger.warn('Error en OSRM, usando fallback Haversine:', error.message);
            return this.fallbackHaversine(points);
        }
    }

    /**
     * Filtrar jitter GPS (vehículo parado)
     */
    private filterJitter(points: GPSPoint[]): GPSPoint[] {
        if (points.length < 2) return points;

        const filtered: GPSPoint[] = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const lastAccepted = filtered[filtered.length - 1]; // ✅ Comparar con el último aceptado
            const curr = points[i];

            // Calcular distancia desde el último punto aceptado
            const distance = this.haversineDistance(lastAccepted.lat, lastAccepted.lon, curr.lat, curr.lon);

            // Si distancia > 5m o velocidad aparente > 2 km/h, mantener punto
            // Umbrales más permisivos para no eliminar demasiados puntos
            const timeDiff = (curr.timestamp.getTime() - lastAccepted.timestamp.getTime()) / 1000; // segundos
            const speed = distance / timeDiff * 3.6; // km/h

            if (distance > 5 || speed > 2) {
                filtered.push(curr);
            }
        }

        logger.debug(`Filtrados ${points.length - filtered.length} puntos de jitter`);

        return filtered.length >= 2 ? filtered : points;
    }

    private splitByGaps(points: GPSPoint[], maxGapSeconds: number): GPSPoint[][] {
        const segments: GPSPoint[][] = [];
        let currentSegment: GPSPoint[] = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const gap = (points[i].timestamp.getTime() - points[i - 1].timestamp.getTime()) / 1000;

            if (gap > maxGapSeconds) {
                if (currentSegment.length >= 2) {
                    segments.push(currentSegment);
                }
                currentSegment = [points[i]];
            } else {
                currentSegment.push(points[i]);
            }
        }

        if (currentSegment.length >= 2) {
            segments.push(currentSegment);
        }

        return segments.length > 0 ? segments : [points];
    }

    private combineSegments(segments: MatchedRoute[]): MatchedRoute {
        return {
            distance: segments.reduce((sum, s) => sum + s.distance, 0),
            duration: segments.reduce((sum, s) => sum + s.duration, 0),
            geometry: null,
            confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
        };
    }

    private async matchSegment(points: GPSPoint[]): Promise<MatchedRoute> {
        const sampledPoints = this.samplePoints(points, this.MAX_OSRM_POINTS);

        const coordinates = sampledPoints.map(p => `${p.lon},${p.lat}`).join(';');
        const timestamps = sampledPoints.map(p => Math.floor(p.timestamp.getTime() / 1000)).join(';');

        const url = `${this.baseUrl}/match/v1/driving/${coordinates}`;
        const params = {
            timestamps,
            radiuses: sampledPoints.map(() => 100).join(';'),
            geometries: 'geojson',
            overview: 'full',
            annotations: 'true'
        };

        logger.debug(`Llamando a OSRM con ${sampledPoints.length} puntos`);

        const response = await axios.get(url, { params, timeout: this.timeout });

        if (response.data.code !== 'Ok') {
            throw new Error(`OSRM error: ${response.data.code}`);
        }

        const matching = response.data.matchings[0];

        if (!matching) {
            throw new Error('OSRM no devolvió matching');
        }

        return {
            distance: matching.distance,
            duration: matching.duration,
            geometry: matching.geometry,
            confidence: matching.confidence || 0
        };
    }

    private samplePoints(points: GPSPoint[], maxPoints: number): GPSPoint[] {
        if (points.length <= maxPoints) {
            return points;
        }

        const step = Math.floor(points.length / maxPoints);
        const sampled: GPSPoint[] = [];

        for (let i = 0; i < points.length; i += step) {
            sampled.push(points[i]);
        }

        if (sampled[sampled.length - 1] !== points[points.length - 1]) {
            sampled.push(points[points.length - 1]);
        }

        return sampled;
    }

    private fallbackHaversine(points: GPSPoint[]): MatchedRoute {
        let totalDistance = 0;

        for (let i = 1; i < points.length; i++) {
            const distance = this.haversineDistance(
                points[i - 1].lat, points[i - 1].lon,
                points[i].lat, points[i].lon
            );

            if (distance <= 100) {
                totalDistance += distance;
            }
        }

        const duration = (points[points.length - 1].timestamp.getTime() - points[0].timestamp.getTime()) / 1000;

        return {
            distance: totalDistance,
            duration,
            geometry: null,
            confidence: 0
        };
    }

    private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async healthCheck(): Promise<boolean> {
        try {
            // ✅ Usar coordenadas de Madrid (Puerta del Sol)
            const response = await axios.get(`${this.baseUrl}/nearest/v1/driving/-3.692,40.419`, { timeout: 5000 });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

export const osrmService = new OSRMService();



