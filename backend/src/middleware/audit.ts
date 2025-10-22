import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

interface AuditLogData {
    userId?: number;
    action: string;
    resource: string;
    resourceId?: number;
    details?: any;
    ip: string;
    userAgent?: string;
}

// Crear registro de auditoría
const createAuditLog = async (data: AuditLogData) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resource: data.resource,
                resourceId: data.resourceId,
                details: data.details,
                ip: data.ip,
                userAgent: data.userAgent,
                timestamp: new Date()
            }
        });
    } catch (error) {
        logger.error('Error creando registro de auditoría', { error, data });
    }
};

// Middleware de auditoría
export const auditMiddleware = (resourceType: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const originalEnd = res.end;

        res.end = async function (...args: any[]) {
            try {
                const auditData: AuditLogData = {
                    userId: user?.id,
                    action: req.method,
                    resource: resourceType,
                    resourceId: parseInt(req.params.id),
                    details: {
                        query: req.query,
                        body: req.method !== 'GET' ? req.body : undefined,
                        status: res.statusCode
                    },
                    ip: req.ip,
                    userAgent: req.get('user-agent')
                };

                await createAuditLog(auditData);
            } catch (error) {
                logger.error('Error en middleware de auditoría', { error });
            }

            originalEnd.apply(res, args);
        };

        next();
    };
};

// Middleware para auditar cambios sensibles
export const auditSensitiveChanges = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        const originalBody = { ...req.body };

        const auditData: AuditLogData = {
            userId: user?.id,
            action: 'SENSITIVE_CHANGE',
            resource: req.path,
            details: {
                before: originalBody,
                after: undefined
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Capturar la respuesta
        const originalSend = res.send;
        res.send = function (body) {
            auditData.details.after = body;
            createAuditLog(auditData);
            return originalSend.call(this, body);
        };

        next();
    };
};

// Middleware para auditar accesos
export const auditAccess = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        const auditData: AuditLogData = {
            userId: user?.id,
            action: 'ACCESS',
            resource: req.path,
            details: {
                method: req.method,
                query: req.query
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        await createAuditLog(auditData);
        next();
    };
};
