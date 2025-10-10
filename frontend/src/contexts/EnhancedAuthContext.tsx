import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { AuthResponse, User } from '../types/auth';
import { logger } from '../utils/logger';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const EnhancedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthenticated = Boolean(user);

    const login = async (email: string, password: string): Promise<void> => {
        try {
            setLoading(true);
            const { user: authenticatedUser }: AuthResponse = await authService.login({ email, password });
            setUser(authenticatedUser);
            logger.info('Usuario logueado', { userId: authenticatedUser.id });

            const redirectPath = ((): string => {
                const state = location.state as { from?: string } | null | undefined;
                if (state && typeof state.from === 'string' && state.from.trim().length > 0) {
                    return state.from;
                }
                return '/';
            })();

            navigate(redirectPath, { replace: true });
        } catch (error) {
            logger.error('Error en login', error);
            throw error instanceof Error ? error : new Error('Error en login');
        } finally {
            setLoading(false);
        }
    };

    const logout = async (): Promise<void> => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
            logger.info('Usuario deslogueado');
        } catch (error) {
            logger.error('Error en logout', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async (): Promise<void> => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            logger.error('Error refrescando usuario', error);
            setUser(null);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);

                if (currentUser) {
                    logger.info('Usuario autenticado detectado', { userId: currentUser.id });
                } else {
                    logger.info('No existe sesion activa');
                }
            } catch (error) {
                logger.error('Error verificando autenticacion', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        void checkAuth();
    }, []);

    useEffect(() => {
        const originalFetch = window.fetch;

        window.fetch = async (url: string | URL | Request, init?: RequestInit) => {
            const response = await originalFetch(url, init);

            if (response.status === 401 && typeof url === 'string' && url.includes('/api/')) {
                try {
                    const { user: refreshedUser } = await authService.refreshToken();
                    setUser(refreshedUser);
                    return await originalFetch(url, init);
                } catch (refreshError) {
                    logger.error('Error en refresh automatico', refreshError);
                    setUser(null);
                }
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const { user: refreshedUser } = await authService.refreshToken();
                setUser(refreshedUser);
                logger.debug('Token refrescado automatico');
            } catch (error) {
                logger.error('Error en refresh automatico', error);
                setUser(null);
            }
        }, 10 * 60 * 1000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useEnhancedAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useEnhancedAuth debe usarse dentro de un EnhancedAuthProvider');
    }
    return context;
};

interface ProtectedRouteProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export const EnhancedProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallback = <div>Cargando...</div>
}) => {
    const { isAuthenticated, loading } = useEnhancedAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (loading) {
        return <>{fallback}</>;
    }

    if (!isAuthenticated) {
        if (location.pathname !== '/login') {
            navigate('/login', { replace: true, state: { from: location.pathname } });
        }
        return <div>Redirigiendo al login...</div>;
    }

    return <>{children}</>;
};
