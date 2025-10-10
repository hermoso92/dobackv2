import { CANData, GPSData, TelemetryMetrics } from '../types/telemetry';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

export class TelemetryProcessorService {
    public processRawCANData(data: string[]): CANData {
        try {
            const [timestamp, speed, inclination, load, temperature] = data;
            return {
                timestamp: new Date(timestamp),
                vehicleId: '', // Se debe proporcionar desde el contexto
                sessionId: '', // Se debe proporcionar desde el contexto
                speed: parseFloat(speed),
                inclination: parseFloat(inclination),
                load: parseFloat(load),
                temperature: parseFloat(temperature)
            };
        } catch (error) {
            logger.error('Error procesando datos CAN', { error, data });
            throw new ApiError(400, 'Error procesando datos CAN');
        }
    }

    public processRawGPSData(data: string[]): GPSData {
        try {
            const [date, time, latitude, longitude, altitude, speed, heading, satellites, hdop] = data;
            return {
                timestamp: new Date(`${date}T${time}`),
                vehicleId: '', // Se debe proporcionar desde el contexto
                sessionId: '', // Se debe proporcionar desde el contexto
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                altitude: parseFloat(altitude),
                speed: parseFloat(speed),
                heading: parseFloat(heading),
                satellites: parseInt(satellites),
                hdop: parseFloat(hdop)
            };
        } catch (error) {
            logger.error('Error procesando datos GPS', { error, data });
            throw new ApiError(400, 'Error procesando datos GPS');
        }
    }

    public calculateMetrics(canData: CANData[], gpsData: GPSData[]): TelemetryMetrics {
        try {
            if (!canData.length || !gpsData.length) {
                throw new ApiError(400, 'No hay datos suficientes para calcular métricas');
            }

            // Calcular métricas de velocidad
            const speeds = [...canData.map(d => d.speed), ...gpsData.map(d => d.speed)];
            const averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            const maxSpeed = Math.max(...speeds);

            // Calcular distancia total usando coordenadas GPS
            let totalDistance = 0;
            for (let i = 1; i < gpsData.length; i++) {
                totalDistance += this.calculateDistance(
                    gpsData[i - 1].latitude,
                    gpsData[i - 1].longitude,
                    gpsData[i].latitude,
                    gpsData[i].longitude
                );
            }

            // Calcular métricas de altitud
            const altitudes = gpsData.map(d => d.altitude);
            const averageAltitude = altitudes.reduce((a, b) => a + b, 0) / altitudes.length;
            const maxAltitude = Math.max(...altitudes);
            const minAltitude = Math.min(...altitudes);

            // Calcular métricas de inclinación
            const inclinations = canData.map(d => d.inclination);
            const averageInclination = inclinations.reduce((a, b) => a + b, 0) / inclinations.length;
            const maxInclination = Math.max(...inclinations);

            // Calcular métricas de temperatura
            const temperatures = canData.map(d => d.temperature);
            const averageTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
            const maxTemperature = Math.max(...temperatures);

            // Calcular métricas de carga
            const loads = canData.map(d => d.load);
            const averageLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
            const maxLoad = Math.max(...loads);

            return {
                averageSpeed,
                maxSpeed,
                totalDistance,
                averageAltitude,
                maxAltitude,
                minAltitude,
                averageInclination,
                maxInclination,
                averageTemperature,
                maxTemperature,
                averageLoad,
                maxLoad
            };
        } catch (error) {
            logger.error('Error calculando métricas de telemetría', { error });
            throw new ApiError(400, 'Error calculando métricas de telemetría');
        }
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Radio de la Tierra en metros
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
} 