import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { SpeedingEvent, getSpeedingEvents } from '../../api/kpi';

export function SpeedingView() {
    const [events, setEvents] = useState<SpeedingEvent[]>([]);

    useEffect(() => {
        getSpeedingEvents()
            .then(setEvents)
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Error cargando excesos de velocidad'));
    }, []);

    if (!events.length) {
        return <p>No hay eventos de exceso de velocidad registrados.</p>;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full table-fixed border-collapse text-sm">
                <thead className="bg-slate-100 text-left uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-4 py-3">Vehículo</th>
                        <th className="px-4 py-3">Velocidad</th>
                        <th className="px-4 py-3">Límite</th>
                        <th className="px-4 py-3">Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.id} className="border-t border-slate-100">
                            <td className="px-4 py-2">{event.vehicle || event.vehicleId}</td>
                            <td className="px-4 py-2 font-medium text-red-500">{event.speed} km/h</td>
                            <td className="px-4 py-2">{event.limit} km/h</td>
                            <td className="px-4 py-2">{new Date(event.occurredAt).toLocaleString('es-ES')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


