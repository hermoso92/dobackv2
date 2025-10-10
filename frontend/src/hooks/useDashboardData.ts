import { useCallback, useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { DashboardData } from '../types/data';
interface UseDashboardDataResult {
    data: DashboardData | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataResult {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const dataService = DataService.getInstance();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Intentar cargar datos reales
            const hasRealData = await dataService.hasRealData('dashboard');

            if (hasRealData) {
                const realData = await dataService.loadDashboardData();
                setData(realData);
            } else {
                // Datos simulados por defecto
                setData({
                    vehiclesCount: 15,
                    activeAlerts: 3,
                    criticalEvents: 2,
                    stabilityScore: 85,
                    recentEvents: [
                        {
                            id: 'evt_001',
                            timestamp: new Date().toISOString(),
                            type: 'VEHICLE',
                            severity: 'WARNING',
                            message: 'Ángulo de inclinación elevado',
                            vehicleId: 'VH001',
                            acknowledged: false,
                            resolved: false
                        },
                        {
                            id: 'evt_002',
                            timestamp: new Date().toISOString(),
                            type: 'VEHICLE',
                            severity: 'CRITICAL',
                            message: 'LTR crítico detectado',
                            vehicleId: 'VH002',
                            acknowledged: false,
                            resolved: false
                        }
                    ],
                    processedData: {
                        stabilitySessions: 128,
                        canData: '256 GB',
                        gpsRoutes: 64,
                        totalTime: '96h'
                    }
                });
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

    return { data, loading, error, refresh: loadData };
} 