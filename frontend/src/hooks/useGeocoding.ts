import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';

// Cache global para direcciones
const addressCache = new Map<string, string>();
const pendingRequests = new Set<string>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 800; // 800ms entre peticiones (balance entre velocidad y límites)

interface UseGeocodingOptions {
    enabled?: boolean;
    fallbackToCoords?: boolean;
}

/**
 * Hook para obtener direcciones a partir de coordenadas GPS
 * Incluye rate limiting, caché y manejo de errores
 */
export const useGeocoding = (
    lat: number | null,
    lon: number | null,
    options: UseGeocodingOptions = {}
) => {
    const { enabled = true, fallbackToCoords = false } = options;
    const [address, setAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled || lat === null || lon === null) {
            setAddress(null);
            setLoading(false);
            return;
        }

        const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;

        // Verificar caché primero
        if (addressCache.has(key)) {
            const cached = addressCache.get(key)!;
            setAddress(cached || null);
            setLoading(false);
            return;
        }

        // Verificar si ya hay una petición pendiente
        if (pendingRequests.has(key)) {
            setLoading(true);
            return;
        }

        let cancelled = false;
        setLoading(true);

        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        const delay = Math.max(0, MIN_REQUEST_INTERVAL - timeSinceLastRequest);

        const timeoutId = setTimeout(async () => {
            if (cancelled) return;

            pendingRequests.add(key);
            lastRequestTime = Date.now();

            try {
                const controller = new AbortController();
                const requestTimeout = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                    {
                        signal: controller.signal,
                        headers: {
                            'User-Agent': 'DobackSoft/1.0'
                        }
                    }
                );

                clearTimeout(requestTimeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (cancelled) return;

                // Extraer nombre de la vía de forma más específica
                let streetName = '';
                if (data.address) {
                    // Priorizar: road > street > highway > residential
                    streetName = data.address.road ||
                        data.address.street ||
                        data.address.highway ||
                        data.address.residential ||
                        data.address.pedestrian ||
                        '';

                    // Si tenemos nombre de vía, agregar ciudad para contexto
                    if (streetName && data.address.city) {
                        streetName = `${streetName}, ${data.address.city}`;
                    } else if (streetName && data.address.town) {
                        streetName = `${streetName}, ${data.address.town}`;
                    }
                }

                // Fallback a display_name si no hay nombre específico de vía
                const addr = streetName ||
                    data.display_name ||
                    `${data.address?.road ?? ''} ${data.address?.city ?? ''}`.trim() ||
                    null;

                // Si no se encontró dirección y se permite fallback, usar coordenadas
                const finalAddress = addr || (fallbackToCoords ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : null);

                addressCache.set(key, finalAddress || '');
                setAddress(finalAddress);
                setLoading(false);

            } catch (error: any) {
                if (!cancelled) {
                    logger.warn('Error en geocodificación inversa:', error.message);
                    const fallback = fallbackToCoords ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : null;
                    addressCache.set(key, fallback || '');
                    setAddress(fallback);
                    setLoading(false);
                }
            } finally {
                pendingRequests.delete(key);
            }
        }, delay);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [lat, lon, enabled, fallbackToCoords]);

    return { address, loading };
};

/**
 * Hook para obtener múltiples direcciones de forma eficiente
 */
export const useMultipleGeocoding = (coordinates: Array<{ lat: number, lng: number, id: string }>) => {
    const [addresses, setAddresses] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (coordinates.length === 0) {
            setAddresses(new Map());
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const processCoordinates = async () => {
            const newAddresses = new Map<string, string>();

            for (const coord of coordinates) {
                if (cancelled) break;

                const key = `${coord.lat.toFixed(5)},${coord.lng.toFixed(5)}`;

                // Verificar caché
                if (addressCache.has(key)) {
                    const cached = addressCache.get(key)!;
                    if (cached) {
                        newAddresses.set(coord.id, cached);
                    }
                    continue;
                }

                try {
                    // Rate limiting entre coordenadas
                    await new Promise(resolve => setTimeout(resolve, 200));

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}`,
                        {
                            headers: { 'User-Agent': 'DobackSoft/1.0' }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        let streetName = '';

                        if (data.address) {
                            streetName = data.address.road ||
                                data.address.street ||
                                data.address.highway ||
                                data.address.residential ||
                                data.address.pedestrian ||
                                '';

                            if (streetName && data.address.city) {
                                streetName = `${streetName}, ${data.address.city}`;
                            } else if (streetName && data.address.town) {
                                streetName = `${streetName}, ${data.address.town}`;
                            }
                        }

                        const addr = streetName || data.display_name || '';
                        addressCache.set(key, addr);
                        if (addr) {
                            newAddresses.set(coord.id, addr);
                        }
                    }
                } catch (error) {
                    logger.warn(`Error geocodificando coordenada ${coord.id}:`, error);
                }
            }

            if (!cancelled) {
                setAddresses(newAddresses);
                setLoading(false);
            }
        };

        processCoordinates();

        return () => {
            cancelled = true;
        };
    }, [coordinates]);

    return { addresses, loading };
};