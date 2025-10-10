import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Límite general de peticiones
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 peticiones por ventana
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde',
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            error: 'Demasiadas peticiones desde esta IP, por favor intente más tarde'
        });
    }
});

// Límite para autenticación
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: process.env.NODE_ENV === 'development' ? 1000 : 5, // 1000 intentos en desarrollo, 5 en producción
    message: {
        error: 'Too many login attempts, please try again later.'
    },
    handler: (req, res, next, options) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Límite para API
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por ventana
    message: {
        error: 'Too many requests, please try again later.'
    },
    handler: (req, res, next, options) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // límite de 60 peticiones por minuto
    message: {
        error: 'Too many webhook requests, please try again later.'
    },
    handler: (req, res, next, options) => {
        logger.warn('Webhook rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false
});
