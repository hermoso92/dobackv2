/* eslint-disable no-restricted-globals */
// Worker para procesar grandes volúmenes de mediciones de estabilidad sin bloquear el hilo principal.

interface Measurement {
    timestamp: number | string;
    ax?: number;
    ay?: number;
    az?: number;
    gx?: number;
    gy?: number;
    gz?: number;
    roll?: number;
    pitch?: number;
    yaw?: number;
    si?: number;
    accmag?: number;
}

interface StabilityDataPoint {
    timestamp: string;
    time: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    roll: number;
    pitch: number;
    yaw: number;
    si: number;
    accmag: number;
}

// @ts-ignore: Web Worker global scope
self.onmessage = (ev: MessageEvent) => {
    const { measurements } = ev.data as { measurements: Measurement[] };

    const MAX_POINTS = 10000;
    let sampled = measurements;
    if (measurements.length > MAX_POINTS) {
        const step = Math.ceil(measurements.length / MAX_POINTS);
        sampled = measurements.filter((_, idx) => idx % step === 0);
    }

    const transformed: StabilityDataPoint[] = sampled.map((data) => {
        const timestamp = typeof data.timestamp === 'number' ? data.timestamp : new Date(data.timestamp).getTime();
        return {
            timestamp: timestamp.toString(),
            time: timestamp,
            ax: data.ax || 0,
            ay: data.ay || 0,
            az: data.az || 0,
            gx: data.gx || 0,
            gy: data.gy || 0,
            gz: data.gz || 0,
            roll: data.roll || 0,
            pitch: data.pitch || 0,
            yaw: data.yaw || 0,
            si: data.si || 0,
            accmag: data.accmag || Math.sqrt(
                Math.pow(data.ax || 0, 2) +
                Math.pow(data.ay || 0, 2) +
                Math.pow(data.az || 0, 2)
            )
        };
    });

    self.postMessage(transformed);
}; 