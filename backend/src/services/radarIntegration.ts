/**
 * 🗺️ INTEGRACIÓN COMPLETA CON RADAR.COM
 * Servicio para verificar geocercas usando API de Radar.io
 */

import { createLogger } from '../utils/logger';
import { RadarService } from './radarService';

const logger = createLogger('RadarIntegration');

// Inicializar RadarService con configuración
const radarService = new RadarService({
    baseUrl: process.env.RADAR_BASE_URL || 'https://api.radar.io/v1',
    secretKey: process.env.RADAR_SECRET_KEY,
    cacheTtlMs: parseInt(process.env.RADAR_GEOFENCE_CACHE_TTL || '300000')
});

// ============================================================================
// TIPOS
// ============================================================================

export interface GeocercaRadar {
    _id: string;
    externalId: string;
    description: string;
    tag: string;
    type: 'circle' | 'polygon';
    geometry: {
        type: string;
        coordinates: number[][][];
    };
    geometryCenter: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    geometryRadius: number;
}

export interface VerificacionGeocerca {
    enGeocerca: boolean;
    geocercaId?: string;
    nombre?: string;
    tag?: string; // 'parque', 'taller', etc.
    distancia?: number; // metros
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

/**
 * Verifica si un punto está dentro de una geocerca de Radar.com
 * Usando la API Context de Radar
 */
export async function verificarPuntoEnGeocerca(
    lat: number,
    lon: number
): Promise<VerificacionGeocerca> {
    try {
        // Llamar a Radar Context API
        // https://radar.com/documentation/api#context
        const contextPath = `/context?coordinates=${lat},${lon}`;

        logger.debug('Verificando punto en geocerca Radar', { lat, lon });

        const context: any = await radarService.getContext(lat, lon);

        if (context && context.geofences && context.geofences.length > 0) {
            // El punto está en al menos una geocerca
            const geocerca = context.geofences[0];

            logger.info('Punto dentro de geocerca', {
                lat,
                lon,
                geocerca: geocerca.description,
                tag: geocerca.tag
            });

            return {
                enGeocerca: true,
                geocercaId: geocerca._id,
                nombre: geocerca.description,
                tag: geocerca.tag
            };
        }

        // El punto NO está en ninguna geocerca
        return {
            enGeocerca: false
        };

    } catch (error: any) {
        logger.error('Error verificando geocerca en Radar', { error: error.message, lat, lon });

        // En caso de error, devolver false para no bloquear el sistema
        return {
            enGeocerca: false
        };
    }
}

/**
 * Obtener todas las geocercas de Radar.com
 */
export async function obtenerGeocercasRadar(): Promise<GeocercaRadar[]> {
    try {
        logger.info('Obteniendo geocercas de Radar.com');

        const response: any = await radarService.getGeofences({ forceRefresh: false });

        if (response && response.geofences) {
            logger.info(`Geocercas obtenidas: ${response.geofences.length}`);
            return response.geofences;
        }

        return [];

    } catch (error: any) {
        logger.error('Error obteniendo geocercas de Radar', { error: error.message });
        return [];
    }
}

/**
 * Verificar si un punto está en un parque de bomberos
 * Filtra solo geocercas con tag='parque'
 */
export async function verificarEnParque(
    lat: number,
    lon: number
): Promise<{ enParque: boolean; nombreParque?: string }> {
    try {
        const verificacion = await verificarPuntoEnGeocerca(lat, lon);

        if (verificacion.enGeocerca && verificacion.tag === 'parque') {
            return {
                enParque: true,
                nombreParque: verificacion.nombre
            };
        }

        return { enParque: false };

    } catch (error: any) {
        logger.error('Error verificando punto en parque', { error: error.message });
        return { enParque: false };
    }
}

/**
 * Verificar si un punto está en un taller
 * Filtra solo geocercas con tag='taller'
 */
export async function verificarEnTaller(
    lat: number,
    lon: number
): Promise<{ enTaller: boolean; nombreTaller?: string }> {
    try {
        const verificacion = await verificarPuntoEnGeocerca(lat, lon);

        if (verificacion.enGeocerca && verificacion.tag === 'taller') {
            return {
                enTaller: true,
                nombreTaller: verificacion.nombre
            };
        }

        return { enTaller: false };

    } catch (error: any) {
        logger.error('Error verificando punto en taller', { error: error.message });
        return { enTaller: false };
    }
}

// ============================================================================
// EXPORTAR
// ============================================================================

export const radarIntegration = {
    verificarPuntoEnGeocerca,
    obtenerGeocercasRadar,
    verificarEnParque,
    verificarEnTaller
};

