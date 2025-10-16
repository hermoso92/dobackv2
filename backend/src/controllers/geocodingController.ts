import { Request, Response } from 'express';
import { logger } from '../utils/logger';

interface GeocodingRequest {
    lat: number;
    lng: number;
}

interface NominatimResponse {
    address?: {
        road?: string;
        street?: string;
        highway?: string;
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        state?: string;
        country?: string;
    };
    display_name?: string;
}

/**
 * Endpoint para geocodificación inversa usando Nominatim como proxy
 * Esto evita problemas de CORS desde el frontend
 */
export const reverseGeocode = async (req: Request, res: Response) => {
    try {
        const { lat, lng }: GeocodingRequest = req.body;

        if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ 
                error: 'Coordenadas inválidas. Se requieren lat y lng como números.' 
            });
        }

        // Validar rango de coordenadas
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({ 
                error: 'Coordenadas fuera de rango válido.' 
            });
        }

        logger.info('Iniciando geocodificación inversa', { lat, lng });

        // Llamar a Nominatim con headers apropiados
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        
        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'DobackSoft/1.0 (https://dobacksoft.com)',
                'Accept': 'application/json',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }

        const data: NominatimResponse = await response.json();

        // Procesar la respuesta de Nominatim
        let address = '';
        let road = '';
        let city = '';

        if (data.address) {
            // Priorizar road, street, highway
            road = data.address.road || data.address.street || data.address.highway || '';
            
            // Priorizar city, town, village
            city = data.address.city || data.address.town || data.address.village || '';
            
            // Construir dirección completa
            const parts = [];
            if (road) parts.push(road);
            if (city) parts.push(city);
            if (data.address.suburb && !city) parts.push(data.address.suburb);
            if (data.address.state) parts.push(data.address.state);
            
            address = parts.join(', ');
        }

        // Si no hay dirección específica, usar display_name
        if (!address && data.display_name) {
            address = data.display_name;
        }

        // Fallback si no hay nada
        if (!address) {
            address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        logger.info('Geocodificación completada', { 
            lat, 
            lng, 
            address, 
            road, 
            city,
            hasAddress: !!data.address 
        });

        res.json({
            address,
            road,
            city,
            lat,
            lng,
            success: true
        });

    } catch (error) {
        logger.error('Error en geocodificación inversa', { error });
        
        res.status(500).json({
            error: 'Error interno del servidor en geocodificación',
            details: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
