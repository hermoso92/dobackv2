import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';

export type EventType = 'vuelco' | 'deriva' | 'bache' | 'maniobra_brusca' | 'inestabilidad';

export interface StabilityEvent {
    tipo: EventType;
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
    can?: {
        engineRPM?: number;
        vehicleSpeed?: number;
        rotativo?: boolean;
    };
}

interface TelemetryData {
    timestamp: string;
    latitude?: number;
    longitude?: number;
    roll?: number;
    gx?: number;
    yaw?: number;
    ay?: number;
    accmag?: number;
    si?: number;
    engineRPM?: number;
    vehicleSpeed?: number;
    rotativo?: boolean;
}

// Filtros de coherencia para eventos
const COHERENCE_FILTERS = {
    MIN_SPEED: 5.5, // km/h
    MIN_RPM: 500,   // RPM mínimo para motor encendido
    MAX_SI_STABLE: 0.5, // SI máximo para considerar estable
    MIN_ROLL_EVENT: 8,  // Roll mínimo para evento
    MIN_YAW_EVENT: 15,  // Yaw mínimo para evento
    MIN_AY_EVENT: 0.3,  // Aceleración lateral mínima para evento
    MIN_ACC_EVENT: 2.0  // Aceleración mínima para evento
};

const detectEvent = (data: TelemetryData): StabilityEvent | null => {
    if (!data.latitude || !data.longitude) {
        return null;
    }

    // --- FILTROS DE COHERENCIA ---
    // Verificar que el motor esté encendido y haya velocidad suficiente
    const engineRunning = (data.engineRPM || 0) > COHERENCE_FILTERS.MIN_RPM;
    const hasSpeed = (data.vehicleSpeed || 0) > COHERENCE_FILTERS.MIN_SPEED;
    const isRotativo = data.rotativo === true;

    if (!engineRunning || !hasSpeed || !isRotativo) {
        logger.debug('Evento descartado por contexto del motor', {
            timestamp: data.timestamp,
            engineRPM: data.engineRPM,
            vehicleSpeed: data.vehicleSpeed,
            rotativo: data.rotativo
        });
        return null;
    }

    // Verificar que SI no sea demasiado alto (estabilidad buena)
    if (data.si && data.si > COHERENCE_FILTERS.MAX_SI_STABLE) {
        logger.debug('Evento descartado por SI alto (estabilidad buena)', {
            timestamp: data.timestamp,
            si: data.si
        });
        return null;
    }

    // Log de los valores que se están evaluando
    logger.debug('Evaluando valores para detección de eventos:', {
        timestamp: data.timestamp,
        roll: data.roll,
        yaw: data.yaw,
        ay: data.ay,
        gx: data.gx,
        accmag: data.accmag,
        si: data.si,
        engineRPM: data.engineRPM,
        vehicleSpeed: data.vehicleSpeed
    });

    const event: StabilityEvent = {
        tipo: 'inestabilidad', // Valor por defecto, será sobrescrito
        lat: data.latitude,
        lon: data.longitude,
        timestamp: data.timestamp,
        valores: {},
        can: {
            engineRPM: data.engineRPM,
            vehicleSpeed: data.vehicleSpeed,
            rotativo: data.rotativo
        }
    };

    // Detectar vuelco con umbral más estricto
    if (data.roll && Math.abs(data.roll) > 25) {
        logger.info('Evento de vuelco detectado:', { roll: data.roll });
        event.tipo = 'vuelco';
        event.valores.roll = data.roll;
        return event;
    }

    // Detectar deriva con umbral más estricto
    if (data.yaw && Math.abs(data.yaw) > COHERENCE_FILTERS.MIN_YAW_EVENT) {
        logger.info('Evento de deriva detectado:', { yaw: data.yaw });
        event.tipo = 'deriva';
        event.valores.yaw = data.yaw;
        return event;
    }

    // Detectar maniobra brusca con umbral más estricto
    if (data.ay && Math.abs(data.ay) > COHERENCE_FILTERS.MIN_AY_EVENT) {
        logger.info('Evento de maniobra brusca detectado:', { ay: data.ay });
        event.tipo = 'maniobra_brusca';
        event.valores.ay = data.ay;
        return event;
    }

    // Detectar bache/golpe con umbral más estricto
    if ((data.gx && Math.abs(data.gx) > COHERENCE_FILTERS.MIN_ACC_EVENT) ||
        (data.accmag && data.accmag > COHERENCE_FILTERS.MIN_ACC_EVENT)) {
        logger.info('Evento de bache/golpe detectado:', { gx: data.gx, accmag: data.accmag });
        event.tipo = 'bache';
        event.valores.gx = data.gx;
        event.valores.accmag = data.accmag;
        return event;
    }

    // Detectar inestabilidad solo si SI es muy bajo
    if (data.si && data.si < 0.3) {
        logger.info('Evento de inestabilidad detectado:', { si: data.si });
        event.tipo = 'inestabilidad';
        event.valores.si = data.si;
        return event;
    }

    return null;
};

export const useStabilityEvents = (telemetryData: TelemetryData[] | undefined) => {
    const [events, setEvents] = useState<StabilityEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Memoizar el procesamiento de eventos para evitar recálculos innecesarios
    const processedEvents = useMemo(() => {
        if (!telemetryData) {
            return [];
        }

        logger.info('Iniciando procesamiento de eventos de estabilidad', {
            totalDataPoints: telemetryData.length
        });

        const detectedEvents = telemetryData
            .map(detectEvent)
            .filter((event): event is StabilityEvent => event !== null);

        logger.info('Eventos detectados y filtrados:', {
            totalEvents: detectedEvents.length,
            eventTypes: detectedEvents.reduce((acc, event) => {
                acc[event.tipo] = (acc[event.tipo] || 0) + 1;
                return acc;
            }, {} as Record<EventType, number>)
        });

        return detectedEvents;
    }, [telemetryData]);

    useEffect(() => {
        const processEvents = () => {
            setLoading(true);
            setError(null);

            try {
                setEvents(processedEvents);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
                logger.error('Error al procesar eventos de estabilidad:', { error: errorMessage });
                setError(errorMessage);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        processEvents();
    }, [processedEvents]);

    const refreshEvents = useCallback(() => {
        setEvents(processedEvents);
    }, [processedEvents]);

    return {
        events,
        loading,
        error,
        refreshEvents,
        totalEvents: events.length,
        eventTypes: events.reduce((acc, event) => {
            acc[event.tipo] = (acc[event.tipo] || 0) + 1;
            return acc;
        }, {} as Record<EventType, number>)
    };
}; 