import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';

export function useVehicleKPI(vehicleId: string, token: string, date?: string) {
    const [kpi, setKpi] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchKPI = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Usar el endpoint real del backend Node
            const response = await apiService.get(`/api/api/dashboard/metrics/vehicles/${vehicleId}`);
            setKpi(response);
        } catch (err: any) {
            setError(err.message || 'Error al obtener KPIs');
        } finally {
            setLoading(false);
        }
    }, [vehicleId]);

    useEffect(() => {
        if (vehicleId) fetchKPI();
    }, [vehicleId, fetchKPI]);

    return { kpi, loading, error, refetch: fetchKPI };
} 