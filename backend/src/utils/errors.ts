import { logger } from './logger';

// Clase base para errores personalizados
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Errores específicos de la aplicación
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'No autenticado') {
        super(message, 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'No autorizado') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso no encontrado') {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflicto con el estado actual del recurso') {
        super(message, 409);
    }
}

export class DatabaseError extends AppError {
    constructor(message = 'Error en la base de datos') {
        super(message, 500, false);
    }
}

export class ExternalServiceError extends AppError {
    constructor(message = 'Error en servicio externo') {
        super(message, 502, false);
    }
}

// Función para manejar errores no capturados
export const handleUncaughtError = (error: Error) => {
    logger.error('Error no capturado:', error);
    process.exit(1);
};

// Función para manejar rechazos de promesas no capturados
export const handleUnhandledRejection = (reason: any) => {
    logger.error('Promesa rechazada no manejada:', reason);
    process.exit(1);
};

// Función para manejar errores en Express
export const errorHandler = (error: Error, req: any, res: any, next: any) => {
    if (error instanceof AppError) {
        logger.warn('Error operacional:', {
            statusCode: error.statusCode,
            message: error.message,
            stack: error.stack
        });

        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message
        });
    }

    // Error no operacional (programación o desconocido)
    logger.error('Error no operacional:', {
        error: error.message,
        stack: error.stack
    });

    return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor'
    });
};

// Función para validar y transformar errores de Prisma
export const handlePrismaError = (error: any): AppError => {
    logger.error('Error de Prisma:', error);

    switch (error.code) {
        case 'P2002':
            return new ConflictError('Ya existe un registro con ese valor único');
        case 'P2025':
            return new NotFoundError('Registro no encontrado');
        case 'P2014':
            return new ValidationError('ID inválido');
        case 'P2003':
            return new ValidationError('Referencia inválida');
        default:
            return new DatabaseError('Error en la base de datos');
    }
};

// Función para validar y transformar errores de JWT
export const handleJWTError = (error: any): AppError => {
    logger.error('Error de JWT:', error);

    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Token inválido');
    }

    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Token expirado');
    }

    return new AuthenticationError('Error de autenticación');
};

// Función para validar y transformar errores de validación
export const handleValidationError = (error: any): AppError => {
    logger.error('Error de validación:', error);

    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        return new ValidationError(messages.join(', '));
    }

    return new ValidationError('Error de validación');
};

// Función para validar y transformar errores de bcrypt
export const handleBcryptError = (error: any): AppError => {
    logger.error('Error de bcrypt:', error);
    return new AppError('Error al procesar la contraseña', 500, false);
};

// Función para validar y transformar errores de WebSocket
export const handleWebSocketError = (error: any): AppError => {
    logger.error('Error de WebSocket:', error);
    return new AppError('Error en la conexión WebSocket', 500, false);
};

// Función para validar y transformar errores de telemetría
export const handleTelemetryError = (error: any): AppError => {
    logger.error('Error de telemetría:', error);
    return new AppError('Error al procesar datos de telemetría', 500, false);
};

// Función para validar y transformar errores de alertas
export const handleAlertError = (error: any): AppError => {
    logger.error('Error de alertas:', error);
    return new AppError('Error al procesar alertas', 500, false);
};

// Función para validar y transformar errores de mantenimiento
export const handleMaintenanceError = (error: any): AppError => {
    logger.error('Error de mantenimiento:', error);
    return new AppError('Error al procesar mantenimiento', 500, false);
};
