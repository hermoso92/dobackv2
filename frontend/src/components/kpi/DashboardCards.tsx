import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getDashboardKpis, KpiDashboardResponse } from '../../api/kpi';
import StatsCard from '../StatsCard';

export function DashboardCards() {
    const [data, setData] = useState<KpiDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardKpis()
            .then(setData)
            .catch((error) => {
                toast.error(error instanceof Error ? error.message : 'Error cargando KPIs');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p>Cargando KPIs...</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatsCard title="Geocercas" value={data?.totalGeofenceEvents ?? 0} trend={0} />
            <StatsCard title="Entradas" value={data?.enterEvents ?? 0} trend={0} />
            <StatsCard title="Salidas" value={data?.exitEvents ?? 0} trend={0} />
        </div>
    );
}


