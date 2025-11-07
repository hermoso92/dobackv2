import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth';
import { AuthContextType, AuthState, RegisterPayload, UserRole } from '../types/auth';
import { logger } from '../utils/logger';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isInitialized: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    const initialize = () => {
      try {
        // 🆕 Capturar token de Google OAuth si existe en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const oauthToken = urlParams.get('token');

        if (oauthToken) {
          logger.info('🔐 Token de Google OAuth detectado en URL');

          // Guardar token en localStorage con la key correcta
          localStorage.setItem('auth_token', oauthToken);

          // ⚡ IMPORTANTE: También guardar como refresh_token (mismo token)
          // porque authService.isAuthenticated() requiere ambos
          localStorage.setItem('refresh_token', oauthToken);

          // Decodificar JWT para obtener datos del usuario
          try {
            const tokenParts = oauthToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));

              // Guardar usuario en localStorage
              const oauthUser = {
                id: payload.id,
                email: payload.email,
                name: payload.name || payload.email,
                role: payload.role,
                organizationId: payload.organizationId,
              };

              localStorage.setItem('auth_user', JSON.stringify(oauthUser));
              logger.info('✅ Usuario de Google OAuth guardado', { email: oauthUser.email });
            }
          } catch (decodeError) {
            logger.warn('No se pudo decodificar el token, pero se guardó correctamente');
          }

          // Limpiar URL y redirigir
          const cleanUrl = window.location.origin + '/dashboard';
          logger.info('✅ Token y refresh_token guardados, redirigiendo a dashboard...');

          // Recargar completamente para que se re-inicialice todo
          window.location.replace(cleanUrl);
          return; // Detener la ejecución hasta que se recargue
        }

        const user = authService.getCurrentUser();
        const isAuthenticated = authService.isAuthenticated();
        const isInitialized = authService.getInitializationStatus();

        setState((prev) => ({
          ...prev,
          user,
          isAuthenticated,
          isLoading: false,
          isInitialized,
        }));

        logger.info('Estado de autenticacion inicializado', {
          user,
          isAuthenticated,
          isInitialized,
          hadOAuthToken: !!oauthToken,
        });
      } catch (error) {
        logger.error('Error al inicializar autenticacion', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isInitialized: true,
          error: 'Error al inicializar autenticacion',
        }));
      }
    };

    initialize();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      logger.info('Iniciando proceso de login', { email });

      await authService.login(email, password);
      const user = authService.getCurrentUser();
      const isAuthenticated = authService.isAuthenticated();

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated,
        isLoading: false,
      }));

      logger.info('Login exitoso');
    } catch (error) {
      logger.error('Error en login', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error en login',
      }));
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await authService.register(payload);
      const user = authService.getCurrentUser();
      const isAuthenticated = authService.isAuthenticated();

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated,
        isLoading: false,
      }));

      logger.info('Registro completado correctamente');
    } catch (error) {
      logger.error('Error en registro', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al registrar usuario',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }));
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      const user = authService.getCurrentUser();
      const isAuthenticated = authService.isAuthenticated();
      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated,
      }));
    } catch (error) {
      logger.error('Error al refrescar token', error);
      setState((prev) => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Error al refrescar token',
      }));
    }
  };

  const hasRole = (role: UserRole): boolean => authService.hasRole(role);
  const isAdmin = (): boolean => hasRole('ADMIN');

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    hasRole,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
