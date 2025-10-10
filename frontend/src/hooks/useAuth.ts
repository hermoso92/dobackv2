import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

interface AuthVerifyResponse {
    valid: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

interface AuthState {
    isAuthenticated: boolean;
    user: any | null;
    isLoading: boolean;
    isInitialized: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>(() => ({
        isAuthenticated: false,
        user: null,
        isLoading: true,
        isInitialized: false
    }));

    const isVerifying = useRef(false);
    const mounted = useRef(true);
    const verificationTimeout = useRef<NodeJS.Timeout | null>(null);
    const lastVerificationTime = useRef<number>(0);
    const VERIFICATION_COOLDOWN = 30000; // 30 segundos entre verificaciones
    const navigate = useNavigate();

    const verifySession = useCallback(async () => {
        if (!authService.getToken() || isVerifying.current || !mounted.current) {
            return authState.isAuthenticated;
        }

        const now = Date.now();
        if (now - lastVerificationTime.current < VERIFICATION_COOLDOWN) {
            return authState.isAuthenticated;
        }

        try {
            isVerifying.current = true;
            lastVerificationTime.current = now;

            const response = await apiService.get<ApiResponse<AuthVerifyResponse>>('/api/auth/verify');

            if (response.success && mounted.current) {
                const authResponse = response.data as any;
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: authResponse?.valid || false,
                    user: authResponse?.user || null,
                    isLoading: false,
                    isInitialized: true
                }));
                return authResponse?.valid || false;
            } else {
                if (mounted.current) {
                    authService.logout();
                    setAuthState(prev => ({
                        ...prev,
                        isAuthenticated: false,
                        user: null,
                        isLoading: false,
                        isInitialized: true
                    }));
                }
                return false;
            }
        } catch (error) {
            logger.error('Error verificando sesión', { error });
            if (mounted.current) {
                authService.logout();
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    isLoading: false,
                    isInitialized: true
                }));
            }
            return false;
        } finally {
            isVerifying.current = false;
        }
    }, [authState.isAuthenticated]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const response = await apiService.post<ApiResponse<LoginResponse>>('/api/auth/login', { email, password });
            if (response.success && (response.data as any)?.access_token) {
                await authService.login(email, password);
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    user: (response.data as any)?.user,
                    isLoading: false,
                    isInitialized: true
                }));
                navigate('/dashboard');
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error en login', { error });
            return false;
        }
    }, [navigate]);

    const logout = useCallback(() => {
        authService.logout();
        setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            isInitialized: true
        });
    }, []);

    useEffect(() => {
        mounted.current = true;

        const initAuth = async () => {
            if (authService.getToken() && mounted.current && !isVerifying.current) {
                if (verificationTimeout.current) {
                    clearTimeout(verificationTimeout.current);
                }

                verificationTimeout.current = setTimeout(async () => {
                    if (mounted.current) {
                        await verifySession();
                    }
                }, 1000);
            } else if (mounted.current) {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    isInitialized: true
                }));
            }
        };

        initAuth();

        return () => {
            mounted.current = false;
            if (verificationTimeout.current) {
                clearTimeout(verificationTimeout.current);
            }
        };
    }, [verifySession]);

    return {
        ...authState,
        token: authService.getToken(),
        login,
        logout,
        verifySession
    };
}; 