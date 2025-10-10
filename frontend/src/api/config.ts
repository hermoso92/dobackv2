const AUTH_BASE = '/api/auth';

export const ENDPOINTS = {
    LOGIN: `${AUTH_BASE}/login`,
    REGISTER: `${AUTH_BASE}/register`,
    LOGOUT: `${AUTH_BASE}/logout`,
    REFRESH_TOKEN: `${AUTH_BASE}/refresh-token`,
    PROFILE: `${AUTH_BASE}/me`
} as const;

export type AuthEndpointKey = keyof typeof ENDPOINTS;
export const getEndpoint = (key: AuthEndpointKey) => ENDPOINTS[key];
