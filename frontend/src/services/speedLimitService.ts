import { logger } from "../utils/logger";

// Caché en memoria de los límites de velocidad consultados. Se redondea lat/lon a 4 decimales (~11 m) para agrupar.
const cache = new Map<string, number>();

/**
 * Devuelve el límite de velocidad en km/h para las coordenadas dadas.
 * 
 * Estrategia:
 * 1. Redondea lat/lon y revisa la caché; si existe, devuelve inmediatamente.
 * 2. Llama a la API Overpass para buscar la vía más cercana con etiqueta `maxspeed`.
 * 3. Analiza la respuesta y normaliza el valor a km/h.
 * 4. Si no se encuentra `maxspeed`, devuelve un valor por defecto (90 km/h).
 */
export async function getSpeedLimit(lat: number, lon: number): Promise<number> {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (cache.has(key)) return cache.get(key)!;

    try {
        // Consulta Overpass: busca ways en un radio de 30 m que tengan maxspeed
        const query = `[out:json][timeout:10];way(around:30,${lat},${lon})["maxspeed"];out tags;`;
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        let res: Response;
        try {
            res = await fetch(url, { signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
        if (!res.ok) throw new Error(`Overpass status ${res.status}`);
        const data = await res.json();
        let limit: number | undefined;
        if (Array.isArray(data.elements) && data.elements.length) {
            for (const el of data.elements) {
                const ms = el.tags?.maxspeed as string | undefined;
                if (!ms) continue;
                // maxspeed puede tener formatos como "50", "50 km/h", "30 mph"
                const match = ms.match(/(\d+)(?:\s*(km\/h|mph))?/i);
                if (match) {
                    const value = parseInt(match[1], 10);
                    if (!isNaN(value)) {
                        const unit = match[2]?.toLowerCase();
                        limit = unit === "mph" ? Math.round(value * 1.60934) : value;
                        break;
                    }
                }
            }
        }
        if (!limit) {
            // Sin maxspeed explícito: usar defecto según vía urbana/interurbana (simplificado)
            limit = 90;
        }

        cache.set(key, limit);
        return limit;
    } catch (err) {
        logger.error("Error obteniendo límite de velocidad", err);
        // Si falla el servicio, asumir límite 90 km/h
        cache.set(key, 90);
        return 90;
    }
} 