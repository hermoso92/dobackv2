import { useCallback, useState } from 'react';
import { DATA_CONFIG } from '../config/constants';
import { apiService } from '../services/api';
import { StabilityDataPoint } from '../types/stability';
import { logger } from '../utils/logger';

// Import dinámico del worker sólo en cliente
// @ts-ignore - Vite resolverá la URL del worker
// eslint-disable-next-line import/no-webpack-loader-syntax
// Note: Utilizamos nuevo URL para que Vite empaquete el worker.
// El archivo se creará en src/workers/stabilityWorker.ts
const StabilityWorker = typeof window !== 'undefined' && window.Worker ? new Worker(new URL('../workers/stabilityWorker.ts', import.meta.url), { type: 'module' }) : null;

interface TelemetryData {
    timestamp: string;
    engineRPM: number;
    vehicleSpeed: number;
    throttlePosition: number;
    brakePressure: number;
    steeringAngle: number;
    engineTemperature: number;
    fuelLevel: number;
    gearPosition: number;
    absActive: boolean;
    espActive: boolean;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    heading?: number;
    accuracy?: number;
    // Datos de estabilidad
    roll?: number;
    gx?: number;
    yaw?: number;
    ay?: number;
    accmag?: number;
    si?: number;
    // Campos adicionales que podrían estar en los datos CAN
    lateralAcceleration?: number;
    verticalAcceleration?: number;
    longitudinalAcceleration?: number;
    stabilityIndex?: number;
    pitch?: number;
    rollAngle?: number;
    yawRate?: number;
}

interface TelemetryMetrics {
    averageSpeed: number;
    maxSpeed: number;
    totalDistance: number;
    averageRPM: number;
    maxRPM: number;
    averageTemperature: number;
    maxTemperature: number;
    averageFuel: number;
    totalTime: number;
}

interface GPSData {
    timestamp: string;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    satellites: number;
    heading: number;
    accuracy: number;
}

interface StabilityData {
    timestamp: string;
    stabilityIndex: number;
    rollAngle: number;
    pitchAngle: number;
    yawRate: number;
    lateralAcceleration: number;
    longitudinalAcceleration: number;
    verticalAcceleration: number;
    riskLevel: string;
}

interface Session {
    id: string;
    vehicleId: string;
    startTime: string;
    endTime: string;
    canData: TelemetryData[];
    gpsData: GPSData[];
    stabilityData: StabilityData[];
    metrics: TelemetryMetrics;
    events: any[];
}

interface StabilitySessionResponse {
    success: boolean;
    error?: string;
    data?: {
        sessionId: string;
        vehicleId: string;
        startTime: string;
        endTime: string;
        measurements: Array<{
            timestamp: string;
            ax?: number;
            ay?: number;
            az?: number;
            gx?: number;
            gy?: number;
            gz?: number;
            roll?: number;
            pitch?: number;
            yaw?: number;
            si?: number;
            accmag?: number;
        }>;
        gpsData?: Array<{
            timestamp: string;
            latitude: number;
            longitude: number;
            altitude: number;
            speed: number;
            satellites: number;
            heading: number;
            accuracy: number;
        }>;
        events: any[];
    };
}

export const useStabilityData = (vehicleId: string | null, sessionId: string | null) => {
    const [stabilityData, setStabilityData] = useState<StabilityDataPoint[]>([]);
    const [gpsData, setGpsData] = useState<GPSData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [criticalEvents, setCriticalEvents] = useState<any[]>([]);
    const [acknowledgedEvents, setAcknowledgedEvents] = useState<any[]>([]);

    const loadSessionData = useCallback(async (sessionId: string) => {
        if (!vehicleId || !sessionId) {
            setStabilityData([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            logger.info('Iniciando carga de datos de estabilidad', { vehicleId, sessionId });

            const response = await apiService.get<StabilitySessionResponse>(`/api/stability/session/${sessionId}/data`);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Formato de respuesta inválido');
            }

            const sessionData = response.data as any;
            const { measurements, gpsData, events } = sessionData;

            if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
                logger.warn('No se encontraron datos de estabilidad para la sesión:', sessionId);
                setStabilityData([]);
                return;
            }

            // ---- OPTIMIZACIÓN: Downsampling en el lado del cliente ----
            let sampledMeasurements = measurements;
            if (measurements.length > DATA_CONFIG.MAX_POINTS) {
                const step = Math.ceil(measurements.length / DATA_CONFIG.MAX_POINTS);
                sampledMeasurements = measurements.filter((_: any, idx: number) => idx % step === 0);
                logger.info(`Aplicado downsampling: original=${measurements.length}, muestreados=${sampledMeasurements.length}, step=${step}`);
            }

            // Si existe el Worker y los datos son muy grandes, delegamos la transformación
            let transformedData: StabilityDataPoint[] = [];

            if (StabilityWorker) {
                logger.info('Procesando datos en Web Worker', { total: sampledMeasurements.length });

                transformedData = await new Promise<StabilityDataPoint[]>((resolve, reject) => {
                    let isResolved = false;

                    const handleMessage = (ev: MessageEvent) => {
                        if (!isResolved) {
                            isResolved = true;
                            resolve(ev.data as StabilityDataPoint[]);
                            StabilityWorker?.removeEventListener('message', handleMessage);
                            StabilityWorker?.removeEventListener('error', handleError);
                        }
                    };

                    const handleError = (err: ErrorEvent) => {
                        if (!isResolved) {
                            isResolved = true;
                            logger.error('Error en worker:', err);
                            reject(err);
                            StabilityWorker?.removeEventListener('message', handleMessage);
                            StabilityWorker?.removeEventListener('error', handleError);
                        }
                    };

                    StabilityWorker.addEventListener('message', handleMessage);
                    StabilityWorker.addEventListener('error', handleError);
                    StabilityWorker.postMessage({ measurements: sampledMeasurements });
                });
            } else {
                transformedData = sampledMeasurements.map((data: any) => {
                    const timestamp = typeof data.timestamp === 'number' ? data.timestamp : new Date(data.timestamp).getTime();
                    return {
                        timestamp: timestamp.toString(),
                        time: timestamp,
                        ax: data.ax || 0,
                        ay: (data.ay || 0) * 0.01,
                        az: data.az || 0,
                        gx: data.gx || 0,
                        gy: data.gy || 0,
                        gz: (data.gz || 0) * 0.001,
                        roll: data.roll || 0,
                        pitch: data.pitch || 0,
                        yaw: data.yaw || 0,
                        si: data.si || 0,
                        accmag: data.accmag || Math.sqrt(
                            Math.pow(data.ax || 0, 2) +
                            Math.pow((data.ay || 0) * 0.01, 2) +
                            Math.pow(data.az || 0, 2)
                        )
                    };
                });
            }

            logger.info('Datos transformados:', {
                totalPoints: transformedData.length,
                sessionId,
                vehicleId
            });

            setStabilityData(transformedData);

            // Procesar datos GPS si están disponibles
            if (gpsData && Array.isArray(gpsData) && gpsData.length > 0) {
                logger.info(`📍 Datos GPS disponibles: ${gpsData.length} puntos`);
                setGpsData(gpsData);
            } else {
                logger.info('📍 No hay datos GPS disponibles para esta sesión');
                setGpsData([]);
            }

            setCriticalEvents(events || []);
            setError(null);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos de estabilidad';
            logger.error('Error cargando datos de estabilidad:', { error: err, sessionId, vehicleId });
            setError(errorMessage);
            setStabilityData([]);
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    return {
        stabilityData,
        gpsData,
        loading,
        error,
        criticalEvents,
        acknowledgedEvents,
        loadSessionData
    };
}; 