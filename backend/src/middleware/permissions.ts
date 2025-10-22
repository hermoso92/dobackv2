import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { AppError } from './error';

interface User {
    id: number;
    role: string;
    organizationId: number;
}

interface AuthRequest extends Request {
    user?: User;
}

// Roles y sus permisos
const rolePermissions = {
    ADMIN: ['*'],
    OPERATOR: [
        'read:vehicles',
        'write:vehicles',
        'read:sessions',
        'write:sessions',
        'read:events',
        'write:events',
        'read:telemetry'
    ],
    USER: ['read:vehicles', 'read:sessions', 'read:events', 'read:telemetry']
};

// Verificar si un rol tiene un permiso específico
const hasPermission = (role: string, permission: string): boolean => {
    const permissions = rolePermissions[role as keyof typeof rolePermissions] || [];
    return permissions.includes('*') || permissions.includes(permission);
};

// Middleware para verificar permisos
export const requirePermission = (permission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;

            if (!user) {
                throw new AppError(401, 'No autenticado');
            }

            if (!hasPermission(user.role, permission)) {
                logger.warn('Intento de acceso no autorizado', {
                    userId: user.id,
                    role: user.role,
                    permission,
                    path: req.path
                });
                throw new AppError(403, 'No autorizado');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware para verificar propiedad de organización
export const requireOrganizationAccess = () => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            const organizationId = parseInt(req.params.organizationId);

            if (!user) {
                throw new AppError(401, 'No autenticado');
            }

            if (user.role !== 'ADMIN' && user.organizationId !== organizationId) {
                logger.warn('Intento de acceso a organización no autorizada', {
                    userId: user.id,
                    userOrganizationId: user.organizationId,
                    requestedOrganizationId: organizationId,
                    path: req.path
                });
                throw new AppError(403, 'No autorizado para acceder a esta organización');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Middleware para verificar propiedad de vehículo
export const requireVehicleAccess = () => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            const vehicleId = parseInt(req.params.vehicleId);

            if (!user) {
                throw new AppError(401, 'No autenticado');
            }

            // Verificar si el vehículo pertenece a la organización del usuario
            const vehicle = await prisma.vehicle.findUnique({
                where: { id: vehicleId }
            });

            if (!vehicle) {
                throw new AppError(404, 'Vehículo no encontrado');
            }

            if (user.role !== 'ADMIN' && user.organizationId !== vehicle.organizationId) {
                logger.warn('Intento de acceso a vehículo no autorizado', {
                    userId: user.id,
                    userOrganizationId: user.organizationId,
                    vehicleOrganizationId: vehicle.organizationId,
                    vehicleId,
                    path: req.path
                });
                throw new AppError(403, 'No autorizado para acceder a este vehículo');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
