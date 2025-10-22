/**
 * Middleware de Autorización Mejorado
 * 
 * Proporciona control granular de acceso basado en:
 * - Roles de usuario
 * - Permisos específicos
 * - Organización del usuario
 */

import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../types/domain';
import { Permission, hasAnyPermission, hasPermission } from '../types/permissions';
import { logger } from '../utils/logger';

/**
 * Interface extendida de Request con usuario autenticado
 */
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        organizationId: string;
    };
}

/**
 * Clase de error para manejo de autorizaciones
 */
export class AuthorizationError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 403) {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = statusCode;
    }
}

// ==================== MIDDLEWARE POR ROL ====================

/**
 * Middleware que requiere uno o más roles específicos
 * 
 * @param roles - Array de roles permitidos
 * @example
 * router.get('/admin-only', requireRole([UserRole.ADMIN]), handler);
 */
export const requireRole = (roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                logger.warn('Intento de acceso sin autenticación', {
                    path: req.path,
                    method: req.method
                });
                throw new AuthorizationError('No autenticado', 401);
            }

            // Verificar rol
            if (!roles.includes(req.user.role)) {
                logger.warn('Acceso denegado por rol insuficiente', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredRoles: roles,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                throw new AuthorizationError('No tienes permisos para realizar esta acción');
            }

            logger.debug('Acceso autorizado por rol', {
                userId: req.user.id,
                userRole: req.user.role,
                path: req.path
            });

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    };
};

// ==================== MIDDLEWARE POR PERMISO ====================

/**
 * Middleware que requiere un permiso específico
 * 
 * @param permission - Permiso requerido
 * @example
 * router.post('/vehicles', requirePermission(Permission.VEHICLES_CREATE), handler);
 */
export const requirePermission = (permission: Permission) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                logger.warn('Intento de acceso sin autenticación', {
                    path: req.path,
                    method: req.method
                });
                throw new AuthorizationError('No autenticado', 401);
            }

            // Verificar permiso
            if (!hasPermission(req.user.role, permission)) {
                logger.warn('Acceso denegado por permiso insuficiente', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredPermission: permission,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                throw new AuthorizationError('No tienes permisos para realizar esta acción');
            }

            logger.debug('Acceso autorizado por permiso', {
                userId: req.user.id,
                permission,
                path: req.path
            });

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    };
};

/**
 * Middleware que requiere alguno de los permisos especificados
 * 
 * @param permissions - Array de permisos (con tener uno es suficiente)
 * @example
 * router.get('/data', requireAnyPermission([Permission.VEHICLES_VIEW, Permission.SESSIONS_VIEW]), handler);
 */
export const requireAnyPermission = (permissions: Permission[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                logger.warn('Intento de acceso sin autenticación', {
                    path: req.path,
                    method: req.method
                });
                throw new AuthorizationError('No autenticado', 401);
            }

            // Verificar permisos
            if (!hasAnyPermission(req.user.role, permissions)) {
                logger.warn('Acceso denegado - sin permisos requeridos', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    requiredPermissions: permissions,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                throw new AuthorizationError('No tienes permisos para realizar esta acción');
            }

            logger.debug('Acceso autorizado por permiso (any)', {
                userId: req.user.id,
                path: req.path
            });

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    };
};

// ==================== MIDDLEWARE DE ORGANIZACIÓN ====================

/**
 * Middleware que valida acceso a una organización específica
 * 
 * - ADMIN puede acceder a cualquier organización
 * - MANAGER solo puede acceder a su propia organización
 * 
 * @param organizationIdParam - Nombre del parámetro que contiene el organizationId
 *                             Por defecto: 'organizationId'
 *                             Busca en: params, body, query (en ese orden)
 * @example
 * router.get('/organizations/:organizationId/vehicles', requireOrganizationAccess(), handler);
 */
export const requireOrganizationAccess = (organizationIdParam: string = 'organizationId') => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                logger.warn('Intento de acceso sin autenticación', {
                    path: req.path,
                    method: req.method
                });
                throw new AuthorizationError('No autenticado', 401);
            }

            // ADMIN puede acceder a cualquier organización
            if (req.user.role === UserRole.ADMIN) {
                logger.debug('Acceso a organización autorizado (ADMIN)', {
                    userId: req.user.id,
                    path: req.path
                });
                return next();
            }

            // Obtener organizationId del request (params, body o query)
            const requestedOrgId = req.params[organizationIdParam] ||
                req.body?.[organizationIdParam] ||
                req.query?.[organizationIdParam];

            // Si no se especifica organización en el request, usar la del usuario
            if (!requestedOrgId) {
                logger.debug('No se especificó organizationId, usando la del usuario', {
                    userId: req.user.id,
                    userOrganizationId: req.user.organizationId
                });
                return next();
            }

            // Validar que el usuario accede solo a su organización
            if (requestedOrgId !== req.user.organizationId) {
                logger.warn('Intento de acceso a organización no autorizada', {
                    userId: req.user.id,
                    userRole: req.user.role,
                    userOrganizationId: req.user.organizationId,
                    requestedOrganizationId: requestedOrgId,
                    path: req.path,
                    method: req.method,
                    ip: req.ip
                });
                throw new AuthorizationError('No tienes acceso a esta organización');
            }

            logger.debug('Acceso a organización autorizado', {
                userId: req.user.id,
                organizationId: requestedOrgId,
                path: req.path
            });

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    };
};

/**
 * Middleware que filtra automáticamente queries por organización
 * 
 * - ADMIN: no filtra (ve todo)
 * - MANAGER: añade filtro WHERE organizationId = user.organizationId
 * 
 * Añade req.organizationFilter para usar en queries
 * 
 * @example
 * router.get('/vehicles', applyOrganizationFilter(), (req: AuthRequest, res) => {
 *   const vehicles = await prisma.vehicle.findMany({
 *     where: req.organizationFilter  // Automáticamente filtrado
 *   });
 * });
 */
export const applyOrganizationFilter = () => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Verificar autenticación
            if (!req.user) {
                throw new AuthorizationError('No autenticado', 401);
            }

            // ADMIN: sin filtro (ve todo)
            if (req.user.role === UserRole.ADMIN) {
                (req as any).organizationFilter = {};
                logger.debug('Sin filtro de organización (ADMIN)', {
                    userId: req.user.id
                });
            } else {
                // MANAGER/OPERATOR/VIEWER: filtrar por su organización
                (req as any).organizationFilter = {
                    organizationId: req.user.organizationId
                };
                logger.debug('Filtro de organización aplicado', {
                    userId: req.user.id,
                    organizationId: req.user.organizationId
                });
            }

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.message
                });
            }
            next(error);
        }
    };
};

// ==================== HELPERS ====================

/**
 * Verificar si el usuario puede editar un recurso
 * basado en la organización del recurso
 * 
 * @param userOrganizationId - Organización del usuario
 * @param resourceOrganizationId - Organización del recurso
 * @param userRole - Rol del usuario
 */
export function canAccessResource(
    userOrganizationId: string,
    resourceOrganizationId: string,
    userRole: UserRole
): boolean {
    // ADMIN puede acceder a cualquier recurso
    if (userRole === UserRole.ADMIN) {
        return true;
    }

    // Otros roles solo pueden acceder a recursos de su organización
    return userOrganizationId === resourceOrganizationId;
}

/**
 * Lanzar error si no puede acceder al recurso
 */
export function assertCanAccessResource(
    userOrganizationId: string,
    resourceOrganizationId: string,
    userRole: UserRole
): void {
    if (!canAccessResource(userOrganizationId, resourceOrganizationId, userRole)) {
        throw new AuthorizationError('No tienes acceso a este recurso');
    }
}

