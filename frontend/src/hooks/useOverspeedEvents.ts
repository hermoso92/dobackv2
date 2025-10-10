import { useEffect, useState } from "react";
import { getSpeedLimit } from "../services/speedLimitService";
import { StabilityEvent } from "../types/stability";
import { logger } from "../utils/logger";

interface TelemetryPoint {
    timestamp: number | string;
    latitude: number;
    longitude: number;
    speed: number; // km/h
}

interface CanPoint {
    timestamp: number | string;
    engineRPM: number;
    rotativo: boolean;
}

// Función para hacer delay entre peticiones
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Genera eventos de exceso de velocidad comparando la velocidad registrada con el límite de la vía.
 * Se aplica una tolerancia de 0 km/h.
 * Optimizado con rate limiting para evitar sobrecargar la API de Overpass.
 */
export function useOverspeedEvents(telemetry: TelemetryPoint[], canData: CanPoint[] = [], tolerance = 0) {
    const [events, setEvents] = useState<StabilityEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const generate = async () => {
            if (!telemetry.length) {
                setEvents([]);
                return;
            }

            setLoading(true);
            const newEvents: StabilityEvent[] = [];

            // Filtrar puntos con velocidad significativa y reducir densidad
            const filteredPoints = telemetry.filter((point, index) => {
                const speedKmh = point.speed < 45 ? point.speed * 3.6 : point.speed;
                // Solo procesar puntos con velocidad > 20 km/h y cada 5 puntos para reducir carga
                return speedKmh >= 20 && index % 5 === 0;
            });

            logger.info(`[Overspeed] Procesando ${filteredPoints.length} puntos de ${telemetry.length} totales`);

            let counter = 0;
            for (const point of filteredPoints) {
                if (cancelled) break;

                counter++;
                const speedKmh = point.speed < 45 ? point.speed * 3.6 : point.speed;

                let limit = 90;
                try {
                    limit = await getSpeedLimit(point.latitude, point.longitude);
                    // Rate limiting: esperar 100ms entre peticiones para no sobrecargar la API
                    await delay(100);
                } catch (err) {
                    logger.warn('Error obteniendo límite de velocidad, usando 90 km/h', err);
                }

                // Buscar punto CAN más cercano ±1s para rotativo
                const tsMs = typeof point.timestamp === 'number' ? point.timestamp : Date.parse(point.timestamp);
                let nearCan: CanPoint | undefined = undefined;
                if (canData.length) {
                    nearCan = canData.reduce((prev, curr) => {
                        const currMs = typeof curr.timestamp === 'number' ? curr.timestamp : Date.parse(curr.timestamp);
                        const prevMs = typeof prev.timestamp === 'number' ? prev.timestamp : Date.parse(prev.timestamp);
                        return Math.abs(currMs - tsMs) < Math.abs(prevMs - tsMs) ? curr : prev;
                    }, canData[0]);
                }

                if (speedKmh > limit + tolerance) {
                    const ts = typeof point.timestamp === 'number' ? point.timestamp : Date.parse(point.timestamp);
                    newEvents.push({
                        lat: point.latitude,
                        lon: point.longitude,
                        timestamp: new Date(ts).toISOString(),
                        tipos: ["limite_superado_velocidad"],
                        valores: { velocidad_vehiculo: speedKmh, limite_via: limit },
                        can: nearCan ? {
                            engineRPM: nearCan.engineRPM,
                            vehicleSpeed: speedKmh,
                            rotativo: nearCan.rotativo
                        } : undefined,
                    });
                    logger.debug(`[Overspeed] Evento: velocidad=${speedKmh.toFixed(1)} km/h, límite=${limit} km/h`);
                }

                if (counter % 10 === 0) {
                    logger.info(`[Overspeed] Procesados ${counter}/${filteredPoints.length} puntos, eventos: ${newEvents.length}`);
                }
            }

            if (!cancelled) {
                setEvents(newEvents);
                setLoading(false);
                logger.info(`[Overspeed] Generación completada: ${newEvents.length} eventos de velocidad`);
            }
        };

        generate().catch(err => {
            if (!cancelled) {
                logger.error('[Overspeed] Error generando eventos:', err);
                setEvents([]);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [telemetry, canData, tolerance]);

    return { events, loading };
} 