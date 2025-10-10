import { useEffect, useState } from 'react';

// Cache global para direcciones
const addressCache = new Map<string, string>();
const pendingRequests = new Set<string>();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 segundo entre peticiones

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

                const addr = data.display_name ||
                    `${data.address?.road ?? ''} ${data.address?.city ?? ''}`.trim() ||
                    null;

                // Si no se encontró dirección y se permite fallback, usar coordenadas
                const finalAddress = addr || (fallbackToCoords ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : null);

                addressCache.set(key, finalAddress || '');
                setAddress(finalAddress);
                setLoading(false);

            } catch (error: any) {
                if (!cancelled) {
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
            pendingRequests.delete(key);
            setLoading(false);
        };
    }, [lat, lon, enabled, fallbackToCoords]);

    return { address, loading };
}; 