/**
 * 🔐 MIDDLEWARE: Validación de Organización
 * 
 * Propuesta: ChatGPT Auditoría DobackSoft
 * Criticidad: P0 - SEGURIDAD CRÍTICA
 * 
 * PROBLEMA IDENTIFICADO:
 * Un MANAGER podría acceder a datos de otra organización cambiando
 * el parámetro organizationId en la URL.
 * 
 * SOLUCIÓN:
 * Validar que el usuario solo acceda a su organización,
 * excepto ADMIN que puede ver todas.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware para validar acceso a organización
 * 
 * REGLAS:
 * - ADMIN: Puede acceder a cualquier organización
 * - MANAGER/USER: Solo puede acceder a su propia organización
 * - Si no hay organizationId en query/body, usar la del usuario
 */
export const validateOrganization = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Obtener organizationId del request
        const requestedOrgId = req.query.organizationId as string || 
                              req.body.organizationId as string ||
                              (req as any).orgId;
        
        // Si no hay usuario autenticado, rechazar
        if (!(req as any).user) {
            logger.warn('❌ Intento de acceso sin autenticación', {
                ip: req.ip,
                path: req.path
            });
            return res.status(401).json({ 
                error: 'No autorizado',
                message: 'Debe estar autenticado para acceder a este recurso'
            });
        }

        const user = (req as any).user;
        
        // ADMIN puede ver cualquier organización
        if (user.role === 'ADMIN') {
            (req as any).orgId = requestedOrgId || user.organizationId;
            logger.debug('✅ ADMIN accede a organización', {
                userId: user.id,
                organizationId: (req as any).orgId
            });
            return next();
        }

        // MANAGER/USER solo pueden ver su organización
        const userOrgId = user.organizationId;
        
        // Si no se especificó organizationId, usar la del usuario
        if (!requestedOrgId) {
            (req as any).orgId = userOrgId;
            return next();
        }

        // Si se especificó organizationId diferente, rechazar
        if (requestedOrgId !== userOrgId) {
            logger.warn('🚨 Intento de acceso no autorizado a otra organización', {
                userId: user.id,
                userRole: user.role,
                userOrgId,
                requestedOrgId,
                path: req.path,
                ip: req.ip
            });
            
            return res.status(403).json({ 
                error: 'Acceso denegado',
                message: 'No tiene permisos para acceder a datos de esta organización',
                hint: 'Solo puede acceder a datos de su propia organización'
            });
        }

        // Todo OK, asignar organizationId
        (req as any).orgId = userOrgId;
        
        next();

    } catch (error: any) {
        logger.error('Error en validación de organización', {
            error: error.message,
            path: req.path
        });
        
        return res.status(500).json({ 
            error: 'Error interno',
            message: 'Error validando permisos de organización'
        });
    }
};

/**
 * Variante estricta: Siempre requiere organizationId explícito
 */
export const requireOrganizationId = (req: Request, res: Response, next: NextFunction) => {
    const organizationId = req.query.organizationId as string || 
                          req.body.organizationId as string;
    
    if (!organizationId) {
        return res.status(400).json({ 
            error: 'organizationId requerido',
            message: 'Debe especificar el parámetro organizationId'
        });
    }
    
    // Ejecutar validación normal
    validateOrganization(req, res, next);
};

