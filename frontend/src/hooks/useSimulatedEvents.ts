import { useEffect, useState } from 'react';
import { TelemetryData } from './useStabilityData';
import { logger } from '../utils/logger';
export interface SimulatedEvent {
    tipos: string[];
    lat: number;
    lon: number;
    timestamp: string;
    valores: {
        roll?: number;
        gx?: number;
        yaw?: number;
        ay?: number;
        accmag?: number;
        si?: number;
    };
}

const EVENT_TYPES = [
    'vuelco',
    'deriva',
    'bache',
    'maniobra_brusca',
    'inestabilidad'
] as const;

const EVENT_COMBINATIONS = [
    ['vuelco'],
    ['deriva'],
    ['bache'],
    ['maniobra_brusca'],
    ['inestabilidad'],
    ['vuelco', 'maniobra_brusca'],
    ['deriva', 'maniobra_brusca'],
    ['bache', 'inestabilidad'],
    ['vuelco', 'inestabilidad'],
    ['deriva', 'inestabilidad']
];

const generateEventValues = (tipos: string[]): SimulatedEvent['valores'] => {
    const valores: SimulatedEvent['valores'] = {};

    if (tipos.includes('vuelco')) {
        valores.roll = Math.random() * 25 + 45; // 45° a 70°
        valores.si = Math.random() * 0.3 + 0.2; // 0.2 a 0.5
    }

    if (tipos.includes('deriva')) {
        valores.yaw = Math.random() * 30 + 30; // 30° a 60°
        valores.ay = Math.random() * 2 + 3; // 3g a 5g
    }

    if (tipos.includes('bache')) {
        valores.gx = Math.random() * 3 + 4; // 4g a 7g
        valores.accmag = Math.random() * 2 + 5; // 5g a 7g
    }

    if (tipos.includes('maniobra_brusca')) {
        valores.ay = Math.random() * 3 + 4; // 4g a 7g
        valores.yaw = Math.random() * 20 + 40; // 40° a 60°
    }

    if (tipos.includes('inestabilidad')) {
        valores.si = Math.random() * 0.3 + 0.2; // 0.2 a 0.5
    }

    return valores;
};

export const useSimulatedEvents = (telemetryData: TelemetryData[] | null) => {
    const [simulatedEvents, setSimulatedEvents] = useState<SimulatedEvent[]>([]);

    useEffect(() => {
        if (!telemetryData || telemetryData.length === 0) {
            setSimulatedEvents([]);
            return;
        }

        // Seleccionar aleatoriamente entre 5% y 10% de los puntos para eventos
        const numEvents = Math.floor(telemetryData.length * (Math.random() * 0.05 + 0.05));
        const eventIndices = new Set<number>();

        while (eventIndices.size < numEvents) {
            const index = Math.floor(Math.random() * telemetryData.length);
            if (index > 0 && index < telemetryData.length - 1) { // Evitar primer y último punto
                eventIndices.add(index);
            }
        }

        const events: SimulatedEvent[] = Array.from(eventIndices).map(index => {
            const point = telemetryData[index];
            const eventTypes = EVENT_COMBINATIONS[Math.floor(Math.random() * EVENT_COMBINATIONS.length)];

            return {
                tipos: eventTypes,
                lat: point.lat,
                lon: point.lon,
                timestamp: point.timestamp,
                valores: generateEventValues(eventTypes)
            };
        });

        logger.info('Eventos simulados generados:', events);
        setSimulatedEvents(events);
    }, [telemetryData]);

    return simulatedEvents;
}; 