// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore falta tipos
import fetch from 'node-fetch';

// --- Helper común -----------------------------------------------------------
async function quickChartFetch(chartConfig: any): Promise<Buffer> {
    const res = await fetch('https://quickchart.io/chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            width: 800,
            height: 400,
            format: 'png',
            version: '3', // asegúrate de usar Chart.js v3 para compatibilidad con options.plugins
            chart: chartConfig
        })
    });

    // QuickChart a veces devuelve 400 pero envía igualmente una imagen PNG con el detalle del error.
    const contentType = res.headers.get('content-type') || '';
    const buffer = Buffer.from(await res.arrayBuffer());

    if (!res.ok && !contentType.startsWith('image/')) {
        // Solo lanzar error si NO recibimos una imagen. Para texto, intenta leerlo.
        const text = buffer.toString('utf8').slice(0, 200);
        throw new Error(`QuickChart ${res.status} – ${text}`);
    }

    return buffer;
}

// --- Gráfica de eventos por día --------------------------------------------
export async function createChartImage(events: any[]): Promise<Buffer> {
    const grouped: Record<string, number> = {};
    for (const e of events) {
        const key = new Date(e.timestamp).toISOString().slice(0, 10);
        grouped[key] = (grouped[key] || 0) + 1;
    }

    const labels = Object.keys(grouped).sort();
    const data = labels.map((k) => grouped[k]);

    const chartConfig = {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Eventos críticos por día',
                    data,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }
            ]
        },
        options: {
            plugins: { legend: { display: false } }
        }
    };

    return quickChartFetch(chartConfig);
}

// --- Gráfica Velocidad vs SI ----------------------------------------------
export async function createSpeedStabilityChart(
    gps: { timestamp: Date; speed: number }[],
    si: { timestamp: Date; si: number }[]
): Promise<Buffer> {
    if (gps.length === 0) {
        throw new Error('No GPS data');
    }

    const sampleStep = Math.ceil(gps.length / 120) || 1;
    const labels: string[] = [];
    const speedData: number[] = [];
    const siData: number[] = [];

    for (let i = 0; i < gps.length; i += sampleStep) {
        const g = gps[i];
        const ts = new Date(g.timestamp);
        labels.push(ts.toISOString().slice(11, 19)); // HH:MM:SS
        speedData.push(Number(g.speed.toFixed(1)));

        // Encontrar SI más próximo en el tiempo
        const closestSi = si.reduce((prev, curr) => {
            const diffPrev = Math.abs(prev.timestamp.getTime() - g.timestamp.getTime());
            const diffCurr = Math.abs(curr.timestamp.getTime() - g.timestamp.getTime());
            return diffCurr < diffPrev ? curr : prev;
        }, si[0]);

        siData.push(Number((closestSi?.si ?? 0).toFixed(3)));
    }

    const chartConfig = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Velocidad (km/h)',
                    data: speedData,
                    yAxisID: 'y1',
                    borderColor: 'rgba(54, 162, 235, 0.8)',
                    backgroundColor: 'rgba(54, 162, 235, 0.3)',
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Índice Estabilidad',
                    data: siData,
                    yAxisID: 'y2',
                    borderColor: 'rgba(255, 99, 132, 0.8)',
                    backgroundColor: 'rgba(255, 99, 132, 0.3)',
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                y1: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'km/h' }
                },
                y2: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'SI' },
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: { legend: { position: 'bottom' } }
        }
    };

    return quickChartFetch(chartConfig);
}
