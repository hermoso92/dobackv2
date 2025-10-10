const API_URL = '/api/zones';

export async function getAllZones(token: string) {
    const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener zonas');
    return res.json();
}

export async function getZoneById(id: string, token: string) {
    const res = await fetch(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al obtener zona');
    return res.json();
}

export async function createZone(data: any, token: string) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear zona');
    return res.json();
}

export async function updateZone(id: string, data: any, token: string) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar zona');
    return res.json();
}

export async function deleteZone(id: string, token: string) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Error al eliminar zona');
} 