/**
 * Componentes de protección por permisos
 * 
 * Permiten mostrar/ocultar contenido basado en permisos del usuario
 */

import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { UserRole } from '../types/auth';
import { Permission } from '../types/permissions';

// ==================== PERMISSION GUARD ====================

interface PermissionGuardProps {
    /**
     * Permiso requerido para mostrar el contenido
     */
    permission: Permission;

    /**
     * Contenido a mostrar si NO tiene permiso
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si tiene permiso
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido solo si el usuario tiene el permiso
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permission,
    fallback = null,
    children,
}) => {
    const { hasPermission } = usePermissions();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== ANY PERMISSION GUARD ====================

interface AnyPermissionGuardProps {
    /**
     * Lista de permisos (con tener UNO es suficiente)
     */
    permissions: Permission[];

    /**
     * Contenido a mostrar si NO tiene ningún permiso
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si tiene al menos un permiso
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido si el usuario tiene AL MENOS UNO de los permisos
 */
export const AnyPermissionGuard: React.FC<AnyPermissionGuardProps> = ({
    permissions,
    fallback = null,
    children,
}) => {
    const { hasAnyPermission } = usePermissions();

    if (!hasAnyPermission(permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== ALL PERMISSIONS GUARD ====================

interface AllPermissionsGuardProps {
    /**
     * Lista de permisos (debe tener TODOS)
     */
    permissions: Permission[];

    /**
     * Contenido a mostrar si NO tiene todos los permisos
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si tiene todos los permisos
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido solo si el usuario tiene TODOS los permisos
 */
export const AllPermissionsGuard: React.FC<AllPermissionsGuardProps> = ({
    permissions,
    fallback = null,
    children,
}) => {
    const { hasAllPermissions } = usePermissions();

    if (!hasAllPermissions(permissions)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== ROLE GUARD ====================

interface RoleGuardProps {
    /**
     * Roles permitidos para ver el contenido
     */
    roles: UserRole[];

    /**
     * Contenido a mostrar si NO tiene el rol
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si tiene el rol
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido solo si el usuario tiene uno de los roles especificados
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    roles,
    fallback = null,
    children,
}) => {
    const { hasAnyRole } = usePermissions();

    if (!hasAnyRole(roles)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== ADMIN ONLY ====================

interface AdminOnlyProps {
    /**
     * Contenido a mostrar si NO es admin
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si es admin
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido solo para ADMIN
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
    fallback = null,
    children,
}) => {
    const { isAdmin } = usePermissions();

    if (!isAdmin()) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== MANAGER ONLY ====================

interface ManagerOnlyProps {
    /**
     * Contenido a mostrar si NO es manager
     */
    fallback?: ReactNode;

    /**
     * Contenido a mostrar si es manager
     */
    children: ReactNode;
}

/**
 * Componente que muestra contenido solo para MANAGER
 */
export const ManagerOnly: React.FC<ManagerOnlyProps> = ({
    fallback = null,
    children,
}) => {
    const { isManager } = usePermissions();

    if (!isManager()) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

// ==================== UNAUTHORIZED FALLBACK ====================

interface UnauthorizedFallbackProps {
    /**
     * Mensaje personalizado (opcional)
     */
    message?: string;
}

/**
 * Componente fallback por defecto para mostrar cuando no hay permisos
 */
export const UnauthorizedFallback: React.FC<UnauthorizedFallbackProps> = ({
    message = 'No tienes permisos para ver este contenido',
}) => {
    return (
        <div className="flex items-center justify-center p-8">
            <div className="text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Acceso Restringido
                </h3>
                <p className="text-sm text-gray-500">{message}</p>
            </div>
        </div>
    );
};

// ==================== EXPORTS ====================

export default PermissionGuard;

