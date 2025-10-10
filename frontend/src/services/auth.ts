import { AuthResponse, BackendResponse, RegisterPayload, User, UserRole } from '../types/auth';
import { logger } from '../utils/logger';
import { apiService, post } from './api';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private currentUser: User | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        this.currentUser = JSON.parse(userStr) as User;
      }

      const token = this.getToken();
      if (token) {
        apiService.setAuthToken(token);
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('Error al inicializar AuthService', error);
      this.clearAuth();
    }
  }

  private setUser(user: User) {
    this.currentUser = user;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser = null;
    apiService.removeAuthToken();
    this.isInitialized = true;
  }

  private buildRegisterPayload(payload: RegisterPayload) {
    const baseName =
      payload.name ??
      payload.companyName ??
      payload.company_name ??
      (payload.email.includes('@') ? payload.email.split('@')[0] : payload.email);

    const body: Record<string, unknown> = {
      email: payload.email,
      password: payload.password,
      name: baseName,
    };

    const company = payload.company_name ?? payload.companyName;
    if (company) {
      body.company_name = company;
    }

    if (payload.organizationId) {
      body.organizationId = payload.organizationId;
    }

    if (payload.role) {
      body.role = payload.role;
    }

    return body;
  }

  private persistSession(tokens: { access: string; refresh: string }, user: User) {
    this.setToken(tokens.access);
    this.setRefreshToken(tokens.refresh);
    this.setUser(user);
    apiService.setAuthToken(tokens.access);
    this.isInitialized = true;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    logger.info('Iniciando login', { email });
    try {
      const response = await post<any>('/api/auth/login', {
        email,
        password,
      });

      // Soportar ambos formatos: directo o con wrapper {success, data}
      let loginData: LoginResponse;
      if (response.access_token) {
        // Formato directo del backend
        loginData = response;
      } else if (response.data && response.data.access_token) {
        // Formato con wrapper
        loginData = response.data;
      } else {
        throw new Error(response.error || 'Error en la respuesta del servidor');
      }

      const { access_token, refresh_token, user } = loginData;
      if (!access_token || !refresh_token) {
        throw new Error('Tokens no recibidos del servidor');
      }

      this.persistSession({ access: access_token, refresh: refresh_token }, user);

      logger.info('Autenticacion establecida', {
        hasAccessToken: true,
        hasRefreshToken: true,
      });

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
      };
    } catch (error) {
      logger.error('Error en login', error);
      this.clearAuth();
      throw error instanceof Error ? error : new Error('Error en login');
    }
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    logger.info('Iniciando registro de usuario', { email: payload.email });
    try {
      const requestBody = this.buildRegisterPayload(payload);
      const response = await post<BackendResponse<LoginResponse>>('/api/auth/register', requestBody);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error en la respuesta del servidor');
      }

      const { access_token, refresh_token, user } = response.data;
      if (!access_token || !refresh_token) {
        throw new Error('Tokens no recibidos del servidor');
      }

      this.persistSession({ access: access_token, refresh: refresh_token }, user);

      logger.info('Usuario registrado y autenticado correctamente');

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
      };
    } catch (error) {
      logger.error('Error en registro', error);
      this.clearAuth();
      throw error instanceof Error ? error : new Error('Error en registro');
    }
  }

  async logout(): Promise<void> {
    try {
      await post('/api/auth/logout');
    } catch (error) {
      logger.warn('Error cerrando sesion en el backend', error);
    } finally {
      this.clearAuth();
      logger.info('Autenticacion limpiada');
    }
  }

  async refreshToken(): Promise<void> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
          logger.warn('No hay refresh token disponible');
          this.clearAuth();
          throw new Error('No hay refresh token');
        }

        const response = await post<BackendResponse<RefreshResponse>>('/api/auth/refresh-token', {
          refresh_token: refreshToken,
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Error al refrescar token');
        }

        const { access_token, refresh_token, user } = response.data;
        if (!access_token || !refresh_token) {
          throw new Error('Tokens no recibidos al refrescar');
        }

        this.persistSession({ access: access_token, refresh: refresh_token }, user);
        this.currentUser = user;

        logger.info('Token refrescado correctamente');
      } catch (error) {
        logger.error('Error al refrescar token', error);
        this.clearAuth();
        throw error instanceof Error ? error : new Error('Error al refrescar token');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async verifyToken(): Promise<{ success: boolean; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No hay token disponible' };
      }

      const response = await post<BackendResponse<{ valid: boolean }>>('/api/auth/verify', {});

      if (response.success && response.data?.valid) {
        return { success: true };
      }

      return { success: false, message: 'Token invalido' };
    } catch (error) {
      logger.error('Error verificando token', error);
      return { success: false, message: 'Error al verificar token' };
    }
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    logger.debug('Obteniendo token', { hasToken: !!token });
    return token;
  }

  private setToken(token: string): void {
    if (!token) {
      logger.error('Intento de guardar token vacio');
      return;
    }
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    logger.debug('Obteniendo refresh token', { hasToken: !!token });
    return token;
  }

  private setRefreshToken(token: string): void {
    if (!token) {
      logger.error('Intento de guardar refresh token vacio');
      return;
    }
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr) as User;
        } catch (error) {
          logger.error('Error al parsear usuario almacenado', error);
          this.clearAuth();
        }
      }
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getRefreshToken());
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }
}

export const authService = new AuthService();
