import { useCallback, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { VehicleData } from '../types/data';

interface UseVehicleDataResult {
    vehicles: VehicleData[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useVehicleData(): UseVehicleDataResult {
    const [vehicles, setVehicles] = useState<VehicleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const dataService = DataService.getInstance();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Intentar cargar datos reales
            const hasRealData = await dataService.hasRealData('vehicles');

            if (hasRealData) {
                const realData = await dataService.loadVehicleData();
                setVehicles(realData);
            } else {
                // Datos simulados por defecto
                setVehicles(Array.from({ length: 5 }, (_, i) => ({
                    id: `VH${(i + 1).toString().padStart(3, '0')}`,
                    name: `Vehículo ${i + 1}`,
                    type: i % 2 === 0 ? 'Camión' : 'Furgoneta',
                    status: i % 3 === 0 ? 'En ruta' : i % 2 === 0 ? 'Estacionado' : 'En mantenimiento',
                    lastUpdate: new Date(Date.now() - i * 1800000).toISOString(),
                    metrics: {
                        stabilityScore: Math.round(Math.random() * 30 + 70),
                        alerts: Math.floor(Math.random() * 5),
                        distance: Math.round(Math.random() * 1000)
                    }
                })));
            }
        } catch (error) {
            setError(error instanceof Error ? error : new Error('Unknown error occurred'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { vehicles, loading, error, refresh: loadData };
} 