import { useCallback, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { TelemetryData } from '../types/data';

interface UseTelemetryDataProps {
    vehicleId: string;
    simulationMode?: boolean;
    samplingRate?: number;
    timeWindow?: number;
    decimationFactor?: number;
}

interface UseTelemetryDataResult {
    data: TelemetryData[];
    loading: boolean;
    error: Error | null;
}

export function useTelemetryData({
    vehicleId,
    simulationMode = false,
    samplingRate = 100,
    timeWindow = 60,
    decimationFactor = 1
}: UseTelemetryDataProps): UseTelemetryDataResult {
    const [data, setData] = useState<TelemetryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const dataService = DataService.getInstance();

    // Función para generar datos simulados
    const getSimulatedData = useCallback((): TelemetryData => {
        const now = Date.now();
        const time = now / 1000; // tiempo en segundos

        // Simulación de conducción en curva con aceleración lateral
        const lateralAcc = 0.2 * Math.sin(time * 0.1) + 0.1 * Math.sin(time * 0.5) + 0.05 * (Math.random() - 0.5);
        const rollAngle = 3 * Math.sin(time * 0.1) + 2 * Math.sin(time * 0.3) + 1 * (Math.random() - 0.5);
        const pitchAngle = 1 * Math.sin(time * 0.2) + 0.5 * (Math.random() - 0.5);
        const speed = 60 + 20 * Math.sin(time * 0.05) + 5 * (Math.random() - 0.5);

        return {
            timestamp: now,
            acceleration_x: 0.1 * Math.sin(time * 0.3) + 0.05 * (Math.random() - 0.5),
            acceleration_y: lateralAcc,
            acceleration_z: -1.0 + 0.1 * Math.sin(time * 0.2) + 0.05 * (Math.random() - 0.5),
            gyro_x: 0.5 * Math.sin(time * 0.3) + 0.2 * (Math.random() - 0.5),
            gyro_y: 0.3 * Math.sin(time * 0.4) + 0.2 * (Math.random() - 0.5),
            gyro_z: 0.2 * Math.sin(time * 0.5) + 0.1 * (Math.random() - 0.5),
            angular_x: rollAngle,
            angular_y: pitchAngle,
            angular_z: 1 * Math.sin(time * 0.1) + 0.5 * (Math.random() - 0.5),
            speed: speed,
            lateral_acc: lateralAcc,
            roll_angle: rollAngle,
            pitch_angle: pitchAngle
        };
    }, []);

    // Función para cargar datos reales
    const loadRealData = useCallback(async () => {
        try {
            const endTime = Date.now();
            const startTime = endTime - (timeWindow * 1000);
            const realData = await dataService.loadTelemetryData(vehicleId, startTime, endTime);

            if (realData.length > 0) {
                setData(realData);
                setLoading(false);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading real data:', error);
            return false;
        }
    }, [vehicleId, timeWindow]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        const initializeData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Intentar cargar datos reales primero
                const hasRealData = await loadRealData();

                // Si no hay datos reales y estamos en modo simulación, usar datos simulados
                if (!hasRealData && simulationMode) {
                    intervalId = setInterval(() => {
                        const newData = getSimulatedData();
                        setData(prevData => {
                            const updatedData = [...prevData, newData];
                            // Mantener solo los datos dentro de la ventana de tiempo
                            const cutoffTime = Date.now() - (timeWindow * 1000);
                            return updatedData.filter(d => d.timestamp >= cutoffTime);
                        });
                    }, samplingRate);
                }
            } catch (error) {
                setError(error instanceof Error ? error : new Error('Unknown error occurred'));
            } finally {
                setLoading(false);
            }
        };

        initializeData();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [vehicleId, simulationMode, samplingRate, timeWindow, loadRealData, getSimulatedData]);

    return { data, loading, error };
} 