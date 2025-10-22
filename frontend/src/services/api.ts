import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '../config/constants.js';
import { ApiResponse } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { authService } from './auth.js';

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
}

const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: API_CONFIG.TIMEOUTS.REQUEST,
    withCredentials: true
});

class ApiService {
    private api: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value?: unknown) => void;
        reject: (reason?: any) => void;
        config: AxiosRequestConfig;
    }> = [];
    private requestCount = 0;
    private lastLogTime = 0;
    private readonly LOG_INTERVAL = 5000;
    private authToken: string | null = null;

    constructor() {
        this.api = api;
        this.setupInterceptors();
    }

    private shouldLog(): boolean {
        const now = Date.now();
        if (now - this.lastLogTime > this.LOG_INTERVAL) {
            this.lastLogTime = now;
            return true;
        }
        return false;
    }

    private setupInterceptors() {
        this.api.interceptors.request.use(
            async (config: ExtendedAxiosRequestConfig) => {
                this.requestCount += 1;

                if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
                    if (config.headers) {
                        delete config.headers.Authorization;
                    }
                    // Usar timeout específico para autenticación
                    config.timeout = API_CONFIG.TIMEOUTS.AUTH;
                    if (this.shouldLog()) {
                        logger.info('Request configurada para auth', {
                            url: config.url,
                            method: config.method,
                            timeout: config.timeout
                        });
                    }
                    return config;
                }

                const token = this.authToken ?? authService.getToken();
                if (token) {
                    this.authToken = token;
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${token}`
                    };
                    if (this.shouldLog()) {
                        logger.info('Request configurada con token', {
                            url: config.url,
                            method: config.method,
                            requestCount: this.requestCount
                        });
                    }
                } else if (this.shouldLog()) {
                    logger.warn('Request sin token', {
                        url: config.url,
                        method: config.method
                    });
                }

                config.retry = config.retry ?? 0;
                config.retryDelay = config.retryDelay ?? API_CONFIG.RETRY.DELAY;

                return config;
            },
            (error) => {
                logger.error('Error en interceptor de request', error);
                return Promise.reject(error);
            }
        );

        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                if (this.shouldLog()) {
                    logger.info('Respuesta del servidor', {
                        url: response.config.url,
                        status: response.status,
                        requestCount: this.requestCount
                    });
                }
                return response;
            },
            async (error: AxiosError) => {
                const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;

                if (!originalRequest) {
                    logger.error('Error sin configuracion de request', error);
                    return Promise.reject(error);
                }

                if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
                    if (this.shouldLog()) {
                        logger.info('Error en request de auth', {
                            url: originalRequest.url,
                            status: error.response?.status
                        });
                    }
                    return Promise.reject(error);
                }

                if (error.response?.status === 401 && !this.isRefreshing) {
                    logger.info('Iniciando refresh de token');
                    this.isRefreshing = true;

                    try {
                        await authService.refreshToken();
                        const token = this.authToken ?? authService.getToken();

                        if (token) {
                            logger.info('Token refrescado');
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                            } else {
                                originalRequest.headers = { Authorization: `Bearer ${token}` };
                            }
                            this.setAuthToken(token);
                            this.processQueue(null, token);
                            return this.api(originalRequest);
                        }

                        logger.error('Token no disponible despues de refresh');
                        this.processQueue(new Error('No hay token disponible'), null);
                        return Promise.reject(error);
                    } catch (refreshError) {
                        logger.error('Error refrescando token', refreshError);
                        this.processQueue(refreshError instanceof Error ? refreshError : new Error('Error al refrescar token'), null);
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                if (this.shouldLog() || (error.response?.status && error.response.status >= 500)) {
                    logger.error('Error en respuesta del servidor', {
                        url: originalRequest.url,
                        status: error.response?.status,
                        message: error.message,
                        requestCount: this.requestCount
                    });
                }

                return Promise.reject(error);
            }
        );
    }

    private processQueue(error: Error | null, token: string | null) {
        logger.info('Procesando cola de peticiones', {
            queueSize: this.failedQueue.length,
            hasError: Boolean(error),
            hasToken: Boolean(token)
        });

        this.failedQueue.forEach((prom) => {
            if (error) {
                prom.reject(error);
                return;
            }

            if (prom.config.headers) {
                prom.config.headers.Authorization = `Bearer ${token}`;
                prom.resolve(this.api(prom.config));
            } else {
                prom.reject(new Error('Headers invalidos en request reintentado'));
            }
        });

        this.failedQueue = [];
    }

    setAuthToken(token: string | null): void {

        if (token) {

            this.authToken = token;

        } else {

            this.authToken = null;

        }

    }



    removeAuthToken(): void {

        this.authToken = null;

    }



    getAuthToken(): string | null {

        return this.authToken ?? authService.getToken();

    }



    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.api.get<ApiResponse<T>>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.api.post<ApiResponse<T>>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.api.put<ApiResponse<T>>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.api.delete<ApiResponse<T>>(url, config);
        if (response.status === 204) {
            return {
                success: true,
                data: {} as T
            };
        }
        return response.data;
    }

    // Métodos específicos para reportes (puerto 9998)
    async getReports<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const reportsApi = axios.create({
            baseURL: API_CONFIG.BASE_URL, // usar configuración centralizada en lugar de hardcodear
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: API_CONFIG.TIMEOUTS.REQUEST,
            withCredentials: true
        });

        // Añadir token de autorización
        const token = this.getAuthToken();
        if (token) {
            config = config || {};
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await reportsApi.get<ApiResponse<T>>(url, config);
        return response.data;
    }

    async postReports<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const reportsApi = axios.create({
            baseURL: API_CONFIG.BASE_URL, // usar configuración centralizada en lugar de hardcodear
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: API_CONFIG.TIMEOUTS.REQUEST,
            withCredentials: true
        });

        // Añadir token de autorización
        const token = this.getAuthToken();
        if (token) {
            config = config || {};
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        const response = await reportsApi.post<ApiResponse<T>>(url, data, config);
        return response.data;
    }
}

export const apiService = new ApiService();

export const get = apiService.get.bind(apiService);
export const post = apiService.post.bind(apiService);
export const put = apiService.put.bind(apiService);
export const del = apiService.delete.bind(apiService);
export const getReports = apiService.getReports.bind(apiService);
export const postReports = apiService.postReports.bind(apiService);

export { api };

