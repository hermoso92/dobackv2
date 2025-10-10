import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { AppError } from './error';

// Esquemas de validación
export const userSchema = z.object({
    email: z.string().email(),
    name: z.string().min(3),
    role: z.nativeEnum(UserRole),
    organizationId: z.string()
});

// Middleware de validación
export const validateRequest = (schema: z.ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            logger.debug('Validando solicitud', {
                method: req.method,
                path: req.path,
                body: req.body,
                contentType: req.headers['content-type']
            });

            if (!req.body || Object.keys(req.body).length === 0) {
                logger.warn('Cuerpo de la solicitud vacío', {
                    method: req.method,
                    path: req.path,
                    contentType: req.headers['content-type']
                });
                throw new AppError('El cuerpo de la solicitud está vacío', 400);
            }

            const validatedData = await schema.parseAsync(req.body);
            req.body = validatedData;

            logger.debug('Validación exitosa', {
                method: req.method,
                path: req.path,
                validatedData
            });

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                logger.warn('Error de validación', {
                    method: req.method,
                    path: req.path,
                    errors: error.errors,
                    body: req.body
                });
                res.status(400).json({
                    success: false,
                    error: 'Error de validación',
                    details: error.errors
                });
            } else {
                next(error);
            }
        }
    };
}; 