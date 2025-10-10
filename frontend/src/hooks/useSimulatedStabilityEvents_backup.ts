import { useEffect, useState } from 'react';
import { StabilityEvent } from '../types/stability';
import { TelemetryData } from '../types/telemetry';
import { logger } from '../utils/logger';
// Rangos de valores para cada tipo de evento
const EVENT_RANGES = {
    vuelco: {
        roll: { min: 45, max: 90 },
        si: { min: 0.8, max: 1.0 }
    },
    deriva: {
        yaw: { min: 30, max: 60 },
        ay: { min: 1.5, max: 3.0 },
        si: { min: 0.6, max: 0.8 }
    },
    bache: {
        gx: { min: 2.0, max: 4.0 },
        accmag: { min: 2.5, max: 4.0 }
    },
    maniobra_brusca: {
        gx: { min: 2.5, max: 4.0 },
        ay: { min: 1.8, max: 3.0 },
        yaw: { min: 25, max: 45 },
        roll: { min: 15, max: 30 }
    },
    inestabilidad: {
        si: { min: 0.7, max: 0.9 },
        gx: { min: 2.0, max: 3.5 },
        roll: { min: 20, max: 35 },
        ay: { min: 1.5, max: 2.5 },
        yaw: { min: 20, max: 40 }
    }
};

// Función para generar un valor aleatorio dentro de un rango
const getRandomValue = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

// Función para seleccionar tipos de eventos aleatorios
const getRandomEventTypes = (): string[] => {
    const eventTypes = Object.keys(EVENT_RANGES);
    const numEvents = Math.random() < 0.7 ? 1 : 2; // 70% probabilidad de 1 evento, 30% de 2
    const selectedTypes = new Set<string>();

    while (selectedTypes.size < numEvents) {
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        selectedTypes.add(randomType);
    }

    return Array.from(selectedTypes);
};

// Función para generar valores basados en los tipos de eventos
const generateEventValues = (eventTypes: string[]): Record<string, number> => {
    const values: Record<string, number> = {};

    eventTypes.forEach(type => {
        const ranges = EVENT_RANGES[type as keyof typeof EVENT_RANGES];
        Object.entries(ranges).forEach(([key, range]) => {
            values[key] = getRandomValue(range.min, range.max);
        });
    });

    return values;
};

export const useSimulatedStabilityEvents = (telemetryData: TelemetryData[] | null) => {
    const [events, setEvents] = useState<StabilityEvent[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!telemetryData || telemetryData.length === 0) {
            setEvents([]);
            return;
        }

        setLoading(true);
        try {
            // Seleccionar aleatoriamente entre 5-10% de los puntos
            const numPoints = Math.floor(telemetryData.length * (Math.random() * 0.05 + 0.05));
            const selectedIndices = new Set<number>();

            while (selectedIndices.size < numPoints) {
                const randomIndex = Math.floor(Math.random() * telemetryData.length);
                selectedIndices.add(randomIndex);
            }

            // Generar eventos para los puntos seleccionados
            const simulatedEvents: StabilityEvent[] = Array.from(selectedIndices).map(index => {
                const point = telemetryData[index];
                const eventTypes = getRandomEventTypes();

                return {
                    lat: point.latitude || 0,
                    lon: point.longitude || 0,
                    timestamp: point.timestamp,
                    tipos: eventTypes,
                    valores: generateEventValues(eventTypes)
                };
            });

            logger.info(`Eventos simulados generados: ${simulatedEvents.length}`);
            setEvents(simulatedEvents);
        } catch (error) {
            logger.error('Error al generar eventos simulados:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [telemetryData]);

    return { events, loading };
}; 