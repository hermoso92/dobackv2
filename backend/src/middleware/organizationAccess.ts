import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        organizationId: string;
        role: string;
    };
}

/**
 * Middleware: Requiere que el usuario tenga organizationId
 */
export function requireOrganizationAccess(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const userOrgId = req.user?.organizationId;

    if (!userOrgId) {
        logger.warn('Acceso denegado: usuario sin organización', {
            userId: req.user?.id,
            path: req.path
        });
        return res.status(403).json({ error: 'Acceso denegado: usuario sin organización' });
    }

    // ✅ Evitar inyección: limpiar query/body y propagar por res.locals
    if ('organizationId' in req.query) delete (req.query as any).organizationId;
    if (req.body && 'organizationId' in req.body) delete (req.body as any).organizationId;

    (res.locals as any).organizationId = userOrgId;

    logger.debug('Acceso validado', {
        userId: req.user.id,
        organizationId: userOrgId,
        path: req.path
    });

    next();
}

/**
 * Middleware: Valida que una geocerca pertenezca a la organización del usuario
 */
export function validateGeofenceAccess(prisma: any) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const geofenceId = req.params.id;
        const userOrgId = req.user?.organizationId;

        if (!userOrgId) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        try {
            const geofence = await prisma.geofence.findUnique({
                where: { id: geofenceId },
                select: { organizationId: true }
            });

            if (!geofence || geofence.organizationId !== userOrgId) {
                logger.warn('Intento de acceso a geocerca de otra organización', {
                    userId: req.user.id,
                    geofenceId,
                    userOrgId,
                    geofenceOrgId: geofence?.organizationId
                });
                return res.status(404).json({ error: 'Geocerca no encontrada' });
            }

            next();
        } catch (error: any) {
            logger.error('Error validando acceso a geocerca:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}



