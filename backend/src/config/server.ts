import cors from 'cors';
import express from 'express';
import passport from 'passport';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error';
import { logger } from '../utils/logger';
import { config } from './env';
import { configurePassport } from './passport';
import { initializeGeofenceServices } from './geofenceServices';

const app = express();

// 🆕 CONFIGURAR PASSPORT ANTES DE IMPORTAR RUTAS
configurePassport();
app.use(passport.initialize());

// ⚡ IMPORTANTE: Inicializar servicios de geocercas ANTES de importar rutas
try {
    initializeGeofenceServices(prisma);
    logger.info('✅ Servicios de geocercas inicializados correctamente');
} catch (error) {
    logger.error('❌ Error inicializando servicios de geocercas:', error);
}

// Importar rutas DESPUÉS de inicializar servicios
import routes from '../routes';

// Configuración de CORS (DEBE IR PRIMERO)
app.use(cors(config.cors));

// Configuración de body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de timeouts
app.use((req, res, next) => {
    req.setTimeout(config.server.timeout);
    res.setTimeout(config.server.timeout);
    next();
});

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    req.headers['x-request-id'] = requestId;

    // Log al inicio de la solicitud
    logger.debug(`Iniciando solicitud ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body,
        query: req.query
    });

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url}`, {
            requestId,
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            duration,
            status: res.statusCode,
            responseBody: res.locals.responseBody
        });
    });
    next();
});

// Rutas de la API
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = req.headers['x-request-id'] || 'unknown';

    // Log detallado del error
    logger.error('Error en la aplicación', {
        requestId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        duration: Date.now() - (req as any).startTime
    });

    // Manejar errores de parsing JSON
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'Error en el formato JSON',
            details: 'El cuerpo de la solicitud debe ser un objeto JSON válido',
            requestId
        });
    }

    // Manejar errores específicos
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            requestId
        });
    }

    // Manejar errores de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Error de validación',
            details: err.message,
            requestId
        });
    }

    // Manejar errores de JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token inválido o expirado',
            requestId
        });
    }

    // Manejar errores de base de datos
    if (err.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            success: false,
            error: 'Error en la base de datos',
            details: err.message,
            requestId
        });
    }

    // Error por defecto
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId,
        message: config.app.env === 'development' ? err.message : undefined,
        stack: config.app.env === 'development' ? err.stack : undefined
    });
});

export { app };
