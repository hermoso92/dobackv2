import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Error no manejado:', {
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
    });
};
