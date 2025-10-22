import express from 'express';
import helmet from 'helmet';
import { app, prisma, server, webSocketService } from './app';
import { expressLogger, logger } from './config/logger';
import { initializeCronJobs } from './cron';
import { corsErrorHandler, corsMiddleware, ensureCorsHeaders } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';

const PORT = process.env.PORT || 9998;

// ✅ Función asíncrona para iniciar el servidor después de conectar Prisma
async function startServer() {
    try {
        logger.info('🔌 Conectando Prisma Client...');

        // ✅ CRÍTICO: Esperar a que Prisma se conecte ANTES de aceptar peticiones
        await prisma.$connect();

        logger.info('✅ Prisma Client conectado y listo para recibir peticiones');

        // ✅ Inicializar cron jobs (alertas diarias y reportes programados)
        initializeCronJobs();

        // Iniciar servidor HTTP (que incluye WebSocket)
        server.listen(PORT, () => {
            logger.info(`🚀 Servidor iniciado en 0.0.0.0:${PORT}`);
            logger.info(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🌐 URL: http://0.0.0.0:${PORT}`);
            logger.info(`💚 Health: http://0.0.0.0:${PORT}/health`);
        });
    } catch (error: any) {
        logger.error('❌ Error crítico iniciando servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();

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
