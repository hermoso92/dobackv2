/**
 * 🗺️ SERVICIO DE LÍMITES DE VELOCIDAD - TomTom API
 * Integración con TomTom Speed Limits API
 */

import fetch from 'node-fetch';
import { createLogger } from '../utils/logger';

const logger = createLogger('TomTomSpeedService');

export interface SpeedLimitResult {
    speedLimit: number;
    roadType: string;
    confidence: number;
}

export class TomTomSpeedService {
    private apiKey: string;
    private baseUrl = 'https://api.tomtom.com/routing/1';
    private cache = new Map<string, { limit: number; timestamp: number }>();
    private cacheTTL = 24 * 60 * 60 * 1000; // 24 horas

    constructor() {
        this.apiKey = process.env.TOMTOM_API_KEY || process.env.VITE_TOMTOM_API_KEY || '';

        if (!this.apiKey) {
            logger.warn('TomTom API Key no configurada - usando límites estáticos');
        } else {
            logger.info('TomTom Speed Service inicializado');
        }
    }

    /**
     * Obtener límite de velocidad para una coordenada
     * Usa la API de routing para determinar el tipo de vía y su límite
     */
    async getSpeedLimit(lat: number, lon: number): Promise<SpeedLimitResult | null> {
        if (!this.apiKey) {
            logger.warn('TomTom API Key no disponible');
            return null;
        }

        // Verificar caché
        const cacheKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
            logger.debug('Speed limit desde caché', { lat, lon, limit: cached.limit });
            return {
                speedLimit: cached.limit,
                roadType: 'cached',
                confidence: 1.0
            };
        }

        try {
            // Usar Search API para obtener información de la vía más cercana
            const url = `https://api.tomtom.com/search/2/nearbySearch/.json?lat=${lat}&lon=${lon}&limit=1&key=${this.apiKey}&radius=100`;

            logger.debug('Consultando TomTom', { lat, lon });

            const response = await fetch(url);

            if (!response.ok) {
                logger.error('Error en TomTom API', { status: response.status });
                return null;
            }

            const data = await response.json() as any;

            if (data.results && data.results.length > 0) {
                const road = data.results[0];

                // Determinar límite según tipo de vía (clasificación española)
                let speedLimit = 90; // Default para camiones
                let roadType = 'unknown';

                const category = road.poi?.categories?.[0] || '';
                const freeformAddress = road.address?.freeformAddress?.toLowerCase() || '';

                // Autopistas (A-) y Autovías (AP-)
                if (freeformAddress.includes('autopista') || freeformAddress.includes('a-') || freeformAddress.includes('ap-')) {
                    speedLimit = 90; // Camiones en autopista
                    roadType = 'highway';
                }
                // Carreteras nacionales (N-) con arcén
                else if (freeformAddress.includes('n-') || freeformAddress.includes('nacional')) {
                    speedLimit = 80;
                    roadType = 'national_road';
                }
                // Carreteras convencionales
                else if (freeformAddress.includes('m-') || freeformAddress.includes('carretera')) {
                    speedLimit = 80;
                    roadType = 'conventional';
                }
                // Vías urbanas
                else if (road.address?.municipality) {
                    speedLimit = 50; // Urbana
                    roadType = 'urban';
                }

                // Guardar en caché
                this.cache.set(cacheKey, {
                    limit: speedLimit,
                    timestamp: Date.now()
                });

                logger.debug('Speed limit obtenido', { lat, lon, speedLimit, roadType });

                return {
                    speedLimit,
                    roadType,
                    confidence: 0.8
                };
            }

            return null;

        } catch (error: any) {
            logger.error('Error consultando TomTom', { error: error.message, lat, lon });
            return null;
        }
    }

    /**
     * Limpiar caché (útil para testing)
     */
    clearCache(): void {
        this.cache.clear();
        logger.info('Caché de TomTom limpiado');
    }

    /**
     * Obtener estadísticas de caché
     */
    getCacheStats() {
        return {
            entries: this.cache.size,
            memory: this.cache.size * 64 // Estimación aprox
        };
    }
}

// Exportar instancia única
export const tomtomSpeedService = new TomTomSpeedService();

