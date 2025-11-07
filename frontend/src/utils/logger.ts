import axios from 'axios';
import { logger } from '../utils/logger';

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;

const IGNORED_PATHS = [
    '/api/auth/verify',
    '/api/health',
    '/api/metrics'
];

const IGNORED_MESSAGES = [
    'Token agregado a la petición',
    'Respuesta recibida',
    'Resultado de verificación de token',
    'Token configurado en API Service',
    'Token configurado',
    'Sesión configurada',
    'Obteniendo token',
    'Verificando token',
    'Evaluando redirección',
    'Ya hay una redirección en curso'
];

export const logger = {
    debug: (message: string, data?: any) => {
        if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG && !IGNORED_MESSAGES.includes(message)) {
            logger.debug(`[DEBUG] ${message}`, data || '');
        }
    },
    info: (message: string, data?: any) => {
        if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO && !IGNORED_MESSAGES.includes(message)) {
            console.log(`[INFO] ${message}`, data || '');
        }
    },
    warn: (message: string, data?: any) => {
        if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN && !IGNORED_MESSAGES.includes(message)) {
            console.warn(`[WARN] ${message}`, data || '');
        }
    },
    error: (message: string, data?: any) => {
        if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR && !IGNORED_MESSAGES.includes(message)) {
            console.error(`[ERROR] ${message}`, data || '');
        }
    }
};

// Middleware de logging para Axios
export const setupAxiosLogging = () => {
    const requestLogging = axios.interceptors.request.use(
        config => {
            if (!config.url || IGNORED_PATHS.some(path => config.url?.includes(path))) {
                return config;
            }

            logger.debug('API Request', {
                method: config.method,
                url: config.url
            });
            return config;
        },
        error => {
            logger.error('API Request Error', error);
            return Promise.reject(error);
        }
    );

    const responseLogging = axios.interceptors.response.use(
        response => {
            if (!response.config.url || IGNORED_PATHS.some(path => response.config.url?.includes(path))) {
                return response;
            }

            logger.debug('API Response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        },
        error => {
            if (!error.config?.url || IGNORED_PATHS.some(path => error.config.url?.includes(path))) {
                return Promise.reject(error);
            }

            logger.error('API Response Error', {
                status: error.response?.status,
                url: error.config.url,
                message: error.message
            });
            return Promise.reject(error);
        }
    );

    return () => {
        axios.interceptors.request.eject(requestLogging);
        axios.interceptors.response.eject(responseLogging);
    };
};

