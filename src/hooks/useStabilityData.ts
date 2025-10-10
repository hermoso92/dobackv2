import { useCallback, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { StabilityData } from '../types/data';

interface UseStabilityDataProps {
    vehicleId: string;
    simulationMode?: boolean;
    samplingRate?: number;
    timeWindow?: number;
    decimationFactor?: number;
}

interface UseStabilityDataResult {
    data: StabilityData[];
    loading: boolean;
    error: Error | null;
}

export function useStabilityData({
    vehicleId,
    simulationMode = false,
    samplingRate = 100,
    timeWindow = 60,
    decimationFactor = 1
}: UseStabilityDataProps): UseStabilityDataResult {
    const [data, setData] = useState<StabilityData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const dataService = DataService.getInstance();

    // Función para generar datos simulados
    const getSimulatedData = useCallback((): StabilityData => {
        const now = Date.now();
        const time = now / 1000; // tiempo en segundos

        // Simulación de datos de estabilidad
        const roll = 3 * Math.sin(time * 0.1) + 2 * Math.sin(time * 0.3) + 1 * (Math.random() - 0.5);
        const pitch = 1 * Math.sin(time * 0.2) + 0.5 * (Math.random() - 0.5);
        const speed = 60 + 20 * Math.sin(time * 0.05) + 5 * (Math.random() - 0.5);
        const lateralAcc = (roll / 15) * (speed / 50) * 1.2;

        // Calcular LTR (Load Transfer Ratio)
        const ltr = Math.min(0.99, Math.max(0.01, lateralAcc * 2 + 0.5));

        return {
            timestamp: now,
            ltr: ltr,
            angle: roll,
            roll: roll,
            pitch: pitch,
            lateralAcceleration: lateralAcc,
            gyro_x: roll * 0.1 + (Math.random() * 0.1 - 0.05),
            gyro_y: roll * 0.05 + (Math.random() * 0.1 - 0.05),
            gyro_z: lateralAcc * 0.8 + (Math.random() * 0.2 - 0.1),
            acceleration_x: lateralAcc * 0.4 + (Math.random() * 0.1 - 0.05),
            acceleration_y: lateralAcc + (Math.random() * 0.1 - 0.05),
            acceleration_z: 9.8 + roll * 0.05 + (Math.random() * 0.2 - 0.1),
            speed: speed
        };
    }, []);

    // Función para cargar datos reales
    const loadRealData = useCallback(async () => {
        try {
            const endTime = Date.now();
            const startTime = endTime - (timeWindow * 1000);
            const realData = await dataService.loadStabilityData(vehicleId, startTime, endTime);

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