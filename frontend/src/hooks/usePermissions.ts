/**
 * Hook personalizado para gestión de permisos
 * 
 * Proporciona funciones para verificar permisos del usuario actual
 * basado en su rol.
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';
import { Permission, getRolePermissions, hasAllPermissions, hasAnyPermission, hasPermission } from '../types/permissions';

export interface UsePermissionsReturn {
    /**
     * Verificar si el usuario tiene un permiso específico
     */
    hasPermission: (permission: Permission) => boolean;

    /**
     * Verificar si el usuario tiene alguno de los permisos especificados
     */
    hasAnyPermission: (permissions: Permission[]) => boolean;

    /**
     * Verificar si el usuario tiene todos los permisos especificados
     */
    hasAllPermissions: (permissions: Permission[]) => boolean;

    /**
     * Obtener todos los permisos del usuario actual
     */
    getUserPermissions: () => Permission[];

    /**
     * Verificar si el usuario tiene un rol específico
     */
    hasRole: (role: UserRole) => boolean;

    /**
     * Verificar si el usuario tiene alguno de los roles especificados
     */
    hasAnyRole: (roles: UserRole[]) => boolean;

    /**
     * Verificar si el usuario es ADMIN
     */
    isAdmin: () => boolean;

    /**
     * Verificar si el usuario es MANAGER
     */
    isManager: () => boolean;

    /**
     * Verificar si el usuario puede acceder a datos de cualquier organización
     */
    canAccessAllOrganizations: () => boolean;

    /**
     * Verificar si el usuario puede gestionar su organización
     */
    canManageOwnOrganization: () => boolean;
}

/**
 * Hook usePermissions
 */
export const usePermissions = (): UsePermissionsReturn => {
    const { user, isAdmin: isAdminFromAuth } = useAuth();

    // Memoizar el rol del usuario
    const userRole = useMemo(() => {
        return user?.role as UserRole;
    }, [user?.role]);

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    const checkPermission = useCallback((permission: Permission): boolean => {
        if (!user || !userRole) {
            return false;
        }
        return hasPermission(userRole, permission);
    }, [user, userRole]);

    /**
     * Verificar si el usuario tiene alguno de los permisos
     */
    const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
        if (!user || !userRole) {
            return false;
        }
        return hasAnyPermission(userRole, permissions);
    }, [user, userRole]);

    /**
     * Verificar si el usuario tiene todos los permisos
     */
    const checkAllPermissions = useCallback((permissions: Permission[]): boolean => {
        if (!user || !userRole) {
            return false;
        }
        return hasAllPermissions(userRole, permissions);
    }, [user, userRole]);

    /**
     * Obtener todos los permisos del usuario
     */
    const getUserPermissions = useCallback((): Permission[] => {
        if (!user || !userRole) {
            return [];
        }
        return getRolePermissions(userRole);
    }, [user, userRole]);

    /**
     * Verificar si el usuario tiene un rol específico
     */
    const checkRole = useCallback((role: UserRole): boolean => {
        if (!user || !userRole) {
            return false;
        }
        return userRole === role;
    }, [user, userRole]);

    /**
     * Verificar si el usuario tiene alguno de los roles
     */
    const checkAnyRole = useCallback((roles: UserRole[]): boolean => {
        if (!user || !userRole) {
            return false;
        }
        return roles.includes(userRole);
    }, [user, userRole]);

    /**
     * Verificar si es ADMIN
     */
    const isAdmin = useCallback((): boolean => {
        return isAdminFromAuth();
    }, [isAdminFromAuth]);

    /**
     * Verificar si es MANAGER
     */
    const isManager = useCallback((): boolean => {
        return checkRole(UserRole.MANAGER);
    }, [checkRole]);

    /**
     * Verificar si puede acceder a todas las organizaciones
     */
    const canAccessAllOrganizations = useCallback((): boolean => {
        return checkPermission(Permission.VEHICLES_VIEW_ALL_ORGS);
    }, [checkPermission]);

    /**
     * Verificar si puede gestionar su organización
     */
    const canManageOwnOrganization = useCallback((): boolean => {
        return checkAnyRole([UserRole.ADMIN, UserRole.MANAGER]);
    }, [checkAnyRole]);

    return {
        hasPermission: checkPermission,
        hasAnyPermission: checkAnyPermission,
        hasAllPermissions: checkAllPermissions,
        getUserPermissions,
        hasRole: checkRole,
        hasAnyRole: checkAnyRole,
        isAdmin,
        isManager,
        canAccessAllOrganizations,
        canManageOwnOrganization,
    };
};

