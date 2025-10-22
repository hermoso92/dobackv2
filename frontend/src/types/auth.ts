// ✅ Roles del sistema - UNIFICADOS (sincronizado con backend)
export enum UserRole {
  ADMIN = 'ADMIN',      // Acceso total al sistema
  MANAGER = 'MANAGER',  // Admin de parque/organización específica
  OPERATOR = 'OPERATOR',// Usuario operativo (futuro)
  VIEWER = 'VIEWER'     // Solo lectura (futuro)
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;  // ✅ Usar enum consistente
  organizationId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
  company_name?: string;
  organizationId?: string | null;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
}

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user: User;
}
