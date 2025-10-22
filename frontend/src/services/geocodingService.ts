import { logger } from '../utils/logger';

interface GeocodingResult {
    address: string;
    road?: string;
    city?: string;
    success: boolean;
}

class GeocodingService {
    private cache = new Map<string, GeocodingResult>();
    private pendingRequests = new Set<string>();
    private lastRequestTime = 0;
    private readonly MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre peticiones

    /**
     * Geocodifica coordenadas a dirección usando el backend como proxy
     */
    async reverseGeocode(lat: number, lng: number): Promise<string> {
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;

        // Verificar cache
        if (this.cache.has(key)) {
            const cached = this.cache.get(key)!;
            return cached.success ? this.formatAddress(cached) : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        // Evitar peticiones duplicadas
        if (this.pendingRequests.has(key)) {
            // Esperar a que termine la petición pendiente
            await this.waitForPendingRequest(key);
            const cached = this.cache.get(key);
            return cached?.success ? this.formatAddress(cached) : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        this.pendingRequests.add(key);

        try {
            // Rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;
            if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
                await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
            }
            this.lastRequestTime = Date.now();

            // Intentar geocodificación a través del backend
            const response = await fetch('/api/geocoding/reverse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat, lng })
            });

            if (response.ok) {
                const data = await response.json();
                const result: GeocodingResult = {
                    address: data.address || '',
                    road: data.road,
                    city: data.city,
                    success: true
                };

                this.cache.set(key, result);
                return this.formatAddress(result);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            logger.warn('Error en geocodificación', { lat, lng, error });

            // Fallback: usar coordenadas
            const result: GeocodingResult = {
                address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                success: false
            };

            this.cache.set(key, result);
            return result.address;
        } finally {
            this.pendingRequests.delete(key);
        }
    }

    /**
     * Formatea la dirección de manera legible
     */
    private formatAddress(result: GeocodingResult): string {
        if (!result.success) {
            return result.address;
        }

        const parts = [];
        if (result.road) parts.push(result.road);
        if (result.city) parts.push(result.city);

        return parts.length > 0 ? parts.join(', ') : result.address;
    }

    /**
     * Espera a que termine una petición pendiente
     */
    private async waitForPendingRequest(key: string): Promise<void> {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo

        while (this.pendingRequests.has(key) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
    }

    /**
     * Limpia el cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Obtiene estadísticas del cache
     */
    getCacheStats(): { size: number; successRate: number } {
        const entries = Array.from(this.cache.values());
        const successful = entries.filter(e => e.success).length;

        return {
            size: this.cache.size,
            successRate: entries.length > 0 ? successful / entries.length : 0
        };
    }
}

export const geocodingService = new GeocodingService();


