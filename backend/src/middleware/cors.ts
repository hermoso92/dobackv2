import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Configuración del middleware CORS
const allowedOrigins = ['http://localhost:5174', 'http://31.97.54.148:5174'];
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: config.cors.methods,
    allowedHeaders: config.cors.allowedHeaders,
    credentials: true,
    exposedHeaders: config.cors.exposedHeaders,
    preflightContinue: false,
    optionsSuccessStatus: 204
});

// Middleware para asegurar que los headers CORS se envían correctamente
export const ensureCorsHeaders = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', config.cors.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.cors.allowedHeaders.join(', '));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', config.cors.exposedHeaders.join(', '));

    // Manejar solicitudes OPTIONS
    if (req.method === 'OPTIONS') {
        logger.debug('Manejando solicitud OPTIONS', {
            path: req.path,
            headers: req.headers,
            origin: req.headers.origin
        });
        return res.status(204).end();
    }

    next();
};

// Manejador de errores CORS
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'CORSError') {
        logger.error('Error CORS', {
            error: err,
            origin: req.headers.origin,
            method: req.method,
            path: req.path
        });
        return res.status(403).json({
            success: false,
            error: 'No permitido por CORS'
        });
    }
    next(err);
};
