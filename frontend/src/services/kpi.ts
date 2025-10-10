const API_URL = '/api/kpi';

export async function getVehicleKPI(vehicleId: string, token: string, date?: string) {
    const url = date ? `${API_URL}/vehicle?vehicleId=${vehicleId}&date=${date}` : `${API_URL}/vehicle?vehicleId=${vehicleId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener KPIs del vehículo');
    return res.json();
}

export async function getParkKPI(parkId: string, token: string, date?: string) {
    const url = date ? `${API_URL}/park?parkId=${parkId}&date=${date}` : `${API_URL}/park?parkId=${parkId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener KPIs del parque');
    return res.json();
} 