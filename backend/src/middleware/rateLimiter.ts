import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Configuración del rate limiter
const rateLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 5 * 60 * 1000, // 1 minuto en desarrollo, 5 en producción
    max: process.env.NODE_ENV === 'development' ? 100 : 5, // 100 intentos en desarrollo, 5 en producción
    standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
    handler: (req, res, next, options) => {
        const retryAfter = Math.ceil(options.windowMs / 1000);
        const environment = process.env.NODE_ENV || 'development';

        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            retryAfter,
            environment,
            max: options.max
        });

        // Establecer headers
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', options.max?.toString() || '5');
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000 + retryAfter).toString());

        // Enviar respuesta
        res.status(options.statusCode).json({
            error: 'Too many login attempts, please try again later.',
            retryAfter,
            environment,
            max: options.max,
            resetTime: Math.floor(Date.now() / 1000 + retryAfter)
        });
    }
});

export default rateLimiter;
