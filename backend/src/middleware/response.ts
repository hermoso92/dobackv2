import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

interface ResponseConfig {
    transform?: boolean;
    pagination?: boolean;
    metadata?: boolean;
    cache?: boolean;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface ResponseMetadata {
    timestamp: string;
    path: string;
    method: string;
    duration: number;
    cache?: {
        hit: boolean;
        key: string;
    };
}

// Transformar respuesta
const transformResponse = (data: any, pagination?: PaginationData, metadata?: ResponseMetadata) => {
    const response: any = {
        success: true,
        data
    };

    if (pagination) {
        response.pagination = pagination;
    }

    if (metadata) {
        response.metadata = metadata;
    }

    return response;
};

// Middleware para transformar respuestas
export const responseMiddleware = (config: ResponseConfig = {}) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const startTime = Date.now();

        // Capturar métodos originales
        const originalJson = res.json;
        const originalSend = res.send;

        // Sobreescribir método json
        res.json = function (body: any): Response {
            if (config.transform) {
                const metadata: ResponseMetadata = {
                    timestamp: new Date().toISOString(),
                    path: req.path,
                    method: req.method,
                    duration: Date.now() - startTime
                };

                if (config.cache && (req as any).cache) {
                    metadata.cache = {
                        hit: true,
                        key: (req as any).cache.key
                    };
                }

                let pagination: PaginationData | undefined;
                if (config.pagination && Array.isArray(body)) {
                    const page = parseInt(req.query.page as string) || 1;
                    const limit = parseInt(req.query.limit as string) || 10;
                    const total = body.length;
                    const pages = Math.ceil(total / limit);

                    pagination = { page, limit, total, pages };
                    body = body.slice((page - 1) * limit, page * limit);
                }

                body = transformResponse(body, pagination, config.metadata ? metadata : undefined);
            }

            return originalJson.call(this, body);
        };

        // Sobreescribir método send
        res.send = function (body: any): Response {
            if (typeof body === 'object') {
                return res.json(body);
            }
            return originalSend.call(this, body);
        };

        next();
    };
};

// Middleware para respuestas de error
export const errorResponseMiddleware = (config: ResponseConfig = {}) => {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
        const metadata: ResponseMetadata = {
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            duration: Date.now() - (req as any).startTime
        };

        const response = {
            success: false,
            error: {
                message: error.message,
                code: (error as any).statusCode || 500,
                type: error.name
            }
        };

        if (config.metadata) {
            (response as any).metadata = metadata;
        }

        if (process.env.NODE_ENV === 'development') {
            (response as any).error.stack = error.stack;
        }

        res.status((error as any).statusCode || 500).json(response);
    };
};

// Middleware para respuestas de éxito
export const successResponseMiddleware = (message: string) => {
    return (req: Request, res: Response) => {
        res.json({
            success: true,
            message
        });
    };
};

// Middleware para respuestas de redirección
export const redirectResponseMiddleware = (url: string, statusCode = 302) => {
    return (req: Request, res: Response) => {
        res.redirect(statusCode, url);
    };
};

// Middleware para respuestas de archivo
export const fileResponseMiddleware = (config: ResponseConfig = {}) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalDownload = res.download;
        const originalSendFile = res.sendFile;

        res.download = function (path: string, filename?: string): void {
            const startTime = Date.now();

            originalDownload.call(this, path, filename, (error: Error) => {
                if (error) {
                    return next(error);
                }

                if (config.metadata) {
                    logger.info('Archivo descargado', {
                        path,
                        filename,
                        duration: Date.now() - startTime
                    });
                }
            });
        };

        res.sendFile = function (path: string): void {
            const startTime = Date.now();

            originalSendFile.call(this, path, (error: Error) => {
                if (error) {
                    return next(error);
                }

                if (config.metadata) {
                    logger.info('Archivo enviado', {
                        path,
                        duration: Date.now() - startTime
                    });
                }
            });
        };

        next();
    };
};
