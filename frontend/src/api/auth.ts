import { apiService } from './api';
import { ENDPOINTS } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

class AuthApiService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(ENDPOINTS.LOGIN, credentials);

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'No se pudo iniciar sesion');
    }

    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(ENDPOINTS.REGISTER, data);

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'No se pudo registrar al usuario');
    }

    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post(ENDPOINTS.LOGOUT);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) {
      throw new Error('No hay refresh token disponible');
    }

    const response = await apiService.post<AuthResponse>(ENDPOINTS.REFRESH_TOKEN, {
      refresh_token,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'No se pudo refrescar el token');
    }

    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  private setTokens(access_token: string, refresh_token: string): void {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    apiService.setAuthToken(access_token);
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    apiService.removeAuthToken();
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('access_token'));
  }

  getCurrentUser(): AuthResponse['user'] | null {
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );

      return JSON.parse(jsonPayload).user;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
}

export const authApi = new AuthApiService();