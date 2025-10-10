// 🚀 CONFIGURACIÓN CENTRALIZADA - DOBACK SOFT
// Este archivo centraliza todos los valores que estaban hardcodeados en el dashboard

// Extender el tipo ImportMeta para incluir env
declare global {
    interface ImportMetaEnv {
        readonly VITE_API_URL?: string;
        readonly VITE_LOG_LEVEL?: string;
        readonly NODE_ENV: 'development' | 'production' | 'test';
    }
}

// ============================================================================
// 🌍 CONFIGURACIÓN GEOGRÁFICA
// ============================================================================

export const GEO_CONFIG = {
    // Coordenadas por defecto (Madrid, España)
    DEFAULT_CENTER: {
        latitude: 40.4168,
        longitude: -3.7038
    } as const,

    // Variación para ubicaciones por defecto de vehículos
    DEFAULT_LOCATION_VARIATION: 0.005,

    // Configuración de geocodificación
    GEOCODING: {
        TIMEOUT: 5000, // 5 segundos
        RATE_LIMIT_DELAY: 2000, // 0-2 segundos aleatorio
        USER_AGENT: 'DobackSoft/1.0'
    }
} as const;

// ============================================================================
// 🚗 CONFIGURACIÓN DE VEHÍCULOS
// ============================================================================

export const VEHICLE_CONFIG = {
    // Umbral de tiempo para considerar vehículo "en línea" (30 minutos)
    ONLINE_THRESHOLD: 30 * 60 * 1000, // 30 minutos en milisegundos

    // Configuración de RPM
    RPM: {
        ROTATIVO_THRESHOLD: 500, // RPM mínimo para considerar motor rotativo
        FILTER_OPTIONS: [1500, 2000, 2500] as const
    },

    // Configuración de velocidad
    SPEED: {
        FILTER_OPTIONS: [40, 60, 80, 100, 120, 140] as const,
        UNIT: 'km/h'
    }
} as const;

// ============================================================================
// 📊 CONFIGURACIÓN DE DATOS Y RENDIMIENTO
// ============================================================================

export const DATA_CONFIG = {
    // Límite máximo de puntos para downsampling
    MAX_POINTS: 10000,

    // Configuración de caché
    CACHE: {
        DURATION: 5 * 60 * 1000, // 5 minutos
        CLEANUP_INTERVAL: 60 * 1000 // 1 minuto
    },

    // Configuración de Web Workers
    WORKER: {
        TIMEOUT: 30000, // 30 segundos
        MAX_RETRIES: 3
    }
} as const;

// ============================================================================
// 🎨 CONFIGURACIÓN DE UI/UX
// ============================================================================

export const UI_CONFIG = {
    // Configuración de notificaciones
    NOTIFICATIONS: {
        DEFAULT_DURATION: 5000, // 5 segundos
        ERROR_DURATION: 6000, // 6 segundos para errores
        SUCCESS_DURATION: 3000 // 3 segundos para éxito
    },

    // Configuración de loading
    LOADING: {
        SPINNER_SIZE: 24,
        DEBOUNCE_DELAY: 300
    },

    // Configuración de mapas
    MAP: {
        DEFAULT_ZOOM: 13,
        CLUSTER: {
            MIN_SIZE: 30,
            MAX_SIZE: 50,
            SIZE_INCREMENT: 2
        }
    },

    // Configuración de responsive
    BREAKPOINTS: {
        MOBILE: 600,
        TABLET: 960,
        DESKTOP: 1200
    }
} as const;

// ============================================================================
// 🔧 CONFIGURACIÓN DE API Y RED
// ============================================================================

export const API_CONFIG = {
    // URLs base (se pueden configurar via environment variables)
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:9998', // Backend principal

    // Configuración de timeouts
    TIMEOUTS: {
        REQUEST: 180000, // 3 minutos para KPIs con 241 sesiones
        AUTH: 10000, // 10 segundos para operaciones de autenticación
        UPLOAD: 120000, // 2 minutos para subidas de archivos grandes
        REFRESH_TOKEN: 5000, // 5 segundos
        GEOCODING: 5000 // 5 segundos
    },

    // Configuración de retry
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000, // 1 segundo
        BACKOFF_MULTIPLIER: 2
    },

    // Configuración de caché
    CACHE: {
        STALE_TIME: 30000, // 30 segundos
        REFETCH_ON_WINDOW_FOCUS: false
    }
} as const;

// ============================================================================
// 🎯 CONFIGURACIÓN DE EVENTOS
// ============================================================================

export const EVENT_CONFIG = {
    // Tipos de eventos disponibles
    TYPES: [
        'riesgo_de_vuelco',
        'vuelco_inminente',
        'deriva_lateral_significativa',
        'deriva_peligrosa',
        'maniobra_brusca',
        'curva_estable',
        'cambio_de_carga',
        'zona_inestable',
        'pendiente_lateral',
        'curva_brusca',
        'terreno_irregular',
        'perdida_adherencia',
        'sin_causa_clara',
        'limite_superado_velocidad'
    ] as const,

    // Colores por tipo de evento
    COLORS: {
        riesgo_de_vuelco: '#E53935', // rojo
        vuelco_inminente: '#FF0000', // rojo intenso
        deriva_lateral_significativa: '#FFA000', // naranja
        deriva_peligrosa: '#FF5722', // rojo-naranja
        maniobra_brusca: '#FFD700', // dorado
        curva_estable: '#4CAF50', // verde
        cambio_de_carga: '#FF9800', // naranja
        zona_inestable: '#FF00FF', // magenta
        pendiente_lateral: '#FFA500', // naranja
        curva_brusca: '#FFD700', // dorado
        terreno_irregular: '#800080', // púrpura
        perdida_adherencia: '#FF5722', // rojo-naranja
        sin_causa_clara: '#9E9E9E', // gris
        limite_superado_velocidad: '#F44336', // rojo
        default: '#000000' // negro
    } as const,

    // Configuración de estabilidad
    STABILITY: {
        CRITICAL_THRESHOLD: 0.8,
        DANGER_THRESHOLD: 0.6,
        MODERATE_THRESHOLD: 0.4
    }
} as const;

// ============================================================================
// 📱 CONFIGURACIÓN DE PERSISTENCIA
// ============================================================================

export const STORAGE_CONFIG = {
    // Claves de localStorage
    KEYS: {
        SHOW_CLUSTERS: 'ds_showClusters',
        SPEED_FILTER: 'ds_speedFilter',
        RPM_FILTER: 'ds_rpmFilter',
        ROTATIVO_ONLY: 'ds_rotativoOnly',
        SELECTED_TYPES: 'ds_selectedTypes'
    } as const,

    // Configuración de validación
    VALIDATION: {
        MAX_STRING_LENGTH: 1000,
        MAX_ARRAY_LENGTH: 100
    }
} as const;

// ============================================================================
// 🔍 CONFIGURACIÓN DE MONITOREO
// ============================================================================

export const MONITORING_CONFIG = {
    // Configuración de logging
    LOGGING: {
        LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
        ENABLE_CONSOLE: import.meta.env.NODE_ENV === 'development'
    },

    // Configuración de métricas
    METRICS: {
        ENABLE_PERFORMANCE: true,
        SAMPLE_RATE: 0.1 // 10% de las sesiones
    }
} as const;

// ============================================================================
// 🚨 CONFIGURACIÓN DE ERROR HANDLING
// ============================================================================

export const ERROR_CONFIG = {
    // Configuración de Error Boundary
    ERROR_BOUNDARY: {
        SHOW_STACK_TRACE: import.meta.env.NODE_ENV === 'development',
        AUTO_HIDE_DURATION: 6000
    },

    // Configuración de fallbacks
    FALLBACKS: {
        VEHICLE_NAME: 'Vehículo',
        VEHICLE_PLATE: 'Sin matrícula',
        ADDRESS: 'Dirección no disponible'
    }
} as const;

// ============================================================================
// 📄 CONFIGURACIÓN DE REPORTES
// ============================================================================

export const REPORT_CONFIG = {
    // Configuración de reportes PDF
    PDF: {
        MAX_SIZE_MB: 50,
        EXPIRATION_DAYS: 180,
        COMPRESSION_QUALITY: 0.8
    },

    // Configuración de descarga
    DOWNLOAD: {
        TIMEOUT: 30000, // 30 segundos
        CHUNK_SIZE: 1024 * 1024 // 1MB
    }
} as const;

// ============================================================================
// 🎨 CONFIGURACIÓN DE TEMA
// ============================================================================

export const THEME_CONFIG = {
    // Colores del sistema
    COLORS: {
        PRIMARY: '#1976d2',
        SECONDARY: '#dc004e',
        SUCCESS: '#4caf50',
        WARNING: '#ff9800',
        ERROR: '#f44336',
        INFO: '#2196f3'
    },

    // Configuración de transiciones
    TRANSITIONS: {
        DURATION: 300,
        EASING: 'ease-in-out'
    }
} as const;

// ============================================================================
// 🚩 CONFIGURACIÓN DE FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
    DASHBOARD_KPIS: true,
    ADVANCED_TELEMETRY: true,
    GEOFENCES: true,
    AI_ANALYSIS: true,
    ADVANCED_REPORTS: true,
    OBSERVABILITY: true,
    FLEET_MANAGEMENT: true,
    SMART_PROCESSING: true,
    KNOWLEDGE_BASE: true,
    STABILITY_COMPARISON: true,
    EXECUTIVE_KPIS: true,
    ADVANCED_ANALYTICS: true
} as const;

// ============================================================================
// 🔧 UTILIDADES DE CONFIGURACIÓN
// ============================================================================

export const CONFIG_UTILS = {
    // Obtener configuración basada en environment
    getEnvironmentConfig() {
        return {
            isDevelopment: import.meta.env.NODE_ENV === 'development',
            isProduction: import.meta.env.NODE_ENV === 'production',
            isTest: import.meta.env.NODE_ENV === 'test'
        };
    },

    // Validar configuración
    validateConfig() {
        const errors: string[] = [];

        if (!API_CONFIG.BASE_URL) {
            errors.push('API_BASE_URL no está configurado');
        }

        if (DATA_CONFIG.MAX_POINTS <= 0) {
            errors.push('MAX_POINTS debe ser mayor que 0');
        }

        if (VEHICLE_CONFIG.ONLINE_THRESHOLD <= 0) {
            errors.push('ONLINE_THRESHOLD debe ser mayor que 0');
        }

        return errors;
    }
} as const;

// ============================================================================
// 📋 EXPORTACIÓN DE TIPOS
// ============================================================================

export type SpeedFilter = typeof VEHICLE_CONFIG.SPEED.FILTER_OPTIONS[number] | 'all';
export type RpmFilter = typeof VEHICLE_CONFIG.RPM.FILTER_OPTIONS[number] | 'all';
export type EventType = typeof EVENT_CONFIG.TYPES[number];

// ============================================================================
// 🚀 EXPORTACIÓN PRINCIPAL
// ============================================================================

export default {
    GEO_CONFIG,
    VEHICLE_CONFIG,
    DATA_CONFIG,
    UI_CONFIG,
    API_CONFIG,
    EVENT_CONFIG,
    STORAGE_CONFIG,
    MONITORING_CONFIG,
    ERROR_CONFIG,
    REPORT_CONFIG,
    THEME_CONFIG,
    FEATURE_FLAGS,
    CONFIG_UTILS
}; 