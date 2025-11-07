/**
 * Google Weather API Service (Beta)
 * 
 * Obtiene datos meteorológicos para ubicaciones GPS
 * Útil para correlacionar eventos con condiciones climáticas
 * 
 * Nota: Weather API está en beta preview. Si no está disponible,
 * puedes usar alternativas como OpenWeatherMap.
 */

import { GOOGLE_MAPS_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';
import { GoogleMapsServiceBase, LatLng } from './index';

// ===========================
// TIPOS Y INTERFACES
// ===========================

export interface WeatherCondition {
    location: LatLng;
    timestamp: Date;
    temperature?: number;  // Celsius
    humidity?: number;  // Porcentaje
    precipitation?: number;  // mm
    windSpeed?: number;  // km/h
    windDirection?: string;  // N, NE, E, etc.
    condition?: string;  // "clear", "rain", "snow", etc.
    description?: string;  // "Lluvia ligera", "Despejado", etc.
    visibility?: number;  // Metros
    pressure?: number;  // hPa
}

export interface WeatherAlert {
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
    event: string;
    headline: string;
    description: string;
    start: Date;
    end: Date;
    areas: string[];
}

// ===========================
// SERVICIO DE WEATHER
// ===========================

class GoogleWeatherService extends GoogleMapsServiceBase {
    
    /**
     * Obtiene condiciones meteorológicas actuales
     * 
     * Nota: Esta es una implementación de referencia.
     * Weather API puede requerir configuración adicional.
     */
    async getCurrentWeather(lat: number, lng: number): Promise<WeatherCondition | null> {
        this.checkApiKey();
        
        // Rate limiting
        await this.rateLimit(GOOGLE_MAPS_CONFIG.RATE_LIMITS.PLACES);
        
        try {
            // Endpoint de Google Weather API (beta)
            const url = `https://weather.googleapis.com/v1/weather?location.latitude=${lat}&location.longitude=${lng}&key=${this.apiKey}`;
            
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                60 * 60 * 1000 // Cache 1 hora (clima cambia rápido)
            );
            
            if (!response) {
                return null;
            }
            
            // Parsear respuesta (estructura puede variar según versión API)
            return this.parseWeatherResponse(response, lat, lng);
            
        } catch (error: any) {
            // Si Weather API no está disponible, retornar null
            logger.warn('Weather API: No disponible o no habilitada', {
                lat,
                lng,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Implementación alternativa usando OpenWeatherMap
     * (Backup si Google Weather API no está disponible)
     */
    async getCurrentWeatherOpenWeather(lat: number, lng: number): Promise<WeatherCondition | null> {
        // Nota: Requiere OPENWEATHER_API_KEY en variables de entorno
        const openWeatherKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
        
        if (!openWeatherKey) {
            logger.warn('OpenWeatherMap API Key no configurada');
            return null;
        }
        
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${openWeatherKey}&units=metric&lang=es`;
            
            const response = await this.fetchAPI<any>(
                url,
                {},
                true,
                60 * 60 * 1000 // Cache 1 hora
            );
            
            if (!response || response.cod !== 200) {
                return null;
            }
            
            return {
                location: { lat, lng },
                timestamp: new Date(),
                temperature: response.main?.temp,
                humidity: response.main?.humidity,
                precipitation: response.rain?.['1h'] || response.snow?.['1h'] || 0,
                windSpeed: response.wind?.speed ? response.wind.speed * 3.6 : undefined, // m/s a km/h
                windDirection: this.degreesToDirection(response.wind?.deg),
                condition: response.weather?.[0]?.main?.toLowerCase(),
                description: response.weather?.[0]?.description,
                visibility: response.visibility,
                pressure: response.main?.pressure,
            };
            
        } catch (error: any) {
            logger.error('OpenWeather: Error', {
                lat,
                lng,
                error: error.message,
            });
            return null;
        }
    }
    
    /**
     * Analiza si las condiciones meteorológicas son peligrosas
     */
    isDangerousWeather(weather: WeatherCondition): boolean {
        if (!weather) return false;
        
        const dangerousConditions = ['storm', 'heavy rain', 'snow', 'fog', 'ice'];
        
        // Lluvia intensa
        if (weather.precipitation && weather.precipitation > 10) {
            return true;
        }
        
        // Viento fuerte
        if (weather.windSpeed && weather.windSpeed > 50) {
            return true;
        }
        
        // Visibilidad reducida
        if (weather.visibility && weather.visibility < 1000) {
            return true;
        }
        
        // Condición peligrosa
        if (weather.condition && dangerousConditions.some(c => weather.condition?.includes(c))) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Correlaciona eventos de estabilidad con condiciones meteorológicas
     */
    async correlateEventsWithWeather(
        events: Array<{ lat: number; lng: number; timestamp: Date }>
    ): Promise<Map<string, WeatherCondition | null>> {
        const results = new Map<string, WeatherCondition | null>();
        
        // Procesar en paralelo
        const batchSize = 5;
        
        for (let i = 0; i < events.length; i += batchSize) {
            const batch = events.slice(i, i + batchSize);
            
            const promises = batch.map(async (event) => {
                const key = `${event.lat.toFixed(6)},${event.lng.toFixed(6)},${event.timestamp.getTime()}`;
                
                // Intentar primero Google Weather API
                let weather = await this.getCurrentWeather(event.lat, event.lng);
                
                // Si falla, usar OpenWeatherMap como backup
                if (!weather) {
                    weather = await this.getCurrentWeatherOpenWeather(event.lat, event.lng);
                }
                
                results.set(key, weather);
            });
            
            await Promise.all(promises);
            
            // Pausa entre batches
            if (i + batchSize < events.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return results;
    }
    
    /**
     * Genera resumen de condiciones climáticas para un reporte
     */
    getWeatherSummary(weather: WeatherCondition): string {
        if (!weather) {
            return 'Datos meteorológicos no disponibles';
        }
        
        const parts: string[] = [];
        
        if (weather.temperature !== undefined) {
            parts.push(`${weather.temperature.toFixed(1)}°C`);
        }
        
        if (weather.description) {
            parts.push(weather.description);
        }
        
        if (weather.precipitation && weather.precipitation > 0) {
            parts.push(`${weather.precipitation.toFixed(1)}mm precipitación`);
        }
        
        if (weather.windSpeed && weather.windSpeed > 20) {
            parts.push(`viento ${weather.windSpeed.toFixed(0)} km/h`);
        }
        
        if (weather.visibility && weather.visibility < 5000) {
            parts.push(`visibilidad ${(weather.visibility / 1000).toFixed(1)}km`);
        }
        
        return parts.length > 0 ? parts.join(', ') : 'Condiciones normales';
    }
    
    /**
     * Helpers
     */
    
    private parseWeatherResponse(response: any, lat: number, lng: number): WeatherCondition {
        // Estructura puede variar según versión de Google Weather API
        // Esta es una implementación de referencia
        return {
            location: { lat, lng },
            timestamp: new Date(),
            temperature: response.temperature?.value,
            humidity: response.humidity?.value,
            precipitation: response.precipitation?.value,
            windSpeed: response.wind?.speed,
            condition: response.condition,
            description: response.description,
        };
    }
    
    private degreesToDirection(degrees?: number): string | undefined {
        if (degrees === undefined) return undefined;
        
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
        const index = Math.round((degrees % 360) / 22.5);
        return directions[index % 16];
    }
}

// Exportar instancia única (singleton)
export const googleWeatherService = new GoogleWeatherService();
export default googleWeatherService;

