import compression from 'compression';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

interface CompressionConfig {
    level?: number; // Nivel de compresión (0-9)
    threshold?: number; // Tamaño mínimo para comprimir (bytes)
    windowBits?: number; // Tamaño de ventana de compresión
    memLevel?: number; // Nivel de uso de memoria
    strategy?: number; // Estrategia de compresión
}

// Función para determinar si se debe comprimir
const shouldCompress = (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
        return false;
    }

    // No comprimir contenido ya comprimido
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType) {
        if (
            contentType.includes('image/') ||
            contentType.includes('video/') ||
            contentType.includes('audio/') ||
            contentType.includes('application/zip') ||
            contentType.includes('application/x-gzip') ||
            contentType.includes('application/x-rar-compressed') ||
            contentType.includes('application/x-7z-compressed')
        ) {
            return false;
        }
    }

    return compression.filter(req, res);
};

// Middleware de compresión
export const compressionMiddleware = (config?: CompressionConfig) => {
    return compression({
        level: config?.level || 6,
        threshold: config?.threshold || 1024, // 1KB
        windowBits: config?.windowBits || 15,
        memLevel: config?.memLevel || 8,
        strategy: config?.strategy || 0,
        filter: shouldCompress
    });
};

// Middleware para estadísticas de compresión
export const compressionStatsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const originalWrite = res.write;
    const originalEnd = res.end;

    let uncompressedSize = 0;
    let compressedSize = 0;

    // Capturar tamaño sin comprimir
    res.write = function (
        chunk: any,
        encoding?: BufferEncoding,
        callback?: (error?: Error | null) => void
    ): boolean {
        uncompressedSize += chunk.length;
        return originalWrite.call(this, chunk, encoding, callback);
    };

    // Capturar tamaño comprimido y calcular estadísticas
    res.end = function (chunk: any, encoding?: BufferEncoding, callback?: () => void): Response {
        if (chunk) {
            uncompressedSize += chunk.length;
        }

        const contentLength = parseInt(res.getHeader('Content-Length') as string) || 0;
        compressedSize = contentLength;

        // Almacenar estadísticas en la respuesta
        (req as any).compressionStats = {
            uncompressedSize,
            compressedSize,
            ratio: compressedSize > 0 ? (1 - compressedSize / uncompressedSize) * 100 : 0
        };

        logger.debug('Compression stats', {
            path: req.path,
            uncompressedSize,
            compressedSize,
            ratio: (req as any).compressionStats.ratio.toFixed(2) + '%'
        });

        return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
};

// Middleware para deshabilitar compresión
export const noCompressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
    req.headers['x-no-compression'] = 'true';
    next();
};
