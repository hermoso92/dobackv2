import express from 'express';
import helmet from 'helmet';
import { app, prisma, server, webSocketService } from './app';
import { expressLogger, logger } from './config/logger';
import { corsErrorHandler, corsMiddleware, ensureCorsHeaders } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';

const PORT = process.env.PORT || 9998;

// Iniciar servidor HTTP (que incluye WebSocket)
server.listen(PORT, () => {
    logger.info(`Servidor HTTP iniciado en el puerto ${PORT}`);
    logger.info('Servicios de geocercas iniciados:');
    logger.info('  - WebSocket: /ws/geofence');
    logger.info('  - Motor de reglas: activo');
});

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
    logger.info('SIGTERM recibido. Cerrando servidor...');
    await prisma.$disconnect();
    webSocketService.close();
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT recibido. Cerrando servidor...');
    await prisma.$disconnect();
    webSocketService.close();
    server.close(() => {
        logger.info('Servidor cerrado');
        process.exit(0);
    });
});

// Middleware básico
app.use(helmet());
app.use(
    express.json({
        limit: '10mb',
        strict: false,
        verify: (req: any, res, buf) => {
            (req as any).rawBody = buf;
        }
    })
);
app.use(
    express.urlencoded({
        extended: true,
        limit: '10mb',
        verify: (req: any, res, buf) => {
            (req as any).rawBody = buf;
        }
    })
);
app.use(expressLogger);
app.use(rateLimiter);

// Middleware para logging del cuerpo de la solicitud
app.use((req, res, next) => {
    if (['POST', 'PUT'].includes(req.method)) {
        logger.debug('Request body:', {
            method: req.method,
            path: req.path,
            body: req.body,
            contentType: req.headers['content-type'],
            rawBody: (req as any).rawBody ? (req as any).rawBody.toString() : null
        });
    }
    next();
});

// Configuración CORS
app.use(corsMiddleware);
app.use(ensureCorsHeaders);

// Las rutas ya están configuradas en app.ts a través de allRoutes

// Manejador de errores
app.use(corsErrorHandler);
app.use(errorHandler);
