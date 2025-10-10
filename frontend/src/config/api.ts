/**
 * Configuración de API para DobackSoft
 * Centraliza todas las URLs y configuraciones de endpoints
 */

// Configuración base de la API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9998';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10);

// Endpoints del dashboard
export const DASHBOARD_ENDPOINTS = {
    METRICS: `${API_BASE_URL}/api/dashboard/metrics`,
    VEHICLES: `${API_BASE_URL}/api/dashboard/vehicles`,
    ALARMS: `${API_BASE_URL}/api/dashboard/alarms`,
    STATS: `${API_BASE_URL}/api/dashboard/stats`,
} as const;

// Endpoints de estabilidad
export const STABILITY_ENDPOINTS = {
    REGENERATE_ALL: `${API_BASE_URL}/api/stability/regenerate-all-events`,
    SESSIONS: `${API_BASE_URL}/api/stability/sessions`,
    EVENTS: `${API_BASE_URL}/api/stability/events`,
} as const;

// Endpoints de reportes
export const REPORTS_ENDPOINTS = {
    GENERATE_PDF: `${API_BASE_URL}/api/reports/generate-pdf`,
    DOWNLOAD_PDF: `${API_BASE_URL}/api/reports/download-pdf`,
} as const;

// Endpoints de control de dispositivos
export const DEVICE_ENDPOINTS = {
    STATUS: `${API_BASE_URL}/api/devices/status`,
    FILE_UPLOADS: `${API_BASE_URL}/api/devices/file-uploads`,
} as const;

// Endpoints de velocidad
export const SPEED_ENDPOINTS = {
    VIOLATIONS: `${API_BASE_URL}/api/speed/violations`,
    CRITICAL_ZONES: `${API_BASE_URL}/api/speed/critical-zones`,
} as const;

// Endpoints de puntos negros
export const HOTSPOT_ENDPOINTS = {
    CRITICAL_POINTS: `${API_BASE_URL}/api/hotspots/critical-points`,
    RANKING: `${API_BASE_URL}/api/hotspots/ranking`,
} as const;

// Endpoints de sesiones
export const SESSION_ENDPOINTS = {
    RANKING: `${API_BASE_URL}/api/sessions/ranking`,
} as const;

// Endpoints de IA
export const AI_ENDPOINTS = {
    EXPLANATIONS: `${API_BASE_URL}/api/ai/explanations`,
    STATS: `${API_BASE_URL}/api/ai/stats`,
    PATTERNS: `${API_BASE_URL}/api/ai/patterns`,
    SUGGESTIONS_VEHICLES: `${API_BASE_URL}/api/ai/suggestions/vehicles`,
    CHAT_MESSAGES: (sessionId: string) => `${API_BASE_URL}/api/ai/chat/sessions/${sessionId}/messages`,
    SUGGESTION_EXPLAIN: (suggestionId: string) => `${API_BASE_URL}/api/ai/suggestions/${suggestionId}/explain`,
} as const;

// Configuración de headers por defecto
export const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
} as const;

// Configuración de timeout
export const API_CONFIG = {
    TIMEOUT: API_TIMEOUT,
    BASE_URL: API_BASE_URL,
} as const;

// Función helper para crear headers con autenticación
export const createAuthHeaders = (token: string) => ({
    ...DEFAULT_HEADERS,
    'Authorization': `Bearer ${token}`,
});

// Función helper para crear headers con organización
export const createOrgHeaders = (token: string, organizationId: string) => ({
    ...DEFAULT_HEADERS,
    'Authorization': `Bearer ${token}`,
    'X-Organization-ID': organizationId,
});

// Configuración de proveedores de mapas
export const MAP_CONFIG = {
    TOMTOM_KEY: process.env.REACT_APP_TOMTOM_API_KEY || 'u8wN3BM4AMzDGGC76lLF14vHblDP37HG',
    RADAR_KEY: process.env.REACT_APP_RADAR_API_KEY || '',
} as const;