import fetch, { Headers, RequestInit } from 'node-fetch';
import { logger } from '../utils/logger';

export class RadarConfigurationError extends Error {
    constructor(message = 'Radar secret key not configured') {
        super(message);
        this.name = 'RadarConfigurationError';
    }
}

export class RadarRequestError extends Error {
    public readonly status: number;
    public readonly body?: string;

    constructor(status: number, message: string, body?: string) {
        super(message);
        this.name = 'RadarRequestError';
        this.status = status;
        this.body = body;
    }
}

type RadarServiceOptions = {
    baseUrl?: string;
    secretKey?: string;
    cacheTtlMs?: number;
};

type GeofenceOptions = {
    forceRefresh?: boolean;
};

type HeadersDictionary = Record<string, string>;

export class RadarService {
    private baseUrl: string;
    private secretKey?: string;
    private cacheTtlMs: number;
    private geofenceCache: { expiresAt: number; data: unknown } | null = null;

    constructor(options: RadarServiceOptions = {}) {
        this.baseUrl = (options.baseUrl ?? 'https://api.radar.io/v1').replace(/\/$/, '');
        this.secretKey = options.secretKey?.trim() || undefined;
        this.cacheTtlMs = options.cacheTtlMs ?? 300_000;
    }

    updateSecretKey(secretKey?: string) {
        this.secretKey = secretKey?.trim() || undefined;
        this.clearCache();
    }

    setCacheTtl(ms: number) {
        if (Number.isFinite(ms) && ms > 0) {
            this.cacheTtlMs = ms;
            this.clearCache();
        }
    }

    clearCache() {
        this.geofenceCache = null;
    }

    private ensureSecretKey() {
        if (!this.secretKey) {
            throw new RadarConfigurationError();
        }
    }

    private buildHeaders(initHeaders?: RequestInit['headers']): HeadersDictionary {
        const headers: HeadersDictionary = {
            Authorization: this.secretKey as string // Radar usa key directamente, NO "Bearer"
        };

        if (!initHeaders) {
            return headers;
        }

        if (Array.isArray(initHeaders)) {
            for (const [key, value] of initHeaders) {
                headers[key] = String(value);
            }
            return headers;
        }

        if (typeof (initHeaders as Headers) === 'object' && typeof (initHeaders as Headers).forEach === 'function') {
            (initHeaders as Headers).forEach((value, key) => {
                headers[key] = value;
            });
            return headers;
        }

        return { ...headers, ...(initHeaders as HeadersDictionary) };
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        this.ensureSecretKey();
        const url = `${this.baseUrl}${path}`;

        const response = await fetch(url, {
            ...init,
            headers: this.buildHeaders(init.headers)
        });

        if (!response.ok) {
            const body = await response.text();
            logger.error('Radar request failed', { url, status: response.status, body });
            throw new RadarRequestError(response.status, `Radar request failed with status ${response.status}`, body);
        }

        return response.json() as Promise<T>;
    }

    async getGeofences(options: GeofenceOptions = {}) {
        const forceRefresh = options.forceRefresh ?? false;
        if (!forceRefresh && this.geofenceCache && this.geofenceCache.expiresAt > Date.now()) {
            return this.geofenceCache.data;
        }

        const now = Date.now();
        logger.info('Fetching geofences from Radar', { forceRefresh });
        const data = await this.request<unknown>('/geofences');
        this.geofenceCache = {
            data,
            expiresAt: now + this.cacheTtlMs
        };
        return data;
    }

    /**
     * Verificar si coordenadas están dentro de geocercas usando Context API
     * https://radar.com/documentation/api#context
     */
    async getContext(lat: number, lon: number): Promise<unknown> {
        logger.info('Getting context from Radar', { lat, lon });
        return this.request<unknown>(`/context?coordinates=${lat},${lon}`);
    }

    async geocode<T = unknown>(query: string): Promise<T> {
        const trimmed = query?.trim();
        if (!trimmed) {
            throw new RadarRequestError(400, 'Query is required for Radar geocode');
        }

        const body = new URLSearchParams();
        body.append('query', trimmed);

        logger.info('Requesting Radar geocode');
        return this.request<T>('/geocode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body
        });
    }
}
