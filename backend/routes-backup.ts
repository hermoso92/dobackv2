import express from 'express';
import { authenticateToken as authMiddleware } from './src/middleware/auth';
import { validateBody } from './src/middleware/validation';
import authRoutes from './src/routes/auth';
import { eventRoutes } from './src/routes/events';
import { stabilityRoutes } from './src/routes/stability';
import testRoutes from './src/routes/test';
import { vehicleRoutes } from './src/routes/vehicles';
import { logger } from './src/utils/logger';

// Este archivo contiene la configuración correcta de rutas
// Puede ser usado como referencia para corregir src/index.ts

export function configureRoutes(app: express.Application) {
    // Rutas públicas
    app.use('/test', testRoutes);
    app.use('/api/auth', authRoutes);

    // Rutas protegidas
    app.use('/api/events', authMiddleware, validateBody, eventRoutes);
    app.use('/api/stability', authMiddleware, validateBody, stabilityRoutes);
    app.use('/api/vehicles', authMiddleware, vehicleRoutes);

    // Endpoint API para prueba directa
    app.get('/api', (req, res) => {
        res.json({
            message: 'API DobackSoft v2',
            status: 'running',
            timestamp: new Date().toISOString()
        });
    });

    // El resto de rutas de API pueden agregarse aquí dependiendo de las necesidades
    logger.info('Rutas API configuradas correctamente');
}
