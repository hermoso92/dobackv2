// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos en tiempo de compilación
import fetch from 'node-fetch';

const MAP_BASE = 'https://staticmap.openstreetmap.de/staticmap.php';

export async function fetchStaticMap(
    lat: number,
    lon: number,
    zoom = 14,
    width = 600,
    height = 300
): Promise<Buffer> {
    const url = `${MAP_BASE}?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lon},red`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error obteniendo mapa estático ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}
