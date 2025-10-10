/**
 * Middleware para asegurar que las requests incluyan organizationId
 */

import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const organizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Permitir solicitudes OPTIONS sin autenticación (CORS preflight)
        if (req.method === 'OPTIONS') {
            return next();
        }

        // Verificar que el usuario esté autenticado
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        // Verificar que el usuario tenga organizationId
        if (!user.organizationId) {
            logger.warn('Usuario sin organizationId:', { userId: user.id, email: user.email });
            return res.status(400).json({
                success: false,
                error: 'Usuario no tiene organización asignada'
            });
        }

        // Continuar con la request
        next();
    } catch (error) {
        logger.error('Error en organizationMiddleware:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

