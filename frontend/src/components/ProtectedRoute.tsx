import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { t } from '../i18n';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isInitialized } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (!isInitialized || isLoading) {
            logger.info('Esperando inicializacion', { isInitialized, isLoading });
            return;
        }

        if (!isAuthenticated && !isVerifying) {
            setIsVerifying(true);
            logger.info('Redirigiendo a login desde ruta protegida');
        }
    }, [isAuthenticated, isLoading, isInitialized, isVerifying]);

    if (!isInitialized || isLoading) {
        return <div>{t('cargando_2')}</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
