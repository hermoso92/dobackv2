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

// Configuración completa de la API
export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUTS: {
        REQUEST: API_TIMEOUT,
        AUTH: 10000, // 10 segundos para autenticación
        UPLOAD: 300000, // 5 minutos para uploads
    },
    RETRY: {
        DELAY: 1000, // 1 segundo entre reintentos
        MAX_ATTEMPTS: 3,
    },
    HEADERS: {
        'Content-Type': 'application/json',
    },
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
    GOOGLE_MAPS_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
} as const;

// Configuración de Google Maps APIs
export const GOOGLE_MAPS_CONFIG = {
    API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    
    // Endpoints de Google Maps APIs
    ROUTES_API: 'https://routes.googleapis.com/directions/v2:computeRoutes',
    ROADS_API: 'https://roads.googleapis.com/v1/snapToRoads',
    GEOCODING_API: 'https://maps.googleapis.com/maps/api/geocode/json',
    REVERSE_GEOCODING_API: 'https://maps.googleapis.com/maps/api/geocode/json',
    ELEVATION_API: 'https://maps.googleapis.com/maps/api/elevation/json',
    PLACES_API: 'https://places.googleapis.com/v1/places',
    PLACES_NEARBY_API: 'https://places.googleapis.com/v1/places:searchNearby',
    DISTANCE_MATRIX_API: 'https://maps.googleapis.com/maps/api/distancematrix/json',
    
    // Configuraciones por defecto
    LANGUAGE: 'es',
    REGION: 'ES',
    
    // Límites de rate limiting (requests por segundo)
    RATE_LIMITS: {
        GEOCODING: 50,  // 50 req/s
        ROUTES: 100,    // 100 req/s
        ROADS: 200,     // 200 req/s
        ELEVATION: 100, // 100 req/s
        PLACES: 100,    // 100 req/s
    },
    
    // Cache TTL (en milisegundos)
    CACHE_TTL: {
        GEOCODING: 7 * 24 * 60 * 60 * 1000,  // 7 días
        ROUTES: 24 * 60 * 60 * 1000,          // 1 día
        ROADS: 24 * 60 * 60 * 1000,           // 1 día
        ELEVATION: 30 * 24 * 60 * 60 * 1000,  // 30 días (datos estáticos)
        PLACES: 7 * 24 * 60 * 60 * 1000,      // 7 días
    },
} as const;