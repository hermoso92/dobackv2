import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

// Extender la interfaz Request para incluir orgId
declare global {
    namespace Express {
        interface Request {
            orgId?: string;
        }
    }
}

/**
 * Middleware para extraer y adjuntar organizationId del JWT al request
 * Compatible con el sistema de autenticación existente
 */
export const attachOrg = (req: Request, res: Response, next: NextFunction) => {
    try {
        // El middleware de autenticación ya estableció req.user
        const user = (req as any).user;

        if (!user) {
            logger.warn('attachOrg: Usuario no encontrado en request');
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        // Extraer organizationId del usuario autenticado
        const orgId = user.organizationId;

        if (!orgId) {
            logger.warn('attachOrg: OrganizationId no encontrado en usuario', {
                userId: user.id,
                email: user.email
            });
            return res.status(403).json({
                success: false,
                error: 'Organización no encontrada en el token'
            });
        }

        // Adjuntar orgId al request para uso en controladores
        req.orgId = orgId;

        logger.debug('attachOrg: OrganizationId adjuntado', {
            userId: user.id,
            orgId
        });

        next();
    } catch (error) {
        logger.error('attachOrg: Error procesando organización', { error });
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};
