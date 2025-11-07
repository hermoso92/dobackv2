/**
 * Google Maps Time Zone API Service
 * 
 * Convierte timestamps UTC a hora local según ubicación GPS
 * Ideal para reportes y análisis con hora local correcta
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface TimeZoneResult {
    timeZoneId: string;  // ej: "Europe/Madrid"
    timeZoneName: string;  // ej: "Central European Summer Time"
    rawOffset: number;  // Offset en segundos desde UTC
    dstOffset: number;  // Offset de horario de verano en segundos
    status: string;
}

export interface LocalTime {
    utc: Date;
    local: Date;
    timeZone: string;
    timeZoneName: string;
    offset: string;  // ej: "+02:00"
    isDST: boolean;
}

// ===========================
// SERVICIO DE TIME ZONE
// ===========================

class GoogleTimeZoneService extends GoogleMapsServiceBase {
    
    /**
     * Obtiene información de zona horaria para una ubicación y timestamp
     */
    async getTimeZone(lat: number, lng: number, timestamp?: Date): Promise<TimeZoneResult | null> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(50); // 50 req/s
        
        const ts = timestamp || new Date();
        const timestampSeconds = Math.floor(ts.getTime() / 1000);
        
        // Construir URL
        const params = new URLSearchParams({
            location: `${lat},${lng}`,
            timestamp: timestampSeconds.toString(),
            key: this.apiKey,
            language: GOOGLE_MAPS_CONFIG.LANGUAGE,
        });
        
        const url = `https://maps.googleapis.com/maps/api/timezone/json?${params.toString()}`;
        
        try {
            const response = await this.fetchAPI<TimeZoneResult>(
                url,
                {},
                true,
                7 * 24 * 60 * 60 * 1000 // Cache 7 días (zonas horarias no cambian frecuentemente)
            );
            
            if (response.status !== 'OK') {
                logger.warn('TimeZone: Error en respuesta', {
                    status: response.status,
                    lat,
                    lng,
                });
                return null;
            }
            
            return response;
            
        } catch (error: any) {
            logger.error('TimeZone: Error en petición', {
                lat,
                lng,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Convierte timestamp UTC a hora local
     */
    async convertToLocalTime(lat: number, lng: number, utcTimestamp: Date): Promise<LocalTime | null> {
        const tzInfo = await this.getTimeZone(lat, lng, utcTimestamp);
        
        if (!tzInfo) {
            return null;
        }
        
        const totalOffsetSeconds = tzInfo.rawOffset + tzInfo.dstOffset;
        const localTimestamp = new Date(utcTimestamp.getTime() + totalOffsetSeconds * 1000);
        
        // Formatear offset (+02:00, -05:00, etc.)
        const offsetHours = Math.floor(totalOffsetSeconds / 3600);
        const offsetMinutes = Math.abs(Math.floor((totalOffsetSeconds % 3600) / 60));
        const offsetString = `${offsetHours >= 0 ? '+' : ''}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
        
        return {
            utc: utcTimestamp,
            local: localTimestamp,
            timeZone: tzInfo.timeZoneId,
            timeZoneName: tzInfo.timeZoneName,
            offset: offsetString,
            isDST: tzInfo.dstOffset > 0,
        };
    }
    
    /**
     * Formatea timestamp para mostrar en UI con zona horaria
     */
    async formatLocalTime(
        lat: number,
        lng: number,
        utcTimestamp: Date,
        includeSeconds = false
    ): Promise<string> {
        const localTime = await this.convertToLocalTime(lat, lng, utcTimestamp);
        
        if (!localTime) {
            return utcTimestamp.toISOString();
        }
        
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            ...(includeSeconds && { second: '2-digit' }),
            timeZone: localTime.timeZone,
            hour12: false,
        };
        
        const formatted = localTime.local.toLocaleString('es-ES', options);
        
        return `${formatted} (${localTime.offset})`;
    }
    
    /**
     * Batch: convierte múltiples eventos a hora local
     */
    async batchConvertToLocalTime(
        events: Array<{ lat: number; lng: number; timestamp: Date }>
    ): Promise<Map<string, LocalTime | null>> {
        const results = new Map<string, LocalTime | null>();
        
        // Procesar en paralelo con límite de concurrencia
        const batchSize = 10;
        
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            
            const promises = batch.map(async (event) => {
                const key = `${event.lat.toFixed(6)},${event.lng.toFixed(6)},${event.timestamp.getTime()}`;
                const localTime = await this.convertToLocalTime(event.lat, event.lng, event.timestamp);
                results.set(key, localTime);
            });
            
            await Promise.all(promises);
        }
        
        return results;
    }
    
    /**
     * Detecta si un evento ocurrió durante horario laboral
     */
    async isBusinessHours(
        lat: number,
        lng: number,
        timestamp: Date,
        businessStart = 8,  // 8 AM
        businessEnd = 18    // 6 PM
    ): Promise<boolean | null> {
        const localTime = await this.convertToLocalTime(lat, lng, timestamp);
        
        if (!localTime) {
            return null;
        }
        
        const localHour = localTime.local.getHours();
        
        return localHour >= businessStart && localHour < businessEnd;
    }
    
    /**
     * Calcula diferencia horaria entre dos ubicaciones
     */
    async getTimeZoneDifference(
        location1: LatLng,
        location2: LatLng,
        timestamp?: Date
    ): Promise<{ hours: number; minutes: number } | null> {
        const ts = timestamp || new Date();
        
        const [tz1, tz2] = await Promise.all([
            this.getTimeZone(location1.lat, location1.lng, ts),
            this.getTimeZone(location2.lat, location2.lng, ts),
        ]);
        
        if (!tz1 || !tz2) {
            return null;
        }
        
        const offset1 = tz1.rawOffset + tz1.dstOffset;
        const offset2 = tz2.rawOffset + tz2.dstOffset;
        
        const diffSeconds = offset2 - offset1;
        
        return {
            hours: Math.floor(diffSeconds / 3600),
            minutes: Math.abs(Math.floor((diffSeconds % 3600) / 60)),
        };
    }
}

// Exportar instancia única (singleton)
export const googleTimeZoneService = new GoogleTimeZoneService();
export default googleTimeZoneService;

