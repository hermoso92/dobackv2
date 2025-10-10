// backend/src/utils/report/mapbox.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos
import fetch from 'node-fetch';

const TOKEN = process.env.MAPBOX_TOKEN;
if (!TOKEN) {
    console.warn('MAPBOX_TOKEN no definido; los mapas no estarán disponibles');
}

export function buildStaticMapUrl(
    lat: number,
    lon: number,
    zoom = 14,
    width = 600,
    height = 300
): string {
    const marker = `pin-l+ff0000(${lon},${lat})`;
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${marker}/${lon},${lat},${zoom},0/${width}x${height}?access_token=${TOKEN}`;
}

export async function fetchMapboxStatic(lat: number, lon: number): Promise<Buffer> {
    if (!TOKEN) throw new Error('MAPBOX_TOKEN missing');
    const url = buildStaticMapUrl(lat, lon);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}
