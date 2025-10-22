import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { config } from './config/env';
import { initializeGeofenceServices } from './config/geofenceServices';
import { prisma } from './lib/prisma';
import { apiLimiter, attackDetector, authLimiter, requestSizeLimiter, securityHeaders, uploadLimiter } from './middleware/security';
import { DatabaseOptimizationService } from './services/DatabaseOptimizationService';
import { realTimeGPSService } from './services/realTimeGPSService';
import { WebSocketService } from './services/WebSocketService';
import { logger } from './utils/logger';

const app = express();
const server = createServer(app);
const webSocketService = new WebSocketService(server);

// Middleware de seguridad
app.use(securityHeaders);
app.use(attackDetector);

// Compresión
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
}));

// CORS
app.use(cors(config.cors));

// Rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api', apiLimiter);

// Límite de tamaño de request
app.use(requestSizeLimiter('50MB'));

// Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging de requests
app.use((req, res, next) => {
    logger.info('Request recibido', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
});

// Rutas
import routes from './routes';
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Backend funcionando correctamente'
    });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Error no manejado', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Inicializar servicio GPS en tiempo real para Bomberos Madrid
app.use((req, res, next) => {
    // Inicializar el servicio GPS si no está activo
    if (!realTimeGPSService.isMonitoring()) {
        logger.info('🚒 Iniciando servicio GPS en tiempo real para Bomberos Madrid');
        realTimeGPSService.startMonitoring();
    }
    next();
});

// Inicializar servicios de geocercas
try {
    initializeGeofenceServices(prisma);
    logger.info('✅ Servicios de geocercas inicializados correctamente');
} catch (error) {
    logger.error('❌ Error inicializando servicios de geocercas:', error);
}

// Inicializar servicio de optimización de base de datos
let dbOptimizationService: DatabaseOptimizationService;
try {
    dbOptimizationService = new DatabaseOptimizationService(prisma, {
        enableIndexing: true,
        enableQueryCaching: true,
        maxQueryTime: 3000,
        enableQueryLogging: true
    });
    logger.info('✅ Servicio de optimización de base de datos inicializado');
} catch (error) {
    logger.error('❌ Error inicializando servicio de optimización de base de datos:', error);
}

// ✅ La conexión de Prisma se maneja en server.ts para asegurar que se conecte antes de iniciar el servidor

// Exportar app, server, prisma y webSocketService
export { app, prisma, server, webSocketService };
export default app;