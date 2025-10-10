import { API_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';
import { AuthResponse, LoginCredentials, User } from '../types/auth';

type BackendAuthPayload = {
    success: boolean;
    data?: AuthResponse;
    message?: string;
    error?: string;
};

type BackendLogoutResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

class AuthService {
    private readonly baseURL = API_CONFIG.BASE_URL;

    private unwrapAuthPayload(payload: BackendAuthPayload): AuthResponse {
        if (!payload.success || !payload.data) {
            const reason = payload.error || payload.message || 'Respuesta inválida del servidor';
            throw new Error(reason);
        }
        return payload.data;
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.error || errorData?.message || 'Error de autenticación';
                throw new Error(message);
            }

            const payload: BackendAuthPayload = await response.json();
            const data = this.unwrapAuthPayload(payload);

            logger.info('Login exitoso', {
                userId: data.user.id,
                email: data.user.email,
                organizationId: data.user.organizationId
            });

            return data;
        } catch (error) {
            logger.error('Error en login', error);
            throw error instanceof Error ? error : new Error('Error en login');
        }
    }

    async refreshToken(): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Error refrescando token');
            }

            const payload: BackendAuthPayload = await response.json();
            const data = this.unwrapAuthPayload(payload);

            logger.info('Token refrescado', { userId: data.user.id });

            return data;
        } catch (error) {
            logger.error('Error refrescando token', error);
            throw error instanceof Error ? error : new Error('Error refrescando token');
        }
    }

    async logout(): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const payload: BackendLogoutResponse = await response.json().catch(() => ({ success: false }));
                const message = payload.error || payload.message || 'Error cerrando sesión';
                throw new Error(message);
            }

            logger.info('Logout exitoso');
        } catch (error) {
            logger.error('Error en logout', error);
            // No propagar: el estado local se limpia igual en el llamador
        }
    }

    async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/me`, {
                method: 'GET',
                credentials: 'include'
            });

            if (response.status === 401) {
                return null;
            }

            if (!response.ok) {
                throw new Error('Error obteniendo usuario actual');
            }

            const payload = await response.json() as { success?: boolean; user?: User };
            return payload?.user ?? null;
        } catch (error) {
            logger.error('Error obteniendo usuario actual', error);
            return null;
        }
    }

    async isAuthenticated(): Promise<boolean> {
        const user = await this.getCurrentUser();
        return user !== null;
    }

    async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
        const performRequest = () => fetch(url, {
            ...options,
            credentials: 'include'
        });

        let response = await performRequest();

        if (response.status === 401) {
            try {
                await this.refreshToken();
                response = await performRequest();
            } catch (error) {
                logger.error('Error en refresh automático', error);
                throw error instanceof Error ? error : new Error('Sesión expirada');
            }
        }

        return response;
    }

    async getCSRFToken(): Promise<string | null> {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/csrf`, {
                credentials: 'include'
            });

            if (!response.ok) {
                return null;
            }

            const payload = await response.json() as { csrfToken?: string };
            return payload?.csrfToken ?? null;
        } catch (error) {
            logger.error('Error obteniendo token CSRF', error);
            return null;
        }
    }
}

export const authService = new AuthService();
