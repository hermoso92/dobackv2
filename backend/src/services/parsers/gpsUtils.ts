/**
 * 📍 UTILIDADES GPS
 * 
 * Funciones para validación y cálculos GPS
 * 
 * @version 1.0
 * @date 2025-10-11
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calcula la distancia entre dos puntos GPS usando la fórmula de Haversine
 * 
 * @param lat1 Latitud del primer punto (grados)
 * @param lon1 Longitud del primer punto (grados)
 * @param lat2 Latitud del segundo punto (grados)
 * @param lon2 Longitud del segundo punto (grados)
 * @returns Distancia en metros
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c * 1000; // Convertir a metros
}

/**
 * Convierte grados a radianes
 */
function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Valida si las coordenadas están dentro de rangos válidos
 */
export function isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Valida si las coordenadas están dentro de España
 */
export function isInSpain(lat: number, lon: number): boolean {
    return lat >= 36 && lat <= 44 && lon >= -10 && lon <= 5;
}

