import fetch from 'node-fetch';
import { logger } from '../utils/logger';

export class TomTomService {
    private readonly baseUrl: string;
    private apiKey?: string;

    constructor(options: { baseUrl?: string; apiKey?: string } = {}) {
        this.baseUrl = (options.baseUrl ?? 'https://api.tomtom.com').replace(/\/$/, '');
        this.apiKey = options.apiKey;
    }

    updateApiKey(apiKey?: string) {
        this.apiKey = apiKey;
    }

    private ensureApiKey() {
        if (!this.apiKey) {
            throw new Error('TomTom API key not configured');
        }
    }

    private async request<T>(path: string, init?: RequestInit): Promise<T> {
        this.ensureApiKey();
        const url = new URL(`${this.baseUrl}${path}`);
        url.searchParams.set('key', this.apiKey as string);

        const response = await fetch(url.toString(), init);
        if (!response.ok) {
            const text = await response.text();
            logger.error('TomTom request failed', { path, status: response.status, body: text });
            throw new Error(`TomTom request failed with status ${response.status}`);
        }

        return (await response.json()) as T;
    }

    async getHeatmap(points: Array<{ lat: number; lon: number; weight?: number }>) {
        logger.info('Requesting TomTom heatmap', { count: points.length });
        return this.request('/traffic/map/4/tile/relative0/0/0/0.png', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points })
        });
    }
}
