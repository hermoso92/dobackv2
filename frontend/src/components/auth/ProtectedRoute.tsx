import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';
import { t } from "../../i18n";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    logger.debug('ProtectedRoute - Estado actual:', {
      isAuthenticated,
      user,
      isLoading,
      currentPath: location.pathname,
      requireAdmin
    });
  }, [isAuthenticated, user, isLoading, location.pathname, requireAdmin]);

  // Si está cargando, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        {t('cargando_3')}</div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    logger.debug('ProtectedRoute - No autenticado, redirigiendo a login desde:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requiere admin y no es admin, redirigir a dashboard
  if (requireAdmin && user?.role !== 'ADMIN') {
    logger.debug('ProtectedRoute - Usuario no es admin, redirigiendo a dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Si está autenticado y cumple los requisitos, mostrar el contenido
  logger.debug('ProtectedRoute - Acceso permitido a:', location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute; 