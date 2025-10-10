export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public isOperational = true,
        public stack = ''
    ) {
        super(message);
        this.name = 'ApiError';
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message: string): ApiError {
        return new ApiError(400, message);
    }

    static unauthorized(message: string): ApiError {
        return new ApiError(401, message);
    }

    static forbidden(message: string): ApiError {
        return new ApiError(403, message);
    }

    static notFound(message: string): ApiError {
        return new ApiError(404, message);
    }

    static internal(message: string): ApiError {
        return new ApiError(500, message);
    }

    static serviceUnavailable(message: string): ApiError {
        return new ApiError(503, message);
    }
} 