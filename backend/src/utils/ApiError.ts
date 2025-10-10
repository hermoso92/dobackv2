/**
 * Clase para manejar errores de API
 */
export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message: string) {
        return new ApiError(400, message);
    }

    static unauthorized(message: string) {
        return new ApiError(401, message);
    }

    static forbidden(message: string) {
        return new ApiError(403, message);
    }

    static notFound(message: string) {
        return new ApiError(404, message);
    }

    static conflict(message: string) {
        return new ApiError(409, message);
    }

    static validationError(message: string, code = 'VALIDATION_ERROR'): ApiError {
        return new ApiError(422, message);
    }

    static tooManyRequests(message = 'Too Many Requests', code = 'TOO_MANY_REQUESTS'): ApiError {
        return new ApiError(429, message);
    }

    static internal(message: string) {
        return new ApiError(500, message);
    }

    static notImplemented(message = 'Not Implemented', code = 'NOT_IMPLEMENTED'): ApiError {
        return new ApiError(501, message);
    }

    static serviceUnavailable(
        message = 'Service Unavailable',
        code = 'SERVICE_UNAVAILABLE'
    ): ApiError {
        return new ApiError(503, message);
    }

    toJSON() {
        return {
            success: false,
            error: this.message,
            code: 'INTERNAL_ERROR'
        };
    }
}
