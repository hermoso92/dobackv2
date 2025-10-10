const API_URL = '/api/events/cluster';

export async function getEventClusters(params: any, token: string) {
    const query = new URLSearchParams(params).toString();
    const url = `${API_URL}?${query}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener clusters de eventos');
    return res.json();
} 