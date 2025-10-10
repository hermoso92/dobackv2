import { NextFunction, Request, Response } from 'express';
import { ApiError } from './ApiError';
import { logger } from './logger';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncRequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await fn(req, res, next);
            if (result && !res.headersSent) {
                res.json(result);
            }
        } catch (error) {
            logger.error('Error in async handler', { error });
            if (error instanceof ApiError) {
                res.status(error.statusCode).json(error.toJSON());
            } else {
                next(error);
            }
        }
    };
};
