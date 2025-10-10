import { t } from "./i18n";

// Información de la aplicación
export const APP_NAME = t('doback_soft_v2');
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = t('sistema_de_monitoreo_de_estabilidad_de_vehiculos');

// Configuración del entorno
export const IS_DEVELOPMENT = import.meta.env.MODE === t('development');
export const IS_PRODUCTION = import.meta.env.MODE === t('production');
export const API_URL = import.meta.env.VITE_API_URL || t('httplocalhost9998api');

// Configuración de autenticación
export const AUTH_TOKEN_KEY = t('authtoken');

// Configuración de la interfaz de usuario
export const THEME = {
  PRIMARY_COLOR: '#0ea5e9',
  SECONDARY_COLOR: '#64748b',
  SUCCESS_COLOR: '#22c55e',
  ERROR_COLOR: '#ef4444',
  WARNING_COLOR: '#f59e0b',
  INFO_COLOR: '#3b82f6',
};

// Configuración de la paginación
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Configuración de timeouts y reintentos
export const API_TIMEOUT = 30000; // 30 segundos
export const MAX_RETRIES = 3;

// Configuración de caché
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
export const STALE_TIME = 60 * 1000; // 1 minuto

// Configuración de notificaciones
export const NOTIFICATION_DURATION = 5000; // 5 segundos

// Configuración de validación
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

// Configuración de la aplicación
export const APP_ENV = import.meta.env.MODE || t('development_1');
export const APP_REFRESH_TOKEN_KEY = t('DobackSoftrefreshtoken');
export const APP_REFRESH_TOKEN_EXPIRY = 604800; // 7 días
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Configuración de gráficos
export const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: t('4caf50'),
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
};

// Configuración de notificaciones
export const NOTIFICATION_POSITION = {
  vertical: t('top'),
  horizontal: t('right'),
};

// Configuración de validación
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Configuración de archivos
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [t('imagejpeg'), t('imagepng'), t('applicationpdf')];
export const MAX_FILES_PER_UPLOAD = 5;

// Configuración de monitoreo
export const TELEMETRY_UPDATE_INTERVAL = 1000; // 1 segundo
export const STABILITY_UPDATE_INTERVAL = 5000; // 5 segundos
export const ALERT_UPDATE_INTERVAL = 10000; // 10 segundos

// Configuración de mapas
export const MAP_CENTER = {
  lat: 40.4168,
  lng: -3.7038,
};
export const MAP_ZOOM = 13;
export const MAP_STYLE = t('mapboxstylesmapboxstreets_v11');

// Configuración de temas
export const THEME_MODE_KEY = t('DobackSoftthememode');
export const DEFAULT_THEME_MODE = t('light');
export const THEME_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  background: t('ffffff'),
  paper: '#f5f5f5',
  text: '#000000',
  textSecondary: '#757575',
};

// Configuración de idiomas
export const DEFAULT_LANGUAGE = 'es';
export const AVAILABLE_LANGUAGES = [
  { code: 'es', name: t('espanol') },
  { code: 'en', name: t('english') },
];

// Configuración de roles
export const ROLES = {
  ADMIN: t('admin'),
  USER: t('user'),
};

// Configuración de rutas
export const ROUTES = {
  HOME: '/',
  LOGIN: t('login'),
  REGISTER: t('register'),
  DASHBOARD: t('dashboard'),
  TELEMETRY: t('telemetry'),
  STABILITY: t('stability'),
  ALERTS: t('alerts'),
  ADMIN: t('admin_1'),
  PROFILE: t('profile'),
  SETTINGS: t('settings'),
  NOT_FOUND: '/404',
};

// Configuración de caché
export const CACHE_PREFIX = t('DobackSoft');
export const CACHE_EXPIRY = 3600; // 1 hora

// Configuración de errores
export const ERROR_MESSAGES = {
  NETWORK_ERROR: t('error_de_conexion_por_favor_intente_nuevamente'),
  SERVER_ERROR: t('error_del_servidor_por_favor_intente_mas_tarde'),
  AUTH_ERROR: t('error_de_autenticacion_por_favor_inicie_sesion_nuevamente'),
  VALIDATION_ERROR: t('por_favor_verifique_los_datos_ingresados'),
  UNKNOWN_ERROR: t('ha_ocurrido_un_error_inesperado'),
};

// Configuración de la aplicación
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || t('httplocalhost9998'),
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 2000
  },
  auth: {
    tokenKey: t('authtoken_1'),
    refreshTokenKey: t('refreshtoken'),
    tokenExpiryKey: t('tokenexpiry')
  },
  server: {
    port: import.meta.env.VITE_PORT || 5174,
    host: import.meta.env.VITE_HOST || t('localhost'),
    nodeEnv: import.meta.env.MODE || t('development_2')
  },
  cors: {
    origin: import.meta.env.VITE_FRONTEND_URL || t('httplocalhost5174'),
    credentials: true
  },
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },
  dateFormat: t('yyyy_mm_dd'),
  timeFormat: 'HH:mm:ss',
  dateTimeFormat: t('yyyy_mm_dd_hhmmss'),
}; 