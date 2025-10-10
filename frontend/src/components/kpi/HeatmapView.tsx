import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import { HeatmapPoint, getHeatmapData } from '../../api/kpi';

const mapCenter: [number, number] = [40.4168, -3.7038];

export function HeatmapView() {
    const [points, setPoints] = useState<HeatmapPoint[]>([]);

    useEffect(() => {
        getHeatmapData()
            .then(setPoints)
            .catch((error) => toast.error(error instanceof Error ? error.message : 'Error cargando mapa'));
    }, []);

    return (
        <div className="h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <MapContainer center={mapCenter} zoom={11} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {points.map((point, index) => (
                    <CircleMarker
                        key={index}
                        center={[point.lat, point.lng]}
                        radius={6 + (point.severity ?? 0) * 2}
                        pathOptions={{ color: severityToColor(point.severity) }}
                    >
                        <Tooltip>
                            <div>
                                <p>Severidad: {point.severity}</p>
                                {point.speed && <p>Velocidad: {point.speed} km/h</p>}
                                {point.count && <p>Eventos: {point.count}</p>}
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}

const severityToColor = (severity = 0) => {
    if (severity >= 2) return '#ef4444';
    if (severity >= 1) return '#f97316';
    return '#22c55e';
};


