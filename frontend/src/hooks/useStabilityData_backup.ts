import { useCallback, useState } from 'react';
import { apiService } from '../services/api';
import { StabilityDataPoint } from '../types/stability';
import { logger } from '../utils/logger';
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
        events: any[];
    };
}

export const useStabilityData = (vehicleId: string | null, sessionId: string | null) => {
    const [stabilityData, setStabilityData] = useState<StabilityDataPoint[]>([]);
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
            const { measurements, events } = sessionData;

            if (!measurements || !Array.isArray(measurements) || measurements.length === 0) {
                logger.warn('No se encontraron datos de estabilidad para la sesión:', sessionId);
                setStabilityData([]);
                return;
            }

            const transformedData: StabilityDataPoint[] = measurements.map((data: any) => ({
                timestamp: data.timestamp,
                time: new Date(data.timestamp).getTime(),
                ax: data.ax || 0,
                ay: data.ay || 0,
                az: data.az || 0,
                gx: data.gx || 0,
                gy: data.gy || 0,
                gz: data.gz || 0,
                roll: data.roll || 0,
                pitch: data.pitch || 0,
                yaw: data.yaw || 0,
                si: data.si || 0,
                accmag: data.accmag || Math.sqrt(
                    Math.pow(data.ax || 0, 2) +
                    Math.pow(data.ay || 0, 2) +
                    Math.pow(data.az || 0, 2)
                )
            }));

            logger.info('Datos transformados:', {
                totalPoints: transformedData.length,
                samplePoint: transformedData[0]
            });

            setStabilityData(transformedData);
            setCriticalEvents(events || []);
        } catch (error) {
            logger.error('Error al cargar datos de estabilidad:', error);
            setError('Error al cargar datos de estabilidad');
            setStabilityData([]);
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    const handleEventAcknowledged = useCallback((eventId: string) => {
        setAcknowledgedEvents(prev => [...prev, eventId]);
    }, []);

    return {
        stabilityData,
        loading,
        error,
        criticalEvents,
        acknowledgedEvents,
        handleEventAcknowledged,
        loadSessionData
    };
}; 