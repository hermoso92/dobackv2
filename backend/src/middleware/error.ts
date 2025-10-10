import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(message: string, statusCode = 500, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}

interface ErrorResponse {
    error: string;
    details?: any;
    stack?: string;
}

// Middleware para capturar errores no manejados
export const unhandledErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error no manejado', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });

    const response: ErrorResponse = {
        error: 'Error interno del servidor'
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(500).json(response);
};

// Middleware para errores de la aplicación
export const appErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof AppError) {
        logger.warn('Error de aplicación', {
            statusCode: error.statusCode,
            message: error.message,
            details: error.details,
            path: req.path,
            method: req.method
        });

        const response: ErrorResponse = {
            error: error.message
        };

        if (error.details) {
            response.details = error.details;
        }

        return res.status(error.statusCode).json(response);
    }

    next(error);
};

// Middleware para errores de validación
export const validationErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof ZodError) {
        logger.warn('Error de validación', {
            errors: error.errors,
            path: req.path,
            method: req.method
        });

        return res.status(400).json({
            error: 'Error de validación',
            details: error.errors
        });
    }

    next(error);
};

// Middleware para errores de base de datos
export const databaseErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logger.error('Error de base de datos', {
            code: error.code,
            meta: error.meta,
            path: req.path,
            method: req.method
        });

        let statusCode = 500;
        let message = 'Error de base de datos';

        switch (error.code) {
            case 'P2002':
                statusCode = 409;
                message = 'El registro ya existe';
                break;
            case 'P2014':
                statusCode = 404;
                message = 'Registro no encontrado';
                break;
            case 'P2003':
                statusCode = 400;
                message = 'Violación de restricción de clave foránea';
                break;
        }

        return res.status(statusCode).json({
            error: message,
            details: error.meta
        });
    }

    next(error);
};

// Middleware para errores de autenticación
export const authErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.name === 'UnauthorizedError') {
        logger.warn('Error de autenticación', {
            message: error.message,
            path: req.path,
            method: req.method
        });

        return res.status(401).json({
            error: 'No autorizado',
            details: error.message
        });
    }

    next(error);
};

// Middleware para errores de permisos
export const permissionErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.name === 'ForbiddenError') {
        logger.warn('Error de permisos', {
            message: error.message,
            path: req.path,
            method: req.method,
            user: (req as any).user?.id
        });

        return res.status(403).json({
            error: 'Acceso denegado',
            details: error.message
        });
    }

    next(error);
};

// Middleware para errores de límite de peticiones
export const rateLimitErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.name === 'RateLimitError') {
        logger.warn('Error de límite de peticiones', {
            message: error.message,
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        return res.status(429).json({
            error: 'Demasiadas peticiones',
            details: error.message
        });
    }

    next(error);
};

// Middleware para errores de archivos
export const fileErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.name === 'MulterError') {
        logger.warn('Error de archivo', {
            message: error.message,
            path: req.path,
            method: req.method
        });

        return res.status(400).json({
            error: 'Error procesando archivo',
            details: error.message
        });
    }

    next(error);
};

// Middleware para errores de timeout
export const timeoutErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error.name === 'TimeoutError') {
        logger.warn('Error de timeout', {
            message: error.message,
            path: req.path,
            method: req.method
        });

        return res.status(408).json({
            error: 'Tiempo de espera agotado',
            details: error.message
        });
    }

    next(error);
};

// Middleware para errores de sintaxis JSON
export const jsonSyntaxErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // body-parser lanza SyntaxError cuando el cuerpo no es JSON válido
    if (error instanceof SyntaxError && 'body' in error) {
        logger.warn('JSON inválido recibido', {
            message: error.message,
            path: req.path,
            method: req.method,
            body: (req as any).body
        });

        return res.status(400).json({
            error: 'JSON inválido',
            details: error.message
        });
    }

    next(error);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error en la aplicación', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            details: err.details
        });
    }

    return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
};
