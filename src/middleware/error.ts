import { logger } from '../utils/logger';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(message: string, statusCode: number = 500, details?: any) {
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
    if ((error as any).name === 'ZodError') {
        logger.warn('Error de validación', {
            errors: (error as any).errors,
            path: req.path,
            method: req.method
        });

        return res.status(400).json({
            error: 'Error de validación',
            details: (error as any).errors
        });
    }

    next(error);
};

// Middleware para errores de base de datos (dummy, solo logging)
export const databaseErrorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Error de base de datos', {
        error: error.message,
        path: req.path,
        method: req.method
    });
    return res.status(500).json({
        error: 'Error de base de datos',
        details: error.message
    });
};

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
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